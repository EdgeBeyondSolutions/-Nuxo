import {
  auth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut,
} from './firebase.js?v=1';
import {
  setUid, seedDefaultsIfNeeded, subscribeStages, subscribeContacts, subscribeCompanies, subscribeActivities, subscribeTasks,
  subscribeDeals, createDeal, updateDeal, deleteDeal,
  createContact, updateContact, deleteContact, createCompany, updateCompany, deleteCompany,
  createActivity, createTask, updateTask, deleteTask,
} from './store.js?v=6';
import { state, notify, onStateChange, stageById, contactById, companyById, dealFor, dealById, dealsForCompany, dealsFor } from './state.js?v=2';
import { renderPipeline } from './views/pipeline.js?v=3';
import { renderContactsTable } from './views/contacts.js?v=1';
import { renderContactDetail } from './views/contactDetail.js?v=10';
import { renderCompaniesTable, renderCompanyDetail } from './views/companies.js?v=13';
import { renderTasks } from './views/tasksView.js?v=2';
import { renderDashboard } from './views/dashboard.js?v=1';
import { escapeHtml, todayISO } from './util.js?v=2';

// ───────────────────────── Theme ─────────────────────────
const THEME_KEY = 'nuxo-theme';
function applyTheme(t) {
  if (t === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  document.getElementById('theme-toggle').textContent = resolvedIsDark() ? '☀️' : '🌙';
}
function resolvedIsDark() {
  const t = localStorage.getItem(THEME_KEY) || 'system';
  if (t === 'dark') return true;
  if (t === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
applyTheme(localStorage.getItem(THEME_KEY) || 'system');
document.getElementById('theme-toggle').addEventListener('click', () => {
  const next = resolvedIsDark() ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// ───────────────────────── Auth ─────────────────────────
const authScreen = document.getElementById('auth-screen');
const appEl = document.getElementById('app');
const authForm = document.getElementById('auth-form');
const authError = document.getElementById('auth-error');
const authLoading = document.getElementById('auth-loading');
const authSubmit = document.getElementById('auth-submit');
const authToggle = document.getElementById('auth-toggle-mode');
let authMode = 'signin';
let unsubscribers = [];

authToggle.addEventListener('click', () => {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  authSubmit.textContent = authMode === 'signin' ? 'Sign In' : 'Create Account';
  authToggle.textContent = authMode === 'signin' ? 'First time here? Create an account' : 'Already have an account? Sign in';
  authError.hidden = true;
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  authError.hidden = true;
  authLoading.hidden = false;
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  try {
    if (authMode === 'signin') await signInWithEmailAndPassword(auth, email, password);
    else await createUserWithEmailAndPassword(auth, email, password);
  } catch (err) {
    authError.textContent = translateAuthError(err.code);
    authError.hidden = false;
  } finally {
    authLoading.hidden = true;
  }
});

function translateAuthError(code) {
  const map = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account exists with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Invalid email address.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  if (user) {
    authScreen.hidden = true;
    appEl.hidden = false;
    setUid(user.uid);
    boot();
  } else {
    appEl.hidden = true;
    authScreen.hidden = false;
    state.stages = []; state.contacts = []; state.companies = []; state.activities = []; state.tasks = []; state.deals = [];
  }
});

function boot() {
  let stagesLoaded = false;
  let contactsLoaded = false;
  let dealsLoaded = false;
  const pendingDealKeys = new Set();

  function reconcileDeals() {
    if (!contactsLoaded || !dealsLoaded) return;
    state.contacts.forEach((c) => {
      (c.companyIds || []).forEach((companyId) => {
        const key = `${c.id}_${companyId}`;
        if (dealFor(c.id, companyId) || pendingDealKeys.has(key)) return;
        pendingDealKeys.add(key);
        createDeal({
          contactId: c.id, companyId,
          stageId: c.stageId || '', estimatedValue: c.estimatedValue || 0,
        }).finally(() => pendingDealKeys.delete(key));
      });
    });
  }

  unsubscribers.push(subscribeStages(async (stages) => {
    state.stages = stages;
    if (!stagesLoaded) {
      stagesLoaded = true;
      await seedDefaultsIfNeeded(stages);
    }
    render();
  }));
  unsubscribers.push(subscribeContacts((contacts) => {
    state.contacts = contacts;
    contactsLoaded = true;
    reconcileDeals();
    render();
  }));
  unsubscribers.push(subscribeCompanies((companies) => { state.companies = companies; render(); }));
  unsubscribers.push(subscribeActivities((activities) => { state.activities = activities; render(); }));
  unsubscribers.push(subscribeTasks((tasks) => { state.tasks = tasks; render(); }));
  unsubscribers.push(subscribeDeals((deals) => {
    state.deals = deals;
    dealsLoaded = true;
    reconcileDeals();
    render();
  }));
}

// ───────────────────────── Navigation ─────────────────────────
const viewTitles = { dashboard: 'Dashboard', pipeline: 'Pipeline', contacts: 'Contacts', companies: 'Companies', tasks: 'Tasks' };

document.getElementById('main-nav').addEventListener('click', (e) => {
  const btn = e.target.closest('.nav-item');
  if (!btn) return;
  state.view = btn.dataset.view;
  state.selectedContactId = null;
  state.selectedCompanyId = null;
  closeMobileNav();
  render();
});

document.getElementById('search-input').addEventListener('input', (e) => {
  state.search = e.target.value;
  render();
});

const sidebar = document.getElementById('sidebar');
const mobileOverlay = document.getElementById('mobile-nav-overlay');
document.getElementById('mobile-nav-toggle').addEventListener('click', () => {
  sidebar.classList.add('open');
  mobileOverlay.hidden = false;
});
mobileOverlay.addEventListener('click', closeMobileNav);
function closeMobileNav() { sidebar.classList.remove('open'); mobileOverlay.hidden = true; }

// ───────────────────────── Render ─────────────────────────
function render() {
  document.querySelectorAll('.nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === state.view));

  const today = todayISO();
  const openStageIds = new Set(state.stages.filter((s) => !s.isWon && !s.isLost).map((s) => s.id));
  document.getElementById('count-pipeline').textContent = state.contacts.filter((c) => openStageIds.has(c.stageId)).length;
  document.getElementById('count-contacts').textContent = state.contacts.length;
  document.getElementById('count-companies').textContent = state.companies.length;
  document.getElementById('count-tasks').textContent = state.tasks.filter((t) => !t.done && t.dueDate && t.dueDate <= today).length;

  const searchWrap = document.getElementById('topbar-search-wrap');
  searchWrap.hidden = !(state.view === 'pipeline' || state.view === 'contacts');

  document.getElementById('view-title').textContent =
    (state.view === 'contacts' && state.selectedContactId) || (state.view === 'companies' && state.selectedCompanyId)
      ? '' : viewTitles[state.view];

  const body = document.getElementById('view-body');
  switch (state.view) {
    case 'dashboard': body.innerHTML = renderDashboard(); break;
    case 'pipeline': body.innerHTML = renderPipeline(); attachDragAndDrop(); break;
    case 'contacts':
      body.innerHTML = state.selectedContactId ? renderContactDetail(state.selectedContactId) : renderContactsTable();
      break;
    case 'companies':
      body.innerHTML = state.selectedCompanyId ? renderCompanyDetail(state.selectedCompanyId) : renderCompaniesTable();
      break;
    case 'tasks': body.innerHTML = renderTasks(); break;
  }
}
onStateChange(render);

// ───────────────────────── Body click delegation ─────────────────────────
document.getElementById('view-body').addEventListener('click', (e) => {
  const openContact = e.target.closest('[data-action="open-contact"]');
  if (openContact) { state.view = 'contacts'; state.selectedContactId = openContact.dataset.id; render(); return; }

  const backContacts = e.target.closest('[data-action="back-to-contacts"]');
  if (backContacts) { state.selectedContactId = null; render(); return; }

  const newContact = e.target.closest('[data-action="new-contact"]');
  if (newContact) { openContactDrawer(); return; }

  const newContactForCompany = e.target.closest('[data-action="new-contact-for-company"]');
  if (newContactForCompany) { openContactDrawer(newContactForCompany.dataset.id); return; }

  const delContact = e.target.closest('[data-action="delete-contact"]');
  if (delContact) {
    if (!confirm('Delete this contact? This cannot be undone.')) return;
    const contactId = delContact.dataset.id;
    const deals = dealsFor(contactId);
    Promise.all(deals.map((d) => deleteDeal(d.id)))
      .then(() => deleteContact(contactId))
      .then(() => {
        state.selectedContactId = null;
        render();
        showToast('Contact deleted');
      });
    return;
  }

  const openCompany = e.target.closest('[data-action="open-company"]');
  if (openCompany) { state.view = 'companies'; state.selectedCompanyId = openCompany.dataset.id; render(); return; }

  const backCompanies = e.target.closest('[data-action="back-to-companies"]');
  if (backCompanies) { state.selectedCompanyId = null; render(); return; }

  const newCompany = e.target.closest('[data-action="new-company"]');
  if (newCompany) { openCompanyModal(); return; }

  const delCompany = e.target.closest('[data-action="delete-company"]');
  if (delCompany) {
    if (!confirm('Delete this company? It will be unlinked from all contacts.')) return;
    const companyId = delCompany.dataset.id;
    const linked = state.contacts.filter((c) => (c.companyIds || []).includes(companyId));
    const deals = dealsForCompany(companyId);
    Promise.all([
      ...linked.map((c) => updateContact(c.id, { companyIds: c.companyIds.filter((id) => id !== companyId) })),
      ...deals.map((d) => deleteDeal(d.id)),
    ])
      .then(() => deleteCompany(companyId))
      .then(() => {
        state.selectedCompanyId = null;
        render();
        showToast('Company deleted');
      });
    return;
  }

  const linkCompany = e.target.closest('[data-action="link-company"]');
  if (linkCompany) {
    const contactId = linkCompany.dataset.id;
    const select = document.getElementById('company-select');
    const value = select.value;
    if (!value) return;
    if (value === '__new__') { openCompanyModal(contactId); return; }
    const contact = contactById(contactId);
    const ids = [...(contact.companyIds || []), value];
    updateContact(contactId, { companyIds: ids });
    return;
  }

  const unlinkCompany = e.target.closest('[data-action="unlink-company"]');
  if (unlinkCompany) {
    const contactId = unlinkCompany.dataset.contactId;
    const companyId = unlinkCompany.dataset.companyId;
    const contact = contactById(contactId);
    const ids = (contact.companyIds || []).filter((id) => id !== companyId);
    updateContact(contactId, { companyIds: ids });
    const deal = dealFor(contactId, companyId);
    if (deal) deleteDeal(deal.id);
    return;
  }

  const downloadSnapshot = e.target.closest('[data-action="download-snapshot"]');
  if (downloadSnapshot) {
    const co = companyById(downloadSnapshot.dataset.id);
    if (!co?.snapshotData) return;
    const link = document.createElement('a');
    link.href = co.snapshotData;
    link.download = co.snapshotName || 'snapshot.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  const removeSnapshot = e.target.closest('[data-action="remove-snapshot"]');
  if (removeSnapshot) {
    if (!confirm('Remove this snapshot?')) return;
    updateCompany(removeSnapshot.dataset.id, { snapshotData: '', snapshotName: '', snapshotUploadedAt: '' })
      .then(() => showToast('Snapshot removed'));
    return;
  }

  const toggleTask = e.target.closest('[data-action="toggle-task"]');
  if (toggleTask) {
    const task = state.tasks.find((t) => t.id === toggleTask.dataset.id);
    if (task) updateTask(task.id, { done: !task.done });
    return;
  }

  const delTask = e.target.closest('[data-action="delete-task"]');
  if (delTask) {
    if (!confirm('Delete this task?')) return;
    deleteTask(delTask.dataset.id).then(() => showToast('Task deleted'));
    return;
  }

  const addActivity = e.target.closest('[data-action="add-activity"]');
  if (addActivity) {
    const type = document.getElementById('activity-type').value;
    const isEmail = type === 'email_sent' || type === 'email_received';
    const subject = isEmail ? document.getElementById('activity-subject').value.trim() : '';
    const content = document.getElementById('activity-content').value.trim();
    if (!content) return;
    createActivity({ contactId: addActivity.dataset.id, type, subject, content });
    document.getElementById('activity-content').value = '';
    document.getElementById('activity-subject').value = '';
    return;
  }

  const quickLogEmail = e.target.closest('[data-action="quick-log-email"]');
  if (quickLogEmail) {
    const typeSelect = document.getElementById('activity-type');
    typeSelect.value = quickLogEmail.dataset.logType;
    typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('activity-subject').focus();
    return;
  }

  const addTask = e.target.closest('[data-action="add-task"]');
  if (addTask) {
    const title = document.getElementById('task-title-input').value.trim();
    const dueDate = document.getElementById('task-due-input').value;
    if (!title) return;
    createTask({ contactId: addTask.dataset.id, title, dueDate });
    document.getElementById('task-title-input').value = '';
    document.getElementById('task-due-input').value = '';
    return;
  }

  const th = e.target.closest('th[data-sort]');
  if (th) {
    const key = th.dataset.sort;
    if (state.sortBy === key) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    else { state.sortBy = key; state.sortDir = 'asc'; }
    render();
    return;
  }
});

document.getElementById('view-body').addEventListener('change', (e) => {
  const filterStage = e.target.closest('#filter-stage');
  if (filterStage) { state.stageFilter = filterStage.value; render(); return; }

  const filterSource = e.target.closest('#filter-source');
  if (filterSource) { state.sourceFilter = filterSource.value; render(); return; }

  const taskFilter = e.target.closest('#task-filter');
  if (taskFilter) { state.taskFilter = taskFilter.value; render(); return; }

  const activityType = e.target.closest('#activity-type');
  if (activityType) {
    const isEmail = activityType.value === 'email_sent' || activityType.value === 'email_received';
    const subjectInput = document.getElementById('activity-subject');
    const contentInput = document.getElementById('activity-content');
    subjectInput.hidden = !isEmail;
    contentInput.placeholder = isEmail ? 'Summary of the email…' : 'Write a note…';
    return;
  }

  const field = e.target.closest('[data-field]');
  if (field) {
    const id = field.dataset.id;
    const key = field.dataset.field;
    const value = key === 'estimatedValue' ? Number(field.value) || 0 : field.value;
    updateContact(id, { [key]: value }).then(() => showToast('Saved'));
    return;
  }

  const companyField = e.target.closest('[data-company-field]');
  if (companyField) {
    const id = companyField.dataset.id;
    const key = companyField.dataset.companyField;
    updateCompany(id, { [key]: companyField.value }).then(() => showToast('Saved'));
    return;
  }

  const taskField = e.target.closest('[data-task-field]');
  if (taskField) {
    const id = taskField.dataset.id;
    const key = taskField.dataset.taskField;
    if (key === 'title' && !taskField.value.trim()) { render(); return; }
    updateTask(id, { [key]: taskField.value }).then(() => showToast('Saved'));
    return;
  }

  const dealField = e.target.closest('[data-deal-field]');
  if (dealField) {
    const id = dealField.dataset.id;
    const key = dealField.dataset.dealField;
    const value = key === 'estimatedValue' ? Number(dealField.value) || 0 : dealField.value;
    updateDeal(id, { [key]: value }).then(() => showToast('Saved'));
    return;
  }

  const snapshotInput = e.target.closest('[data-action="upload-snapshot"]');
  if (snapshotInput) {
    const file = snapshotInput.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { showToast('PDF files only'); snapshotInput.value = ''; return; }
    const MAX_BYTES = 700 * 1024;
    if (file.size > MAX_BYTES) { showToast('File too large (max ~700KB)'); snapshotInput.value = ''; return; }
    const id = snapshotInput.dataset.id;
    const reader = new FileReader();
    reader.onload = () => {
      updateCompany(id, {
        snapshotData: reader.result,
        snapshotName: file.name,
        snapshotUploadedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      }).then(() => showToast('Snapshot uploaded'));
    };
    reader.readAsDataURL(file);
  }
});

document.getElementById('view-body').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.matches('#activity-content')) {
    e.target.closest('.activity-composer').querySelector('[data-action="add-activity"]').click();
  }
  if (e.key === 'Enter' && e.target.matches('#task-title-input')) {
    e.target.closest('.activity-composer').querySelector('[data-action="add-task"]').click();
  }
});

// ───────────────────────── New contact drawer ─────────────────────────
const drawer = document.getElementById('contact-drawer');
const contactForm = document.getElementById('contact-form');
const firstNameInput = document.getElementById('new-contact-first-name');

let pendingLinkCompanyId = null;

function openContactDrawer(linkToCompanyId = null) {
  pendingLinkCompanyId = linkToCompanyId;
  contactForm.reset();
  const stageSelect = document.getElementById('new-contact-stage');
  stageSelect.innerHTML = state.stages.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('');
  drawer.hidden = false;
  setTimeout(() => firstNameInput.focus(), 30);
}
function closeDrawer() { drawer.hidden = true; pendingLinkCompanyId = null; }
document.getElementById('contact-drawer-backdrop').addEventListener('click', closeDrawer);
document.getElementById('contact-cancel').addEventListener('click', closeDrawer);

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    firstName: firstNameInput.value.trim(),
    lastName: document.getElementById('new-contact-last-name').value.trim(),
    email: document.getElementById('new-contact-email').value.trim(),
    phone: document.getElementById('new-contact-phone').value.trim(),
    mobile: document.getElementById('new-contact-mobile').value.trim(),
    whatsapp: document.getElementById('new-contact-whatsapp').value.trim(),
    source: document.getElementById('new-contact-source').value.trim(),
    stageId: document.getElementById('new-contact-stage').value,
    estimatedValue: Number(document.getElementById('new-contact-value').value) || 0,
    street: document.getElementById('new-contact-street').value.trim(),
    street2: document.getElementById('new-contact-street2').value.trim(),
    city: document.getElementById('new-contact-city').value.trim(),
    state: document.getElementById('new-contact-state').value.trim(),
    postalCode: document.getElementById('new-contact-postal-code').value.trim(),
    country: document.getElementById('new-contact-country').value.trim(),
    companyIds: pendingLinkCompanyId ? [pendingLinkCompanyId] : [],
  };
  if (!data.firstName) return;
  await createContact(data);
  closeDrawer();
  showToast('Contact added');
});

