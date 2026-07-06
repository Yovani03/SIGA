import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FileSpreadsheet, Plus, Download, Loader2, Search, X, Calendar, ChevronLeft, ChevronRight, Eye, CheckCircle2, Filter, AlertTriangle, Copy } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedBitacoraToDownload, setSelectedBitacoraToDownload] = useState(null);
  
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [modalSearchFocus, setModalSearchFocus] = useState(false);

  useEffect(() => {
    setFilterDate(getCurrentWeekFriday());
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

  const getNextFriday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((5 + 7 - d.getDay()) % 7));
    return d.toISOString().split('T')[0];
  };

  const getCurrentWeekFriday = () => {
    const d = new Date();
    const day = d.getDay(); // 0: Sun, ..., 5: Fri, 6: Sat
    const diff = day >= 5 ? day - 5 : day + 2;
    d.setDate(d.getDate() - diff);
    return d.toISOString().split('T')[0];
  };

  const openModal = () => {
    setFormData({
      vehiculo_id: '',
      fecha_inicio: getNextFriday()
    });
    setModalSearchTerm('');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const shiftWeek = (direction) => {
    if (!formData.fecha_inicio) return;
    const d = new Date(formData.fecha_inicio + 'T00:00:00');
    d.setDate(d.getDate() + (direction * 7));
    setFormData({...formData, fecha_inicio: d.toISOString().split('T')[0]});
  };

  const shiftFilterWeek = (direction) => {
    if (!filterDate) {
      setFilterDate(getNextFriday());
      return;
    }
    const d = new Date(filterDate + 'T00:00:00');
    d.setDate(d.getDate() + (direction * 7));
    setFilterDate(d.toISOString().split('T')[0]);
    setCurrentPage(1);
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
        const cleanUrl = res.data.archivo.replace(/^https?:\/\/[^\/]+/, '');
        window.open(cleanUrl, '_blank');
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

  const handleDownloadClick = (b) => {
    setSelectedBitacoraToDownload(b);
    setDownloadModalOpen(true);
  };

  const downloadOriginal = () => {
    if (!selectedBitacoraToDownload?.archivo) return;
    const cleanUrl = selectedBitacoraToDownload.archivo.replace(/^https?:\/\/[^\/]+/, '');
    window.open(cleanUrl, '_blank');
    setDownloadModalOpen(false);
  };

  const downloadCopia = () => {
    if (!selectedBitacoraToDownload) return;
    // Call the endpoint /api/bitacoras/{id}/descargar_copia/
    window.open(`/api/bitacoras/${selectedBitacoraToDownload.id}/descargar_copia/`, '_blank');
    setDownloadModalOpen(false);
    // Reload data to update copy count (optional but good)
    setTimeout(() => fetchData(), 1500);
  };

  // PDF view logic removed at user request

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
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar unidad o folio..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          {filterDate ? (
            <div className="bg-[#0b1120] border border-slate-800 rounded-2xl flex items-center justify-between p-2 shadow-inner w-full sm:w-64">
              <button 
                type="button"
                onClick={() => shiftFilterWeek(-1)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex flex-col items-center flex-1 cursor-pointer" onClick={() => { setFilterDate(''); setCurrentPage(1); }} title="Click para quitar filtro">
                <span className="text-[10px] font-bold text-blue-500 uppercase mb-0.5">Semana del</span>
                <span className="text-sm font-black text-white tracking-wide">
                  {formatDateRange(filterDate)}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => shiftFilterWeek(1)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setFilterDate(getCurrentWeekFriday()); setCurrentPage(1); }}
              className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white focus:ring-2 focus:ring-blue-500 outline-none flex items-center justify-center gap-2 transition-all"
            >
              <Calendar size={18} />
              Filtrar por Semana
            </button>
          )}
          <button 
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 whitespace-nowrap"
          >
            <Plus size={20} />
            Generar
          </button>
        </div>
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
              {(() => {
                const filtered = bitacoras.filter(b => {
                  const matchesSearch = b.vehiculo_detalle?.numero_economico?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                        b.folio.toString().includes(searchTerm) ||
                                        b.vehiculo_detalle?.placas?.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesDate = filterDate ? b.fecha_inicio.startsWith(filterDate) : true;
                  return matchesSearch && matchesDate;
                });
                
                const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
                const startIndex = (currentPage - 1) * itemsPerPage;
                const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

                if (currentItems.length === 0) {
                  return (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500 italic">No se encontraron bitácoras.</td>
                    </tr>
                  );
                }

                return currentItems.map((b) => (
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
                      <div className="flex justify-end gap-2">
                        {b.archivo ? (
                          <button 
                            onClick={() => handleDownloadClick(b)}
                            className="text-slate-500 hover:text-green-600 transition-colors bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                            title="Descargar Excel"
                          >
                            <Download size={18} />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 self-center ml-2">Sin archivo</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {(() => {
          const filtered = bitacoras.filter(b => {
            const matchesSearch = b.vehiculo_detalle?.numero_economico?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  b.folio.toString().includes(searchTerm) ||
                                  b.vehiculo_detalle?.placas?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDate = filterDate ? b.fecha_inicio.startsWith(filterDate) : true;
            return matchesSearch && matchesDate;
          });
          const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
          
          if (filtered.length === 0) return null;

          return (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length} bitácoras
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="p-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })()}
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
              <div className="space-y-2 relative">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Unidad</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input
                    type="text"
                    required={!formData.vehiculo_id}
                    placeholder="Buscar unidad por económico o placa..."
                    value={modalSearchTerm}
                    onChange={(e) => {
                      setModalSearchTerm(e.target.value);
                      if (formData.vehiculo_id) setFormData({...formData, vehiculo_id: ''});
                    }}
                    onFocus={() => setModalSearchFocus(true)}
                    onBlur={() => setTimeout(() => setModalSearchFocus(false), 200)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                  {formData.vehiculo_id && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CheckCircle2 size={18} className="text-green-500" />
                    </div>
                  )}
                  
                  {(modalSearchFocus || modalSearchTerm) && !formData.vehiculo_id && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto custom-scrollbar">
                      {vehiculos.filter(v => 
                        v.numero_economico?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                        v.placas?.toLowerCase().includes(modalSearchTerm.toLowerCase())
                      ).length > 0 ? (
                        vehiculos.filter(v => 
                          v.numero_economico?.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                          v.placas?.toLowerCase().includes(modalSearchTerm.toLowerCase())
                        ).map(v => (
                          <button 
                            key={v.id}
                            type="button"
                            onClick={() => {
                              setFormData({...formData, vehiculo_id: v.id});
                              setModalSearchTerm(`${v.numero_economico} - ${v.placas}`);
                              setModalSearchFocus(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors"
                          >
                            <div>
                              <div className="text-sm text-slate-900 dark:text-white font-bold">{v.numero_economico}</div>
                              <div className="text-xs text-slate-500">{v.placas}</div>
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

      {downloadModalOpen && selectedBitacoraToDownload && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Download className="text-blue-500" size={20} />
                Opciones de Descarga
              </h3>
              <button onClick={() => setDownloadModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            {selectedBitacoraToDownload.fecha_inicio < getCurrentWeekFriday() && (
              <div className="mb-5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3 flex gap-3 items-start">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                  <strong>Advertencia:</strong> Estás a punto de descargar una bitácora de una semana pasada. ¿Deseas continuar?
                </p>
              </div>
            )}
            
            <p className="text-sm text-slate-500 mb-6">
              Selecciona qué versión deseas descargar de la bitácora <strong>#{selectedBitacoraToDownload.folio}</strong> de la unidad <strong>{selectedBitacoraToDownload.vehiculo_detalle?.numero_economico}</strong>.
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={downloadOriginal}
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold rounded-xl transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet size={18} />
                  <span>Original</span>
                </div>
                <span className="text-xs font-normal text-slate-400 border border-slate-300 dark:border-slate-600 px-2 py-0.5 rounded-full">Sin contador</span>
              </button>
              
              <button 
                onClick={downloadCopia}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Copy size={18} />
                  <span>Copia de Control</span>
                </div>
                <span className="text-[10px] bg-blue-700 px-2 py-1 rounded text-blue-100 shadow-inner">
                  Copia #{selectedBitacoraToDownload.copias_descargadas + 1}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bitacoras;
