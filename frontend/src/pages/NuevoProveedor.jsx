import React, { useState } from 'react';
import api from '../services/api';
import { Users, X, Loader2, Save } from 'lucide-react';

const NuevoProveedor = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    telefono: '',
    email: '',
    direccion: '',
    sitio_web: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categorias = [
    'Refacciones',
    'Mantenimiento',
    'Llantas',
    'Combustible',
    'Seguros',
    'Servicios Generales',
    'Otros'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('proveedores/', formData);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar el proveedor. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Users className="text-purple-500" size={28} />
            Registrar Proveedor
          </h2>
          <p className="text-slate-400 mt-1">Añade un nuevo proveedor al directorio.</p>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
        >
          <X size={24} />
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Nombre del Proveedor *</label>
          <input
            type="text"
            name="nombre"
            required
            value={formData.nombre}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
            placeholder="Ej. AutoZone, Michelin..."
          />
        </div>

        <div>
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Categoría *</label>
          <select
            name="categoria"
            required
            value={formData.categoria}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all appearance-none"
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
              placeholder="Ej. 55 1234 5678"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Correo Electrónico</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
              placeholder="contacto@proveedor.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Dirección Física</label>
          <textarea
            name="direccion"
            rows="2"
            value={formData.direccion}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all resize-none"
            placeholder="Calle, Número, Colonia, Ciudad..."
          ></textarea>
        </div>

        <div>
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Sitio Web</label>
          <input
            type="text"
            name="sitio_web"
            value={formData.sitio_web}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all"
            placeholder="www.proveedor.com"
          />
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? 'Guardando...' : 'Guardar Proveedor'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoProveedor;
