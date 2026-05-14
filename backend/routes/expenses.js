import express from 'express';
const router = express.Router();
import {
  createExpense, getMyExpenses, getPendingApprovals,
  getAllExpenses, getExpense, approveExpense, rejectExpense, deleteReceipt,
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';
import { generateExpenseReport } from '../utils/pdfGenerator.js';
import Expense from '../models/Expense.js';

router.use(protect);

router.post('/', upload.single('receipt'), createExpense);
router.get('/my', getMyExpenses);
router.get('/pending-approvals', authorize('manager', 'admin'), getPendingApprovals);
router.get('/all', authorize('admin', 'manager'), getAllExpenses);
router.get('/export-pdf', authorize('admin'), async (req, res) => {
  const expenses = await Expense.find({ company: req.user.company._id }).populate('employee', 'name');
  generateExpenseReport(expenses, req.user.company, res);
});
router.get('/:id', getExpense);
router.patch('/:id/approve', authorize('manager', 'admin'), approveExpense);
router.patch('/:id/reject', authorize('manager', 'admin'), rejectExpense);
router.delete('/:id/receipt', deleteReceipt);

export default router;