import mongoose from 'mongoose';
import { AMENITIES, values } from '../constants/enums.js';

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    maxCapacity: { type: Number, required: true, min: 1 },
    currentHeadcount: { type: Number, default: 0, min: 0 },
    amenities: { type: [String], enum: values(AMENITIES), default: [] },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    contactPhone: { type: String, trim: true, default: '' },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

// Derived, never stored — storing it invites the two numbers disagreeing.
shelterSchema.virtual('remainingSpots').get(function remaining() {
  return Math.max(this.maxCapacity - this.currentHeadcount, 0);
});

shelterSchema.virtual('isFull').get(function full() {
  return this.currentHeadcount >= this.maxCapacity;
});

shelterSchema.index({ location: '2dsphere' });
shelterSchema.set('toJSON', {
  virtuals: true,
  transform: (_d, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Shelter', shelterSchema);
