import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, TrendingDown, RefreshCw, Car, Truck, Zap, Calendar, Info } from 'lucide-react';
import api from '../services/api';

const ProyeccionesMantenimiento = () => {
  const [proyecciones, setProyecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resettingId, setResettingId] = useState(null);

  const fetchProyecciones = async () => {
    try {
      const res = await api.get('vehiculos/proyeccion_mantenimiento/');
      setProyecciones(res.data);
    } catch (err) {
      console.error("Error fetching proyecciones:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProyecciones();
  }, []);

  const handleReset = async (id) => {
    if (!window.confirm("¿Confirmas que se le hizo el mantenimiento a esta unidad HOY? Esto reiniciará sus contadores.")) return;
    setResettingId(id);
    try {
      await api.post(`vehiculos/${id}/reset_mantenimiento/`);
      await fetchProyecciones();
    } catch (err) {
      console.error("Error resetting mantenimiento:", err);
      alert("Hubo un error al reiniciar los contadores.");
    } finally {
      setResettingId(null);
    }
  };

  const getVehicleIcon = (tipo) => {
    if (tipo.includes('Coche')) return <Car size={20} />;
    if (tipo.includes('Camión')) return <Truck size={20} />;
    if (tipo.includes('Eléctrico')) return <Zap size={20} />;
    return <Truck size={20} />;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <RefreshCw className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (proyecciones.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl lg:rounded-3xl text-slate-500 italic text-sm">
        No hay proyecciones calculadas.
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
        <h3 className="text-white font-bold text-lg mb-2 flex items-center gap-2">
          <TrendingDown className="text-blue-500" />
          Proyecciones de Mantenimiento Preventivo
        </h3>
        <p className="text-slate-400 text-sm">
          Este sistema cruza el kilometraje actual (obtenido de las cargas de combustible) con las reglas de cada tipo de vehículo para calcular cuándo les toca su próximo mantenimiento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proyecciones.map((p) => (
          <div 
            key={p.id} 
            className={`bg-slate-900/80 border rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden transition-all hover:-translate-y-1 ${
              p.estado_alerta === 'vencido' ? 'border-red-500/50 shadow-lg shadow-red-900/10' :
              p.estado_alerta === 'proximo' ? 'border-amber-500/50 shadow-lg shadow-amber-900/10' :
              p.estado_alerta === 'sin_iniciar' ? 'border-slate-700 opacity-80' :
              'border-slate-800'
            }`}
          >
            {/* Status Indicator */}
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl font-bold text-[10px] uppercase tracking-wider ${
              p.estado_alerta === 'vencido' ? 'bg-red-500 text-white' :
              p.estado_alerta === 'proximo' ? 'bg-amber-500 text-white' :
              p.estado_alerta === 'sin_iniciar' ? 'bg-slate-700 text-slate-300' :
              'bg-emerald-500 text-white'
            }`}>
              {p.estado_alerta === 'vencido' ? 'Vencido' :
               p.estado_alerta === 'proximo' ? 'Próximo' : 
               p.estado_alerta === 'sin_iniciar' ? 'Sin Iniciar' : 'Al Día'}
            </div>

            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                p.estado_alerta === 'vencido' ? 'bg-red-500/20 text-red-400' :
                p.estado_alerta === 'proximo' ? 'bg-amber-500/20 text-amber-400' :
                p.estado_alerta === 'sin_iniciar' ? 'bg-slate-800 text-slate-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {p.estado_alerta === 'vencido' ? <AlertTriangle size={24} /> :
                 p.estado_alerta === 'proximo' ? <Clock size={24} /> : 
                 p.estado_alerta === 'sin_iniciar' ? <Info size={24} /> : <CheckCircle2 size={24} />}
              </div>
              <div>
                <h4 className="text-xl font-bold text-white leading-none">{p.numero_economico}</h4>
                <div className="flex items-center gap-1 text-slate-400 text-xs mt-1">
                  {getVehicleIcon(p.tipo_vehiculo)}
                  <span>{p.tipo_vehiculo}</span>
                </div>
              </div>
            </div>

            {p.estado_alerta === 'sin_iniciar' ? (
              <div className="bg-slate-950/50 p-4 rounded-xl border border-dashed border-slate-700 text-center my-2 flex-1 flex flex-col justify-center items-center">
                <p className="text-xs text-slate-400 mb-1">Registra el primer mantenimiento para</p>
                <p className="text-sm text-slate-300 font-bold">Inciar el ciclo de ({p.intervalo_km.toLocaleString()} km / {p.intervalo_meses} meses)</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mt-2 flex-1">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Intervalo KM</p>
                  <p className="text-sm text-white font-mono">
                    {p.km_actual.toLocaleString()} / <span className="text-blue-400">{(p.km_ultimo_mantenimiento + p.intervalo_km).toLocaleString()}</span>
                  </p>
                  <p className={`text-xs font-bold mt-1 ${p.km_restantes <= 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {p.km_restantes <= 0 ? `Vencido por ${Math.abs(p.km_restantes).toLocaleString()} km` : `Faltan ${p.km_restantes.toLocaleString()} km`}
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/50">
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Intervalo Tiempo</p>
                  <p className="text-sm text-white font-mono">
                    {new Date(p.fecha_limite).toLocaleDateString()}
                  </p>
                  <p className={`text-xs font-bold mt-1 ${p.dias_restantes <= 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {p.dias_restantes <= 0 ? `Vencido por ${Math.abs(p.dias_restantes)} días` : `Faltan ${p.dias_restantes} días`}
                  </p>
                </div>
              </div>
            )}

            <button 
              onClick={() => handleReset(p.id)}
              disabled={resettingId === p.id}
              className={`mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors font-bold text-sm ${
                p.estado_alerta === 'sin_iniciar' 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20' 
                  : 'bg-slate-800 hover:bg-blue-600 text-white'
              }`}
            >
              {resettingId === p.id ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {p.estado_alerta === 'sin_iniciar' ? 'Iniciar Ciclo Hoy' : 'Registrar Mantenimiento Hoy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProyeccionesMantenimiento;
