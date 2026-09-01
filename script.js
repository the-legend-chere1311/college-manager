// Initialize theme on page load
document.addEventListener("DOMContentLoaded", function() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
});

// Removed unused timetable system and invalid date - these referenced non-existent HTML elements

function greeting() {
    const now = new Date();
    const hours = now.getHours();
    const greeting = document.getElementById("greeting");
    
    // Get username from localStorage
    const currentUser = getCurrentUser();
    const username = currentUser ? currentUser.username : "User";

    greeting.innerHTML = "";

    if (hours < 12 && hours >= 4) {
        greeting.textContent = `Good Morning ${username}!`
    } else if (hours >= 12 && hours < 16) {
        greeting.textContent = `Good Afternoon ${username}!`
    } else if (hours >= 16 && hours < 20) {
        greeting.textContent = `Good Evening ${username}!`
    } else if (hours >= 20 || hours < 4) {
        greeting.textContent = `Good Night ${username}!`
    }
}

document.addEventListener("DOMContentLoaded", greeting);

// Function to display today's calendar events in the schedule box
function displayTodaySchedule() {
    const scheduleBox = document.getElementById("todaySchedule");
    
    // Get events from localStorage
    const savedEvents = localStorage.getItem('calendarEvents');
    
    if (!savedEvents) {
        scheduleBox.innerHTML = '<p style="color: #bdc3c7; font-size: 0.9rem;">No events scheduled</p>';
        return;
    }
    
    const events = JSON.parse(savedEvents);
    const today = new Date();
    const todayStr = today.toDateString();
    
    // Filter events for today
    const todaysEvents = events.filter(event => {
        if (!event.start) return false;
        const eventDate = new Date(event.start);
        return eventDate.toDateString() === todayStr;
    });
    
    if (todaysEvents.length === 0) {
        scheduleBox.innerHTML = '<p style="color: #bdc3c7; font-size: 0.9rem;">No events today</p>';
        return;
    }
    
    // Sort events by start time
    todaysEvents.sort((a, b) => new Date(a.start) - new Date(b.start));
    
    // Create event list
    let html = '<div class="event-list">';
    
    todaysEvents.forEach(event => {
        const startTime = new Date(event.start);
        const endTime = event.end ? new Date(event.end) : null;
        
        const timeStr = startTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
        
        const endTimeStr = endTime ? endTime.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        }) : '';
        
        const duration = endTime ? ` - ${endTimeStr}` : '';
        
        html += `
            <div class="event-item">
                <div class="event-time">${timeStr}${duration}</div>
                <div class="event-title">${event.title}</div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add "View All" link
    html += '<div class="view-all-link"><a href="./schedule_page/schedule.html">View Full Schedule →</a></div>';
    
    scheduleBox.innerHTML = html;
}

// Function to display upcoming exams on homepage
async function displayUpcomingExams() {
    const examsBox = document.getElementById("upcomingExams");
    const API_BASE_URL = 'http://localhost:5001';
    
    try {
        // Fetch upcoming exams from the backend
        const response = await fetch(`${API_BASE_URL}/exams/upcoming`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const upcomingExams = await response.json();
        
        let html = '';
        
        if (upcomingExams.length === 0) {
            html = '<p class="no-exams">No upcoming exams</p>';
        } else {
            // Show only the next 3 upcoming exams
            const nextExams = upcomingExams.slice(0, 3);
            
            nextExams.forEach(exam => {
                const examDate = new Date(exam.examDate);
                const today = new Date();
                const timeDiff = examDate - today;
                const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                let timeDisplay = '';
                if (daysDiff === 0) {
                    timeDisplay = 'Today';
                } else if (daysDiff === 1) {
                    timeDisplay = 'Tomorrow';
                } else if (daysDiff > 0) {
                    timeDisplay = `In ${daysDiff} days`;
                } else {
                    timeDisplay = 'Past due';
                }
                
                const formattedDate = examDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
                
                html += `
                    <div class="exam-item">
                        <div class="exam-subject">${exam.subject}</div>
                        <div class="exam-meta">
                            <span class="exam-date">${formattedDate}</span>
                            <span class="exam-countdown">${timeDisplay}</span>
                        </div>
                    </div>
                `;
            });
            
            // Add "View All" link if there are more exams
            if (upcomingExams.length > 3) {
                html += `<div class="view-all-link"><a href="./exams_page/exams.html">View All Exams (${upcomingExams.length}) →</a></div>`;
            } else if (upcomingExams.length > 0) {
                html += '<div class="view-all-link"><a href="./exams_page/exams.html">View All Exams →</a></div>';
            }
        }
        
        examsBox.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading upcoming exams:', error);
        examsBox.innerHTML = '<p class="error-message">Failed to load exams</p>';
    }
}

// Function to display upcoming tasks on homepage
async function displayUpcomingTasks() {
    const tasksBox = document.getElementById("upcomingTasks");
    const API_BASE_URL = 'http://localhost:5001';
    
    try {
        // Fetch all tasks from the backend
        const response = await fetch(`${API_BASE_URL}/tasks`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allTasks = await response.json();
        
        // Filter out completed tasks and sort by due date (most recent first)
        const upcomingTasks = allTasks
            .filter(task => task.status !== 'completed')
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        let html = '';
        
        if (upcomingTasks.length === 0) {
            html = '<p class="no-tasks">No upcoming tasks</p>';
        } else {
            // Show only the next 3 upcoming tasks
            const nextTasks = upcomingTasks.slice(0, 3);
            
            nextTasks.forEach(task => {
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                const timeDiff = dueDate - today;
                const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
                
                let timeDisplay = '';
                let urgencyClass = '';
                
                if (daysDiff < 0) {
                    timeDisplay = 'Overdue';
                    urgencyClass = 'overdue';
                } else if (daysDiff === 0) {
                    timeDisplay = 'Due Today';
                    urgencyClass = 'due-today';
                } else if (daysDiff === 1) {
                    timeDisplay = 'Due Tomorrow';
                    urgencyClass = 'due-tomorrow';
                } else if (daysDiff <= 3) {
                    timeDisplay = `Due in ${daysDiff} days`;
                    urgencyClass = 'due-soon';
                } else {
                    timeDisplay = `Due in ${daysDiff} days`;
                    urgencyClass = 'due-later';
                }
                
                const formattedDate = dueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
                
                // Get priority color
                let priorityClass = '';
                switch (task.priority) {
                    case 'high': priorityClass = 'priority-high'; break;
                    case 'medium': priorityClass = 'priority-medium'; break;
                    case 'low': priorityClass = 'priority-low'; break;
                }
                
                // Get status icon
                let statusIcon = '';
                switch (task.status) {
                    case 'in-progress': statusIcon = '🟡'; break;
                    case 'not-started': statusIcon = '⚪'; break;
                }
                
                html += `
                    <div class="task-item ${priorityClass}">
                        <div class="task-header">
                            <span class="task-status">${statusIcon}</span>
                            <div class="task-name">${task.name}</div>
                        </div>
                        <div class="task-subject">${task.subject}</div>
                        <div class="task-meta">
                            <span class="task-date">${formattedDate}</span>
                            <span class="task-countdown ${urgencyClass}">${timeDisplay}</span>
                        </div>
                    </div>
                `;
            });
            
            // Add "View All" link if there are more tasks
            if (upcomingTasks.length > 3) {
                html += `<div class="view-all-link"><a href="./task_page/task.html">View All Tasks (${upcomingTasks.length}) →</a></div>`;
            } else if (upcomingTasks.length > 0) {
                html += '<div class="view-all-link"><a href="./task_page/task.html">View All Tasks →</a></div>';
            }
        }
        
        tasksBox.innerHTML = html;
        
    } catch (error) {
        console.error('Error loading upcoming tasks:', error);
        tasksBox.innerHTML = '<p class="error-message">Failed to load tasks</p>';
    }
}



// Daily affirmations array
const dailyAffirmations = [
    "I am capable of achieving great things today.",
    "Every challenge I face is an opportunity to grow stronger.",
    "I embrace learning and turn mistakes into stepping stones.",
    "My potential is limitless, and I'm ready to unlock it.",
    "I approach my studies with curiosity and determination.",
    "I am confident in my ability to overcome any obstacle.",
    "Today is full of possibilities, and I'm ready to seize them.",
    "I learn something valuable from every experience.",
    "My hard work and dedication will lead to success.",
    "I am resilient, focused, and ready to tackle any challenge.",
    "I believe in myself and my ability to succeed.",
    "Every small step I take brings me closer to my goals.",
    "I am grateful for the opportunity to learn and grow.",
    "My mind is sharp, and I absorb knowledge easily.",
    "I stay calm and focused under pressure.",
    "I celebrate my progress, no matter how small.",
    "I am worthy of success and all good things in life.",
    "My efforts today will create a better tomorrow.",
    "I choose to see challenges as adventures waiting to unfold.",
    "I am in control of my thoughts and my destiny.",
    "Knowledge is power, and I am becoming more powerful every day.",
    "I trust in my ability to find solutions to any problem.",
    "I am exactly where I need to be in my journey.",
    "My dedication to learning will open doors to amazing opportunities.",
    "I radiate positivity and attract success into my life.",
    "I am proud of how far I've come and excited for what's ahead.",
    "Every day, I am becoming a better version of myself.",
    "I have the strength to turn my dreams into reality.",
    "I am focused, motivated, and ready to excel.",
    "My education is an investment in my brilliant future."
];

// Function to display daily affirmation
function displayDailyAffirmation() {
    const affirmationBox = document.getElementById("dailyAffirmation");
    
    // Get today's date to ensure same affirmation all day
    const today = new Date();
    const dateString = today.toDateString();
    
    // Check if we already have an affirmation for today
    const storedData = localStorage.getItem('dailyAffirmationData');
    let affirmationData = storedData ? JSON.parse(storedData) : null;
    
    let todaysAffirmation;
    
    // If no stored data or it's a new day, generate new affirmation
    if (!affirmationData || affirmationData.date !== dateString) {
        const randomIndex = Math.floor(Math.random() * dailyAffirmations.length);
        todaysAffirmation = dailyAffirmations[randomIndex];
        
        // Store today's affirmation
        localStorage.setItem('dailyAffirmationData', JSON.stringify({
            date: dateString,
            affirmation: todaysAffirmation,
            index: randomIndex
        }));
    } else {
        todaysAffirmation = affirmationData.affirmation;
    }
    
    const html = `
        <div class="affirmation-content">
            <div class="affirmation-icon">✨</div>
            <p class="affirmation-text">${todaysAffirmation}</p>
            <div class="affirmation-footer">
                <small>Click to get a new affirmation</small>
            </div>
        </div>
    `;
    
    affirmationBox.innerHTML = html;
}

// Function to generate a new affirmation (when box is clicked)
function generateNewAffirmation() {
    const affirmationBox = document.getElementById("dailyAffirmation");
    
    // Get a random affirmation
    const randomIndex = Math.floor(Math.random() * dailyAffirmations.length);
    const newAffirmation = dailyAffirmations[randomIndex];
    
    // Update the display with a nice animation
    affirmationBox.style.opacity = '0.5';
    
    setTimeout(() => {
        const html = `
            <div class="affirmation-content">
                <div class="affirmation-icon">✨</div>
                <p class="affirmation-text">${newAffirmation}</p>
                <div class="affirmation-footer">
                    <small>Click to get a new affirmation</small>
                </div>
            </div>
        `;
        
        affirmationBox.innerHTML = html;
        affirmationBox.style.opacity = '1';
    }, 200);
}

// Quick Notes functionality
let notesTimeout;

function initializeQuickNotes() {
    const notesTextarea = document.getElementById('quickNotes');
    const saveStatus = document.getElementById('saveStatus');
    const previewToggle = document.getElementById('previewToggle');
    const notesInputSection = document.getElementById('notesInputSection');
    const notesPreviewSection = document.getElementById('notesPreviewSection');
    const notesPreview = document.getElementById('notesPreview');
    
    if (!notesTextarea) return;
    
    let isPreviewMode = false;
    
    // Load saved notes from localStorage
    const savedNotes = localStorage.getItem('quickNotes');
    if (savedNotes) {
        notesTextarea.value = savedNotes;
        updatePreview();
    }
    
    // Auto-save functionality with debouncing
    notesTextarea.addEventListener('input', function() {
        // Clear existing timeout
        clearTimeout(notesTimeout);
        
        // Show "Saving..." status
        saveStatus.textContent = 'Saving...';
        saveStatus.style.color = '#f39c12';
        
        // Update preview if in preview mode
        if (isPreviewMode) {
            updatePreview();
        }
        
        // Set new timeout for auto-save (500ms delay)
        notesTimeout = setTimeout(() => {
            localStorage.setItem('quickNotes', notesTextarea.value);
            saveStatus.textContent = 'Saved';
            saveStatus.style.color = '#2ecc71';
            
            // Reset to "Ready" after 2 seconds
            setTimeout(() => {
                saveStatus.textContent = 'Ready';
                saveStatus.style.color = '#95a5a6';
            }, 2000);
        }, 500);
    });
    
    // Auto-resize textarea based on content
    notesTextarea.addEventListener('input', autoResizeTextarea);
    
    // Preview toggle functionality
    previewToggle.addEventListener('click', function() {
        isPreviewMode = !isPreviewMode;
        
        if (isPreviewMode) {
            // Switch to preview mode
            notesInputSection.style.display = 'none';
            notesPreviewSection.style.display = 'block';
            previewToggle.classList.add('active');
            previewToggle.title = 'Switch to edit mode';
            updatePreview();
        } else {
            // Switch to edit mode
            notesInputSection.style.display = 'block';
            notesPreviewSection.style.display = 'none';
            previewToggle.classList.remove('active');
            previewToggle.title = 'Toggle markdown preview';
            notesTextarea.focus();
        }
    });
    
    // Update preview function
    function updatePreview() {
        if (typeof marked !== 'undefined' && notesTextarea.value.trim()) {
            notesPreview.innerHTML = marked.parse(notesTextarea.value);
        } else {
            notesPreview.innerHTML = '<p style="opacity: 0.6; font-style: italic;">No content to preview...</p>';
        }
    }
    
    // Initial resize
    autoResizeTextarea.call(notesTextarea);
}

function autoResizeTextarea() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
}

function clearQuickNotes() {
    const notesTextarea = document.getElementById('quickNotes');
    const saveStatus = document.getElementById('saveStatus');
    
    if (confirm('Are you sure you want to clear all notes? This action cannot be undone.')) {
        notesTextarea.value = '';
        localStorage.removeItem('quickNotes');
        
        saveStatus.textContent = 'Cleared';
        saveStatus.style.color = '#e74c3c';
        
        // Reset textarea height
        notesTextarea.style.height = 'auto';
        
        // Reset to "Ready" after 2 seconds
        setTimeout(() => {
            saveStatus.textContent = 'Ready';
            saveStatus.style.color = '#95a5a6';
        }, 2000);
    }
}

// Call the function when page loads
document.addEventListener("DOMContentLoaded", function() {
    displayTodaySchedule();
    displayUpcomingExams();
    displayUpcomingTasks();
    displayDailyAffirmation();
    initializeQuickNotes();
});

// ========== AUTHENTICATION SYSTEM ==========

// User management functions
function getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
}

function getAllUsers() {
    const users = localStorage.getItem('registeredUsers');
    return users ? JSON.parse(users) : [];
}

function saveUser(userData) {
    const users = getAllUsers();
    users.push(userData);
    localStorage.setItem('registeredUsers', JSON.stringify(users));
}

function setCurrentUser(userData) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
}

function logout() {
    localStorage.removeItem('currentUser');
    location.reload(); // Refresh page to show login modal
}

// Check authentication status
function checkAuthStatus() {
    const currentUser = getCurrentUser();
    const authModal = document.getElementById('authModal');
    const userInfo = document.getElementById('userInfo');
    const authTriggerBtn = document.getElementById('authTriggerBtn');
    const displayUsername = document.getElementById('displayUsername');
    
    if (currentUser) {
        // User is logged in
        authModal.style.display = 'none';
        userInfo.style.display = 'flex';
        authTriggerBtn.style.display = 'none';
        displayUsername.textContent = currentUser.username;
        greeting(); // Update greeting with username
    } else {
        // User is not logged in
        authModal.style.display = 'none'; // Don't show modal automatically
        userInfo.style.display = 'none';
        authTriggerBtn.style.display = 'flex';
    }
}

// Show authentication modal
function showAuthModal() {
    document.getElementById('authModal').style.display = 'flex';
}

// Login function
function login(username, password) {
    const users = getAllUsers();
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        setCurrentUser(user);
        checkAuthStatus();
        return { success: true, message: 'Login successful!' };
    } else {
        return { success: false, message: 'Invalid username or password' };
    }
}

// Register function
function register(username, email, password, confirmPassword) {
    // Validation
    if (password !== confirmPassword) {
        return { success: false, message: 'Passwords do not match' };
    }
    
    if (username.length < 3) {
        return { success: false, message: 'Username must be at least 3 characters' };
    }
    
    if (password.length < 6) {
        return { success: false, message: 'Password must be at least 6 characters' };
    }
    
    const users = getAllUsers();
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
        return { success: false, message: 'Username already exists' };
    }
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already registered' };
    }
    
    // Create new user
    const newUser = {
        username,
        email,
        password,
        createdAt: new Date().toISOString()
    };
    
    saveUser(newUser);
    setCurrentUser(newUser);
    checkAuthStatus();
    
    return { success: true, message: 'Registration successful!' };
}

// Form switching functions
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
}

// Event listeners for authentication
document.addEventListener("DOMContentLoaded", function() {
    // Check auth status on page load
    checkAuthStatus();
    
    // Auth trigger button
    document.getElementById('authTriggerBtn').addEventListener('click', function() {
        showAuthModal();
        showLoginForm(); // Default to login form
    });
    
    // Form switching
    document.getElementById('showRegister').addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterForm();
    });
    
    document.getElementById('showLogin').addEventListener('click', function(e) {
        e.preventDefault();
        showLoginForm();
    });
    
    // Login form submission
    document.getElementById('loginFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        const result = login(username, password);
        
        if (result.success) {
            // Clear form
            this.reset();
        } else {
            alert(result.message);
        }
    });
    
    // Register form submission
    document.getElementById('registerFormElement').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        const result = register(username, email, password, confirmPassword);
        
        if (result.success) {
            // Clear form
            this.reset();
        } else {
            alert(result.message);
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            logout();
        }
    });
    
    // Close modal when clicking outside
    document.getElementById('authModal').addEventListener('click', function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
    });
    
    // Prevent modal from closing when clicking inside the modal content
    document.querySelector('.auth-modal-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Initialize AI Chat
    initializeAIChat();
    
    // Initialize Spotify
    initializeSpotify();
});

// ========== AI CHAT FUNCTIONALITY ==========

// AI Chat variables
let isAIConnected = false;
const API_BASE_URL = 'http://localhost:5001';

// Initialize AI Chat
function initializeAIChat() {
    checkAIConnection();
    setupChatEventListeners();
}

// Check if AI is connected
async function checkAIConnection() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    try {
        const response = await fetch(`${API_BASE_URL}/ai/health`);
        const data = await response.json();
        
        if (data.success && data.ollama.success) {
            isAIConnected = true;
            statusDot.style.backgroundColor = '#2ecc71'; // Green
            statusText.textContent = 'Online';
        } else {
            isAIConnected = false;
            statusDot.style.backgroundColor = '#e74c3c'; // Red
            statusText.textContent = 'Offline';
        }
    } catch (error) {
        console.error('AI connection check failed:', error);
        isAIConnected = false;
        statusDot.style.backgroundColor = '#e74c3c'; // Red
        statusText.textContent = 'Offline';
    }
}

// Setup event listeners for chat
function setupChatEventListeners() {
    const aiInput = document.getElementById('aiInput');
    const aiSendBtn = document.getElementById('aiSendBtn');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    // Send message when button is clicked
    aiSendBtn.addEventListener('click', sendAIMessage);
    
    // Send message when Enter is pressed
    aiInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendAIMessage();
        }
    });
    
    // Open fullscreen modal
    fullscreenBtn.addEventListener('click', openFullscreenChat);
    
    // Setup fullscreen modal event listeners
    setupFullscreenEventListeners();
}

// Send message to AI
async function sendAIMessage() {
    const aiInput = document.getElementById('aiInput');
    const message = aiInput.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addMessageToChat(message, 'user');
    
    // Clear input and disable send button
    aiInput.value = '';
    const aiSendBtn = document.getElementById('aiSendBtn');
    aiSendBtn.disabled = true;
    aiSendBtn.textContent = 'Sending...';
    
    // Show typing indicator
    const typingElement = addMessageToChat('AI is thinking...', 'typing');
    
    try {
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        typingElement.remove();
        
        if (data.success) {
            // Add AI response to chat
            addMessageToChat(data.response, 'bot');
            isAIConnected = true;
            updateConnectionStatus('Online', '#2ecc71');
        } else {
            // Add error message to chat
            addMessageToChat(data.fallback || 'Sorry, I encountered an error. Please try again.', 'error');
            isAIConnected = false;
            updateConnectionStatus('Error', '#e74c3c');
        }
        
    } catch (error) {
        console.error('AI request failed:', error);
        
        // Remove typing indicator
        typingElement.remove();
        
        // Add error message
        addMessageToChat('Sorry, I cannot connect to the AI service right now. Please make sure Ollama is running.', 'error');
        isAIConnected = false;
        updateConnectionStatus('Offline', '#e74c3c');
    } finally {
        // Re-enable send button
        aiSendBtn.disabled = false;
        aiSendBtn.textContent = 'Send';
        aiInput.focus();
    }
}


// Add message to chat display with markdown support
function addMessageToChat(message, type, container = null) {
    const aiMessages = container || document.getElementById('aiMessages');
    const messageElement = document.createElement('div');
    messageElement.className = `ai-message ${type}`;
    
    // Parse markdown for bot messages (and not for typing/error messages)
    if (type === 'bot' && typeof marked !== 'undefined') {
        messageElement.innerHTML = marked.parse(message);
    } else {
        messageElement.textContent = message;
    }
    
    aiMessages.appendChild(messageElement);
    
    // Scroll to bottom
    aiMessages.scrollTop = aiMessages.scrollHeight;
    
    return messageElement;
}


// Update connection status
function updateConnectionStatus(text, color) {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    statusDot.style.backgroundColor = color;
    statusText.textContent = text;
}

// Setup fullscreen modal event listeners
function setupFullscreenEventListeners() {
    const fullscreenModal = document.getElementById('fullscreenModal');
    const closeFullscreenBtn = document.getElementById('closeFullscreenBtn');
    const fullscreenInput = document.getElementById('fullscreenInput');
    const fullscreenSendBtn = document.getElementById('fullscreenSendBtn');
    
    // Close modal when close button is clicked
    closeFullscreenBtn.addEventListener('click', closeFullscreenChat);
    
    // Close modal when clicking outside content
    fullscreenModal.addEventListener('click', function(e) {
        if (e.target === fullscreenModal) {
            closeFullscreenChat();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && fullscreenModal.style.display === 'flex') {
            closeFullscreenChat();
        }
    });
    
    // Send message from fullscreen input
    fullscreenSendBtn.addEventListener('click', function() {
        sendAIMessageFromFullscreen();
    });
    
    // Send message when Enter is pressed in fullscreen
    fullscreenInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendAIMessageFromFullscreen();
        }
    });
}

// Open fullscreen chat modal
function openFullscreenChat() {
    const fullscreenModal = document.getElementById('fullscreenModal');
    const fullscreenMessages = document.getElementById('fullscreenMessages');
    const aiMessages = document.getElementById('aiMessages');
    
    // Sync messages from main chat to fullscreen
    fullscreenMessages.innerHTML = '';
    const messages = aiMessages.querySelectorAll('.ai-message');
    messages.forEach(message => {
        const clonedMessage = message.cloneNode(true);
        fullscreenMessages.appendChild(clonedMessage);
    });
    
    // Show modal
    fullscreenModal.style.display = 'flex';
    
    // Focus on input
    const fullscreenInput = document.getElementById('fullscreenInput');
    setTimeout(() => fullscreenInput.focus(), 100);
    
    // Scroll to bottom
    fullscreenMessages.scrollTop = fullscreenMessages.scrollHeight;
}

// Close fullscreen chat modal
function closeFullscreenChat() {
    const fullscreenModal = document.getElementById('fullscreenModal');
    const aiMessages = document.getElementById('aiMessages');
    const fullscreenMessages = document.getElementById('fullscreenMessages');
    
    // Sync messages back to main chat
    aiMessages.innerHTML = '';
    const messages = fullscreenMessages.querySelectorAll('.ai-message');
    messages.forEach(message => {
        const clonedMessage = message.cloneNode(true);
        aiMessages.appendChild(clonedMessage);
    });
    
    // Hide modal
    fullscreenModal.style.display = 'none';
    
    // Scroll main chat to bottom
    aiMessages.scrollTop = aiMessages.scrollHeight;
}

// Send AI message from fullscreen interface
async function sendAIMessageFromFullscreen() {
    const fullscreenInput = document.getElementById('fullscreenInput');
    const fullscreenSendBtn = document.getElementById('fullscreenSendBtn');
    const message = fullscreenInput.value.trim();
    
    if (!message) return;
    
    // Add user message to fullscreen chat
    const fullscreenMessages = document.getElementById('fullscreenMessages');
    addMessageToChat(message, 'user', fullscreenMessages);
    
    // Clear input and disable send button
    fullscreenInput.value = '';
    fullscreenSendBtn.disabled = true;
    fullscreenSendBtn.textContent = 'Sending...';
    
    // Show typing indicator
    const typingElement = addMessageToChat('AI is thinking...', 'typing', fullscreenMessages);
    
    try {
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        const data = await response.json();
        
        // Remove typing indicator
        typingElement.remove();
        
        if (data.success) {
            // Add AI response to fullscreen chat
            addMessageToChat(data.response, 'bot', fullscreenMessages);
            isAIConnected = true;
            updateConnectionStatus('Online', '#2ecc71');
        } else {
            // Add error message to fullscreen chat
            addMessageToChat(data.fallback || 'Sorry, I encountered an error. Please try again.', 'error', fullscreenMessages);
            isAIConnected = false;
            updateConnectionStatus('Error', '#e74c3c');
        }
        
    } catch (error) {
        console.error('AI request failed:', error);
        
        // Remove typing indicator
        typingElement.remove();
        
        // Add error message
        addMessageToChat('Sorry, I cannot connect to the AI service right now. Please make sure Ollama is running.', 'error', fullscreenMessages);
        isAIConnected = false;
        updateConnectionStatus('Offline', '#e74c3c');
    } finally {
        // Re-enable send button
        fullscreenSendBtn.disabled = false;
        fullscreenSendBtn.textContent = 'Send';
        fullscreenInput.focus();
    }
}


// ========== SPOTIFY FUNCTIONALITY ==========

// Spotify variables
let spotifyUpdateInterval;
let isSpotifyConnected = false;

// Initialize Spotify integration
function initializeSpotify() {
    checkSpotifyAuth();
    setupSpotifyEventListeners();
    
    // No URL parameter handling needed - using popup window for auth
}

// Setup Spotify event listeners
function setupSpotifyEventListeners() {
    const connectBtn = document.getElementById('spotifyConnectBtn');
    const disconnectBtn = document.getElementById('spotifyDisconnectBtn');
    const playPauseBtn = document.getElementById('playPauseBtn');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const volumeSlider = document.getElementById('volumeSlider');

    // Connect button
    connectBtn?.addEventListener('click', connectSpotify);
    
    // Disconnect button
    disconnectBtn?.addEventListener('click', disconnectSpotify);
    
    // Playback controls
    playPauseBtn?.addEventListener('click', togglePlayPause);
    nextBtn?.addEventListener('click', nextTrack);
    prevBtn?.addEventListener('click', previousTrack);
    
    // Volume control
    volumeSlider?.addEventListener('input', (e) => {
        setVolume(e.target.value);
    });
}

// Check Spotify authentication status
async function checkSpotifyAuth() {
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/status`);
        const data = await response.json();
        
        if (data.success && data.authenticated) {
            isSpotifyConnected = true;
            await loadSpotifyProfile();
            showSpotifyConnected();
            startSpotifyUpdates();
        } else {
            isSpotifyConnected = false;
            showSpotifyNotConnected();
            stopSpotifyUpdates();
        }
    } catch (error) {
        console.error('Error checking Spotify auth:', error);
        isSpotifyConnected = false;
        showSpotifyNotConnected();
        stopSpotifyUpdates();
    }
}

