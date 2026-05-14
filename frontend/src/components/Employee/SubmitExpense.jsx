import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from 'tesseract.js';
import api from '../../utils/api';

const SubmitExpense = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    currency: 'INR',
    category: 'other',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  };

  const runOCR = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setOcrProgress(0);
    
    try {
      const worker = await Tesseract.createWorker({
        logger: m => {
          if (m.status === 'recognizing text') {
            setOcrProgress(parseInt(m.progress * 100));
          }
        }
      });
      
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      parseOCRText(text);
    } catch (err) {
      console.error('OCR Error:', err);
      setError('Failed to extract text from image');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseOCRText = (text) => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Extract description (first few lines)
    const description = lines.slice(0, 3).join(' ');
    
    // Extract amount
    const amountRegex = /(?:total|amount|rs|inr|\$|€|£|₹)\s*[:\-\s]?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i;
    let foundAmount = '';
    for (const line of lines) {
      const match = line.match(amountRegex);
      if (match) {
        foundAmount = match[1].replace(/,/g, '');
        break;
      }
    }
    
    // Extract date
    const dateRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/;
    let foundDate = formData.date;
    for (const line of lines) {
      const match = line.match(dateRegex);
      if (match) {
        // basic normalization, Tesseract dates can be messy. 
        // Just storing raw text for now or trying to parse.
        // We will just leave it as today's date if too complex, or set it if parsed well.
        break;
      }
    }

    // Keyword match for category
    const textLower = text.toLowerCase();
    let category = 'other';
    if (textLower.includes('restaurant') || textLower.includes('food') || textLower.includes('cafe')) category = 'food';
    else if (textLower.includes('uber') || textLower.includes('ola') || textLower.includes('taxi') || textLower.includes('flight')) category = 'travel';
    else if (textLower.includes('hotel') || textLower.includes('room') || textLower.includes('stay')) category = 'accommodation';
    else if (textLower.includes('hospital') || textLower.includes('clinic') || textLower.includes('pharmacy')) category = 'medical';
    
    setFormData(prev => ({
      ...prev,
      description: prev.description || description,
      amount: foundAmount || prev.amount,
      category: category !== 'other' ? category : prev.category
    }));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const data = new FormData();
    data.append('title', formData.title);
    data.append('amount', formData.amount);
    data.append('currency', formData.currency);
    data.append('category', formData.category);
    data.append('date', formData.date);
    data.append('description', formData.description);
    if (file) {
      data.append('receipt', file);
    }

    try {
      await api.post('/expenses', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/employee/history');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3 className="fw-bold mb-4">Submit New Expense</h3>
      
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        {/* Left Panel: OCR Scanner */}
        <div className="col-md-5">
          <div className="card custom-card h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Receipt Scanner</h5>
              
              <div 
                className="border rounded-3 p-4 text-center cursor-pointer mb-3"
                style={{ borderStyle: 'dashed !important', background: '#f8f9fa' }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="d-none" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
                
                {preview ? (
                  <div className="position-relative">
                    <img src={preview} alt="Receipt preview" className="img-fluid rounded shadow-sm" style={{ maxHeight: '300px', width: 'auto' }} />
                    <button className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 rounded-circle" onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}>
                      <i className="bi bi-x"></i>
                    </button>
                  </div>
                ) : (
                  <div className="py-4 py-md-5 text-muted">
                    <i className="bi bi-camera fs-1 mb-2 d-block"></i>
                    <p className="mb-0 fw-semibold">Take a photo or upload receipt</p>
                    <p className="small text-muted">Supports JPG, PNG</p>
                  </div>
                )}
              </div>
              
              {file && (
                <button 
                  className="btn btn-outline-primary w-100" 
                  onClick={runOCR}
                  disabled={isProcessing}
                >
                  <i className="bi bi-magic me-2"></i>
                  {isProcessing ? `Scanning... ${ocrProgress}%` : 'Auto-Fill with AI'}
                </button>
              )}
              
              {isProcessing && (
                <div className="progress mt-3" style={{ height: '8px' }}>
                  <div className="progress-bar progress-bar-striped progress-bar-animated" style={{ width: `${ocrProgress}%` }}></div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Panel: Form */}
        <div className="col-md-7">
          <div className="card custom-card">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold small text-muted">Expense Title</label>
                  <input type="text" name="title" className="form-control bg-light" value={formData.title} onChange={handleChange} required placeholder="e.g. Client Dinner at Olive Garden" />
                </div>
                
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Amount</label>
                    <input type="number" step="0.01" name="amount" className="form-control bg-light" value={formData.amount} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Currency</label>
                    <select name="currency" className="form-select bg-light" value={formData.currency} onChange={handleChange}>
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="JPY">JPY</option>
                      <option value="AED">AED</option>
                      <option value="SGD">SGD</option>
                      <option value="AUD">AUD</option>
                      <option value="CAD">CAD</option>
                      <option value="CNY">CNY</option>
                    </select>
                  </div>
                </div>
                
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Category</label>
                    <select name="category" className="form-select bg-light text-capitalize" value={formData.category} onChange={handleChange}>
                      {['travel', 'food', 'accommodation', 'office', 'medical', 'training', 'other'].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold small text-muted">Date</label>
                    <input type="date" name="date" className="form-control bg-light" value={formData.date} onChange={handleChange} required />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="form-label fw-semibold small text-muted">Description</label>
                  <textarea name="description" className="form-control bg-light" rows="3" value={formData.description} onChange={handleChange}></textarea>
                </div>
                
                <div className="d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary px-5 rounded-pill shadow-sm" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-send me-2"></i>}
                    Submit Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitExpense;
