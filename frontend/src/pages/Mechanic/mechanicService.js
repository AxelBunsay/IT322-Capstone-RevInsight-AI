import { api } from '../../services/api';

const DEMO_EMAIL = 'miguel@workshop.ph';
const DEMO_PASSWORD = 'miguel123';
const MODE_KEY = 'mechanicMode';
const PROFILE_KEY = 'mechanicDemoProfile';
const JOBS_KEY = 'mechanicDemoJobs';
const NOTIFICATIONS_KEY = 'mechanicDemoNotifications';

const demoProfile = {
  id: 'demo-mechanic', email: DEMO_EMAIL, firstName: 'Miguel', lastName: 'Santos',
  phoneNumber: '0917 123 4567', specialization: 'general', yearsOfExperience: 6,
  certifications: [], bio: '', availabilityStatus: 'available', totalRepairs: 128,
  averageRating: 4.8, successRate: 96
};

const demoJobs = [
  { _id: 'demo-1043', jobId: 'JO-1043', customerName: 'Ramon Dela Cruz', plate: 'NBC 4821', vehicle: 'Honda Click 125', serviceType: 'Brake', priority: 'High', status: 'awaiting-response', dueDate: '2026-09-29', dueTime: '05:59 AM', createdAt: '2026-09-28T11:41:00', overdue: true, description: 'Inspect the front brake assembly and replace worn pads if needed.' },
  { _id: 'demo-1041', jobId: 'JO-1041', customerName: 'Aileen Reyes', plate: 'DFG 2290', vehicle: 'Yamaha Mio i125', serviceType: 'Tune-up', priority: 'Normal', status: 'inspection', dueDate: '2026-09-29', dueTime: '04:59 AM', createdAt: '2026-09-28T09:35:00', overdue: true, description: 'Complete the scheduled engine and safety inspection.' },
  { _id: 'demo-1039', jobId: 'JO-1039', customerName: 'Carlo Mendoza', plate: 'KLM 7715', vehicle: 'Suzuki Raider 150', serviceType: 'Brake service', priority: 'Normal', status: 'in-progress', dueDate: '2026-09-28', dueTime: '09:59 PM', createdAt: '2026-09-27T14:20:00', overdue: true, description: 'Service the brakes and confirm the lever response before release.' },
  { _id: 'demo-1038', jobId: 'JO-1038', customerName: 'Jessa Tolentino', plate: 'PQR 1188', vehicle: 'Honda Beat', serviceType: 'Chain and sprocket', priority: 'Normal', status: 'waiting-parts', dueDate: '2026-09-29', dueTime: '01:59 AM', createdAt: '2026-09-27T12:10:00', overdue: true, description: 'Replace the worn chain and sprocket set when parts arrive.' },
  { _id: 'demo-1036', jobId: 'JO-1036', customerName: 'Mark Villanueva', plate: 'STU 5502', vehicle: 'Kawasaki Barako II', serviceType: 'Change oil', priority: 'Normal', status: 'quality-check', dueDate: '2026-09-29', dueTime: '12:59 AM', createdAt: '2026-09-27T10:05:00', overdue: false, description: 'Perform a final quality check after the oil change.' },
  { _id: 'demo-1031', jobId: 'JO-1031', customerName: 'Nina Bautista', plate: 'WXY 3007', vehicle: 'Honda TMX 155', serviceType: 'Tune-up', priority: 'Normal', status: 'completed', dueDate: '2026-09-26', dueTime: '11:59 PM', createdAt: '2026-09-25T16:30:00', overdue: false, description: 'Tune-up completed and ready for customer collection.' }
];

const demoNotifications = [
  { id: 'notice-1', text: 'New job assigned: JO-1043 (Honda Click 125)', time: 'Sep 28, 11:41 PM', read: false },
  { id: 'notice-2', text: 'Customer approved additional repair on JO-1039', time: 'Sep 28, 09:59 PM', read: false },
  { id: 'notice-3', text: 'Quality check required for JO-1036', time: 'Sep 28, 06:59 PM', read: true }
];

