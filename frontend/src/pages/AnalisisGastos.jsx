import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3, TrendingUp, Calendar as CalendarIcon, Filter, Truck, Search } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const AnalisisGastos = ({ facturas, vehiculos }) => {
  const [unidadSeleccionada, setUnidadSeleccionada] = useState('todas');
  const [busquedaUnidad, setBusquedaUnidad] = useState('');

  const vehiculosFiltrados = useMemo(() => {
    if (!vehiculos) return [];
    return vehiculos.filter(v => 
      v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
      v.placas.toLowerCase().includes(busquedaUnidad.toLowerCase())
    );
  }, [vehiculos, busquedaUnidad]);

  const facturasFiltradas = useMemo(() => {
    if (unidadSeleccionada === 'todas') return facturas;
    return facturas.filter(f => f.unidad === parseInt(unidadSeleccionada));
  }, [facturas, unidadSeleccionada]);

  const dataPorCategoria = useMemo(() => {
    const categorias = {};
    facturasFiltradas.forEach(f => {
      const cat = f.producto_categoria || 'Sin Categoría';
      const monto = parseFloat(f.monto);
      if (!categorias[cat]) categorias[cat] = 0;
      categorias[cat] += monto;
    });
    return Object.entries(categorias).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [facturasFiltradas]);

  const dataPorMes = useMemo(() => {
    const meses = {};
    facturasFiltradas.forEach(f => {
      const date = new Date(f.fecha);
      const mesAnio = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!meses[mesAnio]) meses[mesAnio] = { name: mesAnio, total: 0 };
      
      const cat = f.producto_categoria || 'Sin Categoría';
      if (!meses[mesAnio][cat]) meses[mesAnio][cat] = 0;
      
      meses[mesAnio][cat] += parseFloat(f.monto);
      meses[mesAnio].total += parseFloat(f.monto);
    });
    return Object.values(meses).sort((a, b) => a.name.localeCompare(b.name));
  }, [facturasFiltradas]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl">
          <p className="text-white font-bold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-mono text-white font-bold">${entry.value.toLocaleString('es-MX', {minimumFractionDigits: 2})}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none font-medium"
            >
              <option value="todas">
                {busquedaUnidad ? `Resultados (${vehiculosFiltrados.length})` : 'Todas las Unidades (Global)'}
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
          
          {dataPorCategoria.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataPorCategoria}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="rgba(0,0,0,0)"
                  >
                    {dataPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataPorMes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(value) => `$${value/1000}k`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    name="Total" 
                    stroke="#10b981" 
                    strokeWidth={4}
                    dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#0f172a' }} 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataPorMes} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickMargin={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickFormatter={(value) => `$${value/1000}k`} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend iconType="circle" />
                  
                  {dataPorCategoria.map((cat, index) => (
                    <Bar key={cat.name} dataKey={cat.name} stackId="a" fill={COLORS[index % COLORS.length]} radius={index === dataPorCategoria.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
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
