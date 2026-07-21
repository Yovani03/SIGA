import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Tag, Plus, Loader2, AlertCircle, Trash2, Edit3, Save, X } from 'lucide-react';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nombre: '', categoria: 'Otro', descripcion: '' });

  const categorias = ['Mantenimiento', 'Combustible', 'Operativo', 'Administrativo', 'Refacciones', 'Llantas', 'Otro'];

  useEffect(() => {
    fetchProductos();
  }, []);

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const res = await api.get('productos/');
      setProductos(res.data);
    } catch (err) {
      setError("Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('productos/', formData);
      setShowForm(false);
      setFormData({ nombre: '', categoria: 'Otro', descripcion: '' });
      fetchProductos();
    } catch (err) {
      alert("Error al guardar el producto. " + (err.response?.data ? JSON.stringify(err.response.data) : ""));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este producto/categoría?")) {
      try {
        await api.delete(`productos/${id}/`);
        fetchProductos();
      } catch (err) {
        alert("No se puede eliminar porque está asociado a facturas existentes.");
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Tag className="text-purple-500" size={36} />
            Catálogo de Productos
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Administra los conceptos y categorías de gastos para tus facturas.</p>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 self-start md:self-center"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancelar' : 'Nuevo Producto'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 shadow-xl animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Nombre del Producto/Servicio</label>
              <input
                required
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej. Cambio de Aceite, Diésel..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Categoría</label>
              <select
                required
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all appearance-none"
              >
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Descripción (Opcional)</label>
              <input
                type="text"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Detalles adicionales..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all">
              <Save size={18} /> Guardar
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="text-purple-500 animate-spin" size={48} /></div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-rose-400 text-center">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productos.map(p => (
            <div key={p.id} className="bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-purple-500/50 transition-all group shadow-sm dark:shadow-none">
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {p.categoria}
                </div>
                <button onClick={() => handleDelete(p.id)} className="text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{p.nombre}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{p.descripcion || 'Sin descripción'}</p>
            </div>
          ))}
          {productos.length === 0 && !showForm && (
            <div className="col-span-full text-center p-12 bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-500 dark:text-slate-400">
              No hay productos registrados. Agrega uno nuevo para empezar a categorizar facturas.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Productos;
