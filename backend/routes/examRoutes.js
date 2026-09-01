const express = require('express');
const router = express.Router();
const Exam = require('../models/exam');

// Get all exams
router.get('/', async (req, res) => {
    try {
        const { status, subject, sortBy = 'examDate', sortOrder = 'asc' } = req.query;
        
        let query = {};
        if (status) query.status = status;
        if (subject) query.subject = new RegExp(subject, 'i');
        
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        const exams = await Exam.find(query).sort(sortOptions);
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams', error: error.message });
    }
});

// Get upcoming exams
router.get('/upcoming', async (req, res) => {
    try {
        const upcomingExams = await Exam.find({ 
            status: 'upcoming',
            examDate: { $gte: new Date() }
        }).sort({ examDate: 1 });
        
        res.json(upcomingExams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching upcoming exams', error: error.message });
    }
});

// Get completed exams
router.get('/completed', async (req, res) => {
    try {
        const completedExams = await Exam.find({ 
            status: 'completed'
        }).sort({ examDate: -1 });
        
        res.json(completedExams);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching completed exams', error: error.message });
    }
});

// Get analytics data
router.get('/analytics', async (req, res) => {
    try {
        const analytics = await Exam.getAnalyticsData();
        res.json(analytics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam analytics', error: error.message });
    }
});

// Get exam by ID
router.get('/:id', async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exam', error: error.message });
    }
});

// Create new exam
router.post('/', async (req, res) => {
    try {
        const examData = req.body;
        
        // Validate required fields
        if (!examData.subject || !examData.examDate || !examData.maxMarks) {
            return res.status(400).json({ 
                message: 'Missing required fields: subject, examDate, and maxMarks are required' 
            });
        }
        
        const exam = new Exam(examData);
        const savedExam = await exam.save();
        res.status(201).json(savedExam);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: Object.values(error.errors).map(e => e.message) 
            });
        }
        res.status(500).json({ message: 'Error creating exam', error: error.message });
    }
});

// Update exam
router.put('/:id', async (req, res) => {
    try {
        const examData = req.body;
        
        const exam = await Exam.findByIdAndUpdate(
            req.params.id, 
            examData, 
            { 
                new: true, 
                runValidators: true 
            }
        );
        
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        
        res.json(exam);
    } catch (error) {
        console.error('Error updating exam:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: Object.values(error.errors).map(e => e.message) 
            });
        }
        res.status(500).json({ message: 'Error updating exam', error: error.message });
    }
});

// Mark exam as completed with results
router.patch('/:id/complete', async (req, res) => {
    try {
        const { achievedMarks, finalGradePercent, notes } = req.body;
        
        if (achievedMarks === undefined || finalGradePercent === undefined) {
            return res.status(400).json({ 
                message: 'achievedMarks and finalGradePercent are required to complete an exam' 
            });
        }
        
        const exam = await Exam.findById(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        
        exam.achievedMarks = achievedMarks;
        exam.finalGradePercent = finalGradePercent;
        exam.status = 'completed';
        if (notes) exam.notes = notes;
        
        const updatedExam = await exam.save();
        res.json(updatedExam);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                message: 'Validation error', 
                errors: Object.values(error.errors).map(e => e.message) 
            });
        }
        res.status(500).json({ message: 'Error completing exam', error: error.message });
    }
});

// Delete exam
router.delete('/:id', async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }
        res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting exam', error: error.message });
    }
});

// Get grade statistics
router.get('/stats/grades', async (req, res) => {
    try {
        const stats = await Exam.aggregate([
            { $match: { status: 'completed' } },
            {
                $addFields: {
                    gradeRange: {
                        $switch: {
                            branches: [
                                { case: { $gte: ['$percentGrade', 90] }, then: 'A (90-100%)' },
                                { case: { $gte: ['$percentGrade', 80] }, then: 'B (80-89%)' },
                                { case: { $gte: ['$percentGrade', 70] }, then: 'C (70-79%)' },
                                { case: { $gte: ['$percentGrade', 60] }, then: 'D (60-69%)' }
                            ],
                            default: 'F (Below 60%)'
                        }
                    }
                }
            },
            {
                $group: {
                    _id: '$gradeRange',
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching grade statistics', error: error.message });
    }
});

module.exports = router;