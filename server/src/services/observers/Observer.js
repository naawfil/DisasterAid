/** Interface every observer implements. */
export default class Observer {
  // eslint-disable-next-line no-unused-vars
  async update(event) {
    throw new Error(`${this.constructor.name} must implement update(event)`);
  }
}
