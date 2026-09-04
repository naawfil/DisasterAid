import volunteerRepository from '../repositories/VolunteerRepository.js';
import userRepository from '../repositories/UserRepository.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';
import { ROLES } from '../constants/roles.js';

class VolunteerService {
  /** A profile is created on first access rather than at registration. */
  async getOrCreateProfile(userId) {
    const existing = await volunteerRepository.findByUser(userId);
    if (existing) return existing.toJSON();

    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'Account not found');

    const created = await volunteerRepository.create({ user: userId });
    const populated = await volunteerRepository.findByUser(userId);
    return (populated || created).toJSON();
  }

  async updateProfile(userId, { skills, baseArea }) {
    const changes = {};
    if (skills) changes.skills = skills;
    if (baseArea !== undefined) changes.baseArea = baseArea;

    await this.getOrCreateProfile(userId);
    const profile = await volunteerRepository.model.findOneAndUpdate({ user: userId }, changes, { new: true });
    return profile.toJSON();
  }

  /** Feature 16 — the off-shift switch. */
  async setAvailability(userId, isAvailable, actor) {
    await this.getOrCreateProfile(userId);
    const profile = await volunteerRepository.model.findOneAndUpdate(
      { user: userId },
      { isAvailable },
      { new: true }
    );

    await auditService.record({
      actor,
      action: 'VOLUNTEER_AVAILABILITY_CHANGED',
      entityType: 'VolunteerProfile',
      entityId: profile._id,
      summary: `${actor.name} went ${isAvailable ? 'on' : 'off'} shift`,
    });

    return profile.toJSON();
  }

  async list(query) {
    const profiles = await volunteerRepository.listAll({
      skill: query.skill,
      availableOnly: query.availableOnly === 'true',
    });
    return { volunteers: profiles.map((p) => p.toJSON()) };
  }

  /** Feeds the assignment dropdown (feature 14). */
  async assignable(skill) {
    const profiles = await volunteerRepository.findAssignable(skill);
    return {
      volunteers: profiles.map((p) => ({
        id: p.user._id,
        name: p.user.name,
        skills: p.skills,
        activeTaskCount: p.activeTaskCount,
      })),
    };
  }

  /**
   * `requireAvailable` re-checks on-shift status at the moment of assignment
   * (features 14/16) — the assignment dropdown already filters to available
   * volunteers, but that's a UI convenience, not enforcement. Without this,
   * a task could still be assigned directly against an off-shift volunteer.
   */
  async ensureVolunteer(userId, { requireAvailable = false } = {}) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'That volunteer does not exist');
    if (![ROLES.VOLUNTEER, ROLES.RELIEF_MANAGER, ROLES.ADMIN].includes(user.role)) {
      throw new ApiError(400, 'That account is not a volunteer');
    }
    if (!user.isActive) throw new ApiError(400, 'That account is deactivated');

    if (requireAvailable) {
      const profile = await volunteerRepository.findByUser(userId);
      if (!profile || !profile.isAvailable) {
        throw new ApiError(400, `${user.name} is currently off shift and cannot be assigned new work`);
      }
    }

    return user;
  }
}

export default new VolunteerService();
