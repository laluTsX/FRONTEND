    import React, { useState, useRef, useEffect } from 'react';
    import axios from 'axios';
    import SlidingLogin from './components/SlidingLogin';
    import AnalyticsDashboard from './components/AnalyticsDashboard';
    import '@fortawesome/fontawesome-free/css/all.min.css';

    function App() {
    const [user, setUser] = useState(null);
    const [estadoFatiga, setEstadoFatiga] = useState('Iniciando analisis...');
    const [nivelFatiga, setNivelFatiga] = useState(1);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [enPausa, setEnPausa] = useState(false);
    const [mejoraPausa, setMejoraPausa] = useState(null);
    const [earActual, setEarActual] = useState(0);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const API_URL = 'http://localhost:5000';

    useEffect(() => {}, []);

    const startCamera = async () => {
        try {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } 
        });
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
        console.error("Error al acceder a la cámara:", err);
        alert("No se pudo acceder a la cámara. Por favor verifica los permisos.");
        }
    };

    useEffect(() => {
        if (!showAnalytics && videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        }
    }, [showAnalytics]);

    const analizarCamara = async () => {
        if (user && videoRef.current && videoRef.current.readyState === 4) {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(videoRef.current, 0, 0);
        const base64Image = canvas.toDataURL("image/jpeg");

        try {
            const res = await axios.post(`${API_URL}/analizar_fatiga`, {
            image: base64Image, id_usuario: user.id_usuario
            });
            setEstadoFatiga(res.data.estado);
            setEarActual(res.data.ear || res.data.nivel || 0.3);
            const nivel = res.data.nivel;
            setNivelFatiga(nivel === 0 || nivel === undefined ? 1 : nivel);
        } catch (err) {
            console.error("Error al analizar fatiga", err);
        }
        }
    };

    useEffect(() => {
        let interval;
        if (user && videoRef.current && videoRef.current.srcObject) {
        interval = setInterval(analizarCamara, 2000);
        }
        return () => clearInterval(interval);
    }, [user, showAnalytics]);

    useEffect(() => {
        if (user) {
        document.body.style.background = isDarkMode ? '#003C78' : '#e0f2fe';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
        }
        return () => { document.body.style.background = ''; };
    }, [isDarkMode, user]);

    // ============================================
    // FUNCIONES DE PAUSA
    // ============================================
    const iniciarPausa = async () => {
        try {
            const ear = earActual || 0.3; 
            await axios.post(`${API_URL}/pausa/iniciar`, {
                id_usuario: user.id_usuario,
                ear_actual: ear
            });
            setEnPausa(true);
            setMejoraPausa(null);
        } catch (err) {
            console.error("Error al iniciar pausa:", err);
        }
    };

    const finalizarPausa = async () => {
        try {
            const ear = earActual || 0.3;
            const res = await axios.post(`${API_URL}/pausa/finalizar`, {
                id_usuario: user.id_usuario,
                ear_actual: ear
            });
            setEnPausa(false);
            setMejoraPausa(res.data.mejora_pct);
        } catch (err) {
            console.error("Error al finalizar pausa:", err);
        }
    };

    const handleLogin = (userData) => {
        setUser(userData);
        setShowAnalytics(false);
        setEnPausa(false);
        setMejoraPausa(null);
        localStorage.setItem('prolife_user', JSON.stringify(userData));
        startCamera();
    };

    const handleLogout = () => {
        if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        }
        setUser(null);
        setShowAnalytics(false);
        setEnPausa(false);
        localStorage.removeItem('prolife_user');
        document.body.style.background = '';
    };

    if (user) {
        const nivelInfoMap = {
        1: { bg: '#10b981', bgLight: 'rgba(16, 185, 129, 0.15)', color: '#10b981', texto: 'Normal', icono: 'fa-smile-wink', descripcion: 'Tu nivel de energía es óptimo. Sigue así.' },
        2: { bg: '#f59e0b', bgLight: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', texto: 'Moderada', icono: 'fa-tired', descripcion: 'Presentas signos de cansancio. Toma un breve descanso.' },
        3: { bg: '#ef4444', bgLight: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', texto: 'Alta', icono: 'fa-exclamation-triangle', descripcion: 'Fatiga significativa. Es recomendable descansar.' }
        };
        
        const nivelValido = [1, 2, 3].includes(nivelFatiga) ? nivelFatiga : 1;
        const nivelInfo = nivelInfoMap[nivelValido];

        const hora = new Date().getHours();
        let saludo = '';
        if (hora < 12) saludo = 'Buenos días';
        else if (hora < 18) saludo = 'Buenas tardes';
        else saludo = 'Buenas noches';

        const themeColors = isDarkMode ? {
        background: 'linear-gradient(135deg, #003C78 0%, #1a5ba8 50%, #278BF5 100%)',
        headerBg: 'rgba(0, 60, 120, 0.95)',
        cardBg: 'rgba(0, 60, 120, 0.4)',
        glassBg: 'rgba(0, 60, 120, 0.5)',
        text: 'white',
        textSecondary: 'rgba(255,255,255,0.8)',
        border: 'rgba(255,255,255,0.2)',
        iconColor: '#278BF5'
        } : {
        background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)',
        headerBg: 'rgba(255, 255, 255, 0.95)',
        cardBg: 'rgba(255, 255, 255, 0.5)',
        glassBg: 'rgba(255, 255, 255, 0.6)',
        text: '#003C78',
        textSecondary: '#1e3a5f',
        border: 'rgba(0, 60, 120, 0.3)',
        iconColor: '#003C78'
        };

        return (
        <div style={{ 
            minHeight: '100vh', width: '100%', background: themeColors.background,
            fontFamily: "'Montserrat', 'Inter', sans-serif", transition: 'all 0.3s ease',
            margin: 0, padding: 0, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflowY: 'auto'
        }}>
            <nav style={{ 
            background: themeColors.headerBg, backdropFilter: 'blur(16px)',
            padding: '12px 24px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: `1px solid ${themeColors.border}`,
            width: '100%', boxSizing: 'border-box', flexWrap: 'wrap', gap: '12px'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#278BF5', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className="fas fa-bolt" style={{ color: 'white' }}></i>
                </div>
                <div>
                <h1 style={{ color: themeColors.text, margin: 0, fontSize: '18px', fontWeight: 'bold' }}>ProLife Energy Co-pilot</h1>
                <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: '10px' }}>Monitoreo de fatiga inteligente</p>
                </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowAnalytics(!showAnalytics)} style={{
                background: showAnalytics ? '#10b981' : themeColors.glassBg, backdropFilter: 'blur(10px)',
                border: `1px solid ${showAnalytics ? '#10b981' : themeColors.border}`, borderRadius: '20px',
                padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s ease'
                }}>
                <i className="fas fa-chart-bar" style={{ color: showAnalytics ? 'white' : themeColors.text, fontSize: '12px' }}></i>
                <span style={{ color: showAnalytics ? 'white' : themeColors.text, fontSize: '11px', fontWeight: 'bold' }}>
                    {showAnalytics ? 'Monitoreo' : 'Analytics'}
                </span>
                </button>

                <button onClick={() => setIsDarkMode(!isDarkMode)} style={{
                background: themeColors.glassBg, backdropFilter: 'blur(10px)',
                border: `1px solid ${themeColors.border}`, borderRadius: '20px',
                padding: '6px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.3s ease'
                }}>
                {isDarkMode ? (
                    <><i className="fas fa-sun" style={{ color: '#fbbf24', fontSize: '12px' }}></i><span style={{ color: themeColors.text, fontSize: '11px', fontWeight: 'bold' }}>Modo Claro</span></>
                ) : (
                    <><i className="fas fa-moon" style={{ color: '#003C78', fontSize: '12px' }}></i><span style={{ color: themeColors.text, fontSize: '11px', fontWeight: 'bold' }}>Modo Oscuro</span></>
                )}
                </button>
                <div style={{ textAlign: 'right' }}>
                <p style={{ color: themeColors.textSecondary, margin: 0, fontSize: '10px' }}>{saludo}</p>
                <span style={{ color: themeColors.text, fontWeight: 'bold', fontSize: '13px' }}>{user.nombre}</span>
                </div>
                <button onClick={handleLogout} style={{
                background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '12px', transition: 'all 0.3s ease'
                }}>
                <i className="fas fa-sign-out-alt" style={{ marginRight: '6px' }}></i>Cerrar Sesión
                </button>
            </div>
            </nav>

            <div style={{ width: '100%', margin: '0', padding: '20px 24px', position: 'relative', boxSizing: 'border-box' }}>
            {showAnalytics ? (
                <AnalyticsDashboard userId={user.id_usuario} isDarkMode={isDarkMode} />
            ) : (
                <>
                <div style={{ background: themeColors.cardBg, backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '12px 20px', marginBottom: '20px', border: `1px solid ${themeColors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                        <div style={{ background: `linear-gradient(135deg, ${nivelInfo.color} 0%, ${nivelInfo.color}cc 100%)`, width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <i className={`fas ${nivelInfo.icono}`} style={{ color: 'white', fontSize: '24px' }}></i>
                        </div>
                        <div>
                        <h2 style={{ margin: 0, color: themeColors.textSecondary, fontSize: '11px', fontWeight: 'normal' }}>Nivel de Fatiga Actual</h2>
                        <p style={{ margin: '3px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: nivelInfo.color }}>{nivelInfo.texto}</p>
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: '200px', maxWidth: '100%' }}>
                        <p style={{ margin: 0, color: themeColors.textSecondary, fontSize: '12px', lineHeight: '1.4' }}>{nivelInfo.descripcion}</p>
                        {estadoFatiga !== 'Rostro no detectado' && (
                        <div style={{ marginTop: '8px', background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)', padding: '4px 12px', borderRadius: '10px', display: 'inline-block' }}>
                            <span style={{ fontSize: '11px', color: themeColors.textSecondary }}>EAR: </span>
                            <span style={{ fontWeight: 'bold', color: nivelInfo.color, fontSize: '11px' }}>{estadoFatiga.split(' - ')[1] || estadoFatiga}</span>
                        </div>
                        )}
                    </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2', minWidth: '280px' }}>
                    <div style={{ background: themeColors.cardBg, backdropFilter: 'blur(12px)', borderRadius: '16px', overflow: 'hidden', border: `1px solid ${themeColors.border}` }}>
                        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${themeColors.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: themeColors.text, fontSize: '15px' }}>
                            <i className="fas fa-video" style={{ marginRight: '8px', color: '#10b981', fontSize: '14px' }}></i>Monitoreo en Vivo
                        </h3>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        </div>
                        <div style={{ padding: '16px' }}>
                        <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxWidth: '560px', height: 'auto', display: 'block', margin: '0 auto', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', background: '#000' }} />
                        </div>
                    </div>

                    {/* 🔴 BOTÓN DE PAUSA */}
                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                        {!enPausa ? (
                        <button onClick={iniciarPausa} style={{
                            background: '#f59e0b', border: 'none', color: 'white',
                            padding: '10px 20px', borderRadius: '20px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '13px'
                        }}>
                            <i className="fas fa-coffee" style={{ marginRight: '6px' }}></i>
                            Iniciar Pausa de 5 min
                        </button>
                        ) : (
                        <div>
                            <p style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '8px' }}>⏳ Pausa activa en curso...</p>
                            <button onClick={finalizarPausa} style={{
                            background: '#10b981', border: 'none', color: 'white',
                            padding: '10px 20px', borderRadius: '20px', cursor: 'pointer',
                            fontWeight: 'bold', fontSize: '13px'
                            }}>
                            <i className="fas fa-check" style={{ marginRight: '6px' }}></i>
                            Finalizar Pausa
                            </button>
                        </div>
                        )}
                        {mejoraPausa !== null && (
                        <p style={{ marginTop: '10px', color: mejoraPausa > 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                            {mejoraPausa > 0 ? `✅ Fatiga reducida en ${mejoraPausa}%` : `Sin cambio significativo`}
                        </p>
                        )}
                    </div>
                    </div>
                    
                    <div style={{ flex: '1', minWidth: '240px' }}>
                    <div style={{ background: themeColors.cardBg, backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '14px', marginBottom: '16px', border: `1px solid ${themeColors.border}` }}>
                        <h3 style={{ margin: '0 0 10px 0', color: themeColors.text, fontSize: '15px' }}>
                        <i className="fas fa-lightbulb" style={{ marginRight: '8px', color: '#f59e0b', fontSize: '14px' }}></i>Recomendaciones
                        </h3>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: themeColors.textSecondary, fontSize: '12px', lineHeight: '1.6' }}>
                        <li>Mantén una buena iluminación en tu espacio</li>
                        <li>Parpadea conscientemente cada pocos segundos</li>
                        <li>Toma descansos de 5 minutos cada hora</li>
                        <li>Mantén una postura adecuada frente a la cámara</li>
                        </ul>
                    </div>
                    <div style={{ background: themeColors.cardBg, backdropFilter: 'blur(12px)', borderRadius: '16px', padding: '14px', border: `1px solid ${themeColors.border}` }}>
                        <h3 style={{ margin: '0 0 10px 0', color: themeColors.text, fontSize: '15px' }}>
                        <i className="fas fa-user" style={{ marginRight: '8px', color: '#278BF5', fontSize: '14px' }}></i>Mi Perfil
                        </h3>
                        <div style={{ borderBottom: `1px solid ${themeColors.border}`, padding: '8px 0' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: themeColors.textSecondary }}>Nombre</p>
                        <p style={{ margin: '3px 0 0 0', fontWeight: 'bold', color: themeColors.text, fontSize: '13px' }}>{user.nombre}</p>
                        </div>
                        <div style={{ borderBottom: `1px solid ${themeColors.border}`, padding: '8px 0' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: themeColors.textSecondary }}>Correo electrónico</p>
                        <p style={{ margin: '3px 0 0 0', color: themeColors.text, fontSize: '12px' }}>{user.email}</p>
                        </div>
                        <div style={{ padding: '8px 0' }}>
                        <p style={{ margin: 0, fontSize: '10px', color: themeColors.textSecondary }}>Estado del sistema</p>
                        <p style={{ margin: '3px 0 0 0', color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>
                            <i className="fas fa-circle" style={{ fontSize: '6px', marginRight: '6px' }}></i>Activo
                        </p>
                        </div>
                    </div>
                    </div>
                </div>

                {estadoFatiga === 'Rostro no detectado' && (
                    <div style={{ marginTop: '20px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '18px', color: '#f59e0b' }}></i>
                    <div>
                        <p style={{ margin: 0, fontWeight: 'bold', color: '#f59e0b', fontSize: '12px' }}>No se detecta un rostro</p>
                        <p style={{ margin: '3px 0 0 0', fontSize: '11px', color: themeColors.textSecondary }}>Asegúrate de estar frente a la cámara y tener buena iluminación</p>
                    </div>
                    </div>
                )}
                </>
            )}
            </div>
        </div>
        );
    }

    return <SlidingLogin onLogin={handleLogin} />;
    }

    export default App;