import mongoose from 'mongoose';
import { AID_CATEGORIES, REQUEST_STATUS, PRIORITY, values } from '../constants/enums.js';

const requestedItemSchema = new mongoose.Schema(
  {
    category: { type: String, enum: values(AID_CATEGORIES), required: true },
    quantity: { type: Number, required: true, min: 1, max: 10000 },
    note: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const statusEntrySchema = new mongoose.Schema(
  {
    status: { type: String, enum: values(REQUEST_STATUS), required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    note: { type: String, trim: true, default: '' },
    changedAt: { type: Date, default: Date.now },
    // True when the requester themselves left this entry from the public tracking
    // page (a follow-up note, or the cancellation they triggered) rather than staff.
    fromRequester: { type: Boolean, default: false },
  },
  { _id: false }
);

const aidRequestSchema = new mongoose.Schema(
  {
    trackingCode: { type: String, required: true, unique: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    requesterName: { type: String, required: true, trim: true },
    contactPhone: { type: String, required: true, trim: true },
    householdSize: { type: Number, min: 1, max: 100, default: 1 },
    items: {
      type: [requestedItemSchema],
      validate: [(v) => v.length > 0, 'Select at least one kind of aid'],
    },
    // GeoJSON stores [longitude, latitude] — that order, not the other one.
    // Optional: a request can be filed with a typed address instead of a GPS fix
    // (declined/unavailable browser geolocation), so coordinates are not required.
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    address: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '', maxlength: 1000 },
    status: { type: String, enum: values(REQUEST_STATUS), default: REQUEST_STATUS.PENDING, index: true },
    priority: { type: String, enum: values(PRIORITY), default: PRIORITY.MEDIUM, index: true },
    statusHistory: { type: [statusEntrySchema], default: [] },
  },
  { timestamps: true }
);

aidRequestSchema.index({ location: '2dsphere' });
aidRequestSchema.index({ status: 1, priority: 1, createdAt: -1 });

// Without real coordinates, `location.type` still defaults to 'Point', which
// on its own is not valid GeoJSON and would fail the 2dsphere index. Drop the
// whole field when there is no coordinate pair so the document is simply
// excluded from geo queries instead of rejected.
aidRequestSchema.pre('validate', function dropIncompleteLocation(next) {
  if (!this.location || !Array.isArray(this.location.coordinates) || this.location.coordinates.length !== 2) {
    this.location = undefined;
  }
  next();
});

aidRequestSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('AidRequest', aidRequestSchema);
