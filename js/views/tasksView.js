import { state, contactById } from '../state.js?v=2';
import { escapeHtml, isOverdue, todayISO, fullName } from '../util.js?v=5';

export function renderTasks() {
  const today = todayISO();
  let items = state.tasks.filter((t) => {
    if (state.taskFilter === 'pending') return !t.done;
    if (state.taskFilter === 'overdue') return !t.done && t.dueDate && t.dueDate < today;
    if (state.taskFilter === 'done') return t.done;
    return true;
  }).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

  const toolbar = `
    <div class="table-toolbar">
      <select id="task-filter">
        <option value="pending" ${state.taskFilter === 'pending' ? 'selected' : ''}>Pending</option>
        <option value="overdue" ${state.taskFilter === 'overdue' ? 'selected' : ''}>Overdue</option>
        <option value="done" ${state.taskFilter === 'done' ? 'selected' : ''}>Completed</option>
        <option value="all" ${state.taskFilter === 'all' ? 'selected' : ''}>All</option>
      </select>
    </div>
  `;

  if (items.length === 0) {
    return toolbar + `<div class="empty-state"><div class="empty-state-icon">✅</div><div class="empty-state-title">Nothing here</div></div>`;
  }

  const rows = items.map((t) => {
    const contact = t.contactId ? contactById(t.contactId) : null;
    return `
      <div class="task-list-row ${t.done ? 'done' : ''}">
        <div class="check-circle ${t.done ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}">${t.done ? '✓' : ''}</div>
        <input type="text" class="task-title-input" value="${escapeHtml(t.title)}" data-task-field="title" data-id="${t.id}" />
        ${contact ? `<span class="task-list-prospect" data-action="open-contact" data-id="${contact.id}">${escapeHtml(fullName(contact))}</span>` : ''}
        <input type="date" class="task-due-input ${isOverdue(t.dueDate) && !t.done ? 'overdue' : ''}" value="${t.dueDate || ''}" data-task-field="dueDate" data-id="${t.id}" />
        <button type="button" class="task-list-delete" data-action="delete-task" data-id="${t.id}" title="Delete task">×</button>
      </div>
    `;
  }).join('');

  return toolbar + `<div class="task-list">${rows}</div>`;
}
