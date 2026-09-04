import requestService from '../services/RequestService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const submitRequest = asyncHandler(async (req, res) => {
  const request = await requestService.submit(req.body, req.user || null);
  res.status(201).json({ success: true, data: { request } });
});

export const trackRequest = asyncHandler(async (req, res) => {
  const request = await requestService.track(req.params.code);
  res.status(200).json({ success: true, data: { request } });
});

export const cancelByTrackingCode = asyncHandler(async (req, res) => {
  const request = await requestService.cancelByCode(req.params.code, req.body.reason);
  res.status(200).json({ success: true, data: { request } });
});

export const addNoteByTrackingCode = asyncHandler(async (req, res) => {
  const request = await requestService.addNoteByCode(req.params.code, req.body.note);
  res.status(200).json({ success: true, data: { request } });
});

export const listRequests = asyncHandler(async (req, res) => {
  const data = await requestService.queue(req.query, req.user);
  res.status(200).json({ success: true, data });
});

export const getRequest = asyncHandler(async (req, res) => {
  const request = await requestService.getById(req.params.id, req.user);
  res.status(200).json({ success: true, data: { request } });
});

export const updateStatus = asyncHandler(async (req, res) => {
  const request = await requestService.changeStatus(req.params.id, req.body.status, req.user, req.body.note);
  res.status(200).json({ success: true, data: { request } });
});

export const updatePriority = asyncHandler(async (req, res) => {
  const request = await requestService.setPriority(req.params.id, req.body.priority, req.user);
  res.status(200).json({ success: true, data: { request } });
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const data = await requestService.remove(req.params.id, req.user);
  res.status(200).json({ success: true, data });
});
