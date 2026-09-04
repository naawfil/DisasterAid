import { Link } from 'react-router-dom';

const NoAccess = () => (
  <>
    <h1 className="display display-lg">Your role cannot open this screen</h1>
    <p className="lede">
      Ask an admin to change your role if you need it, then sign out and back in.
    </p>
    <Link className="btn btn-primary" to="/">
      Back to dashboard
    </Link>
  </>
);

export default NoAccess;
