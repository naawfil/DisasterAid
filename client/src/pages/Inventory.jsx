import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import Empty from '../components/Empty.jsx';
import { AID_CATEGORIES, CATEGORY_LABELS, DONOR_TYPES, titleCase } from '../constants/enums.js';

/** Features 9, 10 and 11 — stock per warehouse, donation inflow, low-stock flags. */
const Inventory = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [selected, setSelected] = useState('');
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('stock');
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [itemForm, setItemForm] = useState({ name: '', category: 'FOOD', quantity: 0, unit: 'unit', lowStockThreshold: 20, mode: 'set' });
  const [donation, setDonation] = useState({
    donorName: '',
    donorType: 'CITIZEN',
    items: [{ name: '', category: 'FOOD', quantity: 1, unit: 'unit' }],
  });
  const [addingWarehouse, setAddingWarehouse] = useState(false);
  const [warehouseForm, setWarehouseForm] = useState({ name: '', address: '' });

  const loadWarehouses = useCallback(async () => {
    const data = await api.get('/inventory/warehouses');
    setWarehouses(data.warehouses);
    if (!selected && data.warehouses.length) setSelected(data.warehouses[0].id);
    setLoading(false);
    return data.warehouses;
  }, [selected]);

  /** Feature 9 — a warehouse has to exist before stock can be tracked in it. */
  const createWarehouse = async (event) => {
    event.preventDefault();
    try {
      const { warehouse } = await api.post('/inventory/warehouses', warehouseForm);
      setWarehouseForm({ name: '', address: '' });
      setAddingWarehouse(false);
      await loadWarehouses();
      setSelected(warehouse.id);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const loadStock = useCallback(async () => {
    if (!selected) return;
    const data = await api.get(`/inventory/stock?warehouse=${selected}`);
    setItems(data.items);
  }, [selected]);

  const loadDonations = useCallback(async () => {
    const data = await api.get('/inventory/donations');
    setDonations(data.donations);
  }, []);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  useEffect(() => {
    if (tab === 'donations') loadDonations();
  }, [tab, loadDonations]);

  const saveItem = async (event) => {
    event.preventDefault();
    try {
      await api.post('/inventory/stock', {
        ...itemForm,
        warehouse: selected,
        quantity: Number(itemForm.quantity),
        lowStockThreshold: Number(itemForm.lowStockThreshold),
      });
      setItemForm({ name: '', category: 'FOOD', quantity: 0, unit: 'unit', lowStockThreshold: 20, mode: 'set' });
      loadStock();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const logDonation = async (event) => {
    event.preventDefault();
    try {
      await api.post('/inventory/donations', {
        ...donation,
        warehouse: selected,
        items: donation.items.map((i) => ({ ...i, quantity: Number(i.quantity) })),
      });
      setDonation({ donorName: '', donorType: 'CITIZEN', items: [{ name: '', category: 'FOOD', quantity: 1, unit: 'unit' }] });
      loadDonations();
      loadStock();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const updateLine = (index, field, value) =>
    setDonation((prev) => ({
      ...prev,
      items: prev.items.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    }));

  if (loading) return <p className="loading">Loading inventory…</p>;

  const lowCount = items.filter((i) => i.isLowStock).length;

  return (
    <>
      <p className="slip-band">
        Supply chain{lowCount > 0 ? ` · ${lowCount} item(s) need restocking` : ' · stock healthy'}
      </p>
      <h1 className="display display-lg">Inventory</h1>

      {error && <p className="alert" role="alert">{error}</p>}

      <button type="button" className="btn btn-quiet" onClick={() => setAddingWarehouse((v) => !v)}>
        {addingWarehouse ? 'Cancel' : 'Add a warehouse'}
      </button>

      {addingWarehouse && (
        <form onSubmit={createWarehouse} className="panel grid-2">
          <label className="field">
            <span>Warehouse name</span>
            <input
              value={warehouseForm.name}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })}
              required
            />
          </label>
          <label className="field">
            <span>Address</span>
            <input
              value={warehouseForm.address}
              onChange={(e) => setWarehouseForm({ ...warehouseForm, address: e.target.value })}
              required
            />
          </label>
          <button type="submit" className="btn btn-primary">Save warehouse</button>
        </form>
      )}

      {warehouses.length === 0 ? (
        <Empty>No warehouses yet. Add one above to start tracking stock.</Empty>
      ) : (
        <>
          <div className="filter-bar">
            <label className="inline-select">
              <span>Warehouse</span>
              <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </label>

            <button type="button" className={`filter-tag ${tab === 'stock' ? 'filter-on' : ''}`} onClick={() => setTab('stock')}>
              Stock
            </button>
            <button type="button" className={`filter-tag ${tab === 'donations' ? 'filter-on' : ''}`} onClick={() => setTab('donations')}>
              Donations
            </button>
          </div>

          {tab === 'stock' ? (
            <>
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Category</th>
                      <th>Quantity</th>
                      <th>Threshold</th>
                      <th>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className={item.isLowStock ? 'row-flagged' : ''}>
                        <td>{item.name}</td>
                        <td>{CATEGORY_LABELS[item.category]}</td>
                        <td className="mono">{item.quantity} {item.unit}</td>
                        <td className="mono">{item.lowStockThreshold}</td>
                        <td>
                          {item.isLowStock ? (
                            <span className="badge badge-status-cancelled">Restock required</span>
                          ) : (
                            <span className="badge badge-status-delivered">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={saveItem} className="panel grid-3">
                <h2 className="sub-head span-all">Add or adjust an item</h2>
                <label className="field">
                  <span>Item name</span>
                  <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} required />
                </label>
                <label className="field">
                  <span>Category</span>
                  <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}>
                    {AID_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                </label>
                <fieldset className="field span-all">
                  <span>If this item already exists in this warehouse…</span>
                  <div className="choice-row">
                    <label className="choice">
                      <input
                        type="radio"
                        name="stock-mode"
                        checked={itemForm.mode === 'set'}
                        onChange={() => setItemForm({ ...itemForm, mode: 'set' })}
                      />
                      Set its quantity to this number
                    </label>
                    <label className="choice">
                      <input
                        type="radio"
                        name="stock-mode"
                        checked={itemForm.mode === 'add'}
                        onChange={() => setItemForm({ ...itemForm, mode: 'add' })}
                      />
                      Add this many newly-arrived units
                    </label>
                  </div>
                </fieldset>
                <label className="field">
                  <span>{itemForm.mode === 'add' ? 'Units arriving' : 'Set quantity to'}</span>
                  <input type="number" min="0" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} />
                </label>
                <label className="field">
                  <span>Unit</span>
                  <input value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} />
                </label>
                <label className="field">
                  <span>Low stock below</span>
                  <input type="number" min="0" value={itemForm.lowStockThreshold} onChange={(e) => setItemForm({ ...itemForm, lowStockThreshold: e.target.value })} />
                </label>
                <button type="submit" className="btn btn-primary">Save item</button>
              </form>
            </>
          ) : (
            <>
              <form onSubmit={logDonation} className="panel stack">
                <h2 className="sub-head">Log an incoming donation</h2>
                <div className="grid-2">
                  <label className="field">
                    <span>Donor name</span>
                    <input value={donation.donorName} onChange={(e) => setDonation({ ...donation, donorName: e.target.value })} required />
                  </label>
                  <label className="field">
                    <span>Donor type</span>
                    <select value={donation.donorType} onChange={(e) => setDonation({ ...donation, donorType: e.target.value })}>
                      {DONOR_TYPES.map((t) => (
                        <option key={t} value={t}>{titleCase(t)}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {donation.items.map((line, index) => (
                  <div key={index} className="grid-4">
                    <label className="field">
                      <span>Item</span>
                      <input value={line.name} onChange={(e) => updateLine(index, 'name', e.target.value)} required />
                    </label>
                    <label className="field">
                      <span>Category</span>
                      <select value={line.category} onChange={(e) => updateLine(index, 'category', e.target.value)}>
                        {AID_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Quantity</span>
                      <input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(index, 'quantity', e.target.value)} />
                    </label>
                    <label className="field">
                      <span>Unit</span>
                      <input value={line.unit} onChange={(e) => updateLine(index, 'unit', e.target.value)} />
                    </label>
                  </div>
                ))}

                <div className="row-controls">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() =>
                      setDonation((prev) => ({
                        ...prev,
                        items: [...prev.items, { name: '', category: 'FOOD', quantity: 1, unit: 'unit' }],
                      }))
                    }
                  >
                    Add another line
                  </button>
                  <button type="submit" className="btn btn-primary btn-inline">Log donation</button>
                </div>
              </form>

              {donations.length === 0 ? (
                <Empty>No donations logged yet.</Empty>
              ) : (
                <ul className="card-list">
                  {donations.map((d) => (
                    <li key={d.id} className="panel">
                      <div className="panel-head">
                        <h2>{d.donorName}</h2>
                        <span className="chip">{titleCase(d.donorType)}</span>
                      </div>
                      <p>{d.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</p>
                      <p className="muted mono">
                        {d.warehouse?.name} · {new Date(d.createdAt).toLocaleString()}
                        {d.loggedBy?.name && ` · logged by ${d.loggedBy.name}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default Inventory;
