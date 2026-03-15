// src/pages/Auth.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth, API_BASE } from '../App';
import { LogoBook, AlertCircle } from '../icons';

/* ─────────────────────────────────────────
   Interactive canvas: floating nodes with
   orbiting connections, mouse parallax,
   pulsing rings — pure JS/canvas art
───────────────────────────────────────── */
function HeroCanvas() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const raf   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    let W, H;

    // ── Palette ──
    const TEAL  = '#069494';
    const PINK  = '#FF69B4';
    const CYAN  = '#00F0FF';
    const WHITE = '#ffffff';

    // ── Resize ──
    const resize = () => {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Mouse ──
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('mousemove', onMove);

    // ── Nodes ──
    const NODE_COUNT = 18;
    const nodes = Array.from({ length: NODE_COUNT }, (_, i) => ({
      x:    Math.random() * 1,   // fraction of W
      y:    Math.random() * 1,   // fraction of H
      vx:   (Math.random() - 0.5) * 0.0004,
      vy:   (Math.random() - 0.5) * 0.0004,
      r:    3 + Math.random() * 5,
      color: [TEAL, PINK, CYAN, WHITE][Math.floor(Math.random() * 4)],
      pulse: Math.random() * Math.PI * 2,
      pulseSpeed: 0.02 + Math.random() * 0.02,
      // floating card data
      isCard: i < 5,
      cardW:  90 + Math.random() * 40,
      cardH:  50 + Math.random() * 20,
      label:  ['Orders','Revenue','Profit','Kharidi','Pending'][i] || '',
      value:  ['142','₹8.4L','₹1.2L','₹3.1L','₹90K'][i] || '',
      cardColor: [TEAL, PINK, CYAN, TEAL, PINK][i] || TEAL,
    }));

    // ── Particles ──
    const PART_COUNT = 55;
    const parts = Array.from({ length: PART_COUNT }, () => ({
      x:  Math.random(),
      y:  Math.random(),
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      r:  0.8 + Math.random() * 1.8,
      a:  0.15 + Math.random() * 0.35,
      color: [TEAL, PINK, CYAN][Math.floor(Math.random() * 3)],
    }));

    // ── Rings ──
    const rings = Array.from({ length: 3 }, (_, i) => ({
      phase: (i / 3) * Math.PI * 2,
      speed: 0.008 + i * 0.003,
      maxR:  Math.min(W, H) * (0.18 + i * 0.12),
    }));

    let t = 0;

    const draw = () => {
      t += 1;
      const mx = mouse.current.x || W / 2;
      const my = mouse.current.y || H / 2;
      const px = (mx / W - 0.5) * 28;
      const py = (my / H - 0.5) * 28;

      // Background
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, '#021a1a');
      grad.addColorStop(0.5, '#032828');
      grad.addColorStop(1, '#021212');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.save();
      ctx.strokeStyle = 'rgba(0,240,255,0.04)';
      ctx.lineWidth = 1;
      const GRID = 48;
      for (let gx = 0; gx < W; gx += GRID) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += GRID) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
      ctx.restore();

      // Radial glow blobs
      const blobs = [
        { cx: W * 0.8, cy: H * 0.2, r: W * 0.4, color: 'rgba(0,240,255,0.07)' },
        { cx: W * 0.15, cy: H * 0.8, r: W * 0.38, color: 'rgba(255,105,180,0.06)' },
        { cx: W * 0.5 + px * 0.5, cy: H * 0.5 + py * 0.5, r: W * 0.25, color: 'rgba(6,148,148,0.05)' },
      ];
      blobs.forEach(b => {
        const g = ctx.createRadialGradient(b.cx, b.cy, 0, b.cx, b.cy, b.r);
        g.addColorStop(0, b.color); g.addColorStop(1, 'transparent');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(b.cx, b.cy, b.r, 0, Math.PI * 2); ctx.fill();
      });

      // Animated pulsing rings
      rings.forEach((ring, i) => {
        ring.phase += ring.speed;
        const cx = W * 0.5 + px * 0.3;
        const cy = H * 0.5 + py * 0.3;
        const r  = ring.maxR * (0.7 + 0.3 * Math.sin(ring.phase));
        const a  = 0.06 + 0.04 * Math.sin(ring.phase + 1);
        ctx.save();
        ctx.strokeStyle = i % 2 === 0 ? `rgba(0,240,255,${a})` : `rgba(255,105,180,${a})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      });

      // Particles
      parts.forEach(p => {
        p.x += p.vx + (mx / W - 0.5) * 0.0001;
        p.y += p.vy + (my / H - 0.5) * 0.0001;
        if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.03 + p.x * 10);
        ctx.save();
        ctx.globalAlpha = p.a * pulse;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Update nodes
      nodes.forEach(n => {
        n.x += n.vx + (mx / W - 0.5) * 0.00008;
        n.y += n.vy + (my / H - 0.5) * 0.00008;
        if (n.x < 0.05) n.vx =  Math.abs(n.vx);
        if (n.x > 0.95) n.vx = -Math.abs(n.vx);
        if (n.y < 0.05) n.vy =  Math.abs(n.vy);
        if (n.y > 0.95) n.vy = -Math.abs(n.vy);
        n.pulse += n.pulseSpeed;
      });

      // Connections between nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 160;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.25;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = CYAN;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x * W, a.y * H);
            ctx.lineTo(b.x * W, b.y * H);
            ctx.stroke();
            // moving dot along line
            const progress = (Math.sin(t * 0.018 + i + j) * 0.5 + 0.5);
            const dotX = a.x * W + (b.x * W - a.x * W) * progress;
            const dotY = a.y * H + (b.y * H - a.y * H) * progress;
            ctx.globalAlpha = alpha * 1.8;
            ctx.fillStyle = CYAN;
            ctx.beginPath(); ctx.arc(dotX, dotY, 1.5, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
          }
        }
      }

      // Draw card nodes
      nodes.filter(n => n.isCard).forEach((n, idx) => {
        const x  = n.x * W + px * (0.04 + idx * 0.01);
        const y  = n.y * H + py * (0.04 + idx * 0.01);
        const cw = n.cardW, ch = n.cardH;
        const rx = 10;
        const pls = 0.5 + 0.5 * Math.sin(n.pulse);

        // Card glow
        ctx.save();
        ctx.shadowColor = n.cardColor;
        ctx.shadowBlur  = 12 + pls * 10;
        ctx.globalAlpha = 0.85;

        // Card background
        ctx.fillStyle = 'rgba(10,40,40,0.82)';
        ctx.beginPath();
        ctx.roundRect(x - cw/2, y - ch/2, cw, ch, rx);
        ctx.fill();

        // Card border
        ctx.strokeStyle = n.cardColor + '60';
        ctx.lineWidth   = 1.2;
        ctx.stroke();
        ctx.restore();

        // Colored top bar
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = n.cardColor;
        ctx.beginPath();
        ctx.roundRect(x - cw/2, y - ch/2, cw, 3, [rx, rx, 0, 0]);
        ctx.fill();
        ctx.restore();

        // Card text — label
        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = WHITE;
        ctx.font = `600 9px 'Outfit', sans-serif`;
        ctx.letterSpacing = '0.6px';
        ctx.textAlign = 'center';
        ctx.fillText(n.label.toUpperCase(), x, y - ch/2 + 16);

        // Card text — value
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = n.cardColor === PINK ? PINK : (n.cardColor === CYAN ? CYAN : '#7fffff');
        ctx.font = `700 15px 'JetBrains Mono', monospace`;
        ctx.fillText(n.value, x, y + 6);
        ctx.restore();
      });

      // Draw dot nodes (non-card)
      nodes.filter(n => !n.isCard).forEach(n => {
        const x   = n.x * W + px * 0.05;
        const y   = n.y * H + py * 0.05;
        const pls = 0.5 + 0.5 * Math.sin(n.pulse);
        const r   = n.r * (0.9 + 0.1 * pls);

        ctx.save();
        ctx.shadowColor = n.color; ctx.shadowBlur = 8 + pls * 8;
        ctx.globalAlpha = 0.7 + 0.3 * pls;
        ctx.fillStyle = n.color;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // outer ring
        ctx.save();
        ctx.globalAlpha = 0.15 + 0.1 * pls;
        ctx.strokeStyle = n.color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x, y, r * 2.5, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      });

      // Center brand mark
      const cx = W * 0.5 + px * 0.2, cy = H * 0.5 + py * 0.2;
      const brandR = 28 + 2 * Math.sin(t * 0.02);
      ctx.save();
      ctx.shadowColor = TEAL; ctx.shadowBlur = 30;
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, brandR);
      bg.addColorStop(0, '#0bbcbc'); bg.addColorStop(1, '#069494');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(cx, cy, brandR, 0, Math.PI * 2); ctx.fill();
      ctx.restore();

      // "H" letter in center
      ctx.save();
      ctx.fillStyle = PINK;
      ctx.font = `900 24px 'Outfit', sans-serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor  = PINK; ctx.shadowBlur = 12;
      ctx.fillText('H', cx, cy + 1);
      ctx.restore();

      raf.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block', cursor:'crosshair' }}
    />
  );
}

