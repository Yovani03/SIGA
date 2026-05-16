import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Droplets, 
  Calendar, 
  DollarSign, 
  Plus, 
  Save, 
  Trash2, 
  Truck, 
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Activity,
  History,
  Clock,
  ChevronRight,
  Filter
} from 'lucide-react';
import notify from '../utils/notifications';

const Combustibles = () => {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [precios, setPrecios] = useState({
    magna: '',
    premium: '',
    diesel: '',
    electrico: '0'
  });
  const [unidades, setUnidades] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [activeTab, setActiveTab] = useState('nuevo'); // 'nuevo', 'especial' o 'historial'
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [fechaHistorial, setFechaHistorial] = useState(new Date().toISOString().split('T')[0]);

  // State for Special Load
  const [cargaEspecial, setCargaEspecial] = useState({
    unidad: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_combustible: 'diesel',
    precio_unitario: '',
    litros: '',
    kilometraje: '',
    ignorar_kilometraje: false
  });
  const [cargasEspecialesList, setCargasEspecialesList] = useState([]);

  useEffect(() => {
    fetchUnidades();
    fetchPreciosDia(fecha);
  }, [fecha]);

  useEffect(() => {
    if (activeTab === 'historial') {
      fetchHistorial();
    }
  }, [activeTab, fechaHistorial]);

  const fetchHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const res = await api.get(`cargas-combustible/por_dia/?fecha=${fechaHistorial}`);
      setHistorial(res.data);
    } catch (err) {
      console.error("Error fetching history", err);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const res = await api.get('vehiculos/');
      setUnidades(res.data);
    } catch (err) {
      console.error("Error fetching units", err);
    }
  };

  const fetchPreciosDia = async (date) => {
    try {
      const res = await api.get(`precios-combustible/por_fecha/?fecha=${date}`);
      if (res.data) {
        setPrecios({
          magna: res.data.precio_magna,
          premium: res.data.precio_premium,
          diesel: res.data.precio_diesel
        });
      } else {
        setPrecios({ magna: '', premium: '', diesel: '' });
      }
    } catch (err) {
      setPrecios({ magna: '', premium: '', diesel: '' });
    }
  };

  const handleAddUnidad = (unidad) => {
    if (cargas.find(c => c.unidad === unidad.id)) return;
    
    setCargas([...cargas, {
      unidad: unidad.id,
      numero_economico: unidad.numero_economico,
      placas: unidad.placas,
      tipo_combustible: unidad.tipo_combustible || 'diesel',
      litros: '',
      kilometraje: unidad.ultimo_kilometraje || '',
      ignorar_kilometraje: unidad.ignorar_kilometraje || false,
    }]);
    setBusqueda('');
  };

  const handleRemoveCarga = (index) => {
    const newCargas = [...cargas];
    newCargas.splice(index, 1);
    setCargas(newCargas);
  };

  const updateCarga = (index, field, value) => {
    const newCargas = [...cargas];
    newCargas[index][field] = value;
    setCargas(newCargas);
  };

  const handleSubmit = async () => {
    if (!precios.magna || !precios.premium || !precios.diesel) {
      notify.info("Ingresa los precios del día.");
      return;
    }
    if (cargas.length === 0) {
      notify.info("Agrega al menos una carga.");
      return;
    }

    for (let carga of cargas) {
      if (!carga.litros || (!carga.ignorar_kilometraje && !carga.kilometraje)) {
        notify.error(`Faltan datos en la unidad ${carga.numero_economico}`);
        return;
      }
    }

    setLoading(true);

    try {
      const data = {
        fecha,
        precio_magna: precios.magna,
        precio_premium: precios.premium,
        precio_diesel: precios.diesel,
        cargas: cargas.map(c => ({
          unidad: c.unidad,
          tipo_combustible: c.tipo_combustible,
          litros: parseFloat(c.litros),
          kilometraje: c.ignorar_kilometraje ? null : parseInt(c.kilometraje),
          ignorar_kilometraje: c.ignorar_kilometraje
        }))
      };

      await api.post('cargas-combustible/registro_diario/', data);

      notify.success("Registros guardados correctamente");
      setCargas([]);
      setBusqueda('');
    } catch (err) {
      console.error("Error saving loads", err);
      notify.error("Error al guardar los registros.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEspecialToList = (e) => {
    e.preventDefault();
    if (!cargaEspecial.unidad || !cargaEspecial.precio_unitario || !cargaEspecial.litros || (!cargaEspecial.ignorar_kilometraje && !cargaEspecial.kilometraje)) {
      notify.info("Completa todos los campos requeridos.");
      return;
    }

    const unidadObj = unidades.find(u => u.id === parseInt(cargaEspecial.unidad));
    if (!unidadObj) return;

    setCargasEspecialesList([...cargasEspecialesList, {
      ...cargaEspecial,
      numero_economico: unidadObj.numero_economico,
      placas: unidadObj.placas
    }]);

    setCargaEspecial(prev => ({
      ...prev,
      unidad: '',
      litros: '',
      kilometraje: '',
      ignorar_kilometraje: false
    }));
  };

  const handleRemoveEspecial = (index) => {
    const newList = [...cargasEspecialesList];
    newList.splice(index, 1);
    setCargasEspecialesList(newList);
  };

  const handleSubmitEspecial = async () => {
    if (cargasEspecialesList.length === 0) {
      notify.info("Agrega cargas a la lista.");
      return;
    }

    setLoading(true);
    try {
      const promises = cargasEspecialesList.map(carga => 
        api.post('cargas-combustible/', {
          unidad: parseInt(carga.unidad),
          fecha: carga.fecha,
          tipo_combustible: carga.tipo_combustible,
          precio_unitario: parseFloat(carga.precio_unitario),
          litros: parseFloat(carga.litros),
          kilometraje: carga.ignorar_kilometraje ? null : parseInt(carga.kilometraje),
          ignorar_kilometraje: carga.ignorar_kilometraje
        })
      );
      
      await Promise.all(promises);
      
      notify.success("Cargas especiales guardadas");
      setCargasEspecialesList([]);
    } catch(err) {
      console.error("Error saving special loads", err);
      notify.error("Error al guardar las cargas especiales.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUnidades = unidades.filter(u => 
    u.numero_economico.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.placas.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex bg-white dark:bg-slate-950/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 w-max mb-2 backdrop-blur-xl shadow-sm dark:shadow-inner">
        <button 
          onClick={() => setActiveTab('nuevo')}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'nuevo' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'nuevo' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <Plus size={18} /> Nuevo Registro
          </span>
        </button>
        <button 
          onClick={() => { setActiveTab('especial'); }}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'especial' 
              ? 'text-white shadow-lg shadow-amber-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'especial' && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <AlertCircle size={18} /> Carga Especial
          </span>
        </button>
        <button 
          onClick={() => { setActiveTab('historial'); }}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'historial' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'historial' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <History size={18} /> Historial de Cargas
          </span>
        </button>
      </div>

      {activeTab === 'nuevo' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Droplets className="text-blue-500" size={32} />
                Carga de Combustibles
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Registro diario de suministros por unidad</p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="text-blue-500 dark:text-blue-400 ml-2" size={20} />
              <input 
                type="date" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-2 font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { id: 'magna', label: 'Magna', color: 'bg-green-500/10 border-green-500/20 text-green-500' },
              { id: 'premium', label: 'Premium', color: 'bg-red-500/10 border-red-500/20 text-red-500' },
              { id: 'diesel', label: 'Diesel', color: 'bg-slate-700/20 border-slate-700/30 text-slate-400' }
            ].map(fuel => (
              <div key={fuel.id} className={`${fuel.color} border rounded-2xl p-5 flex flex-col gap-3 group transition-all hover:bg-opacity-20`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm uppercase tracking-wider">{fuel.label}</span>
                  <DollarSign size={18} />
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={precios[fuel.id]}
                    onChange={(e) => setPrecios({...precios, [fuel.id]: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">MXN/L</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl min-h-[400px] flex flex-col shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar unidad por económico o placa..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                
                {busqueda && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredUnidades.length > 0 ? (
                      filteredUnidades.map(u => (
                        <button 
                          key={u.id}
                          onClick={() => handleAddUnidad(u)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                        >
                          <div>
                            <div className="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">{u.numero_economico}</div>
                            <div className="text-xs text-slate-500">{u.placas} - {u.marca}</div>
                          </div>
                          <Plus size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-slate-500 text-center">No se encontraron unidades</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {cargas.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4">Combustible</th>
                      <th className="px-6 py-4">Litros</th>
                      <th className="px-6 py-4">Kilometraje</th>
                      <th className="px-6 py-4">Monto Est.</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cargas.map((carga, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-500/20">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">{carga.numero_economico}</p>
                              <p className="text-xs text-slate-500">{carga.placas}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={carga.tipo_combustible}
                            onChange={(e) => updateCarga(idx, 'tipo_combustible', e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="diesel">Diesel</option>
                            <option value="magna">Magna</option>
                            <option value="premium">Premium</option>
                            <option value="electrico">Eléctrico</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={carga.litros}
                              onChange={(e) => updateCarga(idx, 'litros', e.target.value)}
                              className="w-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="0.0"
                            />
                            <span className="ml-2 text-slate-500 text-xs">L</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <input 
                                type="number" 
                                step="1"
                                disabled={carga.ignorar_kilometraje}
                                value={carga.kilometraje}
                                onChange={(e) => updateCarga(idx, 'kilometraje', e.target.value ? parseInt(e.target.value) : '')}
                                className={`w-32 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 ${carga.ignorar_kilometraje ? 'opacity-30 cursor-not-allowed' : ''}`}
                                placeholder="Km actual"
                              />
                              {!carga.ignorar_kilometraje && <Activity className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />}
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={carga.ignorar_kilometraje}
                                onChange={(e) => updateCarga(idx, 'ignorar_kilometraje', e.target.checked)}
                                className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-offset-slate-900"
                              />
                              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Odm. Dañado</span>
                            </label>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 dark:text-white font-medium">
                            ${(carga.litros * (precios[carga.tipo_combustible] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleRemoveCarga(idx)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="bg-slate-800/30 p-6 rounded-full mb-4">
                    <Droplets size={48} className="text-slate-700" />
                  </div>
                  <p className="text-lg font-medium">No has agregado ninguna carga</p>
                  <p className="text-sm">Usa el buscador para añadir unidades a este registro</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total de unidades</span>
                <span className="text-slate-900 dark:text-white text-2xl font-black">{cargas.length}</span>
              </div>

              <div className="flex items-center gap-4">

                <button 
                  onClick={handleSubmit}
                  disabled={loading || cargas.length === 0}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  Guardar Cargas
                </button>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'especial' ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-amber-500/20 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <AlertCircle className="text-amber-500" size={32} />
                Carga Especial
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Registra cargas de múltiples días con fechas y costos personalizados.</p>
            </div>
          </div>

          <form onSubmit={handleAddEspecialToList} className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 space-y-6 backdrop-blur-xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Unidad</label>
                <select 
                  required
                  value={cargaEspecial.unidad}
                  onChange={(e) => setCargaEspecial({...cargaEspecial, unidad: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="">Seleccionar Unidad...</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.numero_economico} - {u.placas}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha Exacta de Carga</label>
                <input 
                  type="date" 
                  required
                  value={cargaEspecial.fecha}
                  onChange={(e) => setCargaEspecial({...cargaEspecial, fecha: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Combustible</label>
                <select 
                  value={cargaEspecial.tipo_combustible}
                  onChange={(e) => setCargaEspecial({...cargaEspecial, tipo_combustible: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="diesel">Diesel</option>
                  <option value="magna">Magna</option>
                  <option value="premium">Premium</option>
                  <option value="electrico">Eléctrico</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-amber-400 uppercase tracking-widest">Precio Especial (por Litro)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={cargaEspecial.precio_unitario}
                    onChange={(e) => setCargaEspecial({...cargaEspecial, precio_unitario: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Litros Cargados</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={cargaEspecial.litros}
                    onChange={(e) => setCargaEspecial({...cargaEspecial, litros: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pr-8 pl-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">L</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Kilometraje (Opcional)</label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      step="1"
                      disabled={cargaEspecial.ignorar_kilometraje}
                      value={cargaEspecial.kilometraje}
                      onChange={(e) => setCargaEspecial({...cargaEspecial, kilometraje: e.target.value})}
                      className={`w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pr-8 pl-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 ${cargaEspecial.ignorar_kilometraje ? 'opacity-30 cursor-not-allowed' : ''}`}
                      placeholder="Km actual"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">KM</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap bg-white dark:bg-slate-950 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input 
                      type="checkbox"
                      checked={cargaEspecial.ignorar_kilometraje}
                      onChange={(e) => setCargaEspecial({...cargaEspecial, ignorar_kilometraje: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-offset-slate-900 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Odm. Dañado</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-end">
              <button 
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700"
              >
                <Plus size={18} />
                Agregar a la lista
              </button>
            </div>
          </form>

          {cargasEspecialesList.length > 0 && (
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4">Detalles</th>
                      <th className="px-6 py-4 text-right">Monto Calculado</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cargasEspecialesList.map((carga, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-white font-bold">{carga.numero_economico}</p>
                              <p className="text-[10px] text-slate-500">{carga.fecha}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-300 font-medium uppercase">{carga.tipo_combustible}</span>
                            <span className="text-xs text-slate-500">{carga.litros}L a ${carga.precio_unitario}/L</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-amber-400 font-black">
                            ${(parseFloat(carga.litros) * parseFloat(carga.precio_unitario)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleRemoveEspecial(idx)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-sm">Total a guardar</span>
                  <span className="text-white text-2xl font-bold">{cargasEspecialesList.length}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSubmitEspecial}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-amber-900/20 hover:scale-105 active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Guardar Todas las Cargas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <History className="text-blue-500" size={32} />
                Historial de Cargas
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Consulta los registros de combustible por fecha</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Filter className="text-blue-500 dark:text-blue-400 ml-2" size={20} />
                <input 
                  type="date" 
                  value={fechaHistorial}
                  onChange={(e) => setFechaHistorial(e.target.value)}
                  className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-2 font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl shadow-sm">
            {loadingHistorial ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium">Cargando registros...</p>
              </div>
            ) : historial.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-8 py-5">Unidad</th>
                      <th className="px-8 py-5">Combustible</th>
                      <th className="px-8 py-5 text-right">Litros</th>
                      <th className="px-8 py-5 text-right">Precio U.</th>
                      <th className="px-8 py-5 text-right">Monto Total</th>
                      <th className="px-8 py-5">Kilometraje</th>
                      <th className="px-8 py-5">Hora/Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {historial.map((carga, idx) => (
                      <tr key={idx} className="group hover:bg-blue-600/5 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">{carga.unidad_detalle}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">ID: {carga.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            carga.tipo_combustible === 'diesel' ? 'bg-slate-800 text-slate-300' :
                            carga.tipo_combustible === 'magna' ? 'bg-green-500/10 text-green-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {carga.tipo_combustible}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-mono font-bold text-white">
                          {carga.litros} <span className="text-slate-500 text-[10px]">L</span>
                        </td>
                        <td className="px-8 py-5 text-right text-slate-400 text-sm">
                          ${carga.precio_unitario}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-emerald-600 dark:text-emerald-400 font-black text-lg">${parseFloat(carga.monto_total).toLocaleString()}</p>
                        </td>
                        <td className="px-8 py-5">
                          {carga.ignorar_kilometraje ? (
                            <span className="text-slate-500 italic text-xs">No registrado</span>
                          ) : (
                            <div className="flex items-center gap-2 text-white font-medium">
                              <Activity size={14} className="text-blue-500" />
                              {carga.kilometraje?.toLocaleString()} <span className="text-[10px] text-slate-500">KM</span>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <Clock size={14} />
                            {carga.fecha}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950/30 border-t border-slate-800">
                      <td colSpan="2" className="px-8 py-6 text-slate-500 font-bold text-sm uppercase">Totales del día</td>
                      <td className="px-8 py-6 text-right font-black text-white text-lg">
                        {historial.reduce((acc, curr) => acc + parseFloat(curr.litros), 0).toFixed(2)} <span className="text-slate-500 text-xs">L</span>
                      </td>
                      <td className="px-8 py-6"></td>
                      <td className="px-8 py-6 text-right font-black text-emerald-400 text-2xl">
                        ${historial.reduce((acc, curr) => acc + parseFloat(curr.monto_total), 0).toLocaleString()}
                      </td>
                      <td colSpan="2"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <div className="bg-slate-800/30 p-8 rounded-full mb-6">
                  <Calendar size={64} className="text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin registros para esta fecha</h3>
                <p className="text-slate-500 max-w-xs text-center">No se encontraron cargas de combustible para el día seleccionado.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Combustibles;
