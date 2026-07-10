import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Download, ChevronLeft, ChevronRight, Briefcase, BarChart3, Search, Plus, FileText, Wrench } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

// Función para obtener la fecha formateada (YYYY-MM-DD)
const formatDateStr = (date) => date.toISOString().split('T')[0];

// Funciones para calcular la semana (Lunes a Domingo) de una fecha
const getStartOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // ajusta cuando el día es domingo
  result.setDate(diff);
  return result;
};

const getEndOfWeek = (date) => {
  const result = getStartOfWeek(date);
  result.setDate(result.getDate() + 6);
  return result;
};

// Formato amigable: 10-jul
const formatShortDate = (date) => {
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
};

export default function ReporteGastosProveedor() {
  const [entidades, setEntidades] = useState([]);
  const [entidadId, setEntidadId] = useState('');
  const [entidadTipo, setEntidadTipo] = useState(''); // 'proveedor' o 'taller'
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);
  
  const [busqueda, setBusqueda] = useState('');
  const [busquedaFocus, setBusquedaFocus] = useState(false);
  
  // Estado para la navegación por semanas
  const [currentWeekDate, setCurrentWeekDate] = useState(new Date());
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const startOfWeek = getStartOfWeek(currentWeekDate);
  const endOfWeek = getEndOfWeek(currentWeekDate);

  const filteredEntidades = entidades.filter(e => 
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (e.rfc && e.rfc.toLowerCase().includes(busqueda.toLowerCase()))
  );
  
  const reportRef = useRef(null);

  useEffect(() => {
    fetchEntidades();
  }, []);

  const fetchEntidades = async () => {
    try {
      const [provRes, tallerRes] = await Promise.all([
        api.get('proveedores/'),
        api.get('mantenimiento/talleres/')
      ]);
      
      const provs = provRes.data.map(p => ({ ...p, tipo: 'proveedor', tipoLabel: 'Proveedor' }));
      const talleres = tallerRes.data.map(t => ({ ...t, tipo: 'taller', tipoLabel: 'Taller' }));
      
      setEntidades([...provs, ...talleres]);
    } catch (error) {
      console.error('Error fetching entidades:', error);
      toast.error('Error al cargar proveedores y talleres');
    }
  };

  const changeWeek = (offset) => {
    const newDate = new Date(currentWeekDate);
    newDate.setDate(newDate.getDate() + (offset * 7));
    setCurrentWeekDate(newDate);
    setReportData(null); // Limpiar reporte si cambias la fecha para evitar confusión
  };

  const generarReporte = async () => {
    if (!entidadId || !entidadTipo) {
      toast.warning('Por favor selecciona un proveedor o taller');
      return;
    }

    setLoading(true);
    
    const fechaInicio = formatDateStr(startOfWeek);
    const fechaFin = formatDateStr(endOfWeek);
    
    let endpoint = '';
    if (entidadTipo === 'proveedor') {
      endpoint = `proveedores/${entidadId}/reporte_gastos/`;
    } else {
      endpoint = `mantenimiento/talleres/${entidadId}/reporte_gastos/`;
    }

    try {
      const response = await api.get(endpoint, {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      });
      setReportData({...response.data, tipo: entidadTipo});
      toast.success('Reporte generado correctamente');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async () => {
    if (!reportRef.current) return;
    
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
      
      const nombreEntidad = reportData.proveedor ? reportData.proveedor.nombre : reportData.taller.nombre;
      pdf.save(`Reporte_Gastos_${nombreEntidad}_${formatShortDate(startOfWeek)}_al_${formatShortDate(endOfWeek)}.pdf`);
      
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Reporte Semanal de Gastos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consulta las facturas ingresadas por Proveedor o Taller navegando por semanas.
          </p>
        </div>
        
        {reportData && (
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Buscador */}
          <div className="lg:col-span-4 relative z-20">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Search className="w-4 h-4" /> Buscar Origen (Proveedor o Taller)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar nombre o RFC..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (entidadId) {
                    setEntidadId('');
                    setEntidadTipo('');
                    setEntidadSeleccionada(null);
                    setReportData(null);
                  }
                }}
                onFocus={() => setBusquedaFocus(true)}
                onBlur={() => setTimeout(() => setBusquedaFocus(false), 200)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-3 py-3 text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
              />
              
              {(busquedaFocus || busqueda) && !entidadId && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredEntidades.length > 0 ? (
                    filteredEntidades.map((e, idx) => (
                      <button 
                        key={`${e.tipo}-${e.id}-${idx}`}
                        type="button"
                        onMouseDown={(evt) => evt.preventDefault()}
                        onClick={() => {
                          setEntidadId(e.id);
                          setEntidadTipo(e.tipo);
                          setEntidadSeleccionada(e);
                          setBusqueda(`${e.nombre}`);
                          setBusquedaFocus(false);
                          setReportData(null);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-600/10 text-left border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${e.tipo === 'proveedor' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400'}`}>
                            {e.tipo === 'proveedor' ? <Briefcase size={16} /> : <Wrench size={16} />}
                          </div>
                          <div>
                            <div className="text-gray-900 dark:text-white font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                              {e.nombre}
                            </div>
                            <div className="text-xs text-gray-500 flex gap-2">
                              <span className="capitalize">{e.tipoLabel}</span>
                              {e.rfc && <span>• {e.rfc}</span>}
                            </div>
                          </div>
                        </div>
                        <Plus size={16} className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center text-sm">No se encontraron resultados</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Navegador Semanal Estilo Uploaded Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-sm">
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
                  <p className="text-blue-400 text-xs font-bold tracking-widest uppercase mb-0.5">Semana del</p>
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
          
          {/* Botón */}
          <div className="lg:col-span-3 pt-6 lg:pt-0">
            <button
              onClick={generarReporte}
              disabled={loading || !entidadId}
              className={`w-full font-medium py-3 rounded-xl transition-all flex justify-center items-center gap-2 ${
                !entidadId 
                  ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none'
              }`}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Buscar Facturas</>
              )}
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div 
          ref={reportRef} 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 space-y-8"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase ${
                  reportData.tipo === 'proveedor' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                }`}>
                  {reportData.tipo === 'proveedor' ? 'PROVEEDOR' : 'TALLER'}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {reportData.tipo === 'proveedor' ? reportData.proveedor.nombre : reportData.taller.nombre}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                RFC: {reportData.tipo === 'proveedor' ? reportData.proveedor.rfc : reportData.taller.rfc || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Período del Reporte</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {formatShortDate(startOfWeek)} <span className="text-gray-400 mx-1">al</span> {formatShortDate(endOfWeek)}
              </p>
            </div>
          </div>

          {/* KPI */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 rounded-2xl p-6 border border-indigo-100/50 dark:border-indigo-800/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Total Gastado</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(reportData.resumen.gran_total)}
                  </p>
                </div>
                <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Facturas de la Semana</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {reportData.resumen.total_facturas}
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
                  <th className="px-4 py-3 font-medium">Folio</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Descripción</th>
                  <th className="px-4 py-3 font-medium text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {reportData.desglose.map((factura, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{factura.folio}</td>
                    <td className="px-4 py-3">{factura.fecha}</td>
                    <td className="px-4 py-3">
                      <span className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 px-2 py-1 rounded text-xs font-medium">
                        {factura.categoria}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">{factura.descripcion || '-'}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(factura.monto)}
                    </td>
                  </tr>
                ))}
                {reportData.desglose.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                      No hay facturas registradas en esta semana para el origen seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="pt-8 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
            Reporte generado automáticamente el {new Date().toLocaleString()} - Autotransportes SIGA
          </div>
        </div>
      )}
    </div>
  );
}
