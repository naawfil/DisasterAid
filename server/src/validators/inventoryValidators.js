import { body, param } from 'express-validator';
import { AID_CATEGORIES, DONOR_TYPES, DISPATCH_STATUS, DESTINATION_TYPES, values } from '../constants/enums.js';

export const warehouseRules = [
  body('name').trim().notEmpty().withMessage('Enter a warehouse name'),
  body('address').trim().notEmpty().withMessage('Enter the address'),
];

export const itemRules = [
  body('warehouse').isMongoId().withMessage('Choose a warehouse'),
  body('name').trim().notEmpty().withMessage('Enter the item name'),
  body('category').isIn(values(AID_CATEGORIES)).withMessage('Choose a category'),
  body('quantity').isInt({ min: 0 }).withMessage('Enter the quantity').toInt(),
  body('lowStockThreshold').optional().isInt({ min: 0 }).toInt(),
  body('unit').optional().trim().isLength({ max: 20 }),
  body('mode').optional().isIn(['set', 'add']).withMessage('mode must be "set" or "add"'),
];

export const donationRules = [
  body('warehouse').isMongoId().withMessage('Choose the receiving warehouse'),
  body('donorName').trim().notEmpty().withMessage('Enter the donor name'),
  body('donorType').optional().isIn(values(DONOR_TYPES)),
  body('items').isArray({ min: 1 }).withMessage('Add at least one donated item'),
  body('items.*.name').trim().notEmpty().withMessage('Every line needs an item name'),
  body('items.*.category').isIn(values(AID_CATEGORIES)).withMessage('Every line needs a category'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Every line needs a quantity').toInt(),
];

export const dispatchRules = [
  body('warehouse').isMongoId().withMessage('Choose the source warehouse'),
  body('destinationType').isIn(values(DESTINATION_TYPES)).withMessage('Choose a destination type'),
  body('destinationShelter').optional({ values: 'falsy' }).isMongoId(),
  body('destinationRequest').optional({ values: 'falsy' }).isMongoId(),
  body('items').isArray({ min: 1 }).withMessage('Add at least one item to dispatch'),
  body('items.*.inventoryItem').isMongoId().withMessage('Choose an item'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Enter a quantity').toInt(),
  body('routeNotes').optional().trim().isLength({ max: 600 }),
  body().custom((payload) => {
    if (payload.destinationType === DESTINATION_TYPES.SHELTER && !payload.destinationShelter) {
      throw new Error('Choose the destination shelter');
    }
    if (payload.destinationType === DESTINATION_TYPES.REQUEST && !payload.destinationRequest) {
      throw new Error('Choose the destination request');
    }
    return true;
  }),
];

export const dispatchStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(values(DISPATCH_STATUS)).withMessage('Unknown dispatch status'),
];

export const routeNotesRules = [
  param('id').isMongoId(),
  body('routeNotes').trim().isLength({ max: 600 }),
];
