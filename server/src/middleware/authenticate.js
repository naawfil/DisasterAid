import userRepository from '../repositories/UserRepository.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/token.js';

/** Answers "who is this?" -- authentication only. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Sign in to continue');
  }

  let payload;
  try {
    payload = verifyAccessToken(header.slice(7));
  } catch {
    throw new ApiError(401, 'Your session has expired. Sign in again.');
  }

  const user = await userRepository.findById(payload.sub);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'This account is no longer active');
  }

  // Role is read from the database, not from the token, so a role change takes
  // effect on the next request instead of when the token expires.
  req.user = user;
  return next();
});
