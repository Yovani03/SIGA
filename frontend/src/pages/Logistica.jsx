import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
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
  Award,
  Plus,
  Clock,
  User,
  Store,
  X,
  History,
  Building2,
  UserPlus,
  Calendar,
  FileSpreadsheet
} from 'lucide-react';
import Combustibles from './Combustibles';
import Bonos from './Bonos';
import Bitacoras from './Bitacoras';

const Logistica = () => {
  const { user } = useContext(AuthContext);
  const [vehiculos, setVehiculos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [operadores, setOperadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monitor'); // 'monitor', 'combustible', or 'bonos'

  // States from Monitoreo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArrivalModalOpen, setIsArrivalModalOpen] = useState(false);
  const [selectedViajeForArrival, setSelectedViajeForArrival] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [opSearch, setOpSearch] = useState('');
  const [vehSearch, setVehSearch] = useState('');
  const [tiendaSearch, setTiendaSearch] = useState('');
  const [opSearchFocus, setOpSearchFocus] = useState(false);
  const [vehSearchFocus, setVehSearchFocus] = useState(false);
  
  const [formData, setFormData] = useState({
    operador: '',
    vehiculo: '',
    tienda: '',
    destino: '',
    fecha_salida: '',
    ayudante: '',
    observaciones: ''
  });
  const [hasAyudante, setHasAyudante] = useState(false);
  const [arrivalData, setArrivalData] = useState({
    fecha_llegada: ''
  });

  const tiendas = Array.from({ length: 39 }, (_, i) => (i + 1) * 10);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resVehiculos, resTalleres, resOrdenes, resFacturas, resViajes, resOps] = await Promise.all([
        api.get('vehiculos/'),
        api.get('talleres/'),
        api.get('ordenes-trabajo/'),
        api.get('facturas/'),
        api.get('viajes/'),
        api.get('operadores/')
      ]);
      
      setVehiculos(resVehiculos.data);
      setTalleres(resTalleres.data);
      setOrdenes(resOrdenes.data);
      setFacturas(resFacturas.data);
      setViajes(resViajes.data);
      setOperadores(resOps.data);
    } catch (err) {
      console.error("Error fetching logistics data", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    setFormData({
      operador: '',
      vehiculo: '',
      tienda: '',
      destino: '',
      fecha_salida: currentTime,
      ayudante: '',
      observaciones: ''
    });
    setHasAyudante(false);
    setOpSearch('');
    setVehSearch('');
    setTiendaSearch('');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const formatWithCurrentDate = (timeStr) => {
    if (!timeStr) return null;
    const now = new Date();
    const [hours, minutes] = timeStr.split(':');
    now.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return now.toISOString();
  };

  const handleSubmitSalida = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        fecha_salida: formatWithCurrentDate(formData.fecha_salida),
        ayudante: hasAyudante ? formData.ayudante : null,
        tienda: formData.tienda === '' ? null : formData.tienda,
        destino: formData.destino || null
      };
      await api.post('viajes/', dataToSend);
      fetchData();
      closeModal();
    } catch (err) {
      console.error("Error reporting departure", err);
      alert(err.response?.data?.error || "Error al registrar la salida");
    }
  };

  const openArrivalModal = (viaje) => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    setSelectedViajeForArrival(viaje);
    setArrivalData({ fecha_llegada: currentTime });
    setIsArrivalModalOpen(true);
  };

  const closeArrivalModal = () => {
    setIsArrivalModalOpen(false);
    setSelectedViajeForArrival(null);
  };

  const handleSubmitArrival = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        fecha_llegada: formatWithCurrentDate(arrivalData.fecha_llegada)
      };
      await api.post(`viajes/${selectedViajeForArrival.id}/registrar_llegada/`, dataToSend);
      fetchData();
      closeArrivalModal();
    } catch (err) {
      console.error("Error reporting arrival", err);
      alert("Error al registrar la llegada");
    }
  };

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
  const viajesActivos = viajes.filter(v => !v.completado);
  
  const filteredActivos = viajesActivos.filter(v => 
    v.operador_detalle?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.vehiculo_detalle?.numero_economico?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.tienda?.toString().includes(searchTerm)
  );

  const operadoresDisponibles = operadores.filter(op => op.estatus === 'patio');
  const vehiculosEnViaje = viajesActivos.map(v => v.vehiculo);
  const vehiculosDisponibles = vehiculos.filter(v => 
    v.estado === 'operativa' && !vehiculosEnViaje.includes(v.id)
  );

  const filteredOps = operadoresDisponibles.filter(op => 
    `${op.nombre} ${op.apellido}`.toLowerCase().includes(opSearch.toLowerCase())
  );
  
  const filteredVehs = vehiculosDisponibles.filter(v => 
    v.numero_economico?.toLowerCase().includes(vehSearch.toLowerCase())
  );

  const filteredTiendas = tiendas.filter(t => 
    t.toString().includes(tiendaSearch)
  );

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1 lg:gap-2">
          <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <MapPin className="text-blue-600 dark:text-blue-500 shrink-0" size={32} />
            Panel de Logística
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm lg:text-lg">Control operativo, monitoreo de viajes y gestión de bonos.</p>
        </div>
        
        {activeTab === 'monitor' && (
          <button 
            onClick={openModal}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
          >
            <Plus size={20} />
            Iniciar Nuevo Viaje
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/50 dark:bg-slate-950/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 w-full max-w-lg backdrop-blur-xl shadow-inner">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'monitor' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'monitor' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <LayoutDashboard size={18} />
            Monitor
          </span>
        </button>
        <button
          onClick={() => setActiveTab('combustible')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'combustible' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'combustible' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Droplets size={18} />
            Combustible
          </span>
        </button>
        <button
          onClick={() => setActiveTab('bonos')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'bonos' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'bonos' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Award size={18} />
            Bonos
          </span>
        </button>
        <button
          onClick={() => setActiveTab('bitacoras')}
          className={`relative flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-full font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'bitacoras' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'bitacoras' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <FileSpreadsheet size={18} />
            Bitácoras
          </span>
        </button>
      </div>

      {activeTab === 'monitor' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Viajes en Curso</p>
              <div className="flex items-center gap-4">
                <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-600 dark:text-blue-500">
                  <Navigation size={20} />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{viajesActivos.length}</h3>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Personal Libre</p>
              <div className="flex items-center gap-4">
                <div className="bg-amber-500/10 p-2.5 rounded-xl text-amber-600 dark:text-amber-500">
                  <User size={20} />
                </div>
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{operadoresDisponibles.length}</h3>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:gap-8">
            {/* Tr fico Activo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock size={22} className="text-blue-600 dark:text-blue-500" />
                  Control de Tráfico
                </h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="Buscar unidad u operador..." 
                    className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/50 transition-all w-full md:w-64 shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-6 flex-1 max-h-[600px] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredActivos.map(v => (
                    <div key={v.id} className="bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-blue-500/30 transition-all group shadow-sm dark:shadow-none">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-600/10 p-2 rounded-lg text-blue-600 dark:text-blue-500">
                            <Truck size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 dark:text-white">{v.vehiculo_detalle?.numero_economico || '---'}</h4>
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{v.vehiculo_detalle?.placas}</p>
                          </div>
                        </div>
                        <div className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          EN RUTA
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                          <User size={14} className="text-slate-400 dark:text-slate-500" />
                          <span>Chofer: <strong className="text-slate-900 dark:text-slate-200">{v.operador_detalle?.nombre}</strong></span>
                        </div>
                        {v.ayudante_detalle && (
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                            <UserPlus size={14} />
                            <span>Ayudante: <strong className="text-slate-900 dark:text-white">{v.ayudante_detalle.nombre}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                          <Store size={14} className="text-slate-400 dark:text-slate-500" />
                          <span>Destino: <strong className="text-slate-900 dark:text-slate-200">{v.destino || (v.tienda ? `Tienda ${v.tienda}` : 'Salida Especial')}</strong></span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                          <Clock size={14} className="text-slate-400 dark:text-slate-500" />
                          <span>Salida: <strong className="text-slate-900 dark:text-slate-200">{new Date(v.fecha_salida).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong></span>
                        </div>
                      </div>

                      <button 
                        onClick={() => openArrivalModal(v)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/20"
                      >
                        <Building2 size={18} />
                        Reportar Llegada a CEDIS
                      </button>
                    </div>
                  ))}
                  {filteredActivos.length === 0 && (
                    <div className="col-span-full py-12 text-center">
                      <Navigation className="mx-auto text-slate-800 mb-3 opacity-20" size={48} />
                      <p className="text-slate-500 text-sm italic">No hay viajes activos en este momento.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'combustible' && <Combustibles />}
      {activeTab === 'bonos' && <Bonos />}
      {activeTab === 'bitacoras' && <Bitacoras />}

      {/* Modal Registrar Salida */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Navigation size={22} className="text-emerald-600 dark:text-emerald-500" />
                Registrar Salida de Unidad
              </h2>
              <button onClick={closeModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitSalida} className="p-6 space-y-5 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Operador</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      required={!formData.operador}
                      placeholder="Buscar operador..."
                      value={opSearch}
                      onChange={(e) => {
                        setOpSearch(e.target.value);
                        if (formData.operador) setFormData({...formData, operador: ''});
                      }}
                      onFocus={() => setOpSearchFocus(true)}
                      onBlur={() => setTimeout(() => setOpSearchFocus(false), 200)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {formData.operador && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 size={18} className="text-green-500" />
                      </div>
                    )}
                    
                    {(opSearchFocus || opSearch) && !formData.operador && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredOps.length > 0 ? (
                          filteredOps.map(op => (
                            <button 
                              key={op.id}
                              type="button"
                              onClick={() => {
                                setFormData({...formData, operador: op.id});
                                setOpSearch(`${op.nombre} ${op.apellido}`);
                                setOpSearchFocus(false);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                            >
                              <div className="text-sm text-slate-900 dark:text-white font-bold">{op.nombre} {op.apellido}</div>
                              <Plus size={16} className="text-slate-400" />
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-slate-500 text-sm text-center">No se encontraron operadores</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Unidad</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="text"
                      required={!formData.vehiculo}
                      placeholder="Buscar unidad..."
                      value={vehSearch}
                      onChange={(e) => {
                        setVehSearch(e.target.value);
                        if (formData.vehiculo) setFormData({...formData, vehiculo: '', tienda: '', destino: ''});
                      }}
                      onFocus={() => setVehSearchFocus(true)}
                      onBlur={() => setTimeout(() => setVehSearchFocus(false), 200)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                    {formData.vehiculo && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <CheckCircle2 size={18} className="text-green-500" />
                      </div>
                    )}
                    
                    {(vehSearchFocus || vehSearch) && !formData.vehiculo && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                        {filteredVehs.length > 0 ? (
                          filteredVehs.map(v => (
                            <button 
                              key={v.id}
                              type="button"
                              onClick={() => {
                                const isLigero = v.capacidad === 0.0 || v.capacidad === "0.0";
                                const isTrailer = parseFloat(v.capacidad) >= 30.0;
                                setFormData({
                                  ...formData, 
                                  vehiculo: v.id,
                                  tienda: (isLigero || isTrailer) ? '' : formData.tienda,
                                  destino: isTrailer ? formData.destino : ''
                                });
                                setVehSearch(`${v.numero_economico} ${isLigero ? '(Ligero)' : `(${v.capacidad}T)`}`);
                                setVehSearchFocus(false);
                              }}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                            >
                              <div className="text-sm text-slate-900 dark:text-white font-bold">
                                {v.numero_economico} <span className="text-xs text-slate-500 font-normal">{v.capacidad === "0.0" || v.capacidad === 0.0 ? '(Ligero)' : `(${v.capacidad}T)`}</span>
                              </div>
                              <Plus size={16} className="text-slate-400" />
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-slate-500 text-sm text-center">No se encontraron unidades</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Hora de Salida</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 text-slate-400 dark:text-slate-600" size={16} />
                    <input 
                      type="time"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 outline-none shadow-inner"
                      value={formData.fecha_salida}
                      onChange={(e) => setFormData({...formData, fecha_salida: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">
                    {(() => {
                      const vehiculo = vehiculos.find(v => v.id === parseInt(formData.vehiculo));
                      if (!vehiculo) return 'Destino';
                      if (vehiculo.capacidad === 0.0 || vehiculo.capacidad === "0.0") return 'Tipo de Salida';
                      if (parseFloat(vehiculo.capacidad) >= 30.0) return 'Destino (Trailer)';
                      return 'Tienda de Destino';
                    })()}
                  </label>
                  {(() => {
                    const vehiculo = vehiculos.find(v => v.id === parseInt(formData.vehiculo));
                    if (!vehiculo) return (
                      <div className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2.5 text-slate-400 dark:text-slate-600 text-sm italic">
                        Seleccione una unidad primero
                      </div>
                    );
                    
                    if (vehiculo.capacidad === 0.0 || vehiculo.capacidad === "0.0") {
                      return (
                        <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-purple-400 font-bold text-sm">
                          Salida Especial (Uso Administrativo)
                        </div>
                      );
                    }

                    if (parseFloat(vehiculo.capacidad) >= 30.0) {
                      return (
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-3 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                          <input 
                            type="text"
                            required
                            placeholder="Ingrese destino (ej. Planta, Cliente, etc.)"
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 outline-none shadow-inner"
                            value={formData.destino}
                            onChange={(e) => setFormData({...formData, destino: e.target.value})}
                          />
                        </div>
                      );
                    }

                    return (
                      <div className="relative group">
                        <Search className="absolute left-3 top-3 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input 
                          type="text"
                          placeholder="Filtrar tienda..."
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-t-xl pl-9 pr-4 py-2 text-[10px] text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 outline-none border-b-0 shadow-inner"
                          value={tiendaSearch}
                          onChange={(e) => setTiendaSearch(e.target.value)}
                        />
                        <select 
                          required
                          className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-b-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none outline-none cursor-pointer"
                          value={formData.tienda}
                          onChange={(e) => setFormData({...formData, tienda: e.target.value})}
                        >
                          <option value="" className="bg-white dark:bg-slate-900">Seleccionar Tienda</option>
                          {filteredTiendas.map(t => (
                            <option key={t} value={t} className="bg-white dark:bg-slate-900">Tienda {t}</option>
                          ))}
                        </select>
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserPlus size={18} className="text-blue-600 dark:text-blue-500" />
                    <span className="text-sm font-bold text-slate-900 dark:text-white">¿Llevar ayudante?</span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setHasAyudante(!hasAyudante)}
                    className={`w-12 h-6 rounded-full transition-all relative ${hasAyudante ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${hasAyudante ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                {hasAyudante && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <select 
                      required={hasAyudante}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 outline-none cursor-pointer"
                      value={formData.ayudante}
                      onChange={(e) => setFormData({...formData, ayudante: e.target.value})}
                    >
                      <option value="" className="bg-white dark:bg-slate-900">Seleccionar Ayudante...</option>
                      {operadores
                        .filter(op => op.id !== parseInt(formData.operador))
                        .filter(op => op.estatus === 'patio')
                        .map(op => (
                          <option key={op.id} value={op.id}>{op.nombre} {op.apellido}</option>
                        ))
                      }
                    </select>
                    <p className="text-[10px] text-slate-500 mt-2 px-1 italic">
                      * El ayudante recibirá el 30% del bono proporcional del viaje.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Observaciones</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 outline-none min-h-[80px] shadow-inner"
                  placeholder="Notas adicionales..."
                  value={formData.observaciones}
                  onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all hover:bg-slate-700">Cancelar</button>
                <button type="submit" className="flex-[2] bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-900/20">Iniciar Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Registrar Llegada */}
      {isArrivalModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 size={22} className="text-emerald-600 dark:text-emerald-500" />
                Registrar Llegada a CEDIS
              </h2>
              <button onClick={closeArrivalModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmitArrival} className="p-6 space-y-6">
              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-xl">
                <p className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase mb-1 tracking-widest">Viaje</p>
                <p className="text-slate-900 dark:text-white font-bold text-lg">Unidad {selectedViajeForArrival?.vehiculo_detalle?.numero_economico}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Chofer: {selectedViajeForArrival?.operador_detalle?.nombre}</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Destino: {selectedViajeForArrival?.destino || (selectedViajeForArrival?.tienda ? `Tienda ${selectedViajeForArrival.tienda}` : 'Salida Especial')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Hora de Llegada Real</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 text-slate-400 dark:text-slate-600" size={16} />
                  <input 
                    type="time"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 outline-none shadow-inner"
                    value={arrivalData.fecha_llegada}
                    onChange={(e) => setArrivalData({...arrivalData, fecha_llegada: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeArrivalModal} className="flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-xl">Cancelar</button>
                <button type="submit" className="flex-[2] bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-900/20">Registrar Viaje</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Logistica;
