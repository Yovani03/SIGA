import React from 'react';
import { 
  Truck, 
  Wrench, 
  AlertTriangle, 
  CheckCircle2,
  TrendingUp,
  Clock
} from 'lucide-react';

const StatCard = ({ icon, label, value, subValue, trend, color }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all duration-300 group">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-opacity-10 ${color}`}>
        {React.cloneElement(icon, { className: color.split(' ')[0].replace('bg-', 'text-') })}
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
          <TrendingUp size={12} />
          {trend}
        </span>
      )}
    </div>
    <div>
      <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
      <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
      <p className="text-xs text-slate-500 mt-2">{subValue}</p>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Resumen de Operaciones</h1>
        <p className="text-slate-400">Bienvenido de nuevo. Aquí tienes el estado actual de tu flota y mantenimientos.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Truck />} 
          label="Total Unidades" 
          value="42" 
          subValue="38 operativas, 4 en taller"
          trend="+2 este mes"
          color="bg-blue-600"
        />
        <StatCard 
          icon={<Wrench />} 
          label="Mantenimientos" 
          value="12" 
          subValue="8 preventivos, 4 correctivos"
          color="bg-amber-500"
        />
        <StatCard 
          icon={<Clock />} 
          label="Órdenes de Trabajo" 
          value="07" 
          subValue="Pendientes por asignar"
          color="bg-indigo-600"
        />
        <StatCard 
          icon={<AlertTriangle />} 
          label="Alertas Críticas" 
          value="02" 
          subValue="Vencimiento de seguros"
          color="bg-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm">
            <h3 className="font-semibold text-white">Estado Reciente de la Flota</h3>
            <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">Ver todo</button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/30 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-semibold">Eco</th>
                  <th className="px-6 py-4 font-semibold">Placas</th>
                  <th className="px-6 py-4 font-semibold">Último Mantenimiento</th>
                  <th className="px-6 py-4 font-semibold text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {[
                  { eco: 'T-102', plates: '65-AK-9J', date: '20 May 2026', status: 'En Ruta', color: 'text-emerald-400 bg-emerald-400/10' },
                  { eco: 'T-105', plates: '22-BK-4L', date: '18 May 2026', status: 'Cargando', color: 'text-blue-400 bg-blue-400/10' },
                  { eco: 'T-108', plates: '89-CL-1P', date: '12 May 2026', status: 'Taller', color: 'text-amber-400 bg-amber-400/10' },
                  { eco: 'T-112', plates: '10-ZX-7M', date: 'Hoy', status: 'Disponible', color: 'text-emerald-400 bg-emerald-400/10' },
                ].map((item, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4 font-medium text-white">{item.eco}</td>
                    <td className="px-6 py-4 text-slate-400">{item.plates}</td>
                    <td className="px-6 py-4 text-slate-400">{item.date}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.color}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reminders/Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <h3 className="font-semibold text-white">Alertas Próximas</h3>
          <div className="space-y-4">
            {[
              { title: 'Servicio de Aceite T-102', time: 'En 2 días', type: 'preventivo' },
              { title: 'Revisión Frenos T-105', time: 'Mañana', type: 'critico' },
              { title: 'Vencimiento Seguro R-201', time: '30 May', type: 'documento' },
            ].map((alert, i) => (
              <div key={i} className="flex gap-4 items-start p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                <div className={`p-2 rounded-lg ${
                  alert.type === 'critico' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-slate-400'
                }`}>
                  {alert.type === 'critico' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{alert.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors">
            Configurar Alertas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
