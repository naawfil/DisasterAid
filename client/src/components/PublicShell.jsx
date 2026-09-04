import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/** Wrapper for the screens a victim can reach without an account. */
const PublicShell = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="shell">
      <header className="topbar">
        <Link to="/request" className="wordmark">
          Disaster<span>Aid</span>
        </Link>

        <nav className="nav">
          <NavLink to="/request">Request aid</NavLink>
          <NavLink to="/track">Track</NavLink>
          <NavLink to="/shelters">Shelters</NavLink>
          <NavLink to="/find-people">Find people</NavLink>
          <NavLink to="/notices">Notices</NavLink>
        </nav>

        <div className="identity">
          <Link className="btn btn-quiet" to={user ? '/' : '/login'}>
            {user ? 'Staff dashboard' : 'Staff sign in'}
          </Link>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  );
};

export default PublicShell;
