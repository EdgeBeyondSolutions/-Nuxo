export const state = {
  uid: null,
  stages: [],
  contacts: [],
  companies: [],
  activities: [],
  tasks: [],
  view: 'dashboard',
  search: '',
  stageFilter: '',
  sourceFilter: '',
  sortBy: 'createdAt',
  sortDir: 'desc',
  selectedContactId: null,
  selectedCompanyId: null,
  taskFilter: 'pending',
};

const renderListeners = new Set();

export function onStateChange(fn) {
  renderListeners.add(fn);
}

export function notify() {
  renderListeners.forEach((fn) => fn());
}

export function stageById(id) {
  return state.stages.find((s) => s.id === id);
}

export function contactById(id) {
  return state.contacts.find((c) => c.id === id);
}

export function companyById(id) {
  return state.companies.find((c) => c.id === id);
}

export function companiesFor(contact) {
  const ids = contact?.companyIds || [];
  return ids.map((id) => companyById(id)).filter(Boolean);
}

export function contactsForCompany(companyId) {
  return state.contacts.filter((c) => (c.companyIds || []).includes(companyId));
}

export function activitiesFor(contactId) {
  return state.activities.filter((a) => a.contactId === contactId);
}

export function tasksFor(contactId) {
  return state.tasks.filter((t) => t.contactId === contactId);
}

export function filteredContacts() {
  const term = state.search.trim().toLowerCase();
  return state.contacts.filter((c) => {
    if (state.stageFilter && c.stageId !== state.stageFilter) return false;
    if (state.sourceFilter && c.source !== state.sourceFilter) return false;
    if (!term) return true;
    const companyNames = companiesFor(c).map((co) => co.name.toLowerCase()).join(' ');
    return (c.firstName || '').toLowerCase().includes(term)
      || (c.lastName || '').toLowerCase().includes(term)
      || (c.email || '').toLowerCase().includes(term)
      || companyNames.includes(term);
  });
}
