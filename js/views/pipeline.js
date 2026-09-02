import { state, filteredContacts, companyById, dealFor } from '../state.js?v=2';
import { escapeHtml, formatCurrency, fullName } from '../util.js?v=1';

export function renderPipeline() {
  if (state.stages.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">🗂</div><div class="empty-state-title">Setting up your pipeline…</div></div>`;
  }
  const contacts = filteredContacts();

  // Build one pipeline entry per contact (no companies) or per contact+company deal.
  const entries = contacts.flatMap((c) => {
    const companyIds = c.companyIds || [];
    if (companyIds.length === 0) {
      return [{ contact: c, company: null, stageId: c.stageId, value: c.estimatedValue, dealId: null }];
    }
    return companyIds.map((companyId) => {
      const deal = dealFor(c.id, companyId);
      return deal
        ? { contact: c, company: companyById(companyId), stageId: deal.stageId, value: deal.estimatedValue, dealId: deal.id }
        : null;
    }).filter(Boolean);
  });

  const columns = state.stages.map((stage) => {
    const items = entries.filter((e) => e.stageId === stage.id);
    const total = items.reduce((sum, e) => sum + (Number(e.value) || 0), 0);
    return `
      <div class="board-column">
        <div class="board-column-header">
          <span class="stage-dot" style="background:${stage.color}"></span>
          <span class="board-column-title">${escapeHtml(stage.name)}</span>
          <span class="board-column-value">${items.length} · ${formatCurrency(total)}</span>
        </div>
        <div class="board-column-body" data-stage="${stage.id}">
          ${items.map(entryCard).join('') || ''}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="board">${columns}</div>`;
}

function entryCard(entry) {
  const { contact: c, company, value, dealId } = entry;
  return `
    <div class="prospect-card" draggable="true" data-id="${c.id}" data-deal-id="${dealId || ''}" data-action="open-contact">
      <div class="prospect-card-name">${escapeHtml(fullName(c))}</div>
      ${company ? `<div class="prospect-card-company">${escapeHtml(company.name)}</div>` : ''}
      <div class="prospect-card-meta">
        ${Number(value) > 0 ? `<span class="tag tag-value">${formatCurrency(value)}</span>` : ''}
        ${c.source ? `<span class="tag tag-source">${escapeHtml(c.source)}</span>` : ''}
      </div>
    </div>
  `;
}
