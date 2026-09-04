import auditService from '../services/AuditService.js';
import exportService from '../services/ExportService.js';
import dashboardService from '../services/DashboardService.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listAuditLogs = asyncHandler(async (req, res) => {
  const data = await auditService.list(req.query);
  res.status(200).json({ success: true, data });
});

export const exportCsv = asyncHandler(async (req, res) => {
  const { csv, filename } = await exportService.build(req.params.dataset, req.user);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});

export const summary = asyncHandler(async (_req, res) => {
  const data = await dashboardService.summary();
  res.status(200).json({ success: true, data });
});
