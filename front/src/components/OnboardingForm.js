import React, { useState } from 'react';
import axios from 'axios';
import './OnboardingForm.css';

const API_URL = 'http://localhost:5000';

// ─────────────────────────────────────────
// DATOS DE CADA PASO
// ─────────────────────────────────────────

const CONDICIONES_FACIALES = [
  { id: 'ptosis', label: 'Ptosis palpebral', desc: 'Caída del párpado superior', icon: '👁️' },
  { id: 'paralisis_facial', label: 'Parálisis facial', desc: 'Un lado del rostro con movilidad reducida', icon: '🫥' },
  { id: 'nistagmo', label: 'Nistagmo', desc: 'Movimiento involuntario de los ojos', icon: '👀' },
  { id: 'estrabismo', label: 'Estrabismo', desc: 'Desviación de uno o ambos ojos', icon: '🔭' },
  { id: 'lentes', label: 'Uso de lentes', desc: 'Lentes ópticos o de sol con frecuencia', icon: '🕶️' },
  { id: 'cicatrices_faciales', label: 'Cicatrices faciales', desc: 'Cicatrices en zona de ojos o frente', icon: '🩹' },
  { id: 'blefarospasmo', label: 'Blefaroespasmo', desc: 'Espasmos involuntarios en párpados', icon: '⚡' },
  { id: 'ninguna', label: 'Ninguna condición', desc: 'Sin condiciones faciales relevantes', icon: '✅' },
];

const TIPOS_TRABAJO = [
  { id: 'pantalla', label: 'Trabajo frente a pantalla', icon: '💻' },
  { id: 'campo', label: 'Trabajo en campo / exterior', icon: '🏗️' },
  { id: 'mixto', label: 'Mixto (oficina + campo)', icon: '🔄' },
  { id: 'conductores', label: 'Conducción / transporte', icon: '🚗' },
  { id: 'atencion_publico', label: 'Atención al público', icon: '🤝' },
  { id: 'salud', label: 'Sector salud', icon: '🏥' },
];

const TURNOS = [
  { id: 'matutino', label: 'Matutino', sub: '6:00 – 14:00', icon: '🌅' },
  { id: 'vespertino', label: 'Vespertino', sub: '14:00 – 22:00', icon: '🌇' },
  { id: 'nocturno', label: 'Nocturno', sub: '22:00 – 6:00', icon: '🌙' },
  { id: 'mixto', label: 'Horario mixto', sub: 'Variable', icon: '🔀' },
  { id: 'home_office', label: 'Home office', sub: 'Desde casa', icon: '🏠' },
];

const DEPORTES = [
  { id: 'gym', label: 'Gimnasio / pesas', icon: '🏋️' },
  { id: 'cardio', label: 'Cardio / running', icon: '🏃' },
  { id: 'yoga', label: 'Yoga / meditación', icon: '🧘' },
  { id: 'futbol', label: 'Fútbol / deportes de equipo', icon: '⚽' },
  { id: 'natacion', label: 'Natación', icon: '🏊' },
  { id: 'ciclismo', label: 'Ciclismo', icon: '🚴' },
  { id: 'artes_marciales', label: 'Artes marciales', icon: '🥋' },
  { id: 'ninguno', label: 'No realizo deporte', icon: '😴' },
];

const FRECUENCIA_EJERCICIO = [
  { id: 'diario', label: 'Todos los días' },
  { id: '3_5_semana', label: '3–5 veces por semana' },
  { id: '1_2_semana', label: '1–2 veces por semana' },
  { id: 'esporádico', label: 'Esporádicamente' },
  { id: 'ninguno', label: 'No hago ejercicio' },
];

// ─────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────

