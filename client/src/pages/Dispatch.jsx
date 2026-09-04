import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Empty from '../components/Empty.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { DISPATCH_STATUS, titleCase } from '../constants/enums.js';

/** Features 12 and 19 — build a dispatch order and attach route notes. */
const Dispatch = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stock, setStock] = useState([]);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    warehouse: '',
    destinationType: 'SHELTER',
    destinationShelter: '',
    destinationRequest: '',
    routeNotes: '',
    lines: [{ inventoryItem: '', quantity: 1 }],
  });

  // Feature 19 — route notes can also be added or changed after the order
  // already exists, not just at creation time.
  const [editingNotesId, setEditingNotesId] = useState(null);
  const [noteDraft, setNoteDraft] = useState('');

  // A confirm-before-submit step (feature 12): the manager sees exactly what's
  // about to be dispatched before it hits the atomic decrement, instead of
  // finding out only after the order's already created.
  const [confirming, setConfirming] = useState(false);

  const loadOrders = useCallback(async () => {
    const data = await api.get('/inventory/dispatches');
    setOrders(data.orders);
  }, []);

  useEffect(() => {
    const boot = async () => {
      const [wh, sh, rq] = await Promise.all([
        api.get('/inventory/warehouses'),
        api.get('/shelters'),
        api.get('/requests?status=PENDING'),
      ]);
      setWarehouses(wh.warehouses);
      setShelters(sh.shelters);
      setRequests(rq.requests);
      if (wh.warehouses.length) setForm((f) => ({ ...f, warehouse: wh.warehouses[0].id }));
      await loadOrders();
      setLoading(false);
    };
    boot().catch((err) => {
      setError(err.message);
      setLoading(false);
    });
  }, [loadOrders]);

  useEffect(() => {
    if (!form.warehouse) return;
    api.get(`/inventory/stock?warehouse=${form.warehouse}`).then((data) => setStock(data.items));
  }, [form.warehouse]);

  const updateLine = (index, field, value) =>
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    }));

  const stockFor = (itemId) => stock.find((i) => i.id === itemId);

  const activeLines = form.lines.filter((l) => l.inventoryItem && Number(l.quantity) > 0);

  const destinationLabel = () => {
    if (form.destinationType === 'SHELTER') {
      const shelter = shelters.find((s) => s.id === form.destinationShelter);
      return shelter ? shelter.name : 'the selected shelter';
    }
    const request = requests.find((r) => r.id === form.destinationRequest);
    return request ? `request ${request.trackingCode}` : 'the selected request';
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    // First click reviews the order; the same button becomes "Confirm &
    // create dispatch" and only then does the actual request go out.
    if (!confirming) {
      if (activeLines.length === 0) {
        setError('Add at least one item to dispatch');
        return;
      }
      setConfirming(true);
      return;
    }

    try {
      await api.post('/inventory/dispatches', {
        warehouse: form.warehouse,
        destinationType: form.destinationType,
        destinationShelter: form.destinationType === 'SHELTER' ? form.destinationShelter : undefined,
        destinationRequest: form.destinationType === 'REQUEST' ? form.destinationRequest : undefined,
        routeNotes: form.routeNotes,
        items: form.lines
          .filter((l) => l.inventoryItem)
          .map((l) => ({ inventoryItem: l.inventoryItem, quantity: Number(l.quantity) })),
      });

      setForm((f) => ({ ...f, routeNotes: '', lines: [{ inventoryItem: '', quantity: 1 }] }));
      setConfirming(false);
      await loadOrders();
      const refreshed = await api.get(`/inventory/stock?warehouse=${form.warehouse}`);
      setStock(refreshed.items);
    } catch (err) {
      setError(err.message);
      setConfirming(false);
    }
  };

  const setStatus = async (id, status) => {
    try {
      await api.patch(`/inventory/dispatches/${id}/status`, { status });
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditNotes = (order) => {
    setEditingNotesId(order.id);
    setNoteDraft(order.routeNotes || '');
  };

  const cancelEditNotes = () => {
    setEditingNotesId(null);
    setNoteDraft('');
  };

  const saveNotes = async (id) => {
    try {
      await api.patch(`/inventory/dispatches/${id}/route-notes`, { routeNotes: noteDraft });
      setEditingNotesId(null);
      setNoteDraft('');
      await loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="loading">Loading dispatch…</p>;

  return (
    <>
      <h1 className="display display-lg">Dispatch orders</h1>

      {error && <p className="alert" role="alert">{error}</p>}

      <form onSubmit={submit} className="panel stack">
        <div className="grid-2">
          <label className="field">
            <span>From warehouse</span>
            <select
              value={form.warehouse}
              onChange={(e) => setForm({ ...form, warehouse: e.target.value })}
              disabled={confirming}
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Send to</span>
            <select
              value={form.destinationType}
              onChange={(e) => setForm({ ...form, destinationType: e.target.value })}
              disabled={confirming}
            >
              <option value="SHELTER">A shelter</option>
              <option value="REQUEST">An aid request</option>
            </select>
          </label>
        </div>

        {form.destinationType === 'SHELTER' ? (
          <label className="field">
            <span>Shelter</span>
            <select
              value={form.destinationShelter}
              onChange={(e) => setForm({ ...form, destinationShelter: e.target.value })}
              disabled={confirming}
              required
            >
              <option value="">Choose a shelter</option>
              {shelters.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span>Request</span>
            <select
              value={form.destinationRequest}
              onChange={(e) => setForm({ ...form, destinationRequest: e.target.value })}
              disabled={confirming}
              required
            >
              <option value="">Choose a request</option>
              {requests.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.trackingCode} — {r.requesterName} ({r.priority.toLowerCase()})
                </option>
              ))}
            </select>
          </label>
        )}

        {form.lines.map((line, index) => {
          const available = stockFor(line.inventoryItem);
          return (
            <div key={index} className="grid-2">
              <label className="field">
                <span>Item</span>
                <select
                  value={line.inventoryItem}
                  onChange={(e) => updateLine(index, 'inventoryItem', e.target.value)}
                  disabled={confirming}
                >
                  <option value="">Choose an item</option>
                  {stock.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.quantity} {item.unit} available
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Quantity</span>
                <input
                  type="number"
                  min="1"
                  max={available?.quantity}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                  disabled={confirming}
                />
                {/* Feature 12 — the manager sees what's actually left before
                    typing a quantity, instead of guessing or checking the
                    Inventory page separately. */}
                {available && (
                  <span className="muted mono">{available.quantity} {available.unit} available</span>
                )}
              </label>
            </div>
          );
        })}

        <label className="field">
          <span>Route notes for the driver</span>
          <textarea
            rows="2"
            value={form.routeNotes}
            onChange={(e) => setForm({ ...form, routeNotes: e.target.value })}
            placeholder="Bridge on Highway 4 is washed out — use the northern dirt road"
            disabled={confirming}
          />
        </label>

        {confirming ? (
          <div className="panel stack">
            <h2 className="sub-head">Confirm before dispatching</h2>
            <p>
              Dispatching {activeLines.length} item{activeLines.length === 1 ? '' : 's'} to {destinationLabel()}:
            </p>
            <ul className="plain-list">
              {activeLines.map((line) => (
                <li key={line.inventoryItem}>
                  {stockFor(line.inventoryItem)?.name || 'Item'} × {line.quantity}
                </li>
              ))}
            </ul>
            <div className="row-controls">
              <button type="button" className="btn btn-quiet" onClick={() => setConfirming(false)}>
                Edit
              </button>
              <button type="submit" className="btn btn-primary btn-inline">Confirm &amp; create dispatch</button>
            </div>
          </div>
        ) : (
          <div className="row-controls">
            <button
              type="button"
              className="btn btn-quiet"
              onClick={() => setForm((f) => ({ ...f, lines: [...f.lines, { inventoryItem: '', quantity: 1 }] }))}
            >
              Add another item
            </button>
            <button type="submit" className="btn btn-primary btn-inline">Create dispatch</button>
          </div>
        )}
      </form>

      {orders.length === 0 ? (
        <Empty>No dispatch orders yet.</Empty>
      ) : (
        <ul className="card-list">
          {orders.map((order) => (
            <li key={order.id} className="panel">
              <div className="panel-head">
                <h2 className="mono">{order.reference}</h2>
                <StatusBadge value={order.status} />
              </div>
              <p>
                {order.destinationShelter?.name ||
                  (order.destinationRequest ? `Request ${order.destinationRequest.trackingCode}` : 'No destination')}
                {' · '}
                {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
              </p>
              {editingNotesId === order.id ? (
                <div className="stack">
                  <textarea
                    rows="2"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Bridge on Highway 4 is washed out — use the northern dirt road"
                  />
                  <div className="row-controls">
                    <button type="button" className="btn btn-quiet" onClick={cancelEditNotes}>Cancel</button>
                    <button type="button" className="btn btn-primary btn-inline" onClick={() => saveNotes(order.id)}>
                      Save notes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {order.routeNotes && <p className="route-note">⚠ {order.routeNotes}</p>}
                  <button type="button" className="btn btn-quiet btn-inline" onClick={() => startEditNotes(order)}>
                    {order.routeNotes ? 'Edit route notes' : 'Add route notes'}
                  </button>
                </>
              )}
              <p className="muted mono">
                {order.warehouse?.name} · {new Date(order.createdAt).toLocaleString()}
              </p>

              <label className="inline-select">
                <span>Status</span>
                <select value={order.status} onChange={(e) => setStatus(order.id, e.target.value)}>
                  {DISPATCH_STATUS.map((s) => (
                    <option key={s} value={s}>{titleCase(s)}</option>
                  ))}
                </select>
              </label>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Dispatch;
