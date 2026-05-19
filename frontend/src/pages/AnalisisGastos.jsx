import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, Filter, Truck, Search } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '../components/ui/chart';

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
  },
  "Gastos sin unidad asignada": {
    label: "Gastos sin unidad asignada",
    color: "#ef4444",
  }
};

const trendChartConfig = {
  total: {
    label: "Monto Total",
    color: "#10b981",
  }
};

const AnalisisGastos = ({ facturas, vehiculos }) => {
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('todas');
  const [busquedaUnidad, setBusquedaUnidad] = useState('');

  const vehiculosFiltrados = useMemo(() => {
    if (!vehiculos) return [];
    return vehiculos.filter(v => 
      v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
      v.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
    );
  }, [vehiculos, busquedaUnidad]);

  const facturasFiltradas = useMemo(() => {
    if (unidadSeleccionada === 'todas') return facturas;
    if (unidadSeleccionada === 'sin_asignar') {
      return facturas.filter(f => !f.unidad && (!f.unidades || f.unidades.length === 0));
    }
    const uId = parseInt(unidadSeleccionada);
    
    return facturas.reduce((acc, f) => {
      const detalle = f.detalles_unidades?.find(d => d.unidad === uId);
      if (detalle) {
        acc.push({ ...f, monto: detalle.monto });
        return acc;
      }

      if (f.unidad === uId) {
        if (f.unidades_info && f.unidades_info.length > 1 && (!f.detalles_unidades || f.detalles_unidades.length === 0)) {
            return acc;
        }
        acc.push(f);
      }
      return acc;
    }, []);
  }, [facturas, unidadSeleccionada]);

  const dataPorCategoria = useMemo(() => {
    const categorias = {};
    facturasFiltradas.forEach(f => {
      let cat = f.categoria;
      if (unidadSeleccionada === 'todas' && !f.unidad && (!f.unidades || f.unidades.length === 0)) {
        cat = 'Gastos sin unidad asignada';
      } else {
        if (!cat || cat === 'Otro') {
          cat = f.producto_categoria || 'Otro';
        }
        if (cat === 'Mantenimiento' || cat === 'Refacciones') {
          cat = 'Mantenimiento y Refacciones';
        }
      }
      const monto = parseFloat(f.monto);
      if (!categorias[cat]) categorias[cat] = 0;
      categorias[cat] += monto;
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [facturasFiltradas, unidadSeleccionada]);

  const dataPorCategoriaConFills = useMemo(() => {
    return dataPorCategoria.map((item, index) => ({
      ...item,
      fill: categoryChartConfig[item.name]?.color || COLORS[index % COLORS.length]
    }));
  }, [dataPorCategoria]);

  const dataPorMes = useMemo(() => {
    const meses = {};
    facturasFiltradas.forEach(f => {
      const date = new Date(f.fecha);
      const mesAnio = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!meses[mesAnio]) meses[mesAnio] = { name: mesAnio, total: 0 };
      
      let cat = f.categoria;
      if (unidadSeleccionada === 'todas' && !f.unidad && (!f.unidades || f.unidades.length === 0)) {
        cat = 'Gastos sin unidad asignada';
      } else {
        if (!cat || cat === 'Otro') {
          cat = f.producto_categoria || 'Otro';
        }
        if (cat === 'Mantenimiento' || cat === 'Refacciones') {
          cat = 'Mantenimiento y Refacciones';
        }
      }

      if (!meses[mesAnio][cat]) meses[mesAnio][cat] = 0;
      
      meses[mesAnio][cat] += parseFloat(f.monto);
      meses[mesAnio].total += parseFloat(f.monto);
    });
    return Object.values(meses).sort((a, b) => a.name.localeCompare(b.name));
  }, [facturasFiltradas, unidadSeleccionada]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Filtro por Unidad */}
      <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row items-center gap-6">
        <div className="flex items-center gap-3 bg-blue-600/10 p-3 rounded-2xl">
          <Filter className="text-blue-500" size={24} />
        </div>
        
        <div className="flex-grow w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <label className="text-slate-400 text-sm font-bold uppercase tracking-wider block">
              Analizar gastos por unidad
            </label>
            
            <div className="relative group min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={14} />
              <input
                type="text"
                placeholder="Buscar por eco o placas..."
                value={busquedaUnidad}
                onChange={(e) => setBusquedaUnidad(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
 
          <div className="relative">
            <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <select
              value={unidadSeleccionada}
              onChange={(e) => setUnidadSeleccionada(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none font-medium cursor-pointer"
            >
              <option value="todas">
                {busquedaUnidad ? `Resultados (${vehiculosFiltrados.length})` : 'Todas las Unidades (Global)'}
              </option>
              <option value="sin_asignar">
                Gastos sin unidad asignada
              </option>
              {vehiculosFiltrados.map(v => (
                <option key={v.id} value={v.id}>{v.numero_economico} - {v.placas}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Distribución por Categoría */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-600/20 p-3 rounded-2xl">
              <PieChartIcon className="text-blue-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Distribución de Gastos</h3>
          </div>
          
          {dataPorCategoriaConFills.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64 w-full">
                <ChartContainer config={categoryChartConfig} className="h-full w-full">
                  <PieChart>
                    <Pie
                      data={dataPorCategoriaConFills}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="rgba(0,0,0,0)"
                    >
                      {dataPorCategoriaConFills.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent config={categoryChartConfig} formatter={(value) => `$${parseFloat(value).toLocaleString('es-MX', {minimumFractionDigits: 2})}`} />} />
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="space-y-3">
                {(() => {
                  const total = dataPorCategoriaConFills.reduce((acc, curr) => acc + curr.value, 0);
                  return dataPorCategoriaConFills.map((item) => {
                    const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                    return (
                      <div key={item.name} className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800/80 rounded-2xl transition-all hover:bg-slate-900/60">
                        <div className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">{categoryChartConfig[item.name]?.label || item.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold">{percentage}% del total</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-white shrink-0 ml-4 font-mono">
                          ${parseFloat(item.value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500 font-medium italic bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
              No hay datos para esta selección
            </div>
          )}
        </div>

        {/* Tendencia Mensual */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-600/20 p-3 rounded-2xl">
              <TrendingUp className="text-emerald-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Tendencia Mensual Total</h3>
          </div>
          
          {dataPorMes.length > 0 ? (
            <div className="h-80 w-full">
              <ChartContainer config={trendChartConfig} className="h-full w-full">
                <LineChart data={dataPorMes} margin={{ top: 15, right: 15, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={(value) => `$${value/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent config={trendChartConfig} formatter={(value) => `$${parseFloat(value).toLocaleString('es-MX', {minimumFractionDigits: 2})}`} />} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="total" 
                    stroke="var(--color-total)" 
                    strokeWidth={4}
                    dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} 
                    activeDot={{ r: 7 }} 
                  />
                </LineChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-slate-500 font-medium italic bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
              Sin historial de gastos disponible
            </div>
          )}
        </div>

        {/* Comparativa de Gastos por Mes y Categoría */}
        <div className="col-span-1 lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-600/20 p-3 rounded-2xl">
              <BarChart3 className="text-purple-500" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">Comparativa de Gastos por Categoría</h3>
          </div>
          
          {dataPorMes.length > 0 ? (
            <div className="h-96 w-full">
              <ChartContainer config={categoryChartConfig} className="h-full w-full">
                <AreaChart data={dataPorMes} margin={{ top: 20, right: 15, left: -10, bottom: 5 }}>
                  <defs>
                    {dataPorCategoriaConFills.map((cat) => (
                      <linearGradient key={`grad-${cat.name}`} id={`color-${cat.name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={cat.fill} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={cat.fill} stopOpacity={0.0}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={10} tickFormatter={(value) => `$${value/1000}k`} />
                  <ChartTooltip content={<ChartTooltipContent config={categoryChartConfig} formatter={(value) => `$${parseFloat(value).toLocaleString('es-MX', {minimumFractionDigits: 2})}`} />} />
                  <ChartLegend content={<ChartLegendContent config={categoryChartConfig} />} />
                  
                  {dataPorCategoriaConFills.map((cat) => (
                    <Area 
                      key={cat.name} 
                      type="monotone"
                      dataKey={cat.name} 
                      stackId="a" 
                      stroke={cat.fill}
                      strokeWidth={2}
                      fill={`url(#color-${cat.name})`} 
                    />
                  ))}
                </AreaChart>
              </ChartContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-500 font-medium italic bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
              No hay facturas registradas para generar la comparativa
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AnalisisGastos;
