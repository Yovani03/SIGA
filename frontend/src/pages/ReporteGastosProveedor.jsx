import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Download, Calendar, Briefcase, BarChart3, Search, Plus, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

export default function ReporteGastosProveedor() {
  const [proveedores, setProveedores] = useState([]);
  const [proveedorId, setProveedorId] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaFocus, setBusquedaFocus] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const filteredProveedores = proveedores.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
    (p.rfc && p.rfc.toLowerCase().includes(busqueda.toLowerCase()))
  );
  
  const reportRef = useRef(null);

  useEffect(() => {
    fetchProveedores();
    // Default dates (last 7 days - week)
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 7);
    
    setFechaFin(today.toISOString().split('T')[0]);
    setFechaInicio(lastWeek.toISOString().split('T')[0]);
  }, []);

  const fetchProveedores = async () => {
    try {
      const response = await api.get('proveedores/');
      setProveedores(response.data);
    } catch (error) {
      console.error('Error fetching proveedores:', error);
      toast.error('Error al cargar proveedores');
    }
  };

  const generarReporte = async () => {
    if (!proveedorId || !fechaInicio || !fechaFin) {
      toast.warning('Por favor selecciona un proveedor y rango de fechas');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`proveedores/${proveedorId}/reporte_gastos/`, {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      });
      setReportData(response.data);
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
      pdf.save(`Reporte_Gastos_Proveedor_${reportData.proveedor.nombre}_${fechaInicio}_al_${fechaFin}.pdf`);
      
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
            Reporte Semanal de Gastos por Proveedor
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Consulta las facturas ingresadas por proveedor en cualquier rango de fechas.
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="relative z-20">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Briefcase className="w-4 h-4" /> Proveedor
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar proveedor..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (proveedorId) {
                    setProveedorId('');
                    setProveedorSeleccionado(null);
                  }
                }}
                onFocus={() => setBusquedaFocus(true)}
                onBlur={() => setTimeout(() => setBusquedaFocus(false), 200)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white outline-none transition-all"
              />
              
              {(busquedaFocus || busqueda) && !proveedorId && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredProveedores.length > 0 ? (
                    filteredProveedores.map(p => (
                      <button 
                        key={p.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setProveedorId(p.id);
                          setProveedorSeleccionado(p);
                          setBusqueda(`${p.nombre}`);
                          setBusquedaFocus(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-600/10 text-left border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors group"
                      >
                        <div>
                          <div className="text-gray-900 dark:text-white font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{p.nombre}</div>
                          <div className="text-xs text-gray-500">{p.rfc || 'Sin RFC'}</div>
                        </div>
                        <Plus size={16} className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center text-sm">No se encontraron proveedores</div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <button
              onClick={generarReporte}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>Generar Reporte</>
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
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Reporte de Gastos: {reportData.proveedor.nombre}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                RFC: {reportData.proveedor.rfc || 'N/A'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Período del Reporte</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {fechaInicio} <span className="text-gray-400 mx-1">al</span> {fechaFin}
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
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Cantidad de Facturas</p>
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
                      No hay facturas registradas en este período para el proveedor seleccionado.
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
