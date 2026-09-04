import { useEffect, useState } from 'react';
import { api, downloadCsv } from '../api/client.js';
import Empty from '../components/Empty.jsx';

/** Features 21 and 22 — the audit trail and the CSV exports. */
const AuditTrail = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    api
      .get('/admin/audit')
      .then((data) => setLogs(data.logs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const exportSet = async (dataset) => {
    setExporting(dataset);
    try {
      await downloadCsv(dataset);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting('');
    }
  };

  return (
    <>
      <h1 className="display display-lg">Audit &amp; exports</h1>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="row-controls">
        {['inventory', 'requests', 'shelters'].map((dataset) => (
          <button key={dataset} type="button" className="btn btn-quiet" onClick={() => exportSet(dataset)} disabled={exporting === dataset}>
            {exporting === dataset ? 'Preparing…' : `Export ${dataset} CSV`}
          </button>
        ))}
      </div>

      <h2 className="sub-head">Recent activity</h2>
      {loading ? (
        <p className="loading">Loading the audit trail…</p>
      ) : logs.length === 0 ? (
        <Empty>Nothing recorded yet.</Empty>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>Action</th>
                <th>What happened</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="mono">{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.actor?.name || log.actorName}</td>
                  <td className="mono">{log.action}</td>
                  <td>{log.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default AuditTrail;
