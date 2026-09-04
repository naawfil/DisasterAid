import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppShell from './components/AppShell.jsx';
import PublicShell from './components/PublicShell.jsx';
import { ROLES } from './constants/roles.js';

import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import People from './pages/People.jsx';
import NoAccess from './pages/NoAccess.jsx';
import RequestAid from './pages/RequestAid.jsx';
import TrackRequest from './pages/TrackRequest.jsx';
import PublicShelters from './pages/PublicShelters.jsx';
import FindPeople from './pages/FindPeople.jsx';
import Noticeboard from './pages/Noticeboard.jsx';
import Triage from './pages/Triage.jsx';
import SheltersAdmin from './pages/SheltersAdmin.jsx';
import Inventory from './pages/Inventory.jsx';
import Dispatch from './pages/Dispatch.jsx';
import Tasks from './pages/Tasks.jsx';
import MyTasks from './pages/MyTasks.jsx';
import Alerts from './pages/Alerts.jsx';
import AuditTrail from './pages/AuditTrail.jsx';

const Private = ({ roles, children }) => (
  <ProtectedRoute roles={roles}>
    <AppShell>{children}</AppShell>
  </ProtectedRoute>
);

const Public = ({ children }) => <PublicShell>{children}</PublicShell>;

const MANAGERS = [ROLES.ADMIN, ROLES.RELIEF_MANAGER];
// Shelter Manager only ever needs the shelter-operations screen — everywhere
// else in the app stays scoped to Admin/Relief Manager.
const SHELTER_STAFF = [ROLES.ADMIN, ROLES.RELIEF_MANAGER, ROLES.SHELTER_MANAGER];

const App = () => (
  <Routes>
    {/* No account needed — this is the half of the product a disaster victim uses. */}
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/request" element={<Public><RequestAid /></Public>} />
    <Route path="/track" element={<Public><TrackRequest /></Public>} />
    <Route path="/shelters" element={<Public><PublicShelters /></Public>} />
    <Route path="/find-people" element={<Public><FindPeople /></Public>} />
    <Route path="/notices" element={<Public><Noticeboard /></Public>} />

    {/* Staff */}
    <Route path="/" element={<Private><Dashboard /></Private>} />
    <Route path="/triage" element={<Private roles={MANAGERS}><Triage /></Private>} />
    <Route path="/shelters-admin" element={<Private roles={SHELTER_STAFF}><SheltersAdmin /></Private>} />
    <Route path="/inventory" element={<Private roles={MANAGERS}><Inventory /></Private>} />
    <Route path="/dispatch" element={<Private roles={MANAGERS}><Dispatch /></Private>} />
    <Route path="/tasks" element={<Private roles={MANAGERS}><Tasks /></Private>} />
    <Route path="/my-tasks" element={<Private><MyTasks /></Private>} />
    <Route path="/alerts" element={<Private roles={MANAGERS}><Alerts /></Private>} />
    <Route path="/users" element={<Private roles={MANAGERS}><People /></Private>} />
    <Route path="/audit" element={<Private roles={[ROLES.ADMIN]}><AuditTrail /></Private>} />
    <Route path="/no-access" element={<Private><NoAccess /></Private>} />

    <Route path="*" element={<Navigate to="/request" replace />} />
  </Routes>
);

export default App;
