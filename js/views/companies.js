import { state, contactsForCompany, companyById } from '../state.js?v=1';
import { escapeHtml, fullName } from '../util.js?v=1';

export function renderCompaniesTable() {
  const items = state.companies.slice().sort((a, b) => a.name.localeCompare(b.name));

  const toolbar = `
    <div class="table-toolbar">
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" data-action="new-company"><span class="plus">+</span> New Company</button>
    </div>
  `;

  if (items.length === 0) {
    return toolbar + `<div class="empty-state"><div class="empty-state-icon">🏢</div><div class="empty-state-title">No companies yet</div><div class="empty-state-desc">Add a company to start linking contacts to it.</div></div>`;
  }

  const rows = items.map((co) => {
    const count = contactsForCompany(co.id).length;
    return `
      <tr data-action="open-company" data-id="${co.id}">
        <td><div class="table-name">${escapeHtml(co.name)}</div></td>
        <td>${co.website ? escapeHtml(co.website) : '—'}</td>
        <td>${co.phone ? escapeHtml(co.phone) : '—'}</td>
        <td>${co.industry ? escapeHtml(co.industry) : '—'}</td>
        <td>${count}</td>
      </tr>
    `;
  }).join('');

  return toolbar + `
    <table class="data-table">
      <thead><tr><th>Name</th><th>Website</th><th>Phone</th><th>Industry</th><th>Contacts</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

export function renderCompanyDetail(id) {
  const co = companyById(id);
  if (!co) return `<div class="empty-state"><div class="empty-state-title">Company not found</div></div>`;

  const contacts = contactsForCompany(id);

  return `
    <button class="back-link" data-action="back-to-companies">← Back to companies</button>
    <div class="detail-header">
      <div>
        <h1 class="detail-name">${escapeHtml(co.name)}</h1>
      </div>
      <button class="btn btn-ghost btn-danger btn-sm" data-action="delete-company" data-id="${co.id}">Delete</button>
    </div>

    <div class="detail-grid">
      <div>
        <div class="detail-panel">
          <div class="detail-panel-title">Contacts</div>
          ${contacts.length ? contacts.map((c) => `
            <div class="task-row" data-action="open-contact" data-id="${c.id}" style="cursor:pointer;">
              <div class="task-row-title">${escapeHtml(fullName(c))}</div>
            </div>
          `).join('') : `<div class="empty-state-desc" style="padding:8px 0;">No contacts linked to this company yet.</div>`}
        </div>
      </div>

      <div>
        <div class="detail-panel">
          <div class="detail-panel-title">Company Info</div>
          <div class="info-row"><label>Name</label><input type="text" value="${escapeHtml(co.name || '')}" data-company-field="name" data-id="${co.id}" /></div>
          <div class="info-row"><label>Website</label><input type="text" value="${escapeHtml(co.website || '')}" data-company-field="website" data-id="${co.id}" /></div>
          <div class="info-row"><label>Phone</label><input type="tel" value="${escapeHtml(co.phone || '')}" data-company-field="phone" data-id="${co.id}" /></div>
          <div class="info-row"><label>Industry</label><input type="text" value="${escapeHtml(co.industry || '')}" data-company-field="industry" data-id="${co.id}" /></div>
        </div>
      </div>
    </div>
  `;
}
