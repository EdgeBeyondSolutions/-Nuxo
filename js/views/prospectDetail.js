import { state, prospectById, activitiesFor, tasksFor } from '../state.js';
import { escapeHtml, formatCurrency, formatDateTime, formatDue, isOverdue, activityIcon } from '../util.js';

export function renderProspectDetail(id) {
  const p = prospectById(id);
  if (!p) return `<div class="empty-state"><div class="empty-state-title">Prospecto no encontrado</div></div>`;

  const activities = activitiesFor(id);
  const tasks = tasksFor(id).sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));

  return `
    <button class="back-link" data-action="back-to-prospects">← Volver a prospectos</button>
    <div class="detail-header">
      <div>
        <h1 class="detail-name">${escapeHtml(p.name || 'Sin nombre')}</h1>
        ${p.company ? `<div class="detail-company">${escapeHtml(p.company)}</div>` : ''}
      </div>
      <button class="btn btn-ghost btn-danger btn-sm" data-action="delete-prospect" data-id="${p.id}">Eliminar</button>
    </div>

    <div class="detail-grid">
      <div>
        <div class="detail-panel">
          <div class="detail-panel-title">Actividad</div>
          <div class="activity-composer">
            <select id="activity-type">
              <option value="note">Nota</option>
              <option value="call">Llamada</option>
              <option value="email">Email</option>
              <option value="meeting">Reunión</option>
            </select>
            <input id="activity-content" type="text" placeholder="Escribe una nota…" />
            <button class="btn btn-primary btn-sm" data-action="add-activity" data-id="${p.id}">Agregar</button>
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
            `).join('') : `<div class="empty-state-desc" style="padding:16px 0;">Sin actividad todavía.</div>`}
          </div>
        </div>

        <div class="detail-panel">
          <div class="detail-panel-title">Tareas</div>
          <div class="activity-composer">
            <input id="task-title-input" type="text" placeholder="Nueva tarea…" />
            <input id="task-due-input" type="date" style="max-width:150px;" />
            <button class="btn btn-primary btn-sm" data-action="add-task" data-id="${p.id}">Agregar</button>
          </div>
          ${tasks.length ? tasks.map((t) => `
            <div class="task-row ${t.done ? 'done' : ''}">
              <div class="check-circle ${t.done ? 'checked' : ''}" data-action="toggle-task" data-id="${t.id}">${t.done ? '✓' : ''}</div>
              <div class="task-row-title">${escapeHtml(t.title)}</div>
              ${t.dueDate ? `<div class="task-row-due ${isOverdue(t.dueDate) && !t.done ? 'overdue' : ''}">${formatDue(t.dueDate)}</div>` : ''}
            </div>
          `).join('') : `<div class="empty-state-desc" style="padding:8px 0;">Sin tareas pendientes.</div>`}
        </div>
      </div>

      <div>
        <div class="detail-panel">
          <div class="detail-panel-title">Datos de contacto</div>
          <div class="info-row"><label>Etapa</label>
            <select data-field="stageId" data-id="${p.id}">
              ${state.stages.map((s) => `<option value="${s.id}" ${p.stageId === s.id ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="info-row"><label>Email</label><input type="email" value="${escapeHtml(p.email || '')}" data-field="email" data-id="${p.id}" /></div>
          <div class="info-row"><label>Teléfono</label><input type="tel" value="${escapeHtml(p.phone || '')}" data-field="phone" data-id="${p.id}" /></div>
          <div class="info-row"><label>Empresa</label><input type="text" value="${escapeHtml(p.company || '')}" data-field="company" data-id="${p.id}" /></div>
          <div class="info-row"><label>Fuente</label><input type="text" value="${escapeHtml(p.source || '')}" data-field="source" data-id="${p.id}" /></div>
          <div class="info-row"><label>Valor estimado</label><input type="number" value="${p.estimatedValue || 0}" data-field="estimatedValue" data-id="${p.id}" /></div>
        </div>
      </div>
    </div>
  `;
}
