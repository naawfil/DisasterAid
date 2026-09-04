import BaseRepository from './BaseRepository.js';
import Task from '../models/Task.js';

class TaskRepository extends BaseRepository {
  constructor() {
    super(Task);
  }

  listWithRelations({ status, assignedTo, limit = 100 } = {}) {
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;

    return this.model
      .find(filter)
      .populate('assignedTo', 'name phone')
      .populate('relatedRequest', 'trackingCode address priority')
      .populate('relatedShelter', 'name')
      .sort({ status: 1, dueAt: 1, createdAt: -1 })
      .limit(limit);
  }

  countOpenForRequest(requestId) {
    return this.model.countDocuments({
      relatedRequest: requestId,
      status: { $in: ['PENDING', 'IN_PROGRESS'] },
    });
  }

  /** Is this task assigned to this volunteer? Used to gate request visibility. */
  isAssignedTo(requestId, volunteerId) {
    return this.model.exists({ relatedRequest: requestId, assignedTo: volunteerId });
  }

  /** Every request id this volunteer has a task against — their view of the queue. */
  requestIdsForVolunteer(volunteerId) {
    return this.model.distinct('relatedRequest', { assignedTo: volunteerId, relatedRequest: { $ne: null } });
  }
}

export default new TaskRepository();
