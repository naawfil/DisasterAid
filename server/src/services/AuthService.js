import userRepository from '../repositories/UserRepository.js';
import ApiError from '../utils/ApiError.js';
import { signAccessToken } from '../utils/token.js';
import { ROLES, SELF_ASSIGNABLE_ROLES } from '../constants/roles.js';

/**
 * Business layer. Holds the rules; knows nothing about HTTP (no req/res here)
 * and nothing about Mongoose (no queries here).
 */
class AuthService {
  async register({ name, email, phone, password, role }) {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    // Nobody promotes themselves. Manager and admin roles are granted by an admin.
    const safeRole = SELF_ASSIGNABLE_ROLES.includes(role) ? role : ROLES.PUBLIC;

    const user = await userRepository.create({ name, email, phone, password, role: safeRole });
    return { user: user.toJSON(), token: signAccessToken(user) };
  }

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, { withPassword: true });

    // Same message either way, so the response cannot be used to discover which
    // emails are registered.
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Email or password is incorrect');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'This account is deactivated. Contact a relief manager.');
    }

    await userRepository.touchLogin(user._id);
    return { user: user.toJSON(), token: signAccessToken(user) };
  }

  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, 'Account not found');
    return user.toJSON();
  }

  async updateProfile(userId, { name, phone }) {
    const changes = {};
    if (name !== undefined) changes.name = name;
    if (phone !== undefined) changes.phone = phone;

    const user = await userRepository.updateById(userId, changes);
    if (!user) throw new ApiError(404, 'Account not found');
    return user.toJSON();
  }

  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findById(userId).select('+password');
    if (!user) throw new ApiError(404, 'Account not found');

    if (!(await user.comparePassword(currentPassword))) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = newPassword; // pre-save hook re-hashes
    await user.save();
    return { changed: true };
  }
}

export default new AuthService();
