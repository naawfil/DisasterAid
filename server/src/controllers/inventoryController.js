import inventoryService from '../services/InventoryService.js';
import dispatchService from '../services/DispatchService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listWarehouses = asyncHandler(async (req, res) => {
  const data = await inventoryService.listWarehouses();
  res.status(200).json({ success: true, data });
});

export const createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await inventoryService.createWarehouse(req.body, req.user);
  res.status(201).json({ success: true, data: { warehouse } });
});

export const listStock = asyncHandler(async (req, res) => {
  const data = await inventoryService.listStock(req.query.warehouse);
  res.status(200).json({ success: true, data });
});

export const lowStock = asyncHandler(async (_req, res) => {
  const data = await inventoryService.lowStock();
  res.status(200).json({ success: true, data });
});

export const listCatalog = asyncHandler(async (_req, res) => {
  const data = await inventoryService.publicCatalog();
  res.status(200).json({ success: true, data });
});

export const upsertItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.upsertItem(req.body, req.user);
  res.status(201).json({ success: true, data: { item } });
});

export const logDonation = asyncHandler(async (req, res) => {
  const donation = await inventoryService.logDonation(req.body, req.user);
  res.status(201).json({ success: true, data: { donation } });
});

export const listDonations = asyncHandler(async (req, res) => {
  const data = await inventoryService.listDonations(req.query);
  res.status(200).json({ success: true, data });
});

export const createDispatch = asyncHandler(async (req, res) => {
  const order = await dispatchService.create(req.body, req.user);
  res.status(201).json({ success: true, data: { order } });
});

export const listDispatches = asyncHandler(async (req, res) => {
  const data = await dispatchService.list(req.query);
  res.status(200).json({ success: true, data });
});

export const updateDispatchStatus = asyncHandler(async (req, res) => {
  const order = await dispatchService.updateStatus(req.params.id, req.body.status, req.user);
  res.status(200).json({ success: true, data: { order } });
});

export const updateRouteNotes = asyncHandler(async (req, res) => {
  const order = await dispatchService.setRouteNotes(req.params.id, req.body.routeNotes, req.user);
  res.status(200).json({ success: true, data: { order } });
});
