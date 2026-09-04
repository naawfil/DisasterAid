import { body, param, query } from 'express-validator';
import { AMENITIES, values } from '../constants/enums.js';

export const createShelterRules = [
  body('name').trim().notEmpty().withMessage('Enter the shelter name'),
  body('address').trim().notEmpty().withMessage('Enter the address'),
  body('maxCapacity').isInt({ min: 1, max: 100000 }).withMessage('Enter the maximum capacity').toInt(),
  body('amenities').optional().isArray(),
  body('amenities.*').isIn(values(AMENITIES)).withMessage('Unknown amenity'),
  body('contactPhone').optional().trim().isLength({ max: 20 }),
  body('latitude').optional().isFloat({ min: -90, max: 90 }).toFloat(),
  body('longitude').optional().isFloat({ min: -180, max: 180 }).toFloat(),
];

export const checkInRules = [
  param('id').isMongoId(),
  body('delta')
    .isInt({ min: -500, max: 500 })
    .withMessage('Enter how many people arrived or left')
    .toInt()
    .custom((v) => v !== 0)
    .withMessage('Enter a number other than zero'),
  body('reason').optional().trim().isLength({ max: 200 }),
];

export const occupantRules = [
  param('id').isMongoId(),
  body('fullName').trim().notEmpty().withMessage('Enter the person’s name'),
  body('hometown').trim().notEmpty().withMessage('Enter their hometown'),
  body('ageGroup').optional().isIn(['CHILD', 'ADULT', 'ELDERLY']),
];

export const registrySearchRules = [
  query('q').trim().isLength({ min: 2 }).withMessage('Enter at least two characters'),
];
