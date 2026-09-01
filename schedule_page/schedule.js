document.addEventListener("DOMContentLoaded", function () {
let calendarEl = document.getElementById("calendar");

// Modal references
const modal = document.getElementById("eventModal");
const modalTitle = document.getElementById("modalTitle");
const eventTitleInput = document.getElementById("eventTitle");
const saveBtn = document.getElementById("saveEventBtn");
const deleteBtn = document.getElementById("deleteEventBtn");
const cancelBtn = document.getElementById("cancelEventBtn");

// Duration control references
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const customDurationInput = document.getElementById("customDuration");
const applyCustomDurationBtn = document.getElementById("applyCustomDuration");

// Export/Import references
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");let selectedDate = null;
let selectedEvent = null;

let calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    nowIndicator: true,
    slotMinTime: "07:00:00",
    slotMaxTime: "22:00:00",
    slotDuration: "00:15:00", // 15-minute slots for more granular selection
    slotLabelInterval: "01:00:00", // Show hour labels
    allDaySlot: false,
    selectable: true,
    selectMirror: true,
    selectOverlap: false,
    selectMinDistance: 5, // Allow very short selections
    editable: true,
    headerToolbar: {
    left: "prev,next today",
    center: "title",
    right: "timeGridDay,timeGridWeek,dayGridMonth",
    },

    // Handle range selection (multi-hour events)
    select: function(info) {
    selectedDate = info.start;
    selectedEvent = null;
    
    // Store both start and end times for multi-hour events
    window.selectedStartDate = info.start;
    window.selectedEndDate = info.end;
    
    modalTitle.textContent = "Add Event";
    eventTitleInput.value = "";
    deleteBtn.style.display = "none";
    modal.style.display = "flex";
    
    // Update time inputs with selected range
    updateTimeInputs(info.start, info.end);
    },

    // Keep single click functionality for quick events
    dateClick: function (info) {
    selectedDate = info.date;
    selectedEvent = null;
    
    // For single clicks, set default 30-minute duration (one slot)
    const startDate = info.date;
    const endDate = new Date(info.date.getTime() + 30 * 60 * 1000); // 30 minutes later
    
    window.selectedStartDate = startDate;
    window.selectedEndDate = endDate;
    
    modalTitle.textContent = "Add Event";
    eventTitleInput.value = "";
    deleteBtn.style.display = "none";
    modal.style.display = "flex";
    
    // Update time inputs
    updateTimeInputs(startDate, endDate);
    },

    // Open modal when clicking event
    eventClick: function (info) {
    selectedEvent = info.event;
    modalTitle.textContent = "Edit Event";
    eventTitleInput.value = info.event.title;
    deleteBtn.style.display = "inline-block";
    modal.style.display = "flex";
    
    // Update time inputs for existing events
    const startDate = info.event.start;
    const endDate = info.event.end || new Date(startDate.getTime() + 30 * 60 * 1000);
    
    window.selectedStartDate = startDate;
    window.selectedEndDate = endDate;
    
    updateTimeInputs(startDate, endDate);
    },
});

  // Save button (add or update event)
saveBtn.addEventListener("click", function () {
    const title = eventTitleInput.value.trim();
    if (title === "") {
    alert("Title cannot be empty!");
    return;
    }
    // Get current start and end times from inputs
    const currentStart = getDateTimeFromInputs();
    const currentEnd = getEndDateTimeFromInputs();
    if (selectedEvent) {
        // Edit existing event
        selectedEvent.setProp("title", title);
        selectedEvent.setStart(currentStart);
        selectedEvent.setEnd(currentEnd);
    } else {
        // Add new event with custom times
        calendar.addEvent({
            title: title,
            start: currentStart,
            end: currentEnd,
            allDay: false,
        });
    }
    modal.style.display = "none";
    // Clear the selection after creating event
    calendar.unselect();
    // Save events to localStorage
    saveEventsToStorage();
});

  // Delete button
deleteBtn.addEventListener("click", function () {
    if (selectedEvent) {
    selectedEvent.remove();
    // Save events to localStorage after deletion
    saveEventsToStorage();
    }
    modal.style.display = "none";
});

  // Cancel button
