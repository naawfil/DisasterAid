import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, del } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Empty from '../components/Empty.jsx';
import { REQUEST_STATUS, PRIORITIES, CATEGORY_LABELS, titleCase } from '../constants/enums.js';

/** Features 3 and 4 — the manager's queue and manual priority override. */
const Triage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);

    try {
      const data = await api.get(`/requests?${params.toString()}`);
      setRequests(data.requests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id, path, body) => {
    try {
      const data = await api.patch(`/requests/${id}/${path}`, body);
      setRequests((list) => list.map((r) => (r.id === id ? { ...r, ...data.request } : r)));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  // "Assigned" isn't a status you can just declare — it means a volunteer has
  // actually been given this request. Send the manager to Tasks to pick one,
  // instead of letting this dropdown fake an assignment with nobody behind it.
  const changeStatus = (request, nextStatus) => {
    if (nextStatus === 'ASSIGNED') {
      navigate(`/tasks?relatedRequest=${request.id}`);
      return;
    }
    patch(request.id, 'status', { status: nextStatus });
  };

  const removeRequest = async (request) => {
    const sure = window.confirm(
      `Delete request ${request.trackingCode} for ${request.requesterName}? This cannot be undone.`
    );
    if (!sure) return;

    setDeletingId(request.id);
    try {
      await del(`/requests/${request.id}`);
      setRequests((list) => list.filter((r) => r.id !== request.id));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <p className="slip-band">Request queue · {requests.length} shown</p>
      <h1 className="display display-lg">Requests</h1>
      <p className="lede">Sorted by priority, then by how long they have been waiting.</p>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="filter-bar">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {REQUEST_STATUS.map((s) => (
            <option key={s} value={s}>{titleCase(s)}</option>
          ))}
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{titleCase(p)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="loading">Loading requests…</p>
      ) : requests.length === 0 ? (
        <Empty>No requests match those filters.</Empty>
      ) : (
        <ul className="card-list">
          {requests.map((request) => (
            <li key={request.id} className={`request-card priority-${request.priority.toLowerCase()}`}>
              <div className="request-head">
                <div>
                  <h2 className="mono">{request.trackingCode}</h2>
                  <p>
                    {request.requesterName} · {request.contactPhone} · {request.householdSize} in household
                  </p>
                </div>
                <StatusBadge value={request.status} />
              </div>

              <p className="request-items">
                {request.items
                  .map((i) => `${i.note || CATEGORY_LABELS[i.category]} ×${i.quantity}`)
                  .join(' · ')}
              </p>

              {request.address && <p className="muted">{request.address}</p>}
              {request.notes && <p className="request-note">{request.notes}</p>}
              <p className="mono muted">
                {request.location?.coordinates
                  ? `${request.location.coordinates[1].toFixed(4)}, ${request.location.coordinates[0].toFixed(4)}`
                  : 'No pin'}
                {' · '}
                {new Date(request.createdAt).toLocaleString()}
              </p>

              <div className="row-controls">
                <label className="inline-select">
                  <span>Priority</span>
                  <select
                    value={request.priority}
                    onChange={(e) => patch(request.id, 'priority', { priority: e.target.value })}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{titleCase(p)}</option>
                    ))}
                  </select>
                </label>

                <label className="inline-select">
                  <span>Status</span>
                  <select
                    value={request.status}
                    onChange={(e) => changeStatus(request, e.target.value)}
                  >
                    {REQUEST_STATUS.map((s) => (
                      <option key={s} value={s}>
                        {s === 'ASSIGNED' ? 'Assigned (pick a volunteer…)' : titleCase(s)}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  className="btn btn-quiet btn-danger"
                  onClick={() => removeRequest(request)}
                  disabled={deletingId === request.id}
                >
                  {deletingId === request.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Triage;
