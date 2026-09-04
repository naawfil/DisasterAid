import auditLogRepository from '../repositories/AuditLogRepository.js';

class AuditService {
  /** Never let a failed audit write break the action being audited. */
  async record({ actor, action, entityType, entityId, summary, metadata }) {
    try {
      return await auditLogRepository.create({
        actor: actor?._id ?? null,
        actorName: actor?.name ?? 'System',
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        summary,
        metadata: metadata || {},
      });
    } catch (error) {
      console.error('[audit] failed to write entry:', error.message);
      return null;
    }
  }

  async list(query) {
    const logs = await auditLogRepository.recent(query);
    return { logs: logs.map((l) => l.toJSON()) };
  }
}

export default new AuditService();
