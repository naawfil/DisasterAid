import ApiError from '../utils/ApiError.js';
import { isProduction } from '../config/env.js';

export const notFound = (req, _res, next) =>
  next(new ApiError(404, `No route matches ${req.method} ${req.originalUrl}`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let error = err;

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors).map((e) => ({ field: e.path, message: e.message }));
    error = new ApiError(422, 'Some fields need attention', details);
  } else if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || 'value';
    error = new ApiError(409, `That ${field} is already in use`);
  } else if (error.name === 'CastError') {
    error = new ApiError(400, 'That identifier is not valid');
  } else if (!(error instanceof ApiError)) {
    console.error('[unhandled]', err);
    error = new ApiError(500, 'Something went wrong on our side');
  }

  res.status(error.statusCode).json({
    success: false,
    error: {
      message: error.message,
      details: error.details ?? undefined,
      stack: isProduction ? undefined : err.stack,
    },
  });
};
