import BaseRepository from './BaseRepository.js';
import Donation from '../models/Donation.js';

class DonationRepository extends BaseRepository {
  constructor() {
    super(Donation);
  }

  recent({ warehouse, limit = 50 } = {}) {
    const filter = warehouse ? { warehouse } : {};
    return this.model
      .find(filter)
      .populate('warehouse', 'name')
      .populate('loggedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export default new DonationRepository();
