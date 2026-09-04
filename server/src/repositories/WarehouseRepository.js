import BaseRepository from './BaseRepository.js';
import Warehouse from '../models/Warehouse.js';

class WarehouseRepository extends BaseRepository {
  constructor() {
    super(Warehouse);
  }

  listActive() {
    return this.model.find({ isActive: true }).populate('manager', 'name').sort({ name: 1 });
  }
}

export default new WarehouseRepository();
