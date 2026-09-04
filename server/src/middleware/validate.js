import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map(({ path, msg }) => ({ field: path, message: msg }));
  return next(new ApiError(422, 'Some fields need attention', details));
};
