import { useState } from 'react';
import { api } from '../api/client.js';
import Empty from '../components/Empty.jsx';
import { titleCase } from '../constants/enums.js';

/** Feature 8 — the safety registry, searched by relatives looking for someone. */
const FindPeople = () => {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const search = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api.get(`/shelters/registry/search?q=${encodeURIComponent(term.trim())}`);
      setResults(data.results);
    } catch (err) {
      setError(err.message);
      setResults(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <p className="slip-band">Safety registry</p>
      <h1 className="display display-lg">Find someone</h1>
      <p className="lede">
        Search by name or hometown to see whether someone has checked into a shelter. Only name, hometown
        and shelter are shown — no phone numbers or addresses.
      </p>

      <form onSubmit={search} className="inline-form">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Name or hometown"
          aria-label="Name or hometown"
        />
        <button type="submit" className="btn btn-primary btn-inline" disabled={busy}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="alert" role="alert">{error}</p>}

      {results && (results.length === 0 ? (
        <Empty>
          No one matching that has been registered yet. People are added as they arrive, so it is worth
          checking again later.
        </Empty>
      ) : (
        <>
          <p className="muted mono">{results.length} match{results.length === 1 ? '' : 'es'} found</p>
          <ul className="card-list">
            {results.map((person, index) => (
              <li key={index} className="person-card">
                <div>
                  <h2>{person.fullName}</h2>
                  <p className="muted">
                    From {person.hometown} · {titleCase(person.ageGroup)}
                  </p>
                </div>
                <div className="person-where">
                  {person.isSafe && <span className="badge badge-status-delivered">Safe</span>}
                  <p>{person.shelter ? person.shelter.name : 'Shelter not recorded'}</p>
                  <p className="muted mono">
                    Checked in {new Date(person.checkedInAt).toLocaleDateString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      ))}
    </>
  );
};

export default FindPeople;
