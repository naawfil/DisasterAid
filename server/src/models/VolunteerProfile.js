import mongoose from 'mongoose';
import { VOLUNTEER_SKILLS, values } from '../constants/enums.js';

const volunteerProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills: { type: [String], enum: values(VOLUNTEER_SKILLS), default: [] },
    isAvailable: { type: Boolean, default: true, index: true },
    baseArea: { type: String, trim: true, default: '' },
    activeTaskCount: { type: Number, default: 0, min: 0 },
    completedTaskCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

volunteerProfileSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('VolunteerProfile', volunteerProfileSchema);
