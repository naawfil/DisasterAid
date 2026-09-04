import userService from '../services/UserService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const data = await userService.list(req.query);
  res.status(200).json({ success: true, data });
});

export const changeRole = asyncHandler(async (req, res) => {
  const user = await userService.changeRole(req.user, req.params.id, req.body.role);
  res.status(200).json({ success: true, data: { user } });
});

export const setActive = asyncHandler(async (req, res) => {
  const user = await userService.setActive(req.user, req.params.id, req.body.isActive);
  res.status(200).json({ success: true, data: { user } });
});
