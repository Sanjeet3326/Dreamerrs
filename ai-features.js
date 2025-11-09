// AI/ML Features for Dreamer App

// Task Suggestion System
class TaskSuggestionEngine {
    constructor() {
        this.patterns = {
            morning: ['Plan day', 'Check emails', 'Review goals'],
            afternoon: ['Review progress', 'Important meetings', 'Focus work'],
            evening: ['Summarize day', 'Plan tomorrow', 'Review achievements']
        };
        this.categories = ['work', 'health', 'learning', 'personal'];
    }

    // Analyze user's task patterns
    analyzePatterns(tasks) {
        const completedTasks = tasks.filter(t => t.completed);
        const patterns = {
            timeOfDay: this.analyzeTimePatterns(completedTasks),
            categories: this.analyzeCategoryPatterns(completedTasks),
            productivity: this.analyzeProductivityPatterns(completedTasks)
        };
        return patterns;
    }

    // Suggest tasks based on time and patterns
    suggestTasks(existingTasks = [], time = new Date()) {
        const hour = time.getHours();
        const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        
        // Base suggestions on time of day
        const suggestions = [...(this.patterns[timeOfDay] || [])];
        
        // Add category-based suggestions
        const activeCategories = this.getActiveCategories(existingTasks);
        activeCategories.forEach(category => {
            suggestions.push(...this.getCategorySuggestions(category));
        });

        // Remove duplicates and tasks that already exist
        const existingTitles = new Set(existingTasks.map(t => t.title.toLowerCase()));
        return suggestions
            .filter(s => !existingTitles.has(s.toLowerCase()))
            .slice(0, 3); // Return top 3 suggestions
    }

    // Get active categories from existing tasks
    getActiveCategories(tasks) {
        const categories = tasks
            .filter(t => t.tags && t.tags.length)
            .flatMap(t => t.tags);
        return [...new Set(categories)];
    }

    // Get suggestions for a specific category
    getCategorySuggestions(category) {
        const suggestions = {
            work: [
                'Update project status',
                'Prepare presentation',
                'Team collaboration'
            ],
            health: [
                'Exercise session',
                'Healthy meal prep',
                'Meditation break'
            ],
            learning: [
                'Study new topic',
                'Practice skills',
                'Read industry news'
            ],
            personal: [
                'Family time',
                'Hobby project',
                'Self-reflection'
            ]
        };
        return suggestions[category] || [];
    }

    // Analyze when user completes most tasks
    analyzeTimePatterns(tasks) {
        const timeSlots = { morning: 0, afternoon: 0, evening: 0 };
        tasks.forEach(task => {
            const completedTime = new Date(task.completedDate);
            const hour = completedTime.getHours();
            if (hour < 12) timeSlots.morning++;
            else if (hour < 17) timeSlots.afternoon++;
            else timeSlots.evening++;
        });
        return timeSlots;
    }

    analyzeCategoryPatterns(tasks) {
        const categories = {};
        tasks.forEach(task => {
            (task.tags || []).forEach(tag => {
                categories[tag] = (categories[tag] || 0) + 1;
            });
        });
        return categories;
    }

    analyzeProductivityPatterns(tasks) {
        const last7Days = Array.from({length: 7}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date.toISOString().split('T')[0];
        });

        const productivity = last7Days.reduce((acc, date) => {
            acc[date] = tasks.filter(t => 
                t.completedDate && t.completedDate.startsWith(date)
            ).length;
            return acc;
        }, {});

        return productivity;
    }
}

// Speech Recognition System
class SpeechInputSystem {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.setupSpeechRecognition();
    }

    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                const text = event.results[0][0].transcript;
                this.processCommand(text);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isListening = false;
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateUI();
            };
        }
    }

    start() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
            this.isListening = true;
            this.updateUI();
        }
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
            this.updateUI();
        }
    }

    updateUI() {
        const micBtn = document.getElementById('mic-btn');
        if (micBtn) {
            micBtn.classList.toggle('listening', this.isListening);
            micBtn.textContent = this.isListening ? '🎙️ Listening...' : '🎙️ Speak';
        }
    }

    processCommand(text) {
        // Extract task information from speech
        const taskInfo = this.parseTaskCommand(text);
        if (taskInfo) {
            // Dispatch custom event with task info
            window.dispatchEvent(new CustomEvent('speech-task', { 
                detail: taskInfo 
            }));
        }
    }

    parseTaskCommand(text) {
        text = text.toLowerCase();
        
        // Basic command patterns
        if (text.includes('add task') || text.includes('new task') || text.includes('create task')) {
            const titleMatch = text.match(/(?:add|new|create) task (.+)/i);
            if (titleMatch) {
                return {
                    type: 'task',
                    title: titleMatch[1],
                    priority: text.includes('high priority') ? 'high' : 
                             text.includes('low priority') ? 'low' : 'medium'
                };
            }
        }
        
        return null;
    }
}

