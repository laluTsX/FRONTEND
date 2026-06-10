    import React, { useState } from 'react';
    import axios from 'axios';
    import './SlidingLogin.css';

    function SlidingLogin({ onLogin }) {
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    
    // Estado para registro
    const [regNombre, setRegNombre] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regError, setRegError] = useState('');
    const [regSuccess, setRegSuccess] = useState('');
    
    // Estado para login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    
    const [loading, setLoading] = useState(false);

    const API_URL = 'http://localhost:5000';

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setRegError('');
        setRegSuccess('');

        if (!regNombre || !regEmail || !regPassword) {
        setRegError('Por favor completa todos los campos');
        setLoading(false);
        return;
        }

        if (regPassword.length < 6) {
        setRegError('La contraseña debe tener al menos 6 caracteres');
        setLoading(false);
        return;
        }

        try {
        const response = await axios.post(`${API_URL}/registro`, {
            nombre: regNombre,
            email: regEmail,
            password: regPassword
        });

        if (response.status === 201) {
            setRegSuccess('¡Registro exitoso! Ahora inicia sesión');
            setRegNombre('');
            setRegEmail('');
            setRegPassword('');
            
            setTimeout(() => {
            setIsRightPanelActive(false);
            setLoginEmail(regEmail);
            setRegSuccess('');
            }, 2000);
        }
        } catch (error) {
        setRegError(error.response?.data?.error || 'Error al registrar');
        } finally {
        setLoading(false);
        }
    };

    const handleSignIn = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');

        if (!loginEmail || !loginPassword) {
        setLoginError('Por favor ingresa email y contraseña');
        setLoading(false);
        return;
        }

        try {
        const response = await axios.post(`${API_URL}/login`, {
            email: loginEmail,
            password: loginPassword
        });

        if (response.status === 200) {
            onLogin(response.data);
        }
        } catch (error) {
        setLoginError(error.response?.data?.error || 'Error al iniciar sesión');
        } finally {
        setLoading(false);
        }
    };

    return (
        <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        background: '#EDEBF0',
        fontFamily: 'Montserrat, sans-serif'
        }}>
        <div className={`container-sliding ${isRightPanelActive ? 'right-panel-active' : ''}`} id="container">
            
            {/* Formulario de Registro */}
            <div className="form-container sign-up-container">
            <form onSubmit={handleSignUp}>
                <h1>Crear Cuenta</h1>

                <input 
                type="text" 
                placeholder="Nombre completo" 
                value={regNombre}
                onChange={(e) => setRegNombre(e.target.value)}
                required
                />
                
                <input 
                type="email" 
                placeholder="Correo electrónico" 
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                />
                
                <input 
                type="password" 
                placeholder="Contraseña" 
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                />
                
                {regError && <div className="error-message">{regError}</div>}
                {regSuccess && <div className="success-message">{regSuccess}</div>}
                
                <button type="submit" disabled={loading}>
                {loading ? 'Cargando...' : 'Registrarse'}
                </button>
            </form>
            </div>

            {/* Formulario de Login */}
            <div className="form-container sign-in-container">
            <form onSubmit={handleSignIn}>
                <h1>Iniciar Sesión</h1>
                
                <input 
                type="email" 
                placeholder="Correo electrónico" 
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                />
                
                <input 
                type="password" 
                placeholder="Contraseña" 
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                />
                
                <a href="#">¿Olvidaste tu contraseña?</a>
                
                {loginError && <div className="error-message">{loginError}</div>}
                
                <button type="submit" disabled={loading}>
                {loading ? 'Cargando...' : 'Ingresar'}
                </button>
            </form>
            </div>

            {/* Panel Overlay */}
            <div className="overlay-container">
            <div className="overlay">
                <div className="overlay-panel overlay-left">
                <h1>¡Bienvenido A Prolife!</h1>
                <p>Para mantenerconexión con nosotros, inicia sesión con tus datos personales</p>
                <button className="ghost" onClick={() => setIsRightPanelActive(false)} id="signIn">
                    Iniciar Sesión
                </button>
                </div>
                <div className="overlay-panel overlay-right">
                <h1>¡Hola, Amigo!</h1>
                <p>Ingresa tus datos personales y comienza tu viaje con nosotros</p>
                <button className="ghost" onClick={() => setIsRightPanelActive(true)} id="signUp">
                    Registrarse
                </button>
                </div>
            </div>
            </div>
        </div>
        </div>
    );
    }

    export default SlidingLogin;