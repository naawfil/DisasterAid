import BaseRepository from './BaseRepository.js';
import Announcement from '../models/Announcement.js';

class AnnouncementRepository extends BaseRepository {
  constructor() {
    super(Announcement);
  }

  /** Public board: hide anything that has expired, pinned items first. */
  listLive(limit = 50) {
    const now = new Date();
    return this.model
      .find({ $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] })
      .populate('publishedBy', 'name role')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit);
  }
}

export default new AnnouncementRepository();
