import MessageChannel from './MessageChannel.js';

/**
 * Second adapter, same Target interface — the proof the pattern is doing work.
 * The adaptee here would be the Twilio SDK, whose real signature is
 * `client.messages.create({ to, from, body })`. Nothing that calls send()
 * changes when this is swapped in.
 */
class TwilioAdapter extends MessageChannel {
  constructor(client = null, fromNumber = '') {
    super();
    this.adaptee = client;
    this.fromNumber = fromNumber;
  }

  async send(recipient, body) {
    if (!this.adaptee) {
      throw new Error('Twilio client not configured — set credentials before selecting this channel');
    }
    return this.adaptee.messages.create({ to: recipient, from: this.fromNumber, body });
  }
}

export default TwilioAdapter;
