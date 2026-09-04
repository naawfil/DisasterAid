import mongoose from 'mongoose';

const checkInLogSchema = new mongoose.Schema(
  {
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', required: true, index: true },
    delta: { type: Number, required: true }, // positive = arrivals, negative = departures
    headcountAfter: { type: Number, required: true },
    reason: { type: String, trim: true, default: '' },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

checkInLogSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('CheckInLog', checkInLogSchema);
