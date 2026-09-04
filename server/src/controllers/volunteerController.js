import volunteerService from '../services/VolunteerService.js';
import taskService from '../services/TaskService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const myProfile = asyncHandler(async (req, res) => {
  const profile = await volunteerService.getOrCreateProfile(req.user._id);
  res.status(200).json({ success: true, data: { profile } });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await volunteerService.updateProfile(req.user._id, req.body);
  res.status(200).json({ success: true, data: { profile } });
});

export const setAvailability = asyncHandler(async (req, res) => {
  const profile = await volunteerService.setAvailability(req.user._id, req.body.isAvailable, req.user);
  res.status(200).json({ success: true, data: { profile } });
});

export const listVolunteers = asyncHandler(async (req, res) => {
  const data = await volunteerService.list(req.query);
  res.status(200).json({ success: true, data });
});

export const assignableVolunteers = asyncHandler(async (req, res) => {
  const data = await volunteerService.assignable(req.query.skill);
  res.status(200).json({ success: true, data });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await taskService.create(req.body, req.user);
  res.status(201).json({ success: true, data: { task } });
});

export const listTasks = asyncHandler(async (req, res) => {
  const data = await taskService.list(req.query, req.user);
  res.status(200).json({ success: true, data });
});

export const assignTask = asyncHandler(async (req, res) => {
  const task = await taskService.assign(req.params.id, req.body.assignedTo, req.user);
  res.status(200).json({ success: true, data: { task } });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const data = await taskService.remove(req.params.id, req.user);
  res.status(200).json({ success: true, data });
});

export const updateTaskStatus = asyncHandler(async (req, res) => {
  const task = await taskService.updateStatus(req.params.id, req.body.status, req.user);
  res.status(200).json({ success: true, data: { task } });
});

export const toggleChecklistItem = asyncHandler(async (req, res) => {
  const task = await taskService.toggleChecklistItem(
    req.params.id,
    Number(req.params.index),
    req.body.done,
    req.user
  );
  res.status(200).json({ success: true, data: { task } });
});
