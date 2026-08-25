import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './mechanic.css';

function MechanicPage({ title, description, children }) {
  return (
    <main className="mechanic-page">
      <nav aria-label="Mechanic navigation"><Link to="/mechanic/dashboard">Dashboard</Link><Link to="/mechanic/jobs">Jobs</Link><Link to="/mechanic/profile">Profile</Link></nav>
      <h1>{title}</h1>
      <p>{description}</p>
      {children}
    </main>
  );
}

function MechanicLogin() {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitLogin = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.loginMechanic(credentials);
      localStorage.setItem('mechanicToken', response.token);
      localStorage.setItem('mechanicUser', JSON.stringify(response.mechanic || {}));
      navigate('/mechanic/dashboard');
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return <MechanicPage title="Mechanic Login" description="Sign in to manage assigned service jobs."><form className="mechanic-form" onSubmit={submitLogin}>{error && <p className="mechanic-error" role="alert">{error}</p>}<label>Email<input type="email" required value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} /></label><label>Password<input type="password" required value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign In'}</button></form></MechanicPage>;
}

function MechanicDashboard() {
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem('mechanicUser') || '{}'));
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.getMechanicProfile(), api.getMechanicJobs()])
      .then(([profileResponse, jobsResponse]) => {
        if (!isMounted) return;
        setProfile(profileResponse.mechanic || {});
        setJobs(jobsResponse.jobs || []);
      })
      .catch((requestError) => { if (isMounted) setError(requestError.message || 'Dashboard data could not be loaded.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const completedJobs = jobs.filter((job) => job.status === 'completed').length;
  return <MechanicPage title="Mechanic Dashboard" description="View your service activity and available work.">{error && <p className="mechanic-error" role="alert">{error}</p>}{isLoading ? <p>Loading dashboard...</p> : <><div className="mechanic-welcome"><h2>{profile.firstName} {profile.lastName}</h2><p>{profile.specialization || 'General service'} · {profile.availabilityStatus || 'available'}</p></div><div className="mechanic-dashboard-stats"><div><strong>{jobs.length}</strong><span>Assigned Jobs</span></div><div><strong>{completedJobs}</strong><span>Completed Jobs</span></div><div><strong>{profile.totalRepairs || 0}</strong><span>Total Repairs</span></div><div><strong>{profile.averageRating || 0}</strong><span>Average Rating</span></div></div></>}</MechanicPage>;
}

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionId, setActionId] = useState('');

  const loadJobs = () => api.getMechanicJobs().then((response) => setJobs(response.jobs || []));
  useEffect(() => { loadJobs().catch((requestError) => setError(requestError.message || 'Jobs could not be loaded.')).finally(() => setIsLoading(false)); }, []);

  const acceptJob = async (job) => {
    const startTime = window.prompt('Enter start time between 08:00 and 17:00', '08:00');
    if (!startTime) return;
    setActionId(job._id);
    try { await api.acceptMechanicJob(job._id, startTime); await loadJobs(); } catch (requestError) { setError(requestError.message || 'Job could not be accepted.'); } finally { setActionId(''); }
  };

  const updateStatus = async (job, status) => {
    setActionId(job._id);
    try { await api.updateMechanicJobStatus(job._id, status); await loadJobs(); } catch (requestError) { setError(requestError.message || 'Job status could not be updated.'); } finally { setActionId(''); }
  };

  const visibleJobs = jobs.filter((job) => statusFilter === 'all' || job.status === statusFilter);
  return <MechanicPage title="Mechanic Jobs" description="Review and update your assigned jobs.">{error && <p className="mechanic-error" role="alert">{error}</p>}<div className="jobs-toolbar"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="confirmed">Confirmed</option><option value="accepted">Accepted</option><option value="in-progress">In progress</option><option value="completed">Completed</option><option value="declined">Declined</option></select></div>{isLoading ? <p>Loading jobs...</p> : !visibleJobs.length ? <p className="mechanic-empty">No jobs match this filter.</p> : <div className="job-list">{visibleJobs.map((job) => <article className="job-card" key={job._id}><div className="job-card-header"><div><h2>{job.serviceType}</h2><p>{job.description}</p></div><span className={`job-status ${job.status}`}>{job.status.replaceAll('-', ' ')}</span></div><p className="job-meta">Requested {new Date(job.createdAt).toLocaleString('en-PH')}{job.startTime ? ` · Starts ${job.startTime}` : ''}</p><div className="job-actions">{job.status === 'confirmed' && <><button type="button" onClick={() => acceptJob(job)} disabled={actionId === job._id}>Accept Job</button><button type="button" onClick={() => updateStatus(job, 'declined')} disabled={actionId === job._id}>Decline</button></>}{job.status === 'accepted' && <button type="button" onClick={() => updateStatus(job, 'in-progress')} disabled={actionId === job._id}>Start Job</button>}{job.status === 'in-progress' && <button type="button" onClick={() => updateStatus(job, 'completed')} disabled={actionId === job._id}>Complete Job</button>}</div></article>)}</div>}</MechanicPage>;
}

