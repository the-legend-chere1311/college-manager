// Global variables
let exams = [];
let currentExam = null;
let isEditing = false;

// API base URL
const API_BASE_URL = 'http://localhost:5001';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadExams();
    setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
    const examForm = document.getElementById('exam-form');
    if (examForm) {
        examForm.addEventListener('submit', handleExamSubmit);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('exam-modal');
        if (event.target === modal) {
            hideExamModal();
        }
    });

    // Auto-calculate percentage when achieved marks change
    const achievedMarksInput = document.getElementById('achievedMarks');
    const maxMarksInput = document.getElementById('maxMarks');
    
    if (achievedMarksInput && maxMarksInput) {
        achievedMarksInput.addEventListener('input', updatePercentagePreview);
        maxMarksInput.addEventListener('input', updatePercentagePreview);
    }

    // Capitalize first letter of each word in subject field
    const subjectInput = document.getElementById('subject');
    if (subjectInput) {
        subjectInput.addEventListener('input', function(event) {
            const cursorPosition = event.target.selectionStart;
            event.target.value = capitalizeWords(event.target.value);
            event.target.setSelectionRange(cursorPosition, cursorPosition);
        });
    }
}

// Helper function to capitalize first letter of each word
function capitalizeWords(str) {
    return str.replace(/\b\w/g, function(char) {
        return char.toUpperCase();
    });
}

// Load exams from API
async function loadExams() {
    try {
        const response = await fetch(`${API_BASE_URL}/exams`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        exams = await response.json();
        displayExams();
    } catch (error) {
        console.error('Error loading exams:', error);
        showNotification('Error loading exams. Please check your connection.', 'error');
    }
}

// Display exams in their respective sections
function displayExams() {
    const upcomingContainer = document.getElementById('upcoming-exams');
    const completedContainer = document.getElementById('completed-exams');
    
    if (!upcomingContainer || !completedContainer) return;

    // Clear containers
    upcomingContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    const upcomingExams = exams.filter(exam => exam.status === 'upcoming');
    const completedExams = exams.filter(exam => exam.status === 'completed');

    // Display upcoming exams
    if (upcomingExams.length === 0) {
        upcomingContainer.innerHTML = '<p class="no-exams">No upcoming exams</p>';
    } else {
        upcomingExams.forEach(exam => {
            upcomingContainer.appendChild(createExamCard(exam));
        });
    }

    // Display completed exams
    if (completedExams.length === 0) {
        completedContainer.innerHTML = '<p class="no-exams">No completed exams</p>';
    } else {
        completedExams.forEach(exam => {
            completedContainer.appendChild(createExamCard(exam));
        });
    }
}

// Create exam card element
function createExamCard(exam) {
    const card = document.createElement('div');
    card.className = 'exam-card';
    card.onclick = () => selectExam(exam);

    const examDate = new Date(exam.examDate);
    const formattedDate = examDate.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });

    let cardContent = `
        <div class="exam-card-header">
            <h3 class="exam-title">Exam ${exams.indexOf(exam) + 1}</h3>
            <div class="exam-actions">
                <button class="edit-btn" onclick="event.stopPropagation(); editExam('${exam._id}')">Edit</button>
                <button class="details-btn" onclick="event.stopPropagation(); viewDetails('${exam._id}')">Details</button>
            </div>
        </div>
        <div class="exam-card-body">
            <p class="exam-subject">${exam.subject}</p>
            <p class="exam-date">${formattedDate}</p>
            <p class="exam-marks">Max Marks: ${exam.maxMarks}</p>
    `;

    if (exam.status === 'completed') {
        cardContent += `
            <div class="exam-results">
                <p class="achieved-marks">Achieved: ${exam.achievedMarks}</p>
                <p class="percent-grade">Grade: ${exam.percentGrade}%</p>
            </div>
        `;
    }

    cardContent += `
        </div>
    `;

    card.innerHTML = cardContent;
    return card;
}

