import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { 
  MapPin, 
  Truck, 
  User, 
  Store, 
  Clock, 
  Navigation, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  X,
  History,
  Search,
  ArrowRightCircle,
  Building2,
  UserPlus
} from 'lucide-react';

const Monitoreo = () => {
  const { user } = useContext(AuthContext);
  const [viajes, setViajes] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHelperModalOpen, setIsHelperModalOpen] = useState(false);
  const [selectedViajeForHelper, setSelectedViajeForHelper] = useState(null);
  const [ayudanteId, setAyudanteId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [opSearch, setOpSearch] = useState('');
  const [vehSearch, setVehSearch] = useState('');
  const [tiendaSearch, setTiendaSearch] = useState('');

  const [formData, setFormData] = useState({
    operador: '',
    vehiculo: '',
    tienda: '',
    observaciones: ''
  });

  const tiendas = Array.from({ length: 39 }, (_, i) => (i + 1) * 10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resViajes, resOps, resVehs] = await Promise.all([
        api.get('viajes/'),
        api.get('operadores/'),
        api.get('vehiculos/')
      ]);
      setViajes(resViajes.data);
      setOperadores(resOps.data);
      setVehiculos(resVehs.data);
    } catch (err) {
      console.error("Error fetching data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSalida = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        tienda: formData.tienda === '' ? null : formData.tienda
      };
      await api.post('viajes/', dataToSend);
      fetchData();
      closeModal();
    } catch (err) {
      console.error("Error reporting departure", err);
      alert("Error al registrar la salida");
    }
  };

  const handleAvanzarEstatus = async (viajeId, currentEstatus) => {
    let confirmMsg = '';
    if (currentEstatus === 'en_ruta') confirmMsg = '¿Confirmar llegada a tienda?';
    else if (currentEstatus === 'en_tienda') confirmMsg = '¿Confirmar salida de tienda?';
    else if (currentEstatus === 'regresando') confirmMsg = '¿Confirmar llegada a CEDIS?';

    if (window.confirm(confirmMsg)) {
      try {
        await api.post(`viajes/${viajeId}/avanzar_estatus/`);
        fetchData();
      } catch (err) {
        console.error("Error updating status", err);
        alert("Error al actualizar el estatus");
      }
    }
  };

  const openModal = () => {
    setFormData({
      operador: '',
      vehiculo: '',
      tienda: '',
      observaciones: ''
    });
    setOpSearch('');
    setVehSearch('');
    setTiendaSearch('');
    setIsModalOpen(true);
  };

  const openHelperModal = (viaje) => {
    setSelectedViajeForHelper(viaje);
    setAyudanteId('');
    setOpSearch('');
    setIsHelperModalOpen(true);
  };

  const closeHelperModal = () => {
    setIsHelperModalOpen(false);
    setSelectedViajeForHelper(null);
  };

  const handleAssignHelper = async (e) => {
    e.preventDefault();
    if (!ayudanteId) return;
    try {
      await api.post(`viajes/${selectedViajeForHelper.id}/set_ayudante/`, { ayudante_id: ayudanteId });
      fetchData();
      closeHelperModal();
    } catch (err) {
      console.error("Error assigning helper", err);
      alert(err.response?.data?.error || "Error al asignar ayudante");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const viajesActivos = viajes.filter(v => !v.completado);
  const historialViajes = viajes.filter(v => v.completado);

  const filteredHistorial = historialViajes.filter(v => 
    v.operador_detalle?.nombre?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    v.operador_detalle?.apellido?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    v.vehiculo_detalle?.numero_economico?.toLowerCase().includes(historySearchTerm.toLowerCase()) ||
    v.tienda?.toString().includes(historySearchTerm)
  );

  const filteredActivos = viajesActivos.filter(v => 
    v.operador_detalle?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vehiculo_detalle?.numero_economico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.tienda?.toString().includes(searchTerm)
  );

  const operadoresDisponibles = operadores.filter(op => op.estatus === 'patio');
  
  const filteredOps = operadoresDisponibles.filter(op => 
    `${op.nombre} ${op.apellido}`.toLowerCase().includes(opSearch.toLowerCase())
  );

  const vehiculosEnViaje = viajesActivos.map(v => v.vehiculo);
  const vehiculosDisponibles = vehiculos.filter(v => 
    v.estado === 'operativa' && !vehiculosEnViaje.includes(v.id)
  );

  const filteredVehs = vehiculosDisponibles.filter(v => 
    v.numero_economico?.toLowerCase().includes(vehSearch.toLowerCase())
  );

  const filteredTiendas = tiendas.filter(t => 
    t.toString().includes(tiendaSearch)
  );

  const getStatusLabel = (viaje) => {
    if (viaje.vehiculo_detalle?.capacidad === 0.0 || viaje.vehiculo_detalle?.capacidad === "0.0") {
      return { label: 'SALIDA ESPECIAL', color: 'bg-purple-500/10 text-purple-500' };
    }
    switch(viaje.estatus) {
      case 'en_ruta': return { label: 'EN RUTA', color: 'bg-blue-500/10 text-blue-500' };
      case 'en_tienda': return { label: 'EN TIENDA', color: 'bg-amber-500/10 text-amber-500' };
      case 'regresando': return { label: 'REGRESANDO', color: 'bg-indigo-500/10 text-indigo-500' };
      default: return { label: 'DESCONOCIDO', color: 'bg-slate-500/10 text-slate-500' };
    }
  };

  const getButtonLabel = (viaje) => {
    if (viaje.vehiculo_detalle?.capacidad === 0.0 || viaje.vehiculo_detalle?.capacidad === "0.0") {
      return { label: 'Llegó a CEDIS', icon: <Building2 size={18} />, color: 'bg-emerald-600 hover:bg-emerald-500' };
    }
    switch(viaje.estatus) {
      case 'en_ruta': return { label: 'Llegó a Tienda', icon: <Store size={18} />, color: 'bg-amber-600 hover:bg-amber-500' };
      case 'en_tienda': return { label: 'Salió de Tienda', icon: <ArrowRightCircle size={18} />, color: 'bg-indigo-600 hover:bg-indigo-500' };
      case 'regresando': return { label: 'Llegó a CEDIS', icon: <Building2 size={18} />, color: 'bg-emerald-600 hover:bg-emerald-500' };
      default: return { label: 'Avanzar', icon: <CheckCircle2 size={18} />, color: 'bg-slate-600 hover:bg-slate-500' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 font-medium">Cargando monitor de tráfico...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 lg:gap-2">
          <h1 className="text-2xl lg:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
            <Navigation className="text-blue-500 shrink-0" size={32} />
            Módulo de Monitoreo
          </h1>
          <p className="text-slate-400 text-sm lg:text-lg">Control dinámico de etapas del viaje en tiempo real.</p>
        </div>
        {user?.rol !== 'jefe_logistica' && (
          <button 
            onClick={openModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={20} />
            Reportar Salida
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">En Ruta / Tienda</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-bold text-white">{viajesActivos.length}</h3>
            <span className="text-slate-400 mb-1">unidades</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Ops. Disponibles</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-bold text-emerald-500">{operadoresDisponibles.length}</h3>
            <span className="text-slate-400 mb-1">personal</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Flota en Patio</p>
          <div className="flex items-end gap-2">
            <h3 className="text-4xl font-bold text-blue-500">{vehiculosDisponibles.length}</h3>
            <span className="text-slate-400 mb-1">unidades</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock size={22} className="text-amber-500" />
            Control de Viajes Activos
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar viaje..." 
              className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/50 transition-all w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredActivos.map(v => {
              const statusInfo = getStatusLabel(v);
              const btnInfo = getButtonLabel(v);
              return (
                <div key={v.id} className="bg-slate-950/50 border border-slate-800 rounded-2xl p-5 hover:border-blue-500/30 transition-all group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600/10 p-2 rounded-lg text-blue-500">
                        <Truck size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{v.vehiculo_detalle?.numero_economico || '---'}</h4>
                        <p className="text-slate-500 text-xs">{v.vehiculo_detalle?.placas}</p>
                      </div>
                    </div>
                    <div className={`${statusInfo.color} px-3 py-1 rounded-full text-[10px] font-bold tracking-wider`}>
                      {statusInfo.label}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <User size={16} className="text-slate-500" />
                      <span>Op: <strong className="text-slate-200">{v.operador_detalle?.nombre} {v.operador_detalle?.apellido}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <Store size={16} className="text-slate-500" />
                      <span>Destino: <strong className="text-slate-200">{v.tienda ? `Tienda ${v.tienda}` : 'Salida Especial'}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-sm">
                      <Clock size={16} className="text-slate-500" />
                      <span>Iniciado: <strong className="text-slate-200">{new Date(v.fecha_salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></span>
                    </div>
                    {v.ayudante_detalle && (
                      <div className="flex items-center gap-3 text-emerald-400 text-sm">
                        <UserPlus size={16} />
                        <span>Ayudante: <strong>{v.ayudante_detalle.nombre} {v.ayudante_detalle.apellido}</strong></span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    {user?.rol === 'jefe_logistica' && !v.ayudante && (
                      <button 
                        onClick={() => openHelperModal(v)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-blue-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 mb-2"
                      >
                        <UserPlus size={18} />
                        Asignar Ayudante
                      </button>
                    )}

                    {user?.rol !== 'jefe_logistica' && (
                      <button 
                        onClick={() => handleAvanzarEstatus(v.id, v.estatus)}
                        className={`w-full ${btnInfo.color} text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/20`}
                      >
                        {btnInfo.icon}
                        {btnInfo.label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredActivos.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <Navigation className="mx-auto text-slate-800 mb-4 opacity-20" size={64} />
                <p className="text-slate-500 font-medium">No hay viajes activos en este momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History size={20} className="text-slate-400" />
            <h2 className="text-lg font-bold text-white">Últimos Viajes Finalizados</h2>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Buscar en historial..." 
              className="bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-1.5 text-xs text-white focus:ring-2 focus:ring-blue-500/50 transition-all w-full md:w-56"
              value={historySearchTerm}
              onChange={(e) => setHistorySearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Operador</th>
                <th className="px-6 py-4 font-semibold">Unidad</th>
                <th className="px-6 py-4 font-semibold">Tienda</th>
                <th className="px-6 py-4 font-semibold">Salida</th>
                <th className="px-6 py-4 font-semibold">Llegada CEDIS</th>
                <th className="px-6 py-4 font-semibold text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredHistorial.slice(0, 10).map(v => (
                <tr key={v.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{v.operador_detalle?.nombre} {v.operador_detalle?.apellido}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300 font-mono">{v.vehiculo_detalle?.numero_economico}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{v.tienda ? `Tienda ${v.tienda}` : 'Salida Especial'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(v.fecha_salida).toLocaleDateString()} <br/>
                    {new Date(v.fecha_salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {v.fecha_llegada ? (
                      <>
                        {new Date(v.fecha_llegada).toLocaleDateString()} <br/>
                        {new Date(v.fecha_llegada).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </>
                    ) : '---'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">Finalizado</span>
                  </td>
                </tr>
              ))}
              {filteredHistorial.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500 italic">No se encontraron resultados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Navigation size={22} className="text-emerald-500" />
                Registrar Salida de Unidad
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitSalida} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Operador Disponible</label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-3.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input 
                      type="text"
                      placeholder="Filtrar operador..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-t-xl pl-9 pr-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500/50 outline-none border-b-0"
                      value={opSearch}
                      onChange={(e) => setOpSearch(e.target.value)}
                    />
                    <select 
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-b-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none outline-none"
                      value={formData.operador}
                      onChange={(e) => setFormData({...formData, operador: e.target.value})}
                    >
                      <option value="">Seleccionar Operador</option>
                      {filteredOps.map(op => (
                        <option key={op.id} value={op.id}>{op.nombre} {op.apellido}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Unidad Operativa</label>
                  <div className="relative group">
                    <Search className="absolute left-3 top-3.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input 
                      type="text"
                      placeholder="Filtrar unidad..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-t-xl pl-9 pr-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500/50 outline-none border-b-0"
                      value={vehSearch}
                      onChange={(e) => setVehSearch(e.target.value)}
                    />
                    <select 
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-b-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none outline-none"
                      value={formData.vehiculo}
                      onChange={(e) => {
                        const selectedId = parseInt(e.target.value);
                        const vehiculo = vehiculos.find(v => v.id === selectedId);
                        const isLigero = vehiculo?.capacidad === 0.0 || vehiculo?.capacidad === "0.0";
                        
                        setFormData({
                          ...formData, 
                          vehiculo: e.target.value,
                          tienda: isLigero ? '' : formData.tienda
                        });
                      }}
                    >
                      <option value="">Seleccionar Unidad</option>
                      {filteredVehs.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.numero_economico} {v.capacidad === "0.0" || v.capacidad === 0.0 ? '(Ligero)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">
                  {(vehiculos.find(v => v.id === parseInt(formData.vehiculo))?.capacidad === 0.0 || 
                    vehiculos.find(v => v.id === parseInt(formData.vehiculo))?.capacidad === "0.0") 
                    ? 'Tipo de Salida' 
                    : 'Tienda de Destino'}
                </label>
                {(vehiculos.find(v => v.id === parseInt(formData.vehiculo))?.capacidad === 0.0 || 
                  vehiculos.find(v => v.id === parseInt(formData.vehiculo))?.capacidad === "0.0") ? (
                  <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-purple-400 font-bold">
                    Salida Especial (Uso Administrativo)
                  </div>
                ) : (
                  <div className="relative group">
                    <Search className="absolute left-3 top-3.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                    <input 
                      type="text"
                      placeholder="Filtrar tienda..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-t-xl pl-9 pr-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500/50 outline-none border-b-0"
                      value={tiendaSearch}
                      onChange={(e) => setTiendaSearch(e.target.value)}
                    />
                    <select 
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-b-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all appearance-none outline-none"
                      value={formData.tienda}
                      onChange={(e) => setFormData({...formData, tienda: e.target.value})}
                    >
                      <option value="">Seleccionar Tienda</option>
                      {filteredTiendas.map(t => (
                        <option key={t} value={t}>Tienda {t}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Observaciones</label>
                <textarea 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all min-h-[100px]"
                  placeholder="Notas adicionales..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-[2] bg-emerald-600 text-white font-bold py-4 rounded-xl">Iniciar Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal Asignar Ayudante */}
      {isHelperModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus size={22} className="text-blue-500" />
                Asignar Ayudante
              </h2>
              <button onClick={closeHelperModal} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAssignHelper} className="p-6 space-y-6">
              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-blue-400 text-xs font-bold uppercase mb-1">Viaje Seleccionado</p>
                <p className="text-white text-sm">Unidad {selectedViajeForHelper?.vehiculo_detalle?.numero_economico} - Tienda {selectedViajeForHelper?.tienda}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase ml-1">Seleccionar Ayudante</label>
                <div className="relative group">
                  <Search className="absolute left-3 top-3.5 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                  <input 
                    type="text"
                    placeholder="Filtrar personal..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-t-xl pl-9 pr-4 py-2.5 text-xs text-white focus:ring-2 focus:ring-blue-500/50 outline-none border-b-0"
                    value={opSearch}
                    onChange={(e) => setOpSearch(e.target.value)}
                  />
                  <select 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-b-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none outline-none"
                    value={ayudanteId}
                    onChange={(e) => setAyudanteId(e.target.value)}
                  >
                    <option value="">Seleccionar Personal...</option>
                    {operadoresDisponibles
                      .filter(op => op.id !== selectedViajeForHelper?.operador)
                      .filter(op => `${op.nombre} ${op.apellido}`.toLowerCase().includes(opSearch.toLowerCase()))
                      .map(op => (
                        <option key={op.id} value={op.id}>{op.nombre} {op.apellido}</option>
                      ))
                    }
                  </select>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 px-1">
                  * Regla: El ayudante recibirá el 30% del bono y se descontará del chofer principal.
                </p>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeHelperModal} className="flex-1 bg-slate-800 text-white font-bold py-4 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20">Asignar al Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Monitoreo;
