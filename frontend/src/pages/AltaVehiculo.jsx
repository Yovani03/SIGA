import React, { useState } from 'react';
import api from '../services/api';
import { 
  Truck, 
  Upload, 
  Hash, 
  Tag, 
  Calendar, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Binary
} from 'lucide-react';

const AltaVehiculo = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    numero_economico: '',
    placas: '',
    marca: '',
    modelo: '',
    anio: '',
    numero_vin: '',
    imagen: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, imagen: e.target.files[0] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const data = new FormData();
    data.append('numero_economico', formData.numero_economico);
    data.append('placas', formData.placas);
    data.append('marca', formData.marca);
    data.append('modelo', formData.modelo);
    data.append('anio', formData.anio);
    data.append('numero_vin', formData.numero_vin);
    if (formData.imagen) {
      data.append('imagen', formData.imagen);
    }

    try {
      await api.post('vehiculos/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      setFormData({
        numero_economico: '',
        placas: '',
        marca: '',
        modelo: '',
        anio: '',
        numero_vin: '',
        imagen: null
      });
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Error al registrar el vehículo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center gap-4 mb-10">
        <div className="bg-indigo-600/10 p-4 rounded-3xl">
          <Truck className="text-indigo-500" size={32} />
        </div>
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Alta de Camiones</h1>
          <p className="text-slate-400 text-lg">Registra una nueva unidad a la flota de Autrotransportes.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel Izquierdo: Información Básica */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[2.5rem] p-10 space-y-8 shadow-2xl">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
              <Tag className="text-indigo-500" size={20} />
              Detalles de la Unidad
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Hash size={16} className="text-indigo-500" /> Número Económico
                </label>
                <input
                  required
                  type="text"
                  name="numero_economico"
                  value={formData.numero_economico}
                  onChange={handleChange}
                  placeholder="Ej. T-105"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <CreditCard size={16} className="text-indigo-500" /> Placas
                </label>
                <input
                  required
                  type="text"
                  name="placas"
                  value={formData.placas}
                  onChange={handleChange}
                  placeholder="Ej. 12-AB-34"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Tag size={16} className="text-indigo-500" /> Marca
                </label>
                <input
                  required
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleChange}
                  placeholder="Ej. Kenworth, Freightliner"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Tag size={16} className="text-indigo-500" /> Modelo
                </label>
                <input
                  required
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleChange}
                  placeholder="Ej. T680, Cascadia"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Calendar size={16} className="text-indigo-500" /> Año
                </label>
                <input
                  required
                  type="number"
                  name="anio"
                  value={formData.anio}
                  onChange={handleChange}
                  placeholder="Ej. 2024"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400 flex items-center gap-2 ml-1">
                  <Binary size={16} className="text-indigo-500" /> Número de Serie (VIN / BIN)
                </label>
                <input
                  required
                  type="text"
                  name="numero_vin"
                  value={formData.numero_vin}
                  onChange={handleChange}
                  placeholder="17 caracteres"
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-700 uppercase"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Imagen y Feedback */}
        <div className="space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-xl border-2 border-dashed border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center group hover:border-indigo-500 transition-all relative min-h-[400px] overflow-hidden">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              accept="image/*"
            />
            
            {formData.imagen ? (
              <div className="space-y-4 w-full">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-700">
                  <img 
                    src={URL.createObjectURL(formData.imagen)} 
                    alt="Vista previa" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">Click para cambiar imagen</p>
                  </div>
                </div>
                <div className="px-4">
                  <p className="text-indigo-400 font-medium truncate">{formData.imagen.name}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-600/10 p-6 rounded-full inline-block group-hover:scale-110 transition-transform duration-300">
                  <Upload className="text-indigo-500" size={40} />
                </div>
                <div className="space-y-1">
                  <p className="text-white font-bold text-xl">Fotografía de la Unidad</p>
                  <p className="text-slate-500 text-sm max-w-[200px] mx-auto">
                    Sube una imagen clara del tractocamión.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-2xl p-5 flex items-center gap-4 text-emerald-400 animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-500/20 p-2 rounded-full">
                  <CheckCircle size={20} />
                </div>
                <span className="font-semibold text-sm">¡Unidad registrada con éxito!</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-5 flex items-center gap-4 text-rose-400 animate-in zoom-in-95 duration-300">
                <div className="bg-rose-500/20 p-2 rounded-full">
                  <AlertCircle size={20} />
                </div>
                <span className="font-semibold text-sm break-words">{error}</span>
              </div>
            )}

            <button
              disabled={loading}
              type="submit"
              className="w-full py-5 bg-gradient-to-br from-indigo-600 to-violet-700 hover:from-indigo-500 hover:to-violet-600 disabled:opacity-50 text-white font-black text-lg rounded-[1.5rem] shadow-2xl shadow-indigo-900/40 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <Truck size={24} />
              )}
              {loading ? 'REGISTRANDO...' : 'REGISTRAR UNIDAD'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AltaVehiculo;
