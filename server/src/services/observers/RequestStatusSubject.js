/**
 * Observer Pattern (GoF, Behavioural) — the Subject.
 *
 * An aid request changing status is the one event the rest of the system cares
 * about: the audit trail, the alert desk, the noticeboard. The subject holds a
 * list of observers and notifies them; it does not know or care what any of them
 * do. Adding a new reaction later means writing an observer and attaching it,
 * with no edit to RequestService.
 */
class RequestStatusSubject {
  #observers = new Set();

  attach(observer) {
    this.#observers.add(observer);
    return this;
  }

  detach(observer) {
    this.#observers.delete(observer);
    return this;
  }

  get observerCount() {
    return this.#observers.size;
  }

  /**
   * @param {{ request: object, previousStatus: string, actor: object|null, note: string }} event
   */
  async notify(event) {
    // One broken observer must not stop the others, or roll back the status change.
    await Promise.all(
      [...this.#observers].map(async (observer) => {
        try {
          await observer.update(event);
        } catch (error) {
          console.error(`[observer] ${observer.constructor.name} failed:`, error.message);
        }
      })
    );
  }
}

export default new RequestStatusSubject();
