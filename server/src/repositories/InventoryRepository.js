import BaseRepository from './BaseRepository.js';
import InventoryItem from '../models/InventoryItem.js';

/** Lets a product name be matched literally in a $regex without its punctuation being read as regex syntax. */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

  /**
  /**
   * Tops up existing stock instead of overwriting it — same idea as
   * increment(), but also lets the manager touch threshold/unit in the same
   * request so the "add units" form doesn't need a second call. Fixes
   * feature 9's set-vs-add mixup: adjusting an item used to always overwrite
   * quantity, even when the manager meant "50 more just arrived".
   */
  addQuantity(itemId, amount, fields = {}) {
    const update = { $inc: { quantity: amount } };
    if (Object.keys(fields).length) update.$set = fields;
    return this.model.findByIdAndUpdate(itemId, update, { new: true });
  }

  /**
   * Rows to draw down when a request is fulfilled outside the Dispatch flow
   * (a volunteer completing a field task rather than a manager building a
   * dispatch order) — nothing on the request says which warehouse to use, so
   * this matches by product name across every warehouse, richest stock first,
   * and falls back to the request line's category when no specific product
   * name was recorded (an older or manually-entered request line).
   */
  findFulfillmentCandidates(name, category) {
    const filter = name
      ? { name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') }, quantity: { $gt: 0 } }
      : { category, quantity: { $gt: 0 } };
    return this.model.find(filter).sort({ quantity: -1 });
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
