"""
ProLife – Módulo de Detección de Fatiga
Streamlit + MediaPipe + detección completa:
  • EAR (apertura ocular)
  • Frecuencia de parpadeo
  • Cabeceo / somnolencia (pitch)
  • Enojo / frustración (cejas + boca)
  • Micro-expresiones (MAR, distancia inter-ceja)
  • Liveness check antes de activar monitoreo
  • Recomendaciones IA (Groq gratuito o mock)
"""

import streamlit as st
import cv2
import mediapipe as mp
import numpy as np
import requests
import time
import math
from collections import deque
from datetime import datetime

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

# ═══════════════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════════════
API_URL  = "http://localhost:5000"
GROQ_KEY = "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"   # Pon tu key aquí o en .streamlit/secrets.toml como GROQ_API_KEY

# Índices MediaPipe FaceMesh
OJO_IZQ  = [362, 385, 387, 263, 373, 380]
OJO_DER  = [33,  160, 158, 133, 153, 144]
BOCA_IND = [61, 291, 39, 181, 0, 17, 269, 405]
CEJA_IZQ = [70, 63, 105, 66, 107]
CEJA_DER = [300, 293, 334, 296, 336]
NARIZ_TIP = 4
MENTON    = 152
FRENTE    = 10

# Umbrales base
TH_EAR_ALTA    = 0.18
TH_EAR_MOD     = 0.22
TH_MAR_APRETADO = 0.28
TH_MAR_ABIERTO  = 0.62
TH_CEJA_FRUNC   = 0.028
TH_PITCH_MOD    = 18
TH_PITCH_ALTA   = 28
TH_BLINK_LENTO  = 12
TH_BLINK_MUY_LENTO = 6

# ═══════════════════════════════════════════════════════
# GEOMETRÍA
# ═══════════════════════════════════════════════════════

def dist(a, b):
    return math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2)

def calcular_ear(lm, idx):
    v1 = dist(lm[idx[1]], lm[idx[5]])
    v2 = dist(lm[idx[2]], lm[idx[4]])
    h  = dist(lm[idx[0]], lm[idx[3]])
    return (v1 + v2) / (2.0 * h) if h > 0 else 0.3

def calcular_mar(lm):
    v1 = dist(lm[BOCA_IND[2]], lm[BOCA_IND[6]])
    v2 = dist(lm[BOCA_IND[3]], lm[BOCA_IND[7]])
    h  = dist(lm[BOCA_IND[0]], lm[BOCA_IND[1]])
    return (v1 + v2) / (2.0 * h) if h > 0 else 0.5

def distancia_cejas(lm):
    cx_izq = np.mean([lm[i].x for i in CEJA_IZQ])
    cx_der = np.mean([lm[i].x for i in CEJA_DER])
    cy_izq = np.mean([lm[i].y for i in CEJA_IZQ])
    cy_der = np.mean([lm[i].y for i in CEJA_DER])
    return math.sqrt((cx_izq - cx_der)**2 + (cy_izq - cy_der)**2)

def calcular_pitch(lm, h, w):
    nose = np.array([lm[NARIZ_TIP].x * w, lm[NARIZ_TIP].y * h])
    chin = np.array([lm[MENTON].x * w,   lm[MENTON].y * h])
    return abs(math.degrees(math.atan2(chin[0] - nose[0], chin[1] - nose[1])))

def calcular_yaw(lm):
    nariz = lm[4].x
    ojo_izq = lm[33].x
    ojo_der = lm[263].x

    centro_ojos = (ojo_izq + ojo_der) / 2

    return nariz - centro_ojos


def abrir_camara():
    for idx in [0, 1, 2]:
        try:
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)

            if cap.isOpened():
                ret, frame = cap.read()

                if ret:
                    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
                    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
                    return cap, idx

            cap.release()

        except:
            pass

    return None, -1

# ═══════════════════════════════════════════════════════
# PERFIL & UMBRALES ADAPTADOS
# ═══════════════════════════════════════════════════════

@st.cache_data(ttl=300)
def get_perfil(id_usuario):
    try:
        r = requests.get(f"{API_URL}/perfil_salud/{id_usuario}", timeout=3)
        return r.json() if r.status_code == 200 else {}
    except:
        return {}

