// src/utils/api.js
export const API_BASE = 'http://localhost/kamdhenu/api';

export function getToken() {
  return localStorage.getItem('vs_token') || '';
}

export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    }
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API Error');
  return data;
}

export function formatINR(amount) {
  const n = parseFloat(amount) || 0;
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusBadge(status) {
  switch (status) {
    case 'credited': return { cls: 'badge-success', label: 'Credited ✓' };
    case 'partial':  return { cls: 'badge-warning', label: 'Partial' };
    default:         return { cls: 'badge-danger',  label: 'Pending' };
  }
}