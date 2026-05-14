import mongoose from "mongoose";

const approvalStepSchema = new mongoose.Schema({
  approverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approverName: String,
  approverRole: String,
  order: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comment: { type: String, default: '' },
  actionAt: { type: Date },
}, { _id: false });

const expenseSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  convertedAmount: { type: Number },
  companyCurrency: { type: String },
  category: {
    type: String,
    enum: ['travel', 'food', 'accommodation', 'office', 'medical', 'training', 'other'],
    required: true,
  },
  description: { type: String },
  date: { type: Date, required: true },
  receiptUrl: { type: String, default: null },
  receiptPublicId: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'partially_approved'],
    default: 'pending',
  },
  approvalChain: [approvalStepSchema],
  currentApproverIndex: { type: Number, default: 0 },
  approvalRule: { type: mongoose.Schema.Types.ObjectId, ref: 'ApprovalRule', default: null },
  managerApproved: { type: Boolean, default: false },
  finalComment: { type: String, default: '' },
}, { timestamps: true });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense