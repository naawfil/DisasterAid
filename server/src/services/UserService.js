import userRepository from '../repositories/UserRepository.js';
import ApiError from '../utils/ApiError.js';
import { ROLES } from '../constants/roles.js';

class UserService {
  async list({ role, page = 1, limit = 25 }) {
    const filter = role ? { role } : {};
    const skip = (Math.max(page, 1) - 1) * limit;

    const [users, total] = await Promise.all([
      userRepository.find(filter, { skip, limit }),
      userRepository.count(filter),
    ]);

    return { users: users.map((u) => u.toJSON()), total, page: Number(page), limit: Number(limit) };
  }

  async changeRole(actor, targetId, role) {
    if (actor._id.toString() === targetId) {
      throw new ApiError(400, 'You cannot change your own role');
    }

    const target = await userRepository.findById(targetId);
    if (!target) throw new ApiError(404, 'User not found');

    // Keep at least one admin standing.
    if (target.role === ROLES.ADMIN && role !== ROLES.ADMIN) {
      const admins = await userRepository.count({ role: ROLES.ADMIN });
      if (admins <= 1) throw new ApiError(400, 'The last admin cannot be demoted');
    }

    const updated = await userRepository.setRole(targetId, role);
    return updated.toJSON();
  }

  async setActive(actor, targetId, isActive) {
    if (actor._id.toString() === targetId) {
      throw new ApiError(400, 'You cannot deactivate your own account');
    }

    const updated = await userRepository.setActive(targetId, isActive);
    if (!updated) throw new ApiError(404, 'User not found');
    return updated.toJSON();
  }
}

export default new UserService();
