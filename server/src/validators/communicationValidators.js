import { body, param } from 'express-validator';
import { SEVERITY, values } from '../constants/enums.js';

export const announcementRules = [
  body('title').trim().notEmpty().withMessage('Give the notice a headline').isLength({ max: 160 }),
  body('body').trim().notEmpty().withMessage('Write the notice text').isLength({ max: 2000 }),
  body('severity').optional().isIn(values(SEVERITY)),
  body('area').optional().trim().isLength({ max: 120 }),
  body('expiresAt').optional({ values: 'falsy' }).isISO8601().toDate(),
  body('isPinned').optional().isBoolean().toBoolean(),
];

export const removeAnnouncementRules = [param('id').isMongoId()];

export const alertRules = [
  body('templateId').trim().notEmpty().withMessage('Choose a template'),
  body('values').isObject().withMessage('Fill in the template fields'),
  body('recipients').optional().isArray(),
];
