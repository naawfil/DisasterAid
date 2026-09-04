import BaseRepository from './BaseRepository.js';
import InventoryItem from '../models/InventoryItem.js';

class InventoryRepository extends BaseRepository {
  constructor() {
    super(InventoryItem);
  }

  findByWarehouse(warehouseId) {
    const filter = warehouseId ? { warehouse: warehouseId } : {};
    return this.model.find(filter).populate('warehouse', 'name').sort({ name: 1 });
  }

  findOneInWarehouse(warehouseId, name) {
    return this.model.findOne({ warehouse: warehouseId, name: name.trim() });
  }

  /**
   * Atomic stock decrement. The `quantity: { $gte: amount }` guard is inside the
   * same update, so two managers dispatching the last crate at the same moment
   * cannot both succeed — the loser gets null and a 409, not negative stock.
   */
  decrement(itemId, amount) {
    return this.model.findOneAndUpdate(
      { _id: itemId, quantity: { $gte: amount } },
      { $inc: { quantity: -amount } },
      { new: true }
    );
  }

  increment(itemId, amount) {
    return this.model.findByIdAndUpdate(itemId, { $inc: { quantity: amount } }, { new: true });
  }

  lowStock() {
    return this.model
      .find({ $expr: { $lte: ['$quantity', '$lowStockThreshold'] } })
      .populate('warehouse', 'name')
      .sort({ quantity: 1 });
  }

  /**
   * Warehouse-agnostic view of what is genuinely in stock right now, summed
   * across every location. This is what the public aid-request form reads so
   * a requester can only pick products that actually exist in the system,
   * instead of a fixed list that may or may not be stocked.
   */
  availableCatalog() {
    return this.model.aggregate([
      { $match: { quantity: { $gt: 0 } } },
      {
        $group: {
          _id: { name: '$name', category: '$category' },
          quantity: { $sum: '$quantity' },
          unit: { $first: '$unit' },
        },
      },
      {
        $project: {
          _id: 0,
          name: '$_id.name',
          category: '$_id.category',
          unit: 1,
          quantity: 1,
        },
      },
      { $sort: { category: 1, name: 1 } },
    ]);
  }
}

export default new InventoryRepository();
