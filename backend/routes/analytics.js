import express from 'express';
const router = express.Router();
import { getDashboardStats } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

router.get('/dashboard', protect, authorize('admin'), getDashboardStats);

export default router;