function Profile() {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phoneNumber: '', specialization: 'general', yearsOfExperience: 0, certifications: [], bio: '', availabilityStatus: 'available', totalRepairs: 0, averageRating: 0, successRate: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    api.getMechanicProfile()
      .then((response) => { if (isMounted) setProfile((currentProfile) => ({ ...currentProfile, ...(response.mechanic || {}) })); })
      .catch((requestError) => { if (isMounted) setError(requestError.message || 'Profile could not be loaded.'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, []);

  const updateField = (field, value) => setProfile((currentProfile) => ({ ...currentProfile, [field]: value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await api.updateMechanicProfile({ ...profile, yearsOfExperience: Number(profile.yearsOfExperience), certifications: Array.isArray(profile.certifications) ? profile.certifications : profile.certifications.split(',').map((item) => item.trim()).filter(Boolean) });
      const updatedProfile = response.mechanic || profile;
      setProfile(updatedProfile);
      localStorage.setItem('mechanicUser', JSON.stringify(updatedProfile));
      setMessage(response.message || 'Profile updated successfully.');
    } catch (saveError) {
      setError(saveError.message || 'Profile could not be updated.');
    } finally {
      setIsSaving(false);
    }
  };

  return <MechanicPage title="Mechanic Profile" description="Manage your professional information.">{error && <p className="mechanic-error" role="alert">{error}</p>}{message && <p className="mechanic-success" role="status">{message}</p>}{isLoading ? <p>Loading profile...</p> : <><form className="mechanic-profile-form" onSubmit={saveProfile}><div className="mechanic-form-fields"><label>First name<input required value={profile.firstName} onChange={(event) => updateField('firstName', event.target.value)} /></label><label>Last name<input required value={profile.lastName} onChange={(event) => updateField('lastName', event.target.value)} /></label></div><label>Email<input type="email" value={profile.email} readOnly /></label><label>Phone number<input required value={profile.phoneNumber || ''} onChange={(event) => updateField('phoneNumber', event.target.value)} /></label><div className="mechanic-form-fields"><label>Specialization<select value={profile.specialization} onChange={(event) => updateField('specialization', event.target.value)}><option value="general">General</option><option value="engine">Engine</option><option value="transmission">Transmission</option><option value="electrical">Electrical</option><option value="suspension">Suspension</option><option value="brakes">Brakes</option></select></label><label>Years of experience<input min="0" required type="number" value={profile.yearsOfExperience} onChange={(event) => updateField('yearsOfExperience', event.target.value)} /></label></div><label>Availability<select value={profile.availabilityStatus} onChange={(event) => updateField('availabilityStatus', event.target.value)}><option value="available">Available</option><option value="busy">Busy</option><option value="on-leave">On leave</option></select></label><label>Certifications<input value={Array.isArray(profile.certifications) ? profile.certifications.join(', ') : profile.certifications} onChange={(event) => updateField('certifications', event.target.value)} placeholder="Separate certifications with commas" /></label><label>Biography<textarea maxLength="500" value={profile.bio || ''} onChange={(event) => updateField('bio', event.target.value)} /></label><button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Profile'}</button></form><div className="mechanic-performance"><h2>Performance</h2><div><span>Total Repairs<strong>{profile.totalRepairs || 0}</strong></span><span>Average Rating<strong>{profile.averageRating || 0}</strong></span><span>Success Rate<strong>{profile.successRate || 0}%</strong></span></div></div></>}</MechanicPage>;
}

export { MechanicLogin, MechanicDashboard, Jobs, Profile };
