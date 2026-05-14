import express from 'express';
const router = express.Router();
import { getUsers, createUser, updateUser, deleteUser, getManagers } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

router.use(protect);
router.get('/managers', getManagers);
router.get('/', authorize('admin'), getUsers);
router.post('/', authorize('admin'), createUser);
router.put('/:id', authorize('admin'), updateUser);
router.delete('/:id', authorize('admin'), deleteUser);

export default router;