document.getElementById('new-btn').addEventListener('click', openContactDrawer);

// ───────────────────────── New company modal ─────────────────────────
const companyModal = document.getElementById('company-modal');
const companyForm = document.getElementById('company-form');
let pendingLinkContactId = null;

function openCompanyModal(linkToContactId = null) {
  pendingLinkContactId = linkToContactId;
  companyForm.reset();
  companyModal.hidden = false;
  setTimeout(() => document.getElementById('new-company-name').focus(), 30);
}
function closeCompanyModal() { companyModal.hidden = true; pendingLinkContactId = null; }
document.getElementById('company-modal-backdrop').addEventListener('click', closeCompanyModal);
document.getElementById('company-cancel').addEventListener('click', closeCompanyModal);

companyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    name: document.getElementById('new-company-name').value.trim(),
    website: document.getElementById('new-company-website').value.trim(),
    phone: document.getElementById('new-company-phone').value.trim(),
    whatsapp: document.getElementById('new-company-whatsapp').value.trim(),
    email: document.getElementById('new-company-email').value.trim(),
    industry: document.getElementById('new-company-industry').value.trim(),
    facebook: document.getElementById('new-company-facebook').value.trim(),
    instagram: document.getElementById('new-company-instagram').value.trim(),
    street: document.getElementById('new-company-street').value.trim(),
    street2: document.getElementById('new-company-street2').value.trim(),
    city: document.getElementById('new-company-city').value.trim(),
    state: document.getElementById('new-company-state').value.trim(),
    postalCode: document.getElementById('new-company-postal-code').value.trim(),
    country: document.getElementById('new-company-country').value.trim(),
  };
  if (!data.name) return;
  const ref = await createCompany(data);
  if (pendingLinkContactId) {
    const contact = contactById(pendingLinkContactId);
    const ids = [...(contact.companyIds || []), ref.id];
    await updateContact(pendingLinkContactId, { companyIds: ids });
  }
  closeCompanyModal();
  showToast('Company added');
});

