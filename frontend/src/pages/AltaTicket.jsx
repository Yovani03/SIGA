import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Ticket as TicketIcon, 
  Upload, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  CheckCircle,
  AlertCircle,
  Tag,
  FileText,
  Store,
  Info,
  Search
} from 'lucide-react';
import notify from '../utils/notifications';

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const AltaTicket = ({ onSuccess, onClose }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fecha: '',
    monto: '',
    unidad: '',
    producto: '',
    taller: '',
    proveedor: '',
    descripcion: '',
    categoria: 'Otro',
    unidades: []
  });
  const [busquedaUnidad, setBusquedaUnidad] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [generatedFolio, setGeneratedFolio] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('vehiculos/'),
      api.get('productos/'),
      api.get('talleres/'),
      api.get('proveedores/')
    ])
    .then(([vehiculosRes, productosRes, talleresRes, proveedoresRes]) => {
      setVehiculos(vehiculosRes.data);
      setProductos(productosRes.data);
      setTalleres(talleresRes.data);
      setProveedores(proveedoresRes.data);
      setEntidades([
        ...talleresRes.data.map(t => ({ ...t, tipo: 'taller' })),
        ...proveedoresRes.data.map(p => ({ ...p, tipo: 'proveedor' }))
      ]);
    })
    .catch(err => console.error("Error cargando datos:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'entidad' && value) {
      const [tipo, id] = value.split('_');
      setFormData(prev => ({
        ...prev,
        taller: tipo === 'taller' ? id : '',
        proveedor: tipo === 'proveedor' ? id : ''
      }));
      return;
    } else if (name === 'entidad' && !value) {
      setFormData(prev => ({ ...prev, taller: '', proveedor: '' }));
      return;
    }
    if (name === 'unidad' && value) {
      const uId = parseInt(value);
      setFormData(prev => {
        if (!prev.unidades.includes(uId)) {
          return { ...prev, unidad: value, unidades: [...prev.unidades, uId] };
        }
        return { ...prev, unidad: value };
      });
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedFolio('');

    try {
      const res = await api.post('tickets/', formData);
      notify.success(`Ticket registrado: ${res.data.folio_interno}`);
      setGeneratedFolio(res.data.folio_interno);
      
      if (onSuccess) {
        onSuccess(res.data);
      }
      setFormData({ fecha: '', monto: '', unidad: '', producto: '', taller: '', proveedor: '', descripcion: '', categoria: 'Otro', unidades: [] });
      setBusquedaUnidad('');
    } catch (err) {
      console.error("Error al guardar ticket:", err);
      notify.error("Error al guardar el ticket");
    } finally {
      setLoading(false);
    }
  };

  const vehiculosFiltrados = vehiculos.filter(v => 
    v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
    v.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-amber-600/10 p-3 rounded-2xl">
            <TicketIcon className="text-amber-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Registro de Ticket / Nota</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Ingresa los datos para generar el folio de seguimiento físico.</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="space-y-4">
            <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/10 dark:border-amber-500/20 p-4 rounded-xl mb-4 shadow-sm">
              <p className="text-amber-600 dark:text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">Folio del Sistema</p>
              <p className="text-slate-900 dark:text-white text-lg font-black font-mono">SE GENERARÁ AL GUARDAR</p>
              <p className="text-slate-500 dark:text-slate-400 text-[10px] mt-1 italic">Este folio deberá anotarse en la nota física para su rastreo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Fecha del Ticket
                </label>
                <input
                  required
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Store size={14} /> Taller / Proveedor
                </label>
                <select
                  required
                  name="entidad"
                  value={formData.taller ? `taller_${formData.taller}` : formData.proveedor ? `proveedor_${formData.proveedor}` : ''}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                  <option value="" className="bg-white dark:bg-slate-900">Selecciona Taller o Proveedor...</option>
                  {entidades.map(e => (
                    <option key={`${e.tipo}_${e.id}`} value={`${e.tipo}_${e.id}`} className="bg-white dark:bg-slate-900">
                      {e.nombre} ({e.tipo === 'taller' ? 'Taller' : 'Proveedor'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Info size={14} /> Descripción Breve
              </label>
              <input
                required
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Ej. Cambio de balatas delanteras"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <DollarSign size={14} /> Monto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    name="monto"
                    value={formData.monto}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Truck size={14} /> Unidad
                </label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-slate-500/40" size={12} />
                  </div>
                  <input
                    type="text"
                    placeholder="Eco o placas..."
                    value={busquedaUnidad}
                    onChange={(e) => setBusquedaUnidad(e.target.value)}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-4 py-1.5 text-[10px] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 focus:border-amber-500/50 outline-none transition-all shadow-sm"
                  />
                </div>
                <select
                  name="unidad"
                  value={formData.unidad}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all cursor-pointer text-sm"
                >
                  <option value="" className="bg-white dark:bg-slate-900">{busquedaUnidad ? `Resultados (${vehiculosFiltrados.length})` : 'Seleccionar unidad...'}</option>
                  {vehiculosFiltrados.map(v => (
                    <option key={v.id} value={v.id} className="bg-white dark:bg-slate-900">{v.numero_economico}</option>
                  ))}
                </select>

                {formData.unidades.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.unidades.map(uId => {
                      const v = vehiculos.find(veh => veh.id === uId);
                      return v ? (
                        <div key={uId} className="flex items-center gap-2 bg-amber-600/20 text-amber-500 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-bold">
                          {v.numero_economico}
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, unidades: prev.unidades.filter(id => id !== uId) }))}
                            className="hover:text-white transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                {formData.unidades.length > 1 && (
                  <p className="text-[10px] text-amber-500 font-bold mt-2 italic flex items-center gap-1">
                    <Info size={10} /> Nota compartida entre {formData.unidades.length} unidades.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Tag size={14} /> Categoría del Ticket
                </label>
                <select
                  required
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-amber-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Otro" className="bg-white dark:bg-slate-900">Selecciona una categoría...</option>
                  <option value="Administrativo" className="bg-white dark:bg-slate-900">Administrativo</option>
                  <option value="Mantenimiento y Refacciones" className="bg-white dark:bg-slate-900">Mantenimiento y Refacciones</option>
                  <option value="Llantas" className="bg-white dark:bg-slate-900">Llantas</option>
                  <option value="Operativo" className="bg-white dark:bg-slate-900">Operativo</option>
                  <option value="Combustible" className="bg-white dark:bg-slate-900">Combustible</option>
                  <option value="Otro" className="bg-white dark:bg-slate-900">Otro</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">

          <button
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-amber-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Spinner /> : <TicketIcon size={24} />}
            <span className="text-lg">REGISTRAR Y GENERAR FOLIO</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AltaTicket;
