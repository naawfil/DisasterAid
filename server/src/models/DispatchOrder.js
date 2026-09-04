import mongoose from 'mongoose';
import { DISPATCH_STATUS, DESTINATION_TYPES, values } from '../constants/enums.js';

const dispatchOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, unique: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destinationType: { type: String, enum: values(DESTINATION_TYPES), required: true },
    destinationShelter: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
    destinationRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'AidRequest', default: null },
    items: [
      {
        _id: false,
        inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem', required: true },
        name: String,
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    // Feature 19: access notes for whoever drives this load.
    routeNotes: { type: String, trim: true, default: '', maxlength: 600 },
    status: { type: String, enum: values(DISPATCH_STATUS), default: DISPATCH_STATUS.DRAFT, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

dispatchOrderSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('DispatchOrder', dispatchOrderSchema);
