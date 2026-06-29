'use client';
import { useState, useEffect } from 'react';

// ─── Risk config — HIGH RISK & BLACKLIST only ─────────────────────
const RISK = {
  high:      { label: 'High Risk', dot: '🔴', color: '#b71c1c', bg: '#ffebee', border: '#e53935' },
  blacklist: { label: 'Blacklist', dot: '⚫', color: '#111',    bg: '#f5f5f5', border: '#424242' },
};

function fmt(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
}

const S = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100, padding: 0 },
  modal:   { background: '#fff', borderRadius: '16px 16px 0 0', padding: 24, width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto' },
  input:   { width: '100%', padding: '10px 13px', border: '1px solid #ddd', borderRadius: 9, fontSize: 14, boxSizing: 'border-box', outline: 'none' },
  label:   { fontSize: 12, color: '#777', fontWeight: 600, marginBottom: 4, display: 'block' },
  btn:     (bg, color='#fff') => ({ padding: '11px 22px', background: bg, color, border: 'none', borderRadius: 9, fontWeight: 700, fontSize: 14, cursor: 'pointer' }),
};

// ══════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════
function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }
    localStorage.setItem('ia_user', JSON.stringify(data));
    onLogin(data);
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f9' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 36, width: '100%', maxWidth: 380, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
          <div style={{ fontWeight: 900, fontSize: 22, color: '#111' }}>Internal Alerts</div>
          <div style={{ color: '#888', fontSize: 13, marginTop: 4 }}>Staff Login</div>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={S.label}>Username</label>
            <input style={S.input} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required autoComplete="username" />
          </div>
          <div>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required autoComplete="current-password" />
          </div>
          {error && <div style={{ color: '#c62828', fontSize: 13, textAlign: 'center' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ ...S.btn('#1565c0'), marginTop: 4, padding: '13px', fontSize: 15 }}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// FLAG POPUP — shown when no record found
// ══════════════════════════════════════════════════════════════════
function FlagPopup({ prefillIC, prefillPassport, user, onSaved, onDismiss }) {
  const [form, setForm] = useState({
    customer_name: '',
    ic_number: prefillIC || '',
    passport_number: prefillPassport || '',
    risk_level: 'high',
    reason: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e && e.preventDefault();
    if (!confirm) { setConfirm(true); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/customer-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, added_by: user.name, added_by_role: user.role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSaved(data);
    } catch (err) { setError(err.message); setSaving(false); setConfirm(false); }
  }

  if (confirm) return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#b71c1c', marginBottom: 12 }}>
          ⚠️ Confirm {form.risk_level === 'blacklist' ? 'BLACKLIST' : 'HIGH RISK'} Flag
        </div>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>
          You are flagging <strong>{form.customer_name}</strong> as <strong>{RISK[form.risk_level]?.label}</strong>.<br />
          Reason: <em>{form.reason}</em><br />
          This action will be logged.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
          <button onClick={submit} disabled={saving} style={S.btn('#b71c1c')}>{saving ? 'Saving…' : 'Yes, Flag Customer'}</button>
          <button onClick={() => setConfirm(false)} style={S.btn('#f5f5f5', '#555')}>Cancel</button>
        </div>
        {error && <div style={{ color: '#c62828', fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onDismiss()}>
      <div style={S.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>🚩 Flag This Customer?</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>No existing record found. Add a flag if needed.</div>
          </div>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#aaa' }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
          <div>
            <label style={S.label}>Customer Name *</label>
            <input style={S.input} value={form.customer_name} onChange={e => set('customer_name', e.target.value)} placeholder="Full name" required />
          </div>
          <div>
            <label style={S.label}>IC Number</label>
            <input style={S.input} value={form.ic_number} onChange={e => set('ic_number', e.target.value)} placeholder="e.g. 900101-10-1234" />
          </div>
          <div>
            <label style={S.label}>Passport Number</label>
            <input style={S.input} value={form.passport_number} onChange={e => set('passport_number', e.target.value)} placeholder="e.g. A12345678" />
          </div>
          <div>
            <label style={S.label}>Risk Level *</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {Object.entries(RISK).map(([k, v]) => (
                <button
                  key={k} type="button"
                  onClick={() => set('risk_level', k)}
                  style={{ flex: 1, padding: '10px', borderRadius: 9, border: `2px solid ${form.risk_level === k ? v.color : '#ddd'}`, background: form.risk_level === k ? v.bg : '#fff', color: form.risk_level === k ? v.color : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  {v.dot} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={S.label}>Reason *</label>
            <input style={S.input} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Threatened staff, Fraud suspected" required />
          </div>
          <div>
            <label style={S.label}>Description (optional)</label>
            <textarea style={{ ...S.input, resize: 'vertical' }} rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="More details about the incident..." />
          </div>
          {error && <div style={{ color: '#c62828', fontSize: 13 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="submit" style={S.btn('#b71c1c')}>🚩 Flag Customer</button>
            <button type="button" onClick={onDismiss} style={S.btn('#f5f5f5', '#555')}>No, Continue</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// SEARCH TAB
// ══════════════════════════════════════════════════════════════════
function SearchTab({ user }) {
  const [type, setType] = useState('ic');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [showFlag, setShowFlag] = useState(false);

  async function search(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setResults(null); setShowFlag(false);
    const param = type === 'ic' ? `ic=${encodeURIComponent(query)}` : type === 'passport' ? `passport=${encodeURIComponent(query)}` : `name=${encodeURIComponent(query)}`;
    const res = await fetch(`/api/customer-alerts?${param}&status=active`);
    const data = await res.json();
    const found = Array.isArray(data) ? data : [];
    setResults(found);
    setLoading(false);
    // Auto-show flag popup if no record found
    if (found.length === 0) setShowFlag(true);
  }

  function handleFlagSaved(data) {
    setShowFlag(false);
    setResults([data]);
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>🔍 Search Customer</div>
      <div style={{ color: '#888', fontSize: 13, marginBottom: 18 }}>Check alert status before processing any application.</div>

      <form onSubmit={search} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <select value={type} onChange={e => { setType(e.target.value); setResults(null); setShowFlag(false); }} style={{ ...S.input, width: 'auto' }}>
          <option value="ic">IC Number</option>
          <option value="passport">Passport Number</option>
          <option value="name">Customer Name</option>
        </select>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            style={{ ...S.input, flex: 1 }}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={type === 'ic' ? '900101-10-1234' : type === 'passport' ? 'A12345678' : 'Customer name...'}
            required
          />
          <button type="submit" disabled={loading} style={S.btn('#1565c0')}>
            {loading ? '…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Not searched yet */}
      {results === null && !loading && (
        <div style={{ marginTop: 24, padding: 20, background: '#f9f9f9', borderRadius: 12, color: '#aaa', textAlign: 'center', fontSize: 14 }}>
          Enter details above to check customer status
        </div>
      )}

      {/* Flagged results */}
      {results !== null && results.map(alert => {
        const r = RISK[alert.risk_level] || RISK.high;
        return (
          <div key={alert.id} style={{ marginTop: 16, border: `2px solid ${r.border}`, borderRadius: 12, padding: 20, background: r.bg }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: r.color, marginBottom: 10 }}>⚠️ INTERNAL ALERT — {r.dot} {r.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '7px 10px', fontSize: 14 }}>
              {[['Name', alert.customer_name], ['IC', alert.ic_number || '—'], ['Passport', alert.passport_number || '—'], ['Reason', alert.reason], ['Date Added', fmt(alert.created_at)], ['Added By', alert.added_by]].map(([k, v]) => (
                <><span key={k} style={{ color: '#666', fontWeight: 600 }}>{k}</span><span key={k+'v'} style={{ fontWeight: k === 'Reason' ? 700 : 400 }}>{v}</span></>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={() => setViewing(alert.id)} style={S.btn(r.color)}>View Full Details</button>
              <button onClick={() => { setResults(null); setQuery(''); }} style={S.btn('#fff', '#555')}>✕ Clear Search</button>
            </div>
          </div>
        );
      })}

      {/* Flag popup — auto shows when no record */}
      {showFlag && (
        <FlagPopup
          prefillIC={type === 'ic' ? query : ''}
          prefillPassport={type === 'passport' ? query : ''}
          user={user}
          onSaved={handleFlagSaved}
          onDismiss={() => setShowFlag(false)}
        />
      )}

      {viewing && <DetailModal id={viewing} user={user} onClose={() => setViewing(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DASHBOARD TAB
// ══════════════════════════════════════════════════════════════════
function DashboardTab({ user, onAddNew }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [filter, setFilter] = useState('all');

  function load() {
    fetch('/api/customer-alerts?status=active')
      .then(r => r.json())
      .then(d => { setAlerts(Array.isArray(d) ? d : []); setLoading(false); });
  }
  useEffect(load, []);

  const counts = {
    all: alerts.length,
    high: alerts.filter(a => a.risk_level === 'high').length,
    blacklist: alerts.filter(a => a.risk_level === 'blacklist').length,
  };

  const filtered = filter === 'all' ? alerts : alerts.filter(a => a.risk_level === filter);

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>📊 Dashboard</div>
        {user.role === 'admin' && (
          <button onClick={onAddNew} style={S.btn('#b71c1c')}>+ Add Alert</button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { key: 'all', label: 'Total Flagged', color: '#1565c0', bg: '#e3f2fd' },
          { key: 'high', label: 'High Risk', color: '#b71c1c', bg: '#ffebee' },
          { key: 'blacklist', label: 'Blacklisted', color: '#111', bg: '#f5f5f5' },
        ].map(s => (
          <div key={s.key} onClick={() => setFilter(s.key)} style={{ background: s.bg, borderRadius: 12, padding: '14px 8px', textAlign: 'center', cursor: 'pointer', border: filter === s.key ? `2px solid ${s.color}` : '2px solid transparent' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: s.color }}>{loading ? '…' : counts[s.key]}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {['all', 'high', 'blacklist'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: '5px 14px', borderRadius: 20, border: '1px solid #ddd', background: filter === f ? '#1565c0' : '#fff', color: filter === f ? '#fff' : '#555', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {f === 'all' ? 'All' : RISK[f]?.dot + ' ' + RISK[f]?.label}
          </button>
        ))}
      </div>

      {loading ? <div style={{ color: '#aaa', textAlign: 'center', padding: 30 }}>Loading…</div>
        : filtered.length === 0 ? <div style={{ color: '#aaa', textAlign: 'center', padding: 30, fontSize: 14 }}>No alerts found.</div>
        : filtered.map(a => {
          const r = RISK[a.risk_level] || RISK.high;
          return (
            <div key={a.id} onClick={() => setViewing(a.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #eee', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{a.customer_name}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{a.ic_number || a.passport_number || '—'} · {a.reason}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 1 }}>Added by {a.added_by} · {fmt(a.created_at)}</div>
              </div>
              <span style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}`, borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: 10 }}>
                {r.dot} {r.label}
              </span>
            </div>
          );
        })
      }

      {viewing && <DetailModal id={viewing} user={user} onClose={(reload) => { setViewing(null); if (reload) load(); }} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// DETAIL MODAL
// ══════════════════════════════════════════════════════════════════
function DetailModal({ id, user, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch(`/api/customer-alerts/${id}`, { headers: { 'x-user-name': user.name, 'x-user-role': user.role } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, [id]);

  async function remove() {
    if (!confirm('Remove this alert? Action will be logged.')) return;
    await fetch(`/api/customer-alerts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changed_by: user.name, changed_by_role: user.role, notes: 'Alert removed' })
    });
    onClose(true);
  }

  if (loading) return <div style={S.overlay}><div style={S.modal}><div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading…</div></div></div>;
  if (!data) return null;

  const { alert, audit } = data;
  const r = RISK[alert.risk_level] || RISK.high;

  if (editing) return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <AlertForm initial={alert} user={user} onSave={() => onClose(true)} onCancel={() => setEditing(false)} />
      </div>
    </div>
  );

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Alert Details</div>
          <button onClick={() => onClose()} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>×</button>
        </div>
        <div style={{ background: r.bg, border: `1px solid ${r.border}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: r.color }}>{r.dot} {r.label}</div>
          <div style={{ fontSize: 13, color: '#555', marginTop: 3 }}>{alert.reason}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 10px', fontSize: 13, marginBottom: 16 }}>
          {[['Name', alert.customer_name], ['IC Number', alert.ic_number || '—'], ['Passport', alert.passport_number || '—'], ['Status', alert.status === 'active' ? '✅ Active' : '❌ Removed'], ['Added By', `${alert.added_by} (${alert.added_by_role})`], ['Date Added', fmt(alert.created_at)], ['Review Date', fmt(alert.review_date)]].map(([k, v]) => (
            <><span key={k} style={{ color: '#888', fontWeight: 600 }}>{k}</span><span key={k+'v'}>{v}</span></>
          ))}
        </div>
        {alert.description && (
          <div style={{ background: '#f9f9f9', borderRadius: 8, padding: 12, fontSize: 13, marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Description</div>
            <div style={{ color: '#444', lineHeight: 1.6 }}>{alert.description}</div>
          </div>
        )}
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Audit Log</div>
        <div style={{ maxHeight: 160, overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, marginBottom: 16 }}>
          {audit.length === 0 ? <div style={{ padding: 14, color: '#aaa', fontSize: 13 }}>No log entries.</div>
            : audit.map(log => (
              <div key={log.id} style={{ padding: '9px 13px', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: '#333' }}>{log.action.toUpperCase()} — {log.changed_by}</div>
                {log.notes && <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{log.notes}</div>}
                <div style={{ fontSize: 10, color: '#bbb', marginTop: 1 }}>{fmt(log.created_at)}</div>
              </div>
            ))
          }
        </div>
        {user.role === 'admin' && alert.status === 'active' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setEditing(true)} style={S.btn('#1565c0')}>Edit Alert</button>
            <button onClick={remove} style={S.btn('#fff', '#c62828')}>Remove Alert</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ADD / EDIT FORM
// ══════════════════════════════════════════════════════════════════
function AlertForm({ initial, user, onSave, onCancel }) {
  const [form, setForm] = useState({ customer_name: '', ic_number: '', passport_number: '', risk_level: 'high', reason: '', description: '', review_date: '', ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function submit(e) {
    e && e.preventDefault();
    if (!confirm) { setConfirm(true); return; }
    setSaving(true); setError('');
    try {
      const isEdit = !!initial?.id;
      const res = await fetch(isEdit ? `/api/customer-alerts/${initial.id}` : '/api/customer-alerts', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, added_by: user.name, added_by_role: user.role, changed_by: user.name, changed_by_role: user.role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      onSave(data);
    } catch (err) { setError(err.message); setSaving(false); setConfirm(false); }
  }

  if (confirm) return (
    <div>
      <div style={{ fontWeight: 800, fontSize: 16, color: '#b71c1c', marginBottom: 12 }}>⚠️ Confirm {form.risk_level === 'blacklist' ? 'BLACKLIST' : 'HIGH RISK'} Flag</div>
      <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>Flagging <strong>{form.customer_name}</strong> as <strong>{RISK[form.risk_level]?.label}</strong>.<br />Reason: <em>{form.reason}</em><br />This will be logged.</p>
      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <button onClick={submit} disabled={saving} style={S.btn('#b71c1c')}>{saving ? 'Saving…' : 'Yes, Confirm'}</button>
        <button onClick={() => setConfirm(false)} style={S.btn('#f5f5f5', '#555')}>Cancel</button>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>{initial?.id ? 'Edit Alert' : '➕ Add Alert'}</div>
        <button type="button" onClick={onCancel} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#999' }}>×</button>
      </div>
      {[['Customer Name *', 'customer_name', true], ['IC Number', 'ic_number', false], ['Passport Number', 'passport_number', false]].map(([lbl, key, req]) => (
        <div key={key}>
          <label style={S.label}>{lbl}</label>
          <input style={S.input} value={form[key]} onChange={e => set(key, e.target.value)} required={req} />
        </div>
      ))}
      <div>
        <label style={S.label}>Risk Level *</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {Object.entries(RISK).map(([k, v]) => (
            <button key={k} type="button" onClick={() => set('risk_level', k)} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `2px solid ${form.risk_level === k ? v.color : '#ddd'}`, background: form.risk_level === k ? v.bg : '#fff', color: form.risk_level === k ? v.color : '#555', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              {v.dot} {v.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label style={S.label}>Reason *</label>
        <input style={S.input} value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="e.g. Threatened staff, Fraud suspected" required />
      </div>
      <div>
        <label style={S.label}>Description (optional)</label>
        <textarea style={{ ...S.input, resize: 'vertical' }} rows={4} value={form.description} onChange={e => set('description', e.target.value)} />
      </div>
      {error && <div style={{ color: '#c62828', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" style={S.btn('#b71c1c')}>Save Alert</button>
        <button type="button" onClick={onCancel} style={S.btn('#f5f5f5', '#555')}>Cancel</button>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════
// STAFF TAB
// ══════════════════════════════════════════════════════════════════
function StaffTab({ user }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'staff' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function load() { fetch('/api/staff').then(r => r.json()).then(d => { setStaff(Array.isArray(d) ? d : []); setLoading(false); }); }
  useEffect(load, []);

  async function addStaff(e) {
    e.preventDefault(); setSaving(true); setError('');
    const res = await fetch('/api/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    setForm({ name: '', username: '', password: '', role: 'staff' }); setShowAdd(false); setSaving(false); load();
  }

  async function removeStaff(id, name) {
    if (!confirm(`Remove ${name}?`)) return;
    await fetch('/api/staff', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div style={{ padding: 16, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontWeight: 800, fontSize: 18 }}>👥 Staff Accounts</div>
        <button onClick={() => setShowAdd(s => !s)} style={S.btn('#1565c0')}>+ Add Staff</button>
      </div>
      {showAdd && (
        <div style={{ background: '#f9f9f9', borderRadius: 12, padding: 18, marginBottom: 20, border: '1px solid #e0e0e0' }}>
          <form onSubmit={addStaff} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['Full Name *', 'name', 'text'], ['Username *', 'username', 'text'], ['Password *', 'password', 'password']].map(([lbl, key, type]) => (
              <div key={key}><label style={S.label}>{lbl}</label><input style={S.input} type={type} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required /></div>
            ))}
            <div>
              <label style={S.label}>Role</label>
              <select style={S.input} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="staff">Staff — search & view only</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>
            {error && <div style={{ color: '#c62828', fontSize: 13 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={saving} style={S.btn('#1565c0')}>{saving ? 'Saving…' : 'Create Account'}</button>
              <button type="button" onClick={() => setShowAdd(false)} style={S.btn('#f5f5f5', '#555')}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      {loading ? <div style={{ color: '#aaa', textAlign: 'center', padding: 30 }}>Loading…</div>
        : staff.map(s => (
          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: '#fff', borderRadius: 10, marginBottom: 8, border: '1px solid #eee' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>@{s.username} · {s.role === 'admin' ? '🔑 Admin' : '👤 Staff'}</div>
            </div>
            {s.id !== user.id && <button onClick={() => removeStaff(s.id, s.name)} style={{ background: 'none', border: '1px solid #f44336', color: '#f44336', borderRadius: 7, padding: '5px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Remove</button>}
          </div>
        ))
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('search');
  const [showAddAlert, setShowAddAlert] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ia_user');
    if (saved) try { setUser(JSON.parse(saved)); } catch {}
  }, []);

  function logout() { localStorage.removeItem('ia_user'); setUser(null); }

  if (!user) return <Login onLogin={u => setUser(u)} />;

  const navTabs = [
    { key: 'search', label: '🔍 Search' },
    { key: 'dashboard', label: '📊 Dashboard' },
    ...(user.role === 'admin' ? [{ key: 'staff', label: '👥 Staff' }] : []),
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6f9', paddingBottom: 80 }}>
      <div style={{ background: '#1565c0', color: '#fff', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 50 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 17 }}>⚠️ Internal Alerts</div>
          <div style={{ fontSize: 11, opacity: 0.8 }}>{user.name} · {user.role}</div>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Logout</button>
      </div>

      <div>
        {tab === 'search' && <SearchTab user={user} />}
        {tab === 'dashboard' && !showAddAlert && <DashboardTab user={user} onAddNew={() => setShowAddAlert(true)} />}
        {tab === 'staff' && user.role === 'admin' && <StaffTab user={user} />}
      </div>

      {showAddAlert && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <AlertForm user={user} onSave={() => { setShowAddAlert(false); setTab('dashboard'); }} onCancel={() => setShowAddAlert(false)} />
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e0e0e0', display: 'flex', zIndex: 50 }}>
        {navTabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setShowAddAlert(false); }} style={{ flex: 1, padding: '12px 4px', border: 'none', background: 'none', fontSize: 13, fontWeight: tab === t.key ? 800 : 400, color: tab === t.key ? '#1565c0' : '#888', cursor: 'pointer', borderTop: tab === t.key ? '3px solid #1565c0' : '3px solid transparent' }}>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
