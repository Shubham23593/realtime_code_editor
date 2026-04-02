import express from 'express';
import Submission from '../models/Submission.js';
import { protect, teacherOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/submissions — Student submits code
router.post('/', protect, async (req, res) => {
  try {
    const { roomId, code, language, output } = req.body;

    if (!roomId || !code || !language) {
      return res.status(400).json({ message: 'roomId, code, and language are required' });
    }

    const submission = await Submission.create({
      roomId,
      studentId: req.user._id,
      studentName: req.user.name,
      studentEmail: req.user.email,
      code,
      language,
      output: output || '',
    });

    res.status(201).json({ submission });
  } catch (error) {
    console.error('Submission error:', error);
    res.status(500).json({ message: 'Failed to save submission' });
  }
});

// GET /api/submissions/:roomId — Teacher views all submissions for a room
router.get('/:roomId', protect, teacherOnly, async (req, res) => {
  try {
    const submissions = await Submission.find({ roomId: req.params.roomId }).sort({ createdAt: -1 });
    res.json({ submissions });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

// PATCH /api/submissions/:id/feedback — Teacher gives feedback
router.patch('/:id/feedback', protect, teacherOnly, async (req, res) => {
  try {
    const { grade, teacherFeedback, status } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { grade, teacherFeedback, status: status || 'graded' },
      { new: true }
    );
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json({ submission });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update feedback' });
  }
});

export default router;
