import aidRequestRepository from '../repositories/AidRequestRepository.js';
import taskRepository from '../repositories/TaskRepository.js';
import ApiError from '../utils/ApiError.js';
import { generateTrackingCode } from '../utils/trackingCode.js';
import { REQUEST_STATUS, PRIORITY } from '../constants/enums.js';
import { ROLES } from '../constants/roles.js';
import subject from './observers/RequestStatusSubject.js';
import auditService from './AuditService.js';

/** Which transitions are legal. Anything not listed is rejected. */
const ALLOWED_TRANSITIONS = {
  [REQUEST_STATUS.PENDING]: [REQUEST_STATUS.ASSIGNED, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.ASSIGNED]: [REQUEST_STATUS.DISPATCHED, REQUEST_STATUS.PENDING, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.DISPATCHED]: [REQUEST_STATUS.DELIVERED, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.DELIVERED]: [],
  [REQUEST_STATUS.CANCELLED]: [],
};

class RequestService {
  async submit(payload, actor = null) {
    const { latitude, longitude, ...rest } = payload;
    const hasCoords = latitude !== undefined && latitude !== null && longitude !== undefined && longitude !== null;

    const request = await aidRequestRepository.create({
      ...rest,
      requester: actor?._id ?? null,
      trackingCode: generateTrackingCode(),
      // Coordinates are optional — a typed address alone is also acceptable (see validators).
      ...(hasCoords ? { location: { type: 'Point', coordinates: [Number(longitude), Number(latitude)] } } : {}),
      statusHistory: [{ status: REQUEST_STATUS.PENDING, changedBy: actor?._id ?? null, note: 'Submitted' }],
    });

    await auditService.record({
      actor,
      action: 'REQUEST_CREATED',
      entityType: 'AidRequest',
      entityId: request._id,
      summary: `Request ${request.trackingCode} submitted by ${request.requesterName}`,
    });

    return request.toJSON();
  }

  async track(code) {
    const request = await aidRequestRepository.findByTrackingCode(code);
    if (!request) throw new ApiError(404, 'No request found with that tracking code');

    // Public endpoint — return only what a victim needs to see about their own case.
    return {
      trackingCode: request.trackingCode,
      status: request.status,
      priority: request.priority,
      items: request.items,
      address: request.address,
      createdAt: request.createdAt,
      statusHistory: request.statusHistory.map(({ status, changedAt, note, fromRequester }) => ({
        status,
        changedAt,
        note,
        fromRequester,
      })),
    };
  }

  /** Self-service cancel from the public tracking page — proof of ownership is the code itself. */
  async cancelByCode(code, reason = '') {
    const request = await aidRequestRepository.findByTrackingCode(code);
    if (!request) throw new ApiError(404, 'No request found with that tracking code');

    if ([REQUEST_STATUS.DELIVERED, REQUEST_STATUS.CANCELLED].includes(request.status)) {
      throw new ApiError(409, `This request is already ${request.status.toLowerCase()} and can't be cancelled`);
    }

    const updated = await aidRequestRepository.pushStatus(
      request._id,
      {
        status: REQUEST_STATUS.CANCELLED,
        changedBy: null,
        note: reason || 'Cancelled by the requester',
        fromRequester: true,
      },
      REQUEST_STATUS.CANCELLED
    );

    await subject.notify({ request: updated, previousStatus: request.status, actor: null, note: reason });
    await auditService.record({
      actor: null,
      action: 'REQUEST_CANCELLED_BY_REQUESTER',
      entityType: 'AidRequest',
      entityId: updated._id,
      summary: `Request ${updated.trackingCode} cancelled by the requester`,
    });

    return this.track(updated.trackingCode);
  }

  /** Lets a requester leave a follow-up note (e.g. "we moved", "still waiting") without changing status. */
  async addNoteByCode(code, note) {
    const request = await aidRequestRepository.findByTrackingCode(code);
    if (!request) throw new ApiError(404, 'No request found with that tracking code');

    if ([REQUEST_STATUS.DELIVERED, REQUEST_STATUS.CANCELLED].includes(request.status)) {
      throw new ApiError(409, `This request is already ${request.status.toLowerCase()} — an update can't be added`);
    }

    const updated = await aidRequestRepository.pushHistoryEntry(request._id, {
      status: request.status,
      changedBy: null,
      note,
      fromRequester: true,
    });

    return this.track(updated.trackingCode);
  }

  async queue({ status, priority, page = 1, limit = 50 }, actor = null) {
    const skip = (Math.max(page, 1) - 1) * limit;

    // Volunteers only see requests tied to their own tasks; managers/admins see everything.
    let ids;
    if (actor && actor.role === ROLES.VOLUNTEER) {
      ids = await taskRepository.requestIdsForVolunteer(actor._id);
    }

    const countFilter = { ...(status ? { status } : {}), ...(ids ? { _id: { $in: ids } } : {}) };
    const [requests, total] = await Promise.all([
      aidRequestRepository.findForQueue({ status, priority, ids, skip, limit }),
      aidRequestRepository.count(countFilter),
    ]);
    return { requests: requests.map((r) => r.toJSON()), total, page: Number(page) };
  }

  async getById(id, actor = null) {
    const request = await aidRequestRepository.findById(id);
    if (!request) throw new ApiError(404, 'Request not found');

    if (actor && actor.role === ROLES.VOLUNTEER) {
      const assigned = await taskRepository.isAssignedTo(id, actor._id);
      if (!assigned) throw new ApiError(403, "You don't have a task assigned against this request");
    }

    return request.toJSON();
  }

  async changeStatus(id, nextStatus, actor, note = '') {
    const request = await aidRequestRepository.findById(id);
    if (!request) throw new ApiError(404, 'Request not found');

    const previousStatus = request.status;
    if (previousStatus === nextStatus) return request.toJSON();

    if (!ALLOWED_TRANSITIONS[previousStatus].includes(nextStatus)) {
      throw new ApiError(409, `A ${previousStatus.toLowerCase()} request cannot move to ${nextStatus.toLowerCase()}`);
    }

    const updated = await aidRequestRepository.pushStatus(
      id,
      { status: nextStatus, changedBy: actor._id, note },
      nextStatus
    );

    // The service does not know who reacts to this. That is the point.
    await subject.notify({ request: updated, previousStatus, actor, note });

    return updated.toJSON();
  }

  async setPriority(id, priority, actor) {
    if (!Object.values(PRIORITY).includes(priority)) {
      throw new ApiError(400, 'That priority level is not valid');
    }

    const updated = await aidRequestRepository.updateById(id, { priority });
    if (!updated) throw new ApiError(404, 'Request not found');

    await auditService.record({
      actor,
      action: 'REQUEST_TRIAGED',
      entityType: 'AidRequest',
      entityId: id,
      summary: `Request ${updated.trackingCode} marked ${priority}`,
    });

    return updated.toJSON();
  }

  async remove(id, actor) {
    const removed = await aidRequestRepository.deleteById(id);
    if (!removed) throw new ApiError(404, 'Request not found');

    await auditService.record({
      actor,
      action: 'REQUEST_DELETED',
      entityType: 'AidRequest',
      entityId: id,
      summary: `Request ${removed.trackingCode} deleted`,
    });

    return { removed: true };
  }

  async statusSummary() {
    const rows = await aidRequestRepository.countByStatus();
    return rows.reduce((acc, row) => ({ ...acc, [row._id]: row.total }), {});
  }
}

export default new RequestService();
