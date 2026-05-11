import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Globe,
  Loader2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import NuevoProveedor from './NuevoProveedor';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showModal, setShowModal] = useState(false);

  const categorias = [
    'Refacciones',
    'Mantenimiento',
    'Llantas',
    'Combustible',
    'Seguros',
    'Servicios Generales',
    'Otros'
  ];

  useEffect(() => {
    fetchProveedores();
  }, [categoriaFilter]);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      let url = 'proveedores/';
      if (categoriaFilter) {
        url += `?categoria=${encodeURIComponent(categoriaFilter)}`;
      }
      const response = await api.get(url);
      setProveedores(response.data);
      setError(null);
    } catch (err) {
      console.error("Error cargando proveedores", err);
      setError("No se pudieron cargar los datos de los proveedores.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    fetchProveedores();
  };

  const filteredProveedores = proveedores.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(searchLower) ||
      (p.telefono && p.telefono.includes(searchLower)) ||
      (p.email && p.email.toLowerCase().includes(searchLower)) ||
      (p.categoria.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Users className="text-purple-500" size={36} />
            Directorio de Proveedores
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Gestiona todos los proveedores de la empresa y filtra por categoría.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95 self-start md:self-center"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
        <div className="relative group flex-1">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="text-slate-500 group-focus-within:text-purple-500 transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-600"
          />
        </div>
        
        <div className="w-full md:w-64">
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">Todas las Categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="text-purple-500 animate-spin" size={48} />
          <p className="text-slate-400 font-medium">Cargando proveedores...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-10 text-center space-y-4">
          <AlertCircle className="text-rose-500 mx-auto" size={48} />
          <p className="text-rose-400 text-lg font-medium">{error}</p>
          <button onClick={fetchProveedores} className="text-purple-400 hover:text-purple-300 font-bold underline">Intentar de nuevo</button>
        </div>
      ) : filteredProveedores.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-20 text-center space-y-6">
          <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Users className="text-slate-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-white">No se encontraron proveedores</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            No hay resultados para los filtros actuales. Intenta con otra categoría o término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProveedores.map((p) => (
            <div key={p.id} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 hover:border-purple-500/50 transition-all group shadow-xl flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl truncate pr-2">{p.nombre}</h3>
                  <div className="inline-flex items-center gap-1.5 bg-purple-600/20 text-purple-400 text-xs font-bold px-2.5 py-1 rounded-md mt-2 border border-purple-500/20">
                    <Briefcase size={12} />
                    {p.categoria}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-4 flex-1">
                {p.telefono && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg text-slate-400">
                      <Phone size={16} />
                    </div>
                    <span className="text-sm font-medium">{p.telefono}</span>
                  </div>
                )}
                
                {p.email && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg text-slate-400">
                      <Mail size={16} />
                    </div>
                    <span className="text-sm font-medium truncate">{p.email}</span>
                  </div>
                )}

                {p.direccion && (
                  <div className="flex items-start gap-3 text-slate-300">
                    <div className="bg-slate-800/80 p-1.5 rounded-lg text-slate-400 mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <span className="text-sm font-medium line-clamp-2">{p.direccion}</span>
                  </div>
                )}
              </div>
              
              {p.sitio_web && (
                <div className="pt-4 mt-4 border-t border-slate-800/50">
                  <a 
                    href={p.sitio_web.startsWith('http') ? p.sitio_web : `https://${p.sitio_web}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm font-bold transition-colors"
                  >
                    <Globe size={16} /> Visitar sitio web
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Proveedor */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <NuevoProveedor 
              onSuccess={handleSuccess} 
              onClose={() => setShowModal(false)} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;
