// Analytics JavaScript - Comprehensive GPA and Grade Management System
const API_BASE_URL = 'http://localhost:5001';

// Global variables
let currentGradingSystem = 'standard';
let currentGPAScale = 4.0;
let grades = [];
let charts = {};

// College Grade Conversion Systems
const gradingConversions = {
    standard: {
        name: "Standard (A-F)",
        grades: {
            'A+': { gpa4: 4.0, gpa5: 5.0, percentage: [97, 100] },
            'A': { gpa4: 4.0, gpa5: 5.0, percentage: [93, 96] },
            'A-': { gpa4: 3.7, gpa5: 4.7, percentage: [90, 92] },
            'B+': { gpa4: 3.3, gpa5: 4.3, percentage: [87, 89] },
            'B': { gpa4: 3.0, gpa5: 4.0, percentage: [83, 86] },
            'B-': { gpa4: 2.7, gpa5: 3.7, percentage: [80, 82] },
            'C+': { gpa4: 2.3, gpa5: 3.3, percentage: [77, 79] },
            'C': { gpa4: 2.0, gpa5: 3.0, percentage: [73, 76] },
            'C-': { gpa4: 1.7, gpa5: 2.7, percentage: [70, 72] },
            'D+': { gpa4: 1.3, gpa5: 2.3, percentage: [67, 69] },
            'D': { gpa4: 1.0, gpa5: 2.0, percentage: [60, 66] },
            'F': { gpa4: 0.0, gpa5: 0.0, percentage: [0, 59] }
        }
    },
    simplified: {
        name: "Simplified (A-F)",
        grades: {
            'A': { gpa4: 4.0, gpa5: 5.0, percentage: [90, 100] },
            'B': { gpa4: 3.0, gpa5: 4.0, percentage: [80, 89] },
            'C': { gpa4: 2.0, gpa5: 3.0, percentage: [70, 79] },
            'D': { gpa4: 1.0, gpa5: 2.0, percentage: [60, 69] },
            'F': { gpa4: 0.0, gpa5: 0.0, percentage: [0, 59] }
        }
    },
    passfail: {
        name: "Pass/Fail",
        grades: {
            'P': { gpa4: 0.0, gpa5: 0.0, percentage: [70, 100] }, // Pass doesn't affect GPA
            'F': { gpa4: 0.0, gpa5: 0.0, percentage: [0, 69] }
        }
    },
    numeric: {
        name: "Numeric (0-100)",
        grades: {
            '97-100': { gpa4: 4.0, gpa5: 5.0, percentage: [97, 100] },
            '93-96': { gpa4: 4.0, gpa5: 5.0, percentage: [93, 96] },
            '90-92': { gpa4: 3.7, gpa5: 4.7, percentage: [90, 92] },
            '87-89': { gpa4: 3.3, gpa5: 4.3, percentage: [87, 89] },
            '83-86': { gpa4: 3.0, gpa5: 4.0, percentage: [83, 86] },
            '80-82': { gpa4: 2.7, gpa5: 3.7, percentage: [80, 82] },
            '77-79': { gpa4: 2.3, gpa5: 3.3, percentage: [77, 79] },
            '73-76': { gpa4: 2.0, gpa5: 3.0, percentage: [73, 76] },
            '70-72': { gpa4: 1.7, gpa5: 2.7, percentage: [70, 72] },
            '67-69': { gpa4: 1.3, gpa5: 2.3, percentage: [67, 69] },
            '60-66': { gpa4: 1.0, gpa5: 2.0, percentage: [60, 66] },
            '0-59': { gpa4: 0.0, gpa5: 0.0, percentage: [0, 59] }
        }
    }
};

// Initialize analytics page
document.addEventListener('DOMContentLoaded', function() {
    loadGrades();
    updateGradingSystem();
    updateGPAScale();
    updateConversionReference();
    calculateGPA();
    updateCharts();
    updateInsights();
});



