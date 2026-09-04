import BaseRepository from './BaseRepository.js';
import AuditLog from '../models/AuditLog.js';

class AuditLogRepository extends BaseRepository {
  constructor() {
    super(AuditLog);
  }

  recent({ entityType, skip = 0, limit = 100 } = {}) {
    const filter = entityType ? { entityType } : {};
    return this.model.find(filter).populate('actor', 'name role').sort({ createdAt: -1 }).skip(skip).limit(limit);
  }
}

export default new AuditLogRepository();
