import authService from '../services/AuthService.js';
import asyncHandler from '../utils/asyncHandler.js';

/** Presentation layer: unpack the request, call the service, shape the response. */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({ success: true, data: result });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  res.status(200).json({ success: true, data: { user } });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.status(200).json({ success: true, data: { user } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.user._id, req.body);
  res.status(200).json({ success: true, data: result });
});
