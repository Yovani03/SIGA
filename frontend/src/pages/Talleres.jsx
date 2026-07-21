import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Wrench, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Loader2,
  AlertCircle,
  Settings2,
  Edit3
} from 'lucide-react';
import NuevoTaller from './NuevoTaller';

const Talleres = () => {
  const [talleres, setTalleres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTaller, setSelectedTaller] = useState(null);

  const especialidadesList = [
    'Todas',
    'Motores Diesel',
    'Frenos y Suspensión',
    'Transmisiones',
    'Eléctrico',
    'Llantas',
    'Carrocería',
    'Mantenimiento General',
    'Hidráulico'
  ];

  useEffect(() => {
    fetchTalleres();
  }, []);

  const fetchTalleres = async () => {
    try {
      setLoading(true);
      const response = await api.get('talleres/');
      setTalleres(response.data);
      setError(null);
    } catch (err) {
      console.error("Error cargando talleres", err);
      setError("No se pudieron cargar los datos de los talleres.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setShowModal(false);
    fetchTalleres();
  };

  const filteredTalleres = talleres.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = (
      t.nombre.toLowerCase().includes(searchLower) ||
      (t.razon_social && t.razon_social.toLowerCase().includes(searchLower)) ||
      (t.especialidad && t.especialidad.toLowerCase().includes(searchLower)) ||
      (t.direccion && t.direccion.toLowerCase().includes(searchLower))
    );
    const matchesSpecialty = selectedSpecialty === 'Todas' || 
      (t.especialidad && t.especialidad.split(', ').includes(selectedSpecialty));
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Wrench className="text-blue-500" size={36} />
            Directorio de Talleres
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Gestiona el catálogo de mecánicos y talleres externos.</p>
        </div>
        
        <button 
          onClick={() => {
            setSelectedTaller(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 self-start md:self-center"
        >
          <Plus size={20} />
          Nuevo Taller
        </button>
      </div>

      {/* Search & Filter */}
      <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm dark:shadow-none">
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search className="text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre del taller, especialidad o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-inner"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/50">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest w-full mb-2 ml-1">Filtrar por Especialidad:</div>
          {especialidadesList.map((esp) => (
            <button
              key={esp}
              onClick={() => setSelectedSpecialty(esp)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                selectedSpecialty === esp
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                  : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              {esp}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="text-blue-500 animate-spin" size={48} />
          <p className="text-slate-400 font-medium">Cargando talleres...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-10 text-center space-y-4">
          <AlertCircle className="text-rose-500 mx-auto" size={48} />
          <p className="text-rose-400 text-lg font-medium">{error}</p>
          <button onClick={fetchTalleres} className="text-blue-400 hover:text-blue-300 font-bold underline">Intentar de nuevo</button>
        </div>
      ) : filteredTalleres.length === 0 ? (
        <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-20 text-center space-y-6">
          <div className="bg-slate-200 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Wrench className="text-slate-400 dark:text-slate-600" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">No se encontraron talleres</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchTerm ? "No hay resultados para la búsqueda actual." : "Aún no hay talleres registrados en el sistema."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTalleres.map((t) => (
            <div key={t.id} className="bg-slate-100 dark:bg-slate-900/40 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-blue-500/50 transition-all group shadow-sm dark:shadow-xl flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-slate-900 dark:text-white font-bold text-xl pr-2">{t.razon_social || t.nombre}</h3>
                  {t.razon_social && t.nombre && t.razon_social.trim().toLowerCase() !== t.nombre.trim().toLowerCase() && (
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">{t.nombre}</p>
                  )}
                  {t.especialidad && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {t.especialidad.split(', ').map(esp => (
                        <div key={esp} className="inline-flex items-center gap-1.5 bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/20">
                          <Settings2 size={10} />
                          {esp}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedTaller(t);
                    setShowModal(true);
                  }}
                  className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-600/20 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all shadow-inner flex-shrink-0 self-start"
                  title="Editar Taller"
                >
                  <Edit3 size={16} />
                </button>
              </div>

              <div className="space-y-4 mt-4 flex-1">
                {t.telefono && (
                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                    <div className="bg-slate-200 dark:bg-slate-800/80 p-1.5 rounded-lg text-slate-500 dark:text-slate-400">
                      <Phone size={16} />
                    </div>
                    <span className="text-sm font-medium">{t.telefono}</span>
                  </div>
                )}

                {t.direccion && (
                  <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                    <div className="bg-slate-200 dark:bg-slate-800/80 p-1.5 rounded-lg text-slate-500 dark:text-slate-400 mt-0.5">
                      <MapPin size={16} />
                    </div>
                    <span className="text-sm font-medium line-clamp-2">{t.direccion}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/50 flex gap-2">
                <a 
                  href={t.url_mapa || `https://maps.google.com/?q=${encodeURIComponent(t.direccion || t.nombre)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 flex justify-center items-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 py-2.5 rounded-xl text-sm font-bold transition-colors"
                >
                  <MapPin size={16} /> Ver en Mapa
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nuevo Taller */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl relative overflow-y-auto max-h-[95vh] custom-scrollbar">
            <NuevoTaller 
              onSuccess={handleSuccess} 
              onClose={() => {
                setShowModal(false);
                setSelectedTaller(null);
              }} 
              tallerToEdit={selectedTaller}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Talleres;
