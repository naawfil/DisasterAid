import taskRepository from '../repositories/TaskRepository.js';
import volunteerRepository from '../repositories/VolunteerRepository.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';
import volunteerService from './VolunteerService.js';
import requestService from './RequestService.js';
import { TASK_STATUS, REQUEST_STATUS } from '../constants/enums.js';
import { ROLES } from '../constants/roles.js';

class TaskService {
  async create(payload, actor) {
    if (payload.assignedTo) await volunteerService.ensureVolunteer(payload.assignedTo, { requireAvailable: true });

    const task = await taskRepository.create({
      ...payload,
      assignedBy: actor._id,
      status: payload.assignedTo ? TASK_STATUS.PENDING : TASK_STATUS.PENDING,
    });

    if (payload.assignedTo) {
      await volunteerRepository.bumpActive(payload.assignedTo, 1);
    }

    // Assigning work against a request moves it out of the pending queue.
    if (payload.relatedRequest && payload.assignedTo) {
      await requestService
        .changeStatus(payload.relatedRequest, REQUEST_STATUS.ASSIGNED, actor, `Task: ${task.title}`)
        .catch(() => {});
    }

    await auditService.record({
      actor,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: task._id,
      summary: `Task "${task.title}" created`,
    });

    return task.toJSON();
  }

  async list(query, actor) {
    // Volunteers only ever see their own work. Everyone else sees the whole
    // board by default — except this same endpoint also backs "My tasks",
    // which has to mean the current account's own work even for a manager or
    // admin who also holds a volunteer profile (they can be assigned tasks
    // too), so an explicit `mine` flag forces that scoping regardless of role.
    const assignedTo =
      actor.role === ROLES.VOLUNTEER || query.mine === 'true' ? actor._id : query.assignedTo;
    const tasks = await taskRepository.listWithRelations({ status: query.status, assignedTo });
    return { tasks: tasks.map((t) => t.toJSON()) };
  }

  async assign(taskId, volunteerId, actor) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    if ([TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED].includes(task.status)) {
      throw new ApiError(409, `This task is already ${task.status.toLowerCase()} and can't be reassigned`);
    }

    await volunteerService.ensureVolunteer(volunteerId, { requireAvailable: true });

    if (task.assignedTo) await volunteerRepository.bumpActive(task.assignedTo, -1);
    await volunteerRepository.bumpActive(volunteerId, 1);

    const updated = await taskRepository.updateById(taskId, { assignedTo: volunteerId, assignedBy: actor._id });

    if (updated.relatedRequest) {
      await requestService
        .changeStatus(updated.relatedRequest, REQUEST_STATUS.ASSIGNED, actor, `Task: ${updated.title}`)
        .catch(() => {});
    }

    await auditService.record({
      actor,
      action: 'TASK_ASSIGNED',
      entityType: 'Task',
      entityId: taskId,
      summary: `Task "${updated.title}" assigned`,
    });

    return updated.toJSON();
  }

  async updateStatus(taskId, status, actor) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    if (actor.role === ROLES.VOLUNTEER && String(task.assignedTo) !== String(actor._id)) {
      throw new ApiError(403, 'That task is assigned to someone else');
    }

    // No-op if nothing is actually changing — in particular this stops a
    // double click on "Mark complete" from decrementing activeTaskCount (and
    // incrementing completedTaskCount) twice for the same task.
    if (task.status === status) return task.toJSON();

    const TERMINAL = [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED];
    const wasActive = task.assignedTo && !TERMINAL.includes(task.status);
    const willBeActive = task.assignedTo && !TERMINAL.includes(status);

    const changes = { status };
    if (status === TASK_STATUS.COMPLETED) changes.completedAt = new Date();

    const updated = await taskRepository.updateById(taskId, changes);

    // A volunteer's active-load count moves exactly once, on the transition
    // across the active/terminal boundary — never twice for the same task,
    // and it also corrects itself if a cancelled task is ever reopened.
    if (wasActive && !willBeActive) {
      if (status === TASK_STATUS.COMPLETED) await volunteerRepository.bumpCompleted(task.assignedTo);
      else await volunteerRepository.bumpActive(task.assignedTo, -1);
    } else if (!wasActive && willBeActive) {
      await volunteerRepository.bumpActive(task.assignedTo, 1);
    }

    // Last open task on a request means the aid actually arrived.
    if (status === TASK_STATUS.COMPLETED && task.assignedTo && updated.relatedRequest) {
      const stillOpen = await taskRepository.countOpenForRequest(updated.relatedRequest);
      if (stillOpen === 0) {
        await requestService
          .changeStatus(updated.relatedRequest, REQUEST_STATUS.DELIVERED, actor, 'All tasks completed')
          .catch(() => {});
      }
    }

    await auditService.record({
      actor,
      action: 'TASK_STATUS_CHANGED',
      entityType: 'Task',
      entityId: taskId,
      summary: `Task "${updated.title}" marked ${status}`,
    });

    return updated.toJSON();
  }

  async remove(taskId, actor) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    const TERMINAL = [TASK_STATUS.COMPLETED, TASK_STATUS.CANCELLED];
    if (task.assignedTo && !TERMINAL.includes(task.status)) {
      await volunteerRepository.bumpActive(task.assignedTo, -1);
    }

    await taskRepository.deleteById(taskId);

    await auditService.record({
      actor,
      action: 'TASK_DELETED',
      entityType: 'Task',
      entityId: taskId,
      summary: `Task "${task.title}" deleted`,
    });

    return { removed: true };
  }

  /** Feature 15 — ticking a line on the field checklist. */
  async toggleChecklistItem(taskId, index, done, actor) {
    const task = await taskRepository.findById(taskId);
    if (!task) throw new ApiError(404, 'Task not found');

    if (actor.role === ROLES.VOLUNTEER && String(task.assignedTo) !== String(actor._id)) {
      throw new ApiError(403, 'That task is assigned to someone else');
    }

    if (!task.checklist[index]) throw new ApiError(400, 'That checklist line does not exist');

    task.checklist[index].done = done;
    if (task.status === TASK_STATUS.PENDING) task.status = TASK_STATUS.IN_PROGRESS;
    await task.save();

    return task.toJSON();
  }
}

export default new TaskService();
