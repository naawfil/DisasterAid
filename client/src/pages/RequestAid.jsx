import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { CATEGORY_LABELS } from '../constants/enums.js';

const RequestAid = () => {
  const [form, setForm] = useState({ requesterName: '', contactPhone: '', householdSize: 1, address: '', notes: '' });
  const [catalog, setCatalog] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [selection, setSelection] = useState({});
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  // Feature: only let a requester pick what is genuinely in stock somewhere
  // right now, rather than a fixed guess-list of categories.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const data = await api.get('/inventory/catalog', { auth: false });
        if (!cancelled) setCatalog(data.items);
      } catch {
        if (!cancelled) setCatalogError('Could not load what is currently in stock. Reload the page to try again.');
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const catalogByKey = Object.fromEntries(catalog.map((item) => [`${item.category}::${item.name}`, item]));

  const catalogByCategory = catalog.reduce((acc, item) => {
    (acc[item.category] = acc[item.category] || []).push(item);
    return acc;
  }, {});

  const toggleItem = (key) => () =>
    setSelection((prev) => ({
      ...prev,
      [key]: { checked: !prev[key]?.checked, quantity: prev[key]?.quantity || 1 },
    }));

  const setItemQuantity = (key) => (event) =>
    setSelection((prev) => ({
      ...prev,
      [key]: { checked: true, quantity: Number(event.target.value) },
    }));

  /** Feature 2 — browser geolocation, with a manual fallback if it is refused. */
  const captureLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('This browser cannot share your location. Type your address instead.');
      return;
    }

    setLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        });
        setLocating(false);
      },
      (geoError) => {
        setLocating(false);
        setLocationError(
          geoError.code === geoError.PERMISSION_DENIED
            ? 'Location permission was refused. Type your address below and we will find you.'
            : 'Could not get a location fix. Type your address below.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const selected = Object.entries(selection).filter(([, v]) => v.checked);

    if (!selected.length) {
      setError('Select at least one item from the list.');
      return;
    }

    const overStock = selected.find(([key, v]) => {
      const item = catalogByKey[key];
      return item && v.quantity > item.quantity;
    });
    if (overStock) {
      const item = catalogByKey[overStock[0]];
      setError(`Only ${item.quantity} ${item.unit} of ${item.name} is in stock — lower the amount before sending.`);
      return;
    }

    const items = selected.map(([key, v]) => {
      const item = catalogByKey[key];
      return { category: item.category, quantity: v.quantity, note: item.name };
    });

    if (!coords && !form.address.trim()) {
      setError('Share your location or type your address below so we can find you.');
      return;
    }

    setBusy(true);
    try {
      const data = await api.post(
        '/requests',
        { ...form, householdSize: Number(form.householdSize), items, ...coords },
        { auth: false }
      );
      setSubmitted(data.request);
    } catch (err) {
      setError(err.message);
      setFieldErrors(Object.fromEntries((err.details || []).map((d) => [d.field, d.message])));
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <>
        <p className="slip-band">Request received</p>
        <h1 className="display display-lg">Help is being arranged</h1>
        <div className="tracking-callout">
          <span>Your tracking code</span>
          <strong>{submitted.trackingCode}</strong>
          <p>
            Write this down or screenshot it. Use it on the Track page to see when a team has been assigned
            and dispatched.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="slip-band">Aid request · anyone can submit</p>
      <h1 className="display display-lg">Request aid</h1>
      <p className="lede">
        Tell us what you need and where you are. You do not need an account. Everything on this page is
        read by relief managers within minutes.
      </p>

      <form onSubmit={handleSubmit} className="stack" noValidate>
        {error && <p className="alert" role="alert">{error}</p>}

        <div className="grid-2">
          <label className="field">
            <span>Your name</span>
            <input value={form.requesterName} onChange={update('requesterName')} required />
            {fieldErrors.requesterName && <em className="field-error">{fieldErrors.requesterName}</em>}
          </label>

          <label className="field">
            <span>Phone number</span>
            <input value={form.contactPhone} onChange={update('contactPhone')} placeholder="01XXXXXXXXX" required />
            {fieldErrors.contactPhone && <em className="field-error">{fieldErrors.contactPhone}</em>}
          </label>
        </div>

        <fieldset className="field">
          <legend>What do you need?</legend>
          <p className="hint">Select from the products below.</p>

          {catalogLoading ? (
            <p className="loading">Loading the product list…</p>
          ) : catalogError ? (
            <p className="alert" role="alert">{catalogError}</p>
          ) : catalog.length === 0 ? (
            <p className="muted">Nothing is available right now — please contact a relief team directly.</p>
          ) : (
            Object.entries(catalogByCategory).map(([category, items]) => (
              <div key={category} className="need-category">
                <h3 className="need-category-title">{CATEGORY_LABELS[category] || category}</h3>
                <div className="need-grid">
                  {items.map((item) => {
                    const key = `${item.category}::${item.name}`;
                    const sel = selection[key];
                    const tooMany = sel?.checked && sel.quantity > item.quantity;
                    return (
                      <div key={key} className={`need ${sel?.checked ? 'need-on' : ''}`}>
                        <label className="need-check">
                          <input type="checkbox" checked={!!sel?.checked} onChange={toggleItem(key)} />
                          <span>{item.name}</span>
                        </label>
                        {sel?.checked && (
                          <label className="need-qty">
                            <span>How many</span>
                            <input
                              type="number"
                              min="1"
                              value={sel.quantity}
                              onChange={setItemQuantity(key)}
                            />
                          </label>
                        )}
                        {tooMany && (
                          <em className="field-error">
                            Only {item.quantity} {item.unit} of {item.name} is in stock.
                          </em>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </fieldset>

        <div className="field">
          <span className="field-label">Your location</span>
          {coords ? (
            <p className="location-ok mono">
              Pinned at {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)} (±{coords.accuracy}m)
            </p>
          ) : (
            <>
              <button type="button" className="btn btn-quiet" onClick={captureLocation} disabled={locating}>
                {locating ? 'Finding you…' : 'Use my current location'}
              </button>
              <p className="hint">Can't share your location? Type your address below instead — either one works.</p>
            </>
          )}
          {locationError && <em className="field-error">{locationError}</em>}
        </div>

        <div className="grid-2">
          <label className="field">
            <span>Address or landmark{!coords && ' (required — you have not shared a location)'}</span>
            <input value={form.address} onChange={update('address')} placeholder="Nearest school, mosque, road" />
          </label>

          <label className="field">
            <span>People in the household</span>
            <input type="number" min="1" value={form.householdSize} onChange={update('householdSize')} />
          </label>
        </div>

        <label className="field">
          <span>Anything the team should know</span>
          <textarea rows="3" value={form.notes} onChange={update('notes')} maxLength="1000" />
        </label>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Sending…' : 'Send request'}
        </button>
      </form>
    </>
  );
};

export default RequestAid;
