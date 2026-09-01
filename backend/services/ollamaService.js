const axios = require('axios');

class OllamaService {
    constructor() {
        // Ollama usually runs on port 11434 by default
        this.baseURL = 'http://localhost:11434';
        // Using llama2 as default - change this to your preferred model
        this.model = 'gpt-oss:120b-cloud';  // You can change this to 'mistral', 'codellama', etc.
        this.timeout = 30000; // 30 seconds timeout
    }

    async sendMessage(message, context = null) {
        try {
            // Build the prompt with context if available
            let fullPrompt = this.buildPromptWithContext(message, context);
            
            const response = await axios.post(`${this.baseURL}/api/generate`, {
                model: this.model,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    top_p: 0.9,
                }
            }, {
                timeout: this.timeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                response: response.data.response,
                model: this.model
            };
        } catch (error) {
            console.error('Ollama API Error:', error.message);
            
            if (error.code === 'ECONNREFUSED') {
                return {
                    success: false,
                    error: 'Cannot connect to Ollama. Make sure Ollama is running.',
                    fallback: 'Sorry, I cannot connect to the AI service right now. Please make sure Ollama is running.'
                };
            }
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    error: `Model '${this.model}' not found.`,
                    fallback: `The AI model '${this.model}' is not available. Please make sure it's downloaded with 'ollama pull ${this.model}'.`
                };
            }

            return {
                success: false,
                error: error.message,
                fallback: 'Sorry, I encountered an error. Please try again.'
            };
        }
    }

    buildPromptWithContext(message, context) {
        if (!context || (!context.data.exams && !context.data.tasks)) {
            // No relevant context, return message with basic AI persona
            return `You are a helpful AI study assistant for a student. Please provide helpful, accurate, and encouraging responses.

User question: ${message}`;
        }

        // Import the context service to format the context
        const aiContextService = require('./aiContextService');
        const formattedContext = aiContextService.formatContextForAI(context);

        return `You are a helpful AI study assistant for a student. You have access to their current academic data and should use it to provide personalized, accurate advice.

IMPORTANT INSTRUCTIONS:
- Use the provided academic data to give specific, actionable advice
- When creating study plans, consider exam dates, subject performance, and current tasks
- Be encouraging but realistic about time management
- Prioritize upcoming exams and overdue tasks
- Suggest specific study strategies based on subject performance trends
- Format your response clearly with markdown for better readability

STUDENT'S CURRENT ACADEMIC DATA:
${formattedContext}

User question: ${message}

Please provide a helpful response based on the above academic data.`;
    }

    async checkHealth() {
        try {
            const response = await axios.get(`${this.baseURL}/api/tags`, {
                timeout: 5000
            });
            
            return {
                success: true,
                status: 'connected',
                models: response.data.models || []
            };
        } catch (error) {
            return {
                success: false,
                status: 'disconnected',
                error: error.message
            };
        }
    }
}

module.exports = new OllamaService();
