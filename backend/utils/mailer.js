import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const templates = {
  new_expense: (d) => ({
    subject: `New Expense Submitted: ${d.expense.title}`,
    html: `<h3>New Expense Awaiting Approval</h3>
           <p><b>From:</b> ${d.employee.name}</p>
           <p><b>Title:</b> ${d.expense.title}</p>
           <p><b>Amount:</b> ${d.expense.amount} ${d.expense.currency}</p>
           <p><b>Category:</b> ${d.expense.category}</p>
           <p>Please login to review and approve/reject this expense.</p>`,
  }),
  approval_request: (d) => ({
    subject: `Action Required: Expense Approval - ${d.expense.title}`,
    html: `<h3>Expense Awaiting Your Approval</h3>
           <p><b>Title:</b> ${d.expense.title}</p>
           <p><b>Amount:</b> ${d.expense.amount} ${d.expense.currency}</p>
           <p>Please login to take action.</p>`,
  }),
  expense_approved: (d) => ({
    subject: `✅ Expense Approved: ${d.expense.title}`,
    html: `<h3>Your expense has been approved!</h3>
           <p><b>Title:</b> ${d.expense.title}</p>
           <p><b>Amount:</b> ${d.expense.amount} ${d.expense.currency}</p>
           <p>Your reimbursement will be processed shortly.</p>`,
  }),
  expense_rejected: (d) => ({
    subject: `❌ Expense Rejected: ${d.expense.title}`,
    html: `<h3>Your expense was rejected</h3>
           <p><b>Title:</b> ${d.expense.title}</p>
           <p><b>Reason:</b> ${d.comment || 'No reason provided'}</p>`,
  }),
};

export const sendExpenseNotification = async (to, type, data) => {
  try {
    if (!process.env.EMAIL_USER) return; // Skip if not configured
    const template = templates[type]?.(data);
    if (!template) return;
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, ...template });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};