cancelBtn.addEventListener("click", function () {
    modal.style.display = "none";
    // Clear the selection when canceling
    calendar.unselect();
});

  // Close modal if background clicked
window.addEventListener("click", function (e) {
    if (e.target === modal) {
    modal.style.display = "none";
    // Clear the selection when closing modal
    calendar.unselect();
    }
});

// Duration control event listeners
startTimeInput.addEventListener("change", function() {
    window.selectedStartDate = getDateTimeFromInputs();
    updateDurationButtons();
});

endTimeInput.addEventListener("change", function() {
    window.selectedEndDate = getEndDateTimeFromInputs();
    updateDurationButtons();
});

// Quick duration buttons
document.addEventListener("click", function(e) {
    if (e.target.classList.contains('duration-btn')) {
        const minutes = parseInt(e.target.dataset.minutes);
        setDurationFromStart(minutes);
    }
});

// Custom duration input
applyCustomDurationBtn.addEventListener("click", function() {
    const minutes = parseInt(customDurationInput.value);
    if (minutes && minutes > 0) {
        setDurationFromStart(minutes);
        customDurationInput.value = ""; // Clear input
    } else {
        alert("Please enter a valid duration in minutes (1-1440)");
    }
});

// Allow Enter key to apply custom duration
customDurationInput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        applyCustomDurationBtn.click();
    }
});

// Functions for localStorage management
function saveEventsToStorage() {
    const events = calendar.getEvents().map(event => ({
        title: event.title,
        start: event.start ? event.start.toISOString() : null,
        end: event.end ? event.end.toISOString() : null,
        allDay: event.allDay
    }));
    localStorage.setItem('calendarEvents', JSON.stringify(events));
}

function loadEventsFromStorage() {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
        const events = JSON.parse(savedEvents);
        events.forEach(eventData => {
            calendar.addEvent({
                title: eventData.title,
                start: eventData.start,
                end: eventData.end,
                allDay: eventData.allDay
            });
        });
    }
}

// Load events when calendar is rendered
calendar.render();
loadEventsFromStorage();

// Helper function to format time for input[type="time"]
function formatTimeForInput(date) {
    return date.toTimeString().slice(0, 5); // HH:MM format
}

