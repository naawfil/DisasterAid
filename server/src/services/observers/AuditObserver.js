import Observer from './Observer.js';
import auditService from '../AuditService.js';

/** Concrete Observer: writes every status change to the audit trail (feature 21). */
export default class AuditObserver extends Observer {
  async update({ request, previousStatus, actor, note }) {
    await auditService.record({
      actor,
      action: 'REQUEST_STATUS_CHANGED',
      entityType: 'AidRequest',
      entityId: request._id,
      summary: `Request ${request.trackingCode}: ${previousStatus} → ${request.status}`,
      metadata: { previousStatus, newStatus: request.status, note },
    });
  }
}
