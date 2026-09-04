import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../constants/roles.js';

const People = () => {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await api.get('/users?limit=100');
      setUsers(data.users);
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeRole = async (id, role) => {
    try {
      const data = await api.patch(`/users/${id}/role`, { role });
      setUsers((list) => list.map((u) => (u.id === id ? data.user : u)));
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (target) => {
    try {
      const data = await api.patch(`/users/${target.id}/status`, { isActive: !target.isActive });
      setUsers((list) => list.map((u) => (u.id === target.id ? data.user : u)));
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading') return <p className="loading">Loading people…</p>;

  return (
    <>
      <h1 className="display display-lg">People</h1>
      <p className="lede">Roles decide what each account can reach. Only admins can change them.</p>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.id} className={row.isActive ? '' : 'row-muted'}>
                <td>{row.name}</td>
                <td className="mono">{row.email}</td>
                <td>
                  {hasRole(ROLES.ADMIN) && row.id !== user.id ? (
                    <select value={row.role} onChange={(e) => changeRole(row.id, e.target.value)}>
                      {Object.keys(ROLES).map((key) => (
                        <option key={key} value={key}>
                          {ROLE_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="chip">{ROLE_LABELS[row.role]}</span>
                  )}
                </td>
                <td className="mono">{row.isActive ? 'Active' : 'Deactivated'}</td>
                <td className="cell-actions">
                  {row.id !== user.id && (
                    <button type="button" className="btn btn-quiet" onClick={() => toggleActive(row)}>
                      {row.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default People;
