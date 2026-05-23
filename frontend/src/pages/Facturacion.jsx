import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FilePlus, 
  Search, 
  Plus, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  ExternalLink,
  Loader2,
  AlertCircle,
  Filter,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Store,
  Info,
  X,
  Ticket as TicketIcon,
  TrendingUp,
  Tag,
  Pencil,
  Archive
} from 'lucide-react';
import { PieChart, Pie, Cell } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '../components/ui/chart';
import AltaFactura from './AltaFactura';
import notify from '../utils/notifications';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const categoryChartConfig = {
  value: {
    label: "Monto",
  },
  "Mantenimiento y Refacciones": {
    label: "Mantenimiento",
    color: "#3b82f6",
  },
  "Llantas": {
    label: "Llantas",
    color: "#10b981",
  },
  "Combustible": {
    label: "Combustible",
    color: "#f59e0b",
  },
  "Operativo": {
    label: "Operativo",
    color: "#ef4444",
  },
  "Administrativo": {
    label: "Administrativo",
    color: "#8b5cf6",
  },
  "Otro": {
    label: "Otro",
    color: "#ec4899",
  },
  "Sin Categoría": {
    label: "Sin Categoría",
    color: "#64748b",
  }
};

const Facturacion = () => {
  const [facturas, setFacturas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [variados, setVariados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAltaModal, setShowAltaModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState(null);
  const [selectedFactura, setSelectedFactura] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showChartsModal, setShowChartsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState('all'); // 'week', 'month', 'year', 'all'
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const itemsPerPage = 6;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facturasRes, vehiculosRes, cajasRes, variadosRes] = await Promise.all([
        api.get('facturas/'),
        api.get('vehiculos/'),
        api.get('cajas/'),
        api.get('variados/')
      ]);
      setFacturas(facturasRes.data);
      setVehiculos(vehiculosRes.data);
      setCajas(cajasRes.data);
      setVariados(variadosRes.data);
    } catch (err) {
      console.error("Error cargando facturación", err);
      notify.error("No se pudieron cargar los datos de facturación.");
    } finally {
      setLoading(false);
    }
  };

  const handleAltaSuccess = () => {
    setShowAltaModal(false);
    setEditingFactura(null);
    fetchData();
  };

  const handleEdit = (e, factura) => {
    e.stopPropagation();
    setEditingFactura(factura);
    setShowAltaModal(true);
  };

  const getUnidadInfo = (unidadId) => {
    return vehiculos.find(v => v.id === unidadId);
  };

  const getCajaInfo = (cajaId) => {
    return cajas.find(c => c.id === cajaId);
  };

  const getVariadoInfo = (variadoId) => {
    return variados.find(v => v.id === variadoId);
  };

  const filteredFacturas = facturas.filter(f => {
    if (f.producto_categoria === 'Combustible') return false;

    // Filter by date range
    let start = null;
    let end = null;
    
    if (dateRange === 'week') {
      const day = referenceDate.getDay();
      const diffToFriday = (day + 2) % 7;
      start = new Date(referenceDate);
      start.setDate(referenceDate.getDate() - diffToFriday);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'month') {
      start = new Date(selectedYear, selectedMonth, 1);
      end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === 'year') {
      start = new Date(selectedYear, 0, 1);
      end = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    }

    if (start && new Date(f.fecha) < start) return false;
    if (end && new Date(f.fecha) > end) return false;

    const unidad = getUnidadInfo(f.unidad);
    const caja = getCajaInfo(f.caja);
    const variado = getVariadoInfo(f.variado);
    const searchLower = searchTerm.toLowerCase();
    return (
      f.folio.includes(searchTerm) ||
      (f.descripcion && f.descripcion.toLowerCase().includes(searchLower)) ||
      (f.taller_nombre && f.taller_nombre.toLowerCase().includes(searchLower)) ||
      (f.proveedor_nombre && f.proveedor_nombre.toLowerCase().includes(searchLower)) ||
      (f.rfc_emisor && f.rfc_emisor.toLowerCase().includes(searchLower)) ||
      (f.razon_social_emisor && f.razon_social_emisor.toLowerCase().includes(searchLower)) ||
      (unidad && unidad.numero_economico.toLowerCase().includes(searchLower)) ||
      (unidad && unidad.placas.toLowerCase().includes(searchLower)) ||
      (caja && caja.numero_economico.toLowerCase().includes(searchLower)) ||
      (caja && caja.placas.toLowerCase().includes(searchLower)) ||
      (variado && variado.numero_economico.toLowerCase().includes(searchLower)) ||
      (variado && variado.placas && variado.placas.toLowerCase().includes(searchLower))
    );
  }).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFacturas = filteredFacturas.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFacturas.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const stats = {
    total: filteredFacturas.reduce((acc, curr) => acc + parseFloat(curr.monto), 0),
    count: filteredFacturas.length,
    units: [...new Set(filteredFacturas.map(f => f.unidad))].length
  };

  const chartDataConFills = Object.entries(
    filteredFacturas.reduce((acc, f) => {
      let cat = f.categoria;
      if (!cat || cat === 'Otro') {
        cat = f.producto_categoria || 'Otro';
      }
      if (cat === 'Mantenimiento' || cat === 'Refacciones') {
        cat = 'Mantenimiento y Refacciones';
      }
      acc[cat] = (acc[cat] || 0) + parseFloat(f.monto);
      return acc;
    }, {})
  ).map(([name, value], index) => ({
    name,
    value,
    fill: categoryChartConfig[name]?.color || COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 lg:gap-6">
        <div>
          <h1 className="text-2xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FilePlus className="text-blue-500 shrink-0" size={32} />
            Facturación
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm lg:text-lg">Gestión de comprobantes fiscales y gastos generales.</p>
        </div>
        
        <button 
          onClick={() => setShowAltaModal(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 w-full md:w-auto"
        >
          <Plus size={20} />
          Nueva Factura
        </button>
      </div>

      {/* Date Filter Selector and Specific Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex bg-white dark:bg-slate-900/80 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md backdrop-blur-xl shadow-sm">
          {[
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
            { id: 'year', label: 'Año' },
            { id: 'all', label: 'Todo' }
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setDateRange(r.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${
                dateRange === r.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                  : 'text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-slate-300'
              }`}
            >
              {r.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Specific Selectors based on Range */}
        {dateRange === 'week' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl animate-in slide-in-from-left-2 duration-300 shadow-sm">
            <button 
              onClick={() => {
                const d = new Date(referenceDate);
                d.setDate(d.getDate() - 7);
                setReferenceDate(d);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-white rounded-xl transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="px-4 py-2 flex flex-col items-center min-w-[140px]">
              <span className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter leading-none mb-1">Semana del</span>
              <span className="text-slate-900 dark:text-white text-xs font-black">
                {(() => {
                  const day = referenceDate.getDay();
                  const diffToFriday = (day + 2) % 7;
                  const start = new Date(referenceDate);
                  start.setDate(referenceDate.getDate() - diffToFriday);
                  const end = new Date(start);
                  end.setDate(start.getDate() + 6);
                  return `${start.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})} - ${end.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})}`;
                })()}
              </span>
            </div>
            <button 
              onClick={() => {
                const d = new Date(referenceDate);
                d.setDate(d.getDate() + 7);
                setReferenceDate(d);
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {dateRange === 'month' && (
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl animate-in slide-in-from-left-2 duration-300 shadow-sm">
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                <option key={i} value={i} className="bg-white dark:bg-slate-900">{m}</option>
              ))}
            </select>
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y} className="bg-white dark:bg-slate-900">{y}</option>
              ))}
            </select>
          </div>
        )}

        {dateRange === 'year' && (
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl animate-in slide-in-from-left-2 duration-300 shadow-sm">
            <Calendar size={16} className="text-blue-500 ml-2" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-slate-900 dark:text-white text-xs font-black py-2 px-4 focus:outline-none cursor-pointer"
            >
              {[2024, 2025, 2026].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <button 
          onClick={() => setShowChartsModal(true)}
          className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg hover:border-emerald-500/50 transition-all group text-left relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <BarChart3 className="text-emerald-500" size={16} />
          </div>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-emerald-500 transition-colors">Total Facturado</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="text-emerald-500 shrink-0" size={24} />
            {stats.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[10px] text-emerald-500/50 font-bold mt-2 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <TrendingUp size={10} /> Ver análisis por categoría
          </p>
        </button>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg hover:border-blue-500/30 transition-colors group">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors">Comprobantes</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Hash className="text-blue-500 shrink-0" size={24} />
            {stats.count}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-lg sm:col-span-2 lg:col-span-1 hover:border-indigo-500/30 transition-colors group">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 group-hover:text-indigo-500 transition-colors">Unidades con Gasto</p>
          <p className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Truck className="text-indigo-500 shrink-0" size={24} />
            {stats.units}
          </p>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar folio, descripción, taller, RFC, emisor, unidad o placa..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all text-lg placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-xl"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="text-blue-500 animate-spin" size={48} />
          <p className="text-slate-400 font-medium">Cargando facturación...</p>
        </div>
      ) : filteredFacturas.length === 0 ? (
        <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center space-y-6 shadow-xl">
          <div className="bg-slate-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <FilePlus className="text-slate-400 dark:text-slate-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No se encontraron facturas</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchTerm ? `No hay resultados para "${searchTerm}".` : "Aún no has registrado facturas."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentFacturas.map((f) => {
            const unidad = getUnidadInfo(f.unidad);
            return (
              <div 
                key={f.id} 
                onClick={() => {
                  setSelectedFactura(f);
                  setShowDetailModal(true);
                }}
                className={`bg-white dark:bg-slate-900/40 backdrop-blur-sm border ${f.unidades_info?.length > 1 ? 'border-purple-500/50 shadow-purple-900/10' : 'border-slate-200 dark:border-slate-800'} rounded-3xl p-6 hover:border-blue-500 transition-all group shadow-lg dark:shadow-2xl flex flex-col relative overflow-hidden cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
              >
                {f.unidades_info?.length > 1 && (
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">
                    Gasto Compartido
                  </div>
                )}
                <div className="flex justify-between items-start mb-6">
                  <div className="min-w-0">
                    <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Folio</p>
                    <p className="text-slate-900 dark:text-white font-mono text-2xl font-black tracking-tight truncate">{f.folio}</p>
                    {f.ticket_folio_interno && (
                      <p className="text-amber-500 text-[11px] font-mono font-bold mt-1 bg-amber-500/10 px-2 py-0.5 rounded-md inline-block border border-amber-500/20">
                        Tk: {f.ticket_folio_interno}
                      </p>
                    )}
                    {f.categoria && (
                      <div className="inline-block bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-md mt-1 border border-blue-500/20 truncate max-w-full">
                        {f.categoria}
                      </div>
                    )}
                    {!f.categoria && f.producto_nombre && (
                      <div className="inline-block bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded-md mt-1 border border-blue-500/20 truncate max-w-full">
                        {f.producto_categoria}: {f.producto_nombre}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Monto</p>
                    <p className="text-emerald-400 font-black text-2xl">${parseFloat(f.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="space-y-4 flex-grow">
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                    <div className="bg-blue-600/10 p-2 rounded-lg shrink-0">
                      <Truck className="text-blue-500" size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Asignación</p>
                      <p className={`text-sm font-bold truncate ${f.unidades_info?.length > 1 ? 'text-purple-600 dark:text-purple-400' : 'text-slate-900 dark:text-white'}`}>
                        {f.unidades_info?.length > 1 
                          ? `${f.unidades_info.length} Unidades: ${f.unidades_info.join(', ')}` 
                          : (unidad ? `Tractor: ${unidad.numero_economico}` : 'Sin tractor asignado')}
                      </p>
                      {f.caja_numero_economico && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                          <Archive size={12} className="text-indigo-400 shrink-0" />
                          Remolque: {f.caja_numero_economico}
                        </p>
                      )}
                      {f.variado_numero_economico && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-semibold">
                          <Settings size={12} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
                          Variado: {f.variado_numero_economico}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg shrink-0 mt-0.5 border border-slate-100 dark:border-slate-700">
                      <Store className="text-slate-400 dark:text-slate-400" size={14} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Taller / Proveedor</p>
                      <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">{f.taller_nombre || f.proveedor_nombre || 'No especificado'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 px-1">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg shrink-0 mt-0.5 border border-slate-100 dark:border-slate-700">
                      <Info className="text-slate-400 dark:text-slate-400" size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Descripción</p>
                      <p className="text-slate-600 dark:text-slate-300 text-sm italic truncate" title={f.descripcion}>
                        {f.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-slate-500 text-xs flex items-center gap-2 font-medium">
                      <Calendar size={14} className="text-slate-600" />
                      {new Date(f.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    
                    <button 
                      onClick={(e) => handleEdit(e, f)}
                      className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-all"
                      title="Editar Factura"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                  
                  {f.archivo_escaneado ? (
                    <a 
                      href={f.archivo_escaneado} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-[11px] font-bold shadow-lg shadow-blue-900/40 transition-all active:scale-95 flex items-center gap-2"
                    >
                      Ver Doc <ExternalLink size={14} />
                    </a>
                  ) : (
                    <span className="text-rose-400 text-[10px] font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20">Sin Archivo</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
            <button
              key={number}
              onClick={() => paginate(number)}
              className={`w-10 h-10 rounded-xl font-bold transition-all ${
                currentPage === number 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/20 scale-110' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {number}
            </button>
          ))}

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl bg-slate-800 text-white disabled:opacity-50 hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {showAltaModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-6xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] custom-scrollbar">
            <AltaFactura 
              onSuccess={handleAltaSuccess} 
              onClose={() => {
                setShowAltaModal(false);
                setEditingFactura(null);
              }} 
              factura={editingFactura}
              existingFacturas={facturas}
            />
          </div>
        </div>
      )}

      {showDetailModal && selectedFactura && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-2xl p-0 shadow-2xl relative overflow-hidden shadow-blue-500/5">
            {/* Header del Modal */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600/10 p-3 rounded-2xl">
                  <FilePlus className="text-blue-500" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Detalles de Factura</h2>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Folio: {selectedFactura.folio}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Monto Total</p>
                  <p className="text-3xl font-black text-emerald-400">
                    ${parseFloat(selectedFactura.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Fecha de Emisión</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-end gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    {new Date(selectedFactura.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600/10 p-2 rounded-xl">
                      <Truck className="text-blue-500" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Unidad(es) Asignada(s)</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedFactura.detalles_unidades?.length > 0 ? (
                          <div className="space-y-2 mt-1 w-full">
                            {selectedFactura.detalles_unidades.map(detalle => (
                              <div key={detalle.id} className="flex justify-between items-center bg-purple-600/10 border border-purple-500/20 px-3 py-1.5 rounded-xl">
                                <span className="text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase">{detalle.unidad_nombre}</span>
                                <span className="text-slate-900 dark:text-white text-xs font-bold">${parseFloat(detalle.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                              </div>
                            ))}
                          </div>
                        ) : selectedFactura.unidades_info?.length > 1 ? (
                          selectedFactura.unidades_info.map(uEco => (
                            <span key={uEco} className="bg-purple-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                              {uEco}
                            </span>
                          ))
                        ) : (
                          <p className="text-slate-900 dark:text-white font-bold">
                            {getUnidadInfo(selectedFactura.unidad) 
                              ? `${getUnidadInfo(selectedFactura.unidad).numero_economico} (${getUnidadInfo(selectedFactura.unidad).placas})` 
                              : 'Sin unidad asignada'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                      <Store className="text-slate-500 dark:text-slate-400" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Taller / Proveedor</p>
                      <p className="text-slate-900 dark:text-white font-bold">{selectedFactura.taller_nombre || selectedFactura.proveedor_nombre || 'No especificado'}</p>
                      {selectedFactura.razon_social_emisor && (
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">{selectedFactura.razon_social_emisor}</p>
                      )}
                      {selectedFactura.rfc_emisor && (
                        <p className="text-slate-500 text-xs font-mono mt-0.5">RFC: {selectedFactura.rfc_emisor}</p>
                      )}
                    </div>
                  </div>
                </div>

                {selectedFactura.caja && (
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3 col-span-1 md:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-600/10 p-2 rounded-xl">
                        <Archive className="text-indigo-500" size={20} />
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase">Caja / Remolque Relacionado</p>
                        <p className="text-slate-900 dark:text-white font-bold">
                          {(() => {
                            const cajaObj = getCajaInfo(selectedFactura.caja);
                            return cajaObj 
                              ? `${cajaObj.numero_economico} - Placas: ${cajaObj.placas} ${cajaObj.tipo ? `(${cajaObj.tipo})` : ''}` 
                              : selectedFactura.caja_numero_economico || 'Caja asignada';
                          })()}
                        </p>
                        {(() => {
                          const cajaObj = getCajaInfo(selectedFactura.caja);
                          return cajaObj && (cajaObj.modelo || cajaObj.numero_serie) ? (
                            <p className="text-slate-500 text-xs mt-1">
                              {cajaObj.modelo ? `Modelo: ${cajaObj.modelo}` : ''}
                              {cajaObj.modelo && cajaObj.numero_serie ? ' | ' : ''}
                              {cajaObj.numero_serie ? `N/S: ${cajaObj.numero_serie}` : ''}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {selectedFactura.variado && (
                  <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-3 col-span-1 md:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-600/10 p-2 rounded-xl">
                        <Settings className="text-emerald-500" size={20} />
                      </div>
                      <div>
                        <p className="text-slate-500 text-[9px] font-bold uppercase">Vehículo Variado / Maquinaria Relacionado</p>
                        <p className="text-slate-900 dark:text-white font-bold">
                          {(() => {
                            const varObj = getVariadoInfo(selectedFactura.variado);
                            return varObj 
                              ? `${varObj.numero_economico} - Placas: ${varObj.placas || 'N/A'} ${varObj.tipo ? `(${varObj.tipo})` : ''}` 
                              : selectedFactura.variado_numero_economico || 'Vehículo asignado';
                          })()}
                        </p>
                        {(() => {
                          const varObj = getVariadoInfo(selectedFactura.variado);
                          return varObj && (varObj.modelo || varObj.numero_serie) ? (
                            <p className="text-slate-500 text-xs mt-1">
                              {varObj.modelo ? `Modelo: ${varObj.modelo}` : ''}
                              {varObj.modelo && varObj.numero_serie ? ' | ' : ''}
                              {varObj.numero_serie ? `N/S: ${varObj.numero_serie}` : ''}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                    <Tag className="text-slate-500 dark:text-slate-400" size={20} />
                  </div>
                  <div className="flex-grow">
                    <p className="text-slate-500 text-[9px] font-bold uppercase">Categoría / Concepto</p>
                    <p className="text-slate-900 dark:text-white font-bold">
                      {selectedFactura.categoria || (
                        <>
                          <span className="text-blue-600 dark:text-blue-400">{selectedFactura.producto_categoria}:</span> {selectedFactura.producto_nombre || 'No especificado'}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {selectedFactura.ticket_folio_interno && (
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-800/50">
                    <div className="bg-amber-600/10 p-2 rounded-xl">
                      <TicketIcon className="text-amber-500" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-bold uppercase">Relacionado con Ticket</p>
                      <p className="text-amber-500 font-bold font-mono uppercase">{selectedFactura.ticket_folio_interno}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 px-1">
                  <Info size={14} /> Descripción del Gasto
                </p>
                <div className="bg-slate-50 dark:bg-slate-950/30 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 italic text-sm leading-relaxed">
                  {selectedFactura.descripcion || 'Sin descripción adicional proporcionada.'}
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex gap-4">
              {selectedFactura.archivo_escaneado ? (
                <a 
                  href={selectedFactura.archivo_escaneado} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex-grow bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <ExternalLink size={20} />
                  VISUALIZAR DOCUMENTO ORIGINAL
                </a>
              ) : (
                <div className="flex-grow bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 border border-slate-200 dark:border-slate-700">
                  <AlertCircle size={20} />
                  SIN DOCUMENTO DIGITALIZADO
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showChartsModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] w-full max-w-2xl p-8 shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowChartsModal(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="bg-emerald-500/10 p-3 rounded-2xl">
                <BarChart3 className="text-emerald-500" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Análisis de Gastos</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Distribución por Categoría</p>
              </div>
            </div>

            {chartDataConFills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64 w-full">
                  <ChartContainer config={categoryChartConfig} className="h-full w-full">
                    <PieChart>
                      <Pie
                        data={chartDataConFills}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="rgba(0,0,0,0)"
                      >
                        {chartDataConFills.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent config={categoryChartConfig} formatter={(value) => `$${parseFloat(value).toLocaleString('es-MX', {minimumFractionDigits: 2})}`} />} />
                    </PieChart>
                  </ChartContainer>
                </div>
                
                <div className="space-y-2.5 max-h-[16.5rem] overflow-y-auto pr-2 custom-scrollbar">
                  {(() => {
                    const total = chartDataConFills.reduce((acc, curr) => acc + curr.value, 0);
                    return chartDataConFills.map((item) => {
                      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={item.name} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 rounded-2xl transition-all hover:bg-slate-100 dark:hover:bg-slate-900/50">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{categoryChartConfig[item.name]?.label || item.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold">{percentage}%</p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white shrink-0 ml-4 font-mono">
                            ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 font-medium italic bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                No hay datos disponibles para esta selección
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Facturacion;
