import { state, contactById, activitiesFor, tasksFor, companiesFor } from '../state.js?v=1';
import { escapeHtml, formatDateTime, formatDue, isOverdue, activityIcon, fullName } from '../util.js?v=1';

export function renderContactDetail(id) {
  const c = contactById(id);
  if (!c) return `<div class="empty-state"><div class="empty-state-title">Contact not found</div></div>`;

  const activities = activitiesFor(id);
  const tasks = tasksFor(id).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  const linkedCompanies = companiesFor(c);
  const availableCompanies = state.companies.filter((co) => !(c.companyIds || []).includes(co.id));

  return `
    <button class="back-link" data-action="back-to-contacts">← Back to contacts</button>
    <div class="detail-header">
      <div>
        <h1 class="detail-name">${escapeHtml(fullName(c))}</h1>
        ${linkedCompanies.length ? `<div class="detail-company">${escapeHtml(linkedCompanies.map((co) => co.name).join(', '))}</div>` : ''}
      </div>
      <button class="btn btn-ghost btn-danger btn-sm" data-action="delete-contact" data-id="${c.id}">Delete</button>
    </div>

    <div class="detail-grid">
      <div>
        <div class="detail-panel">
          <div class="detail-panel-title">Activity</div>
          <div class="activity-composer">
            <select id="activity-type">
              <option value="note">Note</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="meeting">Meeting</option>
            </select>
            <input id="activity-content" type="text" placeholder="Write a note…" />
            <button class="btn btn-primary btn-sm" data-action="add-activity" data-id="${c.id}">Add</button>
          </div>
          <div class="timeline">
            ${activities.length ? activities.map((a) => `
              <div class="timeline-item">
                <div class="timeline-icon">${activityIcon(a.type)}</div>
                <div class="timeline-body">
                  <div class="timeline-text">${escapeHtml(a.content)}</div>
                  <div class="timeline-date">${formatDateTime(a.createdAt)}</div>
                </div>
              </div>
            `).join('') : `<div class="empty-state-desc" style="padding:16px 0;">No activity yet.</div>`}
          </div>
        </div>

        <div class="detail-panel">
          <div class="detail-panel-title">Tasks</div>
          <div class="activity-composer">
            <input id="task-title-input" type="text" placeholder="New task…" />
            <input id="task-due-input" type="date" style="max-width:150px;" />
            <button class="btn btn-primary btn-sm" data-action="add-task" data-id="${c.id}">Add</button>
          </div>
          ${tasks.length ? tasks.map((t) => `
            <div class="task-row ${t.done ? 'done' : ''}">
              <div class="check-circle ${t.done ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}">${t.done ? '✓' : ''}</div>
              <div class="task-row-title">${escapeHtml(t.title)}</div>
              ${t.dueDate ? `<div class="task-row-due ${isOverdue(t.dueDate) && !t.done ? 'overdue' : ''}">${formatDue(t.dueDate)}</div>` : ''}
            </div>
          `).join('') : `<div class="empty-state-desc" style="padding:8px 0;">No pending tasks.</div>`}
        </div>
      </div>

      <div>
        <div class="detail-panel">
          <div class="detail-panel-title">Contact Info</div>
          <div class="info-row"><label>Stage</label>
            <select data-field="stageId" data-id="${c.id}">
              ${state.stages.map((s) => `<option value="${s.id}" ${c.stageId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="info-row"><label>First Name</label><input type="text" value="${escapeHtml(c.firstName || '')}" data-field="firstName" data-id="${c.id}" /></div>
          <div class="info-row"><label>Last Name</label><input type="text" value="${escapeHtml(c.lastName || '')}" data-field="lastName" data-id="${c.id}" /></div>
          <div class="info-row"><label>Email</label><input type="email" value="${escapeHtml(c.email || '')}" data-field="email" data-id="${c.id}" /></div>
          <div class="info-row"><label>Phone</label><input type="tel" value="${escapeHtml(c.phone || '')}" data-field="phone" data-id="${c.id}" /></div>
          <div class="info-row"><label>Mobile</label><input type="tel" value="${escapeHtml(c.mobile || '')}" data-field="mobile" data-id="${c.id}" /></div>
          <div class="info-row"><label>WhatsApp</label><input type="tel" value="${escapeHtml(c.whatsapp || '')}" data-field="whatsapp" data-id="${c.id}" /></div>
          <div class="info-row"><label>Source</label><input type="text" value="${escapeHtml(c.source || '')}" data-field="source" data-id="${c.id}" /></div>
          <div class="info-row"><label>Estimated Value</label><input type="number" value="${c.estimatedValue || 0}" data-field="estimatedValue" data-id="${c.id}" /></div>
        </div>

        <div class="detail-panel">
          <div class="detail-panel-title">Accounts</div>
          ${linkedCompanies.length ? `
            <div class="company-chip-list">
              ${linkedCompanies.map((co) => `
                <span class="company-chip" data-action="open-company" data-id="${co.id}">
                  ${escapeHtml(co.name)}
                  <button type="button" class="company-chip-remove" data-action="unlink-company" data-contact-id="${c.id}" data-company-id="${co.id}">×</button>
                </span>
              `).join('')}
            </div>
          ` : `<div class="empty-state-desc" style="padding:4px 0 12px;">No accounts linked.</div>`}
          <div class="activity-composer">
            <select id="company-select" data-id="${c.id}">
              <option value="">Select an account…</option>
              ${availableCompanies.map((co) => `<option value="${co.id}">${escapeHtml(co.name)}</option>`).join('')}
              <option value="__new__">+ New account…</option>
            </select>
            <button class="btn btn-primary btn-sm" data-action="link-company" data-id="${c.id}">Add</button>
          </div>
        </div>
      </div>
    </div>
  `;
}
