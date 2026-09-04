import { useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Empty from '../components/Empty.jsx';

/** Feature 17 — generate copy-pasteable alerts from templates. */
const Alerts = () => {
  const [templates, setTemplates] = useState([]);
  const [channel, setChannel] = useState('');
  const [selected, setSelected] = useState(null);
  const [values, setValues] = useState({});
  const [generated, setGenerated] = useState('');
  const [drafts, setDrafts] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const boot = async () => {
      const [templateData, draftData] = await Promise.all([
        api.get('/comms/alerts/templates'),
        api.get('/comms/alerts/drafts'),
      ]);
      setTemplates(templateData.templates);
      setChannel(templateData.activeChannel);
      setDrafts(draftData.drafts);
      if (templateData.templates.length) setSelected(templateData.templates[0]);
    };
    boot().catch((err) => setError(err.message));
  }, []);

  const pick = (template) => {
    setSelected(template);
    setValues({});
    setGenerated('');
  };

  const generate = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const data = await api.post('/comms/alerts', { templateId: selected.id, values });
      setGenerated(data.body);
      const draftData = await api.get('/comms/alerts/drafts');
      setDrafts(draftData.drafts);
    } catch (err) {
      setError(err.message);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <h1 className="display display-lg">Alerts</h1>
      <p className="lede">
        Fill in a template, copy the text, and send it through whatever channel you have. The same
        interface would drive a real SMS gateway without changing this screen.
      </p>

      {error && <p className="alert" role="alert">{error}</p>}

      <div className="filter-bar">
        {templates.map((template) => (
          <button
            key={template.id}
            type="button"
            className={`filter-tag ${selected?.id === template.id ? 'filter-on' : ''}`}
            onClick={() => pick(template)}
          >
            {template.label}
          </button>
        ))}
      </div>

      {selected && (
        <form onSubmit={generate} className="panel stack">
          {selected.fields.map((field) => (
            <label key={field} className="field">
              <span>{field}</span>
              <input
                value={values[field] || ''}
                onChange={(e) => setValues({ ...values, [field]: e.target.value })}
                required
              />
            </label>
          ))}
          <button type="submit" className="btn btn-primary">Generate message</button>
        </form>
      )}

      {generated && (
        <section className="panel">
          <h2 className="sub-head">Ready to send</h2>
          <p className="generated-message">{generated}</p>
          <p className="muted mono">{generated.length} characters</p>
          <button type="button" className="btn btn-quiet" onClick={copy}>
            {copied ? 'Copied' : 'Copy text'}
          </button>
        </section>
      )}

      <h2 className="sub-head">Recent drafts</h2>
      {drafts.length === 0 ? (
        <Empty>No messages generated yet.</Empty>
      ) : (
        <ul className="plain-list">
          {drafts.slice(0, 10).map((draft, index) => (
            <li key={index}>
              <span className="mono muted">{new Date(draft.createdAt).toLocaleTimeString()} → {draft.recipient}</span>
              <p>{draft.body}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

export default Alerts;
