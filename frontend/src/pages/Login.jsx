import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Truck, MapPin, ShieldCheck, ArrowRight, Lock, User, AlertCircle } from 'lucide-react';
import logo from '../assets/logo_final.png';
import notify from '../utils/notifications';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirigir si ya está logueado
    useEffect(() => {
        if (user && ['admin_general', 'capturista', 'admin', 'jefe_logistica', 'monitoreo'].includes(user.rol)) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const success = await login(username.trim(), password);
        if (!success) {
            notify.error('Credenciales inválidas. Por favor, intenta de nuevo.');
            setIsSubmitting(false);
        } else {
            notify.success(`¡Bienvenido de nuevo!`);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center overflow-hidden font-sans text-slate-900 dark:text-slate-200 transition-colors duration-500">
            {/* Animaciones CSS embebidas */}
            <style>
                {`
                    @keyframes driveRight {
                        0% { transform: translateX(-100vw); }
                        100% { transform: translateX(100vw); }
                    }
                    @keyframes driveLeft {
                        0% { transform: translateX(100vw) scaleX(-1); }
                        100% { transform: translateX(-100vw) scaleX(-1); }
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes pulseGlow {
                        0%, 100% { filter: drop-shadow(0 0 10px rgba(59, 130, 246, 0.3)); }
                        50% { filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.5)); }
                    }
                    @keyframes neonPulse {
                        0%, 100% { text-shadow: 0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6; color: #fff; }
                        50% { text-shadow: 0 0 10px #60a5fa, 0 0 20px #60a5fa, 0 0 30px #60a5fa; color: #dbeafe; }
                    }
                    
                    .animate-drive-slow { animation: driveRight 25s linear infinite; }
                    .animate-drive-medium { animation: driveLeft 18s linear infinite 5s; }
                    .animate-drive-fast { animation: driveRight 12s linear infinite 2s; }
                    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                    .delay-100 { animation-delay: 100ms; }
                    .delay-200 { animation-delay: 200ms; }
                    .delay-300 { animation-delay: 300ms; }
                    .neon-text { animation: neonPulse 2s infinite ease-in-out; }
                    
                    /* Ocultar barra de desplazamiento */
                    ::-webkit-scrollbar { display: none; }
                `}
            </style>

            {/* Fondo decorativo (Malla y gradientes) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-indigo-100/50 dark:bg-indigo-900/20 blur-3xl"></div>
            </div>

            {/* Animación de camioncitos (Restaurada) */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                <div className="absolute top-[15%] w-full flex animate-drive-slow">
                    <Truck size={48} className="text-blue-500" />
                </div>
                <div className="absolute top-[60%] w-full flex animate-drive-medium">
                    <Truck size={64} className="text-indigo-400" />
                </div>
                <div className="absolute top-[85%] w-full flex animate-drive-fast">
                    <Truck size={36} className="text-slate-400" />
                </div>
            </div>

            {/* Contenedor principal del Login */}
            <div className="relative z-10 w-full max-w-4xl px-6 py-12">
                
                {/* Logo y Encabezado */}
                <div className="text-center mb-12 animate-fade-in flex flex-col items-center">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <div className="w-32 h-32 md:w-48 md:h-48 flex items-center justify-center relative overflow-hidden rounded-full">
                            <img 
                                src={logo} 
                                alt="Logo" 
                                className="w-full h-full object-contain relative z-10" 
                                style={{ 
                                    mixBlendMode: 'screen',
                                    filter: 'contrast(1.1) brightness(1.1)'
                                }} 
                            />
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">
                                TRANSPORT
                            </h1>
                            <p className="neon-text text-xl md:text-2xl font-bold tracking-[0.2em] mt-2 uppercase">
                                Técnicos en largas distancias
                            </p>
                        </div>
                    </div>
                    
                    <div className="w-full max-w-md border-t border-slate-200 dark:border-slate-800 pt-6">
                        <h2 className="text-3xl font-black tracking-[0.3em] text-blue-500 mb-1 uppercase">
                            SIGA
                        </h2>
                        <p className="text-slate-500 font-semibold tracking-wider text-sm">SISTEMA INTEGRAL DE GESTIÓN DE AUTOTRANSPORTE</p>
                    </div>
                </div>

                {/* Tarjeta de Formulario (Glassmorphism) - Centrada y con ancho controlado */}
                <div className="max-w-md mx-auto">
                    <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-700/50 p-8 rounded-3xl shadow-2xl shadow-slate-200 dark:shadow-black/50 animate-fade-in delay-100 opacity-0">
                    

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo de Usuario */}
                        <div className="animate-fade-in delay-200 opacity-0">
                            <label className="block text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2 ml-1" htmlFor="username">
                                Usuario
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 shadow-inner"
                                    placeholder="Ingresa tu usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo de Contraseña */}
                        <div className="animate-fade-in delay-300 opacity-0">
                            <label className="block text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2 ml-1" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300 shadow-inner"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Botón de Submit */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all duration-300 transform hover:-translate-y-1 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-blue-500/50'}`}
                            >
                                {isSubmitting ? (
                                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Ingresar al Sistema</span>
                                        <ArrowRight size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
                </div>
                
                {/* Footer Decorativo */}
                <div className="mt-8 flex justify-center items-center gap-6 text-slate-600 animate-fade-in delay-300 opacity-0">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <ShieldCheck size={16} /> Seguro
                    </div>
                    <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                        <MapPin size={16} /> Rastreo Activo
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