def adaptar_umbrales(perfil):
    th_ear_alta  = TH_EAR_ALTA
    th_ear_mod   = TH_EAR_MOD
    usar_pitch   = True
    usar_mar     = True
    usar_cejas   = True
    condiciones  = perfil.get("salud_facial", {}).get("condiciones", [])

    if any(c in condiciones for c in ["ptosis", "blefarospasmo"]):
        th_ear_alta -= 0.04
        th_ear_mod  -= 0.04
    if any(c in condiciones for c in ["nistagmo", "estrabismo"]):
        th_ear_alta -= 0.03
        th_ear_mod  -= 0.03
    if "paralisis_facial" in condiciones:
        usar_cejas = False
        usar_mar   = False

    return dict(th_ear_alta=th_ear_alta, th_ear_mod=th_ear_mod,
                usar_pitch=usar_pitch, usar_mar=usar_mar,
                usar_cejas=usar_cejas, condiciones=condiciones)

# ═══════════════════════════════════════════════════════
# RECOMENDACIONES
# ═══════════════════════════════════════════════════════

RECOS = {
    "fatiga_alta": [
        ("😴", "Tu cuerpo pide descanso urgente. Para todo 10 minutos y cierra los ojos."),
        ("🎵", "Música suave instrumental — lo-fi o Mozart — ayuda al cerebro a resetear."),
        ("💧", "Toma agua fría ahora. La deshidratación amplifica la fatiga hasta un 20%."),
        ("🚶", "Levántate, camina 30 pasos y vuelve. El movimiento activa la circulación cerebral."),
    ],
    "fatiga_moderada": [
        ("☕", "Un café o té puede ayudarte — pero no más de uno si ya es tarde en tu turno."),
        ("👁️", "Aplica 20-20-20: cada 20 min mira a 6 metros por 20 segundos."),
        ("🧘", "Respira 4s, aguanta 4s, suelta 4s. Repite 3 veces. Activa el parasimpático."),
    ],
    "enojo": [
        ("🌬️", "Detecté tensión en tu rostro. Suelta los hombros y respira lento."),
        ("🎧", "Prueba con música relajante — 'rain sounds' o 'binaural beats focus' en YouTube."),
        ("⏸️", "5 minutos de pausa no es pérdida de tiempo. El problema se ve diferente después."),
    ],
    "frustracion": [
        ("✍️", "Escribe qué te está frustrando, aunque sean 3 líneas. Externalizar ayuda a procesar."),
        ("🏃", "Frustración acumulada = energía atascada. Si puedes, muévete 2 minutos."),
        ("🔄", "Cambia de tarea por 10 minutos. Vuelves con ojos frescos y nueva perspectiva."),
    ],
    "somnolencia": [
        ("💡", "Aumenta la luz de tu entorno — la luz brillante inhibe la melatonina."),
        ("🧊", "Lávate la cara con agua fría. El choque térmico activa la alerta inmediata."),
        ("🎶", "Música con BPM alto (120+) activa el sistema nervioso. Pon algo enérgico."),
    ],
    "normal": [
        ("✅", "¡Todo bien! Sigues en buen nivel de energía. Mantén ese ritmo."),
    ],
}

def get_recomendacion_groq(estado_key, perfil, historial):
    if not GROQ_AVAILABLE or not GROQ_KEY:
        return None
    try:
        cliente = Groq(api_key=GROQ_KEY)
        puesto  = perfil.get("trabajo", {}).get("puesto", "trabajador")
        turno   = perfil.get("trabajo", {}).get("turno", "desconocido")
        sueno   = perfil.get("actividad_fisica", {}).get("horas_sueno", 7)
        prompt  = (
            f"Eres asistente de bienestar laboral. Usuario: {puesto}, turno {turno}, "
            f"duerme {sueno}h promedio. Estado detectado: {estado_key}. "
            f"Historial reciente de niveles: {historial}. "
            "Da UNA recomendación concreta y empática, máximo 2 oraciones. "
            "Inicia con un emoji. Solo la recomendación, sin saludos."
        )
        resp = cliente.chat.completions.create(
            model="llama3-8b-8192",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100, temperature=0.7
        )
        return resp.choices[0].message.content.strip()
    except:
        return None

