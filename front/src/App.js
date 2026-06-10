import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import OnboardingForm from './components/OnboardingForm';
import '@fortawesome/fontawesome-free/css/all.min.css';

const API = 'http://localhost:5000';

/* ──────────────────────────────────────────────────
   TEMA
────────────────────────────────────────────────── */
const DARK = {
  bg:         'linear-gradient(135deg,#05091a 0%,#0d1530 60%,#05091a 100%)',
  navBg:      'rgba(5,9,26,0.95)',
  card:       'rgba(13,21,48,0.75)',
  border:     'rgba(39,139,245,0.18)',
  text:       '#e8eef8',
  textMuted:  '#8899bb',
  primary:    '#278BF5',
  accent:     '#00e5c8',
  sideBar:    'rgba(5,9,26,0.97)',
};
const LIGHT = {
  bg:         'linear-gradient(135deg,#e8f4fd 0%,#dbeafe 60%,#e8f4fd 100%)',
  navBg:      'rgba(255,255,255,0.95)',
  card:       'rgba(255,255,255,0.85)',
  border:     'rgba(39,139,245,0.22)',
  text:       '#0f1e3c',
  textMuted:  '#4a6080',
  primary:    '#1a6fd8',
  accent:     '#00a896',
  sideBar:    'rgba(245,248,255,0.97)',
};

function card(t) {
  return {
    background:    t.card,
    backdropFilter:'blur(14px)',
    border:        `1px solid ${t.border}`,
    borderRadius:  18,
    padding:       '20px 22px',
    marginBottom:  18,
  };
}

/* ──────────────────────────────────────────────────
   ÍCONOS SVG (reemplazan emojis)
────────────────────────────────────────────────── */
const Icon = {
  home: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  history: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  user: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  tasks: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
    </svg>
  ),
  bolt: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  sun: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  moon: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
    </svg>
  ),
  logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
    </svg>
  ),
  plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="16" height="16">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
    </svg>
  ),
  ai: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <rect x="2" y="2" width="20" height="20" rx="4"/><path d="M8 12h8M12 8v8"/>
    </svg>
  ),
  lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  music: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  arrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  warning: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
};

