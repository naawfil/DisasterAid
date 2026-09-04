import BaseRepository from './BaseRepository.js';
import ShelterOccupant from '../models/ShelterOccupant.js';

class OccupantRepository extends BaseRepository {
  constructor() {
    super(ShelterOccupant);
  }

  search(term, { limit = 40 } = {}) {
    const safe = String(term).trim();
    if (!safe) return Promise.resolve([]);

    // Case-insensitive prefix/substring match — people search half-remembered names.
    const pattern = new RegExp(safe.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    return this.model
      .find({ $or: [{ fullName: pattern }, { hometown: pattern }], checkedOutAt: null })
      .populate('shelter', 'name address')
      .limit(limit);
  }

  forShelter(shelterId) {
    return this.model.find({ shelter: shelterId, checkedOutAt: null }).sort({ fullName: 1 });
  }
}

export default new OccupantRepository();