// Chatbot System
class DreamerChatbot {
    constructor() {
        this.context = {
            lastQuery: null,
            conversationHistory: []
        };
    }

    async processMessage(message) {
        // Store message in context
        this.context.lastQuery = message;
        this.context.conversationHistory.push({ role: 'user', content: message });

        // Process message
        const response = this.generateResponse(message);
        
        // Store response in context
        this.context.conversationHistory.push({ role: 'assistant', content: response });
        
        return response;
    }

    generateResponse(message) {
        message = message.toLowerCase();

        // Analyze productivity
        if (message.includes('how am i doing') || message.includes('my progress')) {
            return this.getProductivitySummary();
        }

        // Next actions
        if (message.includes('what should i') || message.includes('what next')) {
            return this.suggestNextAction();
        }

        // Task management
        if (message.includes('pending tasks') || message.includes('remaining tasks')) {
            return this.getPendingTasksSummary();
        }

        // Goals progress
        if (message.includes('goals') || message.includes('progress')) {
            return this.getGoalsProgress();
        }

        // Default responses
        const defaultResponses = [
            "I'm here to help! Try asking about your tasks, goals, or productivity.",
            "You can ask me about your pending tasks, progress, or what to do next.",
            "I can help you track your goals, manage tasks, and stay productive."
        ];
        
        return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
    }

    getProductivitySummary() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const goals = JSON.parse(localStorage.getItem('goals') || '[]');
        
        const completedTasks = tasks.filter(t => t.completed).length;
        const completedGoals = goals.filter(g => g.completed).length;
        
        return `📊 Productivity Summary:
        - Completed ${completedTasks} out of ${tasks.length} tasks
        - Achieved ${completedGoals} out of ${goals.length} goals
        - ${this.getMotivationalMessage(completedTasks, tasks.length)}`;
    }

    suggestNextAction() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const goals = JSON.parse(localStorage.getItem('goals') || '[]');

        // Find high priority incomplete tasks
        const urgentTasks = tasks.filter(t => !t.completed && t.priority === 'high');
        if (urgentTasks.length) {
            return `I suggest focusing on your high-priority task: "${urgentTasks[0].title}"`;
        }

        // Find in-progress goals
        const activeGoals = goals.filter(g => !g.completed && g.progress > 0);
        if (activeGoals.length) {
            return `You could continue working on your goal: "${activeGoals[0].title}" (${activeGoals[0].progress}% complete)`;
        }

        return "How about setting a new goal or creating some tasks for today?";
    }

    getPendingTasksSummary() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const pending = tasks.filter(t => !t.completed);
        
        if (!pending.length) return "You're all caught up! No pending tasks.";
        
        return `You have ${pending.length} pending tasks:
        ${pending.slice(0, 3).map(t => `- ${t.title}`).join('\n')}
        ${pending.length > 3 ? `...and ${pending.length - 3} more` : ''}`;
    }

    getGoalsProgress() {
        const goals = JSON.parse(localStorage.getItem('goals') || '[]');
        const inProgress = goals.filter(g => !g.completed && g.progress > 0);
        
        if (!inProgress.length) return "No goals in progress. Want to set a new goal?";
        
        return `Current Goals Progress:
        ${inProgress.map(g => `- ${g.title}: ${g.progress}%`).join('\n')}`;
    }

    getMotivationalMessage(completed, total) {
        const ratio = completed / total;
        if (ratio >= 0.8) return "Excellent work! You're crushing it! 🌟";
        if (ratio >= 0.5) return "Good progress! Keep up the momentum! 💪";
        if (ratio >= 0.2) return "You're making progress! Keep going! 🚀";
        return "Every small step counts! You've got this! 💫";
    }
}

// Analytics System
class ProductivityAnalytics {
    constructor() {
        this.cache = {
            lastUpdate: 0,
            data: null
        };
    }

    // Get fresh analytics data
    analyze() {
        const now = Date.now();
        // Cache for 5 minutes
        if (this.cache.data && now - this.cache.lastUpdate < 300000) {
            return this.cache.data;
        }

        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const goals = JSON.parse(localStorage.getItem('goals') || '[]');
        const notes = JSON.parse(localStorage.getItem('notes') || '[]');

        const data = {
            tasks: this.analyzeTasksData(tasks),
            goals: this.analyzeGoalsData(goals),
            notes: this.analyzeNotesData(notes),
            overall: this.calculateOverallScore(tasks, goals)
        };

        this.cache = {
            lastUpdate: now,
            data
        };

        return data;
    }