/* ──────────────────────────────────────────────────
   LOGIN REDISEÑADO (sin emojis)
────────────────────────────────────────────────── */
function LoginPage({ onLogin }) {
  const [modo, setModo]             = useState('login'); // login | registro
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass]   = useState('');
  const [regNombre, setRegNombre]   = useState('');
  const [regEmail, setRegEmail]     = useState('');
  const [regPass, setRegPass]       = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [loading, setLoading]       = useState(false);

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 12, padding: '12px 16px',
    color: '#e8eef8', fontSize: 14, outline: 'none',
    transition: 'border .2s',
    fontFamily: "'Sora','Inter',sans-serif",
  };

  const btn = {
    width: '100%', padding: '13px',
    background: 'linear-gradient(135deg,#278BF5,#00c4b8)',
    border: 'none', borderRadius: 12,
    color: 'white', fontWeight: 700, fontSize: 15,
    cursor: 'pointer', transition: 'opacity .2s',
    fontFamily: "'Sora','Inter',sans-serif",
    letterSpacing: '0.3px',
  };

  const handleLogin = async () => {
    if (!loginEmail || !loginPass) { setError('Completa todos los campos'); return; }
    setLoading(true); setError('');
    try {
      const r = await axios.post(`${API}/login`, { email: loginEmail, password: loginPass });
      if (r.status === 200) onLogin(r.data);
    } catch (e) { setError(e.response?.data?.error || 'Credenciales incorrectas'); }
    finally { setLoading(false); }
  };

  const handleRegistro = async () => {
    if (!regNombre || !regEmail || !regPass) { setError('Completa todos los campos'); return; }
    if (regPass.length < 6) { setError('La contraseña debe tener mínimo 6 caracteres'); return; }
    setLoading(true); setError(''); setSuccess('');
    try {
      await axios.post(`${API}/registro`, { nombre: regNombre, email: regEmail, password: regPass });
      setSuccess('Cuenta creada. Ahora inicia sesión.');
      setTimeout(() => { setModo('login'); setLoginEmail(regEmail); setSuccess(''); }, 1800);
    } catch (e) { setError(e.response?.data?.error || 'Error al registrar'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg,#05091a 0%,#0d1530 60%,#05091a 100%)',
      fontFamily: "'Sora','Inter',sans-serif", padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 60, height: 60, borderRadius: 18, margin: '0 auto 14px',
            background: 'linear-gradient(135deg,#278BF5,#00e5c8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 32px rgba(39,139,245,.4)',
            color: 'white',
          }}><Icon.bolt /></div>
          <div style={{ fontWeight: 800, fontSize: 26, color: '#e8eef8', letterSpacing: '-0.5px' }}>ProLife</div>
          <div style={{ color: '#8899bb', fontSize: 13, marginTop: 4 }}>Energy Co-pilot — Bienestar laboral con IA</div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 4, marginBottom: 28 }}>
          {[['login','Iniciar sesión'],['registro','Crear cuenta']].map(([id, label]) => (
            <button key={id} onClick={() => { setModo(id); setError(''); setSuccess(''); }} style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: 10, cursor: 'pointer',
              fontWeight: 600, fontSize: 13, transition: 'all .2s',
              background: modo === id ? 'linear-gradient(135deg,#278BF5,#0a5fd8)' : 'transparent',
              color: modo === id ? 'white' : '#8899bb',
              fontFamily: "'Sora','Inter',sans-serif",
            }}>{label}</button>
          ))}
        </div>

        {/* Form */}
        <div style={{
          background: 'rgba(13,21,48,0.8)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(39,139,245,0.18)', borderRadius: 20,
          padding: '28px 26px',
        }}>
          {modo === 'login' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={inp} type="email" placeholder="Correo electrónico"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              <input style={inp} type="password" placeholder="Contraseña"
                value={loginPass} onChange={e => setLoginPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              {error && <div style={{ color: '#ef4444', fontSize: 12, padding: '8px 12px', background: 'rgba(239,68,68,.1)', borderRadius: 8 }}>{error}</div>}
              <button style={{ ...btn, opacity: loading ? 0.7 : 1 }} onClick={handleLogin} disabled={loading}>
                {loading ? 'Verificando...' : 'Ingresar'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <input style={inp} type="text" placeholder="Nombre completo"
                value={regNombre} onChange={e => setRegNombre(e.target.value)} />
              <input style={inp} type="email" placeholder="Correo electrónico"
                value={regEmail} onChange={e => setRegEmail(e.target.value)} />
              <input style={inp} type="password" placeholder="Contraseña (mín. 6 caracteres)"
                value={regPass} onChange={e => setRegPass(e.target.value)} />
              {error && <div style={{ color: '#ef4444', fontSize: 12, padding: '8px 12px', background: 'rgba(239,68,68,.1)', borderRadius: 8 }}>{error}</div>}
              {success && <div style={{ color: '#10b981', fontSize: 12, padding: '8px 12px', background: 'rgba(16,185,129,.1)', borderRadius: 8 }}>{success}</div>}
              <button style={{ ...btn, opacity: loading ? 0.7 : 1 }} onClick={handleRegistro} disabled={loading}>
                {loading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#8899bb', fontSize: 11, marginTop: 20 }}>
          Tus datos están protegidos · ProLife v3.0
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   UI REUTILIZABLE
────────────────────────────────────────────────── */
function SectionTitle({ icon, label, color = '#278BF5', t }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{
        background: `linear-gradient(135deg,${color}33,${color}11)`,
        border: `1px solid ${color}44`,
        borderRadius: 10, width: 34, height: 34,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: color,
      }}>{icon}</div>
      <span style={{ color: t.text, fontWeight: 700, fontSize: 16 }}>{label}</span>
    </div>
  );
}

function StatBox({ label, value, sub, color = '#278BF5', t }) {
  return (
    <div style={{
      background: `${color}11`, border: `1px solid ${color}28`,
      borderRadius: 14, padding: '16px 14px', textAlign: 'center', flex: 1,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: t.text, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ nivel }) {
  const cfg = {
    1: { bg: 'rgba(16,185,129,.15)', color: '#10b981', border: 'rgba(16,185,129,.3)', label: 'Normal' },
    2: { bg: 'rgba(245,158,11,.15)', color: '#f59e0b', border: 'rgba(245,158,11,.3)', label: 'Moderada' },
    3: { bg: 'rgba(239,68,68,.15)',  color: '#ef4444', border: 'rgba(239,68,68,.3)',  label: 'Alta' },
  };
  const c = cfg[nivel] || cfg[1];
  return (
    <span style={{
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 30, padding: '4px 14px', fontSize: 12, fontWeight: 700,
    }}>{c.label}</span>
  );
}

/* ──────────────────────────────────────────────────
   SECCIÓN: PERFIL EDITABLE
────────────────────────────────────────────────── */
function SeccionPerfil({ user, perfil, onSave, t }) {
  const [edit, setEdit]     = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm]     = useState({
    puesto:        perfil?.trabajo?.puesto || '',
    empresa:       perfil?.trabajo?.empresa || '',
    tipo_trabajo:  perfil?.trabajo?.tipo_trabajo || '',
    turno:         perfil?.trabajo?.turno || '',
    horas_jornada: perfil?.trabajo?.horas_jornada || 8,
    deportes:      perfil?.actividad_fisica?.deportes?.join(', ') || '',
    horas_sueno:   perfil?.actividad_fisica?.horas_sueno || 7,
    notas_salud:   perfil?.salud_facial?.notas || '',
  });

  const field = (key, label, type = 'text', min, max) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: t.textMuted, textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 6 }}>{label}</label>
      <input
        type={type} disabled={!edit}
        value={form[key]} min={min} max={max}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: edit ? `${t.primary}09` : 'transparent',
          border: `1px solid ${edit ? t.primary + '55' : t.border}`,
          borderRadius: 10, padding: '10px 12px',
          color: t.text, fontSize: 13, outline: 'none', transition: 'all .2s',
          cursor: edit ? 'text' : 'default', fontFamily: "'Sora','Inter',sans-serif",
        }}
      />
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/perfil_salud/${user.id_usuario}`, {
        trabajo: {
          puesto: form.puesto, empresa: form.empresa,
          tipo_trabajo: form.tipo_trabajo, turno: form.turno,
          horas_jornada: parseInt(form.horas_jornada),
        },
        actividad_fisica: {
          deportes: form.deportes.split(',').map(s => s.trim()).filter(Boolean),
          horas_sueno: parseFloat(form.horas_sueno),
        },
        salud_facial: { ...perfil?.salud_facial, notas: form.notas_salud },
      });
      onSave(); setEdit(false);
    } catch { alert('Error al guardar cambios'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* Avatar + nombre */}
      <div style={{ ...card(t), display: 'flex', alignItems: 'center', gap: 20, marginBottom: 18 }}>
        <div style={{
          width: 70, height: 70, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg,${t.primary},${t.accent})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, fontWeight: 800, color: 'white',
          boxShadow: `0 4px 20px ${t.primary}44`,
        }}>
          {user.nombre.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: t.text }}>{user.nombre}</div>
          <div style={{ color: t.textMuted, fontSize: 13, marginTop: 2 }}>{user.email}</div>
          <div style={{ fontSize: 11, color: t.textMuted, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon.lock /><span>ID #{user.id_usuario}</span>
          </div>
        </div>
      </div>

      {/* Condiciones faciales */}
      <div style={card(t)}>
        <SectionTitle icon={<Icon.eye />} label="Condiciones faciales" color="#7c3aed" t={t} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(perfil?.salud_facial?.condiciones || ['ninguna']).map(c => (
            <span key={c} style={{
              background: 'rgba(124,58,237,.12)', border: '1px solid rgba(124,58,237,.25)',
              color: '#a78bfa', borderRadius: 20, padding: '4px 12px', fontSize: 12,
            }}>{c}</span>
          ))}
        </div>
      </div>

      {/* Trabajo + actividad */}
      <div style={card(t)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <SectionTitle icon={<Icon.activity />} label="Trabajo & Actividad" color={t.primary} t={t} />
          {!edit
            ? <button onClick={() => setEdit(true)} style={{
                background: `${t.primary}22`, border: `1px solid ${t.primary}44`,
                color: t.primary, borderRadius: 20, padding: '7px 18px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'Sora','Inter',sans-serif",
              }}><Icon.edit /><span>Editar</span></button>
            : <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEdit(false)} style={{
                  background: 'transparent', border: `1px solid ${t.border}`,
                  color: t.textMuted, borderRadius: 20, padding: '7px 14px',
                  fontSize: 12, cursor: 'pointer', fontFamily: "'Sora','Inter',sans-serif",
                }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving} style={{
                  background: `linear-gradient(135deg,${t.primary},#0a5fd8)`,
                  border: 'none', color: 'white', borderRadius: 20,
                  padding: '7px 18px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6,
                  fontFamily: "'Sora','Inter',sans-serif",
                }}><Icon.save /><span>{saving ? 'Guardando...' : 'Guardar'}</span></button>
              </div>
          }
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
          {field('puesto', 'Puesto / Cargo')}
          {field('empresa', 'Empresa')}
          {field('tipo_trabajo', 'Tipo de trabajo')}
          {field('turno', 'Turno')}
          {field('horas_jornada', 'Horas de jornada', 'number', 4, 16)}
          {field('horas_sueno', 'Horas de sueño promedio', 'number', 3, 12)}
        </div>
        {field('deportes', 'Actividades / Deportes (separados por coma)')}
        {field('notas_salud', 'Notas de salud adicionales')}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   SECCIÓN: HISTORIAL & GRÁFICAS
