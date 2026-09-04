import mongoose from 'mongoose';

/**
 * Missing persons and safety registry (feature 8).
 *
 * Searchable by anyone looking for family, so it holds the minimum that makes a
 * person findable and nothing that would put them at risk: no phone number, no
 * exact address, no age in years.
 */
const shelterOccupantSchema = new mongoose.Schema(
  {
    shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', required: true, index: true },
    fullName: { type: String, required: true, trim: true, index: true },
    hometown: { type: String, required: true, trim: true },
    ageGroup: { type: String, enum: ['CHILD', 'ADULT', 'ELDERLY'], default: 'ADULT' },
    isSafe: { type: Boolean, default: true },
    checkedInAt: { type: Date, default: Date.now },
    checkedOutAt: { type: Date, default: null },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

shelterOccupantSchema.index({ fullName: 'text', hometown: 'text' });
shelterOccupantSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('ShelterOccupant', shelterOccupantSchema);