// Connect to Spotify
async function connectSpotify() {
    try {
        showSpotifyLoading();
        
        const response = await fetch(`${API_BASE_URL}/spotify/auth`);
        const data = await response.json();
        
        if (data.success && data.authURL) {
            // Open Spotify auth in new tab
            const authWindow = window.open(data.authURL, '_blank', 'width=500,height=600');
            
            // Check if the window was blocked by popup blocker
            if (!authWindow) {
                alert('Popup blocked! Please allow popups for this site and try again.');
                showSpotifyNotConnected();
                return;
            }
            
            // Monitor the auth window for completion
            monitorAuthWindow(authWindow);
        } else {
            throw new Error('Failed to get auth URL');
        }
    } catch (error) {
        console.error('Error connecting to Spotify:', error);
        showSpotifyError('Failed to connect to Spotify');
        showSpotifyNotConnected();
    }
}

// Monitor the authentication window for completion
function monitorAuthWindow(authWindow) {
    const checkClosed = setInterval(() => {
        if (authWindow.closed) {
            clearInterval(checkClosed);
            // Check if authentication was successful
            setTimeout(() => {
                checkSpotifyAuth();
            }, 1000);
        }
    }, 1000);
    
    // Fallback: stop monitoring after 5 minutes
    setTimeout(() => {
        clearInterval(checkClosed);
        if (!authWindow.closed) {
            authWindow.close();
        }
        showSpotifyNotConnected();
    }, 300000); // 5 minutes
}

