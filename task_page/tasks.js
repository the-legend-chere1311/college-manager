document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const closeModalBtn = document.getElementById('close-modal');
    const taskForm = document.getElementById('task-form');
    const notStartedList = document.getElementById('not-started');
    const inProgressList = document.getElementById('in-progress');
    const taskDetails = document.getElementById('task-details');
    const editTaskBtn = document.getElementById('edit-task-btn');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const taskStatusSelect = document.getElementById('task-status-select');
    const taskStatusUpdate = document.querySelector('.task-status-update');
    const completedDropdownBtn = document.getElementById('completed-dropdown-btn');
    const completedTasksList = document.getElementById('completed-tasks-list');
    const server = "http://localhost:5001/tasks";
    let selectedTask = null;

    // Show the modal when clicking "Add Task"
    addTaskBtn.addEventListener('click', () => {
        selectedTask = null; // Clear the selected task for new entry
        taskForm.reset();
        taskModal.classList.remove('hidden');
    });

    // Hide the modal when clicking the close button
    closeModalBtn.addEventListener('click', () => {
        taskModal.classList.add('hidden');
    });

    // Add/Edit a task when the form is submitted
    taskForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('task-name').value.trim();
        const subject = document.getElementById('task-subject').value.trim();
        const dueDate = document.getElementById('task-due-date').value;
        const priority = document.getElementById('task-priority').value;
        const subtasks = document
            .getElementById('task-subtasks')
            .value.trim()
            .split(',')
            .map(task => task.trim())
            .filter(task => task !== '');
        
            try {
            let response;
            if (selectedTask) {
                response = await fetch(`${server}/${selectedTask._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        ...selectedTask,
                        name, 
                        subject, 
                        dueDate, 
                        priority, 
                        subtasks 
                    }),
                });
            } else {
                response = await fetch(`${server}/newTask`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, subject, dueDate, priority, subtasks }),
                });
            }
            if (!response.ok) {
                throw new Error('Failed to save task');
            }
            const savedTask = await response.json();
            if (!selectedTask) {
                addTaskToDOM(savedTask);
            } else {
                updateTaskInDOM(savedTask);
            }
            taskModal.classList.add('hidden');
        } catch (error) {
            console.error('Error saving task:', error);
            alert('Error saving task. Please try again.');
        }
    });

    // Function to add a task card to the DOM
    function addTaskToDOM(task) {
        const taskList = document.getElementById(task.status.replace('-', ' ')) || notStartedList;
        const taskCard = createTaskCard(task);
        taskList.appendChild(taskCard);
    }

    // Function to create a task card
    function createTaskCard(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.priority}-priority`;
        taskCard.textContent = task.name.charAt(0).toUpperCase() + task.name.slice(1).toLowerCase();
        taskCard.dataset.id = task._id;
        taskCard.dataset.status = task.status; 
        taskCard.addEventListener('click', () => {
            displayTaskDetails(task);
        });
        return taskCard;
    }

    // Function to update an existing task card in the DOM
    function updateTaskInDOM(task) {
        const taskCard = document.querySelector(`.task-card[data-id='${task._id}']`);
        if (taskCard) {
            taskCard.textContent = task.name.charAt(0).toUpperCase() + task.name.slice(1).toLowerCase();
            taskCard.className = `task-card ${task.priority}-priority`;
            taskCard.dataset.status = task.status;
            const currentList = taskCard.parentElement;
            const targetList = document.getElementById(task.status);        
            if (targetList && currentList.id !== task.status) {
                taskCard.remove();
                targetList.appendChild(taskCard);
            }
            if (selectedTask && selectedTask._id === task._id) {
                displayTaskDetails(task);
            }
        }
    }

    // Function to display task details and show buttons
    function displayTaskDetails(task) {
        selectedTask = task;
        taskDetails.innerHTML = `
            <p><strong>Name:</strong> ${task.name.charAt(0).toUpperCase() + task.name.slice(1).toLowerCase()}</p>
            <p><strong>Subject:</strong> ${task.subject.charAt(0).toUpperCase() + task.subject.slice(1).toLowerCase()}</p>
            <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
            <p><strong>Priority:</strong> ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1).toLowerCase()}</p>
            <p><strong>Subtasks:</strong> ${task.subtasks.join(', ') || 'None'}</p>
        `;

        taskStatusUpdate.classList.remove('hidden');
        taskStatusSelect.value = task.status;
        editTaskBtn.style.display = 'block'; 
        deleteTaskBtn.style.display = 'block';
    }

    // Handle status changes
    taskStatusSelect.addEventListener('change', async () => {
        if (!selectedTask) return;
        const newStatus = taskStatusSelect.value;
        const oldStatus = selectedTask.status;
        try {
            console.log(`Updating status for task ID ${selectedTask._id} to ${newStatus}...`);
            const response = await fetch(`${server}/${selectedTask._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.ok) throw new Error('Failed to update task status');
            const updatedTask = await response.json();
            selectedTask = updatedTask;
            const oldTaskCard = document.querySelector(`.task-card[data-id="${selectedTask._id}"]`);
            if (oldTaskCard) oldTaskCard.remove();
            if (newStatus === 'completed') {
                updateCompletedTasksList();
            } else if (oldStatus === 'completed') {
                const targetList = document.getElementById(newStatus);
                if (targetList) {
                    const newTaskCard = createTaskCard(updatedTask);
                    targetList.appendChild(newTaskCard);
                }
            } else {
                const targetList = document.getElementById(newStatus);
                if (targetList) {
                    const newTaskCard = createTaskCard(updatedTask);
                    targetList.appendChild(newTaskCard);
                }
            }
            displayTaskDetails(updatedTask);
            console.log('Task status updated successfully!');
        } catch (error) {
            console.error('Error updating task status:', error);
            alert('Error updating task status. Please try again.');
            taskStatusSelect.value = oldStatus;
        }
    });
    
    async function updateCompletedTasksList() {
        try {
            const response = await fetch(`${server}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const tasks = await response.json();
            const completedTasks = tasks.filter(task => task.status === 'completed');
            completedTasksList.innerHTML = ''; 
            if (completedTasks.length > 0) {
                completedTasks.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'completed-task-item';
                    taskItem.dataset.id = task._id;
                    taskItem.textContent = `${task.name} (${task.subject})`;
                    taskItem.addEventListener('click', () => {
                        displayTaskDetails(task);
                    });
                    completedTasksList.appendChild(taskItem);
                });
            } else {
                completedTasksList.innerHTML = '<div class="completed-task-item">No completed tasks</div>';
            }
        } catch (error) {
            console.error('Error updating completed tasks list:', error);
        }
    }
    


    // Handle task deselection
    document.body.addEventListener('click', (e) => {
        const taskCard = e.target.closest('.task-card');
        const isModalClick = e.target.closest('.modal-content');
        const isEditButtonClick = e.target === editTaskBtn;
        const isDeleteButtonClick = e.target === deleteTaskBtn;
        const isStatusSelect = e.target === taskStatusSelect;
        const isCompletedTask = e.target.closest('.completed-task-item');
        
        if (!taskCard && !isModalClick && !isEditButtonClick && !isDeleteButtonClick && !taskDetails.contains(e.target) && !isStatusSelect && !isCompletedTask) {
            resetTaskDetailsAndButtons();
        }
    });

    // Edit button functionality
    editTaskBtn.addEventListener('click', () => {
        if (selectedTask) {
            populateModal(selectedTask);
            taskModal.classList.remove('hidden');
        }
    });

    // Delete button functionality with duplicate prevention
    deleteTaskBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!selectedTask || !selectedTask._id) return;
        const taskId = selectedTask._id;
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                const response = await fetch(`${server}/${taskId}`, {
                    method: 'DELETE'
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const taskCard = document.querySelector(`.task-card[data-id='${taskId}']`);
                if (taskCard) {
                    taskCard.remove();
                }
                resetTaskDetailsAndButtons();
            } catch (error) {
                console.error('Error deleting task:', error);
                alert('Error deleting task. Please try again.');
            }
        }
    });

    // Separate function for resetting state and UI
    function resetTaskDetailsAndButtons() {
        selectedTask = null;
        taskDetails.innerHTML = '<p>Select a task to view details.</p>';
        editTaskBtn.style.display = 'none';
        deleteTaskBtn.style.display = 'none';
        taskStatusSelect.classList.add('hidden');
        taskStatusUpdate.classList.add('hidden');
    }

    // Populate the modal with task details
    function populateModal(task) {
        document.getElementById('task-name').value = task.name;
        document.getElementById('task-subject').value = task.subject;
        document.getElementById('task-due-date').value = task.dueDate.split('T')[0];
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-subtasks').value = task.subtasks.join(', ');
    }

    // Load tasks from the backend
    async function loadTasks() {
        try {
            console.log("Fetching tasks");
            const response = await fetch(`${server}`);
            if (!response.ok) {
                throw new Error('Failed to fetch tasks');
            }
            const tasks = await response.json();
            console.log("Tasks fetched", tasks);
            document.querySelectorAll('.task-list').forEach(list => {
                list.innerHTML = '';
            });
            tasks.forEach(task => {
                if (task.status === 'completed') {
                    return;
                }
                const targetListId = task.status;
                const targetList = document.getElementById(targetListId);
                if (targetList) {
                    const taskCard = createTaskCard(task);
                    targetList.appendChild(taskCard);
                } else {
                    console.warn(`Invalid status for task: ${task.status}`);
                }
            });
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    // Toggle completed tasks dropdown
    completedDropdownBtn.addEventListener('click', () => {
        completedTasksList.classList.toggle('hidden');
        completedDropdownBtn.querySelector('.dropdown-arrow').classList.toggle('open');
        if (!completedTasksList.classList.contains('hidden')) {
            loadCompletedTasks();
        }
    });

    // Load Completed Tasks
    async function loadCompletedTasks() {
        try {
            const response = await fetch(`${server}`);
            if (!response.ok) throw new Error('Failed to fetch tasks');
            const tasks = await response.json();
            const completedTasks = tasks.filter(task => task.status === 'completed');
            completedTasksList.innerHTML = '';
            if (completedTasks.length > 0) {
                completedTasks.forEach(task => {
                    const taskItem = document.createElement('div');
                    taskItem.className = 'completed-task-item';
                    taskItem.dataset.id = task._id;
                    taskItem.textContent = `${task.name} (${task.subject})`;
                    
                    taskItem.addEventListener('click', () => {
                        displayTaskDetails(task);
                    });
                    
                    completedTasksList.appendChild(taskItem);
                });
            } else {
                completedTasksList.innerHTML = '<div class="completed-task-item">No completed tasks</div>';
            }
        } catch (error) {
            console.error('Error loading completed tasks:', error);
        }
    }

    loadTasks();
});