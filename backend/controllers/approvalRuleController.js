import ApprovalRule from '../models/ApprovalRule.js';

export const getRules = async (req, res) => {
  try {
    const rules = await ApprovalRule.find({ company: req.user.company._id })
      .populate('approvers.userId', 'name email role')
      .populate('specificApproverId', 'name email');
    res.json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createRule = async (req, res) => {
  try {
    const { name, type, approvers, percentageThreshold, specificApproverId,
      minAmountThreshold, maxAmountThreshold, isDefault } = req.body;

    if (isDefault) {
      await ApprovalRule.updateMany({ company: req.user.company._id }, { isDefault: false });
    }

    const rule = await ApprovalRule.create({
      company: req.user.company._id,
      name, type, 
      approvers: (approvers || []).map((a, i) => ({ ...a, order: a.order ?? i })),
      percentageThreshold, specificApproverId,
      minAmountThreshold, maxAmountThreshold, isDefault,
    });

    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateRule = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.approvers) {
      updateData.approvers = updateData.approvers.map((a, i) => ({ ...a, order: a.order ?? i }));
    }

    const rule = await ApprovalRule.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company._id },
      updateData, { new: true }
    );
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteRule = async (req, res) => {
  try {
    await ApprovalRule.findOneAndDelete({ _id: req.params.id, company: req.user.company._id });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
