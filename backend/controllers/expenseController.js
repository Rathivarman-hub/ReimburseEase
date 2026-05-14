import Expense from '../models/Expense.js';
import ApprovalRule from '../models/ApprovalRule.js';
import User from '../models/User.js';
import { cloudinary } from '../config/cloudinary.js';
import { sendExpenseNotification } from '../utils/mailer.js';
import axios from 'axios';

// Helper: convert currency
const convertCurrency = async (amount, from, to) => {
  try {
    if (from === to) return amount;
    const { data } = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
    const rate = data.rates[to];
    return rate ? +(amount * rate).toFixed(2) : amount;
  } catch {
    return amount;
  }
};

// Helper: build approval chain from rule
const buildApprovalChain = async (rule, employee) => {
  const chain = [];

  // Manager first if IS_MANAGER_APPROVER
  if (employee.manager && employee.isManagerApprover) {
    const mgr = await User.findById(employee.manager);
    if (mgr) chain.push({ approverId: mgr._id, approverName: mgr.name, approverRole: 'manager', order: 0 });
  }

  if (rule) {
    const offset = chain.length;
    (rule.approvers || []).forEach((a, idx) => {
      // Use idx if a.order is missing to avoid NaN
      const order = (typeof a.order === 'number' ? a.order : idx) + offset;
      chain.push({ 
        approverId: a.userId?._id || a.userId, 
        approverName: a.userId?.name || 'Approver', 
        approverRole: a.userId?.role || 'approver', 
        order, 
        label: a.label 
      });
    });
  }

  return chain.length > 0 ? chain : [];
};

// Helper: check conditional rule satisfaction
const checkConditionalApproval = (expense, rule) => {
  if (!rule) return false;
  const approved = expense.approvalChain.filter(s => s.status === 'approved');

  if (rule.type === 'percentage') {
    const pct = (approved.length / expense.approvalChain.length) * 100;
    return pct >= rule.percentageThreshold;
  }
  if (rule.type === 'specific') {
    return approved.some(s => String(s.approverId) === String(rule.specificApproverId));
  }
  if (rule.type === 'hybrid') {
    const pct = (approved.length / expense.approvalChain.length) * 100;
    const specificOk = approved.some(s => String(s.approverId) === String(rule.specificApproverId));
    return pct >= rule.percentageThreshold || specificOk;
  }
  return false;
};