// Update GPA scale
function updateGPAScale() {
    const scale = document.getElementById('gpaScale').value;
    currentGPAScale = parseFloat(scale);
    
    document.getElementById('currentScale').textContent = `/ ${scale}`;
    document.getElementById('semesterScale').textContent = `/ ${scale}`;
    
    const targetInput = document.getElementById('targetGPA');
    targetInput.max = scale;
    
    calculateGPA();
    updateCharts();
    updateInsights();
    saveGrades();
}

// Update grading system
function updateGradingSystem() {
    const system = document.getElementById('gradingSystem').value;
    currentGradingSystem = system;
    
    updateGradeHelp();
    updateConversionReference();
    calculateGPA();
    updateCharts();
    updateInsights();
    saveGrades();
}

// Update grade input help text
function updateGradeHelp() {
    const helpText = document.getElementById('gradeHelp');
    const system = gradingConversions[currentGradingSystem];
    const gradeOptions = Object.keys(system.grades).join(', ');
    
    helpText.textContent = `Enter grades in ${system.name} format (${gradeOptions})`;
}

// Update conversion reference table
function updateConversionReference() {
    const container = document.getElementById('conversionReference');
    const system = gradingConversions[currentGradingSystem];
    
    let tableHTML = `
        <h4>${system.name} Conversion Table</h4>
        <table class="conversion-table">
            <thead>
                <tr>
                    <th>Grade</th>
                    <th>4.0 Scale</th>
                    <th>5.0 Scale</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (const [grade, values] of Object.entries(system.grades)) {
        tableHTML += `
            <tr>
                <td>${grade}</td>
                <td>${values.gpa4.toFixed(1)}</td>
                <td>${values.gpa5.toFixed(1)}</td>
                <td>${values.percentage[0]}-${values.percentage[1]}%</td>
            </tr>
        `;
    }
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Add grade
function addGrade() {
    const subjectName = document.getElementById('subjectName').value.trim();
    const gradeValue = document.getElementById('gradeValue').value.trim();
    const creditHours = parseInt(document.getElementById('creditHours').value) || 3;
    
    if (!subjectName || !gradeValue) {
        alert('Please enter both subject name and grade');
        return;
    }
    
    // Validate grade against current system
    const system = gradingConversions[currentGradingSystem];
    let normalizedGrade = gradeValue.toUpperCase();
    
    // Handle CBSE percentage input
    if (currentGradingSystem === 'cbse') {
        const percentage = parseFloat(gradeValue);
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
            alert('Please enter a valid percentage (0-100)');
            return;
        }
        
        // Find corresponding grade range
        for (const [range, values] of Object.entries(system.grades)) {
            if (percentage >= values.percentage[0] && percentage <= values.percentage[1]) {
                normalizedGrade = range;
                break;
            }
        }
    }
    
    if (!system.grades[normalizedGrade]) {
        alert(`Invalid grade for ${system.name}. Please use: ${Object.keys(system.grades).join(', ')}`);
        return;
    }
    
    const grade = {
        id: Date.now(),
        subject: subjectName,
        grade: normalizedGrade,
        creditHours: creditHours,
        system: currentGradingSystem,
        date: new Date().toISOString(),
        semester: getCurrentSemester()
    };
    
    grades.push(grade);
    
    // Clear inputs
    document.getElementById('subjectName').value = '';
    document.getElementById('gradeValue').value = '';
    document.getElementById('creditHours').value = '3';
    
    displayGrades();
    calculateGPA();
    updateCharts();
    updateInsights();
    saveGrades();
}

// Display grades
function displayGrades() {
    const container = document.getElementById('gradesList');
    
    if (grades.length === 0) {
        container.innerHTML = '<p class="no-grades">No grades added yet. Add your first grade above!</p>';
        return;
    }
    
    let html = '';
    const groupedGrades = groupGradesBySemester();
    
    for (const [semester, semesterGrades] of Object.entries(groupedGrades)) {
        html += `
            <div class="semester-group">
                <h4>${semester}</h4>
                <div class="grades-grid">
        `;
        
        semesterGrades.forEach(grade => {
            const gpaValue = getGPAValue(grade.grade, grade.system);
            html += `
                <div class="grade-item">
                    <div class="grade-info">
                        <strong>${grade.subject}</strong>
                        <span class="grade-value">${grade.grade}</span>
                        <span class="gpa-equivalent">(${gpaValue.toFixed(2)} GPA)</span>
                        <span class="credit-hours">${grade.creditHours} credits</span>
                    </div>
                    <button onclick="removeGrade(${grade.id})" class="remove-btn">×</button>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Remove grade
function removeGrade(gradeId) {
    grades = grades.filter(grade => grade.id !== gradeId);
    displayGrades();
    calculateGPA();
    updateCharts();
    updateInsights();
    saveGrades();
}

// Get GPA value for a grade
function getGPAValue(grade, system) {
    const gradeSystem = gradingConversions[system];
    if (!gradeSystem || !gradeSystem.grades[grade]) return 0;
    
    return currentGPAScale === 4.0 ? 
        gradeSystem.grades[grade].gpa4 : 
        gradeSystem.grades[grade].gpa5;
}

// Calculate GPA
function calculateGPA() {
    if (grades.length === 0) {
        document.getElementById('currentGPA').textContent = '0.00';
        document.getElementById('semesterGPA').textContent = '0.00';
        document.getElementById('totalCredits').textContent = '0';
        return;
    }
    
    // Calculate overall GPA
    let totalGradePoints = 0;
    let totalCredits = 0;
    
    grades.forEach(grade => {
        const gpaValue = getGPAValue(grade.grade, grade.system);
        totalGradePoints += gpaValue * grade.creditHours;
        totalCredits += grade.creditHours;
    });
    
    const overallGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
    
    // Calculate current semester GPA
    const currentSemester = getCurrentSemester();
    const semesterGrades = grades.filter(grade => grade.semester === currentSemester);
    
    let semesterGradePoints = 0;
    let semesterCredits = 0;
    
    semesterGrades.forEach(grade => {
        const gpaValue = getGPAValue(grade.grade, grade.system);
        semesterGradePoints += gpaValue * grade.creditHours;
        semesterCredits += grade.creditHours;
    });
    
    const semesterGPA = semesterCredits > 0 ? semesterGradePoints / semesterCredits : 0;
    
    // Update display
    document.getElementById('currentGPA').textContent = overallGPA.toFixed(2);
    document.getElementById('semesterGPA').textContent = semesterGPA.toFixed(2);
    if (document.getElementById('totalCredits')) {
        document.getElementById('totalCredits').textContent = totalCredits.toString();
    }
    
    // Update academic standing
    calculateAcademicStanding(overallGPA);
}

// Get current semester
function getCurrentSemester() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    if (month >= 8 && month <= 12) {
        return `Fall ${year}`;
    } else if (month >= 1 && month <= 5) {
        return `Spring ${year}`;
    } else {
        return `Summer ${year}`;
    }
}

