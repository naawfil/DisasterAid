import { body, param, query } from 'express-validator';
import { AID_CATEGORIES, REQUEST_STATUS, PRIORITY, values } from '../constants/enums.js';

export const submitRules = [
  body('requesterName').trim().notEmpty().withMessage('Enter the name of the person requesting aid'),
  body('contactPhone').trim().isLength({ min: 6, max: 20 }).withMessage('Enter a phone number we can call'),
  body('householdSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  body('items').isArray({ min: 1 }).withMessage('Select at least one kind of aid'),
  body('items.*.category').isIn(values(AID_CATEGORIES)).withMessage('Unknown aid category'),
  body('items.*.quantity').isInt({ min: 1, max: 10000 }).withMessage('Enter how many are needed').toInt(),
  body('items.*.note').optional().trim().isLength({ max: 200 }),
  // Location is either a GPS fix (both fields) or a typed address — at least
  // one of the two is required, but neither is required on its own so a
  // declined/unavailable browser geolocation prompt doesn't dead-end the form.
  body('latitude').optional({ values: 'null' }).isFloat({ min: -90, max: 90 }).withMessage('Latitude looks invalid').toFloat(),
  body('longitude').optional({ values: 'null' }).isFloat({ min: -180, max: 180 }).withMessage('Longitude looks invalid').toFloat(),
  body('address').optional().trim().isLength({ max: 300 }),
  body('notes').optional().trim().isLength({ max: 1000 }),
  body().custom((_, { req }) => {
    const hasLat = req.body.latitude !== undefined && req.body.latitude !== null && req.body.latitude !== '';
    const hasLng = req.body.longitude !== undefined && req.body.longitude !== null && req.body.longitude !== '';
    const hasAddress = typeof req.body.address === 'string' && req.body.address.trim().length > 0;

    if (hasLat !== hasLng) {
      throw new Error('Location needs both latitude and longitude');
    }
    if (!hasLat && !hasAddress) {
      throw new Error('Share your location or type an address so we can find you');
    }
    return true;
  }),
];

export const trackRules = [param('code').trim().notEmpty().withMessage('Enter a tracking code')];

export const selfCancelRules = [
  param('code').trim().notEmpty().withMessage('Enter a tracking code'),
  body('reason').optional().trim().isLength({ max: 300 }),
];

export const selfNoteRules = [
  param('code').trim().notEmpty().withMessage('Enter a tracking code'),
  body('note').trim().notEmpty().isLength({ max: 500 }).withMessage('Enter an update before sending'),
];

export const listRules = [
  query('status').optional().isIn(values(REQUEST_STATUS)),
  query('priority').optional().isIn(values(PRIORITY)),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const statusRules = [
  param('id').isMongoId(),
  body('status').isIn(values(REQUEST_STATUS)).withMessage('Unknown status'),
  body('note').optional().trim().isLength({ max: 300 }),
];

export const priorityRules = [
  param('id').isMongoId(),
  body('priority').isIn(values(PRIORITY)).withMessage('Unknown priority level'),
];

export const removeRules = [param('id').isMongoId()];
