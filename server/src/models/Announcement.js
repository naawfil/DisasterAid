import mongoose from 'mongoose';
import { SEVERITY, values } from '../constants/enums.js';

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    severity: { type: String, enum: values(SEVERITY), default: SEVERITY.INFO, index: true },
    area: { type: String, trim: true, default: '' },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, default: null },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.set('toJSON', { virtuals: true, transform: (_d, ret) => { delete ret.__v; return ret; } });

export default mongoose.model('Announcement', announcementSchema);
