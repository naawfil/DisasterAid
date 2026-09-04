/**
 * Repository Pattern.
 *
 * Services talk to repositories, never to Mongoose models directly. Every
 * query the app needs lives behind a named method here, so swapping the
 * persistence layer means rewriting this folder and nothing else.
 */
export default class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findById(id) {
    return this.model.findById(id);
  }

  findOne(filter) {
    return this.model.findOne(filter);
  }

  find(filter = {}, { sort = '-createdAt', skip = 0, limit = 50 } = {}) {
    return this.model.find(filter).sort(sort).skip(skip).limit(limit);
  }

  updateById(id, changes) {
    return this.model.findByIdAndUpdate(id, changes, { new: true, runValidators: true });
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }

  count(filter = {}) {
    return this.model.countDocuments(filter);
  }
}
