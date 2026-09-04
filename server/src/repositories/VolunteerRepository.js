import BaseRepository from './BaseRepository.js';
import VolunteerProfile from '../models/VolunteerProfile.js';

class VolunteerRepository extends BaseRepository {
  constructor() {
    super(VolunteerProfile);
  }

  findByUser(userId) {
    return this.model.findOne({ user: userId }).populate('user', 'name email phone role isActive');
  }

  listAll({ skill, availableOnly = false } = {}) {
    const filter = {};
    if (skill) filter.skills = skill;
    if (availableOnly) filter.isAvailable = true;

    return this.model.find(filter).populate('user', 'name email phone isActive').sort({ activeTaskCount: 1 });
  }

  /**
   * Who can actually take a job right now. The filter lives here rather than in
   * the React dropdown so every caller gets the same answer.
   */
  async findAssignable(skill) {
    const profiles = await this.listAll({ skill, availableOnly: true });
    return profiles.filter((p) => p.user && p.user.isActive);
  }

  bumpActive(userId, delta) {
    return this.model.findOneAndUpdate({ user: userId }, { $inc: { activeTaskCount: delta } }, { new: true });
  }

  bumpCompleted(userId) {
    return this.model.findOneAndUpdate(
      { user: userId },
      { $inc: { completedTaskCount: 1, activeTaskCount: -1 } },
      { new: true }
    );
  }
}

export default new VolunteerRepository();
