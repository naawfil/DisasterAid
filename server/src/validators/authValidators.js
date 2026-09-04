import { body } from 'express-validator';
import { SELF_ASSIGNABLE_ROLES } from '../constants/roles.js';

export const registerRules = [
  body('name').trim().notEmpty().withMessage('Enter your full name').isLength({ max: 80 }),
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ min: 6, max: 20 })
    .withMessage('Enter a phone number we can reach you on'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Use at least 8 characters')
    .matches(/[0-9]/)
    .withMessage('Include at least one number'),
  body('role').optional().isIn(SELF_ASSIGNABLE_ROLES).withMessage('Choose Public or Volunteer'),
];

export const loginRules = [
  body('email').trim().isEmail().withMessage('Enter a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Enter your password'),
];

export const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Enter your current password'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Use at least 8 characters')
    .matches(/[0-9]/)
    .withMessage('Include at least one number'),
];
