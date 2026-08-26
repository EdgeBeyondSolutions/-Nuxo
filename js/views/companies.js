import { state, contactsForCompany, companyById } from '../state.js?v=1';
import { escapeHtml, fullName } from '../util.js?v=1';

export function renderCompaniesTable() {
  const items = state.companies.slice().sort((a, b) => a.name.localeCompare(b.name));

  const toolbar = `
    <div class="table-toolbar">
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" data-action="new-company"><span class="plus">+</span> New Account</button>
    </div>
  `;

  if (items.length === 0) {
    return toolbar + `<div class="empty-state"><div class="empty-state-icon">🏢</div><div class="empty-state-title">No accounts yet</div><div class="empty-state-desc">Add an account to start linking contacts to it.</div></div>`;
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
  if (!co) return `<div class="empty-state"><div class="empty-state-title">Account not found</div></div>`;

  const contacts = contactsForCompany(id);

  return `
    <button class="back-link" data-action="back-to-companies">← Back to accounts</button>
    <div class="detail-header">
      <div>
        <h1 class="detail-name">${escapeHtml(co.name)}</h1>
        ${co.website ? `<div class="detail-company"><a href="${escapeHtml(withProtocol(co.website))}" target="_blank" rel="noopener">${escapeHtml(co.website)}</a></div>` : ''}
      </div>
      <button class="btn btn-ghost btn-danger btn-sm" data-action="delete-company" data-id="${co.id}">Delete</button>
    </div>

    <div class="detail-main">
      <div class="detail-panel">
        <div class="detail-panel-title">Account Information</div>
        <div class="info-grid">
          <div class="info-row"><label>Name</label><input type="text" value="${escapeHtml(co.name || '')}" data-company-field="name" data-id="${co.id}" /></div>
          <div class="info-row"><label>Industry</label><input type="text" value="${escapeHtml(co.industry || '')}" data-company-field="industry" data-id="${co.id}" /></div>
          <div class="info-row"><label>Website</label><input type="text" value="${escapeHtml(co.website || '')}" data-company-field="website" data-id="${co.id}" /></div>
          <div class="info-row"><label>Phone</label><input type="tel" value="${escapeHtml(co.phone || '')}" data-company-field="phone" data-id="${co.id}" /></div>
          <div class="info-row"><label>WhatsApp</label><input type="tel" value="${escapeHtml(co.whatsapp || '')}" data-company-field="whatsapp" data-id="${co.id}" /></div>
          <div class="info-row"><label>Email</label><input type="email" value="${escapeHtml(co.email || '')}" data-company-field="email" data-id="${co.id}" /></div>
        </div>
      </div>

      <div class="detail-panel">
        <div class="detail-panel-title">Address Information</div>
        <div class="info-grid">
          <div class="info-row"><label>Street</label><input type="text" value="${escapeHtml(co.street || '')}" data-company-field="street" data-id="${co.id}" /></div>
          <div class="info-row"><label>City</label><input type="text" value="${escapeHtml(co.city || '')}" data-company-field="city" data-id="${co.id}" /></div>
          <div class="info-row"><label>Postal Code</label><input type="text" value="${escapeHtml(co.postalCode || '')}" data-company-field="postalCode" data-id="${co.id}" /></div>
          <div class="info-row"><label>Country</label><input type="text" value="${escapeHtml(co.country || '')}" data-company-field="country" data-id="${co.id}" /></div>
        </div>
      </div>

      <div class="detail-panel">
        <div class="detail-panel-title">Social</div>
        <div class="info-grid">
          <div class="info-row"><label>Facebook</label><input type="text" value="${escapeHtml(co.facebook || '')}" data-company-field="facebook" data-id="${co.id}" /></div>
          <div class="info-row"><label>Instagram</label><input type="text" value="${escapeHtml(co.instagram || '')}" data-company-field="instagram" data-id="${co.id}" /></div>
        </div>
      </div>

      <div class="detail-panel">
        <div class="detail-panel-title">Contacts</div>
        ${contacts.length ? contacts.map((c) => `
          <div class="task-row" data-action="open-contact" data-id="${c.id}" style="cursor:pointer;">
            <div class="task-row-title">${escapeHtml(fullName(c))}</div>
          </div>
        `).join('') : `<div class="empty-state-desc" style="padding:8px 0;">No contacts linked to this account yet.</div>`}
        <button class="btn btn-ghost btn-sm" data-action="new-contact-for-company" data-id="${co.id}" style="margin-top:12px;">
          <span class="plus">+</span> New Contact
        </button>
      </div>
    </div>
  `;
}

function withProtocol(url) {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}
