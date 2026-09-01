const express = require('express');
const router = express.Router();
const ollamaService = require('../services/ollamaService');
const aiContextService = require('../services/aiContextService');

// Chat endpoint - this is where frontend will send messages
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        // Check if message was provided
        if (!message || message.trim() === '') {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }

        // Get context data for the AI
        const context = await aiContextService.getContextForQuery(message);
        
        // Send message to Ollama with context
        const result = await ollamaService.sendMessage(message, context);
        
        if (result.success) {
            res.json({
                success: true,
                response: result.response,
                model: result.model,
                contextUsed: !!context.data.exams || !!context.data.tasks,
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({
                success: false,
                error: result.error,
                fallback: result.fallback,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Chat endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            fallback: 'Sorry, something went wrong on our end. Please try again.'
        });
    }
});

// Health check endpoint - to check if AI is working
router.get('/health', async (req, res) => {
    try {
        const health = await ollamaService.checkHealth();
        
        res.json({
            success: true,
            ollama: health,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AI health check error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check AI health',
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
