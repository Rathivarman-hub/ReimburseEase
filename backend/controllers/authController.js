import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

export const register = async (req, res) => {
  try {
    const { name, email, password, companyName, country, currency, currencySymbol } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const company = await Company.create({ name: companyName, country, currency, currencySymbol });

    const user = await User.create({
      name, email, password, role: 'admin', company: company._id,
    });

    company.admin = user._id;
    await company.save();

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { ...user.toJSON(), company },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('company');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account deactivated' });

    res.json({ success: true, token: generateToken(user._id), user: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
