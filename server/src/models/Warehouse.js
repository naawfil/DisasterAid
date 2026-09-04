import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    address: { type: String, required: true, trim: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

warehouseSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('Warehouse', warehouseSchema);
