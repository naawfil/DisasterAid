import { body, param } from 'express-validator';
import { VOLUNTEER_SKILLS, TASK_STATUS, values } from '../constants/enums.js';

export const profileRules = [
  body('skills').optional().isArray(),
  body('skills.*').isIn(values(VOLUNTEER_SKILLS)).withMessage('Unknown skill'),
  body('baseArea').optional().trim().isLength({ max: 120 }),
];

export const availabilityRules = [
  body('isAvailable').isBoolean().withMessage('Availability must be true or false').toBoolean(),
];

export const taskRules = [
  body('title').trim().notEmpty().withMessage('Give the task a title'),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('assignedTo').optional({ values: 'falsy' }).isMongoId(),
  body('relatedRequest').optional({ values: 'falsy' }).isMongoId(),
  body('relatedShelter').optional({ values: 'falsy' }).isMongoId(),
  body('relatedDispatch').optional({ values: 'falsy' }).isMongoId(),
  body('checklist').optional().isArray(),
  body('checklist.*.label').trim().notEmpty().withMessage('Checklist lines need a label'),
  body('dueAt').optional({ values: 'falsy' }).isISO8601().toDate(),
];

export const assignRules = [param('id').isMongoId(), body('assignedTo').isMongoId().withMessage('Choose a volunteer')];

export const taskStatusRules = [
  param('id').isMongoId(),
  body('status').isIn(values(TASK_STATUS)).withMessage('Unknown task status'),
];

export const checklistRules = [
  param('id').isMongoId(),
  param('index').isInt({ min: 0 }).toInt(),
  body('done').isBoolean().toBoolean(),
];
