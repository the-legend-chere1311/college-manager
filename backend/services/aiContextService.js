const Exam = require('../models/exam');
const Task = require('../models/task');

class AIContextService {
    /**
     * Get comprehensive context data for AI assistant
     * @param {string} query - The user's query to determine relevant context
     * @returns {Object} Formatted context data for AI
     */
    async getContextForQuery(query = '') {
        const context = {
            timestamp: new Date().toISOString(),
            query: query.toLowerCase(),
            data: {}
        };

        // Determine what data to fetch based on query keywords
        const needsExams = this.queryMentions(query, ['exam', 'test', 'study', 'grade', 'score', 'subject', 'plan']);
        const needsTasks = this.queryMentions(query, ['task', 'assignment', 'homework', 'due', 'deadline', 'project']);
        const needsSchedule = this.queryMentions(query, ['schedule', 'plan', 'time', 'when', 'today', 'week', 'calendar']);

        try {
            // Always fetch upcoming exams for study planning
            if (needsExams || needsSchedule || query.includes('study')) {
                context.data.exams = await this.getExamContext();
            }

            // Fetch tasks if relevant
            if (needsTasks || needsSchedule || query.includes('plan')) {
                context.data.tasks = await this.getTaskContext();
            }

            // Add current date context
            context.data.currentDate = {
                date: new Date().toISOString().split('T')[0],
                dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
                formatted: new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })
            };

