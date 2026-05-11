import React, { useState, useContext } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Truck,
  Wrench,
  Users,
  MapPin,
  Settings,
  LogOut,
  FilePlus,
  Tag,
  Briefcase,
  Menu,
  X,
  Navigation,
  Droplets,
  Ticket,
  LayoutGrid
} from 'lucide-react';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const allMenuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/', roles: ['admin', 'capturista', 'jefe_logistica', 'monitoreo'] },
    { icon: <FilePlus size={20} />, label: 'Facturación', path: '/facturacion', roles: ['admin', 'capturista'] },
    { icon: <Ticket size={20} />, label: 'Tickets', path: '/tickets', roles: ['admin', 'capturista'] },
    { icon: <LayoutGrid size={20} />, label: 'Catálogos', path: '/catalogos', roles: ['admin', 'capturista'] },
    { icon: <Truck size={20} />, label: 'Vehículos', path: '/vehiculos', roles: ['admin', 'capturista', 'jefe_logistica'] },
    { icon: <Wrench size={20} />, label: 'Mantenimiento', path: '/mantenimiento', roles: ['admin', 'capturista'] },
    { icon: <Users size={20} />, label: 'Operadores', path: '/operadores', roles: ['admin', 'jefe_logistica'] },
    { icon: <MapPin size={20} />, label: 'Logística', path: '/logistica', roles: ['admin', 'jefe_logistica'] },
    { icon: <Droplets size={20} />, label: 'Combustible', path: '/combustible', roles: ['admin', 'capturista', 'jefe_logistica'] },
    { icon: <Navigation size={20} />, label: 'Monitoreo', path: '/monitoreo', roles: ['admin', 'jefe_logistica', 'monitoreo'] },
  ];

  const menuItems = allMenuItems.filter(item => !item.roles || item.roles.includes(user?.rol || 'admin'));

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Truck className="text-white" size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white">SIGA</h1>
          </div>
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${location.pathname === item.path
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg lg:text-xl font-semibold text-white truncate">Gestión de Autotransporte</h2>
          </div>
          
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white capitalize">{user?.rol || 'Usuario'}</p>
              <p className="text-xs text-slate-500">{user?.username || 'user'}</p>
            </div>
            <div className="h-9 w-9 lg:h-10 lg:w-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-slate-700 shrink-0 uppercase">
              {user?.username ? user.username.substring(0, 2) : 'US'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar bg-slate-950">
          <div className="max-w-[1600px] mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;

