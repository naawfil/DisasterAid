import mongoose from 'mongoose';
import { AID_CATEGORIES, values } from '../constants/enums.js';

const inventoryItemSchema = new mongoose.Schema(
  {
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, enum: values(AID_CATEGORIES), required: true },
    unit: { type: String, default: 'unit', trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 20 },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// One row per item per warehouse — the stock tracker is per location (feature 9).
inventoryItemSchema.index({ warehouse: 1, name: 1 }, { unique: true });

inventoryItemSchema.virtual('isLowStock').get(function low() {
  return this.quantity <= this.lowStockThreshold;
});

inventoryItemSchema.set('toJSON', {
  virtuals: true,
  transform: (_d, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('InventoryItem', inventoryItemSchema);