// Group grades by semester
function groupGradesBySemester() {
    const grouped = {};
    
    grades.forEach(grade => {
        if (!grouped[grade.semester]) {
            grouped[grade.semester] = [];
        }
        grouped[grade.semester].push(grade);
    });
    
    return grouped;
}

// Update charts
function updateCharts() {
    updateGPAChart();
    updateGradeChart();
    updateSubjectChart();
    updateCreditChart();
}

// Update GPA trend chart
function updateGPAChart() {
    const ctx = document.getElementById('gpaChart').getContext('2d');
    
    if (charts.gpaChart) {
        charts.gpaChart.destroy();
    }
    
    const semesterData = getSemesterGPAData();
    
    charts.gpaChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: semesterData.labels,
            datasets: [{
                label: 'GPA',
                data: semesterData.data,
                borderColor: '#4a9eff',
                backgroundColor: 'rgba(74, 158, 255, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: currentGPAScale,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#f1f1f1'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#f1f1f1'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f1f1'
                    }
                }
            }
        }
    });
}

// Update grade distribution chart
function updateGradeChart() {
    const ctx = document.getElementById('gradeChart').getContext('2d');
    
    if (charts.gradeChart) {
        charts.gradeChart.destroy();
    }
    
    const gradeDistribution = getGradeDistribution();
    
    charts.gradeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: gradeDistribution.labels,
            datasets: [{
                data: gradeDistribution.data,
                backgroundColor: [
                    '#4a9eff', '#38a169', '#805ad5', '#e53e3e',
                    '#d69e2e', '#00b5d8', '#dd6b20', '#38b2ac'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f1f1'
                    }
                }
            }
        }
    });
}

