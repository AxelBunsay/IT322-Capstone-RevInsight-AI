import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MechanicLayout from './MechanicLayout';
import { JobDialog, JobTable } from './MechanicJobTable';
import { getJobActions, getMechanicJobs, getMechanicProfile, isDemoMechanic, performJobAction, updateMechanicAvailability } from './mechanicService';

const queueGroups = [
  { label: 'To inspect / accept', statuses: ['awaiting-response', 'confirmed', 'inspection', 'accepted'] },
  { label: 'Waiting approval', statuses: ['waiting-approval'] },
  { label: 'Waiting parts', statuses: ['waiting-parts', 'waiting-for-parts'] },
  { label: 'For quality check', statuses: ['quality-check'] },
  { label: 'Ready for release', statuses: ['ready-for-release'] }
];

export default function MechanicDashboard() {
  const [profile, setProfile] = useState({});
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [profileResult, jobsResult] = await Promise.all([getMechanicProfile(), getMechanicJobs()]);
    setProfile(profileResult.mechanic || {});
    setJobs(jobsResult.jobs || []);
  };

  useEffect(() => {
    let active = true;
    Promise.all([getMechanicProfile(), getMechanicJobs()])
      .then(([profileResult, jobsResult]) => {
        if (!active) return;
        setProfile(profileResult.mechanic || {});
        setJobs(jobsResult.jobs || []);
      })
      .catch((loadError) => { if (active) setError(loadError.message || 'Dashboard could not be loaded.'); });
    return () => { active = false; };
  }, []);

  const changeAvailability = async (availabilityStatus) => {
    setError('');
    try {
      const result = await updateMechanicAvailability(availabilityStatus, profile);
      setProfile(result.mechanic || { ...profile, availabilityStatus });
    } catch (updateError) { setError(updateError.message || 'Availability could not be updated.'); }
  };

  const runAction = async (job, action) => {
    setBusy(true);
    setError('');
    try { await performJobAction(job, action); await load(); setSelectedJob(null); }
    catch (actionError) { setError(actionError.message || 'Job could not be updated.'); }
    finally { setBusy(false); }
  };

  const pending = jobs.filter((job) => ['awaiting-response', 'confirmed'].includes(job.status)).length;
  const inProgress = jobs.filter((job) => job.status === 'in-progress').length;
  const completed = jobs.filter((job) => job.status === 'completed').length;
  const overdue = jobs.filter((job) => job.overdue && job.status !== 'completed').length;
  const activeJobs = jobs.filter((job) => !['completed', 'declined'].includes(job.status)).slice(0, 6);

  return <MechanicLayout title="Mechanic Dashboard">
    {error && <p className="mechanic-alert" role="alert">{error}</p>}
    <div className="mechanic-dashboard-grid">
      <section className="mechanic-panel workload-panel"><div className="mechanic-panel-heading"><h2>Today’s workload</h2></div><div className="mechanic-workload-stats"><div><strong>{pending}</strong><span>Pending</span></div><div><strong>{inProgress}</strong><span>In progress</span></div><div><strong>{completed}</strong><span>Completed</span></div></div></section>
      <section className="mechanic-panel availability-panel"><div className="mechanic-panel-heading"><h2>Availability</h2></div><label className="visually-hidden" htmlFor="mechanic-availability">Availability status</label><select id="mechanic-availability" value={profile.availabilityStatus || 'available'} onChange={(event) => changeAvailability(event.target.value)}><option value="available">Available</option><option value="busy">Busy</option><option value="on-leave">On leave</option></select><p>Specialization: {profile.specialization || 'General service'} · {activeJobs.length} active jobs</p></section>
    </div>
    <section className="mechanic-panel queue-panel"><div className="mechanic-panel-heading"><h2>My queue</h2></div><div className="mechanic-queue-grid">{queueGroups.map((group) => <div className="mechanic-queue-tile" key={group.label}><strong>{jobs.filter((job) => group.statuses.includes(job.status)).length}</strong><span>{group.label}</span></div>)}<div className="mechanic-queue-tile overdue-tile"><strong>{overdue}</strong><span>Overdue</span></div></div></section>
    <section className="mechanic-panel active-jobs-panel"><div className="mechanic-panel-heading"><h2>My active jobs</h2><Link to="/mechanic/jobs">All jobs <span aria-hidden="true">→</span></Link></div><JobTable jobs={activeJobs} onSelect={setSelectedJob} /></section>
    {isDemoMechanic() && <p className="mechanic-sample-note">Prototype view · sample data only</p>}
    <JobDialog job={selectedJob} onClose={() => setSelectedJob(null)} actions={selectedJob ? getJobActions(selectedJob) : []} onAction={runAction} busy={busy} />
  </MechanicLayout>;
}