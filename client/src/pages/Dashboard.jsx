import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../constants/roles.js';
import { SKILL_LABELS, VOLUNTEER_SKILLS } from '../constants/enums.js';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const managing = hasRole(ROLES.ADMIN, ROLES.RELIEF_MANAGER);
  const isVolunteer = hasRole(ROLES.VOLUNTEER, ROLES.RELIEF_MANAGER, ROLES.ADMIN);
  // Shelter Manager doesn't get the full admin/summary view (that endpoint stays
  // Admin/Relief-Manager only) — it gets its own lightweight shelter snapshot below.
  const isShelterManager = hasRole(ROLES.SHELTER_MANAGER);

  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [shelterSnapshot, setShelterSnapshot] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (managing) {
      api.get('/admin/summary').then(setSummary).catch((err) => setError(err.message));
    }
    if (isVolunteer) {
      api.get('/volunteers/me').then((data) => setProfile(data.profile)).catch(() => {});
    }
    if (isShelterManager && !managing) {
      api
        .get('/shelters')
        .then((data) => setShelterSnapshot(data.shelters))
        .catch((err) => setError(err.message));
    }
    api.get('/comms/announcements').then((data) => setNotices(data.announcements.slice(0, 3))).catch(() => {});
  }, [managing, isVolunteer, isShelterManager]);

  const toggleAvailability = async () => {
    const data = await api.patch('/volunteers/me/availability', { isAvailable: !profile.isAvailable });
    setProfile((prev) => ({ ...prev, ...data.profile }));
  };

  const toggleSkill = async (skill) => {
    const next = profile.skills.includes(skill)
      ? profile.skills.filter((s) => s !== skill)
      : [...profile.skills, skill];
    const data = await api.patch('/volunteers/me', { skills: next });
    setProfile((prev) => ({ ...prev, ...data.profile }));
  };

  return (
    <>
      <p className="slip-band">Session active · {ROLE_LABELS[user.role]}</p>
      <h1 className="display display-lg">Welcome, {user.name.split(' ')[0]}</h1>

      {error && <p className="alert" role="alert">{error}</p>}

      {/* Public accounts get the things a person affected by the disaster
          actually needs, not an empty operations dashboard. */}
      {!managing && !isVolunteer && !isShelterManager && (
        <>
          <p className="lede">
            You can ask for aid, follow a request you already made, find a shelter with space, or check
            whether someone you are looking for is safe.
          </p>

          <ul className="roadmap">
            <li>
              <span className="marker">Aid</span>
              <div>
                <h2>Request aid</h2>
                <p>Tell us what your household needs and share your location.</p>
                <Link className="btn btn-quiet" to="/request">Start a request</Link>
              </div>
            </li>
            <li>
              <span className="marker">Track</span>
              <div>
                <h2>Track a request</h2>
                <p>Use your tracking code to see whether a team has been assigned.</p>
                <Link className="btn btn-quiet" to="/track">Track a request</Link>
              </div>
            </li>
            <li>
              <span className="marker">Shelter</span>
              <div>
                <h2>Find a shelter</h2>
                <p>Live capacity and facilities for every open shelter.</p>
                <Link className="btn btn-quiet" to="/shelters">See shelters</Link>
              </div>
            </li>
            <li>
              <span className="marker">People</span>
              <div>
                <h2>Find someone</h2>
                <p>Search the safety registry for family who reached a shelter.</p>
                <Link className="btn btn-quiet" to="/find-people">Search the registry</Link>
              </div>
            </li>
          </ul>
        </>
      )}

      {managing && summary && (
        <>
          <ul className="stat-grid">
            <li>
              <span className="stat-value">{summary.requests.PENDING || 0}</span>
              <span className="stat-label">Requests waiting</span>
            </li>
            <li>
              <span className="stat-value">{summary.requests.DISPATCHED || 0}</span>
              <span className="stat-label">On the way</span>
            </li>
            <li>
              <span className="stat-value">
                {summary.occupancy.occupied}/{summary.occupancy.capacity}
              </span>
              <span className="stat-label">Shelter places used</span>
            </li>
            <li className={summary.inventory.lowStockCount > 0 ? 'stat-flagged' : ''}>
              <span className="stat-value">{summary.inventory.lowStockCount}</span>
              <span className="stat-label">Items low on stock</span>
            </li>
            <li>
              <span className="stat-value">{summary.openTasks}</span>
              <span className="stat-label">Open tasks</span>
            </li>
            <li>
              <span className="stat-value">{summary.availableVolunteers}</span>
              <span className="stat-label">Volunteers on shift</span>
            </li>
          </ul>

          <div className="row-controls">
            <Link className="btn btn-quiet" to="/triage">Go to request queue</Link>
            <Link className="btn btn-quiet" to="/dispatch">Create a dispatch</Link>
            <Link className="btn btn-quiet" to="/alerts">Send an alert</Link>
          </div>
        </>
      )}

      {isShelterManager && !managing && shelterSnapshot && (
        <>
          <p className="lede">Log arrivals and departures, and keep the safety registry current.</p>

          <ul className="stat-grid">
            <li>
              <span className="stat-value">{shelterSnapshot.length}</span>
              <span className="stat-label">Shelters you can operate</span>
            </li>
            <li>
              <span className="stat-value">
                {shelterSnapshot.reduce((sum, s) => sum + s.currentHeadcount, 0)}/
                {shelterSnapshot.reduce((sum, s) => sum + s.maxCapacity, 0)}
              </span>
              <span className="stat-label">Total places used</span>
            </li>
            <li>
              <span className="stat-value">{shelterSnapshot.filter((s) => s.remainingSpots === 0).length}</span>
              <span className="stat-label">Shelters full</span>
            </li>
          </ul>

          <div className="row-controls">
            <Link className="btn btn-quiet" to="/shelters-admin">Log arrivals &amp; departures</Link>
            <Link className="btn btn-quiet" to="/find-people">Search the safety registry</Link>
          </div>
        </>
      )}

      {profile && (
        <section className="panel">
          <div className="panel-head">
            <h2 className="sub-head">Your field profile</h2>
            <button
              type="button"
              className={`shift-toggle ${profile.isAvailable ? 'shift-on' : ''}`}
              onClick={toggleAvailability}
              aria-pressed={profile.isAvailable}
            >
              {profile.isAvailable ? 'On shift' : 'Off shift'}
            </button>
          </div>
          <p className="muted">
            {profile.activeTaskCount} active · {profile.completedTaskCount} completed. Off shift means you
            will not appear in the assignment list.
          </p>

          <div className="filter-bar">
            {VOLUNTEER_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                className={`filter-tag ${profile.skills.includes(skill) ? 'filter-on' : ''}`}
                onClick={() => toggleSkill(skill)}
                aria-pressed={profile.skills.includes(skill)}
              >
                {SKILL_LABELS[skill]}
              </button>
            ))}
          </div>
        </section>
      )}

      {notices.length > 0 && (
        <>
          <h2 className="sub-head">Latest notices</h2>
          <ul className="card-list">
            {notices.map((notice) => (
              <li key={notice.id} className={`notice notice-${notice.severity.toLowerCase()}`}>
                <h2>{notice.title}</h2>
                <p>{notice.body}</p>
                <p className="muted mono">{new Date(notice.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
};

export default Dashboard;