// Update subject performance chart
function updateSubjectChart() {
    const ctx = document.getElementById('subjectChart').getContext('2d');
    
    if (charts.subjectChart) {
        charts.subjectChart.destroy();
    }
    
    const subjectData = getSubjectPerformance();
    
    charts.subjectChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjectData.labels,
            datasets: [{
                label: 'GPA',
                data: subjectData.data,
                backgroundColor: '#4a9eff',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: currentGPAScale,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#f1f1f1'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#f1f1f1',
                        maxRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f1f1'
                    }
                }
            }
        }
    });
}

// Update credit hour distribution chart
function updateCreditChart() {
    const ctx = document.getElementById('creditChart').getContext('2d');
    
    if (charts.creditChart) {
        charts.creditChart.destroy();
    }
    
    const creditData = getCreditDistribution();
    
    charts.creditChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: creditData.labels,
            datasets: [{
                data: creditData.data,
                backgroundColor: [
                    '#4a9eff', '#38a169', '#805ad5', '#e53e3e',
                    '#d69e2e', '#00b5d8', '#dd6b20', '#38b2ac'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f1f1'
                    }
                }
            }
        }
    });
}

// Get semester GPA data for chart
function getSemesterGPAData() {
    const semesterGroups = groupGradesBySemester();
    const labels = [];
    const data = [];
    
    for (const [semester, semesterGrades] of Object.entries(semesterGroups)) {
        let totalGradePoints = 0;
        let totalCredits = 0;
        
        semesterGrades.forEach(grade => {
            const gpaValue = getGPAValue(grade.grade, grade.system);
            totalGradePoints += gpaValue * grade.creditHours;
            totalCredits += grade.creditHours;
        });
        
        const semesterGPA = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
        
        labels.push(semester);
        data.push(semesterGPA);
    }
    
    return { labels, data };
}

// Get grade distribution data
function getGradeDistribution() {
    const distribution = {};
    
    grades.forEach(grade => {
        if (!distribution[grade.grade]) {
            distribution[grade.grade] = 0;
        }
        distribution[grade.grade]++;
    });
    
    return {
        labels: Object.keys(distribution),
        data: Object.values(distribution)
    };
}

// Get subject performance data
function getSubjectPerformance() {
    const subjects = {};
    
    grades.forEach(grade => {
        const gpaValue = getGPAValue(grade.grade, grade.system);
        if (!subjects[grade.subject]) {
            subjects[grade.subject] = {
                totalGradePoints: 0,
                totalCredits: 0
            };
        }
        
        subjects[grade.subject].totalGradePoints += gpaValue * grade.creditHours;
        subjects[grade.subject].totalCredits += grade.creditHours;
    });
    
    const labels = [];
    const data = [];
    
    for (const [subject, stats] of Object.entries(subjects)) {
        const avgGPA = stats.totalCredits > 0 ? stats.totalGradePoints / stats.totalCredits : 0;
        labels.push(subject);
        data.push(avgGPA);
    }
    
    return { labels, data };
}

// Get credit distribution data
function getCreditDistribution() {
    const distribution = {};
    
    grades.forEach(grade => {
        if (!distribution[grade.subject]) {
            distribution[grade.subject] = 0;
        }
        distribution[grade.subject] += grade.creditHours;
    });
    
    return {
        labels: Object.keys(distribution),
        data: Object.values(distribution)
    };
}

// Update insights
function updateInsights() {
    updateGPAAnalysis();
    updateImprovementAnalysis();
    updateTrendAnalysis();
}

