// src/pages/AnalyticsPage.jsx
import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { apiFetch, formatINR } from '../utils/api';
import { BarChart as BarIcon, PieChart as PieIcon, Layers } from '../Icons';

const COLORS = ['#069494','#FF69B4','#00b8c9','#0ababa','#e0418f','#047857','#0369a1','#b45309','#7c3aed','#be123c'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:10, padding:'12px 16px', boxShadow:'var(--shadow-md)', minWidth:160 }}>
      <p style={{ fontWeight:700, marginBottom:8, color:'var(--text)', fontSize:13 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color:p.color, fontSize:13, marginBottom:3 }}>
          <span style={{ opacity:0.7 }}>{p.name}: </span>
          <strong>{p.name.includes('Orders') ? p.value : formatINR(p.value)}</strong>
        </p>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background:'white', border:'1.5px solid var(--border)', borderRadius:10, padding:'10px 14px', boxShadow:'var(--shadow-md)' }}>
      <p style={{ fontWeight:700, color:'var(--text)', marginBottom:4, fontSize:13 }}>{d.payload.org_name}</p>
      <p style={{ color:d.fill, fontSize:13, fontFamily:'var(--font-mono)', fontWeight:600 }}>{formatINR(d.value)}</p>
      <p style={{ color:'var(--text3)', fontSize:12, marginTop:2 }}>{d.payload.order_count} order{d.payload.order_count>1?'s':''}</p>
    </div>
  );
};

export default function AnalyticsPage() {
  const [monthly, setMonthly]         = useState([]);
  const [weekly, setWeekly]           = useState([]);
  const [byOrg, setByOrg]             = useState([]);
  const [years, setYears]             = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [chartMode, setChartMode]     = useState('monthly');
  const [loading, setLoading]         = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [mData, wData, orgData, yearData] = await Promise.all([
        apiFetch(`analytics.php?action=monthly&year=${selectedYear}`),
        apiFetch('analytics.php?action=weekly'),
        apiFetch('analytics.php?action=by_org'),
        apiFetch('analytics.php?action=years'),
      ]);
      setMonthly(mData);
      setWeekly(wData.map(w => ({
        ...w,
        label: `${new Date(w.week_start).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}`
      })));
      setByOrg(orgData);
      setYears(yearData.map(y => y.year));
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [selectedYear]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  const hasMonthly = monthly.some(m => m.order_count > 0);
  const hasWeekly  = weekly.length > 0;
  const hasOrg     = byOrg.length > 0;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      {/* ── Overview Chart Card ── */}
      <div className="chart-card">
        <div className="chart-head">
          {/* Title */}
          <h4>
            <BarIcon />
            Orders Overview
          </h4>

          {/* Controls */}
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            {/* Toggle pills */}
            <div style={{
              display:'flex', gap:4,
              background:'var(--surface3)', borderRadius:99,
              padding:4, border:'1.5px solid var(--border)'
            }}>
              {['monthly','weekly'].map(m => (
                <button key={m}
                  onClick={() => setChartMode(m)}
                  style={{
                    padding:'6px 18px', borderRadius:99, border:'none', cursor:'pointer',
                    fontSize:13, fontWeight:700, fontFamily:'var(--font-body)',
                    transition:'all 0.18s',
                    background: chartMode === m ? 'var(--teal)' : 'transparent',
                    color:      chartMode === m ? 'white' : 'var(--text3)',
                    boxShadow:  chartMode === m ? '0 2px 8px rgba(6,148,148,0.35)' : 'none',
                  }}>
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>

            {/* Year selector */}
            {chartMode === 'monthly' && (
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                style={{
                  padding:'7px 14px', borderRadius:99,
                  border:'1.5px solid var(--border)', fontSize:13,
                  fontFamily:'var(--font-body)', fontWeight:600,
                  background:'var(--surface3)', color:'var(--text2)',
                  outline:'none', cursor:'pointer',
                }}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="chart-body">
          {(chartMode === 'monthly' && !hasMonthly) || (chartMode === 'weekly' && !hasWeekly) ? (
            <div className="empty-state" style={{ padding:'36px 24px' }}>
              <div className="empty-icon"><BarIcon /></div>
              <h4>No data for this period</h4>
              <p>Add orders to see your chart</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={chartMode === 'monthly' ? monthly : weekly}
                margin={{ top:16, right:16, left:0, bottom:8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey={chartMode === 'monthly' ? 'month' : 'label'}
                  tick={{ fontSize:12, fontFamily:'Outfit,sans-serif', fill:'var(--text3)' }}
                  axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize:12, fontFamily:'Outfit,sans-serif', fill:'var(--text3)' }}
                  tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                  axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(6,148,148,0.05)' }} />
                <Legend wrapperStyle={{ fontFamily:'Outfit,sans-serif', fontSize:13, paddingTop:16 }} />
                <Bar dataKey="total_amount" name="Order Amount (₹)" fill="#069494" radius={[6,6,0,0]} />
                <Bar dataKey="credited"     name="Credited (₹)"      fill="#FF69B4" radius={[6,6,0,0]} />
                <Bar dataKey="order_count"  name="No. of Orders"     fill="#00b8c9" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Pie + Table Row ── */}
      <div className="chart-grid">

        {/* Pie */}
        <div className="chart-card">
          <div className="chart-head">
            <h4><PieIcon />Orders by Organization</h4>
          </div>
          <div className="chart-body">
            {!hasOrg ? (
              <div className="empty-state" style={{ padding:'36px 24px' }}>
                <div className="empty-icon"><PieIcon /></div>
                <h4>No data yet</h4>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={byOrg} cx="50%" cy="50%"
                      innerRadius={58} outerRadius={96}
                      dataKey="total_amount" nameKey="org_name"
                      isAnimationActive={false} paddingAngle={2}>
                      {byOrg.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px 16px', marginTop:12 }}>
                  {byOrg.map((o, i) => (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12.5, color:'var(--text2)', fontWeight:500 }}>
                      <div style={{ width:9, height:9, borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }} />
                      {o.org_name} <span style={{ color:'var(--text3)', fontWeight:400 }}>({o.order_count})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary table */}
        <div className="chart-card">
          <div className="chart-head">
            <h4><Layers />Organization Summary</h4>
          </div>
          <div style={{ padding:0 }}>
            {!hasOrg ? (
              <div className="empty-state" style={{ padding:'36px 24px' }}><h4>No data</h4></div>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <thead>
                  <tr>
                    {['Organization','Orders','Total Value'].map((h,i) => (
                      <th key={h} style={{
                        padding:'11px 18px', background:'var(--surface3)',
                        color:'var(--text3)', fontSize:11, textTransform:'uppercase',
                        letterSpacing:'0.7px', fontWeight:700, fontFamily:'var(--font-body)',
                        textAlign: i === 0 ? 'left' : 'right',
                        borderBottom:'1.5px solid var(--border)',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byOrg.map((o, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'11px 18px', display:'flex', alignItems:'center', gap:10, fontSize:14, fontWeight:500 }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }} />
                        {o.org_name}
                      </td>
                      <td style={{ padding:'11px 18px', textAlign:'right', color:'var(--text3)', fontSize:14 }}>{o.order_count}</td>
                      <td style={{ padding:'11px 18px', textAlign:'right', fontWeight:700, color:'var(--teal)', fontSize:14, fontFamily:'var(--font-mono)' }}>{formatINR(o.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}