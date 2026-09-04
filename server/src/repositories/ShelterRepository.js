import BaseRepository from './BaseRepository.js';
import Shelter from '../models/Shelter.js';

class ShelterRepository extends BaseRepository {
  constructor() {
    super(Shelter);
  }

  findFiltered({ amenities = [], onlyOpen = false, hasSpace = false }) {
    const filter = {};
    if (amenities.length) filter.amenities = { $all: amenities };
    if (onlyOpen) filter.isOpen = true;

    const query = this.model.find(filter).populate('manager', 'name').sort({ name: 1 });

    // remainingSpots is a virtual, so "has space" cannot be a Mongo filter.
    return hasSpace
      ? query.then((docs) => docs.filter((s) => s.remainingSpots > 0))
      : query;
  }

  /**
   * Applies a headcount delta without letting it fall below zero or above
   * capacity. Returns null when the change is not possible, which the service
   * turns into a 409. Both directions are guarded inside the same atomic
   * findOneAndUpdate — a query filter, evaluated by MongoDB against the
   * document's current state at write time — so two concurrent arrivals can
   * never both squeeze past a capacity ceiling neither one saw the other take
   * (a plain read-then-write in the service layer would race here).
   */
  adjustHeadcount(id, delta) {
    const guard =
      delta < 0
        ? { currentHeadcount: { $gte: Math.abs(delta) } }
        : { $expr: { $lte: [{ $add: ['$currentHeadcount', delta] }, '$maxCapacity'] } };
    return this.model.findOneAndUpdate({ _id: id, ...guard }, { $inc: { currentHeadcount: delta } }, { new: true });
  }

  totals() {
    return this.model.aggregate([
      {
        $group: {
          _id: null,
          shelters: { $sum: 1 },
          capacity: { $sum: '$maxCapacity' },
          occupied: { $sum: '$currentHeadcount' },
        },
      },
    ]);
  }
}

export default new ShelterRepository();