// Update GPA analysis
function updateGPAAnalysis() {
    const container = document.getElementById('gpaAnalysis');
    
    if (grades.length === 0) {
        container.innerHTML = 'Add grades to see detailed analysis';
        return;
    }
    
    const currentGPA = parseFloat(document.getElementById('currentGPA').textContent);
    const totalCredits = parseInt(document.getElementById('totalCredits').textContent);
    
    let analysis = `
        <p><strong>Current GPA:</strong> ${currentGPA.toFixed(2)} / ${currentGPAScale}</p>
        <p><strong>Total Credits:</strong> ${totalCredits} hours</p>
    `;
    
    // GPA classification
    let classification = '';
    let color = '';
    
    if (currentGPAScale === 4.0) {
        if (currentGPA >= 3.7) {
            classification = 'Summa Cum Laude';
            color = '#38a169';
        } else if (currentGPA >= 3.5) {
            classification = 'Magna Cum Laude';
            color = '#4a9eff';
        } else if (currentGPA >= 3.3) {
            classification = 'Cum Laude';
            color = '#805ad5';
        } else if (currentGPA >= 3.0) {
            classification = 'Good Standing';
            color = '#d69e2e';
        } else if (currentGPA >= 2.0) {
            classification = 'Satisfactory';
            color = '#dd6b20';
        } else {
            classification = 'Below Standards';
            color = '#e53e3e';
        }
    } else {
        if (currentGPA >= 4.5) {
            classification = 'Excellent';
            color = '#38a169';
        } else if (currentGPA >= 4.0) {
            classification = 'Very Good';
            color = '#4a9eff';
        } else if (currentGPA >= 3.5) {
            classification = 'Good';
            color = '#805ad5';
        } else if (currentGPA >= 3.0) {
            classification = 'Satisfactory';
            color = '#d69e2e';
        } else {
            classification = 'Needs Improvement';
            color = '#e53e3e';
        }
    }
    
    analysis += `<p><strong>Classification:</strong> <span style="color: ${color}">${classification}</span></p>`;
    
    // Add college-specific insights
    if (currentGPA >= 3.75) {
        analysis += `<p><strong>📚 Dean's List:</strong> <span style="color: #38a169">Eligible</span> - Excellent academic performance!</p>`;
    } else if (currentGPA >= 3.5) {
        analysis += `<p><strong>📚 Dean's List:</strong> <span style="color: #d69e2e">Close</span> - Need ${(3.75 - currentGPA).toFixed(2)} more points</p>`;
    }
    
    if (currentGPA >= 3.0) {
        analysis += `<p><strong>🎓 Graduation:</strong> <span style="color: #38a169">On Track</span> - Meeting graduation requirements</p>`;
    } else if (currentGPA >= 2.0) {
        analysis += `<p><strong>⚠️ Academic Standing:</strong> <span style="color: #dd6b20">Warning</span> - Consider academic support</p>`;
    } else {
        analysis += `<p><strong>🚨 Academic Standing:</strong> <span style="color: #e53e3e">Probation</span> - Immediate action needed</p>`;
    }
    
    // Graduate school readiness
    if (currentGPA >= 3.5) {
        analysis += `<p><strong>🎯 Graduate School:</strong> <span style="color: #38a169">Competitive</span> - Strong GPA for grad applications</p>`;
    } else if (currentGPA >= 3.0) {
        analysis += `<p><strong>🎯 Graduate School:</strong> <span style="color: #d69e2e">Acceptable</span> - Consider GRE/test prep</p>`;
    }
    
    container.innerHTML = analysis;
}

