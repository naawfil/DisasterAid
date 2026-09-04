import Observer from './Observer.js';
import { buildStatusMessage } from '../channels/smsTemplates.js';
import clipboardChannel from '../channels/ClipboardAdapter.js';

/**
 * Concrete Observer: turns a status change into an outgoing message (feature 17).
 * It talks to a MessageChannel, so swapping clipboard drafts for a real SMS
 * gateway is a one-line change in services/channels/index.js.
 */
export default class AlertDraftObserver extends Observer {
  async update({ request, previousStatus }) {
    if (request.status === previousStatus) return;
    if (!request.contactPhone) return;

    const body = buildStatusMessage(request);
    await clipboardChannel.send(request.contactPhone, body);
  }
}