// ───────────────────────── Keyboard shortcuts ─────────────────────────
document.addEventListener('keydown', (e) => {
  const tag = document.activeElement.tagName;
  const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
  if (e.key === 'Escape') { closeDrawer(); closeCompanyModal(); closeMobileNav(); return; }
  if (typing) return;
  if (e.key === 'n' || e.key === 'N') { e.preventDefault(); openContactDrawer(); }
  if (e.key === '/') { e.preventDefault(); document.getElementById('search-input').focus(); }
});

// ───────────────────────── Drag & drop (pipeline) ─────────────────────────
function attachDragAndDrop() {
  document.querySelectorAll('.prospect-card').forEach((card) => {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  document.querySelectorAll('.board-column-body').forEach((col) => {
    col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', async (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const dragging = document.querySelector('.prospect-card.dragging');
      if (!dragging) return;
      const id = dragging.dataset.id;
      const dealId = dragging.dataset.dealId;
      const newStageId = col.dataset.stage;
      const contact = contactById(id);
      if (!contact) return;

      if (dealId) {
        const deal = dealById(dealId);
        if (!deal || deal.stageId === newStageId) return;
        const oldStage = stageById(deal.stageId);
        const newStage = stageById(newStageId);
        const company = companyById(deal.companyId);
        await updateDeal(dealId, { stageId: newStageId });
        await createActivity({ contactId: id, type: 'stage_change', content: `${company ? `[${company.name}] ` : ''}Moved from "${oldStage?.name || '—'}" to "${newStage?.name}"` });
      } else {
        if (contact.stageId === newStageId) return;
        const oldStage = stageById(contact.stageId);
        const newStage = stageById(newStageId);
        await updateContact(id, { stageId: newStageId });
        await createActivity({ contactId: id, type: 'stage_change', content: `Moved from "${oldStage?.name || '—'}" to "${newStage?.name}"` });
      }
    });
  });
}

// ───────────────────────── Toast ─────────────────────────
let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}
