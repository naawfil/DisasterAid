import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { ROLES } from '../constants/roles.js';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: ROLES.PUBLIC,
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setFieldErrors({});
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
      setFieldErrors(Object.fromEntries((err.details || []).map((d) => [d.field, d.message])));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-card">
        <p className="slip-band">New account · public or volunteer</p>
        <h1 className="display">Register</h1>
        <p className="lede">
          Manager and admin access is granted by an admin after your account exists.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {error && <p className="alert" role="alert">{error}</p>}

          <label className="field">
            <span>Full name</span>
            <input value={form.name} onChange={update('name')} autoComplete="name" required />
            {fieldErrors.name && <em className="field-error">{fieldErrors.name}</em>}
          </label>

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
            {fieldErrors.email && <em className="field-error">{fieldErrors.email}</em>}
          </label>

          <label className="field">
            <span>Phone</span>
            <input value={form.phone} onChange={update('phone')} autoComplete="tel" placeholder="01XXXXXXXXX" />
            {fieldErrors.phone && <em className="field-error">{fieldErrors.phone}</em>}
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={update('password')}
              autoComplete="new-password"
              required
            />
            {fieldErrors.password && <em className="field-error">{fieldErrors.password}</em>}
          </label>

          <fieldset className="field">
            <legend>I am registering as</legend>
            <div className="choice-row">
              <label className="choice">
                <input
                  type="radio"
                  name="role"
                  value={ROLES.PUBLIC}
                  checked={form.role === ROLES.PUBLIC}
                  onChange={update('role')}
                />
                <span>Public — I need to request aid</span>
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="role"
                  value={ROLES.VOLUNTEER}
                  checked={form.role === ROLES.VOLUNTEER}
                  onChange={update('role')}
                />
                <span>Volunteer — I can help in the field</span>
              </label>
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </div>
  );
};

export default Register;