// Disconnect from Spotify
async function disconnectSpotify() {
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/logout`, {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            isSpotifyConnected = false;
            showSpotifyNotConnected();
            stopSpotifyUpdates();
        }
    } catch (error) {
        console.error('Error disconnecting from Spotify:', error);
        showSpotifyError('Failed to disconnect');
    }
}

// Load Spotify user profile
async function loadSpotifyProfile() {
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/profile`);
        const data = await response.json();
        
        if (data.success && data.profile) {
            const usernameElement = document.getElementById('spotifyUsername');
            if (usernameElement) {
                usernameElement.textContent = data.profile.display_name || data.profile.id;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Update now playing information
async function updateNowPlaying() {
    if (!isSpotifyConnected) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/now-playing`);
        const data = await response.json();
        
        if (data.success && data.nowPlaying && data.nowPlaying.item) {
            const track = data.nowPlaying.item;
            const isPlaying = data.nowPlaying.is_playing;
            
            // Update track info
            updateTrackDisplay(track, isPlaying);
        } else {
            // No track playing
            showNoTrackPlaying();
        }
    } catch (error) {
        console.error('Error updating now playing:', error);
    }
}

// Update track display
function updateTrackDisplay(track, isPlaying) {
    const trackNameEl = document.getElementById('trackName');
    const artistNameEl = document.getElementById('artistName');
    const albumArtEl = document.getElementById('albumArt');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    if (trackNameEl) trackNameEl.textContent = track.name;
    if (artistNameEl) artistNameEl.textContent = track.artists.map(a => a.name).join(', ');
    
    if (albumArtEl && track.album.images.length > 0) {
        albumArtEl.src = track.album.images[track.album.images.length - 1].url; // Smallest image
        albumArtEl.style.display = 'block';
    }
    
    if (playPauseBtn) {
        playPauseBtn.textContent = isPlaying ? '⏸️' : '▶️';
        playPauseBtn.title = isPlaying ? 'Pause' : 'Play';
    }
}

// Show no track playing
function showNoTrackPlaying() {
    const trackNameEl = document.getElementById('trackName');
    const artistNameEl = document.getElementById('artistName');
    const albumArtEl = document.getElementById('albumArt');
    const playPauseBtn = document.getElementById('playPauseBtn');
    
    if (trackNameEl) trackNameEl.textContent = 'No track playing';
    if (artistNameEl) artistNameEl.textContent = 'Open Spotify and play something';
    if (albumArtEl) albumArtEl.style.display = 'none';
    if (playPauseBtn) {
        playPauseBtn.textContent = '▶️';
        playPauseBtn.title = 'Play';
    }
}

// Playback controls
async function togglePlayPause() {
    if (!isSpotifyConnected) return;
    
    try {
        // Get current playback state
        const playbackResponse = await fetch(`${API_BASE_URL}/spotify/playback`);
        const playbackData = await playbackResponse.json();
        
        if (playbackData.success && playbackData.playback) {
            const isPlaying = playbackData.playback.is_playing;
            const endpoint = isPlaying ? 'pause' : 'play';
            
            const response = await fetch(`${API_BASE_URL}/spotify/${endpoint}`, {
                method: 'POST'
            });
            
            if (response.ok) {
                // Update UI immediately
                const playPauseBtn = document.getElementById('playPauseBtn');
                if (playPauseBtn) {
                    playPauseBtn.textContent = isPlaying ? '▶️' : '⏸️';
                    playPauseBtn.title = isPlaying ? 'Play' : 'Pause';
                }
                
                // Update after a short delay
                setTimeout(updateNowPlaying, 500);
            }
        }
    } catch (error) {
        console.error('Error toggling playback:', error);
        showSpotifyError('Playback control failed');
    }
}

async function nextTrack() {
    if (!isSpotifyConnected) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/next`, {
            method: 'POST'
        });
        
        if (response.ok) {
            setTimeout(updateNowPlaying, 1000);
        }
    } catch (error) {
        console.error('Error skipping track:', error);
        showSpotifyError('Failed to skip track');
    }
}

