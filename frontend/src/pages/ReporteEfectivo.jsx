import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Download, ChevronLeft, ChevronRight, BarChart3, Search, FileText, CheckSquare, Square } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

const formatDateStr = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const getStartOfWeek = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  const day = result.getDay();
  const diff = (day >= 5) ? (5 - day) : (5 - day - 7);
  result.setDate(result.getDate() + diff);
  return result;
};

const getEndOfWeek = (date) => {
  const result = getStartOfWeek(date);
  result.setDate(result.getDate() + 6);
  return result;
};

const formatShortDate = (date) => {
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
};

export default function ReporteEfectivo() {
  const [facturas, setFacturas] = useState([]);
  const [selectedFacturas, setSelectedFacturas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const startOfWeek = getStartOfWeek(currentWeekDate);
  const endOfWeek = getEndOfWeek(currentWeekDate);
  
  const reportRef = useRef(null);

  useEffect(() => {
    fetchFacturas();
  }, [currentWeekDate]);

  const fetchFacturas = async () => {
    setLoading(true);
    const fechaInicio = formatDateStr(startOfWeek);
    const fechaFin = formatDateStr(endOfWeek);

    try {
      // Usamos el endpoint de facturas con rango de fechas
      const response = await api.get('facturas/', {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          page_size: 1000 // Para traer todas las de la semana sin paginación si es posible
        }
      });
      
      const data = response.data.results || response.data;
      // Solo facturas no canceladas
      const facturasActivas = data.filter(f => !f.cancelado);
      setFacturas(facturasActivas);
      // Por defecto seleccionamos todas
      setSelectedFacturas(facturasActivas.map(f => f.id));
    } catch (error) {
      console.error('Error fetching facturas:', error);
      toast.error('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentWeekDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentWeekDate(newDate);
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
      
      pdf.save(`Reporte_Efectivo_${formatShortDate(startOfWeek)}_al_${formatShortDate(endOfWeek)}.pdf`);
      
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

  const toggleFactura = (id) => {
    setSelectedFacturas(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedFacturas.length === filteredFacturas.length) {
      setSelectedFacturas([]);
    } else {
      setSelectedFacturas(filteredFacturas.map(f => f.id));
    }
  };

  const filteredFacturas = facturas.filter(f => {
    const term = busqueda.toLowerCase();
    const razonSocial = f.razon_social_emisor || f.proveedor_nombre || f.taller_nombre || '';
    return (
      f.folio.toLowerCase().includes(term) ||
      razonSocial.toLowerCase().includes(term) ||
      (f.descripcion && f.descripcion.toLowerCase().includes(term))
    );
  });

  const activeDesglose = filteredFacturas.filter(f => selectedFacturas.includes(f.id));
  const activeGranTotal = activeDesglose.reduce((acc, f) => acc + parseFloat(f.monto || 0), 0);
  const activeSubtotal = activeGranTotal / 1.16;
  const activeIva = activeGranTotal - activeSubtotal;
  const activeTotalFacturas = activeDesglose.length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Reporte de Pago en Efectivo
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Genera reportes de gastos pagados en efectivo seleccionando facturas específicas.
          </p>
        </div>
        
        <button
          onClick={exportarPDF}
          disabled={selectedFacturas.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm ${
            selectedFacturas.length === 0 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Download className="w-4 h-4" />
          Descargar PDF
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Buscador */}
          <div className="lg:col-span-5 relative z-20">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Search className="w-4 h-4" /> Buscar Factura
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por folio, proveedor o razón social..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-3 py-3 text-sm focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white outline-none transition-all"
              />
            </div>
          </div>
          
          {/* Navegador Semanal */}
          <div className="lg:col-span-7 flex justify-end">
            <div className="w-full max-w-md">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 text-center invisible">
                Navegador Semanal
              </label>
              <div className="bg-slate-900 dark:bg-slate-950 border border-slate-700 rounded-2xl flex items-center justify-between p-2 h-16 shadow-inner">
                <button 
                  onClick={() => changeWeek(-1)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <ChevronLeft size={24} />
                </button>
                
                <div className="text-center flex-1">
                  <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase mb-0.5">Semana del</p>
                  <p className="text-white font-black text-lg">
                    {formatShortDate(startOfWeek)} - {formatShortDate(endOfWeek)}
                  </p>
                </div>
                
                <button 
                  onClick={() => changeWeek(1)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div 
        ref={reportRef} 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 space-y-8"
      >
        {/* Header */}
        <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-md uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                REPORTE DE PAGOS
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Pagos en Efectivo
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Comprobación de gastos pagados en efectivo
            </p>
          </div>
          <div className="text-right whitespace-nowrap">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Período del Reporte</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
              {formatShortDate(startOfWeek)} <span className="text-gray-400 mx-1">al</span> {formatShortDate(endOfWeek)}
            </p>
          </div>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-6 border border-emerald-100/50 dark:border-emerald-800/30">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Seleccionado</p>
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
                  {activeTotalFacturas} <span className="text-lg text-gray-400">/ {filteredFacturas.length}</span>
                </p>
              </div>
              <div className="p-3 bg-gray-900 dark:bg-white/10 text-white rounded-xl backdrop-blur-sm shadow-sm">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3 font-medium w-16 text-center cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600" data-html2canvas-ignore="true" onClick={selectAll}>
                  {selectedFacturas.length === filteredFacturas.length && filteredFacturas.length > 0 ? <CheckSquare className="mx-auto w-4 h-4 text-emerald-600" /> : <Square className="mx-auto w-4 h-4 text-gray-400" />}
                </th>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Proveedor / Razón Social</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">Cargando facturas...</td>
                </tr>
              ) : filteredFacturas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No hay facturas en esta semana o que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredFacturas.map((factura) => {
                  const isSelected = selectedFacturas.includes(factura.id);
                  const razonSocial = factura.razon_social_emisor || factura.proveedor_nombre || factura.taller_nombre || '-';
                  
                  return (
                    <tr 
                      key={factura.id} 
                      className={`border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors ${!isSelected ? 'opacity-40 bg-gray-50 dark:bg-gray-800/30' : ''}`}
                      data-html2canvas-ignore={!isSelected ? true : undefined}
                      onClick={() => toggleFactura(factura.id)}
                    >
                      <td className="px-4 py-3 text-center cursor-pointer" data-html2canvas-ignore="true">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleFactura(factura.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{factura.folio}</td>
                      <td className="px-4 py-3 max-w-xs truncate font-medium text-gray-700 dark:text-gray-300" title={razonSocial}>
                        {razonSocial}
                      </td>
                      <td className="px-4 py-3">{factura.fecha}</td>
                      <td className="px-4 py-3">
                        <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-medium">
                          {factura.categoria}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(parseFloat(factura.monto))}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <div className="pt-8 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
          Reporte generado automáticamente el {new Date().toLocaleString()} - Autotransportes SIGA
        </div>
      </div>
    </div>
  );
}
