import mongoose from "mongoose";

const companySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  country: { type: String, required: true },
  currency: { type: String, required: true, default: 'USD' },
  currencySymbol: { type: String, default: '$' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Company=mongoose.model('Company', companySchema);

export default Company