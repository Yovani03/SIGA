import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  MapPin, 
  Truck, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle,
  Loader2,
  Search,
  DollarSign,
  Navigation,
  Droplets,
  LayoutDashboard,
  Award
} from 'lucide-react';
import Combustibles from './Combustibles';
import Bonos from './Bonos';

const Logistica = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor', 'combustible', or 'bonos'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resVehiculos, resTalleres, resOrdenes, resFacturas, resViajes] = await Promise.all([
          api.get('vehiculos/'),
          api.get('talleres/'),
          api.get('ordenes-trabajo/'),
          api.get('facturas/'),
          api.get('viajes/')
        ]);
        
        setVehiculos(resVehiculos.data);
        setTalleres(resTalleres.data);
        setOrdenes(resOrdenes.data);
        setFacturas(resFacturas.data);
        setViajes(resViajes.data);
      } catch (err) {
        console.error("Error fetching logistics data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 font-medium">Cargando datos de logística...</p>
      </div>
    );
  }

  const operativas = vehiculos.filter(v => !v.estado || v.estado === 'operativa');
  const enTaller = vehiculos.filter(v => v.estado && v.estado !== 'operativa');



  const getTallerForVehiculo = (vehiculo) => {
    if (!vehiculo.orden_activa) return { nombre: 'Desconocido', reporte: 'Sin orden activa' };
    const orden = ordenes.find(o => o.id === vehiculo.orden_activa);
    if (!orden) return { nombre: 'Desconocido', reporte: 'Orden no encontrada' };
    
    const taller = talleres.find(t => t.id === orden.taller);
    return {
      nombre: taller ? taller.nombre : 'Taller Desconocido',
      reporte: orden.descripcion || 'Sin reporte'
    };
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 lg:gap-2">
        <h1 className="text-2xl lg:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
          <MapPin className="text-blue-500 shrink-0" size={32} />
          Panel de Logística
        </h1>
        <p className="text-slate-400 text-sm lg:text-lg">Supervisa operativas, mantenimientos y gastos por unidad.</p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-900/50 border border-slate-800 rounded-2xl w-full max-w-lg">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
            activeTab === 'monitor' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard size={18} />
          Monitor
        </button>
        <button
          onClick={() => setActiveTab('combustible')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
            activeTab === 'combustible' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Droplets size={18} />
          Combustible
        </button>
        <button
          onClick={() => setActiveTab('bonos')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all ${
            activeTab === 'bonos' 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award size={18} />
          Bonos
        </button>
      </div>

      {activeTab === 'monitor' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Unidades Operativas</p>
                  <h3 className="text-3xl font-bold text-white">{operativas.length}</h3>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="bg-rose-500/10 p-3 rounded-xl text-rose-500">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Unidades en Taller</p>
                  <h3 className="text-3xl font-bold text-white">{enTaller.length}</h3>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
                  <DollarSign size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm font-medium">Gasto Total Flota</p>
                  <h3 className="text-3xl font-bold text-white">
                    ${facturas.reduce((sum, f) => sum + parseFloat(f.monto || 0), 0).toLocaleString()}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Unidades en Taller */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="font-semibold text-white flex items-center gap-2 text-lg">
                <Wrench className="text-amber-500" size={20} />
                Unidades en Taller
              </h3>
              <div className="space-y-4">
                {enTaller.length === 0 ? (
                  <p className="text-slate-400 text-sm italic">No hay unidades en taller actualmente.</p>
                ) : (
                  enTaller.map(v => {
                    const infoTaller = getTallerForVehiculo(v);
                    return (
                      <div key={v.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-lg">{v.numero_economico}</span>
                          <span className="text-xs font-bold px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full">En Taller</span>
                        </div>
                        <p className="text-slate-400 text-sm">Taller: <strong className="text-slate-300">{infoTaller.nombre}</strong></p>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Unidades en Viaje (Monitor para Jefe) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl p-6 shadow-xl space-y-6">
              <h3 className="font-semibold text-white flex items-center gap-2 text-lg">
                <Navigation className="text-blue-500" size={20} />
                Tráfico en Tiempo Real
              </h3>
              <div className="space-y-4">
                {ordenes.filter(o => false).length === 0 && ( // Placeholder check, logic follows
                  viajes.filter(v => !v.completado).length === 0 ? (
                    <p className="text-slate-400 text-sm italic">No hay unidades en ruta actualmente.</p>
                  ) : (
                    viajes.filter(v => !v.completado).map(v => (
                      <div key={v.id} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-lg">{v.vehiculo_detalle?.numero_economico}</span>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            v.estatus === 'en_ruta' ? 'bg-blue-500/10 text-blue-500' :
                            v.estatus === 'en_tienda' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-indigo-500/10 text-indigo-500'
                          }`}>
                            {v.estatus === 'en_ruta' ? 'EN RUTA' : v.estatus === 'en_tienda' ? 'EN TIENDA' : 'REGRESANDO'}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Op: <strong className="text-slate-200">{v.operador_detalle?.nombre}</strong></span>
                          <span className="text-slate-400">Tienda: <strong className="text-slate-200">{v.tienda}</strong></span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </div>


          </div>
        </>
      )}
      {activeTab === 'combustible' && <Combustibles />}
      {activeTab === 'bonos' && <Bonos />}
    </div>
  );
};

export default Logistica;
