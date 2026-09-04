import shelterRepository from '../repositories/ShelterRepository.js';
import checkInRepository from '../repositories/CheckInRepository.js';
import occupantRepository from '../repositories/OccupantRepository.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';

class ShelterService {
  async list(query) {
    const amenities = query.amenities
      ? String(query.amenities).split(',').map((a) => a.trim()).filter(Boolean)
      : [];

    const shelters = await shelterRepository.findFiltered({
      amenities,
      onlyOpen: query.onlyOpen === 'true',
      hasSpace: query.hasSpace === 'true',
    });

    return { shelters: shelters.map((s) => s.toJSON()) };
  }

  async getById(id) {
    const shelter = await shelterRepository.findById(id).populate('manager', 'name email');
    if (!shelter) throw new ApiError(404, 'Shelter not found');
    return shelter.toJSON();
  }

  async create(payload, actor) {
    const { latitude, longitude, ...rest } = payload;
    const shelter = await shelterRepository.create({
      ...rest,
      location: {
        type: 'Point',
        coordinates: [Number(longitude ?? 0), Number(latitude ?? 0)],
      },
    });

    await auditService.record({
      actor,
      action: 'SHELTER_CREATED',
      entityType: 'Shelter',
      entityId: shelter._id,
      summary: `Shelter ${shelter.name} opened with capacity ${shelter.maxCapacity}`,
    });

    return shelter.toJSON();
  }

  async update(id, changes, actor) {
    const shelter = await shelterRepository.updateById(id, changes);
    if (!shelter) throw new ApiError(404, 'Shelter not found');

    await auditService.record({
      actor,
      action: 'SHELTER_UPDATED',
      entityType: 'Shelter',
      entityId: id,
      summary: `Shelter ${shelter.name} updated`,
      metadata: changes,
    });

    return shelter.toJSON();
  }

  /**
   * Check-in and check-out are the same operation with a sign. The count and the
   * log are written together so the dashboard and the history cannot drift apart.
   */
  async recordCheckIn(shelterId, { delta, reason }, actor) {
    const shelter = await shelterRepository.findById(shelterId);
    if (!shelter) throw new ApiError(404, 'Shelter not found');

    // A quick, friendly precheck for the common case. It is not what actually
    // prevents an overshoot under concurrent requests — that guard is atomic
    // and lives inside adjustHeadcount itself, evaluated by MongoDB at write
    // time against whatever the headcount is right then, not this stale read.
    if (delta > 0 && shelter.currentHeadcount + delta > shelter.maxCapacity) {
      throw new ApiError(409, `Only ${shelter.remainingSpots} spots left at ${shelter.name}`);
    }

    const updated = await shelterRepository.adjustHeadcount(shelterId, delta);
    if (!updated) {
      throw new ApiError(
        409,
        delta > 0
          ? `${shelter.name} does not have room for ${delta} more right now`
          : 'That would put the headcount below zero'
      );
    }

    await checkInRepository.create({
      shelter: shelterId,
      delta,
      headcountAfter: updated.currentHeadcount,
      reason,
      recordedBy: actor._id,
    });

    await auditService.record({
      actor,
      action: delta > 0 ? 'SHELTER_CHECK_IN' : 'SHELTER_CHECK_OUT',
      entityType: 'Shelter',
      entityId: shelterId,
      summary: `${Math.abs(delta)} ${delta > 0 ? 'arrived at' : 'left'} ${updated.name} (now ${updated.currentHeadcount})`,
    });

    return updated.toJSON();
  }

  async checkInHistory(shelterId) {
    const logs = await checkInRepository.forShelter(shelterId);
    return { logs: logs.map((l) => l.toJSON()) };
  }

  async registerOccupant(shelterId, payload, actor) {
    const shelter = await shelterRepository.findById(shelterId);
    if (!shelter) throw new ApiError(404, 'Shelter not found');

    const occupant = await occupantRepository.create({
      ...payload,
      shelter: shelterId,
      registeredBy: actor._id,
    });

    return occupant.toJSON();
  }

  async listOccupants(shelterId) {
    const occupants = await occupantRepository.forShelter(shelterId);
    return { occupants: occupants.map((o) => o.toJSON()) };
  }

  async checkOutOccupant(occupantId, actor) {
    const occupant = await occupantRepository.updateById(occupantId, { checkedOutAt: new Date() });
    if (!occupant) throw new ApiError(404, 'Person not found in the registry');

    await auditService.record({
      actor,
      action: 'OCCUPANT_CHECKED_OUT',
      entityType: 'ShelterOccupant',
      entityId: occupantId,
      summary: `${occupant.fullName} checked out`,
    });

    return occupant.toJSON();
  }

  /** Public safety search — returns only what a searching relative needs. */
  async searchRegistry(term) {
    const matches = await occupantRepository.search(term);
    return {
      results: matches.map((person) => ({
        fullName: person.fullName,
        hometown: person.hometown,
        ageGroup: person.ageGroup,
        isSafe: person.isSafe,
        shelter: person.shelter ? { name: person.shelter.name, address: person.shelter.address } : null,
        checkedInAt: person.checkedInAt,
      })),
    };
  }

  async occupancySummary() {
    const [totals] = await shelterRepository.totals();
    return totals || { shelters: 0, capacity: 0, occupied: 0 };
  }
}

export default new ShelterService();
