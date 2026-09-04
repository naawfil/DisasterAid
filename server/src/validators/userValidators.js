import { body, param, query } from 'express-validator';
import { ROLE_LIST } from '../constants/roles.js';

export const listUsersRules = [
  query('role').optional().isIn(ROLE_LIST),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const changeRoleRules = [
  param('id').isMongoId().withMessage('That user id is not valid'),
  body('role').isIn(ROLE_LIST).withMessage('Choose a valid role'),
];

export const setActiveRules = [
  param('id').isMongoId().withMessage('That user id is not valid'),
  body('isActive').isBoolean().withMessage('isActive must be true or false').toBoolean(),
];
