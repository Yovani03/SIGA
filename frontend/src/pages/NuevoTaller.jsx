import React, { useState } from 'react';
import api from '../services/api';
import { Wrench, X, Loader2, Save, Search, ExternalLink, MapPin, Clipboard } from 'lucide-react';

const NuevoTaller = ({ onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    especialidad: '',
    telefono: '',
    direccion: '',
    url_mapa: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searchingAddress, setSearchingAddress] = useState(false);

  const searchAddress = async () => {
    if (!formData.direccion || formData.direccion.length < 3) return;
    setSearchingAddress(true);
    try {
      // Agregamos México al final para mejorar la precisión si no está presente
      const query = formData.direccion.toLowerCase().includes('mexico') 
        ? formData.direccion 
        : `${formData.direccion}, México`;
        
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
      const data = await response.json();
      setSuggestions(data);
      if (data.length === 0) {
        setError('No se encontraron ubicaciones exactas. Intenta con una dirección más general o busca manualmente.');
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error searching address:", err);
      setError('Error al conectar con el servicio de mapas.');
    } finally {
      setSearchingAddress(false);
    }
  };

  const openManualSearch = () => {
    const query = encodeURIComponent(formData.direccion || '');
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData(prev => ({ ...prev, url_mapa: text }));
    } catch (err) {
      console.error("Failed to read clipboard:", err);
      alert("No se pudo acceder al portapapeles. Por favor, pega manualmente.");
    }
  };

  const selectSuggestion = (s) => {
    setFormData({
      ...formData,
      direccion: s.display_name,
      url_mapa: `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`
    });
    setSuggestions([]);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const especialidadesList = [
    'Motores Diesel',
    'Frenos y Suspensión',
    'Transmisiones',
    'Eléctrico',
    'Llantas',
    'Carrocería',
    'Mantenimiento General',
    'Hidráulico'
  ];

  const toggleEspecialidad = (esp) => {
    const currentSpecs = formData.especialidad ? formData.especialidad.split(', ') : [];
    let newSpecs;
    if (currentSpecs.includes(esp)) {
      newSpecs = currentSpecs.filter(item => item !== esp);
    } else {
      newSpecs = [...currentSpecs, esp];
    }
    setFormData(prev => ({
      ...prev,
      especialidad: newSpecs.join(', ')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('talleres/', formData);
      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar el taller. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <Wrench className="text-blue-500" size={28} />
            Registrar Taller / Mecánico
          </h2>
          <p className="text-slate-400 mt-1">Añade un nuevo taller para asignarlo a las reparaciones.</p>
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
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Nombre del Taller / Mecánico *</label>
          <input
            type="text"
            name="nombre"
            required
            value={formData.nombre}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
            placeholder="Ej. Taller El Toro"
          />
        </div>

        <div>
          <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">Especialidad Principal</label>
          <div className="flex flex-wrap gap-2">
            {especialidadesList.map((esp) => (
              <button
                key={esp}
                type="button"
                onClick={() => toggleEspecialidad(esp)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  formData.especialidad && formData.especialidad.split(', ').includes(esp)
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                {esp}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Teléfono</label>
            <input
              type="text"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
              placeholder="Ej. 55 1234 5678"
            />
          </div>
        </div>

        <div className="relative">
          <div className="flex justify-between items-center mb-2">
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">Dirección Física *</label>
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={openManualSearch}
                className="text-[10px] font-bold text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ExternalLink size={12} />
                BUSCAR EN GOOGLE
              </button>
              <button 
                type="button"
                onClick={searchAddress}
                disabled={searchingAddress || !formData.direccion}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {searchingAddress ? <Loader2 className="animate-spin" size={12} /> : <Search size={12} />}
                AUTO-COMPLETAR
              </button>
            </div>
          </div>
          <textarea
            name="direccion"
            required
            rows="2"
            value={formData.direccion}
            onChange={handleChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all resize-none text-sm"
            placeholder="Calle, Número, Colonia, Ciudad..."
          ></textarea>
          
          {suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-slate-900 border border-blue-500/30 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden max-h-60 overflow-y-auto custom-scrollbar ring-1 ring-blue-500/20">
              <div className="p-2 bg-slate-950/50 border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sugerencias encontradas:</div>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 text-xs text-slate-300 hover:bg-blue-600/10 hover:text-blue-400 border-b border-slate-800/50 last:border-0 transition-colors flex items-start gap-3"
                >
                  <MapPin className="mt-0.5 flex-shrink-0" size={14} />
                  <span>{s.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider">URL del Mapa (Link generado)</label>
            <button 
              type="button"
              onClick={handlePaste}
              className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors bg-emerald-500/10 px-2 py-1 rounded-md"
            >
              <Clipboard size={12} />
              PEGAR LINK
            </button>
          </div>
          <div className="relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <ExternalLink className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={16} />
            </div>
            <input
              type="text"
              name="url_mapa"
              value={formData.url_mapa}
              onChange={handleChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-xs focus:border-blue-500 outline-none transition-all font-mono"
              placeholder="Pega el link de Google Maps aquí..."
            />
          </div>
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
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {loading ? 'Guardando...' : 'Guardar Taller'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoTaller;
