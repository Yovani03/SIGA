import React, { useState, useEffect, useMemo } from 'react';
import { History, Search, Clock, User, Activity, Filter, Calendar } from 'lucide-react';
import api from '../services/api';

const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  const fetchHistorial = async () => {
    try {
      const response = await api.get('/auth/historial/');
      setHistorial(response.data);
    } catch (error) {
      console.error('Error fetching historial:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorial();
  }, []);

  const uniqueUsers = useMemo(() => {
    const users = new Set(historial.map(h => h.usuario_nombre).filter(Boolean));
    return Array.from(users);
  }, [historial]);

  const uniqueActions = useMemo(() => {
    const actions = new Set(historial.map(h => h.accion).filter(Boolean));
    return Array.from(actions);
  }, [historial]);

  const filteredHistorial = historial.filter(h => {
    const matchesSearch = 
      h.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.accion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.detalles?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesUser = selectedUser ? h.usuario_nombre === selectedUser : true;
    const matchesAction = selectedAction ? h.accion === selectedAction : true;
    
    let matchesDate = true;
    if (startDate || endDate) {
      const itemDate = new Date(h.fecha);
      itemDate.setHours(0, 0, 0, 0);
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        // Compare with timezone offsets adjusted or just straight date value
        start.setMinutes(start.getMinutes() + start.getTimezoneOffset());
        if (itemDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        end.setMinutes(end.getMinutes() + end.getTimezoneOffset());
        if (itemDate > end) matchesDate = false;
      }
    }
    
    return matchesSearch && matchesUser && matchesAction && matchesDate;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="text-blue-500" />
            Historial de Acciones
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Auditoría de eventos y movimientos en el sistema</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por usuario, acción o detalles..."
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap sm:flex-nowrap gap-4">
              <div className="relative w-full sm:w-auto min-w-[160px]">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Todos los usuarios</option>
                  {uniqueUsers.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div className="relative w-full sm:w-auto min-w-[160px]">
                <Activity className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white appearance-none cursor-pointer"
                >
                  <option value="">Todas las acciones</option>
                  {uniqueActions.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center border-t border-slate-200 dark:border-slate-800 pt-4">
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Filter size={16} /> Filtro por Fecha:
            </span>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                />
              </div>
              <span className="text-slate-400">-</span>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
                />
              </div>
              {(startDate || endDate || selectedUser || selectedAction || searchTerm) && (
                <button
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSelectedUser('');
                    setSelectedAction('');
                    setSearchTerm('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm font-medium">
              <tr>
                <th className="px-6 py-4 text-left">Usuario</th>
                <th className="px-6 py-4 text-left">Acción</th>
                <th className="px-6 py-4 text-left">Detalles</th>
                <th className="px-6 py-4 text-left">Fecha y Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">Cargando historial...</td></tr>
              ) : filteredHistorial.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-slate-500">No se encontraron registros</td></tr>
              ) : (
                filteredHistorial.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold uppercase">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{h.usuario_nombre}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{h.usuario_rol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <Activity size={16} className="text-blue-500" />
                        {h.accion}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md truncate" title={h.detalles}>
                        {h.detalles}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <Clock size={16} />
                        {formatDate(h.fecha)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Historial;
