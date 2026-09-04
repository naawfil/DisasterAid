import BaseRepository from './BaseRepository.js';
import DispatchOrder from '../models/DispatchOrder.js';

class DispatchRepository extends BaseRepository {
  constructor() {
    super(DispatchOrder);
  }

  recent({ status, limit = 50 } = {}) {
    const filter = status ? { status } : {};
    return this.model
      .find(filter)
      .populate('warehouse', 'name')
      .populate('destinationShelter', 'name address')
      .populate('destinationRequest', 'trackingCode address')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export default new DispatchRepository();
