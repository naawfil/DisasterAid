import ApiError from '../utils/ApiError.js';

/**
 * Role-Based Access Control (feature 20).
 *
 * Answers "is this person allowed to do it?" -- runs after authenticate.
 * Enforced on the server, so hiding a button in React is presentation only.
 *
 *   router.post('/', authenticate, authorize(ROLES.ADMIN, ROLES.RELIEF_MANAGER), handler)
 */
export const authorize =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.user) return next(new ApiError(401, 'Sign in to continue'));

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'Your role does not have access to this action'));
    }

    return next();
  };
