import BaseRepository from './BaseRepository.js';
import AidRequest from '../models/AidRequest.js';

class AidRequestRepository extends BaseRepository {
  constructor() {
    super(AidRequest);
  }

  findByTrackingCode(code) {
    return this.model.findOne({ trackingCode: String(code).toUpperCase().trim() });
  }

  findForQueue({ status, priority, ids, skip = 0, limit = 50 }) {
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    // Restricts the queue to a specific set of request ids — used to scope a
    // volunteer's view to only requests they have a task against.
    if (ids) filter._id = { $in: ids };

    return this.model
      .find(filter)
      .populate('requester', 'name email')
      .sort({ priority: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  findNear([lng, lat], metres = 5000) {
    return this.model.find({
      location: {
        $near: { $geometry: { type: 'Point', coordinates: [lng, lat] }, $maxDistance: metres },
      },
    });
  }

  pushStatus(id, entry, status) {
    return this.model.findByIdAndUpdate(
      id,
      { status, $push: { statusHistory: entry } },
      { new: true, runValidators: true }
    );
  }

  /** Appends a history entry without touching the current status field. */
  pushHistoryEntry(id, entry) {
    return this.model.findByIdAndUpdate(
      id,
      { $push: { statusHistory: entry } },
      { new: true, runValidators: true }
    );
  }

  countByStatus() {
    return this.model.aggregate([{ $group: { _id: '$status', total: { $sum: 1 } } }]);
  }
}

export default new AidRequestRepository();
