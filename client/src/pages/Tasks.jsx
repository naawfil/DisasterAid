import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, del } from '../api/client.js';
import Empty from '../components/Empty.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SKILL_LABELS, TASK_STATUS, titleCase } from '../constants/enums.js';

/** Feature 14 — the manual assignment panel. */
const Tasks = () => {
  const [searchParams] = useSearchParams();
  // Arriving from Requests with "Assigned" picked there — that page can't
  // actually assign anyone, so it sends the manager here to do it for real.
  const incomingRequestId = searchParams.get('relatedRequest') || '';

  const [tasks, setTasks] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    assignedTo: '',
    relatedRequest: incomingRequestId,
    checklist: '',
  });

  const load = useCallback(async () => {
    const [taskData, volunteerData, requestData] = await Promise.all([
      api.get('/volunteers/tasks'),
      api.get('/volunteers/assignable'),
      api.get('/requests?status=PENDING'),
    ]);
    setTasks(taskData.tasks);
    setVolunteers(volunteerData.volunteers);
    setRequests(requestData.requests);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [load]);

  // If the request handed off from the Requests page isn't actually pending
  // any more (already assigned, cancelled, etc.), don't silently submit a
  // task linked to it — clear the pre-fill so the dropdown reflects reality.
  useEffect(() => {
    if (!incomingRequestId || loading) return;
    if (!requests.some((r) => r.id === incomingRequestId)) {
      setForm((f) => (f.relatedRequest === incomingRequestId ? { ...f, relatedRequest: '' } : f));
    }
  }, [incomingRequestId, loading, requests]);

  const createTask = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/volunteers/tasks', {
        title: form.title,
        description: form.description,
        assignedTo: form.assignedTo || undefined,
        relatedRequest: form.relatedRequest || undefined,
        checklist: form.checklist
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((label) => ({ label })),
      });
      setForm({ title: '', description: '', assignedTo: '', relatedRequest: '', checklist: '' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const assign = async (taskId, volunteerId) => {
    if (!volunteerId) return;
    try {
      await api.patch(`/volunteers/tasks/${taskId}/assign`, { assignedTo: volunteerId });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const removeTask = async (task) => {
    const sure = window.confirm(`Delete task "${task.title}"? This cannot be undone.`);
    if (!sure) return;

    setDeletingId(task.id);
    try {
      await del(`/volunteers/tasks/${task.id}`);
      setTasks((list) => list.filter((t) => t.id !== task.id));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <p className="loading">Loading tasks…</p>;

  const incomingRequest = incomingRequestId ? requests.find((r) => r.id === incomingRequestId) : null;

  return (
    <>
      <p className="slip-band">Field operations · {volunteers.length} volunteer(s) on shift</p>
      <h1 className="display display-lg">Tasks</h1>
      <p className="lede">Only volunteers who are active and on shift appear in the dropdown.</p>

      {error && <p className="alert" role="alert">{error}</p>}

      {incomingRequestId && (
        <p className="info-banner" role="status">
          {incomingRequest
            ? `Pick a volunteer below to assign request ${incomingRequest.trackingCode}.`
            : "That request is no longer pending, so it can't be linked here — pick a different one below if you still need to create a task."}
        </p>
      )}

      <form onSubmit={createTask} className="panel stack">
        <h2 className="sub-head">New task</h2>
        <div className="grid-2">
          <label className="field">
            <span>Title</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label className="field">
            <span>Assign to</span>
            <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Leave unassigned</option>
              {volunteers.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.activeTaskCount} active
                  {v.skills.length ? ` (${v.skills.map((s) => SKILL_LABELS[s]).join(', ')})` : ''}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Linked request</span>
          <select value={form.relatedRequest} onChange={(e) => setForm({ ...form, relatedRequest: e.target.value })}>
            <option value="">Not linked to a request</option>
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.trackingCode} — {r.address || r.requesterName}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Description</span>
          <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>

        <label className="field">
          <span>Checklist — one line per step</span>
          <textarea
            rows="3"
            value={form.checklist}
            onChange={(e) => setForm({ ...form, checklist: e.target.value })}
            placeholder={'Collect supplies from depot\nConfirm address with family\nGet signature on delivery'}
          />
        </label>

        <button type="submit" className="btn btn-primary">Create task</button>
      </form>

      {tasks.length === 0 ? (
        <Empty>No tasks yet.</Empty>
      ) : (
        <ul className="card-list">
          {tasks.map((task) => (
            <li key={task.id} className="panel">
              <div className="panel-head">
                <h2>{task.title}</h2>
                <StatusBadge value={task.status} kind="task" />
              </div>
              {task.description && <p>{task.description}</p>}
              {task.relatedRequest && (
                <p className="mono muted">
                  Request {task.relatedRequest.trackingCode}
                  {task.relatedRequest.address && ` · ${task.relatedRequest.address}`}
                </p>
              )}
              {task.checklist.length > 0 && (
                <p className="muted">
                  {task.checklist.filter((c) => c.done).length} of {task.checklist.length} steps done
                </p>
              )}

              <label className="inline-select">
                <span>Assigned to</span>
                <select
                  value={task.assignedTo?._id || task.assignedTo?.id || ''}
                  onChange={(e) => assign(task.id, e.target.value)}
                  disabled={task.status === 'COMPLETED' || task.status === 'CANCELLED'}
                  title={
                    task.status === 'COMPLETED' || task.status === 'CANCELLED'
                      ? `Already ${task.status.toLowerCase()} — can't be reassigned`
                      : undefined
                  }
                >
                  <option value="">Unassigned</option>
                  {volunteers.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </label>
              <span className="muted mono"> {titleCase(task.status)} · {task.progress}%</span>

              <button
                type="button"
                className="btn btn-quiet btn-danger"
                onClick={() => removeTask(task)}
                disabled={deletingId === task.id}
              >
                {deletingId === task.id ? 'Deleting…' : 'Delete'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Tasks;
