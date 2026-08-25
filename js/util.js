export function escapeHtml(str = '') {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function todayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return isoFromDate(d);
}

export function isoFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isOverdue(dueISO) {
  if (!dueISO) return false;
  return dueISO < todayISO();
}

export function formatDue(dueISO) {
  if (!dueISO) return '';
  const [y, m, d] = dueISO.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export function formatDateTime(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function formatCurrency(n) {
  const v = Number(n) || 0;
  return v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function fullName(p) {
  return [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unnamed';
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

const ACTIVITY_ICONS = { note: '📝', call: '📞', email: '✉️', meeting: '🤝', stage_change: '🔀' };
export function activityIcon(type) {
  return ACTIVITY_ICONS[type] || '📝';
}
