import { useCallback, useEffect, useState } from 'react';
import { api, del } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Empty from '../components/Empty.jsx';
import { ROLES } from '../constants/roles.js';
import { SEVERITIES, titleCase } from '../constants/enums.js';

/** Feature 18 — public read, manager write. */
const Noticeboard = () => {
  const { user, hasRole } = useAuth();
  const canPost = hasRole(ROLES.ADMIN, ROLES.RELIEF_MANAGER);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', body: '', severity: 'INFO', area: '', isPinned: false });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/comms/announcements');
      setAnnouncements(data.announcements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const publish = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/comms/announcements', form);
      setForm({ title: '', body: '', severity: 'INFO', area: '', isPinned: false });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await del(`/comms/announcements/${id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <p className="slip-band">Official notices</p>
      <h1 className="display display-lg">Noticeboard</h1>
      <p className="lede">Verified updates from the relief coordination team.</p>

      {error && <p className="alert" role="alert">{error}</p>}

      {canPost && (
        <form onSubmit={publish} className="panel stack">
          <h2 className="sub-head">Post a notice</h2>
          <label className="field">
            <span>Headline</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="field">
            <span>Notice</span>
            <textarea
              rows="3"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              required
            />
          </label>
          <div className="grid-2">
            <label className="field">
              <span>Severity</span>
              <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Area</span>
              <input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            </label>
          </div>
          <label className="choice">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
            />
            <span>Pin to the top</span>
          </label>
          <button type="submit" className="btn btn-primary">Publish</button>
        </form>
      )}

      {loading ? (
        <p className="loading">Loading notices…</p>
      ) : announcements.length === 0 ? (
        <Empty>Nothing has been posted yet.</Empty>
      ) : (
        <ul className="card-list">
          {announcements.map((notice) => (
            <li key={notice.id} className={`notice notice-${notice.severity.toLowerCase()}`}>
              <div className="notice-head">
                <h2>{notice.title}</h2>
                <span className="badge badge-severity">{titleCase(notice.severity)}</span>
              </div>
              <p>{notice.body}</p>
              <p className="muted mono">
                {notice.area && `${notice.area} · `}
                {new Date(notice.createdAt).toLocaleString()}
                {notice.publishedBy?.name && ` · ${notice.publishedBy.name}`}
              </p>
              {user?.role === ROLES.ADMIN && (
                <button type="button" className="btn btn-quiet" onClick={() => remove(notice.id)}>
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Noticeboard;
