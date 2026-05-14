import User from '../models/User.js';

// @GET /api/users — admin: all users in company
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({ company: req.user.company._id })
      .populate('manager', 'name email role')
      .select('-password');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/users — admin creates employee/manager
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId, isManagerApprover } = req.body;

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: 'Email already in use' });

    const user = await User.create({
      name, email,
      password: password || 'Password@123',
      role: role || 'employee',
      company: req.user.company._id,
      manager: managerId || null,
      isManagerApprover: isManagerApprover || false,
    });

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/users/:id — admin updates role/manager
export const updateUser = async (req, res) => {
  try {
    const { role, managerId, isManagerApprover, isActive, name } = req.body;
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company._id },
      { role, manager: managerId, isManagerApprover, isActive, name },
      { new: true, runValidators: true }
    ).populate('manager', 'name email');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/users/:id — deactivate user
export const deleteUser = async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { _id: req.params.id, company: req.user.company._id },
      { isActive: false }
    );
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/users/managers — get all managers in company
export const getManagers = async (req, res) => {
  try {
    const managers = await User.find({
      company: req.user.company._id,
      role: { $in: ['manager', 'admin'] },
      isActive: true,
    }).select('name email role');
    res.json({ success: true, data: managers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};