// Update improvement analysis
function updateImprovementAnalysis() {
    const container = document.getElementById('improvementAnalysis');
    const targetGPA = parseFloat(document.getElementById('targetGPA').value);
    
    if (!targetGPA || grades.length === 0) {
        container.innerHTML = 'Add a target GPA to see improvement strategies';
        return;
    }
    
    const currentGPA = parseFloat(document.getElementById('currentGPA').textContent);
    const totalCredits = parseInt(document.getElementById('totalCredits').textContent);
    
    if (targetGPA <= currentGPA) {
        container.innerHTML = `
            <p style="color: #38a169;">🎉 Great job! You've already achieved your target GPA!</p>
            <p>Consider setting a higher target to continue improving.</p>
        `;
        return;
    }
    
    // Calculate required GPA for next semester
    const creditsNeeded = 15; // Assume 15 credits next semester
    const requiredGPA = ((targetGPA * (totalCredits + creditsNeeded)) - (currentGPA * totalCredits)) / creditsNeeded;
    
    let analysis = `
        <p><strong>Target GPA:</strong> ${targetGPA.toFixed(2)} / ${currentGPAScale}</p>
        <p><strong>Current GPA:</strong> ${currentGPA.toFixed(2)} / ${currentGPAScale}</p>
        <p><strong>Gap:</strong> ${(targetGPA - currentGPA).toFixed(2)} points</p>
    `;
    
    if (requiredGPA <= currentGPAScale && requiredGPA >= 0) {
        analysis += `
            <p><strong>Required Next Semester GPA:</strong> ${requiredGPA.toFixed(2)} / ${currentGPAScale}</p>
            <div class="improvement-tips">
                <h5>💡 Strategies:</h5>
                <ul>
                    <li>Focus on subjects where you can improve most</li>
                    <li>Increase study time by ${Math.ceil((targetGPA - currentGPA) * 10)} hours per week</li>
                    <li>Seek help from tutors or study groups</li>
                    <li>Attend office hours regularly</li>
                </ul>
            </div>
        `;
    } else {
        analysis += `
            <p style="color: #e53e3e;">⚠️ Target may be difficult to achieve with current credit load.</p>
            <p>Consider taking additional courses or retaking courses with lower grades.</p>
        `;
    }
    
    container.innerHTML = analysis;
}

// Update trend analysis
function updateTrendAnalysis() {
    const container = document.getElementById('trendInsights');
    
    if (grades.length < 2) {
        container.innerHTML = 'Track your progress over time with more grades';
        return;
    }
    
    const semesterData = getSemesterGPAData();
    
    if (semesterData.data.length < 2) {
        container.innerHTML = 'Add grades from multiple semesters to see trends';
        return;
    }
    
    const recentGPA = semesterData.data[semesterData.data.length - 1];
    const previousGPA = semesterData.data[semesterData.data.length - 2];
    const trend = recentGPA - previousGPA;
    
    let trendText = '';
    let trendColor = '';
    let trendIcon = '';
    
    if (trend > 0.1) {
        trendText = 'Improving';
        trendColor = '#38a169';
        trendIcon = '📈';
    } else if (trend < -0.1) {
        trendText = 'Declining';
        trendColor = '#e53e3e';
        trendIcon = '📉';
    } else {
        trendText = 'Stable';
        trendColor = '#4a9eff';
        trendIcon = '➡️';
    }
    
    const analysis = `
        <p><strong>Trend:</strong> <span style="color: ${trendColor}">${trendIcon} ${trendText}</span></p>
        <p><strong>Change:</strong> ${trend >= 0 ? '+' : ''}${trend.toFixed(2)} points</p>
        <p><strong>Recent Semester:</strong> ${recentGPA.toFixed(2)} / ${currentGPAScale}</p>
        <p><strong>Previous Semester:</strong> ${previousGPA.toFixed(2)} / ${currentGPAScale}</p>
    `;
    
    container.innerHTML = analysis;
}

// Update target analysis
function updateTargetAnalysis() {
    updateImprovementAnalysis();
}