export default function OnboardingForm({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [animDir, setAnimDir] = useState('forward');

  // Paso 1 – Salud facial
  const [condicionesFaciales, setCondicionesFaciales] = useState([]);
  const [notasSalud, setNotasSalud] = useState('');

  // Paso 2 – Trabajo
  const [puesto, setPuesto] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [tipoTrabajo, setTipoTrabajo] = useState('');
  const [turno, setTurno] = useState('');
  const [horasJornada, setHorasJornada] = useState('8');

  // Paso 3 – Actividad física
  const [deportes, setDeportes] = useState([]);
  const [frecuenciaEjercicio, setFrecuenciaEjercicio] = useState('');
  const [horasSueno, setHorasSueno] = useState('7');

  // ── helpers ──────────────────────────────
  const toggleMulti = (setter, current, id) => {
    if (id === 'ninguna' || id === 'ninguno') {
      setter([id]);
      return;
    }
    const filtered = current.filter(x => x !== 'ninguna' && x !== 'ninguno');
    setter(
      filtered.includes(id) ? filtered.filter(x => x !== id) : [...filtered, id]
    );
  };

  const goNext = () => {
    setAnimDir('forward');
    setError('');
    setStep(s => s + 1);
  };

  const goBack = () => {
    setAnimDir('backward');
    setError('');
    setStep(s => s - 1);
  };

  const validateStep = () => {
    if (step === 1 && condicionesFaciales.length === 0) {
      setError('Selecciona al menos una opción (o "Ninguna condición")');
      return false;
    }
    if (step === 2) {
      if (!puesto.trim()) { setError('Ingresa tu puesto o cargo'); return false; }
      if (!tipoTrabajo) { setError('Selecciona el tipo de trabajo'); return false; }
      if (!turno) { setError('Selecciona tu turno'); return false; }
    }
    if (step === 3 && deportes.length === 0) {
      setError('Selecciona al menos una opción');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user?.id_usuario) {
    setError('Error de sesión: recarga la página e inicia sesión de nuevo');
    return;
  }
    setLoading(true);
    setError('');

    const payload = {
      id_usuario: user.id_usuario,
      salud_facial: {
        condiciones: condicionesFaciales,
        notas: notasSalud,
      },
      trabajo: {
        puesto,
        empresa,
        tipo_trabajo: tipoTrabajo,
        turno,
        horas_jornada: parseInt(horasJornada),
      },
      actividad_fisica: {
        deportes,
        frecuencia_ejercicio: frecuenciaEjercicio,
        horas_sueno: parseFloat(horasSueno),
      },
    };

    try {
      await axios.post(`${API_URL}/perfil_salud`, payload);
      onComplete();
    } catch (e) {
      setError(e.response?.data?.error || 'Error al guardar perfil');
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ────────────────────────────────
  const stepTitles = [
    { num: 1, label: 'Salud facial', icon: '🧬' },
    { num: 2, label: 'Tu trabajo', icon: '💼' },
    { num: 3, label: 'Actividad física', icon: '⚡' },
  ];

  return (
    <div className="ob-root">
      {/* Fondo animado */}
      <div className="ob-bg">
        <div className="ob-orb ob-orb-1" />
        <div className="ob-orb ob-orb-2" />
        <div className="ob-orb ob-orb-3" />
      </div>

      <div className="ob-card">
        {/* ── Header ── */}
        <div className="ob-header">
          <div className="ob-logo">
            <span className="ob-logo-icon">⚡</span>
            <span className="ob-logo-text">ProLife</span>
          </div>
          <p className="ob-subtitle">
            Hola <strong>{user.nombre.split(' ')[0]}</strong>, configuremos tu perfil de salud
          </p>
        </div>

        {/* ── Stepper ── */}
        <div className="ob-stepper">
          {stepTitles.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className={`ob-step ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
                <div className="ob-step-circle">
                  {step > s.num ? '✓' : s.icon}
                </div>
                <span className="ob-step-label">{s.label}</span>
              </div>
              {i < stepTitles.length - 1 && (
                <div className={`ob-step-line ${step > s.num ? 'done' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Contenido del paso ── */}
        <div className={`ob-content ob-anim-${animDir}`} key={step}>

          {/* ═══════════ PASO 1 ═══════════ */}
          {step === 1 && (
            <div>
              <h2 className="ob-step-title">Condiciones faciales</h2>
              <p className="ob-step-desc">
                Esta información nos ayuda a calibrar el análisis de fatiga según tus características únicas.
                El sistema adaptará sus algoritmos para ser más preciso contigo.
              </p>
              <div className="ob-grid ob-grid-2">
                {CONDICIONES_FACIALES.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    className={`ob-chip ob-chip-card ${condicionesFaciales.includes(c.id) ? 'selected' : ''}`}
                    onClick={() => toggleMulti(setCondicionesFaciales, condicionesFaciales, c.id)}
                  >
                    <span className="ob-chip-icon">{c.icon}</span>
                    <div>
                      <div className="ob-chip-label">{c.label}</div>
                      <div className="ob-chip-desc">{c.desc}</div>
                    </div>
                    <div className="ob-chip-check">{condicionesFaciales.includes(c.id) ? '✓' : ''}</div>
                  </button>
                ))}
              </div>
              <div className="ob-field mt-16">
                <label className="ob-label">Notas adicionales (opcional)</label>
                <textarea
                  className="ob-textarea"
                  placeholder="Ej: uso parche en ojo derecho, tengo blefaritis crónica..."
                  value={notasSalud}
                  onChange={e => setNotasSalud(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* ═══════════ PASO 2 ═══════════ */}
          {step === 2 && (
            <div>
              <h2 className="ob-step-title">Tu entorno laboral</h2>
              <p className="ob-step-desc">
                Los patrones de fatiga varían según el tipo de trabajo y horario. Esto nos permite
                personalizar las alertas y recomendaciones para tu jornada.
              </p>

              <div className="ob-row">
                <div className="ob-field ob-flex-1">
                  <label className="ob-label">Puesto / Cargo *</label>
                  <input
                    className="ob-input"
                    type="text"
                    placeholder="Ej: Desarrollador, Operador, Médico..."
                    value={puesto}
                    onChange={e => setPuesto(e.target.value)}
                  />
                </div>
                <div className="ob-field ob-flex-1">
                  <label className="ob-label">Empresa / Institución</label>
                  <input
                    className="ob-input"
                    type="text"
                    placeholder="Nombre de tu empresa (opcional)"
                    value={empresa}
                    onChange={e => setEmpresa(e.target.value)}
                  />
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">Tipo de trabajo *</label>
                <div className="ob-grid ob-grid-3">
                  {TIPOS_TRABAJO.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`ob-chip ob-chip-sm ${tipoTrabajo === t.id ? 'selected' : ''}`}
                      onClick={() => setTipoTrabajo(t.id)}
                    >
                      <span>{t.icon}</span>
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">Turno de trabajo *</label>
                <div className="ob-grid ob-grid-3">
                  {TURNOS.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      className={`ob-chip ob-chip-turno ${turno === t.id ? 'selected' : ''}`}
                      onClick={() => setTurno(t.id)}
                    >
                      <span className="ob-chip-turno-icon">{t.icon}</span>
                      <div>
                        <div className="ob-chip-label">{t.label}</div>
                        <div className="ob-chip-desc">{t.sub}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">
                  Horas de jornada diaria: <strong className="ob-highlight">{horasJornada}h</strong>
                </label>
                <input
                  type="range"
                  className="ob-range"
                  min="4"
                  max="16"
                  step="0.5"
                  value={horasJornada}
                  onChange={e => setHorasJornada(e.target.value)}
                />
                <div className="ob-range-labels">
                  <span>4h</span><span>8h</span><span>12h</span><span>16h</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ PASO 3 ═══════════ */}
          {step === 3 && (
            <div>
              <h2 className="ob-step-title">Actividad física & descanso</h2>
              <p className="ob-step-desc">
                El ejercicio y el sueño son factores clave en la fatiga laboral. Cuéntanos tus hábitos
                para ajustar los umbrales de alerta a tu estilo de vida.
              </p>

              <div className="ob-field">
                <label className="ob-label">¿Qué actividades realizas? *</label>
                <div className="ob-grid ob-grid-4">
                  {DEPORTES.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      className={`ob-chip ob-chip-deporte ${deportes.includes(d.id) ? 'selected' : ''}`}
                      onClick={() => toggleMulti(setDeportes, deportes, d.id)}
                    >
                      <span className="ob-deporte-icon">{d.icon}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">Frecuencia de ejercicio</label>
                <div className="ob-freq-list">
                  {FRECUENCIA_EJERCICIO.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className={`ob-freq-item ${frecuenciaEjercicio === f.id ? 'selected' : ''}`}
                      onClick={() => setFrecuenciaEjercicio(f.id)}
                    >
                      <span className="ob-freq-dot" />
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label">
                  Horas de sueño promedio por noche: <strong className="ob-highlight">{horasSueno}h</strong>
                </label>
                <input
                  type="range"
                  className="ob-range"
                  min="3"
                  max="12"
                  step="0.5"
                  value={horasSueno}
                  onChange={e => setHorasSueno(e.target.value)}
                />
                <div className="ob-range-labels">
                  <span>3h 😰</span><span>6h</span><span>8h ✅</span><span>12h</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ── Error ── */}
        {error && (
          <div className="ob-error">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* ── Navegación ── */}
        <div className="ob-nav">
          {step > 1 ? (
            <button type="button" className="ob-btn ob-btn-ghost" onClick={goBack}>
              ← Anterior
            </button>
          ) : (
            <div />
          )}

          <div className="ob-dots">
            {[1, 2, 3].map(n => (
              <div key={n} className={`ob-dot ${step === n ? 'active' : ''} ${step > n ? 'done' : ''}`} />
            ))}
          </div>

          {step < 3 ? (
            <button
              type="button"
              className="ob-btn ob-btn-primary"
              onClick={() => { if (validateStep()) goNext(); }}
            >
              Siguiente →
            </button>
          ) : (
            <button
              type="button"
              className="ob-btn ob-btn-primary ob-btn-finish"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <span className="ob-spinner" />
              ) : (
                <>¡Listo, empezar! 🚀</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}