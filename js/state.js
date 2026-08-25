export const state = {
  uid: null,
  stages: [],
  prospects: [],
  activities: [],
  tasks: [],
  view: 'dashboard',
  search: '',
  stageFilter: '',
  sourceFilter: '',
  sortBy: 'createdAt',
  sortDir: 'desc',
  selectedProspectId: null,
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

export function prospectById(id) {
  return state.prospects.find((p) => p.id === id);
}

export function activitiesFor(prospectId) {
  return state.activities.filter((a) => a.prospectId === prospectId);
}

export function tasksFor(prospectId) {
  return state.tasks.filter((t) => t.prospectId === prospectId);
}

export function filteredProspects() {
  const term = state.search.trim().toLowerCase();
  return state.prospects.filter((p) => {
    if (state.stageFilter && p.stageId !== state.stageFilter) return false;
    if (state.sourceFilter && p.source !== state.sourceFilter) return false;
    if (!term) return true;
    return (p.name || '').toLowerCase().includes(term)
      || (p.company || '').toLowerCase().includes(term)
      || (p.email || '').toLowerCase().includes(term);
  });
}