────────────────────────────────────────────────── */
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const NIVEL_LABEL = { 1: 'Normal', 2: 'Moderada', 3: 'Alta' };

function CustomTooltipFatiga({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const c = { 1: '#10b981', 2: '#f59e0b', 3: '#ef4444' };
  return (
    <div style={{
      background: 'rgba(13,21,48,.95)', border: '1px solid rgba(39,139,245,.2)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: '#8899bb', margin: '0 0 4px 0' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: c[p.value] || p.color, margin: 0, fontWeight: 700 }}>
          {p.name}: {NIVEL_LABEL[p.value] || p.value}
        </p>
      ))}
    </div>
  );
}

function SeccionHistorial({ userId, t }) {
  const [logs, setLogs]   = useState([]);
  const [resumen, setRes] = useState(null);
  const [loading, setLoad] = useState(true);
  const [rango, setRango] = useState(50);

  const cargar = useCallback(async () => {
    setLoad(true);
    try {
      const [rL, rR] = await Promise.all([
        axios.get(`${API}/historial_fatiga/${userId}?limit=${rango}`),
        axios.get(`${API}/resumen_fatiga/${userId}`),
      ]);
      const data = [...(rL.data || [])].reverse().map((d, i) => ({
        ...d, idx: i + 1,
        hora: d.fecha_hora ? new Date(d.fecha_hora).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : `#${i + 1}`,
        label: NIVEL_LABEL[d.nivel_fatiga] || 'Normal',
      }));
      setLogs(data); setRes(rR.data);
    } catch { }
    finally { setLoad(false); }
  }, [userId, rango]);

  useEffect(() => { cargar(); }, [cargar]);

  const pieData = resumen ? [
    { name: 'Normal', value: resumen.nivel_1 || 0 },
    { name: 'Moderada', value: resumen.nivel_2 || 0 },
    { name: 'Alta', value: resumen.nivel_3 || 0 },
  ] : [];

  const earData = logs.slice(-30).map(d => ({ hora: d.hora, ear: d.ear_value, nivel: d.nivel_fatiga }));

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 60, color: t.textMuted }}>
      <div style={{ width: 40, height: 40, border: `3px solid ${t.border}`, borderTopColor: t.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
      Cargando historial...
    </div>
  );

  return (
    <div>
      {resumen && (
        <div style={card(t)}>
          <SectionTitle icon={<Icon.activity />} label="Resumen de sesiones" color={t.primary} t={t} />
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <StatBox label="Total registros"  value={resumen.total || 0}                    color={t.primary} t={t} />
            <StatBox label="EAR promedio"      value={(resumen.ear_promedio || 0).toFixed(2)} color="#7c3aed"  t={t} sub="Apertura ocular" />
            <StatBox label="% Tiempo normal"   value={`${resumen.pct_normal || 0}%`}          color="#10b981"  t={t} />
            <StatBox label="Nivel promedio"    value={(resumen.nivel_promedio || 1).toFixed(1)} color="#f59e0b" t={t} sub="sobre 3" />
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18, marginBottom: 18 }}>
        <div style={card(t)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <SectionTitle icon={<Icon.activity />} label="Nivel de fatiga en el tiempo" color="#f59e0b" t={t} />
            <div style={{ display: 'flex', gap: 6 }}>
              {[20, 50, 100].map(n => (
                <button key={n} onClick={() => setRango(n)} style={{
                  background: rango === n ? `${t.primary}22` : 'transparent',
                  border: `1px solid ${rango === n ? t.primary : t.border}`,
                  color: rango === n ? t.primary : t.textMuted,
                  borderRadius: 20, padding: '4px 12px', fontSize: 11,
                  cursor: 'pointer', fontWeight: rango === n ? 700 : 400,
                  fontFamily: "'Sora','Inter',sans-serif",
                }}>Últimos {n}</button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={logs} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="nivelGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="hora" tick={{ fill: t.textMuted, fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tickFormatter={v => ['', 'Normal', 'Mod.', 'Alta'][v] || v} tick={{ fill: t.textMuted, fontSize: 10 }} />
              <Tooltip content={<CustomTooltipFatiga />} />
              <Area type="monotone" dataKey="nivel_fatiga" name="Fatiga" stroke="#f59e0b" fill="url(#nivelGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={card(t)}>
          <SectionTitle icon={<Icon.activity />} label="Distribución" color="#00e5c8" t={t} />
          {pieData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="45%" outerRadius={70} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend formatter={v => <span style={{ color: t.textMuted, fontSize: 11 }}>{v}</span>} />
                <Tooltip formatter={v => [`${v} registros`]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: t.textMuted, padding: 40, fontSize: 12 }}>Sin datos suficientes</div>
          )}
        </div>
      </div>

      <div style={card(t)}>
        <SectionTitle icon={<Icon.eye />} label="Apertura ocular (EAR) — últimas 30 lecturas" color="#7c3aed" t={t} />
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={earData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
            <XAxis dataKey="hora" tick={{ fill: t.textMuted, fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={[0.1, 0.4]} tick={{ fill: t.textMuted, fontSize: 10 }} />
            <Tooltip contentStyle={{ background: 'rgba(13,21,48,.95)', border: `1px solid ${t.border}`, borderRadius: 10 }} labelStyle={{ color: t.textMuted }} itemStyle={{ color: '#7c3aed' }} />
            <Line type="monotone" dataKey="ear" name="EAR" stroke="#7c3aed" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
          <span style={{ fontSize: 11, color: '#ef4444' }}>— Fatiga alta (&lt;0.21)</span>
          <span style={{ fontSize: 11, color: '#f59e0b' }}>— Fatiga mod. (&lt;0.26)</span>
          <span style={{ fontSize: 11, color: '#10b981' }}>— Normal (≥0.26)</span>
        </div>
      </div>

      <div style={card(t)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <SectionTitle icon={<Icon.history />} label="Registros recientes" color={t.primary} t={t} />
          <button onClick={cargar} style={{
            background: `${t.primary}15`, border: `1px solid ${t.border}`,
            color: t.primary, borderRadius: 20, padding: '6px 14px',
            fontSize: 11, cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: "'Sora','Inter',sans-serif",
          }}><Icon.refresh /><span>Actualizar</span></button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['#', 'Hora', 'Nivel', 'EAR', 'Estado'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '8px 12px',
                    color: t.textMuted, fontWeight: 600, fontSize: 11,
                    borderBottom: `1px solid ${t.border}`,
                    textTransform: 'uppercase', letterSpacing: '0.6px',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.slice().reverse().slice(0, 15).map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${t.border}33` }}>
                  <td style={{ padding: '8px 12px', color: t.textMuted }}>{d.idx}</td>
                  <td style={{ padding: '8px 12px', color: t.text }}>{d.hora}</td>
                  <td style={{ padding: '8px 12px' }}><Badge nivel={d.nivel_fatiga} /></td>
                  <td style={{ padding: '8px 12px', color: d.ear_value < 0.21 ? '#ef4444' : d.ear_value < 0.26 ? '#f59e0b' : '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>{(d.ear_value || 0).toFixed(3)}</td>
                  <td style={{ padding: '8px 12px', color: t.textMuted }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.nivel_fatiga === 3 ? '#ef4444' : d.nivel_fatiga === 2 ? '#f59e0b' : '#10b981', display: 'inline-block' }} />
                      {d.nivel_fatiga === 3 ? 'Alta' : d.nivel_fatiga === 2 ? 'Moderada' : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '28px 0', color: t.textMuted, fontSize: 13 }}>
              Aún no hay registros de fatiga. Inicia una sesión de monitoreo.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   SECCIÓN: TAREAS / AGENDA
────────────────────────────────────────────────── */
function SeccionTareas({ userId, t }) {
  const [tareas, setTareas]   = useState(() => {
    try { return JSON.parse(localStorage.getItem(`prolife_tasks_${userId}`) || '[]'); } catch { return []; }
  });
  const [form, setForm]       = useState({ titulo: '', descripcion: '', fecha: '', hora: '', prioridad: 'media', categoria: 'trabajo' });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [filtro, setFiltro]   = useState('todas');

  const guardar = (lista) => {
    setTareas(lista);
    localStorage.setItem(`prolife_tasks_${userId}`, JSON.stringify(lista));
  };

  const agregarTarea = () => {
    if (!form.titulo.trim()) return;
    const nueva = { ...form, id: Date.now(), completada: false, creadaEn: new Date().toISOString() };
    guardar([...tareas, nueva]);
    setForm({ titulo: '', descripcion: '', fecha: '', hora: '', prioridad: 'media', categoria: 'trabajo' });
    setMostrarForm(false);
  };

  const toggleTarea = (id) => guardar(tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
  const eliminarTarea = (id) => guardar(tareas.filter(t => t.id !== id));

  const prioridadCfg = {
    alta:   { color: '#ef4444', bg: 'rgba(239,68,68,.12)',  label: 'Alta' },
    media:  { color: '#f59e0b', bg: 'rgba(245,158,11,.12)', label: 'Media' },
    baja:   { color: '#10b981', bg: 'rgba(16,185,129,.12)', label: 'Baja' },
  };
  const categoriaCfg = {
    trabajo:   { color: '#278BF5', label: 'Trabajo' },
    personal:  { color: '#7c3aed', label: 'Personal' },
    salud:     { color: '#10b981', label: 'Salud' },
    descanso:  { color: '#00e5c8', label: 'Descanso' },
  };

  const tareasFiltradas = tareas.filter(t => {
    if (filtro === 'pendientes') return !t.completada;
    if (filtro === 'completadas') return t.completada;
    return true;
  });

  const completadas = tareas.filter(t => t.completada).length;
  const pct = tareas.length ? Math.round((completadas / tareas.length) * 100) : 0;

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: `${t.primary}08`, border: `1px solid ${t.border}`,
    borderRadius: 10, padding: '10px 12px',
    color: t.text, fontSize: 13, outline: 'none',
    fontFamily: "'Sora','Inter',sans-serif",
  };

  return (
    <div>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
        <div style={{ ...card(t), marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: t.primary }}>{tareas.length}</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Total tareas</div>
        </div>
        <div style={{ ...card(t), marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#10b981' }}>{completadas}</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Completadas</div>
        </div>
        <div style={{ ...card(t), marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: '#f59e0b' }}>{pct}%</div>
          <div style={{ fontSize: 12, color: t.textMuted, marginTop: 4 }}>Progreso</div>
        </div>
      </div>

      {/* Barra de progreso */}
      {tareas.length > 0 && (
        <div style={{ ...card(t), marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: t.textMuted }}>
            <span>Progreso del día</span><span style={{ fontWeight: 700, color: t.primary }}>{pct}%</span>
          </div>
          <div style={{ height: 8, background: t.border, borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,#278BF5,#00e5c8)', borderRadius: 8, transition: 'width .5s ease' }} />
          </div>
        </div>
      )}

      {/* Header + botón nueva tarea */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <SectionTitle icon={<Icon.tasks />} label="Mi Agenda" color={t.primary} t={t} />
        <button onClick={() => setMostrarForm(!mostrarForm)} style={{
          background: mostrarForm ? 'rgba(239,68,68,.12)' : `linear-gradient(135deg,${t.primary},#0a5fd8)`,
          border: 'none', color: 'white', borderRadius: 20, padding: '8px 18px',
          fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: "'Sora','Inter',sans-serif",
        }}>
          {mostrarForm ? <><span style={{ fontSize: 16, lineHeight: 1 }}>×</span><span>Cancelar</span></> : <><Icon.plus /><span>Nueva tarea</span></>}
        </button>
      </div>

      {/* Formulario nueva tarea */}
      {mostrarForm && (
        <div style={{ ...card(t), marginBottom: 18, border: `1px solid ${t.primary}44` }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: t.text, marginBottom: 14 }}>Nueva tarea</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Título *</label>
              <input style={inp} placeholder="¿Qué necesitas hacer?" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Descripción</label>
              <input style={inp} placeholder="Detalles opcionales..." value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Fecha</label>
              <input style={inp} type="date" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Hora</label>
              <input style={inp} type="time" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Prioridad</label>
              <select style={{ ...inp }} value={form.prioridad} onChange={e => setForm(f => ({ ...f, prioridad: e.target.value }))}>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: t.textMuted, display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Categoría</label>
              <select style={{ ...inp }} value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                <option value="trabajo">Trabajo</option>
                <option value="personal">Personal</option>
                <option value="salud">Salud</option>
                <option value="descanso">Descanso</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={agregarTarea} style={{
              background: `linear-gradient(135deg,${t.primary},#0a5fd8)`,
              border: 'none', color: 'white', borderRadius: 20,
              padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Sora','Inter',sans-serif",
            }}>Agregar tarea</button>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        {[['todas', 'Todas'], ['pendientes', 'Pendientes'], ['completadas', 'Completadas']].map(([id, label]) => (
          <button key={id} onClick={() => setFiltro(id)} style={{
            background: filtro === id ? `${t.primary}22` : 'transparent',
            border: `1px solid ${filtro === id ? t.primary : t.border}`,
            color: filtro === id ? t.primary : t.textMuted,
            borderRadius: 20, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontWeight: filtro === id ? 700 : 400,
            fontFamily: "'Sora','Inter',sans-serif",
          }}>{label}</button>
        ))}
      </div>

      {/* Lista tareas */}
      {tareasFiltradas.length === 0 ? (
        <div style={{ ...card(t), textAlign: 'center', padding: 40 }}>
          <div style={{ color: t.textMuted, fontSize: 14 }}>No hay tareas en esta categoría</div>
          <div style={{ color: t.textMuted, fontSize: 12, marginTop: 6 }}>Crea una nueva tarea para comenzar</div>
        </div>
      ) : (
        tareasFiltradas.map(tarea => {
          const p = prioridadCfg[tarea.prioridad] || prioridadCfg.media;
          const cat = categoriaCfg[tarea.categoria] || categoriaCfg.trabajo;
          return (
            <div key={tarea.id} style={{
              ...card(t), marginBottom: 10,
              opacity: tarea.completada ? 0.6 : 1,
              borderLeft: `3px solid ${p.color}`,
              display: 'flex', alignItems: 'flex-start', gap: 14,
            }}>
              <button onClick={() => toggleTarea(tarea.id)} style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                background: tarea.completada ? '#10b981' : 'transparent',
                border: `2px solid ${tarea.completada ? '#10b981' : t.border}`,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {tarea.completada && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>}
              </button>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 600, fontSize: 14, color: t.text,
                  textDecoration: tarea.completada ? 'line-through' : 'none',
                }}>{tarea.titulo}</div>
                {tarea.descripcion && <div style={{ fontSize: 12, color: t.textMuted, marginTop: 3 }}>{tarea.descripcion}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ background: p.bg, color: p.color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{p.label}</span>
                  <span style={{ background: `${cat.color}18`, color: cat.color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{cat.label}</span>
                  {tarea.fecha && <span style={{ fontSize: 11, color: t.textMuted }}>{tarea.fecha}{tarea.hora && ` · ${tarea.hora}`}</span>}
                </div>
              </div>
              <button onClick={() => eliminarTarea(tarea.id)} style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: t.textMuted, padding: 4, display: 'flex', alignItems: 'center',
              }}><Icon.trash /></button>
            </div>
          );
        })
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   DASHBOARD INICIO — recomendaciones IA
────────────────────────────────────────────────── */
function SeccionInicio({ user, perfil, nivelFatiga, estadoFatiga, abrirDeteccion, t }) {
  const [recos, setRecos]     = useState([]);
  const [loadRecos, setLoadR] = useState(false);
  const [recoError, setRecoE] = useState('');

  const nivelCfg = {
    1: { color: '#10b981', texto: 'Estado óptimo',       desc: 'Tu nivel de energía es óptimo para trabajar.' },
    2: { color: '#f59e0b', texto: 'Fatiga moderada',     desc: 'Signos de cansancio detectados. Toma un descanso breve.' },
    3: { color: '#ef4444', texto: 'Fatiga alta',         desc: 'Es importante que descanses ahora.' },
  };
  const nc = nivelCfg[nivelFatiga] || nivelCfg[1];

  const cargarRecomendaciones = useCallback(async () => {
    setLoadR(true); setRecoE('');
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `Eres un asistente de bienestar laboral. El usuario trabaja como "${perfil?.trabajo?.puesto || 'trabajador'}" en turno "${perfil?.trabajo?.turno || 'diurno'}" con ${perfil?.trabajo?.horas_jornada || 8} horas de jornada. Actualmente tiene nivel de fatiga ${nivelFatiga} (1=normal, 2=moderada, 3=alta). Sus deportes/actividades: ${perfil?.actividad_fisica?.deportes?.join(', ') || 'ninguno declarado'}. Genera exactamente 4 recomendaciones personalizadas: 2 de playlist/música (con descripción del tipo de música y por qué ayuda en su estado actual) y 2 de actividades/descanso (concretas y realizables en el trabajo). Responde SOLO en JSON sin markdown, así: {"recomendaciones":[{"tipo":"playlist","titulo":"...","descripcion":"...","duracion":"..."},{"tipo":"playlist","titulo":"...","descripcion":"...","duracion":"..."},{"tipo":"actividad","titulo":"...","descripcion":"...","duracion":"..."},{"tipo":"actividad","titulo":"...","descripcion":"...","duracion":"..."}]}`
          }],
        })
      });
      const data = await response.json();
      const text = data.content?.map(i => i.text || '').join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setRecos(parsed.recomendaciones || []);
    } catch (e) {
      setRecoE('No se pudieron cargar las recomendaciones. Intenta de nuevo.');
    }
    finally { setLoadR(false); }
  }, [nivelFatiga, perfil]);

  useEffect(() => { cargarRecomendaciones(); }, [cargarRecomendaciones]);

  const hora   = new Date().getHours();
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div>
      {/* Saludo + estado */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Saludo */}
        <div style={{ ...card(t), display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: t.textMuted, marginBottom: 4 }}>{saludo},</div>
          <div style={{ fontWeight: 800, fontSize: 26, color: t.text, letterSpacing: '-0.5px' }}>{user.nombre.split(' ')[0]}</div>
          <div style={{ marginTop: 12, fontSize: 13, color: t.textMuted }}>
            {perfil?.trabajo?.puesto && <><span style={{ color: t.primary, fontWeight: 600 }}>{perfil.trabajo.puesto}</span> · </>}
            {perfil?.trabajo?.empresa || 'ProLife'}
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <div style={{ background: `${nc.color}18`, border: `1px solid ${nc.color}33`, borderRadius: 20, padding: '5px 14px', fontSize: 12, color: nc.color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, background: nc.color, borderRadius: '50%', display: 'inline-block', boxShadow: `0 0 8px ${nc.color}` }} />
              {nc.texto}
            </div>
          </div>
        </div>

        {/* Estado + botón detección */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ ...card(t), flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 0 }}>
            <div style={{ fontSize: 13, color: t.textMuted }}>Nivel de fatiga actual</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: nc.color, letterSpacing: '-1px' }}>{nivelFatiga}</div>
            <Badge nivel={nivelFatiga} />
            <div style={{ fontSize: 12, color: t.textMuted, lineHeight: 1.5 }}>{nc.desc}</div>
            {estadoFatiga === 'Rostro no detectado' && (
              <div style={{ background: 'rgba(245,158,11,.12)', border: '1px solid rgba(245,158,11,.3)', borderRadius: 10, padding: '8px 14px', fontSize: 11, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon.warning /><span>Colócate frente a la cámara</span>
              </div>
            )}
          </div>

          <div onClick={abrirDeteccion} style={{
            background: `linear-gradient(135deg,rgba(39,139,245,.2),rgba(0,229,200,.12))`,
            border: `1px solid ${t.primary}55`, borderRadius: 16, padding: '18px 20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .25s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(39,139,245,.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ background: 'linear-gradient(135deg,#278BF5,#00e5c8)', width: 46, height: 46, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 16px rgba(39,139,245,.4)' }}>
              <Icon.eye />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>Detección de fatiga</div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>Análisis completo · Liveness · IA</div>
            </div>
            <span style={{ color: t.primary }}><Icon.arrowRight /></span>
          </div>
        </div>
      </div>

      {/* Recomendaciones IA */}
      <div style={card(t)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <SectionTitle icon={<Icon.ai />} label="Recomendaciones personalizadas" color="#7c3aed" t={t} />
          <button onClick={cargarRecomendaciones} disabled={loadRecos} style={{
            background: `${t.primary}15`, border: `1px solid ${t.border}`,
            color: t.primary, borderRadius: 20, padding: '6px 14px',
            fontSize: 11, cursor: loadRecos ? 'default' : 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6, opacity: loadRecos ? 0.6 : 1,
            fontFamily: "'Sora','Inter',sans-serif",
          }}>
            <Icon.refresh /><span>Actualizar</span>
          </button>
        </div>

        {loadRecos ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ background: t.border, borderRadius: 14, height: 110, animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : recoError ? (
          <div style={{ textAlign: 'center', padding: 24, color: '#f59e0b', fontSize: 13 }}>
            <Icon.warning /><span style={{ marginLeft: 8 }}>{recoError}</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {recos.map((r, i) => (
              <div key={i} style={{
                background: r.tipo === 'playlist' ? `rgba(124,58,237,.08)` : `rgba(39,139,245,.08)`,
                border: `1px solid ${r.tipo === 'playlist' ? 'rgba(124,58,237,.2)' : `${t.primary}25`}`,
                borderRadius: 14, padding: '16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    background: r.tipo === 'playlist' ? 'rgba(124,58,237,.18)' : `${t.primary}18`,
                    borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: r.tipo === 'playlist' ? '#a78bfa' : t.primary,
                  }}>
                    {r.tipo === 'playlist' ? <Icon.music /> : <Icon.activity />}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: r.tipo === 'playlist' ? '#a78bfa' : t.primary }}>
                    {r.tipo === 'playlist' ? 'Playlist' : 'Actividad'}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 13, color: t.text, marginBottom: 5 }}>{r.titulo}</div>
                <div style={{ fontSize: 11, color: t.textMuted, lineHeight: 1.5 }}>{r.descripcion}</div>
                {r.duracion && <div style={{ fontSize: 10, color: t.primary, marginTop: 8, fontWeight: 600 }}>{r.duracion}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tips rápidos */}
      <div style={card(t)}>
        <SectionTitle icon={<Icon.activity />} label="Tips de bienestar" color="#f59e0b" t={t} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
          {[
            [<Icon.eye />, 'Regla 20-20-20', 'Cada 20 min, mira a 6m por 20 segundos'],
            [<Icon.activity />, 'Hidratación', 'Toma agua cada 30 minutos'],
            [<Icon.tasks />, 'Microdescansos', '5 min de pausa cada hora'],
            [<Icon.sun />, 'Iluminación', 'Luz brillante reduce la somnolencia'],
          ].map(([ic, tit, desc]) => (
            <div key={tit} style={{
              background: `${t.primary}08`, border: `1px solid ${t.border}`,
              borderRadius: 12, padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }}>{ic}</span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>{tit}</div>
                <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   DETECCIÓN DE FATIGA — Streamlit embebido
────────────────────────────────────────────────── */
function SeccionDeteccionFatiga({ userId, t, onAbrirStreamlit }) {
  return (
    <div>
      <div style={card(t)}>
        <SectionTitle icon={<Icon.eye />} label="Detección de Fatiga con IA" color={t.primary} t={t} />
        <p style={{ color: t.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
          El módulo de detección utiliza análisis facial en tiempo real con MediaPipe para medir el nivel de apertura ocular (EAR), frecuencia de parpadeo y cabeceo. Se ejecuta en una ventana separada para máximo rendimiento.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            [<Icon.eye />, 'EAR', 'Apertura ocular', '#7c3aed'],
            [<Icon.activity />, 'Blink Rate', 'Frecuencia de parpadeo', '#10b981'],
            [<Icon.warning />, 'Pitch', 'Detección de cabeceo', '#f59e0b'],
            [<Icon.ai />, 'Liveness', 'Verificación en vivo', t.primary],
          ].map(([ic, tit, desc, col]) => (
            <div key={tit} style={{ background: `${col}10`, border: `1px solid ${col}25`, borderRadius: 14, padding: '14px 12px', textAlign: 'center' }}>
              <div style={{ color: col, display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{ic}</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{tit}</div>
              <div style={{ fontSize: 11, color: t.textMuted, marginTop: 3 }}>{desc}</div>
            </div>
          ))}
        </div>
        <button onClick={onAbrirStreamlit} style={{
          background: 'linear-gradient(135deg,#278BF5,#00c4b8)',
          border: 'none', color: 'white', borderRadius: 14, padding: '14px 28px',
          fontSize: 15, fontWeight: 700, cursor: 'pointer', width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: "'Sora','Inter',sans-serif",
          boxShadow: '0 4px 20px rgba(39,139,245,.35)',
          transition: 'opacity .2s',
        }}>
          <Icon.camera />
          <span>Iniciar sesión de detección</span>
          <Icon.arrowRight />
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: t.textMuted, marginTop: 10 }}>
          Se abrirá en una nueva ventana · Asegúrate de que el servidor Streamlit esté activo en el puerto 8501
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────
   APP PRINCIPAL
────────────────────────────────────────────────── */
export default function App() {
  const [user, setUser]           = useState(null);
  const [appState, setAppState]   = useState('loading');
  const [perfil, setPerfil]       = useState(null);
  const [isDark, setIsDark]       = useState(true);
  const [tab, setTab]             = useState('inicio');
  const [nivelFatiga, setNivel]   = useState(1);
  const [estadoFatiga, setEstado] = useState('Iniciando...');
  const [sidebarOpen, setSidebar] = useState(false);
  const videoRef = useRef(null);
  const t = isDark ? DARK : LIGHT;

  useEffect(() => {
    const saved = localStorage.getItem('prolife_user');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u); checkOnboarding(u);
    } else {
      setAppState('login');
    }
  }, []);

  const checkOnboarding = async (u) => {
    try {
      const r = await axios.get(`${API}/perfil_salud/${u.id_usuario}`);
      if (r.data?.trabajo) { setPerfil(r.data); setAppState('dashboard'); startCamera(); }
      else setAppState('onboarding');
    } catch { setAppState('onboarding'); }
  };

  const recargarPerfil = async () => {
    if (!user) return;
    try { const r = await axios.get(`${API}/perfil_salud/${user.id_usuario}`); setPerfil(r.data); } catch { }
  };

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) { console.error('Cámara:', e); }
  };

  useEffect(() => {
    let iv;
    if (appState === 'dashboard') {
      iv = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        const c = document.createElement('canvas');
        c.width = videoRef.current.videoWidth;
        c.height = videoRef.current.videoHeight;
        c.getContext('2d').drawImage(videoRef.current, 0, 0);
        try {
          const r = await axios.post(`${API}/analizar_fatiga`, { image: c.toDataURL('image/jpeg'), id_usuario: user.id_usuario });
          setNivel(r.data.nivel || 1);
          setEstado(r.data.estado || 'Normal');
        } catch { }
      }, 2000);
    }
    return () => clearInterval(iv);
  }, [appState, user]);

  const abrirDeteccion = async () => {
    try {
      const r = await axios.post(`${API}/session_token`, { id_usuario: user.id_usuario });
      window.open(`http://localhost:8501?token=${r.data.token}`, '_blank');
    } catch { alert('No se pudo iniciar la sesión de detección. Verifica que el servidor esté activo.'); }
  };

  const handleLogin    = (u) => { setUser(u); localStorage.setItem('prolife_user', JSON.stringify(u)); checkOnboarding(u); };
  const handleLogout   = () => { videoRef.current?.srcObject?.getTracks().forEach(t => t.stop()); setUser(null); setAppState('login'); localStorage.removeItem('prolife_user'); };

  if (appState === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#05091a', flexDirection: 'column', gap: 14 }}>
      <div style={{ color: '#278BF5' }}><Icon.bolt /></div>
      <p style={{ color: '#8899bb', fontFamily: 'Sora,sans-serif', margin: 0 }}>Cargando ProLife...</p>
    </div>
  );
  if (appState === 'login')      return <LoginPage onLogin={handleLogin} />;
  if (appState === 'onboarding') return <OnboardingForm user={user} onComplete={() => checkOnboarding(user)} />;

  const TABS = [
    { id: 'inicio',    label: 'Inicio',          icon: <Icon.home /> },
    { id: 'historial', label: 'Historial',        icon: <Icon.history /> },
    { id: 'perfil',    label: 'Mi Perfil',        icon: <Icon.user /> },
    { id: 'deteccion', label: 'Detección Fatiga', icon: <Icon.eye /> },
    { id: 'tareas',    label: 'Tareas',           icon: <Icon.tasks /> },
  ];

  return (
    <div style={{ minHeight: '100vh', background: t.bg, fontFamily: "'Sora','Inter',sans-serif", color: t.text, transition: 'all .3s', display: 'flex' }}>

      {/* ── VIDEO oculto para análisis pasivo ── */}
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: sidebarOpen ? 220 : 68, flexShrink: 0,
        background: t.sideBar, backdropFilter: 'blur(20px)',
        borderRight: `1px solid ${t.border}`,
        display: 'flex', flexDirection: 'column',
        transition: 'width .3s ease', overflow: 'hidden',
        position: 'sticky', top: 0, height: '100vh',
      }}
        onMouseEnter={() => setSidebar(true)}
        onMouseLeave={() => setSidebar(false)}
      >
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${t.border}` }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#278BF5,#00e5c8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, boxShadow: '0 4px 14px rgba(39,139,245,.35)' }}>
            <Icon.bolt />
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '-0.3px' }}>ProLife</div>
              <div style={{ fontSize: 10, color: t.textMuted }}>Energy Co-pilot</div>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {TABS.map(tab_ => (
            <button key={tab_.id} onClick={() => setTab(tab_.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '11px 12px', borderRadius: 12, border: 'none',
              background: tab === tab_.id ? `linear-gradient(135deg,${t.primary}22,${t.primary}10)` : 'transparent',
              color: tab === tab_.id ? t.primary : t.textMuted,
              cursor: 'pointer', transition: 'all .2s', marginBottom: 4,
              fontFamily: "'Sora','Inter',sans-serif",
              borderLeft: tab === tab_.id ? `3px solid ${t.primary}` : '3px solid transparent',
            }}>
              <span style={{ flexShrink: 0, display: 'flex' }}>{tab_.icon}</span>
              {sidebarOpen && <span style={{ fontWeight: tab === tab_.id ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden' }}>{tab_.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div style={{ padding: '12px 8px', borderTop: `1px solid ${t.border}` }}>
          <button onClick={() => setIsDark(!isDark)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 12, border: 'none',
            background: 'transparent', color: t.textMuted, cursor: 'pointer', marginBottom: 6,
            fontFamily: "'Sora','Inter',sans-serif",
          }}>
            <span style={{ flexShrink: 0, display: 'flex' }}>{isDark ? <Icon.sun /> : <Icon.moon />}</span>
            {sidebarOpen && <span style={{ fontSize: 13 }}>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>}
          </button>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 12px', borderRadius: 12, border: 'none',
            background: 'rgba(239,68,68,.08)', color: '#ef4444', cursor: 'pointer',
            fontFamily: "'Sora','Inter',sans-serif",
          }}>
            <span style={{ flexShrink: 0, display: 'flex' }}><Icon.logout /></span>
            {sidebarOpen && <span style={{ fontSize: 13, fontWeight: 600 }}>Salir</span>}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header style={{
          background: t.navBg, backdropFilter: 'blur(16px)',
          borderBottom: `1px solid ${t.border}`,
          padding: '12px 28px', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', position: 'sticky', top: 0, zIndex: 90,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: t.text }}>
              {TABS.find(tb => tb.id === tab)?.label || 'Inicio'}
            </div>
            <div style={{ fontSize: 11, color: t.textMuted, marginTop: 1 }}>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge nivel={nivelFatiga} />
            <div style={{ fontSize: 12, textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{user.nombre.split(' ')[0]}</div>
              <div style={{ color: t.textMuted, fontSize: 10 }}>{perfil?.trabajo?.puesto || 'Usuario'}</div>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg,${t.primary},${t.accent})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, color: 'white', fontSize: 15,
              boxShadow: `0 2px 10px ${t.primary}44`,
            }}>
              {user.nombre.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '24px 20px', boxSizing: 'border-box' }}>
          {tab === 'inicio'    && <SeccionInicio user={user} perfil={perfil} nivelFatiga={nivelFatiga} estadoFatiga={estadoFatiga} abrirDeteccion={abrirDeteccion} t={t} />}
          {tab === 'historial' && <SeccionHistorial userId={user.id_usuario} t={t} />}
          {tab === 'perfil'    && perfil && <SeccionPerfil user={user} perfil={perfil} onSave={recargarPerfil} t={t} />}
          {tab === 'deteccion' && <SeccionDeteccionFatiga userId={user.id_usuario} t={t} onAbrirStreamlit={abrirDeteccion} />}
          {tab === 'tareas'    && <SeccionTareas userId={user.id_usuario} t={t} />}
        </main>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(39,139,245,.3); border-radius: 6px; }
        select option { background: #0d1530; color: #e8eef8; }
      `}</style>
    </div>
  );
}