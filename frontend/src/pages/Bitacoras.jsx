import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileSpreadsheet, Plus, Download, Loader2, Search, X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const Bitacoras = () => {
  const [bitacoras, setBitacoras] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    vehiculo_id: '',
    fecha_inicio: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resBitacoras, resVehiculos] = await Promise.all([
        api.get('bitacoras/'),
        api.get('vehiculos/')
      ]);
      setBitacoras(resBitacoras.data);
      setVehiculos(resVehiculos.data);
    } catch (err) {
      console.error("Error fetching bitacoras data", err);
    } finally {
      setLoading(false);
    }
  };

  // Set next Friday as default
  const getNextFriday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7));
    return d.toISOString().split('T')[0];
  };

  const openModal = () => {
    setFormData({
      vehiculo_id: '',
      fecha_inicio: getNextFriday()
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const shiftWeek = (direction) => {
    if (!formData.fecha_inicio) return;
    const d = new Date(formData.fecha_inicio + 'T00:00:00');
    d.setDate(d.getDate() + (direction * 7));
    setFormData({...formData, fecha_inicio: d.toISOString().split('T')[0]});
  };

  const formatDateRange = (dateString) => {
    if (!dateString) return '';
    const start = new Date(dateString + 'T00:00:00');
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return `${start.getDate()}-${meses[start.getMonth()]} - ${end.getDate()}-${meses[end.getMonth()]}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const res = await api.post('bitacoras/generar/', formData);
      
      // If we need to download it immediately:
      if (res.data.archivo) {
        window.open(`http://localhost:8000${res.data.archivo}`, '_blank');
      }
      
      fetchData();
      closeModal();
    } catch (err) {
      console.error("Error generating bitacora", err);
      alert(err.response?.data?.error || "Error al generar bitácora");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadBitacora = (archivoUrl) => {
    window.open(`http://localhost:8000${archivoUrl}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
        <p className="text-slate-400 font-medium">Cargando bitácoras...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="text-blue-600 dark:text-blue-500" />
            Control de Bitácoras
          </h2>
          <p className="text-sm text-slate-500">Historial y generación de formatos semanales (Viernes a Jueves)</p>
        </div>
        
        <button 
          onClick={openModal}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus size={20} />
          Generar Bitácora
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Folio</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Unidad</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Fechas (Semana)</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Generado el</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Archivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {bitacoras.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-500 italic">No hay bitácoras generadas aún.</td>
                </tr>
              ) : (
                bitacoras.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">#{b.folio.toString().padStart(3, '0')}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{b.vehiculo_detalle?.numero_economico}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-slate-500">{b.vehiculo_detalle?.placas}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                      {b.fecha_inicio} a {b.fecha_fin}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(b.fecha_generacion).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      {b.archivo ? (
                        <button 
                          onClick={() => downloadBitacora(b.archivo)}
                          className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                          title="Descargar Excel"
                        >
                          <Download size={18} />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Sin archivo</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSpreadsheet size={22} className="text-blue-600 dark:text-blue-500" />
                Nueva Bitácora
              </h2>
              <button onClick={closeModal} className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Unidad</label>
                <select 
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-blue-500/50 outline-none cursor-pointer"
                  value={formData.vehiculo_id}
                  onChange={(e) => setFormData({...formData, vehiculo_id: e.target.value})}
                >
                  <option value="">Seleccionar Unidad</option>
                  {vehiculos.map(v => (
                    <option key={v.id} value={v.id}>{v.numero_economico} - {v.placas}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="bg-[#0b1120] border border-slate-800 rounded-2xl flex items-center justify-between p-4 shadow-inner">
                  <button 
                    type="button"
                    onClick={() => shiftWeek(-1)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-blue-500 uppercase mb-1">Semana del</span>
                    <span className="text-xl font-black text-white tracking-wide">
                      {formatDateRange(formData.fecha_inicio)}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => shiftWeek(1)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-all">Cancelar</button>
                <button type="submit" disabled={isGenerating} className="flex-[2] bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <FileSpreadsheet size={20} />}
                  {isGenerating ? 'Generando...' : 'Generar y Descargar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bitacoras;
