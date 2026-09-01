const express = require('express');
const Task = require('../models/task');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

router.post('/newTask', async (req, res) => {
    const { name, subject, dueDate, priority, subtasks, status} = req.body;

    try {
        const newTask = new Task({ name, subject, dueDate, priority, subtasks, status });
        await newTask.save();
        res.status(201).json(newTask);
    } catch (err) { 
        res.status(400).json({ error: 'Failed to add task'});    
    }
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, subject, dueDate, status, priority, subtasks } = req.body;

    // Prepare updates object for modified fields
    const updates = {};

    // Validate and add name if provided
    if (name !== undefined) {
        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ error: 'Name must be a non-empty string' });
        }
        updates.name = name.trim();
    }

    // Validate and add subject if provided
    if (subject !== undefined) {
        if (typeof subject !== 'string' || subject.trim() === '') {
            return res.status(400).json({ error: 'Subject must be a non-empty string' });
        }
        updates.subject = subject.trim();
    }

    // Validate and add dueDate if provided
    if (dueDate !== undefined) {
        const dateObj = new Date(dueDate);
        if (isNaN(dateObj.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }
        updates.dueDate = dateObj;
    }

    // Validate and add status if provided
    if (status !== undefined) {
        const validStatuses = ['not-started', 'in-progress', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status value',
                validValues: validStatuses
            });
        }
        updates.status = status;
    }

    // Validate and add priority if provided
    if (priority !== undefined) {
        const validPriorities = ['low', 'medium', 'high'];
        if (!validPriorities.includes(priority)) {
            return res.status(400).json({ 
                error: 'Invalid priority value',
                validValues: validPriorities
            });
        }
        updates.priority = priority;
    }

    // Validate and add subtasks if provided
    if (subtasks !== undefined) {
        if (!Array.isArray(subtasks)) {
            return res.status(400).json({ error: 'Subtasks must be an array' });
        }
        // Filter out empty strings and trim each subtask
        updates.subtasks = subtasks
            .map(task => task.trim())
            .filter(task => task !== '');
    }

    try {
        // Attempt to update the task with validation options
        const updatedTask = await Task.findByIdAndUpdate(
            id,
            updates,
            { 
                new: true,           // Return the modified document
                runValidators: true  // Run schema validations
            }
        );

        if (!updatedTask) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json(updatedTask);
    } catch (err) {
        console.error('Error during PUT /:id:', err);
        res.status(400).json({ 
            error: 'Failed to update task', 
            details: err.message 
        });
    }
});


router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await Task.findByIdAndDelete(id);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(400).json({ error: 'Failed to delete task' });
    }
});

module.exports = router;