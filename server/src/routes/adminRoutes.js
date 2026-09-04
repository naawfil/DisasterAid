import { Router } from 'express';
import * as controller from '../controllers/adminController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
const managers = authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER);

router.use(authenticate);

router.get('/summary', managers, controller.summary);
router.get('/audit', authorize(ROLES.ADMIN), controller.listAuditLogs);
router.get('/export/:dataset', managers, controller.exportCsv);

export default router;