def get_recomendacion(estado_key, perfil, historial):
    ia = get_recomendacion_groq(estado_key, perfil, historial)
    if ia:
        return "🤖", ia
    opciones = RECOS.get(estado_key, RECOS["normal"])
    idx = int(time.time() / 30) % len(opciones)
    return opciones[idx]

# ═══════════════════════════════════════════════════════
# ANÁLISIS DE FRAME
# ═══════════════════════════════════════════════════════

def analizar_frame(frame, face_mesh_inst, umbrales, ss):
    h, w    = frame.shape[:2]
    rgb     = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res     = face_mesh_inst.process(rgb)

    out = dict(rostro=False, ear=0.0, mar=0.5, pitch=0.0,
               dist_cejas=0.05, parpadeos_min=0,
               nivel=0, estado_key="normal",
               estado_texto="Sin rostro detectado", alertas=[])

    if not res.multi_face_landmarks:
        return frame, out

    lm = res.multi_face_landmarks[0].landmark
    out["rostro"] = True

    # EAR
    ear = (calcular_ear(lm, OJO_IZQ) + calcular_ear(lm, OJO_DER)) / 2
    out["ear"] = round(ear, 3)

    # Parpadeo
    ss["hist_ear"].append(ear)
    if len(ss["hist_ear"]) >= 2:
        if ss["hist_ear"][-2] >= umbrales["th_ear_alta"] and ss["hist_ear"][-1] < umbrales["th_ear_alta"]:
            ss["blink_count"] += 1

    ahora = time.time()
    ss["blink_window"].append((ahora, ss["blink_count"]))
    ventana = [(t, c) for t, c in ss["blink_window"] if ahora - t <= 60]
    ss["blink_window"] = deque(ventana, maxlen=3600)
    if len(ventana) >= 2:
        dt = ventana[-1][0] - ventana[0][0]
        dc = ventana[-1][1] - ventana[0][1]
        bpm = (dc / dt * 60) if dt > 0 else 0
    else:
        bpm = 15
    out["parpadeos_min"] = round(bpm, 1)

    # MAR
    if umbrales["usar_mar"]:
        out["mar"] = round(calcular_mar(lm), 3)

    # Cejas
    if umbrales["usar_cejas"]:
        out["dist_cejas"] = round(distancia_cejas(lm), 4)

    # Pitch
    if umbrales["usar_pitch"]:
        out["pitch"] = round(calcular_pitch(lm, h, w), 1)

    # ── Clasificación ────────────────────────────────────
    alertas      = []
    nivel        = 1
    estado_key   = "normal"
    estado_texto = "✅ Normal – Todo bien"

    # 1. Fatiga por EAR
    if ear < umbrales["th_ear_alta"]:
        nivel = 3; estado_key = "fatiga_alta"
        estado_texto = "Fatiga Alta – Ojos casi cerrados"
        alertas.append("Apertura ocular muy baja")
    elif ear < umbrales["th_ear_mod"]:
        nivel = 2; estado_key = "fatiga_moderada"
        estado_texto = "Fatiga Moderada – Cansancio detectado"
        alertas.append("Apertura ocular reducida")

    # 2. Cabeceo
    if umbrales["usar_pitch"]:
        if out["pitch"] > TH_PITCH_ALTA:
            nivel = max(nivel, 3)
            if estado_key == "normal": estado_key = "somnolencia"
            estado_texto = "Somnolencia – Cabeza cayendo"
            alertas.append(f"Cabeceo severo ({out['pitch']:.0f}°)")
        elif out["pitch"] > TH_PITCH_MOD:
            nivel = max(nivel, 2)
            if estado_key == "normal": estado_key = "somnolencia"
            alertas.append(f"Cabeceo leve ({out['pitch']:.0f}°)")

    # 3. Parpadeo escaso
    if 0 < bpm < TH_BLINK_MUY_LENTO:
        nivel = max(nivel, 3)
        if estado_key == "normal": estado_key = "somnolencia"
        alertas.append(f"Parpadeo muy escaso ({bpm:.0f}/min)")
    elif 0 < bpm < TH_BLINK_LENTO:
        nivel = max(nivel, 2)
        alertas.append(f"Parpadeo lento ({bpm:.0f}/min)")

    # 4. Cejas fruncidas → enojo
    if umbrales["usar_cejas"] and out["dist_cejas"] < TH_CEJA_FRUNC:
        nivel = max(nivel, 2)
        if estado_key in ("normal",):
            estado_key = "enojo"
            estado_texto = "Tensión / Enojo detectado"
        alertas.append("Cejas fruncidas")

    # 5. Boca → frustración
    if umbrales["usar_mar"]:
        if out["mar"] < TH_MAR_APRETADO:
            nivel = max(nivel, 2)
            if estado_key == "normal":
                estado_key = "frustracion"
                estado_texto = "Frustración – Boca apretada"
            alertas.append("Boca muy apretada")
        elif out["mar"] > TH_MAR_ABIERTO:
            nivel = max(nivel, 2)
            if estado_key == "normal":
                estado_key = "frustracion"
                estado_texto = "Tensión facial – Boca muy abierta"
            alertas.append("Tensión mandibular")

    out["nivel"]       = nivel
    out["estado_key"]  = estado_key
    out["estado_texto"] = estado_texto
    out["alertas"]     = alertas

    # Anotar frame
    COLOR = {1:(0,210,100), 2:(20,160,255), 3:(50,50,235)}
    col   = COLOR.get(nivel, (200,200,200))
    txt   = estado_texto[:40]
    cv2.rectangle(frame, (0,0), (w, 90), (5,9,26), -1)
    cv2.putText(frame, txt,   (10,28), cv2.FONT_HERSHEY_SIMPLEX, 0.68, col, 2)
    cv2.putText(frame, f"EAR:{ear:.2f}  MAR:{out['mar']:.2f}  Blink:{bpm:.0f}/m  Pitch:{out['pitch']:.0f}deg",
                (10,55), cv2.FONT_HERSHEY_SIMPLEX, 0.46, (160,170,190), 1)
    cv2.putText(frame, f"Cejas dist:{out['dist_cejas']:.3f}  Nivel:{nivel}/3",
                (10,76), cv2.FONT_HERSHEY_SIMPLEX, 0.43, (130,140,160), 1)

    return frame, out

