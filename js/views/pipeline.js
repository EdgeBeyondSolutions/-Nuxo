import { state, filteredProspects } from '../state.js';
import { escapeHtml, formatCurrency } from '../util.js';

export function renderPipeline() {
  if (state.stages.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">🗂</div><div class="empty-state-title">Preparando tu pipeline…</div></div>`;
  }
  const prospects = filteredProspects();
  const columns = state.stages.map((stage) => {
    const items = prospects.filter((p) => p.stageId === stage.id);
    const total = items.reduce((sum, p) => sum + (Number(p.estimatedValue) || 0), 0);
    return `
      <div class="board-column">
        <div class="board-column-header">
          <span class="stage-dot" style="background:${stage.color}"></span>
          <span class="board-column-title">${escapeHtml(stage.name)}</span>
          <span class="board-column-value">${items.length} · ${formatCurrency(total)}</span>
        </div>
        <div class="board-column-body" data-stage="${stage.id}">
          ${items.map((p) => prospectCard(p)).join('') || ''}
        </div>
      </div>
    `;
  }).join('');

  return `<div class="board">${columns}</div>`;
}

function prospectCard(p) {
  return `
    <div class="prospect-card" draggable="true" data-id="${p.id}" data-action="open-prospect">
      <div class="prospect-card-name">${escapeHtml(p.name || 'Sin nombre')}</div>
      ${p.company ? `<div class="prospect-card-company">${escapeHtml(p.company)}</div>` : ''}
      <div class="prospect-card-meta">
        ${Number(p.estimatedValue) > 0 ? `<span class="tag tag-value">${formatCurrency(p.estimatedValue)}</span>` : ''}
        ${p.source ? `<span class="tag tag-source">${escapeHtml(p.source)}</span>` : ''}
      </div>
    </div>
  `;
}
