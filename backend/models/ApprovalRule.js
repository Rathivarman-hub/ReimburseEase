import mongoose from "mongoose";

const approvalRuleSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['sequential', 'percentage', 'specific', 'hybrid'],
    required: true,
  },
  approvers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    order: Number,
    label: String,
  }],
  percentageThreshold: { type: Number, min: 1, max: 100, default: null },
  specificApproverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  minAmountThreshold: { type: Number, default: 0 },
  maxAmountThreshold: { type: Number, default: null },
  isDefault: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const ApprovalRule=mongoose.model('ApprovalRule', approvalRuleSchema)

export default ApprovalRule