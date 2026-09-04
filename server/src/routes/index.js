import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import requestRoutes from './requestRoutes.js';
import shelterRoutes from './shelterRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import volunteerRoutes from './volunteerRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import adminRoutes from './adminRoutes.js';

const router = Router();

router.get('/health', (_req, res) =>
  res.json({ success: true, data: { status: 'ok', uptime: process.uptime() } })
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/requests', requestRoutes);
router.use('/shelters', shelterRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/volunteers', volunteerRoutes);
router.use('/comms', communicationRoutes);
router.use('/admin', adminRoutes);

export default router;
