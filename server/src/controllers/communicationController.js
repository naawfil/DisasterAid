import announcementService from '../services/AnnouncementService.js';
import alertService from '../services/AlertService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listAnnouncements = asyncHandler(async (_req, res) => {
  const data = await announcementService.listLive();
  res.status(200).json({ success: true, data });
});

export const publishAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await announcementService.publish(req.body, req.user);
  res.status(201).json({ success: true, data: { announcement } });
});

export const removeAnnouncement = asyncHandler(async (req, res) => {
  const data = await announcementService.remove(req.params.id, req.user);
  res.status(200).json({ success: true, data });
});

export const listTemplates = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: alertService.listTemplates() });
});

export const generateAlert = asyncHandler(async (req, res) => {
  const data = await alertService.generate(req.body, req.user);
  res.status(201).json({ success: true, data });
});

export const pendingDrafts = asyncHandler(async (_req, res) => {
  res.status(200).json({ success: true, data: alertService.pendingDrafts() });
});