// Get AI recommendations
async function getAIRecommendations() {
    const container = document.getElementById('aiAnalysis');
    
    if (grades.length === 0) {
        container.innerHTML = '<p>Add some grades first to get AI recommendations!</p>';
        return;
    }
    
    container.innerHTML = '<p>🤖 Generating personalized study plan...</p>';
    
    try {
        // Prepare GPA data for AI
        const gpaData = {
            currentGPA: parseFloat(document.getElementById('currentGPA').textContent),
            targetGPA: parseFloat(document.getElementById('targetGPA').value) || 0,
            scale: currentGPAScale,
            totalCredits: parseInt(document.getElementById('totalCredits').textContent),
            grades: grades.map(g => ({
                subject: g.subject,
                grade: g.grade,
                gpa: getGPAValue(g.grade, g.system),
                credits: g.creditHours,
                semester: g.semester
            })),
            gradingSystem: currentGradingSystem,
            trends: getSemesterGPAData()
        };
        
        // Save GPA data to localStorage for AI access
        localStorage.setItem('gpaData', JSON.stringify(gpaData));
        
        const response = await fetch(`${API_BASE_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Based on my academic performance data (Current GPA: ${gpaData.currentGPA}, Target: ${gpaData.targetGPA || 'Not set'}, ${gpaData.grades.length} courses), create a personalized study plan to improve my GPA. Focus on specific actionable strategies, time management, and subject-specific recommendations. My grades: ${gpaData.grades.map(g => `${g.subject}: ${g.grade} (${g.gpa} GPA)`).join(', ')}`
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            container.innerHTML = `
                <div class="ai-recommendations">
                    <h5>🤖 AI Study Plan</h5>
                    <div class="ai-response">${data.response}</div>
                    <button onclick="getAIRecommendations()" class="ai-btn refresh-btn">Refresh Plan</button>
                </div>
            `;
        } else {
            throw new Error(data.error || 'Failed to get AI recommendations');
        }
    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        container.innerHTML = `
            <p style="color: #e53e3e;">❌ Failed to get AI recommendations</p>
            <p>Make sure the AI service is running and try again.</p>
            <button onclick="getAIRecommendations()" class="ai-btn">Try Again</button>
        `;
    }
}

// Save grades to localStorage
function saveGrades() {
    const data = {
        grades: grades,
        gradingSystem: currentGradingSystem,
        gpaScale: currentGPAScale,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('analyticsData', JSON.stringify(data));
}

// Load grades from localStorage
function loadGrades() {
    const saved = localStorage.getItem('analyticsData');
    
    if (saved) {
        try {
            const data = JSON.parse(saved);
            grades = data.grades || [];
            currentGradingSystem = data.gradingSystem || 'standard';
            currentGPAScale = data.gpaScale || 4.0;
            
            // Update UI
            document.getElementById('gradingSystem').value = currentGradingSystem;
            document.getElementById('gpaScale').value = currentGPAScale.toString();
            
            displayGrades();
        } catch (error) {
            console.error('Error loading grades:', error);
            grades = [];
        }
    }
}

// Calculate academic standing based on GPA
function calculateAcademicStanding(gpa) {
    const standingElement = document.getElementById('academicStanding');
    const detailsElement = document.getElementById('standingDetails');
    const cardElement = standingElement.closest('.gpa-card');
    
    // Remove existing classes
    cardElement.classList.remove('warning', 'probation', 'honor');
    
    if (gpa >= 3.5) {
        if (gpa >= 3.75) {
            standingElement.textContent = "Dean's List";
            detailsElement.textContent = "Excellent Academic Performance";
            cardElement.classList.add('honor');
        } else {
            standingElement.textContent = "Good Standing";
            detailsElement.textContent = "Above Average Performance";
        }
    } else if (gpa >= 2.5) {
        standingElement.textContent = "Good Standing";
        detailsElement.textContent = "Satisfactory Progress";
    } else if (gpa >= 2.0) {
        standingElement.textContent = "Academic Warning";
        detailsElement.textContent = "Below Expected Performance";
        cardElement.classList.add('warning');
    } else if (gpa >= 1.5) {
        standingElement.textContent = "Academic Probation";
        detailsElement.textContent = "Improvement Required";
        cardElement.classList.add('probation');
    } else {
        standingElement.textContent = "Academic Probation";
        detailsElement.textContent = "At Risk of Suspension";
        cardElement.classList.add('probation');
    }
}

// Smooth scrolling function for navigation buttons
function scrollToSection(sectionName) {
    const sectionMap = {
        'gpaConfig': 'gpaConfig',
        'gradeManagement': 'gradeManagement', 
        'gpaDashboard': 'gpaDashboard',
        'performanceChart': 'performanceChart'
    };
    
    const elementId = sectionMap[sectionName];
    if (elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
            
            // Add a subtle highlight effect
            element.style.transition = 'background-color 0.3s ease';
            element.style.backgroundColor = 'var(--highlight-color, rgba(76, 175, 80, 0.1))';
            setTimeout(() => {
                element.style.backgroundColor = '';
            }, 2000);
        }
    }
}