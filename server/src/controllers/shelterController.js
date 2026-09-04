import shelterService from '../services/ShelterService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listShelters = asyncHandler(async (req, res) => {
  const data = await shelterService.list(req.query);
  res.status(200).json({ success: true, data });
});

export const getShelter = asyncHandler(async (req, res) => {
  const shelter = await shelterService.getById(req.params.id);
  res.status(200).json({ success: true, data: { shelter } });
});

export const createShelter = asyncHandler(async (req, res) => {
  const shelter = await shelterService.create(req.body, req.user);
  res.status(201).json({ success: true, data: { shelter } });
});

export const updateShelter = asyncHandler(async (req, res) => {
  const shelter = await shelterService.update(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: { shelter } });
});

export const checkIn = asyncHandler(async (req, res) => {
  const shelter = await shelterService.recordCheckIn(req.params.id, req.body, req.user);
  res.status(200).json({ success: true, data: { shelter } });
});

export const checkInHistory = asyncHandler(async (req, res) => {
  const data = await shelterService.checkInHistory(req.params.id);
  res.status(200).json({ success: true, data });
});

export const registerOccupant = asyncHandler(async (req, res) => {
  const occupant = await shelterService.registerOccupant(req.params.id, req.body, req.user);
  res.status(201).json({ success: true, data: { occupant } });
});

export const listOccupants = asyncHandler(async (req, res) => {
  const data = await shelterService.listOccupants(req.params.id);
  res.status(200).json({ success: true, data });
});

export const checkOutOccupant = asyncHandler(async (req, res) => {
  const occupant = await shelterService.checkOutOccupant(req.params.occupantId, req.user);
  res.status(200).json({ success: true, data: { occupant } });
});

export const searchRegistry = asyncHandler(async (req, res) => {
  const data = await shelterService.searchRegistry(req.query.q || '');
  res.status(200).json({ success: true, data });
});
