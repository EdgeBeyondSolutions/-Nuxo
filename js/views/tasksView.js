import { state, contactById } from '../state.js?v=1';
import { escapeHtml, formatDue, isOverdue, todayISO, fullName } from '../util.js?v=1';

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
        <div class="task-list-title">${escapeHtml(t.title)}</div>
        ${contact ? `<span class="task-list-prospect" data-action="open-contact" data-id="${contact.id}">${escapeHtml(fullName(contact))}</span>` : ''}
        ${t.dueDate ? `<span class="tag tag-due ${isOverdue(t.dueDate) && !t.done ? 'overdue' : ''}">${formatDue(t.dueDate)}</span>` : ''}
      </div>
    `;
  }).join('');

  return toolbar + `<div class="task-list">${rows}</div>`;
}
