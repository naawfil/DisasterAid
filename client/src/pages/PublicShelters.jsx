import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Empty from '../components/Empty.jsx';
import { AMENITIES, AMENITY_LABELS } from '../constants/enums.js';

/** Features 5 and 7 — live occupancy plus amenity filtering, open to the public. */
const PublicShelters = () => {
  const [shelters, setShelters] = useState([]);
  const [filters, setFilters] = useState([]);
  const [spaceOnly, setSpaceOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.length) params.set('amenities', filters.join(','));
    if (spaceOnly) params.set('hasSpace', 'true');

    try {
      const data = await api.get(`/shelters?${params.toString()}`);
      setShelters(data.shelters);
    } finally {
      setLoading(false);
    }
  }, [filters, spaceOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFilter = (amenity) =>
    setFilters((prev) => (prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]));

  return (
    <>
      <p className="slip-band">Shelter capacity · updated live</p>
      <h1 className="display display-lg">Shelters</h1>
      <p className="lede">Spaces update as shelter staff log arrivals and departures.</p>

      <div className="filter-bar">
        {AMENITIES.map((amenity) => (
          <button
            key={amenity}
            type="button"
            className={`filter-tag ${filters.includes(amenity) ? 'filter-on' : ''}`}
            onClick={() => toggleFilter(amenity)}
            aria-pressed={filters.includes(amenity)}
          >
            {AMENITY_LABELS[amenity]}
          </button>
        ))}
        <button
          type="button"
          className={`filter-tag ${spaceOnly ? 'filter-on' : ''}`}
          onClick={() => setSpaceOnly((v) => !v)}
          aria-pressed={spaceOnly}
        >
          Has space
        </button>
      </div>

      {loading ? (
        <p className="loading">Loading shelters…</p>
      ) : shelters.length === 0 ? (
        <Empty>No shelters match those filters right now.</Empty>
      ) : (
        <ul className="card-list">
          {shelters.map((shelter) => {
            const fillPercent = Math.min(
              Math.round((shelter.currentHeadcount / shelter.maxCapacity) * 100),
              100
            );

            return (
              <li key={shelter.id} className="shelter-card">
                <div className="shelter-head">
                  <div>
                    <h2>{shelter.name}</h2>
                    <p className="muted">{shelter.address}</p>
                  </div>
                  <span className={`spots ${shelter.remainingSpots === 0 ? 'spots-full' : ''}`}>
                    {shelter.remainingSpots === 0 ? 'Full' : `${shelter.remainingSpots} spots`}
                  </span>
                </div>

                <div
                  className="capacity-bar"
                  role="img"
                  aria-label={`${shelter.currentHeadcount} of ${shelter.maxCapacity} places taken`}
                >
                  <span style={{ width: `${fillPercent}%` }} />
                </div>
                <p className="mono muted">
                  {shelter.currentHeadcount} / {shelter.maxCapacity} people
                </p>

                {shelter.amenities.length > 0 && (
                  <ul className="tag-row">
                    {shelter.amenities.map((amenity) => (
                      <li key={amenity}>{AMENITY_LABELS[amenity]}</li>
                    ))}
                  </ul>
                )}

                {shelter.contactPhone && <p className="mono">Call {shelter.contactPhone}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
};

export default PublicShelters;