# ═══════════════════════════════════════════════════════
# LIVENESS CHECK
# ═══════════════════════════════════════════════════════

RETOS = [
    {"id":"parpadea",  "inst":"👁️  Parpadea **2 veces** lentamente",   "dur":4},
    {"id":"derecha",   "inst":"➡️  Gira la cabeza **a la derecha**",    "dur":3},
    {"id":"izquierda", "inst":"⬅️  Gira la cabeza **a la izquierda**",  "dur":3},
    {"id":"sonrie",    "inst":"😊  **Sonríe** o abre la boca",          "dur":3},
]

def verificar_reto(reto_id, frames_reto):
    if reto_id == "parpadea":
        ears = [r.get("ear", 0.3) for r in frames_reto]
        cierres = sum(1 for i in range(1, len(ears))
                      if ears[i-1] >= 0.22 and ears[i] < 0.19)
        return cierres >= 2
    if reto_id == "derecha":
        return any(r.get("yaw", 0) > 0.03 for r in frames_reto)

    if reto_id == "izquierda":
        return any(r.get("yaw", 0) < -0.03 for r in frames_reto)
    
    
    if reto_id == "sonrie":
        return any(r.get("mar", 0) > 0.48 for r in frames_reto[-8:])
    return False

# ═══════════════════════════════════════════════════════
# ESTADO DE SESIÓN
# ═══════════════════════════════════════════════════════

def init_session():
    d = dict(
        id_usuario=None, nombre="Usuario", perfil={},
        umbrales=adaptar_umbrales({}),
        fase="login",
        liveness_paso=0, liveness_ok=False,
        hist_ear=deque(maxlen=90),
        blink_count=0, blink_window=deque(maxlen=3600),
        historial_niveles=deque(maxlen=20),
        recomendacion=None, recomendacion_t=0,
        frames_nivel={1:0,2:0,3:0},
        inicio_sesion=None,
        ultimo_log_t=0,
    )
    for k, v in d.items():
        if k not in st.session_state:
            st.session_state[k] = v

