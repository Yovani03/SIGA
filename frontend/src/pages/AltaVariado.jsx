import React, { useState } from 'react';
import api from '../services/api';
import { 
  Plus, 
  Hash, 
  Tag, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Binary,
  Settings
} from 'lucide-react';
import notify from '../utils/notifications';

const AltaVariado = ({ onSuccess, onClose, variado = null }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    numero_economico: variado?.numero_economico || '',
    placas: variado?.placas || '',
    tipo: variado?.tipo || '',
    modelo: variado?.modelo || '',
    numero_serie: variado?.numero_serie || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        ...formData,
        modelo: formData.modelo ? formData.modelo.trim() : null
      };

      if (variado) {
        await api.put(`variados/${variado.id}/`, payload);
      } else {
        await api.post('variados/', payload);
      }
      setSuccess(true);
      notify.success(variado ? "Vehículo variado actualizado correctamente" : "Vehículo variado registrado correctamente");
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Error al registrar el vehículo variado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600/10 p-3 rounded-2xl">
            <Settings className="text-indigo-600 dark:text-indigo-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {variado ? 'Editar Vehículo Variado' : 'Alta de Vehículo Variado'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {variado ? 'Modifica los datos del equipo o maquinaria.' : 'Completa los datos para registrar la maquinaria o equipo.'}
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 p-2 rounded-full transition-colors shadow-sm"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Tag className="text-indigo-600 dark:text-indigo-500" size={18} />
            Detalles del Equipo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                <Hash size={14} className="text-indigo-500" /> Número Económico *
              </label>
              <input
                required
                type="text"
                name="numero_economico"
                value={formData.numero_economico}
                onChange={handleChange}
                placeholder="Ej. H-100"
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                <CreditCard size={14} className="text-indigo-500" /> Placas
              </label>
              <input
                type="text"
                name="placas"
                value={formData.placas}
                onChange={handleChange}
                placeholder="Ej. N/A o Placa"
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                <Settings size={14} className="text-indigo-500" /> Tipo de Unidad (Maquinaria/Moto/Etc.)
              </label>
              <input
                type="text"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                placeholder="Ej. RETROEXCAVADORA"
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                <Calendar size={14} className="text-indigo-500" /> Modelo
              </label>
              <input
                type="text"
                name="modelo"
                value={formData.modelo}
                onChange={handleChange}
                placeholder="Ej. 416B"
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 shadow-sm"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-medium text-slate-400 flex items-center gap-2 ml-1">
                <Binary size={14} className="text-indigo-500" /> Número de Serie
              </label>
              <input
                type="text"
                name="numero_serie"
                value={formData.numero_serie}
                onChange={handleChange}
                placeholder="Número de serie o VIN"
                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 uppercase shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-4 flex items-center gap-3 text-emerald-400 animate-in zoom-in-95 duration-300">
              <CheckCircle size={18} />
              <span className="font-semibold text-xs">
                {variado ? '¡Equipo actualizado con éxito!' : '¡Equipo registrado con éxito!'}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-4 flex items-center gap-3 text-rose-400 animate-in zoom-in-95 duration-300">
              <AlertCircle size={18} />
              <span className="font-semibold text-xs break-words line-clamp-2">{error}</span>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-2xl transition-all"
            >
              Cancelar
            </button>
            <button
              disabled={loading}
              type="submit"
              className="flex-1 py-4 bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl shadow-indigo-900/40 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Settings size={20} />
              )}
              {loading ? (variado ? 'GUARDANDO...' : 'REGISTRANDO...') : (variado ? 'ACTUALIZAR EQUIPO' : 'REGISTRAR EQUIPO')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AltaVariado;
