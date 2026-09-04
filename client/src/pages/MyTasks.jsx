import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Empty from '../components/Empty.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

/** Feature 15 — the volunteer's field view, meant for a phone. */
const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try {
      // "My tasks" always means this account's own work, even for a manager
      // or admin who also holds a volunteer profile — without this flag the
      // server only self-scopes plain volunteers, so an admin here would see
      // every task in the system instead of just their own.
      const data = await api.get('/volunteers/tasks?mine=true');
      setTasks(data.tasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStep = async (taskId, index, done) => {
    try {
      const data = await api.patch(`/volunteers/tasks/${taskId}/checklist/${index}`, { done });
      setTasks((list) => list.map((t) => (t.id === taskId ? data.task : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  const setStatus = async (taskId, status) => {
    try {
      const data = await api.patch(`/volunteers/tasks/${taskId}/status`, { status });
      setTasks((list) => list.map((t) => (t.id === taskId ? data.task : t)));
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="loading">Loading your tasks…</p>;
  const open = tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const done = tasks.filter((t) => t.status === 'COMPLETED');

  return (
    <>
      <h1 className="display display-lg">My tasks</h1>

      {error && <p className="alert" role="alert">{error}</p>}

      {open.length === 0 ? (
        <Empty>Nothing assigned to you right now.</Empty>
      ) : (
        <ul className="card-list">
          {open.map((task) => (
            <li key={task.id} className="task-card">
              <div className="panel-head">
                <h2>{task.title}</h2>
                <StatusBadge value={task.status} kind="task" />
              </div>

              {task.description && <p>{task.description}</p>}
              {task.relatedRequest?.address && <p className="muted">{task.relatedRequest.address}</p>}
              {task.relatedRequest?.trackingCode && (
                <p className="mono muted">Request {task.relatedRequest.trackingCode}</p>
              )}

              {task.checklist.length > 0 && (
                <ul className="checklist">
                  {task.checklist.map((step, index) => (
                    <li key={index}>
                      <label className={step.done ? 'step-done' : ''}>
                        <input
                          type="checkbox"
                          checked={step.done}
                          onChange={(e) => toggleStep(task.id, index, e.target.checked)}
                        />
                        <span>{step.label}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}

              <div className="row-controls">
                {task.status !== 'IN_PROGRESS' && (
                  <button type="button" className="btn btn-quiet" onClick={() => setStatus(task.id, 'IN_PROGRESS')}>
                    Start
                  </button>
                )}
                <button type="button" className="btn btn-primary btn-inline" onClick={() => setStatus(task.id, 'COMPLETED')}>
                  Mark complete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {done.length > 0 && (
        <>
          <h2 className="sub-head">Completed</h2>
          <ul className="plain-list">
            {done.map((task) => (
              <li key={task.id}>
                <strong>{task.title}</strong>
                <span className="muted mono">
                  {task.completedAt ? ` — ${new Date(task.completedAt).toLocaleString()}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
};
export default MyTasks;
