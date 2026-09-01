// Settings JavaScript functionality
const API_BASE_URL = 'http://localhost:5001';

// Initialize settings when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadUserSettings();
    setupEventListeners();
});

// Load user settings from localStorage
function loadUserSettings() {
    try {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme') || 'dark';
        applyTheme(savedTheme);
        document.querySelector(`input[name="theme"][value="${savedTheme}"]`).checked = true;
        
        // Load user data
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        document.getElementById('username').value = userData.username || 'User';
        document.getElementById('email').value = userData.email || 'user@example.com';
        
        // Load notification preferences
        const notifications = JSON.parse(localStorage.getItem('notifications') || '{}');
        document.getElementById('task-notifications').checked = notifications.tasks !== false;
        document.getElementById('exam-notifications').checked = notifications.exams !== false;
        document.getElementById('spotify-notifications').checked = notifications.spotify !== false;
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showMessage('Error loading settings', 'error');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Theme change listeners
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                applyTheme(this.value);
                localStorage.setItem('theme', this.value);
                showMessage(`Switched to ${this.value} mode`, 'success');
            }
        });
    });
    
    // Notification toggle listeners
    document.getElementById('task-notifications').addEventListener('change', saveNotificationSettings);
    document.getElementById('exam-notifications').addEventListener('change', saveNotificationSettings);
    document.getElementById('spotify-notifications').addEventListener('change', saveNotificationSettings);
}

// Apply theme to the page
function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

// Save username
function saveUsername() {
    const username = document.getElementById('username').value.trim();
    
    if (!username) {
        showMessage('Username cannot be empty', 'error');
        return;
    }
    
    if (username.length < 3) {
        showMessage('Username must be at least 3 characters long', 'error');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.username = username;
        localStorage.setItem('userData', JSON.stringify(userData));
        
        showMessage('Username saved successfully', 'success');
    } catch (error) {
        console.error('Error saving username:', error);
        showMessage('Error saving username', 'error');
    }
}

// Save email
function saveEmail() {
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showMessage('Email cannot be empty', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }
    
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.email = email;
        localStorage.setItem('userData', JSON.stringify(userData));
        
        showMessage('Email saved successfully', 'success');
    } catch (error) {
        console.error('Error saving email:', error);
        showMessage('Error saving email', 'error');
    }
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('All password fields are required', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('New password must be at least 6 characters long', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'error');
        return;
    }
    
    // Check current password (simple check against stored hash)
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const storedPasswordHash = userData.passwordHash || hashPassword('defaultpassword');
    
    if (hashPassword(currentPassword) !== storedPasswordHash) {
        showMessage('Current password is incorrect', 'error');
        return;
    }
    
    try {
        // Save new password hash
        userData.passwordHash = hashPassword(newPassword);
        localStorage.setItem('userData', JSON.stringify(userData));
        
        // Clear password fields
        document.getElementById('current-password').value = '';
        document.getElementById('new-password').value = '';
        document.getElementById('confirm-password').value = '';
        
        showMessage('Password changed successfully', 'success');
    } catch (error) {
        console.error('Error changing password:', error);
        showMessage('Error changing password', 'error');
    }
}

// Save notification settings
function saveNotificationSettings() {
    try {
        const notifications = {
            tasks: document.getElementById('task-notifications').checked,
            exams: document.getElementById('exam-notifications').checked,
            spotify: document.getElementById('spotify-notifications').checked
        };
        
        localStorage.setItem('notifications', JSON.stringify(notifications));
        showMessage('Notification settings saved', 'success');
    } catch (error) {
        console.error('Error saving notifications:', error);
        showMessage('Error saving notification settings', 'error');
    }
}

// Export user data
function exportData() {
    try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const exams = JSON.parse(localStorage.getItem('exams') || '[]');
        const notifications = JSON.parse(localStorage.getItem('notifications') || '{}');
        const theme = localStorage.getItem('theme') || 'dark';
        
        const exportData = {
            userData: userData,
            tasks: tasks,
            exams: exams,
            notifications: notifications,
            theme: theme,
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `school-manager-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showMessage('Data exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showMessage('Error exporting data', 'error');
    }
}

// Create backup
function backupData() {
    try {
        const backupData = {
            userData: localStorage.getItem('userData'),
            tasks: localStorage.getItem('tasks'),
            exams: localStorage.getItem('exams'),
            notifications: localStorage.getItem('notifications'),
            theme: localStorage.getItem('theme'),
            backupDate: new Date().toISOString()
        };
        
        localStorage.setItem('backup', JSON.stringify(backupData));
        showMessage('Backup created successfully', 'success');
    } catch (error) {
        console.error('Error creating backup:', error);
        showMessage('Error creating backup', 'error');
    }
}

// Clear all data
function clearAllData() {
    const confirmMessage = "Are you sure you want to clear all data? This action cannot be undone.";
    
    if (confirm(confirmMessage)) {
        const secondConfirm = "This will delete all your tasks, exams, and settings. Type 'DELETE' to confirm:";
        const userInput = prompt(secondConfirm);
        
        if (userInput === 'DELETE') {
            try {
                // Clear all localStorage except backup
                const backup = localStorage.getItem('backup');
                localStorage.clear();
                
                // Restore backup key if it existed
                if (backup) {
                    localStorage.setItem('backup', backup);
                }
                
                showMessage('All data cleared successfully', 'success');
                
                // Reload page after 2 seconds
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } catch (error) {
                console.error('Error clearing data:', error);
                showMessage('Error clearing data', 'error');
            }
        } else {
            showMessage('Data clear cancelled', 'success');
        }
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function hashPassword(password) {
    // Simple hash function for demo purposes
    // In a real app, use proper encryption
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
}

function showMessage(message, type = 'success') {
    const messageContainer = document.getElementById('message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    messageContainer.appendChild(messageDiv);
    
    // Remove message after 4 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 4000);
}

// Initialize default user data if none exists
function initializeDefaultData() {
    if (!localStorage.getItem('userData')) {
        const defaultUserData = {
            username: 'User',
            email: 'user@example.com',
            passwordHash: hashPassword('defaultpassword'),
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('userData', JSON.stringify(defaultUserData));
    }
    
    if (!localStorage.getItem('notifications')) {
        const defaultNotifications = {
            tasks: true,
            exams: true,
            spotify: true
        };
        localStorage.setItem('notifications', JSON.stringify(defaultNotifications));
    }
}

// Initialize default data on first load
initializeDefaultData();