async function previousTrack() {
    if (!isSpotifyConnected) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/previous`, {
            method: 'POST'
        });
        
        if (response.ok) {
            setTimeout(updateNowPlaying, 1000);
        }
    } catch (error) {
        console.error('Error going to previous track:', error);
        showSpotifyError('Failed to go to previous track');
    }
}

async function setVolume(volume) {
    if (!isSpotifyConnected) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/spotify/volume`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ volume: parseInt(volume) })
        });
        
        if (!response.ok) {
            console.error('Failed to set volume');
        }
    } catch (error) {
        console.error('Error setting volume:', error);
    }
}

// UI State Management
function showSpotifyNotConnected() {
    document.getElementById('spotifyNotConnected').style.display = 'flex';
    document.getElementById('spotifyConnected').style.display = 'none';
    document.getElementById('spotifyLoading').style.display = 'none';
}

function showSpotifyConnected() {
    document.getElementById('spotifyNotConnected').style.display = 'none';
    document.getElementById('spotifyConnected').style.display = 'flex';
    document.getElementById('spotifyLoading').style.display = 'none';
}

function showSpotifyLoading() {
    document.getElementById('spotifyNotConnected').style.display = 'none';
    document.getElementById('spotifyConnected').style.display = 'none';
    document.getElementById('spotifyLoading').style.display = 'flex';
}

function showSpotifyError(message) {
    console.error('Spotify error:', message);
    // You could show a toast notification here
}

// Spotify update management
function startSpotifyUpdates() {
    if (spotifyUpdateInterval) {
        clearInterval(spotifyUpdateInterval);
    }
    
    // Update immediately
    updateNowPlaying();
    
    // Update every 5 seconds
    spotifyUpdateInterval = setInterval(updateNowPlaying, 5000);
}

function stopSpotifyUpdates() {
    if (spotifyUpdateInterval) {
        clearInterval(spotifyUpdateInterval);
        spotifyUpdateInterval = null;
    }
}


