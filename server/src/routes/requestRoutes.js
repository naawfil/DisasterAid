import { Router } from 'express';
import * as controller from '../controllers/requestController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  submitRules,
  trackRules,
  selfCancelRules,
  selfNoteRules,
  listRules,
  statusRules,
  priorityRules,
  removeRules,
} from '../validators/requestValidators.js';

const router = Router();

// Deliberately public: a victim without an account still needs to ask for help,
// still needs to see what happened to their request, and — since they have no
// login — the tracking code itself is what proves the request is theirs to
// cancel or add a note to.
router.post('/', submitRules, validate, controller.submitRequest);
router.get('/track/:code', trackRules, validate, controller.trackRequest);
router.patch('/track/:code/cancel', selfCancelRules, validate, controller.cancelByTrackingCode);
router.post('/track/:code/note', selfNoteRules, validate, controller.addNoteByTrackingCode);

router.get(
  '/',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.VOLUNTEER),
  listRules,
  validate,
  controller.listRequests
);

router.get(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.VOLUNTEER),
  controller.getRequest
);

router.patch(
  '/:id/status',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.VOLUNTEER),
  statusRules,
  validate,
  controller.updateStatus
);

router.patch(
  '/:id/priority',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER),
  priorityRules,
  validate,
  controller.updatePriority
);

// Deleting a request is a manager-level action — volunteers can update the
// requests assigned to them, but removing one outright stays with the roles
// that can also triage and dispatch.
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER),
  removeRules,
  validate,
  controller.deleteRequest
);

export default router;
