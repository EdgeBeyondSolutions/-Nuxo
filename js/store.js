import {
  db, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, writeBatch,
} from './firebase.js';

const DEFAULT_STAGES = [
  { name: 'Nuevo', color: '#64748B' },
  { name: 'Contactado', color: '#3654F4' },
  { name: 'Calificado', color: '#8B5CF6' },
  { name: 'Propuesta', color: '#E08A1E' },
  { name: 'Negociación', color: '#EC4899' },
  { name: 'Ganado', color: '#0E9F6E', isWon: true },
  { name: 'Perdido', color: '#E23E4E', isLost: true },
];

let uid = null;

export function setUid(id) { uid = id; }

function col(name) { return collection(db, 'users', uid, name); }

export async function seedDefaultsIfNeeded(stages) {
  if (stages.length > 0) return;
  const batch = writeBatch(db);
  DEFAULT_STAGES.forEach((s, i) => {
    const ref = doc(col('stages'));
    batch.set(ref, { ...s, order: i, createdAt: serverTimestamp() });
  });
  await batch.commit();
}

export function subscribeStages(cb) {
  const q = query(col('stages'), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeProspects(cb) {
  const q = query(col('prospects'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeActivities(cb) {
  const q = query(col('activities'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeTasks(cb) {
  const q = query(col('tasks'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function createProspect(data) {
  return addDoc(col('prospects'), {
    name: '', company: '', email: '', phone: '', source: '', stageId: '',
    estimatedValue: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    ...data,
  });
}

export function updateProspect(id, data) {
  return updateDoc(doc(col('prospects'), id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteProspect(id) {
  return deleteDoc(doc(col('prospects'), id));
}

export function createActivity(data) {
  return addDoc(col('activities'), {
    prospectId: '', type: 'note', content: '', createdAt: serverTimestamp(), ...data,
  });
}

export function createTask(data) {
  return addDoc(col('tasks'), {
    prospectId: '', title: '', dueDate: '', done: false, createdAt: serverTimestamp(), ...data,
  });
}

export function updateTask(id, data) {
  return updateDoc(doc(col('tasks'), id), data);
}

export function deleteTask(id) {
  return deleteDoc(doc(col('tasks'), id));
}
