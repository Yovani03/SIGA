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
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Mantenimiento = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Estado para el formulario
  const [formData, setFormData] = useState({
    unidad: '',
    folio: '',
    descripcion: '',
    estatus: 'pendiente',
    costo_total: '',
    archivo_escaneado: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resOrdenes, resVehiculos] = await Promise.all([
        api.get('ordenes-trabajo/'),
        api.get('vehiculos/')
      ]);
      setOrdenes(resOrdenes.data);
      setVehiculos(resVehiculos.data);
    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const response = await fetch('http://localhost:3001/api/scan');
      if (!response.ok) throw new Error('Error en el servidor de escaneo local');
      
      const blob = await response.blob();
      const file = new File([blob], `mantenimiento_${Date.now()}.pdf`, { type: 'application/pdf' });
      
      setFormData(prev => ({ ...prev, archivo_escaneado: file }));
      alert("¡Documento escaneado con éxito!");
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con el escáner Brother. Asegúrate de que el agente local esté encendido.");
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });

    try {
      await api.post('ordenes-trabajo/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      setFormData({
        unidad: '',
        folio: '',
        descripcion: '',
        estatus: 'pendiente',
        costo_total: '',
        archivo_escaneado: null
      });
      fetchData();
    } catch (err) {
      console.error("Error al crear orden:", err);
      alert("Error al guardar la orden de trabajo");
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completado': return <CheckCircle2 className="text-emerald-400" size={18} />;
      case 'en proceso': return <Clock className="text-amber-400" size={18} />;
      default: return <AlertCircle className="text-slate-400" size={18} />;
    }
  };

  const stats = {
    total: ordenes.length,
    pendientes: ordenes.filter(o => o.estatus === 'pendiente').length,
    proceso: ordenes.filter(o => o.estatus === 'en proceso').length,
    completados: ordenes.filter(o => o.estatus === 'completado').length,
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Wrench className="text-blue-500" size={32} />
            Control de Mantenimiento
          </h1>
          <p className="text-slate-400 mt-2">Gestiona órdenes de trabajo y servicios preventivos.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          <Plus size={20} /> Nueva Orden
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Órdenes', value: stats.total, icon: <Hash className="text-blue-400" /> },
          { label: 'Pendientes', value: stats.pendientes, icon: <AlertCircle className="text-slate-400" /> },
          { label: 'En Proceso', value: stats.proceso, icon: <Clock className="text-amber-400" /> },
          { label: 'Completadas', value: stats.completados, icon: <CheckCircle2 className="text-emerald-400" /> },
        ].map((s, idx) => (
          <div key={idx} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{s.value}</p>
            </div>
            <div className="bg-slate-800 p-3 rounded-2xl">{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white">Órdenes de Trabajo Recientes</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por folio o unidad..." 
              className="bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Folio</th>
                <th className="px-6 py-4">Unidad</th>
                <th className="px-6 py-4">Descripción</th>
                <th className="px-6 py-4">Estatus</th>
                <th className="px-6 py-4">Costo</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12"><Spinner /></td></tr>
              ) : ordenes.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-500 italic">No hay órdenes registradas.</td></tr>
              ) : (
                ordenes.map(o => (
                  <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-blue-400 font-bold">{o.folio || `OT-${o.id}`}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Truck size={14} className="text-slate-500" />
                        <span className="text-white font-medium">{o.unidad_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate">{o.descripcion}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold capitalize ${
                        o.estatus === 'completado' ? 'bg-emerald-500/10 text-emerald-400' :
                        o.estatus === 'en proceso' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {getStatusIcon(o.estatus)}
                        {o.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">${o.costo_total}</td>
                    <td className="px-6 py-4 text-right">
                      {o.archivo_escaneado ? (
                        <a 
                          href={o.archivo_escaneado.includes('cloudinary.com') && !o.archivo_escaneado.toLowerCase().endsWith('.pdf') ? `${o.archivo_escaneado}.pdf` : o.archivo_escaneado}
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 transition-colors p-2 bg-blue-900/20 rounded-lg inline-block"
                        >
                          <ExternalLink size={18} />
                        </a>
                      ) : (
                        <span className="text-slate-600 italic text-xs">Sin factura</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Orden */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <Plus className="text-blue-500" size={24} /> Nueva Orden de Trabajo
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
              >✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Unidad</label>
                  <select 
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    value={formData.unidad}
                    onChange={(e) => setFormData({...formData, unidad: e.target.value})}
                  >
                    <option value="">Selecciona Unidad...</option>
                    {vehiculos.map(v => (
                      <option key={v.id} value={v.id}>{v.numero_economico} - {v.marca}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Folio / Referencia</label>
                  <input 
                    type="text" 
                    placeholder="Ej. REF-882"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    value={formData.folio}
                    onChange={(e) => setFormData({...formData, folio: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Descripción del Trabajo</label>
                <textarea 
                  required
                  rows="3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Detalle de la reparación o servicio..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Estatus</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    value={formData.estatus}
                    onChange={(e) => setFormData({...formData, estatus: e.target.value})}
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en proceso">En Proceso</option>
                    <option value="completado">Completado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-400 uppercase tracking-wider text-emerald-400">Costo Total ($)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                    <input 
                      type="number" 
                      step="0.01"
                      className="w-full bg-slate-950 border border-emerald-900/30 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                      value={formData.costo_total}
                      onChange={(e) => setFormData({...formData, costo_total: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Sección de Escaneo */}
              <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl space-y-4">
                <p className="text-sm font-bold text-slate-400 uppercase">Documento de Respaldo</p>
                <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                  {formData.archivo_escaneado ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle2 className="text-emerald-400" size={40} />
                      <p className="text-white font-medium">¡Documento Listo!</p>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, archivo_escaneado: null})}
                        className="text-slate-500 text-xs hover:text-red-400 underline"
                      >Quitar</button>
                    </div>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleScan}
                      disabled={scanning}
                      className="w-full py-4 bg-slate-800 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {scanning ? <Spinner /> : <FilePlus size={20} />}
                      <span>{scanning ? 'Escaneando con Brother...' : 'Escanear Factura/Recibo Ahora'}</span>
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit"
                disabled={formLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all"
              >
                {formLoading ? <Spinner /> : <Wrench size={20} />}
                <span>{formLoading ? 'Guardando...' : 'Crear Orden de Trabajo'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mantenimiento;
