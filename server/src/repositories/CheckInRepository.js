import BaseRepository from './BaseRepository.js';
import CheckInLog from '../models/CheckInLog.js';

class CheckInRepository extends BaseRepository {
  constructor() {
    super(CheckInLog);
  }

  forShelter(shelterId, limit = 50) {
    return this.model.find({ shelter: shelterId }).populate('recordedBy', 'name').sort({ createdAt: -1 }).limit(limit);
  }
}

export default new CheckInRepository();