function readStored(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : JSON.parse(JSON.stringify(fallback));
  } catch {
    return JSON.parse(JSON.stringify(fallback));
  }
}

function saveStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export const isDemoMechanic = () => localStorage.getItem(MODE_KEY) === 'demo';

export async function loginMechanic(credentials) {
  localStorage.removeItem(MODE_KEY);
  if (credentials.email.trim().toLowerCase() === DEMO_EMAIL && credentials.password === DEMO_PASSWORD) {
    const mechanic = readStored(PROFILE_KEY, demoProfile);
    localStorage.setItem(MODE_KEY, 'demo');
    return { token: 'demo-mechanic-session', mechanic };
  }

  const response = await api.loginMechanic(credentials);
  localStorage.setItem(MODE_KEY, 'live');
  return response;
}

export function getMechanicProfile() {
  return isDemoMechanic() ? Promise.resolve({ mechanic: readStored(PROFILE_KEY, demoProfile) }) : api.getMechanicProfile();
}

export function getMechanicJobs() {
  return isDemoMechanic() ? Promise.resolve({ jobs: readStored(JOBS_KEY, demoJobs) }) : api.getMechanicJobs();
}

export function saveMechanicProfile(profile) {
  if (!isDemoMechanic()) return api.updateMechanicProfile(profile);
  const mechanic = saveStored(PROFILE_KEY, { ...readStored(PROFILE_KEY, demoProfile), ...profile });
  localStorage.setItem('mechanicUser', JSON.stringify(mechanic));
  return Promise.resolve({ message: 'Profile saved.', mechanic });
}

export const updateMechanicAvailability = (availabilityStatus, profile) => saveMechanicProfile({ ...profile, availabilityStatus });

export function getMechanicNotifications() {
  return Promise.resolve(isDemoMechanic() ? readStored(NOTIFICATIONS_KEY, demoNotifications) : []);
}

export function markMechanicNotificationsRead() {
  if (!isDemoMechanic()) return Promise.resolve([]);
  const notifications = readStored(NOTIFICATIONS_KEY, demoNotifications).map((item) => ({ ...item, read: true }));
  return Promise.resolve(saveStored(NOTIFICATIONS_KEY, notifications));
}

export function getJobActions(job) {
  if (isDemoMechanic()) {
    return ({
      'awaiting-response': ['accept', 'decline'], inspection: ['start', 'decline'],
      'in-progress': ['waiting-parts', 'quality-check', 'complete'],
      'waiting-parts': ['start'], 'quality-check': ['complete']
    })[job.status] || [];
  }
  return ({ confirmed: ['accept', 'decline'], accepted: ['start'], 'in-progress': ['complete'] })[job.status] || [];
}

export async function performJobAction(job, action) {
  if (!isDemoMechanic()) {
    if (action === 'accept') return api.acceptMechanicJob(job._id, '08:00');
    const status = { decline: 'declined', start: 'in-progress', complete: 'completed' }[action];
    if (status) return api.updateMechanicJobStatus(job._id, status);
    throw new Error('That action is only available for the sample mechanic account.');
  }

  const nextStatus = {
    accept: 'inspection', decline: 'declined', start: 'in-progress',
    'waiting-parts': 'waiting-parts', 'quality-check': 'quality-check', complete: 'completed'
  }[action];
  if (!nextStatus) throw new Error('Unknown job action.');
  const jobs = readStored(JOBS_KEY, demoJobs).map((item) => item._id === job._id ? { ...item, status: nextStatus } : item);
  saveStored(JOBS_KEY, jobs);
  return { jobs };
}

export function logoutMechanic() {
  ['mechanicToken', 'mechanicUser', MODE_KEY].forEach((key) => localStorage.removeItem(key));
}