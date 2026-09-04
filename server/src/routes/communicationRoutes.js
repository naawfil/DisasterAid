import { Router } from 'express';
import * as controller from '../controllers/communicationController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  announcementRules,
  removeAnnouncementRules,
  alertRules,
} from '../validators/communicationValidators.js';

const router = Router();
const managers = authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER);

// Feature 18: the noticeboard is read-only and public by design.
router.get('/announcements', controller.listAnnouncements);

router.post('/announcements', authenticate, managers, announcementRules, validate, controller.publishAnnouncement);
router.delete(
  '/announcements/:id',
  authenticate,
  authorize(ROLES.ADMIN),
  removeAnnouncementRules,
  validate,
  controller.removeAnnouncement
);

router.get('/alerts/templates', authenticate, managers, controller.listTemplates);
router.post('/alerts', authenticate, managers, alertRules, validate, controller.generateAlert);
router.get('/alerts/drafts', authenticate, managers, controller.pendingDrafts);

export default router;