// Select an exam to view details
function selectExam(exam) {
    currentExam = exam;
    displayExamDetails(exam);
    
    // Highlight selected card
    document.querySelectorAll('.exam-card').forEach(card => {
        card.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
}

// Display exam details in the detail panel
function displayExamDetails(exam) {
    const detailPanel = document.getElementById('exam-detail-panel');
    if (!detailPanel) return;

    const examDate = new Date(exam.examDate);
    const formattedDate = examDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let detailsHTML = `
        <div class="exam-details-header">
            <h2>Exam ${exams.indexOf(exam) + 1}</h2>
            <button class="edit-exam-btn" onclick="editExam('${exam._id}')">Edit Exam</button>
        </div>
        
        <div class="exam-info">
            <div class="info-item">
                <label>Subject:</label>
                <span>${exam.subject}</span>
            </div>
            
            <div class="info-item">
                <label>Exam Date:</label>
                <span>${formattedDate}</span>
            </div>
            
            <div class="info-item">
                <label>Maximum Marks:</label>
                <span>${exam.maxMarks}</span>
            </div>
            
            <div class="info-item">
                <label>Type:</label>
                <span>${exam.examType ? exam.examType.charAt(0).toUpperCase() + exam.examType.slice(1) : 'N/A'}</span>
            </div>
    `;

    if (exam.status === 'completed') {
        const letterGrade = getLetterGrade(exam.percentGrade);
        detailsHTML += `
            <div class="info-item">
                <label>Achieved Marks:</label>
                <span>${exam.achievedMarks}</span>
            </div>
            
            <div class="info-item">
                <label>Percent Gradet:</label>
                <span>${exam.finalGradePercent}%</span>
            </div>
        `;
    } else {
        detailsHTML += `
            <div class="status-item">
                <span class="status-badge upcoming">Upcoming</span>
                <button class="complete-exam-btn" onclick="markExamComplete('${exam._id}')">Mark as Completed</button>
            </div>
        `;
    }

    if (exam.notes) {
        detailsHTML += `
            <div class="info-item notes">
                <label>Notes:</label>
                <p>${exam.notes}</p>
            </div>
        `;
    }

    detailsHTML += `</div>`;
    detailPanel.innerHTML = detailsHTML;
}

// Get letter grade from percentage
function getLetterGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 77) return 'B+';
    if (percentage >= 73) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 67) return 'C+';
    if (percentage >= 63) return 'C';
    if (percentage >= 60) return 'C-';
    if (percentage >= 57) return 'D+';
    if (percentage >= 53) return 'D';
    if (percentage >= 50) return 'D-';
    return 'F';
}

// Show add exam modal
function showAddExamModal() {
    isEditing = false;
    currentExam = null;
    
    document.getElementById('modal-title').textContent = 'Add Exam';
    document.getElementById('exam-form').reset();
    document.getElementById('completed-fields').style.display = 'none';
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('examDate').min = today;
    
    document.getElementById('exam-modal').style.display = 'block';
}

// Edit exam
function editExam(examId) {
    const exam = exams.find(e => e._id === examId);
    if (!exam) return;

    isEditing = true;
    currentExam = exam;
    
    document.getElementById('modal-title').textContent = 'Edit Exam';
    
    // Populate form
    document.getElementById('subject').value = exam.subject;
    document.getElementById('examDate').value = exam.examDate.split('T')[0];
    document.getElementById('maxMarks').value = exam.maxMarks;
    document.getElementById('examType').value = exam.examType || 'midterm';
    document.getElementById('notes').value = exam.notes || '';
    
    // Show completed fields if exam is completed
    if (exam.status === 'completed') {
        document.getElementById('completed-fields').style.display = 'block';
        document.getElementById('achievedMarks').value = exam.achievedMarks;
    } else {
        document.getElementById('completed-fields').style.display = 'none';
    }
    
    document.getElementById('exam-modal').style.display = 'block';
}

// Mark exam as complete
function markExamComplete(examId) {
    const exam = exams.find(e => e._id === examId);
    if (!exam) return;

    isEditing = true;
    currentExam = exam;
    
    document.getElementById('modal-title').textContent = 'Complete Exam';
    
    // Populate form
    document.getElementById('subject').value = exam.subject;
    document.getElementById('examDate').value = exam.examDate.split('T')[0];
    document.getElementById('maxMarks').value = exam.maxMarks;
    document.getElementById('examType').value = exam.examType || 'midterm';
    document.getElementById('notes').value = exam.notes || '';
    
    // Show and focus on completed fields
    document.getElementById('completed-fields').style.display = 'block';
    document.getElementById('achievedMarks').focus();
    
    document.getElementById('exam-modal').style.display = 'block';
}

