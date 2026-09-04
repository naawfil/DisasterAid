import { titleCase } from '../constants/enums.js';

/** Colour is backed up by the label text — never the only signal. */
const StatusBadge = ({ value, kind = 'status' }) => (
  <span className={`badge badge-${kind}-${String(value).toLowerCase()}`}>{titleCase(value)}</span>
);

export default StatusBadge;
