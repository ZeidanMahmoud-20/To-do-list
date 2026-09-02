document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');

    // Load tasks from LocalStorage
    let tasks = JSON.parse(localStorage.getItem('ztdl_tasks')) || [];

    function saveAndRender() {
        localStorage.setItem('ztdl_tasks', JSON.stringify(tasks));
        renderTasks();
    }

    function checkDueTasks() {
        const todayStr = new Date().toISOString().split('T')[0];
        tasks.forEach(task => {
            if (task.date === todayStr && !task.alertShown && !task.completed) {
                alert(`Reminder: Today is the day for your task -> "${task.text}"!`);
                task.alertShown = true;
            }
        });
        localStorage.setItem('ztdl_tasks', JSON.stringify(tasks));
    }

    function renderTasks() {
        taskList.innerHTML = '';
        if (tasks.length === 0) {
            taskList.innerHTML = '<p style="text-align: center; color: #a0aec0; font-size: 0.9rem;">No tasks added yet.</p>';
            return;
        }

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            if (task.completed) li.classList.add('completed');

            li.innerHTML = `
                <div class="task-info">
                    <span class="task-title">${escapeHtml(task.text)}</span>
                    <span class="task-date">📅 ${task.date || 'No Date'}</span>
                </div>
                <div class="task-actions">
                    <button class="complete-btn" onclick="toggleTask(${index})">✔️</button>
                    <button class="delete-btn" onclick="deleteTask(${index})">🗑️</button>
                </div>
            `;
            taskList.appendChild(li);
        });
    }

    function addTask() {
        const text = taskInput.value.trim();
        const date = taskDate.value;

        if (text === '') {
            alert('Please enter a task name.');
            return;
        }

        tasks.push({
            text: text,
            date: date,
            completed: false,
            alertShown: false
        });

        taskInput.value = '';
        taskDate.value = '';
        saveAndRender();
        checkDueTasks();
    }

    window.toggleTask = function(index) {
        tasks[index].completed = !tasks[index].completed;
        saveAndRender();
    };

    window.deleteTask = function(index) {
        tasks.splice(index, 1);
        saveAndRender();
    };

    function escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });

    // Initial render and due check
    renderTasks();
    checkDueTasks();
});