// Hide exam modal
function hideExamModal() {
    document.getElementById('exam-modal').style.display = 'none';
    currentExam = null;
    isEditing = false;
}

// Handle exam form submission
async function handleExamSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const examData = {
        subject: formData.get('subject'),
        examDate: formData.get('examDate'),
        maxMarks: parseInt(formData.get('maxMarks')),
        examType: formData.get('examType'),
        notes: formData.get('notes')
    };

    // Add completed exam fields if provided
    const achievedMarks = formData.get('achievedMarks');
    
    if (achievedMarks) {
        examData.achievedMarks = parseInt(achievedMarks);
        // Automatically calculate final grade percent: (achievedMarks / maxMarks) * 100
        examData.finalGradePercent = Math.round((parseInt(achievedMarks) / parseInt(formData.get('maxMarks'))) * 100 * 100) / 100;
        examData.status = 'completed';
    }

    try {
        let response;
        if (isEditing && currentExam) {
            response = await fetch(`${API_BASE_URL}/exams/${currentExam._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(examData)
            });
        } else {
            response = await fetch(`${API_BASE_URL}/exams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(examData)
            });
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const savedExam = await response.json();
        
        hideExamModal();
        loadExams(); // Reload to get updated data
        
        showNotification(
            isEditing ? 'Exam updated successfully!' : 'Exam added successfully!', 
            'success'
        );
        
    } catch (error) {
        console.error('Error saving exam:', error);
        showNotification('Error saving exam. Please try again.', 'error');
    }
}

// Update percentage preview
function updatePercentagePreview() {
    const achievedMarks = parseFloat(document.getElementById('achievedMarks').value);
    const maxMarks = parseFloat(document.getElementById('maxMarks').value);
    
    if (achievedMarks && maxMarks && maxMarks > 0) {
        const percentage = Math.round((achievedMarks / maxMarks) * 100 * 100) / 100;
        const letterGrade = getLetterGrade(percentage);
        
        // You could add a preview element to show this
        console.log(`Preview: ${percentage}% (${letterGrade})`);
    }
}

// View details (same as select for now)
function viewDetails(examId) {
    const exam = exams.find(e => e._id === examId);
    if (exam) {
        selectExam(exam);
    }
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4CAF50';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            break;
        default:
            notification.style.backgroundColor = '#2196F3';
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to update all existing exams to capitalize subject names
async function updateExistingExamsCapitalization() {
    try {
        showNotification('Updating existing exams...', 'info');
        
        // Get all exams
        const response = await fetch(`${API_BASE_URL}/exams`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const allExams = await response.json();
        let updatedCount = 0;
        
        // Update each exam that needs capitalization
        for (const exam of allExams) {
            const capitalizedSubject = capitalizeWords(exam.subject);
            
            // Only update if the subject actually changes
            if (capitalizedSubject !== exam.subject) {
                const updatedExamData = {
                    ...exam,
                    subject: capitalizedSubject
                };
                
                const updateResponse = await fetch(`${API_BASE_URL}/exams/${exam._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updatedExamData)
                });
                
                if (updateResponse.ok) {
                    updatedCount++;
                } else {
                    console.error(`Failed to update exam ${exam._id}`);
                }
            }
        }
        
        // Reload exams to show updated data
        await loadExams();
        
        showNotification(
            `Successfully updated ${updatedCount} exam${updatedCount !== 1 ? 's' : ''} with proper capitalization!`, 
            'success'
        );
        
    } catch (error) {
        console.error('Error updating existing exams:', error);
        showNotification('Error updating existing exams. Please try again.', 'error');
    }
}

// Auto-run the capitalization update when page loads (run once)
document.addEventListener('DOMContentLoaded', function() {
    // Check if we've already run the capitalization update
    const hasRunCapitalization = localStorage.getItem('exams-capitalization-updated');
    if (!hasRunCapitalization) {
        // Wait a bit for the page to load, then update existing exams
        setTimeout(() => {
            updateExistingExamsCapitalization().then(() => {
                // Mark that we've run the capitalization update
                localStorage.setItem('exams-capitalization-updated', 'true');
            });
        }, 2000);
    }
});

// Add slideIn animation to CSS if not already present
if (!document.querySelector('#slide-in-animation')) {
    const style = document.createElement('style');
    style.id = 'slide-in-animation';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}