            return context;
        } catch (error) {
            console.error('Error fetching AI context:', error);
            return {
                timestamp: new Date().toISOString(),
                query: query.toLowerCase(),
                data: {
                    error: 'Unable to fetch current data',
                    currentDate: {
                        date: new Date().toISOString().split('T')[0],
                        formatted: new Date().toLocaleDateString('en-US')
                    }
                }
            };
        }
    }

    /**
     * Get exam-related context
     */
    async getExamContext() {
        const now = new Date();
        const oneMonthFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

        // Get upcoming exams
        const upcomingExams = await Exam.find({
            status: 'upcoming',
            examDate: { 
                $gte: now,
                $lte: oneMonthFromNow 
            }
        }).sort({ examDate: 1 }).limit(10);

        // Get recent completed exams for performance context
        const recentExams = await Exam.find({
            status: 'completed'
        }).sort({ examDate: -1 }).limit(5);

        // Calculate subject performance
        const subjectPerformance = await this.getSubjectPerformance();

        return {
            upcoming: upcomingExams.map(exam => ({
                subject: exam.subject,
                date: exam.examDate.toISOString().split('T')[0],
                daysUntil: Math.ceil((exam.examDate - now) / (1000 * 60 * 60 * 24)),
                type: exam.examType,
                maxMarks: exam.maxMarks,
                notes: exam.notes
            })),
            recent: recentExams.map(exam => ({
                subject: exam.subject,
                date: exam.examDate.toISOString().split('T')[0],
                percentage: exam.percentGrade,
                letterGrade: exam.letterGrade,
                type: exam.examType
            })),
            subjectPerformance,
            totalUpcoming: upcomingExams.length
        };
    }

    /**
     * Get task-related context
     */
    async getTaskContext() {
        const now = new Date();
        const oneWeekFromNow = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));

        // Get upcoming tasks
        const upcomingTasks = await Task.find({
            dueDate: { $gte: now },
            status: { $ne: 'completed' }
        }).sort({ dueDate: 1 }).limit(10);

        // Get overdue tasks
        const overdueTasks = await Task.find({
            dueDate: { $lt: now },
            status: { $ne: 'completed' }
        }).sort({ dueDate: 1 });

        // Get tasks by priority
        const tasksByPriority = await Task.aggregate([
            { 
                $match: { 
                    status: { $ne: 'completed' },
                    dueDate: { $gte: now }
                } 
            },
            { 
                $group: { 
                    _id: '$priority', 
                    count: { $sum: 1 },
                    tasks: { $push: { name: '$name', subject: '$subject', dueDate: '$dueDate' } }
                } 
            }
        ]);

        return {
            upcoming: upcomingTasks.map(task => ({
                name: task.name,
                subject: task.subject,
                dueDate: task.dueDate.toISOString().split('T')[0],
                daysUntil: Math.ceil((task.dueDate - now) / (1000 * 60 * 60 * 24)),
                priority: task.priority,
                status: task.status,
                subtasks: task.subtasks
            })),
            overdue: overdueTasks.map(task => ({
                name: task.name,
                subject: task.subject,
                dueDate: task.dueDate.toISOString().split('T')[0],
                daysOverdue: Math.ceil((now - task.dueDate) / (1000 * 60 * 60 * 24)),
                priority: task.priority
            })),
            byPriority: tasksByPriority,
            totalActive: upcomingTasks.length,
            totalOverdue: overdueTasks.length
        };
    }

    /**
     * Calculate subject performance from completed exams
     */
    async getSubjectPerformance() {
        const performance = await Exam.aggregate([
            { 
                $match: { 
                    status: 'completed',
                    percentGrade: { $exists: true, $ne: null }
                } 
            },
            {
                $group: {
                    _id: '$subject',
                    averageGrade: { $avg: '$percentGrade' },
                    examCount: { $sum: 1 },
                    lastExamGrade: { $last: '$percentGrade' },
                    bestGrade: { $max: '$percentGrade' },
                    worstGrade: { $min: '$percentGrade' }
                }
            },
            { 
                $sort: { averageGrade: -1 } 
            }
        ]);

        return performance.map(subject => ({
            subject: subject._id,
            average: Math.round(subject.averageGrade * 100) / 100,
            examCount: subject.examCount,
            lastGrade: subject.lastExamGrade,
            best: subject.bestGrade,
            worst: subject.worstGrade,
            trend: subject.lastExamGrade > subject.averageGrade ? 'improving' : 
                   subject.lastExamGrade < subject.averageGrade ? 'declining' : 'stable'
        }));
    }

    /**
     * Check if query mentions specific keywords
     */
    queryMentions(query, keywords) {
        const lowerQuery = query.toLowerCase();
        return keywords.some(keyword => lowerQuery.includes(keyword));
    }

    /**
     * Format context for AI prompt
     */
    formatContextForAI(context) {
        let formattedContext = `Current Date: ${context.data.currentDate?.formatted || 'Unknown'}\n\n`;

        if (context.data.exams) {
            formattedContext += "📚 ACADEMIC DATA:\n\n";
            
            if (context.data.exams.upcoming && context.data.exams.upcoming.length > 0) {
                formattedContext += "Upcoming Exams:\n";
                context.data.exams.upcoming.forEach(exam => {
                    formattedContext += `- ${exam.subject}: ${exam.date} (${exam.daysUntil} days away) - ${exam.type}, Max: ${exam.maxMarks} marks\n`;
                    if (exam.notes) formattedContext += `  Notes: ${exam.notes}\n`;
                });
                formattedContext += "\n";
            }

            if (context.data.exams.subjectPerformance && context.data.exams.subjectPerformance.length > 0) {
                formattedContext += "Subject Performance (from past exams):\n";
                context.data.exams.subjectPerformance.forEach(subject => {
                    formattedContext += `- ${subject.subject}: ${subject.average}% average (${subject.examCount} exams, trending ${subject.trend})\n`;
                });
                formattedContext += "\n";
            }
        }

        if (context.data.tasks) {
            formattedContext += "📋 TASK DATA:\n\n";
            
            if (context.data.tasks.upcoming && context.data.tasks.upcoming.length > 0) {
                formattedContext += "Upcoming Tasks:\n";
                context.data.tasks.upcoming.forEach(task => {
                    formattedContext += `- ${task.name} (${task.subject}): Due ${task.date} (${task.daysUntil} days) - Priority: ${task.priority}\n`;
                });
                formattedContext += "\n";
            }

            if (context.data.tasks.overdue && context.data.tasks.overdue.length > 0) {
                formattedContext += "⚠️ Overdue Tasks:\n";
                context.data.tasks.overdue.forEach(task => {
                    formattedContext += `- ${task.name} (${task.subject}): ${task.daysOverdue} days overdue - Priority: ${task.priority}\n`;
                });
                formattedContext += "\n";
            }
        }

        return formattedContext;
    }
}

module.exports = new AIContextService();