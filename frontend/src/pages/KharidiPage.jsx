// src/pages/KharidiPage.jsx
import { useState, useEffect } from 'react';
import { apiFetch, formatINR, formatDate } from '../utils/api';
import { ShoppingBag, Layers, Inbox, Plus, Edit2, Trash2, X, AlertCircle, TrendingUp, Wallet } from '../icons';

const EMPTY = { id:null, order_id:'', payment_date:new Date().toISOString().slice(0,10), amount:'', paid_by:'', vendor_name:'', description:'' };

export default function KharidiPage({ onDataChange }) {
  const [summary, setSummary] = useState([]);
  const [all, setAll] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('summary');
  const [skipOrder, setSkipOrder] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [s, a, o] = await Promise.all([
        apiFetch('kharidi.php?action=summary'),
        apiFetch('kharidi.php?action=list'),
        apiFetch('orders.php?action=list'),
      ]);
      setSummary(s); setAll(a); setOrders(o);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = (orderId = '') => {
    setForm({ ...EMPTY, order_id: orderId, payment_date: new Date().toISOString().slice(0,10) });
    setSkipOrder(!orderId); setError(''); setModal(true);
  };
  const openEdit = k => {
    setForm({ id:k.id, order_id:k.order_id||'', payment_date:k.payment_date?.slice(0,10)||new Date().toISOString().slice(0,10), amount:k.amount, paid_by:k.paid_by, vendor_name:k.vendor_name||'', description:k.description||'' });
    setSkipOrder(!k.order_id); setError(''); setModal(true);
  };

  const save = async () => {
    setError('');
    if (!form.amount || !form.paid_by) { setError('Amount and Paid By are required'); return; }
    setSaving(true);
    try {
      const body = { ...form, order_id: skipOrder ? null : (form.order_id||null) };
      await apiFetch(`kharidi.php?action=${form.id?'update':'create'}`, {
        method: form.id ? 'PUT' : 'POST',
        headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)
      });
      setModal(false); load(); onDataChange?.();
    } catch(e) { setError(e.message); } finally { setSaving(false); }
  };

  const del = async id => {
    if (!window.confirm('Delete this entry?')) return;
    await apiFetch('kharidi.php?action=delete', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id}) });
    load(); onDataChange?.();
  };

  const totalKharidi = summary.reduce((s,r) => s + parseFloat(r.total_kharidi||0), 0);
  const totalProfit  = summary.reduce((s,r) => s + parseFloat(r.profit||0), 0);

  return (
    <div>
      {/* Kharidi KPIs */}
      {summary.length > 0 && (
        <div className="kpi-grid" style={{ marginBottom:20 }}>
          <div className="kpi-card c-teal">
            <div className="kpi-stripe" />
            <div className="kpi-bg"><ShoppingBag /></div>
            <div className="kpi-label">Total Kharidi</div>
            <div className="kpi-val text-teal">{formatINR(totalKharidi)}</div>
            <div className="kpi-footer">From {summary.length} linked order{summary.length>1?'s':''}</div>
          </div>
          <div className="kpi-card c-pink">
            <div className="kpi-stripe" />
            <div className="kpi-bg"><TrendingUp /></div>
            <div className="kpi-label">Profit / નફો</div>
            <div className={`kpi-val ${totalProfit >= 0 ? 'v-green' : 'v-red'}`}>{formatINR(totalProfit)}</div>
            <div className="kpi-footer">Credited − Kharidi</div>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-header">
          <div className="table-header-title">
            <div className="title-icon"><ShoppingBag /></div>
            Kharidi
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => openAdd()}>
            <Plus /> New Entry
          </button>
        </div>

        <div style={{ padding:'14px 20px 0' }}>
          <div className="tabs-wrap" style={{ maxWidth:340 }}>
            <button className={`tab-btn ${tab==='summary'?'active':''}`} onClick={() => setTab('summary')}>
              <Layers /> Order Summary
            </button>
            <button className={`tab-btn ${tab==='all'?'active':''}`} onClick={() => setTab('all')}>
              <Inbox /> All Entries
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : tab === 'summary' ? (
          summary.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ShoppingBag /></div>
              <h4>No kharidi entries yet</h4>
              <p>Add purchases linked to your orders</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Order No</th><th>Organization</th><th>Order Amt</th><th>Credited</th><th>Total Kharidi</th><th>Paid By</th><th>Profit</th><th></th></tr>
                </thead>
                <tbody>
                  {summary.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.order_no}</strong></td>
                      <td>{s.org_name}</td>
                      <td className="num">{formatINR(s.total_amount)}</td>
                      <td className="num text-success">{s.amount_credited > 0 ? formatINR(s.amount_credited) : '—'}</td>
                      <td className="num text-danger">{formatINR(s.total_kharidi)}</td>
                      <td className="text-muted">{s.paid_by_list||'—'}</td>
                      <td className={`num font-bold ${parseFloat(s.profit)>=0?'text-success':'text-danger'}`}>{formatINR(s.profit)}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => openAdd(s.id)}>
                          <Plus /> Add
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          all.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Inbox /></div>
              <h4>No entries yet</h4>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Date</th><th>Order</th><th>Vendor</th><th>Amount</th><th>Paid By</th><th>Description</th><th></th></tr>
                </thead>
                <tbody>
                  {all.map(k => (
                    <tr key={k.id}>
                      <td className="text-muted">{formatDate(k.payment_date)}</td>
                      <td>{k.order_no ? <span className="badge badge-info">{k.order_no}</span> : <span className="text-muted">—</span>}</td>
                      <td>{k.vendor_name||'—'}</td>
                      <td className="num text-danger font-bold">{formatINR(k.amount)}</td>
                      <td>{k.paid_by}</td>
                      <td className="text-muted">{k.description||'—'}</td>
                      <td>
                        <div className="td-actions">
                          <button className="btn-icon edit" title="Edit" onClick={() => openEdit(k)}><Edit2 /></button>
                          <button className="btn-icon del" title="Delete" onClick={() => del(k.id)}><Trash2 /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ─── Modal ─── */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{form.id ? 'Edit Kharidi Entry' : 'New Kharidi Entry'}</span>
              <button className="modal-close-btn" onClick={() => setModal(false)}><X /></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error"><AlertCircle />{error}</div>}

              <div className="form-group">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', textTransform:'none', letterSpacing:0, fontSize:14, fontWeight:600 }}>
                  <input type="checkbox" checked={skipOrder} onChange={e => setSkipOrder(e.target.checked)} style={{ width:'auto', accentColor:'var(--teal)' }} />
                  Don't link to any order
                </label>
              </div>

              {!skipOrder && (
                <div className="form-group">
                  <label>Link to Order</label>
                  <select value={form.order_id} onChange={e => set('order_id', e.target.value)}>
                    <option value="">— Select Order —</option>
                    {orders.map(o => <option key={o.id} value={o.id}>#{o.order_no} · {o.org_name} · {formatINR(o.total_amount)}</option>)}
                  </select>
                </div>
              )}
              <div className="form-row">
                <div className="form-group"><label>Payment Date *</label><input type="date" value={form.payment_date} onChange={e => set('payment_date', e.target.value)} /></div>
                <div className="form-group"><label>Amount (₹) *</label><input type="number" placeholder="11000" value={form.amount} onChange={e => set('amount', e.target.value)} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Paid By *</label><input placeholder="e.g. Ramesh, Papa, Self" value={form.paid_by} onChange={e => set('paid_by', e.target.value)} /></div>
                <div className="form-group"><label>Vendor Name</label><input placeholder="Supplier / Vendor" value={form.vendor_name} onChange={e => set('vendor_name', e.target.value)} /></div>
              </div>
              <div className="form-group"><label>Description / Note</label><textarea placeholder="Optional details…" value={form.description} onChange={e => set('description', e.target.value)} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : form.id ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}