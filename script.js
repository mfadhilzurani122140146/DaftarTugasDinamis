class TodoApp {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleAddTask(e));
        document.getElementById('sortBy').addEventListener('change', () => this.renderTasks());
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.filter;
                this.renderTasks();
            });
        });

        this.checkDueTasks();
        this.renderTasks();
        this.updateStats();

        setInterval(() => this.checkDueTasks(), 60000);
    }

    handleAddTask(e) {
        e.preventDefault();
        const title = document.getElementById('taskTitle').value;
        const dueDate = document.getElementById('taskDueDate').value;
        const priority = document.getElementById('taskPriority').value;
        const tags = document.getElementById('taskTags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag);

        const task = {
            id: Date.now(),
            title,
            dueDate,
            priority,
            tags,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        e.target.reset();
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks();
    }

    editTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;

        const newTitle = prompt('Edit judul tugas:', task.title);
        if (newTitle) {
            task.title = newTitle;
            this.saveTasks();
            this.renderTasks();
        }
    }

    checkDueTasks() {
        const now = new Date();
        this.tasks.forEach(task => {
            if (!task.completed && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const timeDiff = dueDate - now;
                
                if (timeDiff > 0 && timeDiff <= 86400000 && !task.notified) {
                    this.showNotification(task);
                    task.notified = true;
                    this.saveTasks();
                }
            }
        });
    }

    showNotification(task) {
        if (Notification.permission === 'granted') {
            new Notification("Reminder!", {
                body: `Tugas "${task.title}" jatuh tempo dalam 24 jam.`,
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification("Reminder!", {
                        body: `Tugas "${task.title}" jatuh tempo dalam 24 jam.`,
                    });
                }
            });
        }
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
        this.updateStats();
    }

    renderTasks() {
        const tasksContainer = document.getElementById('tasks');
        tasksContainer.innerHTML = '';

        const filteredTasks = this.tasks.filter(task => {
            if (this.currentFilter === 'all') return true;
            return this.currentFilter === 'active' ? !task.completed : task.completed;
        });

        const sortedTasks = filteredTasks.sort((a, b) => {
            const sortBy = document.getElementById('sortBy').value;
            if (sortBy === 'dueDate') {
                return new Date(a.dueDate) - new Date(b.dueDate);
            } else if (sortBy === 'priority') {
                const priorityMap = { high: 1, medium: 2, low: 3 };
                return priorityMap[a.priority] - priorityMap[b.priority];
            } else {
                return a.title.localeCompare(b.title);
            }
        });

        sortedTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
            taskItem.innerHTML = `
                <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="todoApp.toggleTask(${task.id})">
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">${task.dueDate ? '🗓️ ' + task.dueDate : ''}</div>
                    <div class="task-tags">${task.tags.map(tag => `<span class="task-tag">${tag}</span>`).join('')}</div>
                </div>
                <div class="task-actions">
                    <button onclick="todoApp.editTask(${task.id})">✏️ Edit</button>
                    <button onclick="todoApp.deleteTask(${task.id})">🗑️ Hapus</button>
                </div>
            `;
            tasksContainer.appendChild(taskItem);
        });
    }

    updateStats() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const completionRate = totalTasks ? ((completedTasks / totalTasks) * 100).toFixed(0) + '%' : '0%';

        document.getElementById('totalTasks').innerText = totalTasks;
        document.getElementById('completedTasks').innerText = completedTasks;
        document.getElementById('completionRate').innerText = completionRate;
    }
}

// Initialize TodoApp
const todoApp = new TodoApp();