import { state } from '../state.js?v=1';
import { escapeHtml, formatCurrency, todayISO } from '../util.js?v=1';

export function renderDashboard() {
  const today = todayISO();
  const monthStart = today.slice(0, 7);
  const total = state.contacts.length;
  const overdueTasks = state.tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today).length;
  const wonStages = new Set(state.stages.filter((s) => s.isWon).map((s) => s.id));
  const wonThisMonth = state.contacts.filter((c) => wonStages.has(c.stageId) && c.updatedAt?.toDate?.().toISOString().slice(0, 7) === monthStart);
  const wonValue = wonThisMonth.reduce((sum, c) => sum + (Number(c.estimatedValue) || 0), 0);
  const pipelineValue = state.contacts
    .filter((c) => !state.stages.find((s) => s.id === c.stageId)?.isWon && !state.stages.find((s) => s.id === c.stageId)?.isLost)
    .reduce((sum, c) => sum + (Number(c.estimatedValue) || 0), 0);

  const maxCount = Math.max(1, ...state.stages.map((s) => state.contacts.filter((c) => c.stageId === s.id).length));

  return `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-card-label">Total Contacts</div><div class="stat-card-value">${total}</div></div>
      <div class="stat-card"><div class="stat-card-label">Pipeline Value</div><div class="stat-card-value accent">${formatCurrency(pipelineValue)}</div></div>
      <div class="stat-card"><div class="stat-card-label">Won This Month</div><div class="stat-card-value success">${wonThisMonth.length} · ${formatCurrency(wonValue)}</div></div>
      <div class="stat-card"><div class="stat-card-label">Overdue Tasks</div><div class="stat-card-value ${overdueTasks ? 'danger' : ''}">${overdueTasks}</div></div>
    </div>

    <div class="section-heading">Contacts by Stage</div>
    <div class="stage-bars">
      ${state.stages.map((s) => {
        const count = state.contacts.filter((c) => c.stageId === s.id).length;
        const pct = Math.round((count / maxCount) * 100);
        return `
          <div class="stage-bar-row">
            <div class="stage-bar-label">${escapeHtml(s.name)}</div>
            <div class="stage-bar-track"><div class="stage-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
            <div class="stage-bar-count">${count}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}