    analyzeTasksData(tasks) {
        const last7Days = this.getLast7Days();
        const completion = this.getCompletionByDay(tasks, last7Days);
        const categories = this.getTaskCategories(tasks);
        const priorities = this.getTaskPriorities(tasks);

        return {
            total: tasks.length,
            completed: tasks.filter(t => t.completed).length,
            completion,
            categories,
            priorities
        };
    }

    analyzeGoalsData(goals) {
        return {
            total: goals.length,
            completed: goals.filter(g => g.completed).length,
            inProgress: goals.filter(g => !g.completed && g.progress > 0).length,
            averageProgress: this.calculateAverageProgress(goals),
            categories: this.getGoalCategories(goals)
        };
    }

    analyzeNotesData(notes) {
        return {
            total: notes.length,
            byCategory: this.getNoteCategories(notes),
            recentActivity: this.getRecentNotesActivity(notes)
        };
    }

    calculateOverallScore(tasks, goals) {
        const taskScore = this.calculateTaskScore(tasks);
        const goalScore = this.calculateGoalScore(goals);
        return Math.round((taskScore + goalScore) / 2);
    }

    // Helper methods
    getLast7Days() {
        return Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();
    }

    getCompletionByDay(tasks, dates) {
        return dates.reduce((acc, date) => {
            acc[date] = {
                completed: tasks.filter(t => t.completed && this.dateMatches(t.completedDate, date)).length,
                total: tasks.filter(t => this.dateMatches(t.dueDate, date)).length
            };
            return acc;
        }, {});
    }

    dateMatches(dateStr, targetDate) {
        if (!dateStr) return false;
        return dateStr.startsWith(targetDate);
    }

    calculateAverageProgress(goals) {
        if (!goals.length) return 0;
        return Math.round(goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / goals.length);
    }

    getTaskCategories(tasks) {
        const categories = {};
        tasks.forEach(task => {
            (task.tags || []).forEach(tag => {
                categories[tag] = (categories[tag] || 0) + 1;
            });
        });
        return categories;
    }

    getTaskPriorities(tasks) {
        return tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {});
    }

    getGoalCategories(goals) {
        return goals.reduce((acc, goal) => {
            acc[goal.category] = (acc[goal.category] || 0) + 1;
            return acc;
        }, {});
    }

    getNoteCategories(notes) {
        return notes.reduce((acc, note) => {
            acc[note.category] = (acc[note.category] || 0) + 1;
            return acc;
        }, {});
    }

    getRecentNotesActivity(notes) {
        const last7Days = this.getLast7Days();
        return last7Days.reduce((acc, date) => {
            acc[date] = notes.filter(n => n.date.startsWith(date)).length;
            return acc;
        }, {});
    }

    calculateTaskScore(tasks) {
        if (!tasks.length) return 0;
        const completed = tasks.filter(t => t.completed).length;
        const onTime = tasks.filter(t => {
            if (!t.completed || !t.dueDate) return false;
            return new Date(t.completedDate) <= new Date(t.dueDate);
        }).length;
        return Math.round((completed + onTime) / (tasks.length * 2) * 100);
    }

    calculateGoalScore(goals) {
        if (!goals.length) return 0;
        const progressSum = goals.reduce((sum, goal) => sum + (goal.progress || 0), 0);
        return Math.round(progressSum / goals.length);
    }

    // Generate insights from the analytics
    generateInsights() {
        const data = this.analyze();
        const insights = [];

        // Task insights
        if (data.tasks.total > 0) {
            const completionRate = (data.tasks.completed / data.tasks.total * 100).toFixed(1);
            insights.push(`Task completion rate: ${completionRate}%`);

            // Priority distribution
            const highPriority = data.tasks.priorities.high || 0;
            if (highPriority > data.tasks.total * 0.3) {
                insights.push("Consider redistributing your high-priority tasks");
            }
        }

        // Goal insights
        if (data.goals.total > 0) {
            if (data.goals.averageProgress < 30) {
                insights.push("Goals seem to be progressing slowly. Consider breaking them into smaller milestones.");
            } else if (data.goals.averageProgress > 70) {
                insights.push("Great progress on your goals! Think about setting new challenges.");
            }
        }

        // Productivity patterns
        const last7Days = Object.values(data.tasks.completion);
        const recentCompletion = last7Days.slice(-3).reduce((sum, day) => sum + day.completed, 0);
        const olderCompletion = last7Days.slice(0, -3).reduce((sum, day) => sum + day.completed, 0);
        
        if (recentCompletion > olderCompletion) {
            insights.push("Your productivity is trending upward! Keep the momentum going!");
        } else if (recentCompletion < olderCompletion) {
            insights.push("Your task completion rate has decreased recently. Need to refocus?");
        }

        return insights;
    }
}

// Export all features
window.DreamerAI = {
    TaskSuggestionEngine,
    SpeechInputSystem,
    DreamerChatbot,
    ProductivityAnalytics
};