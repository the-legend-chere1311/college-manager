const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    dueDate: { type: Date, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], required: true },
    subtasks: { type: [String], default: [] },
    status: { type: String, enum: ['not-started', 'in-progress', 'completed'], default: 'not-started' },
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
