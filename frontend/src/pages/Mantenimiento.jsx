import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Wrench, 
  Plus, 
  Search, 
  Calendar, 
  Truck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink,
  FilePlus,
  Hash,
  DollarSign,
  LogIn,
  MapPin,
  X,
  Loader2,
  Ticket as TicketIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProyeccionesMantenimiento from './ProyeccionesMantenimiento';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Mantenimiento = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('todos');
  
  const [formData, setFormData] = useState({
    unidad: '',
    descripcion: '',
    tipo: 'correctivo',
    taller: ''
  });
  
  const [tickets, setTickets] = useState([]);
  const [showCompletarModal, setShowCompletarModal] = useState(false);
  const [ordenACompletar, setOrdenACompletar] = useState(null);
  const [ticketsSeleccionados, setTicketsSeleccionados] = useState([]);

  const [showPausarModal, setShowPausarModal] = useState(false);
  const [ordenAPausar, setOrdenAPausar] = useState(null);
  const [motivoEspera, setMotivoEspera] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resOrdenes, resVehiculos, resTickets, resTalleres] = await Promise.all([
        api.get('ordenes-trabajo/'),
        api.get('vehiculos/'),
        api.get('tickets/pendientes/'),
        api.get('talleres/')
      ]);
      setOrdenes(resOrdenes.data);
      setVehiculos(resVehiculos.data);
      setTickets(resTickets.data);
      setTalleres(resTalleres.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletar = async () => {
    setFormLoading(true);
    try {
      await api.post(`ordenes-trabajo/${ordenACompletar.id}/completar/`, {
        tickets: ticketsSeleccionados
      });
      setShowCompletarModal(false);
      setOrdenACompletar(null);
      setTicketsSeleccionados([]);
      fetchData();
    } catch (err) {
      console.error("Error al completar:", err);
      alert(err.response?.data?.error || "Error al completar la orden");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.post('ordenes-trabajo/', formData);
      setShowModal(false);
      setFormData({
        unidad: '',
        descripcion: '',
        tipo: 'correctivo',
        taller: ''
      });
      fetchData();
    } catch (err) {
      console.error("Error al crear orden:", err);
      alert("Error al guardar la orden de trabajo");
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (ordenId, newEstatus, additionalData = {}) => {
    try {
      await api.patch(`ordenes-trabajo/${ordenId}/`, { estatus: newEstatus, ...additionalData });
      fetchData();
    } catch (err) {
      console.error("Error al actualizar estatus:", err);
      alert("Error al actualizar estatus");
    }
  };

  const handlePausar = async () => {
    if (!motivoEspera) {
      alert("Debe seleccionar un motivo de espera.");
      return;
    }
    setFormLoading(true);
    await handleStatusChange(ordenAPausar.id, 'en espera', { motivo_espera: motivoEspera });
    setShowPausarModal(false);
    setOrdenAPausar(null);
    setMotivoEspera('');
    setFormLoading(false);
  };

  const stats = {
    total: ordenes.length,
    proceso: ordenes.filter(o => o.estatus === 'en proceso').length,
    espera: ordenes.filter(o => o.estatus === 'en espera').length,
    completados: ordenes.filter(o => o.estatus === 'completado').length,
  };

  const filteredOrdenes = ordenes.filter(o => activeTab === 'todos' || o.estatus === activeTab);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white flex items-center gap-3">
            <Wrench className="text-blue-500 shrink-0" size={28} />
            Mantenimiento
          </h1>
          <p className="text-slate-400 mt-1 lg:mt-2 text-sm">Gestiona órdenes de trabajo y servicios.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 lg:px-6 py-3 rounded-xl lg:rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus size={20} /> Nueva Orden
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Órdenes', value: stats.total, icon: <Hash className="text-blue-400" /> },
          { label: 'En Espera', value: stats.espera, icon: <AlertCircle className="text-red-400" /> },
          { label: 'En Proceso', value: stats.proceso, icon: <Clock className="text-amber-400" /> },
          { label: 'Completadas', value: stats.completados, icon: <CheckCircle2 className="text-emerald-400" /> },
        ].map((s, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-slate-800 p-5 lg:p-6 rounded-2xl lg:rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs lg:text-sm font-medium">{s.label}</p>
              <p className="text-xl lg:text-2xl font-bold text-white mt-1">{s.value}</p>
            </div>
            <div className="bg-slate-800 p-2.5 lg:p-3 rounded-xl lg:rounded-2xl shrink-0">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Top Filters */}
      <div className="flex bg-slate-950/80 p-1.5 rounded-full border border-slate-800/80 w-full sm:w-max overflow-x-auto custom-scrollbar whitespace-nowrap backdrop-blur-xl shadow-inner">
        {[
          { id: 'todos', label: 'TODOS', count: stats.total },
          { id: 'en proceso', label: 'PROCESO', count: stats.proceso },
          { id: 'en espera', label: 'ESPERA', count: stats.espera },
          { id: 'completado', label: 'OK', count: stats.completados },
          { id: 'proyecciones', label: 'PROYECCIONES', count: '⏱️' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative flex-1 sm:flex-none px-5 py-2.5 rounded-full text-[10px] lg:text-xs font-bold uppercase transition-all duration-300 ease-out overflow-hidden flex items-center justify-center gap-2 ${
              activeTab === tab.id 
                ? 'text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            {activeTab === tab.id && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider ${
                activeTab === tab.id ? 'bg-black/20 text-blue-100' : 'bg-slate-800 text-slate-300'
              }`}>
                {tab.count}
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Cards List or Proyecciones */}
      {activeTab === 'proyecciones' ? (
        <ProyeccionesMantenimiento />
      ) : (
        <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12"><Spinner /></div>
        ) : filteredOrdenes.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl lg:rounded-3xl text-slate-500 italic text-sm">No hay reportes en esta categoría.</div>
        ) : (
          filteredOrdenes.map(o => (
            <div key={o.id} className="bg-slate-900/50 border border-slate-800 rounded-2xl lg:rounded-3xl p-5 lg:p-6 flex flex-col sm:flex-row gap-5 lg:gap-6 items-start sm:items-center hover:border-slate-700 transition-colors">
               
               <div className={`p-4 lg:p-5 rounded-full flex-shrink-0 border-2 ${
                 o.estatus === 'en proceso' ? 'bg-amber-900/10 border-amber-500/20 text-amber-400' :
                 o.estatus === 'en espera' ? 'bg-red-900/10 border-red-500/20 text-red-400' :
                 'bg-emerald-900/10 border-emerald-500/20 text-emerald-400'
               }`}>
                 {o.estatus === 'completado' ? <CheckCircle2 size={18} /> : 
                  o.estatus === 'en proceso' ? <Clock size={18} /> : <AlertCircle size={18} />}
               </div>

               <div className="flex-1 space-y-3 min-w-0">
                 <div className="flex flex-wrap items-center gap-2">
                   <span className={`px-2.5 py-1 rounded-full text-[9px] lg:text-[10px] font-bold uppercase tracking-wider ${
                     o.estatus === 'en proceso' ? 'bg-amber-500/10 text-amber-400' :
                     o.estatus === 'en espera' ? 'bg-red-500/10 text-red-400' :
                     'bg-emerald-500/10 text-emerald-400'
                   }`}>
                     • {o.estatus}
                   </span>
                   <span className={`px-2.5 py-1 rounded-full text-[9px] lg:text-[10px] font-bold uppercase tracking-wider ${
                     o.tipo === 'preventivo' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                   }`}>
                     {o.tipo}
                   </span>
                   <span className="text-slate-500 text-[10px] font-mono">#{o.folio || `OT-${o.id}`}</span>
                 </div>
                 <h3 className="text-lg lg:text-2xl font-bold text-white leading-tight">{o.descripcion}</h3>
                 <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] lg:text-sm text-slate-400">
                   <div className="flex items-center gap-1.5"><Truck size={14} className="shrink-0"/> <span className="truncate">{o.unidad_nombre}</span></div>
                   <div className="flex items-center gap-1.5"><Calendar size={14} className="shrink-0"/> {new Date(o.fecha_creacion).toLocaleDateString()}</div>
                   {o.costo_total > 0 && <div className="flex items-center gap-1 text-emerald-400 font-bold"><DollarSign size={14} className="shrink-0"/> {o.costo_total}</div>}
                 </div>
                 {o.taller_info && (
                   <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3 bg-slate-950 p-3 lg:p-4 rounded-xl border border-slate-800 w-full overflow-hidden">
                     <div className="flex items-center gap-3 flex-1 min-w-0">
                       <div className="bg-blue-500/10 p-2 rounded-lg shrink-0">
                         <Wrench size={16} className="text-blue-500" />
                       </div>
                       <div className="min-w-0 flex-1">
                         <p className="text-xs lg:text-sm font-bold text-white truncate">{o.taller_info.nombre}</p>
                         <p className="text-[10px] lg:text-xs text-slate-400 truncate mt-0.5">{o.taller_info.direccion}</p>
                       </div>
                     </div>
                     <a 
                       href={o.taller_info.url_mapa || `https://maps.google.com/?q=${encodeURIComponent(o.taller_info.direccion || o.taller_info.nombre)}`} 
                       target="_blank" 
                       rel="noreferrer"
                       className="flex items-center justify-center gap-2 text-[10px] lg:text-xs font-bold text-white bg-blue-600 px-4 py-2.5 rounded-lg hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 shrink-0 w-full sm:w-auto"
                     >
                       <MapPin size={14} /> MAPA
                     </a>
                   </div>
                 )}
               </div>

               <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                 {o.estatus === 'en proceso' && (
                   <>
                     <button onClick={() => { setOrdenAPausar(o); setMotivoEspera(''); setShowPausarModal(true); }} className="flex-1 sm:flex-none bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 font-bold py-2.5 px-4 rounded-xl transition-all text-[10px] lg:text-xs">
                       PAUSAR
                     </button>
                     <button onClick={() => { setOrdenACompletar(o); setTicketsSeleccionados([]); setShowCompletarModal(true); }} className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 lg:py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs">
                       ALTA <CheckCircle2 size={16}/>
                     </button>
                   </>
                 )}
                 {o.estatus === 'en espera' && (
                   <button onClick={() => handleStatusChange(o.id, 'en proceso')} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm">
                     REANUDAR
                   </button>
                 )}
                 {o.estatus === 'completado' && (
                   <div className="w-full flex sm:flex-col items-center justify-center gap-2 text-emerald-400 font-bold bg-emerald-900/10 px-4 py-3 rounded-xl border border-emerald-500/20 text-xs">
                     <CheckCircle2 size={18} />
                     OK
                   </div>
                 )}
               </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* Modal Nueva Orden */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl custom-scrollbar">
            <div className="p-5 lg:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
              <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-3">
                <Plus className="text-blue-500 shrink-0" size={24} /> Nueva Orden
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors shrink-0"
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 lg:p-6 space-y-5 lg:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Unidad</label>
                  <select 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg lg:rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                    value={formData.unidad}
                    onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                  >
                    <option value="">Selecciona Unidad...</option>
                    {vehiculos.filter(v => v.estado === 'operativa' || !v.estado).map(v => (
                      <option key={v.id} value={v.id}>{v.numero_economico} - {v.marca}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo</label>
                  <select 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg lg:rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                  >
                    <option value="correctivo">Correctivo</option>
                    <option value="preventivo">Preventivo</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taller / Mecánico</label>
                <select 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg lg:rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                  value={formData.taller}
                  onChange={(e) => setFormData({...formData, taller: e.target.value})}
                >
                  <option value="">Selecciona Taller...</option>
                  {talleres.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg lg:rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-sm"
                  placeholder="Detalle de la reparación..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                ></textarea>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl lg:rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {formLoading ? <Spinner /> : <Wrench size={20} />}
                <span>{formLoading ? 'Guardando...' : 'Crear Orden'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Completar Orden */}
      {showCompletarModal && ordenACompletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl custom-scrollbar">
            <div className="p-5 lg:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
              <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={24} /> Reintegrar Unidad
              </h2>
              <button 
                onClick={() => setShowCompletarModal(false)}
                className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors shrink-0"
              >✕</button>
            </div>
            <div className="p-5 lg:p-6 space-y-6">
              <p className="text-slate-400 text-sm">Seleccione los tickets asociados a esta reparación para la unidad <span className="font-bold text-white">{ordenACompletar.unidad_nombre}</span>.</p>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {tickets.filter(t => t.unidad === ordenACompletar.unidad).length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-950 rounded-2xl border border-dashed border-slate-800 text-center space-y-3">
                    <div className="bg-slate-900 p-3 rounded-full">
                      <TicketIcon className="text-slate-600" size={32} />
                    </div>
                    <p className="text-slate-500 italic text-xs max-w-[250px]">No hay tickets pendientes para esta unidad. Debe registrar un ticket primero.</p>
                  </div>
                ) : (
                  tickets.filter(t => t.unidad === ordenACompletar.unidad).map(t => (
                    <label key={t.id} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                      ticketsSeleccionados.includes(t.id) 
                        ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-900/10' 
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}>
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          className="peer appearance-none w-6 h-6 border-2 border-slate-700 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                          checked={ticketsSeleccionados.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTicketsSeleccionados([...ticketsSeleccionados, t.id]);
                            } else {
                              setTicketsSeleccionados(ticketsSeleccionados.filter(id => id !== t.id));
                            }
                          }}
                        />
                        <CheckCircle2 size={14} className="absolute text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-white font-bold text-sm truncate uppercase tracking-tight">
                            Folio: <span className="text-blue-400 font-mono">{t.folio_interno}</span>
                          </p>
                          <span className="text-emerald-400 font-black text-sm shrink-0">
                            ${parseFloat(t.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[10px] mt-1 flex items-center gap-2">
                          <Calendar size={12} /> {new Date(t.fecha).toLocaleDateString()}
                          <span className="text-slate-700">•</span>
                          <span className="truncate">{t.descripcion || 'Sin descripción'}</span>
                        </p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              
              <button 
                onClick={handleCompletar}
                disabled={formLoading || ticketsSeleccionados.length === 0}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold rounded-xl lg:rounded-2xl shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:scale-100"
              >
                {formLoading ? <Spinner /> : <CheckCircle2 size={20} />}
                <span>{formLoading ? 'Procesando...' : 'Finalizar y Reintegrar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pausar / En Espera */}
      {showPausarModal && ordenAPausar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl lg:rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 lg:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <h2 className="text-lg lg:text-xl font-bold text-white flex items-center gap-3">
                <AlertCircle className="text-red-500 shrink-0" size={24} /> Pausar
              </h2>
              <button 
                onClick={() => setShowPausarModal(false)}
                className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors shrink-0"
              >✕</button>
            </div>
            <div className="p-5 lg:p-6 space-y-6">
              <p className="text-slate-400 text-sm">¿Por qué se pausará la unidad <span className="font-bold text-white">{ordenAPausar.unidad_nombre}</span>?</p>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Motivo</label>
                <select 
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg lg:rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 text-sm"
                  value={motivoEspera}
                  onChange={(e) => setMotivoEspera(e.target.value)}
                >
                  <option value="">Seleccione el motivo...</option>
                  <option value="falta_refaccion">Falta de refacción</option>
                  <option value="taller_lleno">Sin espacio en taller</option>
                  <option value="falta_presupuesto">Aprobación pendiente</option>
                  <option value="otro">Otro motivo</option>
                </select>
              </div>
              
              <button 
                onClick={handlePausar}
                disabled={formLoading || !motivoEspera}
                className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl lg:rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95"
              >
                {formLoading ? <Spinner /> : <Clock size={20} />}
                <span>{formLoading ? 'Procesando...' : 'Poner en Espera'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mantenimiento;