/* ─────────────────────────────────────────
   Auth page
───────────────────────────────────────── */
export default function Auth() {
  const { login } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name:'', email:'', password:'', firm_name:'' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setError('');
    if (mode === 'register' && (!form.name || !form.email || !form.password || !form.firm_name)) {
      setError('Please fill all fields'); return;
    }
    if (mode === 'login' && (!form.email || !form.password)) {
      setError('Email and password are required'); return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth.php?action=${mode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Something went wrong'); return; }
      login(data.token, data.user);
    } catch {
      setError('Cannot connect to server. Is XAMPP running?');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* ─── Left: pure interactive canvas ─── */}
      <div className="auth-hero" style={{ position:'relative', overflow:'hidden', padding:0 }}>
        <HeroCanvas />
      </div>

      {/* ─── Right: form ─── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-icon"><LogoBook /></div>
            <span className="auth-brand-name">Hisa<span>b</span></span>
          </div>
          <h2>{mode === 'login' ? 'Welcome back' : 'Get started'}</h2>
          <p className="auth-card-sub">
            {mode === 'login' ? 'Sign in to your business account' : 'Create your business account'}
          </p>

          {error && <div className="alert alert-error"><AlertCircle />{error}</div>}

          {mode === 'register' && (
            <>
              <div className="form-group">
                <label>Your Name</label>
                <input placeholder="Ramesh Patel" value={form.name} onChange={e => set('name', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Firm / Company Name</label>
                <input placeholder="Your Business Name" value={form.firm_name} onChange={e => set('firm_name', e.target.value)} />
              </div>
            </>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => set('password', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <button className="btn btn-primary btn-full btn-lg" style={{ marginTop:4 }} onClick={submit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
          <div className="auth-toggle">
            {mode === 'login'
              ? <>New account? <button onClick={() => { setMode('register'); setError(''); }}>Register</button></>
              : <>Have an account? <button onClick={() => { setMode('login'); setError(''); }}>Sign In</button></>}
          </div>
        </div>
      </div>
    </div>
  );
}