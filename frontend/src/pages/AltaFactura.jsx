import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FilePlus, 
  Upload, 
  Calendar, 
  DollarSign, 
  Hash, 
  Truck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const AltaFactura = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    fecha: '',
    monto: '',
    folio: '',
    unidad: '',
    archivo_escaneado: null
  });
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Cargar vehículos para el select
    api.get('vehiculos/')
      .then(res => setVehiculos(res.data))
      .catch(err => console.error("Error cargando vehículos", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, archivo_escaneado: e.target.files[0] }));
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      // Llamada al Agente Local de Escaneo
      const response = await fetch('http://localhost:3001/api/scan');
      if (!response.ok) {
          throw new Error('Fallo al conectar con el escáner');
      }
      const blob = await response.blob();
      const file = new File([blob], `factura_escaneada_${Date.now()}.pdf`, { type: "application/pdf" });
      setFormData(prev => ({ ...prev, archivo_escaneado: file }));
      setSuccess(false); // limpiar success si habia
    } catch (err) {
      setError('Asegúrate de encender el escáner (abre el archivo iniciar_escaner.bat) y que tu perfil se llame "Brother" en NAPS2.');
    } finally {
      setScanning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const data = new FormData();
    data.append('fecha', formData.fecha);
    data.append('monto', formData.monto);
    data.append('folio', formData.folio);
    data.append('unidad', formData.unidad);
    if (formData.archivo_escaneado) {
      data.append('archivo_escaneado', formData.archivo_escaneado);
    }

    try {
      console.log("Enviando factura al servidor...");
      const res = await api.post('facturas/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log("Respuesta servidor:", res.data);
      setSuccess(true);
      setFormData({ fecha: '', monto: '', folio: '', unidad: '', archivo_escaneado: null });
    } catch (err) {
      console.error("Error completo al guardar:", err);
      if (err.response) {
        setError(JSON.stringify(err.response.data));
      } else {
        setError("Error de red o el backend no está respondiendo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600/10 p-3 rounded-2xl">
          <FilePlus className="text-blue-500" size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Alta de Facturas</h1>
          <p className="text-slate-400">Registra una nueva factura y asóciala a una unidad.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Panel Izquierdo: Datos */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6 shadow-xl">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Hash size={16} /> Folio de Factura
              </label>
              <input
                required
                type="text"
                name="folio"
                value={formData.folio}
                onChange={handleChange}
                placeholder="Ej. F-99283"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Calendar size={16} /> Fecha de Emisión
              </label>
              <input
                required
                type="date"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <DollarSign size={16} /> Monto Total
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                <input
                  required
                  type="number"
                  step="0.01"
                  name="monto"
                  value={formData.monto}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2 flex items-center gap-2">
                <Truck size={16} /> Unidad Asociada
              </label>
              <select
                required
                name="unidad"
                value={formData.unidad}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all appearance-none"
              >
                <option value="">Selecciona una unidad...</option>
                {vehiculos.map(v => (
                  <option key={v.id} value={v.id}>{v.numero_economico} - {v.placas}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Escáner */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-3xl p-8 flex flex-col items-center justify-center text-center group hover:border-blue-500 transition-colors relative min-h-[300px]">
            {/* Input manual escondido arriba */}
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-1/2 opacity-0 cursor-pointer z-10"
              accept="image/*,.pdf"
            />
            
            <div className="bg-blue-600/10 p-5 rounded-full mb-4 group-hover:scale-110 transition-transform">
              <Upload className="text-blue-500" size={32} />
            </div>
            
            {formData.archivo_escaneado ? (
              <div className="space-y-2 relative z-20">
                <p className="text-emerald-400 font-medium">Archivo listo para subir:</p>
                <p className="text-slate-300 text-sm italic bg-slate-800 px-4 py-2 rounded-xl">{formData.archivo_escaneado.name}</p>
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, archivo_escaneado: null}))}
                  className="text-rose-400 text-xs font-bold mt-2 hover:underline"
                >
                  Quitar archivo
                </button>
              </div>
            ) : (
              <div className="space-y-4 relative z-20 w-full px-4">
                <p className="text-white font-semibold text-lg">Adjuntar Factura</p>
                <p className="text-slate-500 text-sm mb-6">Arrastra un archivo aquí o haz clic en la parte superior para buscar.</p>
                
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-bold">O MUCHO MEJOR</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleScan}
                  disabled={scanning}
                  className="w-full mt-4 py-3 bg-slate-800 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {scanning ? <Spinner /> : <FilePlus size={20} />}
                  <span>{scanning ? 'Escaneando con Brother...' : 'Escanear Directamente Ahora'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Feedback */}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3 text-emerald-400">
              <CheckCircle size={20} />
              <span className="font-medium text-sm">Factura registrada correctamente.</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 rounded-2xl p-4 flex items-center gap-3 text-rose-400">
              <AlertCircle size={20} />
              <span className="font-medium text-sm truncate">{error}</span>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all"
          >
            {loading ? <Spinner /> : <FilePlus size={20} />}
            <span>{loading ? 'Guardando...' : 'Registrar Factura'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AltaFactura;
