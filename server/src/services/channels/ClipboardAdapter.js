import MessageChannel from './MessageChannel.js';

/**
 * Object Adapter. The adaptee is the manual workflow the feature actually asks
 * for (feature 17): a manager copies generated text into whatever channel they
 * have. We queue the drafts in memory so the alerts screen can show them.
 */
class DraftBuffer {
  constructor(limit = 100) {
    this.limit = limit;
    this.drafts = [];
  }

  push(draft) {
    this.drafts.unshift(draft);
    if (this.drafts.length > this.limit) this.drafts.pop();
  }

  list() {
    return this.drafts;
  }
}

class ClipboardAdapter extends MessageChannel {
  constructor() {
    super();
    this.adaptee = new DraftBuffer();
  }

  async send(recipient, body) {
    const draft = { recipient, body, createdAt: new Date().toISOString(), channel: 'CLIPBOARD' };
    this.adaptee.push(draft);
    return draft;
  }

  pending() {
    return this.adaptee.list();
  }
}

export default new ClipboardAdapter();
