import React, { useState, useEffect } from 'react';
import { History, Search, Clock, User, Activity } from 'lucide-react';
import api from '../services/api';

const Historial = () => {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredHistorial = historial.filter(h => 
    h.usuario_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.accion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.detalles?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o detalles..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
