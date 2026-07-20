import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Download, BarChart3, Search, FileText, Check, Plus, Trash2, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function ReporteEfectivo() {
  const [busqueda, setBusqueda] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFacturas, setSelectedFacturas] = useState([]); // Almacena objetos completos
  const [loading, setLoading] = useState(false);
  const [busquedaFocus, setBusquedaFocus] = useState(false);
  
  const reportRef = useRef(null);
  
  // Debounce backend search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (busqueda.length >= 2) {
        searchBackend();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [busqueda]);

  const searchBackend = async () => {
    setLoading(true);
    try {
      const response = await api.get('facturas/', {
        params: { search: busqueda, page_size: 20 }
      });
      const data = response.data.results || response.data;
      // Solo facturas no canceladas
      setSearchResults(data.filter(f => !f.cancelado));
    } catch (error) {
      console.error('Error buscando facturas:', error);
      toast.error('Error al buscar facturas');
    } finally {
      setLoading(false);
    }
  };

  const addFactura = (factura) => {
    if (!selectedFacturas.find(f => f.id === factura.id)) {
      setSelectedFacturas([...selectedFacturas, factura]);
      toast.success(`Factura ${factura.folio} agregada`);
      setBusqueda('');
      setSearchResults([]);
      setBusquedaFocus(false);
    } else {
      toast.info('La factura ya está agregada');
    }
  };

  const removeFactura = (id) => {
    setSelectedFacturas(selectedFacturas.filter(f => f.id !== id));
  };

  const exportarPDF = async () => {
    if (!reportRef.current) return;
    
    if (selectedFacturas.length === 0) {
      toast.warning('Selecciona al menos una factura para el reporte.');
      return;
    }

    const toastId = toast.loading('Generando PDF...');
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
      document.documentElement.classList.remove('dark');
    }
    
    try {
      await new Promise(resolve => setTimeout(resolve, 150));

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const today = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '_');
      pdf.save(`Reporte_Efectivo_${today}.pdf`);
      
      toast.success('PDF exportado correctamente', { id: toastId });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar a PDF', { id: toastId });
    } finally {
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value);
  };

  const activeGranTotal = selectedFacturas.reduce((acc, f) => acc + parseFloat(f.monto || 0), 0);
  const activeSubtotal = activeGranTotal / 1.16;
  const activeIva = activeGranTotal - activeSubtotal;
  const activeTotalFacturas = selectedFacturas.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Reporte de Pago en Efectivo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Busca y selecciona cualquier factura del sistema para armar tu reporte.
          </p>
        </div>
        
        <button
          onClick={exportarPDF}
          disabled={selectedFacturas.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${
            selectedFacturas.length === 0 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 dark:shadow-none'
          }`}
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        {/* Buscador Global (Backend) */}
        <div className="relative z-20 max-w-2xl mx-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
            <Search className="w-4 h-4" /> Buscar y Agregar Factura
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por folio, proveedor o razón social..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onFocus={() => setBusquedaFocus(true)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-10 py-3 text-sm focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white outline-none transition-all"
            />
            {busqueda && (
              <button 
                onClick={() => { setBusqueda(''); setSearchResults([]); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X size={16} />
              </button>
            )}
            
            {/* Resultados de búsqueda flotantes */}
            {(busquedaFocus && busqueda.length >= 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto custom-scrollbar">
                {loading ? (
                  <div className="p-4 text-center text-gray-500 text-sm flex justify-center items-center gap-2">
                    <span className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></span>
                    Buscando en servidor...
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((f) => {
                    const isAdded = selectedFacturas.some(sf => sf.id === f.id);
                    const razonSocial = f.razon_social_emisor || f.proveedor_nombre || f.taller_nombre || 'Sin Proveedor';
                    
                    return (
                      <button 
                        key={f.id}
                        type="button"
                        onClick={() => addFactura(f)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-left border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isAdded ? 'bg-gray-100 text-emerald-500 dark:bg-gray-800' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                            {isAdded ? <Check size={16} /> : <FileText size={16} />}
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-white font-bold text-sm">
                              Folio: {f.folio} <span className="text-gray-400 font-normal ml-2">({formatShortDate(f.fecha)})</span>
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-sm" title={razonSocial}>
                              {razonSocial}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {formatCurrency(parseFloat(f.monto))}
                          </span>
                          {!isAdded && (
                            <div className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus size={18} />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No se encontraron facturas.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        ref={reportRef} 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 space-y-8"
      >
        {/* Header del Reporte */}
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2" data-html2canvas-ignore="false">
              <span className="px-2.5 py-1 text-xs font-bold rounded-md uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                REPORTE DE PAGOS
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pagos en Efectivo
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Comprobación de gastos pagados en efectivo (Selección manual)
            </p>
          </div>
          <div className="text-right whitespace-nowrap">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-6 border border-emerald-100/50 dark:border-emerald-800/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total del Reporte</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 mb-3">
                  {formatCurrency(activeGranTotal)}
                </p>
                <div className="flex gap-6 text-sm font-medium text-emerald-800 dark:text-emerald-200 border-t border-emerald-200 dark:border-emerald-700/50 pt-3">
                  <div className="flex flex-col">
                    <span className="uppercase tracking-wide text-[10px] opacity-70">Subtotal Aprox</span>
                    <span>{formatCurrency(activeSubtotal)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="uppercase tracking-wide text-[10px] opacity-70">IVA (16%)</span>
                    <span>{formatCurrency(activeIva)}</span>
                  </div>
                </div>
              </div>
              <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-200 dark:shadow-none">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Facturas Seleccionadas</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {activeTotalFacturas}
                </p>
              </div>
              <div className="p-3 bg-gray-900 dark:bg-white/10 text-white rounded-xl backdrop-blur-sm shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Table de Facturas Seleccionadas */}
        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Proveedor / Razón Social</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium text-right">Importe</th>
                <th className="px-4 py-3 font-medium w-16 text-center" data-html2canvas-ignore="true">Quitar</th>
              </tr>
            </thead>
            <tbody>
              {selectedFacturas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <FileText size={48} className="mb-3 opacity-20" />
                      <p className="font-medium text-gray-500">Aún no hay facturas en este reporte</p>
                      <p className="text-xs mt-1">Busca y agrega facturas desde el buscador superior.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                selectedFacturas.map((factura) => {
                  const razonSocial = factura.razon_social_emisor || factura.proveedor_nombre || factura.taller_nombre || '-';
                  
                  return (
                    <tr 
                      key={factura.id} 
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{factura.folio}</td>
                      <td className="px-4 py-3 max-w-xs truncate font-medium text-gray-700 dark:text-gray-300" title={razonSocial}>
                        {razonSocial}
                      </td>
                      <td className="px-4 py-3">{formatShortDate(factura.fecha)}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
                          {factura.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-900 dark:text-white">
                        {formatCurrency(parseFloat(factura.monto))}
                      </td>
                      <td className="px-4 py-3 text-center" data-html2canvas-ignore="true">
                        <button 
                          onClick={() => removeFactura(factura.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                          title="Remover del reporte"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="pt-8 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
          Reporte generado automáticamente por Autotransportes SIGA
        </div>
      </div>
    </div>
  );
}
