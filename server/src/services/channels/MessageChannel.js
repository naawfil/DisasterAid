/**
 * Adapter Pattern (GoF, Structural) — the Target interface.
 *
 * Everything that sends a message to a person talks to this interface. The
 * concrete adapters below wrap incompatible adaptees (a clipboard buffer, an
 * SMS SDK) and expose them through the same two methods.
 */
export default class MessageChannel {
  // eslint-disable-next-line no-unused-vars
  async send(recipient, body) {
    throw new Error(`${this.constructor.name} must implement send(recipient, body)`);
  }

  get name() {
    return this.constructor.name;
  }
}
