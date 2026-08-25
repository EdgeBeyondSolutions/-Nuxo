import { state, filteredProspects, stageById } from '../state.js';
import { escapeHtml, formatCurrency, fullName } from '../util.js';

export function renderProspectsTable() {
  let items = filteredProspects();

  items = items.slice().sort((a, b) => {
    const dir = state.sortDir === 'asc' ? 1 : -1;
    const key = state.sortBy;
    let av = a[key], bv = b[key];
    if (key === 'createdAt') { av = a.createdAt?.toMillis?.() || 0; bv = b.createdAt?.toMillis?.() || 0; }
    if (key === 'stageId') { av = stageById(a.stageId)?.order ?? 0; bv = stageById(b.stageId)?.order ?? 0; }
    if (key === 'name') { av = fullName(a); bv = fullName(b); }
    if (typeof av === 'string') return av.localeCompare(bv) * dir;
    return ((av || 0) - (bv || 0)) * dir;
  });

  const sources = [...new Set(state.prospects.map((p) => p.source).filter(Boolean))];

  const toolbar = `
    <div class="table-toolbar">
      <select id="filter-stage">
        <option value="">All stages</option>
        ${state.stages.map((s) => `<option value="${s.id}" ${state.stageFilter === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
      </select>
      <select id="filter-source">
        <option value="">All sources</option>
        ${sources.map((s) => `<option value="${escapeHtml(s)}" ${state.sourceFilter === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
      </select>
      <div class="spacer"></div>
      <button class="btn btn-primary btn-sm" data-action="new-prospect"><span class="plus">+</span> New Prospect</button>
    </div>
  `;

  if (items.length === 0) {
    return toolbar + `<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-title">No prospects yet</div><div class="empty-state-desc">Add your first prospect to start tracking them.</div></div>`;
  }

  const cols = [
    { key: 'name', label: 'Name' },
    { key: 'stageId', label: 'Stage' },
    { key: 'estimatedValue', label: 'Value' },
    { key: 'source', label: 'Source' },
    { key: 'createdAt', label: 'Created' },
  ];

  const rows = items.map((p) => {
    const stage = stageById(p.stageId);
    return `
      <tr data-action="open-prospect" data-id="${p.id}">
        <td><div class="table-name">${escapeHtml(fullName(p))}</div>${p.company ? `<div class="table-company">${escapeHtml(p.company)}</div>` : ''}</td>
        <td>${stage ? `<span class="tag tag-stage"><span class="stage-dot" style="background:${stage.color}"></span> ${escapeHtml(stage.name)}</span>` : '—'}</td>
        <td>${Number(p.estimatedValue) > 0 ? formatCurrency(p.estimatedValue) : '—'}</td>
        <td>${p.source ? escapeHtml(p.source) : '—'}</td>
        <td>${p.createdAt?.toDate ? p.createdAt.toDate().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '—'}</td>
      </tr>
    `;
  }).join('');

  const th = (col) => {
    const sorted = state.sortBy === col.key;
    return `<th data-sort="${col.key}" class="${sorted ? `sorted ${state.sortDir}` : ''}">${col.label}</th>`;
  };

  return toolbar + `
    <table class="data-table">
      <thead><tr>${cols.map(th).join('')}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}
