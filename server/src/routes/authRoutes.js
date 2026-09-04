import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { registerRules, loginRules, changePasswordRules } from '../validators/authValidators.js';

const router = Router();

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.get('/me', authenticate, authController.me);
router.patch('/me', authenticate, authController.updateMe);
router.patch('/me/password', authenticate, changePasswordRules, validate, authController.changePassword);

export default router;
