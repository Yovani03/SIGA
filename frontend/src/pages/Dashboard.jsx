import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Clock,
  Plus,
  DollarSign,
  Droplets,
  Ticket,
  ChevronRight,
  ArrowUpRight,
  Loader2,
  FilePlus,
  LayoutGrid
} from 'lucide-react';

const StatCard = ({ icon, label, value, subValue, trend, color }) => (
  <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 hover:border-blue-500/30 transition-all duration-500 group relative overflow-hidden shadow-2xl">
    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${color} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500`} />
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div className={`p-4 rounded-2xl bg-opacity-10 shadow-inner ${color}`}>
        {React.cloneElement(icon, { size: 24, className: color.split(' ')[0].replace('bg-', 'text-') })}
      </div>
      {trend && (
        <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/10">
          <TrendingUp size={12} />
          {trend}
        </span>
      )}
    </div>
    <div className="relative z-10">
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-4xl font-black text-white tracking-tighter">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-slate-700" />
        {subValue}
      </p>
    </div>
  </div>
);

const ActionCard = ({ icon, label, description, color, onClick }) => (
  <button 
    onClick={onClick}
    className="group relative bg-slate-900/40 hover:bg-slate-800/40 border border-slate-800/50 rounded-[2rem] p-6 transition-all duration-500 flex flex-col items-start gap-4 text-left hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-blue-900/10 overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 rounded-bl-[100px]`} />
    <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-opacity-100 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
      {React.cloneElement(icon, { size: 28, className: color.split(' ')[0].replace('bg-', 'text-') })}
    </div>
    <div>
      <h4 className="text-lg font-black text-white mb-1 group-hover:text-blue-400 transition-colors">{label}</h4>
      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{description}</p>
    </div>
    <div className="mt-2 w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
      <Plus size={20} />
    </div>
  </button>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resVehiculos, resFacturas, resFuel] = await Promise.all([
          api.get('vehiculos/'),
          api.get('facturas/'),
          api.get('cargas-combustible/')
        ]);

        const vehs = resVehiculos.data || [];
        const facts = (resFacturas.data || []).filter(f => f.producto_categoria !== 'Combustible');
        const fuel = resFuel.data || [];

        setStats({
          unidades: {
            total: vehs.length,
            operativas: vehs.filter(v => !v.estado || v.estado === 'operativa').length,
            taller: vehs.filter(v => v.estado && v.estado !== 'operativa').length
          },
          mantenimientos: {
            total: vehs.filter(v => v.estado && v.estado !== 'operativa').length,
            proximos: 3 // Mockup for now
          },
          facturacion: {
            total: facts.reduce((acc, f) => acc + parseFloat(f.monto || 0), 0),
            count: facts.length
          }
        });

        // Combine and sort recent activity
        const combined = [
          ...facts.map(f => ({ ...f, type: 'factura', sortDate: new Date(f.fecha) })),
          ...fuel.map(f => ({ ...f, type: 'combustible', sortDate: new Date(f.fecha) }))
        ].sort((a, b) => b.sortDate - a.sortDate).slice(0, 5);

        setRecentActivity(combined);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="text-blue-500 animate-spin" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sincronizando Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 lg:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <StatCard 
          icon={<Truck />} 
          label="Unidades" 
          value={stats?.unidades?.total || 0} 
          subValue={`${stats?.unidades?.operativas || 0} activas, ${stats?.unidades?.taller || 0} en taller`}
          trend="+2 esta sem"
          color="bg-blue-600"
        />
        <StatCard 
          icon={<DollarSign />} 
          label="Facturado (Mes)" 
          value={`$${((stats?.facturacion?.total || 0) / 1000).toFixed(1)}k`} 
          subValue={`${stats?.facturacion?.count || 0} comprobantes registrados`}
          trend="+15%"
          color="bg-emerald-500"
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-1 bg-blue-600 rounded-full" />
          <h3 className="text-2xl font-black text-white tracking-tight">Acciones Rápidas</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ActionCard 
            icon={<FilePlus />} 
            label="Capturar Factura" 
            description="Registra gastos generales, refacciones o servicios externos."
            color="bg-blue-600"
            onClick={() => navigate('/facturacion')}
          />
          <ActionCard 
            icon={<Droplets />} 
            label="Carga Diésel" 
            description="Registra consumo de combustible y kilometraje actual."
            color="bg-amber-500"
            onClick={() => navigate('/combustible')}
          />
          <ActionCard 
            icon={<Ticket />} 
            label="Generar Ticket" 
            description="Crea órdenes de servicio internas para mantenimiento."
            color="bg-indigo-600"
            onClick={() => navigate('/tickets')}
          />
          <ActionCard 
            icon={<Truck />} 
            label="Alta de Unidad" 
            description="Registra un nuevo vehículo en la flota activa."
            color="bg-emerald-600"
            onClick={() => navigate('/vehiculos')}
          />
        </div>
      </div>


    </div>
  );
};

export default Dashboard;

