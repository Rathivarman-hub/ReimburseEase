import Expense from '../models/Expense.js';

export const getDashboardStats = async (req, res) => {
  try {
    const companyId = req.user.company._id;

    const [total, pending, approved, rejected] = await Promise.all([
      Expense.countDocuments({ company: companyId }),
      Expense.countDocuments({ company: companyId, status: 'pending' }),
      Expense.countDocuments({ company: companyId, status: 'approved' }),
      Expense.countDocuments({ company: companyId, status: 'rejected' }),
    ]);

    const totalApprovedAmount = await Expense.aggregate([
      { $match: { company: companyId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: '$convertedAmount' } } },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$category', count: { $sum: 1 }, total: { $sum: '$convertedAmount' } } },
    ]);

    const last6Months = await Expense.aggregate([
      { $match: { company: companyId, createdAt: { $gte: new Date(Date.now() - 180 * 86400000) } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 }, total: { $sum: '$convertedAmount' },
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({
      success: true,
      totalExpenses: total,
      pendingExpenses: pending,
      approvedExpenses: approved,
      rejectedExpenses: rejected,
      totalApprovedAmount: totalApprovedAmount[0]?.total || 0,
      monthlyTotals: last6Months.map(m => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return {
          month: `${monthNames[m._id.month - 1]} ${m._id.year}`,
          total: m.total
        };
      }),
      categoryDistribution: byCategory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
