import { Router } from 'express';
import * as controller from '../controllers/volunteerController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  profileRules,
  availabilityRules,
  taskRules,
  assignRules,
  taskStatusRules,
  checklistRules,
} from '../validators/volunteerValidators.js';

const router = Router();
const managers = authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER);
const anySignedIn = authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.VOLUNTEER);

router.use(authenticate);

// Volunteer's own profile
router.get('/me', anySignedIn, controller.myProfile);
router.patch('/me', anySignedIn, profileRules, validate, controller.updateMyProfile);
router.patch('/me/availability', anySignedIn, availabilityRules, validate, controller.setAvailability);

// Manager views
router.get('/', managers, controller.listVolunteers);
router.get('/assignable', managers, controller.assignableVolunteers);

// Tasks
router.get('/tasks', anySignedIn, controller.listTasks);
router.post('/tasks', managers, taskRules, validate, controller.createTask);
router.patch('/tasks/:id/assign', managers, assignRules, validate, controller.assignTask);
router.patch('/tasks/:id/status', anySignedIn, taskStatusRules, validate, controller.updateTaskStatus);
router.patch('/tasks/:id/checklist/:index', anySignedIn, checklistRules, validate, controller.toggleChecklistItem);

export default router;
