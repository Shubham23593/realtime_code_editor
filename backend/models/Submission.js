import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  studentName: { type: String, required: true },
  studentEmail: { type: String, required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  output: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'reviewed', 'graded'], default: 'pending' },
  grade: { type: String, default: '' },
  teacherFeedback: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
