/* -----------------------------------------
   TaskPulse — To Do List App
   Handles: add, view, complete, delete, persist
----------------------------------------- */

(function () {
  "use strict";

  const STORAGE_KEY = "taskpulse.tasks";

  // Elements
  const form = document.getElementById("input__form");
  const taskInput = document.getElementById("input__task");
  const dateInput = document.getElementById("input__date");
  const taskList = document.getElementById("task__list");
  const taskCount = document.getElementById("task__count");
  const emptyState = document.getElementById("empty__state");
  const clearBtn = document.getElementById("clear__btn");

  // State
  let tasks = loadTasks();

  // ---------- Storage ----------

  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error("Could not read saved tasks:", err);
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (err) {
      console.error("Could not save tasks:", err);
    }
  }

  // ---------- Helpers ----------

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function todayISO() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    const [year, month, day] = iso.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  }

  // ---------- Rendering ----------

  function render() {
    taskList.innerHTML = "";

    tasks.forEach((task) => {
      taskList.appendChild(buildTaskItem(task));
    });

    const remaining = tasks.filter((t) => !t.done).length;
    taskCount.textContent =
      tasks.length === 0
        ? "0 tasks"
        : remaining === 0
        ? "All done"
        : `${remaining} of ${tasks.length} left`;

    emptyState.classList.toggle("is-visible", tasks.length === 0);
    clearBtn.classList.toggle(
      "is-visible",
      tasks.some((t) => t.done)
    );

    saveTasks();
  }

  function buildTaskItem(task) {
    const li = document.createElement("li");
    li.className = "task__item" + (task.done ? " is-done" : "");
    li.dataset.id = task.id;

    const check = document.createElement("button");
    check.type = "button";
    check.className = "task__check";
    check.setAttribute(
      "aria-label",
      task.done ? "Mark task as not done" : "Mark task as done"
    );
    check.textContent = task.done ? "✓" : "";
    check.addEventListener("click", () => toggleTask(task.id));

    const body = document.createElement("div");
    body.className = "task__body";

    const text = document.createElement("span");
    text.className = "task__text";
    text.textContent = task.text;
    body.appendChild(text);

    if (task.date) {
      const dateEl = document.createElement("span");
      dateEl.className = "task__date";
      const isOverdue = !task.done && task.date < todayISO();
      if (isOverdue) dateEl.classList.add("is-overdue");
      dateEl.textContent =
        (isOverdue ? "Overdue · " : "Due ") + formatDate(task.date);
      body.appendChild(dateEl);
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "task__del";
    del.setAttribute("aria-label", "Delete task");
    del.textContent = "✕";
    del.addEventListener("click", () => deleteTask(task.id));

    li.appendChild(check);
    li.appendChild(body);
    li.appendChild(del);

    return li;
  }

  // ---------- Actions ----------

  function addTask(text, date) {
    tasks.push({
      id: makeId(),
      text: text,
      date: date || "",
      done: false,
    });
    render();
  }

  function toggleTask(id) {
    const task = tasks.find((t) => t.id === id);
    if (task) task.done = !task.done;
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    render();
  }

  function clearCompleted() {
    tasks = tasks.filter((t) => !t.done);
    render();
  }

  // ---------- Events ----------

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const text = taskInput.value.trim();
    if (!text) {
      taskInput.focus();
      return;
    }

    addTask(text, dateInput.value);

    taskInput.value = "";
    dateInput.value = "";
    taskInput.focus();
  });

  clearBtn.addEventListener("click", clearCompleted);

  // ---------- Init ----------

  render();
})();
