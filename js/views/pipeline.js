import { state, filteredContacts, companiesFor } from '../state.js?v=1';
import { escapeHtml, formatCurrency, fullName } from '../util.js?v=1';

export function renderPipeline() {
  if (state.stages.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">🗂</div><div class="empty-state-title">Setting up your pipeline…</div></div>`;
  }
  const contacts = filteredContacts();
  const columns = state.stages.map((stage) => {
    const items = contacts.filter((c) => c.stageId === stage.id);
    const total = items.reduce((sum, c) => sum + (Number(c.estimatedValue) || 0), 0);

    const cards = items.flatMap((c) => {
      const companies = companiesFor(c);
      return companies.length
        ? companies.map((co) => contactCard(c, co))
        : [contactCard(c, null)];
    });

    return `
      <div class="board-column">
        <div class="board-column-header">
          <span class="stage-dot" style="background:${stage.color}"></span>
          <span class="board-column-title">${escapeHtml(stage.name)}</span>
          <span class="board-column-value">${items.length} · ${formatCurrency(total)}</span>
        </div>
        <div class="board-column-body" data-stage="${stage.id}">
          ${cards.join('') || ''}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="board">${columns}</div>`;
}

function contactCard(c, company) {
  return `
    <div class="prospect-card" draggable="true" data-id="${c.id}" data-action="open-contact">
      <div class="prospect-card-name">${escapeHtml(fullName(c))}</div>
      ${company ? `<div class="prospect-card-company">${escapeHtml(company.name)}</div>` : ''}
      <div class="prospect-card-meta">
        ${Number(c.estimatedValue) > 0 ? `<span class="tag tag-value">${formatCurrency(c.estimatedValue)}</span>` : ''}
        ${c.source ? `<span class="tag tag-source">${escapeHtml(c.source)}</span>` : ''}
      </div>
    </div>
  `;
}
