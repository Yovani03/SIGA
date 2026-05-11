import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Truck, MapPin, ShieldCheck, ArrowRight, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();

    // Redirigir si ya está logueado
    useEffect(() => {
        if (user && ['capturista', 'admin', 'jefe_logistica', 'monitoreo'].includes(user.rol)) {
            navigate('/');
        }
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        const success = await login(username.trim(), password);
        if (!success) {
            setError('Credenciales inválidas. Por favor, intenta de nuevo.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans text-slate-200">
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
                        0%, 100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
                        50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8); }
                    }
                    
                    .animate-drive-slow { animation: driveRight 25s linear infinite; }
                    .animate-drive-medium { animation: driveLeft 18s linear infinite 5s; }
                    .animate-drive-fast { animation: driveRight 12s linear infinite 2s; }
                    .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
                    .delay-100 { animation-delay: 100ms; }
                    .delay-200 { animation-delay: 200ms; }
                    .delay-300 { animation-delay: 300ms; }
                    
                    /* Ocultar barra de desplazamiento */
                    ::-webkit-scrollbar { display: none; }
                `}
            </style>

            {/* Fondo decorativo (Malla y gradientes) */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
                <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-blue-900/20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-indigo-900/20 blur-3xl"></div>
            </div>

            {/* Animación de camioncitos */}
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
            <div className="relative z-10 w-full max-w-md px-6 py-12">
                
                {/* Logo y Encabezado */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="mx-auto w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30 mb-6 shadow-[0_0_15px_rgba(59,130,246,0.5)]" style={{ animation: 'pulseGlow 3s infinite' }}>
                        <Truck className="text-blue-500 w-10 h-10" />
                    </div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                        SIGA
                    </h2>
                    <p className="text-slate-400 font-medium">Sistema Integral de Gestión de Autotransporte</p>
                </div>

                {/* Tarjeta de Formulario (Glassmorphism) */}
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl shadow-black/50 animate-fade-in delay-100 opacity-0">
                    
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-sm animate-fade-in">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo de Usuario */}
                        <div className="animate-fade-in delay-200 opacity-0">
                            <label className="block text-slate-400 text-sm font-semibold mb-2 ml-1" htmlFor="username">
                                Usuario
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
                                    placeholder="Ingresa tu usuario"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo de Contraseña */}
                        <div className="animate-fade-in delay-300 opacity-0">
                            <label className="block text-slate-400 text-sm font-semibold mb-2 ml-1" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all duration-300"
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