// @POST /api/expenses
export const createExpense = async (req, res) => {
  try {
    const { title, amount, currency, category, description = '', date } = req.body;
    const employee = await User.findById(req.user._id).populate('manager');
    const companyCurrency = req.user.company?.currency || 'USD';

    const convertedAmount = await convertCurrency(+amount, currency, companyCurrency);

    // Find matching approval rule
    const rule = await ApprovalRule.findOne({
      company: req.user.company._id,
      isActive: true,
      $or: [
        { minAmountThreshold: { $lte: convertedAmount }, maxAmountThreshold: null },
        { minAmountThreshold: { $lte: convertedAmount }, maxAmountThreshold: { $gte: convertedAmount } },
        { isDefault: true }
      ]
    }).sort({ isDefault: 1 });

    const approvalChain = await buildApprovalChain(rule, employee);

    const expense = await Expense.create({
      employee: req.user._id,
      company: req.user.company._id,
      title, amount: +amount, currency, convertedAmount, companyCurrency,
      category, description, date,
      receiptUrl: req.file?.path || null,
      receiptPublicId: req.file?.filename || null,
      approvalChain,
      approvalRule: rule?._id || null,
      currentApproverIndex: 0,
    });

    // Notify first approver
    if (approvalChain.length > 0) {
      const firstApprover = await User.findById(approvalChain[0].approverId);
      if (firstApprover?.email) {
        await sendExpenseNotification(firstApprover.email, 'new_expense', { expense, employee: req.user });
      }
      req.io?.to(String(approvalChain[0].approverId)).emit('new_expense', {
        message: `New expense from ${req.user.name}`,
        expenseId: expense._id,
      });
    }

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/expenses/my
export const getMyExpenses = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { employee: req.user._id };
    if (status) filter.status = status;

    const expenses = await Expense.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('approvalRule', 'name type');

    const total = await Expense.countDocuments(filter);
    res.json({ success: true, data: expenses, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/expenses/pending-approvals
export const getPendingApprovals = async (req, res) => {
  try {
    const expenses = await Expense.find({
      status: 'pending',
      'approvalChain.approverId': req.user._id,
      'approvalChain.status': 'pending',
    }).populate('employee', 'name email').sort({ createdAt: -1 });

    // Filter to only show expenses where it's THIS approver's turn
    const myPending = expenses.filter(e => {
      const step = e.approvalChain[e.currentApproverIndex];
      return step && String(step.approverId) === String(req.user._id);
    });

    res.json({ success: true, data: myPending });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/expenses/all — admin only
export const getAllExpenses = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = { company: req.user.company._id };
    if (status) filter.status = status;

    const expenses = await Expense.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(+limit)
      .populate('employee', 'name email')
      .populate('approvalRule', 'name');

    const total = await Expense.countDocuments(filter);
    res.json({ success: true, data: expenses, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/expenses/:id
export const getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('employee', 'name email')
      .populate('approvalRule');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, data: expense });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/expenses/:id/approve
export const approveExpense = async (req, res) => {
  try {
    const { comment = '' } = req.body;
    const expense = await Expense.findById(req.params.id).populate('approvalRule');
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.status !== 'pending') return res.status(400).json({ success: false, message: 'Expense already processed' });

    const stepIdx = expense.approvalChain.findIndex(
      s => String(s.approverId) === String(req.user._id) && s.status === 'pending'
    );
    if (stepIdx === -1) return res.status(403).json({ success: false, message: 'Not your turn to approve' });
    if (stepIdx !== expense.currentApproverIndex) return res.status(403).json({ success: false, message: 'Not your turn yet' });

    expense.approvalChain[stepIdx].status = 'approved';
    expense.approvalChain[stepIdx].comment = comment;
    expense.approvalChain[stepIdx].actionAt = new Date();

    const rule = expense.approvalRule;
    const isConditionalSatisfied = rule && ['percentage', 'specific', 'hybrid'].includes(rule.type)
      ? checkConditionalApproval(expense, rule) : false;

    const isLastStep = expense.currentApproverIndex === expense.approvalChain.length - 1;

    if (isLastStep || isConditionalSatisfied) {
      expense.status = 'approved';
    } else {
      expense.currentApproverIndex += 1;
      // Notify next approver
      const next = expense.approvalChain[expense.currentApproverIndex];
      if (next) {
        const nextUser = await User.findById(next.approverId);
        if (nextUser?.email) {
          await sendExpenseNotification(nextUser.email, 'approval_request', {
            expense, approver: nextUser
          });
        }
        req.io?.to(String(next.approverId)).emit('approval_request', {
          message: `Expense needs your approval`,
          expenseId: expense._id,
        });
      }
    }

    await expense.save();

    // Notify employee
    const emp = await User.findById(expense.employee);
    if (emp?.email && expense.status === 'approved') {
      await sendExpenseNotification(emp.email, 'expense_approved', { expense, employee: emp });
    }
    req.io?.to(String(expense.employee)).emit('expense_update', {
      message: expense.status === 'approved' ? 'Your expense was approved!' : 'Your expense moved to next approver',
      expenseId: expense._id, status: expense.status,
    });

    res.json({ success: true, data: expense, message: expense.status === 'approved' ? 'Expense fully approved' : 'Approved, moved to next approver' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/expenses/:id/reject
export const rejectExpense = async (req, res) => {
  try {
    const { comment = '' } = req.body;
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    if (expense.status !== 'pending') return res.status(400).json({ success: false, message: 'Expense already processed' });

    const stepIdx = expense.approvalChain.findIndex(
      s => String(s.approverId) === String(req.user._id) && s.status === 'pending'
    );
    if (stepIdx === -1 || stepIdx !== expense.currentApproverIndex) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this expense' });
    }

    expense.approvalChain[stepIdx].status = 'rejected';
    expense.approvalChain[stepIdx].comment = comment;
    expense.approvalChain[stepIdx].actionAt = new Date();
    expense.status = 'rejected';
    expense.finalComment = comment;
    await expense.save();

    const emp = await User.findById(expense.employee);
    if (emp?.email) {
      await sendExpenseNotification(emp.email, 'expense_rejected', { expense, employee: emp, comment });
    }
    req.io?.to(String(expense.employee)).emit('expense_update', {
      message: 'Your expense was rejected', expenseId: expense._id, status: 'rejected',
    });

    res.json({ success: true, data: expense, message: 'Expense rejected' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/expenses/:id/receipt — remove cloudinary image
export const deleteReceipt = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Not found' });
    if (expense.receiptPublicId) {
      await cloudinary.uploader.destroy(expense.receiptPublicId);
      expense.receiptUrl = null;
      expense.receiptPublicId = null;
      await expense.save();
    }
    res.json({ success: true, message: 'Receipt removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
