import { Router } from 'express';
import * as controller from '../controllers/inventoryController.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { ROLES } from '../constants/roles.js';
import {
  warehouseRules,
  itemRules,
  donationRules,
  dispatchRules,
  dispatchStatusRules,
  routeNotesRules,
} from '../validators/inventoryValidators.js';

const router = Router();
const managers = authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER);

// Public: the aid-request form reads this so a requester can only pick
// products that genuinely exist in stock right now, not a fixed guess-list.
router.get('/catalog', controller.listCatalog);

router.use(authenticate);

router.get('/warehouses', managers, controller.listWarehouses);
router.post('/warehouses', managers, warehouseRules, validate, controller.createWarehouse);

router.get('/stock', managers, controller.listStock);
router.get('/stock/low', managers, controller.lowStock);
router.post('/stock', managers, itemRules, validate, controller.upsertItem);

router.get('/donations', managers, controller.listDonations);
router.post('/donations', managers, donationRules, validate, controller.logDonation);

router.get('/dispatches', authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.VOLUNTEER), controller.listDispatches);
router.post('/dispatches', managers, dispatchRules, validate, controller.createDispatch);
router.patch('/dispatches/:id/status', managers, dispatchStatusRules, validate, controller.updateDispatchStatus);
router.patch('/dispatches/:id/route-notes', managers, routeNotesRules, validate, controller.updateRouteNotes);

export default router;
