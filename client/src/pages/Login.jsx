import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <h1 className="display">Sign in</h1>
        <p className="lede">Use the account your coordinator set up for you.</p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="alert" role="alert">{error}</p>}

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="switch">
          No account yet? <Link to="/register">Register</Link>
        </p>
      </section>
    </div>
  );
};

export default Login;
