import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, required: true },
  mode: {
    type: String,
    enum: ['teacher', 'raise_hand', 'group', 'free'],
    default: 'free'
  },
  maxGroupEditors: { type: Number, default: 5 },
  activeEditors: [{ type: String }], // usernames allowed to edit
  problem: { type: String, default: '' },
  problemTitle: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Room', roomSchema);
