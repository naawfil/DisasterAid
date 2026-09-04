import BaseRepository from './BaseRepository.js';
import User from '../models/User.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  /** Password is `select: false` on the schema, so login must ask for it explicitly. */
  findByEmail(email, { withPassword = false } = {}) {
    const query = this.model.findOne({ email: String(email).toLowerCase().trim() });
    return withPassword ? query.select('+password') : query;
  }

  findByRole(role, options) {
    return this.find({ role }, options);
  }

  setRole(id, role) {
    return this.updateById(id, { role });
  }

  setActive(id, isActive) {
    return this.updateById(id, { isActive });
  }

  touchLogin(id) {
    return this.model.findByIdAndUpdate(id, { lastLoginAt: new Date() });
  }
}

export default new UserRepository();
