import mongoose from 'mongoose';
import { TASK_STATUS, values } from '../constants/enums.js';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'AidRequest', default: null },
    relatedDispatch: { type: mongoose.Schema.Types.ObjectId, ref: 'DispatchOrder', default: null },
    relatedShelter: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    status: { type: String, enum: values(TASK_STATUS), default: TASK_STATUS.PENDING, index: true },
    checklist: [
      {
        _id: false,
        label: { type: String, required: true, trim: true },
        done: { type: Boolean, default: false },
      },
    ],
    dueAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

taskSchema.virtual('progress').get(function progress() {
  if (!this.checklist.length) return this.status === TASK_STATUS.COMPLETED ? 100 : 0;
  const done = this.checklist.filter((c) => c.done).length;
  return Math.round((done / this.checklist.length) * 100);
});

taskSchema.set('toJSON', {
  virtuals: true,
  transform: (_d, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Task', taskSchema);
