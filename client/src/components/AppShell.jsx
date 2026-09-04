import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES, ROLE_LABELS } from '../constants/roles.js';

const AppShell = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const managing = hasRole(ROLES.ADMIN, ROLES.RELIEF_MANAGER);
  const staff = hasRole(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.VOLUNTEER);
  // Shelter Manager gets the shelter-operations screen only — everything else
  // in the nav stays gated to `managing` (Admin / Relief Manager).
  const sheltering = hasRole(ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.SHELTER_MANAGER);

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/" className="wordmark">
          Disaster<span>Aid</span>
        </Link>

        <nav className="nav">
          <NavLink to="/">Dashboard</NavLink>

          {/* Everyone keeps access to the public half of the product — a signed-in
              victim still needs to ask for aid and track it. */}
          <NavLink to="/request">Request aid</NavLink>
          <NavLink to="/track">Track</NavLink>
          <NavLink to="/shelters">Shelters</NavLink>
          <NavLink to="/find-people">Find people</NavLink>
          <NavLink to="/notices">Notices</NavLink>

          {managing && <NavLink to="/triage">Requests</NavLink>}
          {sheltering && <NavLink to="/shelters-admin">Manage shelters</NavLink>}
          {managing && <NavLink to="/inventory">Inventory</NavLink>}
          {managing && <NavLink to="/dispatch">Dispatch</NavLink>}
          {managing && <NavLink to="/tasks">Tasks</NavLink>}
          {staff && <NavLink to="/my-tasks">My tasks</NavLink>}
          {managing && <NavLink to="/alerts">Alerts</NavLink>}
          {managing && <NavLink to="/users">People</NavLink>}
          {hasRole(ROLES.ADMIN) && <NavLink to="/audit">Audit</NavLink>}
        </nav>

        <div className="identity">
          <span className="chip">{ROLE_LABELS[user.role]}</span>
          <button type="button" className="btn btn-quiet" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  );
};

export default AppShell;
