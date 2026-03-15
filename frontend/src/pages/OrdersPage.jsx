// src/pages/OrdersPage.jsx
import { useState, useEffect } from 'react';
import { apiFetch, formatINR, formatDate, statusBadge } from '../utils/api';
import { Package, Search, Edit2, Trash2, Eye, Plus, X, AlertCircle, ShoppingBag, CheckCircle } from '../icons';

const EMPTY = { id:null, order_no:'', order_date:'', org_name:'', item_name:'', total_amount:'', credit_date:'', amount_credited:'', notes:'' };

export default function OrdersPage({ onDataChange }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewModal, setViewModal] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`orders.php?${new URLSearchParams({ action:'list', search, status:statusFilter })}`);
      setOrders(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [search, statusFilter]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const openAdd  = () => { setForm(EMPTY); setError(''); setModal(true); };
  const openEdit = o => {
    setForm({ id:o.id, order_no:o.order_no, order_date:o.order_date?.slice(0,10)||'',
      org_name:o.org_name, item_name:o.item_name, total_amount:o.total_amount,
      credit_date:o.credit_date?.slice(0,10)||'', amount_credited:o.amount_credited, notes:o.notes||'' });
    setError(''); setModal(true);
  };

  const save = async () => {
    setError('');
    if (!form.order_no||!form.order_date||!form.org_name||!form.item_name||!form.total_amount) {
      setError('Order No, Date, Organization, Item and Amount are required'); return;
    }
    setSaving(true);
    try {
      await apiFetch(`orders.php?action=${form.id?'update':'create'}`, {
        method: form.id ? 'PUT' : 'POST',
        headers: { 'Content-Type':'application/json' }, body: JSON.stringify(form)
      });
      setModal(false); load(); onDataChange?.();
    } catch(e) { setError(e.message); } finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Delete this order?')) return;
    await apiFetch('orders.php?action=delete', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
    load(); onDataChange?.();
  };

  const viewOrder = async id => setViewModal(await apiFetch(`orders.php?action=get&id=${id}`));

  return (
    <div>
      <div className="table-card">
        {/* Header */}
        <div className="table-header">
          <div className="table-header-title">
            <div className="title-icon"><Package /></div>
            Orders
          </div>
          <div className="table-actions">
            <div className="search-pill">
              <span className="search-pill-icon"><Search /></span>
              <input placeholder="Search orders…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="credited">Credited</option>
            </select>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>
              <Plus /> New Order
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Package /></div>
            <h4>No orders yet</h4>
            <p>Click "New Order" to add your first order</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Order No</th><th>Date</th><th>Organization</th>
                  <th>Item</th><th>Order Amt</th><th>Credited</th><th>Pending</th>
                  <th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => {
                  const b = statusBadge(o.status);
                  const pending = Math.max(0, o.total_amount - o.amount_credited);
                  return (
                    <tr key={o.id}>
                      <td className="text-muted" style={{ fontSize:13 }}>{i+1}</td>
                      <td><strong>{o.order_no}</strong></td>
                      <td className="text-muted">{formatDate(o.order_date)}</td>
                      <td>{o.org_name}</td>
                      <td>{o.item_name}</td>
                      <td className="num font-bold">{formatINR(o.total_amount)}</td>
                      <td className="num text-success">{o.amount_credited > 0 ? formatINR(o.amount_credited) : '—'}</td>
                      <td className="num" style={{ color: pending > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        {pending > 0 ? formatINR(pending) : '✓'}
                      </td>
                      <td><span className={`badge ${b.cls}`}>{b.label}</span></td>
                      <td>
                        <div className="td-actions">
                          <button className="btn-icon view" title="View" onClick={() => viewOrder(o.id)}><Eye /></button>
                          <button className="btn-icon edit" title="Edit" onClick={() => openEdit(o)}><Edit2 /></button>
                          <button className="btn-icon del" title="Delete" onClick={() => del(o.id)}><Trash2 /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Add/Edit Modal ─── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{form.id ? 'Edit Order' : 'New Order'}</span>
              <button className="modal-close-btn" onClick={() => setModal(false)}><X /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error"><AlertCircle />{error}</div>}
              <div className="form-row">
                <div className="form-group"><label>Order No *</label><input placeholder="ORD-001" value={form.order_no} onChange={e => set('order_no', e.target.value)} /></div>
                <div className="form-group"><label>Order Date *</label><input type="date" value={form.order_date} onChange={e => set('order_date', e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Organization / Department *</label><input placeholder="e.g. KU LRS Anand" value={form.org_name} onChange={e => set('org_name', e.target.value)} /></div>
              <div className="form-row">
                <div className="form-group"><label>Item Name *</label><input placeholder="e.g. T-Shirts" value={form.item_name} onChange={e => set('item_name', e.target.value)} /></div>
                <div className="form-group"><label>Total Amount (₹) *</label><input type="number" placeholder="24800" value={form.total_amount} onChange={e => set('total_amount', e.target.value)} /></div>
              </div>
              <hr className="divider" />
              <p className="section-note">Payment Details — leave blank if not yet credited</p>
              <div className="form-row">
                <div className="form-group"><label>Credit Date</label><input type="date" value={form.credit_date} onChange={e => set('credit_date', e.target.value)} /></div>
                <div className="form-group"><label>Amount Credited (₹)</label><input type="number" placeholder="24560" value={form.amount_credited} onChange={e => set('amount_credited', e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Notes</label><input placeholder="Optional note…" value={form.notes} onChange={e => set('notes', e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : form.id ? 'Update Order' : 'Save Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── View Modal ─── */}
      {viewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Order #{viewModal.order_no}</span>
              <button className="modal-close-btn" onClick={() => setViewModal(null)}><X /></button>
            </div>
            <div className="modal-body">
              <div className="info-grid">
                {[
                  ['Organization',   viewModal.org_name,                                                       false],
                  ['Item',           viewModal.item_name,                                                      false],
                  ['Order Date',     formatDate(viewModal.order_date),                                         false],
                  ['Credit Date',    formatDate(viewModal.credit_date),                                        false],
                  ['Total Amount',   formatINR(viewModal.total_amount),                                        true],
                  ['Amount Credited',formatINR(viewModal.amount_credited),                                     true],
                  ['Pending',        formatINR(Math.max(0, viewModal.total_amount - viewModal.amount_credited)), true],
                ].map(([lbl, val, mono]) => (
                  <div key={lbl} className="info-cell">
                    <div className="info-lbl">{lbl}</div>
                    <div className={`info-val ${mono ? 'mono' : ''}`}>{val}</div>
                  </div>
                ))}
              </div>

              {viewModal.kharidi?.length > 0 && (
                <>
                  <p style={{ fontWeight:700, fontSize:15, marginBottom:10, color:'var(--text)', display:'flex', alignItems:'center', gap:7 }}>
                    <ShoppingBag style={{ width:16, height:16, color:'var(--teal)' }} /> Kharidi / Purchases
                  </p>
                  <table className="sub-table">
                    <thead>
                      <tr>{['Date','Amount','Paid By','Vendor'].map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {viewModal.kharidi.map(k => (
                        <tr key={k.id}>
                          <td>{formatDate(k.payment_date)}</td>
                          <td className="num text-danger font-bold">{formatINR(k.amount)}</td>
                          <td>{k.paid_by}</td>
                          <td className="text-muted">{k.vendor_name||'—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="profit-row">
                    <span>Total Kharidi: <span className="font-mono text-danger">{formatINR(viewModal.kharidi.reduce((s,k)=>s+parseFloat(k.amount),0))}</span></span>
                    <span>Profit: <span className="font-mono text-success">{formatINR(viewModal.amount_credited - viewModal.kharidi.reduce((s,k)=>s+parseFloat(k.amount),0))}</span></span>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setViewModal(null)}>Close</button>
              <button className="btn btn-outline btn-sm" onClick={() => { setViewModal(null); openEdit(viewModal); }}>
                <Edit2 /> Edit Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}