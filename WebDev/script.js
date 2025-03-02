// Task Manager Class
class TaskManager {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.projects = JSON.parse(localStorage.getItem('projects')) || [
            { id: 'work', name: 'Work', icon: 'fas fa-briefcase' },
            { id: 'personal', name: 'Personal', icon: 'fas fa-user' }
        ];
        this.currentView = 'all';
        this.currentProject = null;
        this.currentLayout = 'list';
        this.currentSort = 'date';
        this.init();
    }

    init() {
        // Initialize UI components
        this.setupEventListeners();
        this.loadThemePreference();
        this.renderTasks();
        this.updateProjectsList();
        this.updateStats();
        
        // Show task details form when focusing on input
        document.getElementById('taskInput').addEventListener('focus', () => {
            document.getElementById('taskDetailsContainer').classList.remove('hidden');
        });
        
        // Auto-select today's date in the date picker
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('taskDueDate').value = today;
        
        // Set up initial view
        document.querySelector(`.main-nav li[data-view="${this.currentView}"]`).classList.add('active');
        
        // Init animations with a small delay for better UX
        setTimeout(() => {
            document.body.classList.add('app-loaded');
        }, 100);
    }

    setupEventListeners() {
        // Add task form
        document.getElementById('addTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTask();
        });
        
        // Navigation items
        document.querySelectorAll('.main-nav li').forEach(item => {
            item.addEventListener('click', () => {
                this.changeView(item.dataset.view);
            });
        });
        
        // Project items
        document.getElementById('projectsList').addEventListener('click', (e) => {
            const projectItem = e.target.closest('li[data-project]');
            if (projectItem) {
                this.filterByProject(projectItem.dataset.project);
            }
        });
        
        // Add project button
        document.getElementById('addProjectBtn').addEventListener('click', () => {
            this.showProjectModal();
        });
        
        // Layout view buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.addEventListener('click', () => {
                this.changeLayout(btn.dataset.layout);
            });
        });
        
        // Sort options
        document.getElementById('sortOptions').addEventListener('change', (e) => {
            this.changeSort(e.target.value);
        });
        
        // Theme toggle
        document.getElementById('theme-switch').addEventListener('change', (e) => {
            this.toggleTheme(e.target.checked);
        });
        
        // Add project form
        document.getElementById('addProjectForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addProject();
        });
        
        // Edit task form
        document.getElementById('editTaskForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTask();
        });
        
        // Delete task button
        document.getElementById('deleteTaskBtn').addEventListener('click', () => {
            this.deleteTask(document.getElementById('editTaskId').value);
        });
        
        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeAllModals();
            });
        });
        
        // Close modals on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') && e.target.classList.contains('show')) {
                this.closeAllModals();
            }
        });
    }

    // Task Operations
    addTask() {
        const taskInput = document.getElementById('taskInput');
        const taskTitle = taskInput.value.trim();
        
        if (!taskTitle) return;
        
        const taskDueDate = document.getElementById('taskDueDate').value;
        const taskPriority = document.getElementById('taskPriority').value;
        const taskProject = document.getElementById('taskProject').value === 'none' ? null : document.getElementById('taskProject').value;
        const taskDescription = document.getElementById('taskDescription').value.trim();
        
        const newTask = {
            id: Date.now().toString(),
            title: taskTitle,
            description: taskDescription,
            dueDate: taskDueDate,
            priority: taskPriority,
            project: taskProject,
            completed: false,
            starred: false,
            createdAt: new Date().toISOString()
        };
        
        this.tasks.unshift(newTask);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        
        // Reset form
        taskInput.value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskDetailsContainer').classList.add('hidden');
        
        // Show notification
        this.showNotification('success', 'Task Added', 'Your task has been added successfully');
    }
    
    updateTask() {
        const taskId = document.getElementById('editTaskId').value;
        const taskIndex = this.tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return;
        
        const task = this.tasks[taskIndex];
        
        task.title = document.getElementById('editTaskTitle').value;
        task.description = document.getElementById('editTaskDescription').value;
        task.dueDate = document.getElementById('editTaskDueDate').value;
        task.priority = document.getElementById('editTaskPriority').value;
        task.project = document.getElementById('editTaskProject').value === 'none' ? null : document.getElementById('editTaskProject').value;
        
        this.saveTasks();
        this.renderTasks();
        this.closeAllModals();
        
        // Show notification
        this.showNotification('info', 'Task Updated', 'Your task has been updated successfully');
    }
    
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(task => task.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        this.updateStats();
        this.closeAllModals();
        
        // Show notification
        this.showNotification('warning', 'Task Deleted', 'Your task has been deleted');
    }
    
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.updateStats();
            
            // Show notification
            const message = task.completed ? 'Task marked as completed' : 'Task marked as incomplete';
            this.showNotification('success', 'Status Updated', message);
        }
    }
    
    toggleTaskStar(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.starred = !task.starred;
            this.saveTasks();
            this.renderTasks();
            
            // Show notification
            const message = task.starred ? 'Task marked as important' : 'Task unmarked as important';
            this.showNotification('info', 'Task Updated', message);
        }
    }
    
    toggleTaskDetails(taskId) {
        const taskElement = document.querySelector(`.task-item[data-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.toggle('expanded');
        }
    }

    // Project Operations
    addProject() {
        const projectName = document.getElementById('projectName').value.trim();
        const projectIcon = document.getElementById('projectIcon').value;
        
        if (!projectName) return;
        
        const projectId = projectName.toLowerCase().replace(/\s+/g, '-');
        
        // Check if project already exists
        if (this.projects.some(project => project.id === projectId)) {
            this.showNotification('error', 'Error', 'A project with this name already exists');
            return;
        }
        
        const newProject = {
            id: projectId,
            name: projectName,
            icon: projectIcon
        };
        
        this.projects.push(newProject);
        this.saveProjects();
        this.updateProjectsList();
        this.updateProjectsInForms();
        this.closeAllModals();
        
        // Show notification
        this.showNotification('success', 'Project Added', 'Your new project has been created');
    }
    
    updateProjectsList() {
        const projectsList = document.getElementById('projectsList');
        projectsList.innerHTML = '';
        
        this.projects.forEach(project => {
            const li = document.createElement('li');
            li.dataset.project = project.id;
            li.innerHTML = `<i class="${project.icon}"></i> ${project.name}`;
            
            if (this.currentProject === project.id) {
                li.classList.add('active');
            }
            
            projectsList.appendChild(li);
        });
        
        this.updateProjectsInForms();
    }
    
    updateProjectsInForms() {
        // Update project dropdowns in the add task form and edit task form
        const addTaskProject = document.getElementById('taskProject');
        const editTaskProject = document.getElementById('editTaskProject');
        
        // Preserve selected values
        const addSelectedValue = addTaskProject.value;
        const editSelectedValue = editTaskProject.value;
        
        // Clear options except the "None" option
        while (addTaskProject.options.length > 1) {
            addTaskProject.remove(1);
        }
        
        while (editTaskProject.options.length > 1) {
            editTaskProject.remove(1);
        }
        
        // Add project options
        this.projects.forEach(project => {
            const addOption = new Option(project.name, project.id);
            const editOption = new Option(project.name, project.id);
            
            addTaskProject.add(addOption);
            editTaskProject.add(editOption);
        });
        
        // Restore selected values if they still exist in the options
        if ([...addTaskProject.options].some(option => option.value === addSelectedValue)) {
            addTaskProject.value = addSelectedValue;
        }
        
        if ([...editTaskProject.options].some(option => option.value === editSelectedValue)) {
            editTaskProject.value = editSelectedValue;
        }
    }

    // View & Filter Operations
    changeView(view) {
        this.currentView = view;
        this.currentProject = null;
        
        // Update active class in navigation
        document.querySelectorAll('.main-nav li').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.main-nav li[data-view="${view}"]`).classList.add('active');
        
        // Update header
        document.getElementById('currentView').textContent = this.getViewTitle(view);
        
        // Remove active class from project items
        document.querySelectorAll('.projects-list li').forEach(item => {
            item.classList.remove('active');
        });
        
        this.renderTasks();
    }
    
    filterByProject(projectId) {
        this.currentView = 'project';
        this.currentProject = projectId;
        
        // Update active class in navigation
        document.querySelectorAll('.main-nav li').forEach(item => {
            item.classList.remove('active');
        });
        
        // Update active class in projects
        document.querySelectorAll('.projects-list li').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.projects-list li[data-project="${projectId}"]`).classList.add('active');
        
        // Update header
        const project = this.projects.find(project => project.id === projectId);
        document.getElementById('currentView').textContent = project ? project.name : 'Project';
        
        this.renderTasks();
    }
    
    changeLayout(layout) {
        this.currentLayout = layout;
        
        // Update active class in layout buttons
        document.querySelectorAll('.btn-view').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.btn-view[data-layout="${layout}"]`).classList.add('active');
        
        // Update tasks container class
        const tasksContainer = document.getElementById('tasksContainer');
        tasksContainer.className = `tasks-container ${layout}-view`;
    }
    
    changeSort(sortBy) {
        this.currentSort = sortBy;
        this.renderTasks();
    }
    
    getFilteredTasks() {
        let filteredTasks = [...this.tasks];
        
        // Apply view filter
        switch (this.currentView) {
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = filteredTasks.filter(task => task.dueDate === today);
                break;
            case 'upcoming':
                const todayDate = new Date().toISOString().split('T')[0];
                filteredTasks = filteredTasks.filter(task => task.dueDate > todayDate);
                break;
            case 'important':
                filteredTasks = filteredTasks.filter(task => task.starred);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(task => task.completed);
                break;
            case 'project':
                filteredTasks = filteredTasks.filter(task => task.project === this.currentProject);
                break;
        }
        
        // Apply sorting
        switch (this.currentSort) {
            case 'date':
                filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
                break;
            case 'priority':
                const priorityOrder = { high: 1, medium: 2, low: 3 };
                filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
                break;
            case 'name':
                filteredTasks.sort((a, b) => a.title.localeCompare(b.title));
                break;
        }
        
        return filteredTasks;
    }
    
    getViewTitle(view) {
        const viewTitles = {
            all: 'All Tasks',
            today: 'Today',
            upcoming: 'Upcoming Tasks',
            important: 'Important Tasks',
            completed: 'Completed Tasks',
            project: 'Project Tasks'
        };
        
        return viewTitles[view] || 'Tasks';
    }

    // Render Methods
    renderTasks() {
        const tasksContainer = document.getElementById('tasksContainer');
        const emptyState = document.getElementById('emptyState');
        const filteredTasks = this.getFilteredTasks();
        
        tasksContainer.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            tasksContainer.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }
        
        tasksContainer.style.display = this.currentLayout === 'list' ? 'flex' : 'grid';
        emptyState.style.display = 'none';
        
        filteredTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
    }
    
    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-item ${task.completed ? 'completed' : ''} ${task.priority}-priority`;
        taskElement.dataset.id = task.id;
        
        const taskHeader = document.createElement('div');
        taskHeader.className = 'task-header';
        
        // Task checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;
        checkbox.addEventListener('change', () => this.toggleTaskCompletion(task.id));
        
        // Task title
        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;
        
        // Task actions
        const actions = document.createElement('div');
        actions.className = 'task-actions';
        
        // Star button
        const starBtn = document.createElement('button');
        starBtn.className = `task-btn star-btn ${task.starred ? 'starred' : ''}`;
        starBtn.innerHTML = `<i class="fas ${task.starred ? 'fa-star' : 'fa-star'}"></i>`;
        starBtn.addEventListener('click', () => this.toggleTaskStar(task.id));
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.className = 'task-btn edit-btn';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.addEventListener('click', () => this.showTaskModal(task));
        
        // Expand button
        const expandBtn = document.createElement('button');
        expandBtn.className = 'task-btn expand-btn';
        expandBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        expandBtn.addEventListener('click', () => this.toggleTaskDetails(task.id));
        
        // Append action buttons
        actions.appendChild(starBtn);
        actions.appendChild(editBtn);
        actions.appendChild(expandBtn);
        
        // Append header elements
        taskHeader.appendChild(checkbox);
        taskHeader.appendChild(title);
        taskHeader.appendChild(actions);
        
        // Task details
        const taskDetails = document.createElement('div');
        taskDetails.className = 'task-details';
        
        let detailsHTML = '';
        
        if (task.description) {
            detailsHTML += `<div class="task-description">${task.description}</div>`;
        }
        
        detailsHTML += '<div class="task-meta">';
        
        // Due date
        if (task.dueDate) {
            const formattedDate = this.formatDate(task.dueDate);
            detailsHTML += `
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
            `;
        }
        
        // Priority
        if (task.priority) {
            const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
            detailsHTML += `
                <div class="meta-item">
                    <span class="priority-badge priority-${task.priority}">
                        <i class="fas fa-flag"></i> ${priorityLabel}
                    </span>
                </div>
            `;
        }
        
        // Project
        if (task.project) {
            const project = this.projects.find(p => p.id === task.project);
            if (project) {
                detailsHTML += `
                    <div class="meta-item">
                        <span class="project-badge">
                            <i class="${project.icon}"></i> ${project.name}
                        </span>
                    </div>
                `;
            }
        }
        
        detailsHTML += '</div>';
        taskDetails.innerHTML = detailsHTML;
        
        // Append all elements to task element
        taskElement.appendChild(taskHeader);
        taskElement.appendChild(taskDetails);
        
        return taskElement;
    }
    
    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        
        document.getElementById('totalTasksCount').textContent = totalTasks;
        document.getElementById('completedTasksCount').textContent = completedTasks;
    }

    // Modal Methods
    showTaskModal(task) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('editTaskForm');
        
        // Populate form fields
        document.getElementById('editTaskId').value = task.id;
        document.getElementById('editTaskTitle').value = task.title;
        document.getElementById('editTaskDescription').value = task.description || '';
        document.getElementById('editTaskDueDate').value = task.dueDate || '';
        document.getElementById('editTaskPriority').value = task.priority || 'medium';
        document.getElementById('editTaskProject').value = task.project || 'none';
        
        // Show modal
        modal.classList.add('show');
    }
    
    showProjectModal() {
        const modal = document.getElementById('projectModal');
        document.getElementById('projectName').value = '';
        document.getElementById('projectIcon').value = 'fas fa-briefcase';
        modal.classList.add('show');
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
    }

    // Utility Methods
    formatDate(dateString) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', options);
    }
    
    showNotification(type, title, message) {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let iconClass = '';
        switch (type) {
            case 'success': iconClass = 'fas fa-check-circle'; break;
            case 'error': iconClass = 'fas fa-exclamation-circle'; break;
            case 'warning': iconClass = 'fas fa-exclamation-triangle'; break;
            case 'info': iconClass = 'fas fa-info-circle'; break;
        }
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${title}</div>
                <div class="notification-message">${message}</div>
            </div>
            <div class="notification-close">
                <i class="fas fa-times"></i>
            </div>
        `;
        
        // Handle close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.style.animation = 'slideOutRight 0.3s forwards';
            setTimeout(() => {
                notification.remove();
            }, 300);
        });
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s forwards';
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }
        }, 5000);
    }
    
    toggleTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
        
        localStorage.setItem('darkMode', isDark);
    }
    
    loadThemePreference() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        document.getElementById('theme-switch').checked = darkMode;
        this.toggleTheme(darkMode);
    }
    
    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }
    
    saveProjects() {
        localStorage.setItem('projects', JSON.stringify(this.projects));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure all DOM elements are fully loaded
    window.taskManager = new TaskManager();
    
    // Apply some animations
    const animateElements = () => {
        const elements = document.querySelectorAll('.sidebar, .content-area, header');
        elements.forEach((el, index) => {
            setTimeout(() => {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, index * 100);
        });
    };
    
    setTimeout(animateElements, 200);
});