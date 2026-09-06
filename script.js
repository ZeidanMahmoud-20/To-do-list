document.addEventListener('DOMContentLoaded', () => {
    const entryForm = document.getElementById('entryForm');
    const taskInput = document.getElementById('taskInput');
    const taskDate = document.getElementById('taskDate');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');

    const STORAGE_KEY = 'ztdl_tasks';
    let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const icons = {
        complete: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        edit: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>',
        save: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
        cancel: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
        delete: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path><path d="M10 11v6"></path><path d="M14 11v6"></path></svg>'
    };

    function save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    // Escapes text for safe use both as HTML content AND inside a
    // double-quoted HTML attribute (e.g. an editable input's value).
    function escapeHtml(str) {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDate(dateStr) {
        if (!dateStr) return 'No date';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    function render() {
        taskList.innerHTML = '';

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'task' + (task.completed ? ' completed' : '');

            if (task.editing) {
                li.innerHTML = `
                    <div class="task__edit">
                        <input type="text" class="edit-text" value="${escapeHtml(task.text)}">
                        <input type="date" class="edit-date" value="${task.date || ''}">
                    </div>
                    <div class="task__actions">
                        <button class="save-btn" title="Save" data-index="${index}">${icons.save}</button>
                        <button class="cancel-btn" title="Cancel" data-index="${index}">${icons.cancel}</button>
                    </div>
                `;
            } else {
                li.innerHTML = `
                    <div class="task__info">
                        <span class="task__text">${escapeHtml(task.text)}</span>
                        <span class="task__date">📅 ${formatDate(task.date)}</span>
                    </div>
                    <div class="task__actions">
                        <button class="complete-btn" title="Mark complete" data-index="${index}">${icons.complete}</button>
                        <button class="edit-btn" title="Edit" data-index="${index}">${icons.edit}</button>
                        <button class="delete-btn" title="Delete" data-index="${index}">${icons.delete}</button>
                    </div>
                `;
            }

            taskList.appendChild(li);
        });

        const doneCount = tasks.filter(t => t.completed).length;
        taskCount.textContent = tasks.length === 0
            ? '0 tasks filed'
            : `${doneCount} of ${tasks.length} filed tasks done`;
    }

    function addTask(e) {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) {
            alert('Please enter a task name.');
            return;
        }

        tasks.push({
            text,
            date: taskDate.value,
            completed: false,
            alertShown: false,
            editing: false
        });

        taskInput.value = '';
        taskDate.value = '';
        save();
        render();
        checkDueTasks();
    }

    taskList.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const index = Number(btn.dataset.index);
        const task = tasks[index];
        if (!task) return;

        if (btn.classList.contains('complete-btn')) {
            task.completed = !task.completed;
            save();
            render();
        } else if (btn.classList.contains('delete-btn')) {
            tasks.splice(index, 1);
            save();
            render();
        } else if (btn.classList.contains('edit-btn')) {
            task.editing = true;
            render();
        } else if (btn.classList.contains('cancel-btn')) {
            task.editing = false;
            render();
        } else if (btn.classList.contains('save-btn')) {
            const li = btn.closest('.task');
            const newText = li.querySelector('.edit-text').value.trim();
            const newDate = li.querySelector('.edit-date').value;
            if (!newText) {
                alert('Task name cannot be empty.');
                return;
            }
            task.text = newText;
            if (task.date !== newDate) {
                task.alertShown = false;
            }
            task.date = newDate;
            task.editing = false;
            save();
            render();
            checkDueTasks();
        }
    });

    function notify(text) {
        const body = `Today is the day for: "${text}"`;

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('ZTDL Reminder', { body });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            Notification.requestPermission().then((perm) => {
                if (perm === 'granted') {
                    new Notification('ZTDL Reminder', { body });
                } else {
                    alert(body);
                }
            });
        } else {
            alert(body);
        }
    }

    function checkDueTasks() {
        const todayStr = new Date().toISOString().split('T')[0];
        let changed = false;

        tasks.forEach((task) => {
            if (task.date === todayStr && !task.completed && !task.alertShown) {
                notify(task.text);
                task.alertShown = true;
                changed = true;
            }
        });

        if (changed) save();
    }

    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    entryForm.addEventListener('submit', addTask);

    render();
    checkDueTasks();
    setInterval(checkDueTasks, 60000);
});
