import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Download, Calendar, Truck, BarChart3, PieChart, Activity, Search, Plus, Gauge } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function ReporteGastosUnidad() {
  const [unidades, setUnidades] = useState([]);
  const [unidadId, setUnidadId] = useState('');
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaFocus, setBusquedaFocus] = useState(false);
  
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);

  const filteredUnidades = unidades.filter(u => 
    u.numero_economico.toLowerCase().includes(busqueda.toLowerCase()) || 
    (u.placas && u.placas.toLowerCase().includes(busqueda.toLowerCase()))
  );
  
  const reportRef = useRef(null);

  useEffect(() => {
    fetchUnidades();
    // Default dates (last 30 days)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    
    setFechaFin(today.toISOString().split('T')[0]);
    setFechaInicio(lastMonth.toISOString().split('T')[0]);
  }, []);

  const fetchUnidades = async () => {
    try {
      const response = await api.get('vehiculos/');
      setUnidades(response.data);
    } catch (error) {
      console.error('Error fetching unidades:', error);
      toast.error('Error al cargar vehículos');
    }
  };

  const generarReporte = async () => {
    if (!unidadId || !fechaInicio || !fechaFin) {
      toast.warning('Por favor selecciona unidad y rango de fechas');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`vehiculos/${unidadId}/reporte_gastos/`, {
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
    
    // Guardar estado actual del tema oscuro
    const isDark = document.documentElement.classList.contains('dark');
    
    // Forzar modo claro temporalmente para ahorrar tinta al imprimir
    if (isDark) {
      document.documentElement.classList.remove('dark');
    }
    
    try {
      // Dar un pequeño tiempo para que se apliquen las clases de light mode
      await new Promise(resolve => setTimeout(resolve, 150));

      // Create canvas from the report element
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff' // Forzar fondo blanco
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Landscape A4 PDF
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Abarcar toda la hoja A4 estirando levemente si es necesario
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Reporte_Gastos_${reportData.unidad.numero_economico}_${fechaInicio}_al_${fechaFin}.pdf`);
      
      toast.success('PDF exportado correctamente', { id: toastId });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar a PDF', { id: toastId });
    } finally {
      // Restaurar modo oscuro si estaba activo
      if (isDark) {
        document.documentElement.classList.add('dark');
      }
    }
  };

  // Prepare data for charts
  const getPieData = () => {
    if (!reportData) return [];
    return [
      { name: 'Combustible', value: reportData.resumen.total_combustible },
      { name: 'Mantenimiento', value: reportData.resumen.total_mantenimiento }
    ].filter(d => d.value > 0);
  };

  const getTimelineData = () => {
    if (!reportData) return [];
    
    // Aggregate by date
    const dateMap = {};
    
    reportData.desglose.combustible.forEach(c => {
      const d = c.fecha;
      if (!dateMap[d]) dateMap[d] = { fecha: d, combustible: 0, mantenimiento: 0 };
      dateMap[d].combustible += parseFloat(c.monto_total || 0);
    });
    
    reportData.desglose.mantenimiento.forEach(m => {
      const d = m.fecha;
      if (!dateMap[d]) dateMap[d] = { fecha: d, combustible: 0, mantenimiento: 0 };
      dateMap[d].mantenimiento += parseFloat(m.costo_total || 0);
    });
    
    // Sort by date
    return Object.values(dateMap).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
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
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Reporte de Gastos por Unidad
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analiza el gasto de combustible y mantenimiento en un periodo.
          </p>
        </div>
        
        {reportData && (
          <button
            onClick={exportarPDF}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
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
              <Truck className="w-4 h-4" /> Unidad
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Buscar por económico o placa..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  if (unidadId) {
                    setUnidadId('');
                    setUnidadSeleccionada(null);
                  }
                }}
                onFocus={() => setBusquedaFocus(true)}
                onBlur={() => setTimeout(() => setBusquedaFocus(false), 200)}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white outline-none transition-all"
              />
              
              {(busquedaFocus || busqueda) && !unidadId && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredUnidades.length > 0 ? (
                    filteredUnidades.map(u => (
                      <button 
                        key={u.id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()} // Evitar blur antes del click
                        onClick={() => {
                          setUnidadId(u.id);
                          setUnidadSeleccionada(u);
                          setBusqueda(`${u.numero_economico} - ${u.placas || u.marca}`);
                          setBusquedaFocus(false);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-blue-600/10 text-left border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors group"
                      >
                        <div>
                          <div className="text-gray-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">{u.numero_economico}</div>
                          <div className="text-xs text-gray-500">{u.placas ? `${u.placas} - ` : ''}{u.marca}</div>
                        </div>
                        <Plus size={16} className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-gray-500 text-center text-sm">No se encontraron unidades</div>
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
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
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
                <>Generar Dashboard</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard View (to be captured by html2canvas) */}
      {reportData && (
        <div 
          ref={reportRef} 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-8 space-y-8"
          style={{ minHeight: '600px' }}
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Análisis de Gastos: {reportData.unidad.numero_economico}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Placas: {reportData.unidad.placas} | Marca: {reportData.unidad.marca}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Período del Reporte</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                {fechaInicio} <span className="text-gray-400 mx-1">al</span> {fechaFin}
              </p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-2xl p-6 border border-blue-100/50 dark:border-blue-800/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Combustible</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(reportData.resumen.total_combustible)}
                  </p>
                </div>
                <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200 dark:shadow-none">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 rounded-2xl p-6 border border-emerald-100/50 dark:border-emerald-800/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Mantenimiento</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(reportData.resumen.total_mantenimiento)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm shadow-emerald-200 dark:shadow-none">
                  <PieChart className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Gasto Total</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(reportData.resumen.gran_total)}
                  </p>
                </div>
                <div className="p-3 bg-gray-900 dark:bg-white/10 text-white rounded-xl backdrop-blur-sm shadow-sm">
                  <BarChart3 className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 rounded-2xl p-6 border border-amber-100/50 dark:border-amber-800/30">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Rendimiento</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {(reportData.resumen.rendimiento || 0).toFixed(2)} <span className="text-lg font-medium text-amber-600/70 dark:text-amber-400/70">km/l</span>
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 font-semibold mt-1">
                    {(reportData.resumen.distancia || 0).toLocaleString()} km / {(reportData.resumen.total_litros || 0).toLocaleString()} L
                  </p>
                </div>
                <div className="p-3 bg-amber-500 text-white rounded-xl shadow-sm shadow-amber-200 dark:shadow-none">
                  <Gauge className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pie Chart */}
            <div className="bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">Distribución del Gasto</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getPieData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Timeline Area Chart */}
            <div className="lg:col-span-2 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Evolución de Gastos</h3>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getTimelineData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCombustible" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMantenimiento" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4b5563" opacity={0.2} />
                    <XAxis 
                      dataKey="fecha" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `$${value/1000}k`}
                    />
                    <RechartsTooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderRadius: '8px', border: '1px solid #374151', color: '#f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)' }}
                      itemStyle={{ color: '#e5e7eb', fontWeight: 500 }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ paddingTop: '15px' }} />
                    <Area type="monotone" dataKey="mantenimiento" name="Mantenimiento" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMantenimiento)" />
                    <Area type="monotone" dataKey="combustible" name="Combustible" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCombustible)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Detailed Lists (Optional for PDF, but good for dashboard) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
             {/* Fuel List */}
             <div>
               <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Top Cargas de Combustible</h4>
               <div className="space-y-2">
                 {reportData.desglose.combustible.slice(0, 5).map((c, i) => (
                   <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800">
                     <span className="text-gray-600 dark:text-gray-400">{c.fecha}</span>
                     <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(c.monto_total)}</span>
                   </div>
                 ))}
                 {reportData.desglose.combustible.length === 0 && (
                   <p className="text-sm text-gray-500 italic">No hay cargas en este periodo.</p>
                 )}
               </div>
             </div>
             
             {/* Maint List */}
             <div>
               <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">Órdenes de Trabajo (Mantenimiento)</h4>
               <div className="space-y-2">
                 {reportData.desglose.mantenimiento.slice(0, 5).map((m, i) => (
                   <div key={i} className="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-800">
                     <span className="text-gray-600 dark:text-gray-400">{m.fecha} - {m.folio}</span>
                     <span className="font-medium text-gray-900 dark:text-gray-200">{formatCurrency(m.costo_total)}</span>
                   </div>
                 ))}
                 {reportData.desglose.mantenimiento.length === 0 && (
                   <p className="text-sm text-gray-500 italic">No hay mantenimientos en este periodo.</p>
                 )}
               </div>
             </div>
          </div>
          
          <div className="pt-8 border-t border-gray-100 dark:border-gray-700 text-center text-xs text-gray-400">
            Reporte generado automáticamente el {new Date().toLocaleString()} - Autotransportes SIGA
          </div>
        </div>
      )}
    </div>
  );
}
