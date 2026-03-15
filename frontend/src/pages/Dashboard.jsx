// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { apiFetch, formatINR } from '../utils/api';
import OrdersPage from './OrdersPage';
import KharidiPage from './KharidiPage';
import AnalyticsPage from './AnalyticsPage';
import { LogoBook, Package, ShoppingBag, BarChart, LogOut, Menu, Wallet, CheckCircle, Clock, TrendingUp } from '../icons';

const NAV = [
  { id: 'orders',    Icon: Package,     gu: 'ઓર્ડર / વિક્રી', en: 'Orders' },
  { id: 'kharidi',   Icon: ShoppingBag, gu: 'ખરીદી',           en: 'Kharidi' },
  { id: 'analytics', Icon: BarChart,    gu: 'વિશ્લેષણ',         en: 'Analytics' },
];

const PAGE_TITLE = { orders: 'Orders / ઓર્ડર', kharidi: 'Kharidi / ખરીદી', analytics: 'Analytics / વિશ્લેષણ' };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState('orders');
  const [kpi, setKpi] = useState(null);
  const [open, setOpen] = useState(false);

  const loadKpi = async () => {
    try { setKpi(await apiFetch('orders.php?action=kpi')); } catch {}
  };
  useEffect(() => { loadKpi(); }, []);

  return (
    <div className="dashboard">
      {/* overlay for mobile */}
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* ─── Sidebar ─── */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark"><LogoBook /></div>
          <div>
            <div className="brand-title">Hisa<span>b</span></div>
            <div className="brand-firm">{user?.firm_name}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ id, Icon, gu, en }) => (
            <div key={id} className={`nav-item ${page === id ? 'active' : ''}`}
              onClick={() => { setPage(id); setOpen(false); }}>
              <div className="nav-icon-wrap"><Icon /></div>
              <div className="nav-labels">
                <span className="nav-gu">{gu}</span>
                <span className="nav-en">{en}</span>
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="sidebar-username">{user?.name}</div>
          </div>
          <button className="sidebar-logout" onClick={logout}>
            <LogOut /> Sign out
          </button>
        </div>
      </aside>

      {/* ─── Main ─── */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <button className="menu-btn" onClick={() => setOpen(o => !o)}><Menu /></button>
            <span className="topbar-title">{PAGE_TITLE[page]}</span>
          </div>
          <div>
            <span className="topbar-firm">{user?.firm_name}</span>
          </div>
        </div>

        <div className="page-body">
          {/* KPI row */}
          {kpi && (
            <div className="kpi-grid">
              <div className="kpi-card c-teal">
                <div className="kpi-stripe" />
                <div className="kpi-bg"><Package /></div>
                <div className="kpi-label">Total Orders</div>
                <div className="kpi-val">{kpi.total_orders}</div>
                <div className="kpi-footer">All time count</div>
              </div>
              <div className="kpi-card c-pink">
                <div className="kpi-stripe" />
                <div className="kpi-bg"><TrendingUp /></div>
                <div className="kpi-label">Total Order Value</div>
                <div className="kpi-val v-pink">{formatINR(kpi.total_order_value)}</div>
                <div className="kpi-footer">Sum of all orders</div>
              </div>
              <div className="kpi-card c-green">
                <div className="kpi-stripe" />
                <div className="kpi-bg"><CheckCircle /></div>
                <div className="kpi-label">Credited / જમા</div>
                <div className="kpi-val v-green">{formatINR(kpi.total_credited)}</div>
                <div className="kpi-footer">Amount received</div>
              </div>
              <div className="kpi-card c-red">
                <div className="kpi-stripe" />
                <div className="kpi-bg"><Clock /></div>
                <div className="kpi-label">Pending / બાકી</div>
                <div className="kpi-val v-red">{formatINR(kpi.total_pending)}</div>
                <div className="kpi-footer">Yet to be received</div>
              </div>
            </div>
          )}

          {page === 'orders'    && <OrdersPage onDataChange={loadKpi} />}
          {page === 'kharidi'   && <KharidiPage onDataChange={loadKpi} />}
          {page === 'analytics' && <AnalyticsPage />}
        </div>
      </div>
    </div>
  );
}