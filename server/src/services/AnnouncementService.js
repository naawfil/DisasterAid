import announcementRepository from '../repositories/AnnouncementRepository.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';

class AnnouncementService {
  async listLive() {
    const announcements = await announcementRepository.listLive();
    return { announcements: announcements.map((a) => a.toJSON()) };
  }

  async publish(payload, actor) {
    const announcement = await announcementRepository.create({ ...payload, publishedBy: actor._id });

    await auditService.record({
      actor,
      action: 'ANNOUNCEMENT_PUBLISHED',
      entityType: 'Announcement',
      entityId: announcement._id,
      summary: `${announcement.severity}: ${announcement.title}`,
    });

    return announcement.toJSON();
  }

  async remove(id, actor) {
    const announcement = await announcementRepository.deleteById(id);
    if (!announcement) throw new ApiError(404, 'Announcement not found');

    await auditService.record({
      actor,
      action: 'ANNOUNCEMENT_REMOVED',
      entityType: 'Announcement',
      entityId: id,
      summary: `Removed: ${announcement.title}`,
    });

    return { removed: true };
  }
}

export default new AnnouncementService();
