import { Router } from 'express';
import * as controller from '../controllers/shelterController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  createShelterRules,
  checkInRules,
  occupantRules,
  registrySearchRules,
} from '../validators/shelterValidators.js';

const router = Router();

// Public: where can I go, and is my family safe?
router.get('/', controller.listShelters);
router.get('/registry/search', registrySearchRules, validate, controller.searchRegistry);
router.get('/:id', controller.getShelter);

// Opening/reconfiguring a shelter (capacity, address, amenities) is a Relief
// Manager / Admin planning decision.
const openers = authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER);

// Day-to-day shelter operations — check-ins, the occupant/safety registry —
// are exactly what FR-06/FR-08 assign to the Shelter Manager role, so that
// role (plus Admin/Relief Manager, who can always step in) is authorized here.
const operators = authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.SHELTER_MANAGER);

router.post('/', authenticate, openers, createShelterRules, validate, controller.createShelter);
router.patch('/:id', authenticate, openers, controller.updateShelter);
router.post('/:id/check-in', authenticate, operators, checkInRules, validate, controller.checkIn);
router.get('/:id/check-ins', authenticate, operators, controller.checkInHistory);
router.post('/:id/occupants', authenticate, operators, occupantRules, validate, controller.registerOccupant);
router.get('/:id/occupants', authenticate, operators, controller.listOccupants);
router.patch('/occupants/:occupantId/check-out', authenticate, operators, controller.checkOutOccupant);

export default router;
