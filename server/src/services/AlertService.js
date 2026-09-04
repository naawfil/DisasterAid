import clipboardChannel from './channels/ClipboardAdapter.js';
import { TEMPLATES, buildFromTemplate } from './channels/smsTemplates.js';
import ApiError from '../utils/ApiError.js';
import auditService from './AuditService.js';

/**
 * Feature 17. The service only knows the MessageChannel interface, so which
 * adapter is in use is a configuration decision, not a code change.
 */
class AlertService {
  constructor(channel = clipboardChannel) {
    this.channel = channel;
  }

  listTemplates() {
    return {
      templates: TEMPLATES.map(({ id, label, fields }) => ({ id, label, fields })),
      activeChannel: this.channel.name,
    };
  }

  async generate({ templateId, values, recipients = [] }, actor) {
    const body = buildFromTemplate(templateId, values);
    if (!body) throw new ApiError(400, 'Unknown message template');

    const audience = recipients.length ? recipients : ['BROADCAST'];
    const drafts = [];
    for (const recipient of audience) {
      drafts.push(await this.channel.send(recipient, body));
    }

    await auditService.record({
      actor,
      action: 'ALERT_GENERATED',
      entityType: 'Alert',
      summary: `${templateId} message generated for ${audience.length} recipient(s)`,
    });

    return { body, drafts };
  }

  pendingDrafts() {
    return { drafts: this.channel.pending ? this.channel.pending() : [] };
  }
}

export default new AlertService();
