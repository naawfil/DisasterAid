import { useState } from 'react';
import { api } from '../api/client.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { CATEGORY_LABELS } from '../constants/enums.js';

const STAGES = ['PENDING', 'ASSIGNED', 'DISPATCHED', 'DELIVERED'];

const TrackRequest = () => {
  const [code, setCode] = useState('');
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [noteDraft, setNoteDraft] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [noteSent, setNoteSent] = useState(false);

  const [cancelling, setCancelling] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const lookup = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setRequest(null);
    setConfirmingCancel(false);
    setNoteSent(false);
    try {
      const data = await api.get(`/requests/track/${encodeURIComponent(code.trim())}`);
      setRequest(data.request);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendNote = async (event) => {
    event.preventDefault();
    if (!noteDraft.trim()) return;
    setNoteBusy(true);
    setNoteError('');
    try {
      const data = await api.post(`/requests/track/${encodeURIComponent(request.trackingCode)}/note`, {
        note: noteDraft.trim(),
      });
      setRequest(data.request);
      setNoteDraft('');
      setNoteSent(true);
    } catch (err) {
      setNoteError(err.message);
    } finally {
      setNoteBusy(false);
    }
  };

  const cancelRequest = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      const data = await api.patch(`/requests/track/${encodeURIComponent(request.trackingCode)}/cancel`, {});
      setRequest(data.request);
      setConfirmingCancel(false);
    } catch (err) {
      setCancelError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const reachedIndex = request ? STAGES.indexOf(request.status) : -1;
  const isClosed = request && ['DELIVERED', 'CANCELLED'].includes(request.status);

  return (
    <>
      <h1 className="display display-lg">Track your request</h1>
      <p className="lede">Enter the tracking code you were given when you submitted your request.</p>

      <form onSubmit={lookup} className="inline-form">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="DA-XXXXXX"
          className="mono-input"
          aria-label="Tracking code"
        />
        <button type="submit" className="btn btn-primary btn-inline" disabled={busy}>
          {busy ? 'Looking…' : 'Track'}
        </button>
      </form>

      {error && <p className="alert" role="alert">{error}</p>}

      {request && (
        <section className="panel">
          <div className="panel-head">
            <h2 className="mono">{request.trackingCode}</h2>
            <StatusBadge value={request.status} />
          </div>

          <ol className="progress-rail">
            {STAGES.map((stage, index) => (
              <li
                key={stage}
                className={
                  request.status === 'CANCELLED'
                    ? 'rail-cancelled'
                    : index <= reachedIndex
                      ? 'rail-done'
                      : ''
                }
              >
                <span className="rail-dot" aria-hidden="true" />
                <span className="rail-label">{stage.toLowerCase()}</span>
              </li>
            ))}
          </ol>

          <dl className="detail-list">
            <div>
              <dt>Requested</dt>
              <dd>{request.items.map((i) => `${i.note || CATEGORY_LABELS[i.category]} ×${i.quantity}`).join(', ')}</dd>
            </div>
            <div>
              <dt>Address given</dt>
              <dd>{request.address || 'Location pin only'}</dd>
            </div>
            <div>
              <dt>Submitted</dt>
              <dd>{new Date(request.createdAt).toLocaleString()}</dd>
            </div>
          </dl>

          <h3 className="sub-head">History</h3>
          <ul className="history">
            {request.statusHistory.map((entry, index) => (
              <li key={index}>
                <span className="mono">{new Date(entry.changedAt).toLocaleString()}</span>
                <strong>{entry.status.toLowerCase()}</strong>
                {entry.fromRequester && <span className="chip">You</span>}
                {entry.note && <span className="history-note">{entry.note}</span>}
              </li>
            ))}
          </ul>

          {!isClosed && (
            <section className="sub-panel">
              <h3 className="sub-head">Add an update</h3>
              <p className="muted">
                Tell the relief team something they should know — you moved, someone already helped you,
                or you still haven't heard back.
              </p>
              <form onSubmit={sendNote} className="inline-form">
                <input
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="e.g. We've relocated to a relative's house nearby"
                  aria-label="Update for the relief team"
                  maxLength={500}
                />
                <button type="submit" className="btn btn-primary btn-inline" disabled={noteBusy || !noteDraft.trim()}>
                  {noteBusy ? 'Sending…' : 'Send'}
                </button>
              </form>
              {noteError && <p className="alert" role="alert">{noteError}</p>}
              {noteSent && !noteError && <p className="location-ok">Update sent — it's attached to your request.</p>}

              <div className="row-controls">
                {!confirmingCancel ? (
                  <button type="button" className="btn btn-quiet" onClick={() => setConfirmingCancel(true)}>
                    Cancel this request
                  </button>
                ) : (
                  <>
                    <span className="muted">No longer need this aid?</span>
                    <button type="button" className="btn btn-quiet" onClick={cancelRequest} disabled={cancelling}>
                      {cancelling ? 'Cancelling…' : 'Yes, cancel it'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-quiet"
                      onClick={() => setConfirmingCancel(false)}
                      disabled={cancelling}
                    >
                      Keep it
                    </button>
                  </>
                )}
              </div>
              {cancelError && <p className="alert" role="alert">{cancelError}</p>}
            </section>
          )}
        </section>
      )}
    </>
  );
};

export default TrackRequest;
