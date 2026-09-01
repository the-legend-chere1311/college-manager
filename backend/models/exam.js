const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    subject: { 
        type: String, 
        required: true 
    },
    examDate: { 
        type: Date, 
        required: true 
    },
    maxMarks: { 
        type: Number, 
        required: true,
        min: 1
    },
    achievedMarks: { 
        type: Number, 
        required: function() {
            return this.status === 'completed';
        },
        min: 0,
        validate: {
            validator: function(value) {
                // Only validate if value is provided and maxMarks exists
                if (value == null || this.maxMarks == null) return true;
                return value <= this.maxMarks;
            },
            message: 'Achieved marks cannot exceed maximum marks'
        }
    },
    percentGrade: { 
        type: Number,
        min: 0,
        max: 100,
        get: function() {
            if (this.achievedMarks !== undefined && this.maxMarks > 0) {
                return Math.round((this.achievedMarks / this.maxMarks) * 100 * 100) / 100; // Round to 2 decimal places
            }
            return null;
        }
    },
    finalGradePercent: { 
        type: Number,
        min: 0,
        max: 100
        // Removed required validation since this is now auto-calculated
    },
    status: {
        type: String,
        enum: ['upcoming', 'completed'],
        default: 'upcoming'
    },
    examType: {
        type: String,
        enum: ['midterm', 'final', 'quiz', 'assignment', 'project'],
        default: 'midterm'
    },
    notes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Pre-save middleware to calculate percentGrade and finalGradePercent automatically
examSchema.pre('save', function(next) {
    if (this.achievedMarks !== undefined && this.maxMarks > 0) {
        const calculatedPercent = Math.round((this.achievedMarks / this.maxMarks) * 100 * 100) / 100;
        this.percentGrade = calculatedPercent;
        // Automatically set finalGradePercent to the same value as percentGrade
        this.finalGradePercent = calculatedPercent;
    }
    next();
});

// Virtual for getting letter grade
examSchema.virtual('letterGrade').get(function() {
    if (!this.percentGrade) return null;
    
    if (this.percentGrade >= 90) return 'A+';
    if (this.percentGrade >= 85) return 'A';
    if (this.percentGrade >= 80) return 'A-';
    if (this.percentGrade >= 77) return 'B+';
    if (this.percentGrade >= 73) return 'B';
    if (this.percentGrade >= 70) return 'B-';
    if (this.percentGrade >= 67) return 'C+';
    if (this.percentGrade >= 63) return 'C';
    if (this.percentGrade >= 60) return 'C-';
    if (this.percentGrade >= 57) return 'D+';
    if (this.percentGrade >= 53) return 'D';
    if (this.percentGrade >= 50) return 'D-';
    return 'F';
});

// Static method to get analytics data
examSchema.statics.getAnalyticsData = async function() {
    const analytics = await this.aggregate([
        {
            $match: { status: 'completed' }
        },
        {
            $group: {
                _id: null,
                averageGrade: { $avg: '$percentGrade' },
                totalExams: { $sum: 1 },
                maxGrade: { $max: '$percentGrade' },
                minGrade: { $min: '$percentGrade' },
                subjectBreakdown: {
                    $push: {
                        subject: '$subject',
                        grade: '$percentGrade',
                        finalGradePercent: '$finalGradePercent'
                    }
                }
            }
        }
    ]);

    const subjectAnalytics = await this.aggregate([
        {
            $match: { status: 'completed' }
        },
        {
            $group: {
                _id: '$subject',
                averageGrade: { $avg: '$percentGrade' },
                examCount: { $sum: 1 },
                totalFinalGradePercent: { $sum: '$finalGradePercent' }
            }
        },
        {
            $sort: { averageGrade: -1 }
        }
    ]);

    return {
        overall: analytics[0] || null,
        bySubject: subjectAnalytics
    };
};

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
