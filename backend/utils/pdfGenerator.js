import PDFDocument from 'pdfkit';

export const generateExpenseReport = (expenses, company, res) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="expense-report-${Date.now()}.pdf"`);
  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#2c3e50').text('Expense Reimbursement Report', { align: 'center' });
  doc.fontSize(12).fillColor('#7f8c8d').text(company.name, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(2);

  // Summary
  const total = expenses.reduce((s, e) => s + (e.convertedAmount || e.amount), 0);
  const approved = expenses.filter(e => e.status === 'approved');
  doc.fontSize(14).fillColor('#2c3e50').text('Summary');
  doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#bdc3c7');
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#34495e');
  doc.text(`Total Expenses: ${expenses.length}`);
  doc.text(`Approved: ${approved.length}`);
  doc.text(`Total Amount: ${company.currency} ${total.toFixed(2)}`);
  doc.moveDown(1.5);

  // Table header
  doc.fontSize(12).fillColor('#2c3e50').text('Expense Details');
  doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#bdc3c7');
  doc.moveDown(0.5);

  expenses.forEach((exp, i) => {
    if (doc.y > 700) doc.addPage();
    const bg = i % 2 === 0 ? '#f8f9fa' : '#ffffff';
    doc.rect(50, doc.y - 2, 510, 60).fill(bg);
    doc.fillColor('#2c3e50').fontSize(10);
    doc.text(`${i + 1}. ${exp.title}`, 55, doc.y);
    doc.fillColor('#7f8c8d').fontSize(9);
    doc.text(`Category: ${exp.category} | Date: ${new Date(exp.date).toLocaleDateString()} | Status: ${exp.status.toUpperCase()}`);
    doc.text(`Amount: ${exp.amount} ${exp.currency} → ${company.currency} ${exp.convertedAmount?.toFixed(2) || exp.amount}`);
    if (exp.description) doc.text(`Note: ${exp.description}`, { width: 500 });
    doc.moveDown(0.5);
  });

  doc.end();
};