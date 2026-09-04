import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import { listUsersRules, changeRoleRules, setActiveRules } from '../validators/userValidators.js';

const router = Router();

// Every route below needs a signed-in user.
router.use(authenticate);

router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER),
  listUsersRules,
  validate,
  userController.listUsers
);

router.patch('/:id/role', authorize(ROLES.ADMIN), changeRoleRules, validate, userController.changeRole);

router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER),
  setActiveRules,
  validate,
  userController.setActive
);

export default router;
