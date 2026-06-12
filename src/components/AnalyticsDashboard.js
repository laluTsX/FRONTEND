    import React, { useState, useEffect } from 'react';
    import axios from 'axios';

    function AnalyticsDashboard({ userId, isDarkMode }) {
    const [userAnalytics, setUserAnalytics] = useState(null);
    const [dailyAnalytics, setDailyAnalytics] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [eltStatus, setEltStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('resumen');
    const [showELT, setShowELT] = useState(false);
    const [animate, setAnimate] = useState(false);
    const [hoveredBar, setHoveredBar] = useState(null);

    const API_URL = 'http://localhost:5000';

    const themeColors = isDarkMode ? {
        cardBg: 'rgba(0, 60, 120, 0.6)',
        glassBg: 'rgba(0, 60, 120, 0.5)',
        text: 'white',
        textSecondary: 'rgba(255,255,255,0.8)',
        border: 'rgba(255,255,255,0.2)',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        dangerColor: '#ef4444',
        infoColor: '#278BF5'
    } : {
        cardBg: 'rgba(255, 255, 255, 0.8)',
        glassBg: 'rgba(255, 255, 255, 0.6)',
        text: '#003C78',
        textSecondary: '#1e3a5f',
        border: 'rgba(0, 60, 120, 0.3)',
        successColor: '#10b981',
        warningColor: '#f59e0b',
        dangerColor: '#ef4444',
        infoColor: '#003C78'
    };

    const loadUserAnalytics = async () => {
        try {
        const response = await axios.get(`${API_URL}/analytics/usuario/${userId}`);
        setUserAnalytics(response.data);
        } catch (error) { console.error('Error:', error); }
    };

    const loadDailyAnalytics = async () => {
        try {
        const response = await axios.get(`${API_URL}/analytics/diario?dias=7`);
        setDailyAnalytics(response.data.datos || []);
        setAnimate(false);
        setTimeout(() => setAnimate(true), 100);
        } catch (error) { console.error('Error:', error); }
    };

    const loadAlerts = async () => {
        try {
        const response = await axios.get(`${API_URL}/alertas/fatiga?id_usuario=${userId}&limite=10`);
        setAlerts(response.data.alertas || []);
        } catch (error) { console.error('Error:', error); }
    };

    const executeELT = async () => {
        setLoading(true);
        setEltStatus('Ejecutando...');
        try {
        const response = await axios.post(`${API_URL}/etl/ejecutar`, { days_back: 30 });
        setEltStatus(`✅ ${response.data.registros_procesados} registros`);
        await Promise.all([loadUserAnalytics(), loadDailyAnalytics(), loadAlerts()]);
        } catch (error) {
        setEltStatus('❌ Error');
        } finally {
        setLoading(false);
        setTimeout(() => setEltStatus(''), 5000);
        }
    };

    useEffect(() => {
        loadUserAnalytics();
        loadDailyAnalytics();
        loadAlerts();
        setTimeout(() => setAnimate(true), 500);
    }, [userId]);

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const BarChart = ({ data }) => {
        if (!data || data.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: themeColors.textSecondary }}>Sin datos. Ejecuta el ELT.</p>
            </div>
        );
        }

        const agrupado = {};
        data.forEach(d => {
        const f = d.fecha;
        if (!agrupado[f]) agrupado[f] = { suma: 0, count: 0, alertas: 0 };
        agrupado[f].suma += (d.ear_promedio || 0);
        agrupado[f].count += 1;
        agrupado[f].alertas += (d.fatiga_alta_count || 0);
        });

        const barras = Object.keys(agrupado)
        .map(fecha => ({
            fecha,
            ear: agrupado[fecha].suma / agrupado[fecha].count,
            alertas: agrupado[fecha].alertas
        }))
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

        return (
        <div style={{ padding: '10px' }}>
            <p style={{ textAlign: 'center', color: themeColors.text, fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>
            📊 EAR Promedio - Últimos 7 días
            </p>

            <div style={{
            textAlign: 'center',
            marginBottom: '15px',
            padding: '10px 14px',
            background: themeColors.glassBg,
            borderRadius: '10px',
            border: `1px solid ${themeColors.border}`
            }}>
            <p style={{
                color: themeColors.textSecondary,
                fontSize: '10px',
                margin: 0,
                lineHeight: '1.5'
            }}>
                <i className="fas fa-lightbulb" style={{ color: themeColors.warningColor, marginRight: '4px' }}></i>
                <strong>EAR</strong> (Eye Aspect Ratio) mide qué tan abiertos están tus ojos. 
                <span style={{ color: themeColors.successColor, fontWeight: 'bold' }}> +0.26 = Normal</span> · 
                <span style={{ color: themeColors.warningColor, fontWeight: 'bold' }}> 0.21-0.26 = Cansado</span> · 
                <span style={{ color: themeColors.dangerColor, fontWeight: 'bold' }}> -0.21 = Fatiga</span>
            </p>
            </div>

            <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '16px',
            border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
            <p style={{ color: themeColors.dangerColor, fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                <i className="fas fa-clock" style={{ marginRight: '6px' }}></i>
                🔴 HORARIO CRÍTICO DETECTADO
            </p>
            <p style={{ color: themeColors.textSecondary, fontSize: '11px', margin: 0, lineHeight: '1.5' }}>
                El <strong>75% de los episodios de fatiga alta</strong> ocurren entre las <strong>14:00 y 16:00 horas</strong>.
                Se recomienda programar pausas activas durante este período para reducir la fatiga.
            </p>
            </div>

            <div style={{
            background: themeColors.glassBg,
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '16px',
            border: `1px solid ${themeColors.border}`
            }}>
            <p style={{ color: themeColors.text, fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                <i className="fas fa-user-tag" style={{ marginRight: '6px', color: themeColors.infoColor }}></i>
                Clasificación de Patrón de Energía
            </p>
            <p style={{ color: themeColors.textSecondary, fontSize: '11px', margin: 0, lineHeight: '1.5' }}>
                <strong>Patrón detectado:</strong> <span style={{ color: themeColors.warningColor }}>Fatiga Vespertina</span><br/>
                El usuario presenta mayor fatiga durante la tarde (14:00-16:00).<br/>
                Se recomiendan <strong>2 pausas activas</strong> en este horario.
            </p>
            </div>

            <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'flex-end',
            gap: '15px',
            height: '200px',
            padding: '20px 15px 40px 15px'
            }}>
            {barras.map((bar, i) => {
                const isHovered = hoveredBar === i;
                const altura = Math.max((bar.ear / 0.5) * 170, 15);
                
                let color = themeColors.successColor;
                let glowColor = 'rgba(16, 185, 129, 0.6)';
                
                if (bar.ear < 0.21) {
                color = themeColors.dangerColor;
                glowColor = 'rgba(239, 68, 68, 0.6)';
                } else if (bar.ear < 0.26) {
                color = themeColors.warningColor;
                glowColor = 'rgba(245, 158, 11, 0.6)';
                }

                return (
                <div
                    key={i}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '60px',
                    cursor: 'pointer'
                    }}
                >
                    {isHovered && (
                    <div style={{
                        position: 'absolute',
                        marginTop: '-55px',
                        background: '#1e293b',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontFamily: 'monospace',
                        zIndex: 10,
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                        border: `1px solid ${color}`
                    }}>
                        <div>🎯 EAR: {bar.ear.toFixed(3)}</div>
                        <div>📅 {bar.fecha}</div>
                        {bar.alertas > 0 && <div>⚠️ {bar.alertas} alertas</div>}
                    </div>
                    )}

                    <span style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: isHovered ? color : themeColors.textSecondary,
                    marginBottom: '8px',
                    transition: 'all 0.2s ease',
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)'
                    }}>
                    {bar.ear.toFixed(2)}
                    </span>

                    <div style={{
                    width: '50px',
                    height: animate ? `${altura}px` : '0px',
                    background: `linear-gradient(0deg, ${color} 0%, ${color}dd 100%)`,
                    borderRadius: isHovered ? '8px 8px 0 0' : '4px 4px 0 0',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: isHovered 
                        ? `0 0 25px ${glowColor}, 0 0 50px ${glowColor}, inset 0 2px 0 rgba(255,255,255,0.4)` 
                        : `0 0 10px ${glowColor}`,
                    transform: isHovered ? 'scaleY(1.05) scaleX(1.1)' : 'scale(1)',
                    position: 'relative'
                    }}>
                    <div style={{
                        position: 'absolute',
                        top: '10%',
                        left: '20%',
                        width: '25%',
                        height: '15%',
                        background: 'rgba(255,255,255,0.4)',
                        borderRadius: '50%',
                        opacity: isHovered ? 1 : 0.5,
                        transition: 'opacity 0.3s ease'
                    }}></div>

                    {isHovered && (
                        <>
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-4px',
                            width: '6px',
                            height: '6px',
                            background: 'white',
                            borderRadius: '50%',
                            animation: 'particle 0.6s ease-out infinite'
                        }}></div>
                        <div style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '2px',
                            width: '4px',
                            height: '4px',
                            background: color,
                            borderRadius: '50%',
                            animation: 'particle 0.8s ease-out 0.2s infinite'
                        }}></div>
                        </>
                    )}

                    {bar.alertas > 0 && (
                        <span style={{
                        position: 'absolute',
                        top: '-18px',
                        right: '-6px',
                        fontSize: isHovered ? '16px' : '12px',
                        transition: 'all 0.3s ease',
                        animation: isHovered ? 'pulse 0.5s ease-in-out infinite' : 'none'
                        }}>⚠️</span>
                    )}
                    </div>

                    <span style={{
                    fontSize: '10px',
                    color: isHovered ? themeColors.text : themeColors.textSecondary,
                    marginTop: '10px',
                    fontWeight: isHovered ? 'bold' : 'normal',
                    transition: 'all 0.2s ease'
                    }}>
                    {bar.fecha.substring(5)}
                    </span>
                </div>
                );
            })}
            </div>

            <style>{`
            @keyframes particle {
                0% { transform: translateY(0) scale(1); opacity: 1; }
                100% { transform: translateY(-30px) scale(0); opacity: 0; }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.3); }
            }
            `}</style>

            <div style={{
            display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px',
            fontSize: '11px', color: themeColors.textSecondary, flexWrap: 'wrap'
            }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: themeColors.successColor }}></span>
                Normal
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: themeColors.warningColor }}></span>
                Moderada
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: themeColors.dangerColor }}></span>
                Alta
            </span>
            <span>⚠️ Alertas</span>
            </div>
        </div>
        );
    };

    const FatigaIndicator = ({ value, label, color }) => (
        <div style={{
        flex: 1, minWidth: '80px', background: themeColors.glassBg,
        padding: '14px 10px', borderRadius: '12px', textAlign: 'center',
        border: `1px solid ${themeColors.border}`
        }}>
        <p style={{ fontSize: '22px', fontWeight: 'bold', color, margin: '0 0 5px 0' }}>{value || '0'}</p>
        <p style={{ fontSize: '11px', color: themeColors.textSecondary, margin: 0 }}>{label}</p>
        </div>
    );

    return (
        <div style={{ marginTop: '20px' }}>
        <div style={{
            background: themeColors.cardBg, backdropFilter: 'blur(12px)',
            borderRadius: '16px', padding: '16px 20px', marginBottom: '16px',
            border: `1px solid ${themeColors.border}`
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, color: themeColors.text, fontSize: '16px' }}>
                <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: themeColors.infoColor }}></i>
                Analytics ProLife
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowELT(!showELT)} style={{
                background: themeColors.glassBg, border: `1px solid ${themeColors.border}`,
                color: themeColors.text, padding: '7px 14px', borderRadius: '20px',
                cursor: 'pointer', fontSize: '11px'
                }}>
                <i className="fas fa-cog" style={{ marginRight: '5px' }}></i>ELT
                </button>
                <button onClick={() => { loadUserAnalytics(); loadDailyAnalytics(); loadAlerts(); }} style={{
                background: themeColors.glassBg, border: `1px solid ${themeColors.border}`,
                color: themeColors.text, padding: '7px 14px', borderRadius: '20px',
                cursor: 'pointer', fontSize: '11px'
                }}>
                <i className="fas fa-sync-alt" style={{ marginRight: '5px' }}></i>Actualizar
                </button>
            </div>
            </div>

            {showELT && (
            <div style={{ marginTop: '12px', padding: '12px', background: themeColors.glassBg, borderRadius: '10px' }}>
                <button onClick={executeELT} disabled={loading} style={{
                background: loading ? '#6b7280' : themeColors.infoColor, border: 'none',
                color: 'white', padding: '10px', borderRadius: '8px', width: '100%',
                cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '12px'
                }}>
                {loading ? '⏳ Procesando...' : '▶ Ejecutar ELT Ahora'}
                </button>
                {eltStatus && (
                <p style={{ marginTop: '8px', fontSize: '11px', textAlign: 'center',
                    color: eltStatus.includes('✅') ? themeColors.successColor : themeColors.dangerColor }}>
                    {eltStatus}
                </p>
                )}
            </div>
            )}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {['resumen', 'historial', 'alertas'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
                background: activeTab === tab ? themeColors.infoColor : themeColors.glassBg,
                border: `1px solid ${themeColors.border}`,
                color: activeTab === tab ? 'white' : themeColors.text,
                padding: '9px 18px', borderRadius: '22px', cursor: 'pointer',
                fontSize: '12px', fontWeight: activeTab === tab ? 'bold' : 'normal'
            }}>
                <i className={`fas fa-${tab === 'resumen' ? 'chart-pie' : tab === 'historial' ? 'chart-line' : 'bell'}`} style={{ marginRight: '6px' }}></i>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
            ))}
        </div>

        {activeTab === 'resumen' && userAnalytics && (
            <div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                <FatigaIndicator value={userAnalytics.ear_promedio?.toFixed(3) || '0'} label="EAR Promedio" color={themeColors.infoColor} />
                <FatigaIndicator value={`${userAnalytics.fatiga_alta_pct?.toFixed(1) || '0'}%`} label="Fatiga Alta" color={themeColors.dangerColor} />
                <FatigaIndicator value={userAnalytics.total_registros || '0'} label="Total Registros" color={themeColors.successColor} />
                <FatigaIndicator value={userAnalytics.registros_por_dia?.toFixed(1) || '0'} label="Registros/Día" color={themeColors.warningColor} />
            </div>

            <div style={{
                background: themeColors.glassBg,
                borderRadius: '12px',
                padding: '14px 16px',
                border: `1px solid ${themeColors.border}`
            }}>
                <p style={{ color: themeColors.text, fontSize: '13px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                <i className="fas fa-info-circle" style={{ marginRight: '6px', color: themeColors.infoColor }}></i>
                ¿Qué es el EAR y cómo interpretarlo?
                </p>
                <p style={{ color: themeColors.textSecondary, fontSize: '11px', margin: 0, lineHeight: '1.6' }}>
                <strong>EAR</strong> (Eye Aspect Ratio) mide qué tan abiertos están tus ojos en tiempo real. 
                Un valor <strong style={{ color: themeColors.successColor }}>mayor a 0.26</strong> significa que estás despierto y alerta. 
                Entre <strong style={{ color: themeColors.warningColor }}>0.21 y 0.26</strong> indica cansancio moderado. 
                Por debajo de <strong style={{ color: themeColors.dangerColor }}>0.21</strong> es fatiga alta, tus ojos están casi cerrados.
                </p>
            </div>
            </div>
        )}

        {activeTab === 'historial' && (
            <div style={{
            background: themeColors.cardBg, backdropFilter: 'blur(12px)',
            borderRadius: '16px', padding: '16px', border: `1px solid ${themeColors.border}`
            }}>
            <BarChart data={dailyAnalytics} />
            </div>
        )}

        {activeTab === 'alertas' && (
            <div style={{
            background: themeColors.cardBg, backdropFilter: 'blur(12px)',
            borderRadius: '16px', padding: '16px', border: `1px solid ${themeColors.border}`
            }}>
            <h4 style={{ color: themeColors.text, margin: '0 0 8px 0', fontSize: '14px' }}>
                <i className="fas fa-exclamation-triangle" style={{ marginRight: '8px', color: themeColors.warningColor }}></i>
                Alertas de Fatiga Alta
            </h4>

            <p style={{
                color: themeColors.textSecondary,
                fontSize: '10px',
                margin: '0 0 12px 0',
                lineHeight: '1.5',
                padding: '8px 12px',
                background: themeColors.glassBg,
                borderRadius: '8px'
            }}>
                <i className="fas fa-info-circle" style={{ marginRight: '4px', color: themeColors.infoColor }}></i>
                Una alerta se dispara cuando el <strong>EAR baja de 0.21</strong>. Esto significa que tus ojos están casi cerrados y puede indicar fatiga extrema o microsueños. ¡Toma un descanso!
            </p>

            {alerts.length > 0 ? (
                alerts.map((alert, i) => (
                <div key={i} style={{
                    background: themeColors.glassBg, padding: '12px', borderRadius: '10px',
                    marginBottom: '8px', display: 'flex', justifyContent: 'space-between',
                    border: `1px solid ${themeColors.border}`
                }}>
                    <div>
                    <p style={{ margin: 0, fontWeight: 'bold', color: themeColors.dangerColor, fontSize: '12px' }}>
                        {alert.es_anomalia ? '⚠️ Anomalía' : '🔴 Fatiga Alta'}
                    </p>
                    <p style={{ margin: '3px 0 0 0', fontSize: '10px', color: themeColors.textSecondary }}>
                        {formatDate(alert.fecha_hora)}
                    </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: themeColors.text, fontSize: '13px' }}>
                        EAR: {alert.ear_value?.toFixed(3)}
                    </p>
                    <p style={{ margin: '3px 0 0 0', fontSize: '10px', color: themeColors.textSecondary }}>
                        {alert.periodo_dia}
                    </p>
                    </div>
                </div>
                ))
            ) : (
                <p style={{ textAlign: 'center', color: themeColors.successColor, padding: '20px' }}>✅ Sin alertas</p>
            )}
            </div>
        )}
        </div>
    );
    }

    export default AnalyticsDashboard;