// Helper function to get date with time from inputs
function getDateTimeFromInputs() {
    const timeValue = startTimeInput.value;
    if (!timeValue) return window.selectedStartDate;
    
    const [hours, minutes] = timeValue.split(':').map(Number);
    const date = new Date(window.selectedStartDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Helper function to get end date with time from inputs
function getEndDateTimeFromInputs() {
    const timeValue = endTimeInput.value;
    if (!timeValue) return window.selectedEndDate;
    
    const [hours, minutes] = timeValue.split(':').map(Number);
    const startDate = getDateTimeFromInputs();
    const endDate = new Date(startDate);
    endDate.setHours(hours, minutes, 0, 0);
    
    // If end time is before start time, assume it's next day
    if (endDate <= startDate) {
        endDate.setDate(endDate.getDate() + 1);
    }
    
    return endDate;
}

// Update time inputs based on dates
function updateTimeInputs(startDate, endDate) {
    window.selectedStartDate = startDate;
    window.selectedEndDate = endDate;
    
    startTimeInput.value = formatTimeForInput(startDate);
    endTimeInput.value = formatTimeForInput(endDate);
    
    // Update quick duration button highlighting
    updateDurationButtons();
}

// Update duration button highlighting
function updateDurationButtons() {
    const duration = (window.selectedEndDate - window.selectedStartDate) / (1000 * 60);
    const buttons = document.querySelectorAll('.duration-btn');
    
    buttons.forEach(btn => {
        const btnMinutes = parseInt(btn.dataset.minutes);
        if (btnMinutes === duration) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// Set duration from start time + minutes
function setDurationFromStart(minutes) {
    const startDate = getDateTimeFromInputs();
    const endDate = new Date(startDate.getTime() + minutes * 60 * 1000);
    
    window.selectedEndDate = endDate;
    endTimeInput.value = formatTimeForInput(endDate);
    
    updateDurationButtons();
}

  // Export functionality
exportBtn.addEventListener("click", function () {
    try {
    const events = calendar.getEvents();

    if (events.length === 0) {
        alert("No events to export!");
        return;
}

// Create ICS content
let icsContent = "BEGIN:VCALENDAR\r\n";
icsContent += "VERSION:2.0\r\n";
icsContent += "PRODID:-//School Manager//Schedule Export//EN\r\n";
icsContent += "CALSCALE:GREGORIAN\r\n";

events.forEach((event, index) => {
    const startDate = event.start || new Date();
    const endDate = event.end || new Date(startDate.getTime() + 60 * 60 * 1000); // Default 1 hour duration
        
// Format dates to ICS format (YYYYMMDDTHHMMSSZ)
const formatDate = (date) => {
return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

icsContent += "BEGIN:VEVENT\r\n";
icsContent += `UID:${Date.now()}-${index}@school-manager\r\n`;
icsContent += `DTSTART:${formatDate(startDate)}\r\n`;
icsContent += `DTEND:${formatDate(endDate)}\r\n`;
icsContent += `SUMMARY:${event.title || 'Untitled Event'}\r\n`;
icsContent += `CREATED:${formatDate(new Date())}\r\n`;
icsContent += `LAST-MODIFIED:${formatDate(new Date())}\r\n`;
icsContent += "END:VEVENT\r\n";
});

icsContent += "END:VCALENDAR\r\n";

// Create and download file
const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
const url = window.URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `schedule-${new Date().toISOString().split('T')[0]}.ics`;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
window.URL.revokeObjectURL(url);

alert(`Successfully exported ${events.length} events!`);
} catch (error) {
    console.error('Export error:', error);
    alert('Error exporting calendar. Please try again.');
    }
});

  // Import functionality
importFile.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

if (!file.name.toLowerCase().endsWith('.ics')) {
    alert('Please select a valid .ics file');
    return;
    }

const reader = new FileReader();
reader.onload = function (e) {
try {
    const icsContent = e.target.result;
    // Simple ICS parser (basic implementation)
    const events = parseICS(icsContent);
    if (events.length === 0) {
        alert('No events found in the ICS file');
        return;
    }

// Add events to calendar
events.forEach(event => {
    calendar.addEvent(event);
});

// Save imported events to localStorage
saveEventsToStorage();

alert(`Successfully imported ${events.length} events!`);
} catch (error) {
    console.error('Import error:', error);
    alert('Error importing calendar file. Please check the file format.');
}
};
reader.readAsText(file);
    // Reset file input
    e.target.value = '';
});

  // Simple ICS parser function
function parseICS(icsContent) {
    const events = [];
    const lines = icsContent.split(/\r\n|\n|\r/);
    let inEvent = false;
    let currentEvent = {};

    for (let line of lines) {
        line = line.trim();
        if (line === 'BEGIN:VEVENT') {
            inEvent = true;
            currentEvent = {};
        } else if (line === 'END:VEVENT' && inEvent) {
            if (currentEvent.title && currentEvent.start) {
                events.push({
                    title: currentEvent.title,
                    start: currentEvent.start,
                    end: currentEvent.end,
                    allDay: currentEvent.allDay || false
                });
            }
            inEvent = false;
        } else if (inEvent) {
            if (line.startsWith('SUMMARY:')) {
                currentEvent.title = line.substring(8);
            } else if (line.startsWith('DTSTART:')) {
                currentEvent.start = parseICSDate(line.substring(8));
            } else if (line.startsWith('DTEND:')) {
                currentEvent.end = parseICSDate(line.substring(6));
            } else if (line.startsWith('DTSTART;VALUE=DATE:')) {
                currentEvent.start = parseICSDate(line.substring(19));
                currentEvent.allDay = true;
            }
        }
    }

    return events;
}

  // Parse ICS date format
function parseICSDate(dateStr) {
    if (!dateStr) return null;
    
    // Handle different date formats
    if (dateStr.length === 8) {
      // YYYYMMDD format (all-day events)
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(year, month - 1, day);
    } else if (dateStr.length === 15 && dateStr.endsWith('Z')) {
      // YYYYMMDDTHHMMSSZ format (UTC)
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
    
    return null;
}
});
