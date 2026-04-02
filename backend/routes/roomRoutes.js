import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/rooms/create — Teacher creates a room
router.post('/create', protect, teacherOnly, async (req, res) => {
  try {
    const { name, mode } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required' });

    const roomId = uuidv4().slice(0, 8).toUpperCase();

    const room = await Room.create({
      roomId,
      name,
      createdBy: req.user._id,
      teacherName: req.user.name,
      mode: mode || 'free',
    });

    res.status(201).json({ room });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Failed to create room' });
  }
});

// GET /api/rooms/my — Get teacher's rooms
router.get('/my', protect, teacherOnly, async (req, res) => {
  try {
    const rooms = await Room.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch rooms' });
  }
});

// GET /api/rooms/:roomId — Get room info (anyone authenticated)
router.get('/:roomId', protect, async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch room' });
  }
});

// PATCH /api/rooms/:roomId/mode — Teacher changes editor mode
router.patch('/:roomId/mode', protect, teacherOnly, async (req, res) => {
  try {
    const { mode } = req.body;
    const validModes = ['teacher', 'raise_hand', 'group', 'free'];
    if (!validModes.includes(mode)) return res.status(400).json({ message: 'Invalid mode' });

    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId, createdBy: req.user._id },
      { mode, activeEditors: [] },
      { new: true }
    );

    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });
    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update mode' });
  }
});

// POST /api/rooms/:roomId/problem — Teacher posts a problem
router.post('/:roomId/problem', protect, teacherOnly, async (req, res) => {
  try {
    const { problem, problemTitle } = req.body;

    const room = await Room.findOneAndUpdate(
      { roomId: req.params.roomId, createdBy: req.user._id },
      { problem, problemTitle },
      { new: true }
    );

    if (!room) return res.status(404).json({ message: 'Room not found or unauthorized' });
    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Failed to post problem' });
  }
});

export default router;
