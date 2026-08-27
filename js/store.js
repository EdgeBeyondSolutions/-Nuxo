import {
  db, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, orderBy, serverTimestamp, writeBatch,
} from './firebase.js?v=1';

const DEFAULT_STAGES = [
  { name: 'New', color: '#64748B' },
  { name: 'Contacted', color: '#3654F4' },
  { name: 'Qualified', color: '#8B5CF6' },
  { name: 'Proposal', color: '#E08A1E' },
  { name: 'Negotiation', color: '#EC4899' },
  { name: 'Won', color: '#0E9F6E', isWon: true },
  { name: 'Lost', color: '#E23E4E', isLost: true },
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

export function subscribeContacts(cb) {
  const q = query(col('contacts'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
}

export function subscribeCompanies(cb) {
  const q = query(col('companies'), orderBy('createdAt', 'desc'));
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

export function createContact(data) {
  return addDoc(col('contacts'), {
    firstName: '', lastName: '', email: '', phone: '', mobile: '', whatsapp: '',
    source: '', stageId: '',
    street: '', street2: '', city: '', state: '', country: '', postalCode: '',
    companyIds: [], estimatedValue: 0, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    ...data,
  });
}

export function updateContact(id, data) {
  return updateDoc(doc(col('contacts'), id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteContact(id) {
  return deleteDoc(doc(col('contacts'), id));
}

export function createCompany(data) {
  return addDoc(col('companies'), {
    name: '', website: '', phone: '', whatsapp: '', email: '', industry: '',
    facebook: '', instagram: '', street: '', street2: '', city: '', state: '', country: '', postalCode: '',
    snapshotData: '', snapshotName: '', snapshotUploadedAt: '',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    ...data,
  });
}

export function updateCompany(id, data) {
  return updateDoc(doc(col('companies'), id), { ...data, updatedAt: serverTimestamp() });
}

export function deleteCompany(id) {
  return deleteDoc(doc(col('companies'), id));
}

export function createActivity(data) {
  return addDoc(col('activities'), {
    contactId: '', type: 'note', subject: '', content: '', createdAt: serverTimestamp(), ...data,
  });
}

export function createTask(data) {
  return addDoc(col('tasks'), {
    contactId: '', title: '', dueDate: '', done: false, createdAt: serverTimestamp(), ...data,
  });
}

export function updateTask(id, data) {
  return updateDoc(doc(col('tasks'), id), data);
}

export function deleteTask(id) {
  return deleteDoc(doc(col('tasks'), id));
}
