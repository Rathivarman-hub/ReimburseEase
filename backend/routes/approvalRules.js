import express from 'express';
const router = express.Router();
import { getRules, createRule, updateRule, deleteRule } from '../controllers/approvalRuleController.js';
import { protect, authorize } from '../middleware/auth.js';

router.use(protect, authorize('admin'));
router.get('/', getRules);
router.post('/', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

export default router;