# ═══════════════════════════════════════════════════════
# CSS
# ═══════════════════════════════════════════════════════

def apply_css():
    st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap');
html,[class*="css"]{ font-family:'Sora',sans-serif!important; }
.stApp{ background:linear-gradient(135deg,#05091a 0%,#0d1530 60%,#05091a 100%); }
#MainMenu,footer,header{visibility:hidden}
.pl-card{background:rgba(13,21,48,.85);border:1px solid rgba(39,139,245,.18);
  border-radius:16px;padding:20px 22px;margin-bottom:14px;backdrop-filter:blur(12px)}
.pl-title{font-size:26px;font-weight:800;
  background:linear-gradient(90deg,#278BF5,#00e5c8);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.pl-subtitle{color:#8899bb;font-size:13px;margin-bottom:18px}
.metric-box{background:rgba(39,139,245,.06);border:1px solid rgba(39,139,245,.12);
  border-radius:12px;padding:14px;text-align:center}
.metric-val{font-size:26px;font-weight:800;color:#278BF5}
.metric-lbl{font-size:11px;color:#8899bb;margin-top:2px}
.nivel-badge{display:inline-block;padding:5px 16px;border-radius:30px;font-weight:700;font-size:14px}
.nivel-1{background:rgba(16,185,129,.15);color:#10b981;border:1px solid rgba(16,185,129,.3)}
.nivel-2{background:rgba(245,158,11,.15);color:#f59e0b;border:1px solid rgba(245,158,11,.3)}
.nivel-3{background:rgba(239,68,68,.15);color:#ef4444;border:1px solid rgba(239,68,68,.3)}
.alerta-box{background:rgba(239,68,68,.08);border-left:4px solid #ef4444;
  border-radius:8px;padding:10px 14px;margin:6px 0;color:#fca5a5;font-size:13px}
.reco-box{background:rgba(0,229,200,.07);border:1px solid rgba(0,229,200,.2);
  border-radius:12px;padding:16px;color:#a7f3d0;font-size:14px;line-height:1.6}
.liveness-inst{font-size:22px;font-weight:700;color:#e8eef8;text-align:center;
  padding:24px;background:rgba(39,139,245,.08);border-radius:14px;
  border:1px solid rgba(39,139,245,.2);margin:12px 0}
.stButton>button{background:linear-gradient(135deg,#278BF5,#0a5fd8)!important;
  color:white!important;border:none!important;border-radius:30px!important;
  padding:10px 28px!important;font-weight:600!important;
  box-shadow:0 4px 20px rgba(39,139,245,.35)!important}
.stNumberInput>div>div>input,.stTextInput>div>div>input{
  background:rgba(255,255,255,.04)!important;
  border:1px solid rgba(39,139,245,.2)!important;
  border-radius:10px!important;color:#e8eef8!important}
div[data-testid="stMetric"]{background:rgba(39,139,245,.06);
  border-radius:12px;padding:12px;border:1px solid rgba(39,139,245,.12)}
</style>""", unsafe_allow_html=True)

# ═══════════════════════════════════════════════════════
# PANTALLA LOGIN
# ═══════════════════════════════════════════════════════

def pantalla_login():
    """
    Intenta autenticar automáticamente via ?token= en la URL.
    El usuario NUNCA ve ni ingresa su ID.
    """
    st.markdown('<div class="pl-title">⚡ ProLife – Detección de Fatiga</div>', unsafe_allow_html=True)

    # ── Leer token de la URL ──────────────────────────────────────
    params = st.query_params
    token  = params.get("token", "")

    if not token:
        # No hay token: mostrar mensaje amigable (no input de ID)
        st.markdown("""
        <div class="pl-card" style="text-align:center;padding:40px 20px">
          <div style="font-size:48px;margin-bottom:12px">🔐</div>
          <div style="font-size:18px;font-weight:700;color:#e8eef8;margin-bottom:8px">
            Sesión no iniciada
          </div>
          <div style="color:#8899bb;font-size:13px;line-height:1.6">
            Para acceder al módulo de detección, usa el botón<br>
            <strong style="color:#278BF5">⚡ Detección de Fatiga</strong>
            desde el dashboard de ProLife.
          </div>
        </div>
        """, unsafe_allow_html=True)
        return

    # ── Canjear token en el backend ───────────────────────────────
    with st.spinner("Verificando sesión..."):
        try:
            r = requests.get(f"{API_URL}/session_token/{token}", timeout=5)
        except Exception as e:
            st.error(f"No se pudo conectar con el servidor: {e}")
            return

    if r.status_code != 200:
        err = r.json().get("error", "Error desconocido")
        st.markdown(f"""
        <div class="pl-card" style="text-align:center;padding:32px">
          <div style="font-size:40px;margin-bottom:10px">⏰</div>
          <div style="color:#ef4444;font-weight:700;font-size:16px">Sesión inválida o expirada</div>
          <div style="color:#8899bb;font-size:12px;margin-top:8px">{err}</div>
          <div style="color:#8899bb;font-size:12px;margin-top:12px">
            Vuelve al dashboard y haz clic en el botón nuevamente.
          </div>
        </div>
        """, unsafe_allow_html=True)
        return

    # ── Token válido: cargar datos y avanzar ─────────────────────
    data   = r.json()
    perfil = data.get("perfil", {})

    st.session_state.id_usuario    = data["id_usuario"]
    st.session_state.nombre        = data.get("nombre", "") or perfil.get("trabajo", {}).get("puesto", "Usuario")
    st.session_state.perfil        = perfil
    st.session_state.umbrales      = adaptar_umbrales(perfil)
    st.session_state.fase          = "liveness"
    st.session_state.inicio_sesion = datetime.now()

    # Limpiar token de la URL para que no pueda reutilizarse vía botón atrás
    st.query_params.clear()
    st.rerun()

# ═══════════════════════════════════════════════════════
# PANTALLA LIVENESS
# ═══════════════════════════════════════════════════════

def pantalla_liveness():
    paso    = st.session_state.liveness_paso
    reto    = RETOS[paso]
    n       = len(RETOS)

    st.markdown('<div class="pl-title">🔐 Verificación de identidad</div>', unsafe_allow_html=True)
    pct = paso / n * 100
    st.markdown(f"""
    <div style="background:rgba(255,255,255,.08);border-radius:8px;height:8px;margin-bottom:6px">
      <div style="background:linear-gradient(90deg,#278BF5,#00e5c8);border-radius:8px;
                  height:8px;width:{pct:.0f}%"></div>
    </div>
    <div style="text-align:right;color:#8899bb;font-size:12px;margin-bottom:12px">
      Paso {paso+1} de {n}
    </div>""", unsafe_allow_html=True)

    col_cam, col_info = st.columns([3,2])
    with col_cam:
        frame_ph = st.image([])
    with col_info:
        st.markdown(f'<div class="liveness-inst">{reto["inst"]}</div>', unsafe_allow_html=True)
        tiempo_ph  = st.empty()
        btn_manual = st.button("✅ Completado (confirmar manual)")

    mp_fm = mp.solutions.face_mesh
    fm    = mp_fm.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True)
    cap   = cv2.VideoCapture(0)

    frames_reto = []
    t0          = time.time()
    fps_target  = 15
    ultimo_r    = {}

    for _ in range(reto["dur"] * fps_target):
        ret, frame = cap.read()
        if not ret:
            break
        frame = cv2.flip(frame, 1)
        rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res   = fm.process(rgb)
        r_par = {}

        if res.multi_face_landmarks:
            
            mp_drawing = mp.solutions.drawing_utils

            for face_landmarks in res.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                frame,
                face_landmarks,
                mp.solutions.face_mesh.FACEMESH_TESSELATION
                )
            lm  = res.multi_face_landmarks[0].landmark
            ih, iw = frame.shape[:2]
            r_par = dict(
                ear=(calcular_ear(lm,OJO_IZQ)+calcular_ear(lm,OJO_DER))/2,
                mar=calcular_mar(lm),
                pitch=calcular_pitch(lm, ih, iw),
                yaw=calcular_yaw(lm),
                dist_cejas=distancia_cejas(lm),
            )
            frames_reto.append(r_par)
            ultimo_r = r_par
            cv2.putText(frame,"Rostro OK",(10,30),cv2.FONT_HERSHEY_SIMPLEX,0.7,(0,220,100),2)
        else:
            cv2.putText(frame,"Coloca tu rostro",(10,30),cv2.FONT_HERSHEY_SIMPLEX,0.65,(0,150,255),2)

        frame_ph.image(frame, channels="BGR", use_container_width=True)
        restante = reto["dur"] - (time.time()-t0)
        tiempo_ph.markdown(f"<div style='color:#8899bb;font-size:13px;text-align:center'>⏱️ {max(0,restante):.1f}s</div>", unsafe_allow_html=True)
        time.sleep(1/fps_target)
        if btn_manual:
            break

    cap.release()
    fm.close()

    ok = btn_manual or verificar_reto(reto["id"], frames_reto)
    st.session_state.liveness_paso += 1

    if ok:
        if st.session_state.liveness_paso >= n:
            st.session_state.liveness_ok = True
            st.session_state.fase = "monitoreo"
            st.success("✅ Verificación completada. ¡Iniciando monitoreo!")
            time.sleep(0.8)
        st.rerun()
    else:
        st.warning("No se detectó la acción. Intenta de nuevo.")
        st.session_state.liveness_paso -= 1   # reintenta mismo paso
        time.sleep(1)
        st.rerun()

# ═══════════════════════════════════════════════════════
# PANTALLA MONITOREO
# ═══════════════════════════════════════════════════════

def pantalla_monitoreo():
    ss       = st.session_state
    perfil   = ss.perfil
    umbrales = ss.umbrales
    conds    = umbrales.get("condiciones", [])

    # Header
    c1, c2 = st.columns([4,1])
    with c1:
        st.markdown('<div class="pl-title">⚡ Monitoreo activo</div>', unsafe_allow_html=True)
        puesto = perfil.get("trabajo",{}).get("puesto","")
        st.markdown(f'<div class="pl-subtitle">👤 {puesto} &nbsp;|&nbsp; Sesión iniciada {ss.inicio_sesion.strftime("%H:%M")}</div>', unsafe_allow_html=True)
    with c2:
        if st.button("🚪 Salir"):
            for k in ["fase","id_usuario","liveness_ok","liveness_paso",
                      "blink_count","hist_ear","blink_window","recomendacion"]:
                st.session_state.pop(k, None)
            st.rerun()

    if conds and "ninguna" not in conds:
        st.info(f"⚙️ Análisis adaptado: {', '.join(conds)}")

    col_vid, col_panel = st.columns([3,2])
    with col_vid:
        frame_ph = st.image([])
    with col_panel:
        ph_nivel   = st.empty()
        ph_metrics = st.empty()
        ph_alertas = st.empty()
        ph_reco    = st.empty()

    st.divider()
    sc1,sc2,sc3,sc4 = st.columns(4)
    ph_t  = sc1.empty()
    ph_n1 = sc2.empty()
    ph_n2 = sc3.empty()
    ph_n3 = sc4.empty()

    mp_fm = mp.solutions.face_mesh
    fm    = mp_fm.FaceMesh(static_image_mode=False, max_num_faces=1,
                           refine_landmarks=True, min_detection_confidence=0.7, min_tracking_confidence=0.7)
    cap, cam_idx = abrir_camara()
    if cap is None:
        st.error("No se pudo acceder a ninguna cámara.")
        return

    LABEL = {1:"Normal", 2:"Moderada", 3:"Alta"}

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                st.error("No se pudo leer la cámara.")
                break
            frame = cv2.flip(frame, 1)
            frame_out, res = analizar_frame(frame, fm, umbrales, ss)
            frame_ph.image(frame_out, channels="BGR", use_container_width=True)

            nivel = res["nivel"] or 1

            # Log al backend cada 5s
            ahora = time.time()
            if res["rostro"] and ahora - ss.ultimo_log_t > 5:
                try:
                    requests.post(f"{API_URL}/log_nivel", json={
                        "id_usuario": ss.id_usuario,
                        "nivel_fatiga": nivel,
                        "ear_value": res["ear"],
                        "fecha_hora": datetime.now().isoformat(),
                    }, timeout=2)
                except:
                    pass
                ss.ultimo_log_t = ahora
                ss.historial_niveles.append(nivel)
                ss.frames_nivel[nivel] = ss.frames_nivel.get(nivel,0) + 1

            # Panel de estado
            col_e = {1:"#10b981", 2:"#f59e0b", 3:"#ef4444"}
            ph_nivel.markdown(f"""
            <div class="pl-card" style="text-align:center;padding:16px">
              <div style="color:#8899bb;font-size:10px;text-transform:uppercase;letter-spacing:1px">Estado actual</div>
              <div style="font-size:18px;font-weight:800;margin:8px 0;color:{col_e[nivel]}">{res['estado_texto']}</div>
              <span class="nivel-badge nivel-{nivel}">Fatiga {LABEL[nivel]}</span>
            </div>""", unsafe_allow_html=True)

            ph_metrics.markdown(f"""
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
              <div class="metric-box"><div class="metric-val">{res['ear']:.2f}</div><div class="metric-lbl">EAR (ojos)</div></div>
              <div class="metric-box"><div class="metric-val">{res['parpadeos_min']:.0f}</div><div class="metric-lbl">Parpadeos/min</div></div>
              <div class="metric-box"><div class="metric-val">{res['pitch']:.0f}°</div><div class="metric-lbl">Cabeceo</div></div>
              <div class="metric-box"><div class="metric-val">{res['mar']:.2f}</div><div class="metric-lbl">MAR (boca)</div></div>
              <div class="metric-box"><div class="metric-val">{res['dist_cejas']:.3f}</div><div class="metric-lbl">Cejas</div></div>
              <div class="metric-box"><div class="metric-val">{'🟢' if nivel==1 else '🟡' if nivel==2 else '🔴'}</div><div class="metric-lbl">Nivel {nivel}/3</div></div>
            </div>""", unsafe_allow_html=True)

            if res["alertas"]:
                ph_alertas.markdown(
                    "".join(f'<div class="alerta-box">⚠️ {a}</div>' for a in res["alertas"]),
                    unsafe_allow_html=True)
            else:
                ph_alertas.empty()

            # Recomendación IA cada 30s si nivel ≥ 2
            if nivel >= 2 and ahora - ss.recomendacion_t > 30:
                ico, txt = get_recomendacion(res["estado_key"], perfil, list(ss.historial_niveles))
                ss.recomendacion   = f"{ico} {txt}"
                ss.recomendacion_t = ahora

            if ss.recomendacion:
                ph_reco.markdown(f"""
                <div class="reco-box">
                  <div style="font-size:10px;color:#6ee7d0;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">💡 Recomendación</div>
                  {ss.recomendacion}
                </div>""", unsafe_allow_html=True)

            # Stats sesión
            elapsed = int((datetime.now() - ss.inicio_sesion).total_seconds())
            total_f = max(sum(ss.frames_nivel.values()), 1)
            ph_t.metric("⏱️ Tiempo", f"{elapsed//60:02d}:{elapsed%60:02d}")
            ph_n1.metric("🟢 Normal",  f"{ss.frames_nivel.get(1,0)/total_f*100:.0f}%")
            ph_n2.metric("🟡 Mod.",    f"{ss.frames_nivel.get(2,0)/total_f*100:.0f}%")
            ph_n3.metric("🔴 Alta",    f"{ss.frames_nivel.get(3,0)/total_f*100:.0f}%")

            time.sleep(0.05)

    finally:
        cap.release()
        fm.close()

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════

def main():
    st.set_page_config(
        page_title="ProLife – Detección de Fatiga",
        page_icon="⚡", layout="wide",
        initial_sidebar_state="collapsed"
    )
    apply_css()
    init_session()

    fase = st.session_state.fase
    if   fase == "login":     pantalla_login()
    elif fase == "liveness":  pantalla_liveness()
    elif fase == "monitoreo": pantalla_monitoreo()

if __name__ == "__main__":
    main()  