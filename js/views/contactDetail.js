import { state, contactById, activitiesFor, tasksFor, companiesFor } from '../state.js?v=1';
import { escapeHtml, formatDateTime, isOverdue, activityIcon, fullName, sourceOptions } from '../util.js?v=5';

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

    <div class="detail-main">
      <div class="detail-panel">
        <div class="detail-panel-title">Contact Information</div>
        <div class="info-grid">
          <div class="info-row"><label>First Name</label><input type="text" value="${escapeHtml(c.firstName || '')}" data-field="firstName" data-id="${c.id}" /></div>
          <div class="info-row"><label>Last Name</label><input type="text" value="${escapeHtml(c.lastName || '')}" data-field="lastName" data-id="${c.id}" /></div>
          <div class="info-row"><label>Email</label><input type="email" value="${escapeHtml(c.email || '')}" data-field="email" data-id="${c.id}" /></div>
          <div class="info-row"><label>Phone</label><input type="tel" value="${escapeHtml(c.phone || '')}" data-field="phone" data-id="${c.id}" /></div>
          <div class="info-row"><label>Mobile</label><input type="tel" value="${escapeHtml(c.mobile || '')}" data-field="mobile" data-id="${c.id}" /></div>
          <div class="info-row"><label>WhatsApp</label><input type="tel" value="${escapeHtml(c.whatsapp || '')}" data-field="whatsapp" data-id="${c.id}" /></div>
          <div class="info-row"><label>Stage</label>
            <select data-field="stageId" data-id="${c.id}">
              ${state.stages.map((s) => `<option value="${s.id}" ${c.stageId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="info-row"><label>Estimated Value</label><input type="number" value="${c.estimatedValue || 0}" data-field="estimatedValue" data-id="${c.id}" /></div>
          <div class="info-row"><label>Source</label><select data-field="source" data-id="${c.id}">${sourceOptions(c.source)}</select></div>
        </div>
      </div>

      <div class="detail-panel">
        <div class="detail-panel-title">Companies</div>
        ${linkedCompanies.length ? `
          <div class="company-chip-list">
            ${linkedCompanies.map((co) => `
              <span class="company-chip" data-action="open-company" data-id="${co.id}">
                ${escapeHtml(co.name)}
                <button type="button" class="company-chip-remove" data-action="unlink-company" data-contact-id="${c.id}" data-company-id="${co.id}">×</button>
              </span>
            `).join('')}
          </div>
        ` : `<div class="empty-state-desc" style="padding:4px 0 12px;">No companies linked.</div>`}
        <div class="activity-composer">
          <select id="company-select" data-id="${c.id}">
            <option value="">Select a company…</option>
            ${availableCompanies.map((co) => `<option value="${co.id}">${escapeHtml(co.name)}</option>`).join('')}
            <option value="__new__">+ New company…</option>
          </select>
          <button class="btn btn-primary btn-sm" data-action="link-company" data-id="${c.id}">Add</button>
        </div>
      </div>

      <div class="detail-panel">
        <div class="detail-panel-title">Address Information</div>
        <div class="info-grid">
          <div class="info-row"><label>Street</label><input type="text" value="${escapeHtml(c.street || '')}" data-field="street" data-id="${c.id}" /></div>
          <div class="info-row"><label>Street 2</label><input type="text" value="${escapeHtml(c.street2 || '')}" data-field="street2" data-id="${c.id}" /></div>
          <div class="info-row"><label>City</label><input type="text" value="${escapeHtml(c.city || '')}" data-field="city" data-id="${c.id}" /></div>
          <div class="info-row"><label>State</label><input type="text" value="${escapeHtml(c.state || '')}" data-field="state" data-id="${c.id}" /></div>
          <div class="info-row"><label>Postal Code</label><input type="text" value="${escapeHtml(c.postalCode || '')}" data-field="postalCode" data-id="${c.id}" /></div>
          <div class="info-row"><label>Country</label><input type="text" value="${escapeHtml(c.country || '')}" data-field="country" data-id="${c.id}" /></div>
        </div>
      </div>

      <div class="detail-panel">
        <div class="detail-panel-title">Activity</div>
        <div class="email-quick-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-action="quick-log-email" data-log-type="email_sent" data-id="${c.id}">📤 Log Email Sent</button>
          <button type="button" class="btn btn-ghost btn-sm" data-action="quick-log-email" data-log-type="email_received" data-id="${c.id}">📥 Log Reply Received</button>
        </div>
        <div class="activity-composer">
          <select id="activity-type">
            <option value="note">Note</option>
            <option value="call">Call</option>
            <option value="meeting">Meeting</option>
            <option value="email_sent">Email Sent</option>
            <option value="email_received">Email Received</option>
          </select>
          <input id="activity-subject" type="text" placeholder="Subject" hidden />
          <input id="activity-content" type="text" placeholder="Write a note…" />
          <button class="btn btn-primary btn-sm" data-action="add-activity" data-id="${c.id}">Add</button>
        </div>
        <div class="timeline">
          ${activities.length ? activities.map((a) => `
            <div class="timeline-item">
              <div class="timeline-icon">${activityIcon(a.type)}</div>
              <div class="timeline-body">
                ${a.subject ? `<div class="timeline-subject">${escapeHtml(a.subject)}</div>` : ''}
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
            <input type="text" class="task-title-input" value="${escapeHtml(t.title)}" data-task-field="title" data-id="${t.id}" />
            <input type="date" class="task-due-input ${isOverdue(t.dueDate) && !t.done ? 'overdue' : ''}" value="${t.dueDate || ''}" data-task-field="dueDate" data-id="${t.id}" />
            <button type="button" class="task-row-delete" data-action="delete-task" data-id="${t.id}" title="Delete task">×</button>
          </div>
        `).join('') : `<div class="empty-state-desc" style="padding:8px 0;">No pending tasks.</div>`}
      </div>
    </div>
  `;
}
