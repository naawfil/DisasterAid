import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Empty from '../components/Empty.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../constants/roles.js';
import { AMENITIES, AMENITY_LABELS } from '../constants/enums.js';

/** Features 6 and 8 — check-in logging and occupant registration. */
const SheltersAdmin = () => {
  const { hasRole } = useAuth();
  // Opening a new shelter (capacity planning) stays with Admin/Relief Manager;
  // Shelter Manager runs day-to-day check-ins and the registry on shelters
  // that already exist — the server enforces this same split.
  const canOpenShelters = hasRole(ROLES.ADMIN, ROLES.RELIEF_MANAGER);

  const [shelters, setShelters] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [occupants, setOccupants] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newShelter, setNewShelter] = useState({ name: '', address: '', maxCapacity: 100, contactPhone: '', amenities: [] });
  const [person, setPerson] = useState({ fullName: '', hometown: '', ageGroup: 'ADULT' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/shelters');
      setShelters(data.shelters);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadOccupants = async (shelterId) => {
    if (openId === shelterId) {
      setOpenId(null);
      return;
    }
    setOpenId(shelterId);
    const data = await api.get(`/shelters/${shelterId}/occupants`);
    setOccupants(data.occupants);
  };

  const adjust = async (shelterId, delta) => {
    try {
      const data = await api.post(`/shelters/${shelterId}/check-in`, { delta, reason: delta > 0 ? 'Arrival' : 'Departure' });
      setShelters((list) => list.map((s) => (s.id === shelterId ? data.shelter : s)));
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const createShelter = async (event) => {
    event.preventDefault();
    try {
      await api.post('/shelters', { ...newShelter, maxCapacity: Number(newShelter.maxCapacity) });
      setNewShelter({ name: '', address: '', maxCapacity: 100, contactPhone: '', amenities: [] });
      setCreating(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const checkOutPerson = async (occupantId, shelterId) => {
    try {
      await api.patch(`/shelters/occupants/${occupantId}/check-out`);
      const data = await api.get(`/shelters/${shelterId}/occupants`);
      setOccupants(data.occupants);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const addPerson = async (event, shelterId) => {
    event.preventDefault();
    try {
      await api.post(`/shelters/${shelterId}/occupants`, person);
      setPerson({ fullName: '', hometown: '', ageGroup: 'ADULT' });
      const data = await api.get(`/shelters/${shelterId}/occupants`);
      setOccupants(data.occupants);
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleAmenity = (amenity) =>
    setNewShelter((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));

  if (loading) return <p className="loading">Loading shelters…</p>;

  return (
    <>
      <h1 className="display display-lg">Shelters</h1>
      <p className="lede">Log arrivals and departures here — the public dashboard updates immediately.</p>
      {!loading && (
        <p className="muted mono">{shelters.length} shelter{shelters.length === 1 ? '' : 's'} on record</p>
      )}

      {error && <p className="alert" role="alert">{error}</p>}

      {canOpenShelters && (
        <button type="button" className="btn btn-quiet" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Cancel' : 'Add a shelter'}
        </button>
      )}

      {canOpenShelters && creating && (
        <form onSubmit={createShelter} className="panel stack">
          <div className="grid-2">
            <label className="field">
              <span>Name</span>
              <input value={newShelter.name} onChange={(e) => setNewShelter({ ...newShelter, name: e.target.value })} required />
            </label>
            <label className="field">
              <span>Address</span>
              <input value={newShelter.address} onChange={(e) => setNewShelter({ ...newShelter, address: e.target.value })} required />
            </label>
            <label className="field">
              <span>Maximum capacity</span>
              <input type="number" min="1" value={newShelter.maxCapacity} onChange={(e) => setNewShelter({ ...newShelter, maxCapacity: e.target.value })} required />
            </label>
            <label className="field">
              <span>Contact phone</span>
              <input value={newShelter.contactPhone} onChange={(e) => setNewShelter({ ...newShelter, contactPhone: e.target.value })} />
            </label>
          </div>
          <fieldset className="field">
            <legend>Amenities on site</legend>
            <div className="filter-bar">
              {AMENITIES.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  className={`filter-tag ${newShelter.amenities.includes(amenity) ? 'filter-on' : ''}`}
                  onClick={() => toggleAmenity(amenity)}
                  aria-pressed={newShelter.amenities.includes(amenity)}
                >
                  {AMENITY_LABELS[amenity]}
                </button>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="btn btn-primary">Save shelter</button>
        </form>
      )}

      {shelters.length === 0 ? (
        <Empty>No shelters yet.</Empty>
      ) : (
        <ul className="card-list">
          {shelters.map((shelter) => (
            <li key={shelter.id} className="shelter-card">
              <div className="shelter-head">
                <div>
                  <h2>{shelter.name}</h2>
                  <p className="muted">{shelter.address}</p>
                </div>
                <span className={`spots ${shelter.remainingSpots === 0 ? 'spots-full' : ''}`}>
                  {shelter.currentHeadcount} / {shelter.maxCapacity}
                </span>
              </div>

              <div className="counter-row">
                <button type="button" className="btn btn-quiet" onClick={() => adjust(shelter.id, -1)}>
                  − 1 left
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => adjust(shelter.id, 1)}>
                  + 1 arrived
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => adjust(shelter.id, 5)}>
                  + 5 arrived
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => loadOccupants(shelter.id)}>
                  {openId === shelter.id ? 'Hide registry' : 'View registry'}
                </button>
              </div>

              {openId === shelter.id && (
                <div className="sub-panel">
                  <h3 className="sub-head">People registered here</h3>
                  {occupants.length === 0 ? (
                    <Empty>Nobody registered yet.</Empty>
                  ) : (
                    <ul className="plain-list">
                      {occupants.map((occupant) => (
                        <li key={occupant.id} className="registry-row">
                          <span>
                            <strong>{occupant.fullName}</strong>
                            <span className="muted"> — {occupant.hometown}</span>
                          </span>
                          <button
                            type="button"
                            className="btn btn-quiet"
                            onClick={() => checkOutPerson(occupant.id, shelter.id)}
                          >
                            Check out
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form onSubmit={(e) => addPerson(e, shelter.id)} className="grid-3">
                    <label className="field">
                      <span>Name</span>
                      <input value={person.fullName} onChange={(e) => setPerson({ ...person, fullName: e.target.value })} required />
                    </label>
                    <label className="field">
                      <span>Hometown</span>
                      <input value={person.hometown} onChange={(e) => setPerson({ ...person, hometown: e.target.value })} required />
                    </label>
                    <label className="field">
                      <span>Age group</span>
                      <select value={person.ageGroup} onChange={(e) => setPerson({ ...person, ageGroup: e.target.value })}>
                        <option value="CHILD">Child</option>
                        <option value="ADULT">Adult</option>
                        <option value="ELDERLY">Elderly</option>
                      </select>
                    </label>
                    <button type="submit" className="btn btn-quiet">Register person</button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default SheltersAdmin;
