import mongoose from 'mongoose';
import { AID_CATEGORIES, DONOR_TYPES, values } from '../constants/enums.js';

const donationSchema = new mongoose.Schema(
  {
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    donorName: { type: String, required: true, trim: true },
    donorType: { type: String, enum: values(DONOR_TYPES), default: DONOR_TYPES.CITIZEN },
    donorContact: { type: String, trim: true, default: '' },
    items: [
      {
        _id: false,
        name: { type: String, required: true, trim: true },
        category: { type: String, enum: values(AID_CATEGORIES), required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: 'unit' },
      },
    ],
    note: { type: String, trim: true, default: '' },
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

donationSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('Donation', donationSchema);
