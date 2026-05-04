import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Truck, 
  Search, 
  Plus, 
  Hash, 
  CreditCard, 
  Calendar, 
  Binary, 
  MapPin,
  ExternalLink,
  Loader2,
  AlertCircle,
  FilePlus
} from 'lucide-react';
import { Link } from 'react-router-dom';

const ListaVehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [loadingFacturas, setLoadingFacturas] = useState(false);

  useEffect(() => {
    fetchVehiculos();
  }, []);

  const fetchVehiculos = async () => {
    try {
      setLoading(true);
      const res = await api.get('vehiculos/');
      setVehiculos(res.data);
      setError(null);
    } catch (err) {
      console.error("Error cargando vehículos", err);
      setError("No se pudieron cargar las unidades. Verifica la conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const filteredVehiculos = vehiculos.filter(v => 
    v.numero_economico.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.placas.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.modelo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openFacturasModal = async (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setLoadingFacturas(true);
    try {
      const res = await api.get('facturas/');
      // Filtramos las facturas del vehículo seleccionado
      const vehiculoFacturas = res.data.filter(f => f.unidad === vehiculo.id);
      setFacturas(vehiculoFacturas);
    } catch (err) {
      console.error("Error cargando facturas", err);
    } finally {
      setLoadingFacturas(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Truck className="text-blue-500" size={36} />
            Catálogo de Unidades
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Administra y visualiza toda la flota de tractocamiones.</p>
        </div>
        
        <Link 
          to="/alta-vehiculo" 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/20 active:scale-95 self-start md:self-center"
        >
          <Plus size={20} />
          Nueva Unidad
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="Buscar por placa, económico, marca o modelo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-14 pr-6 py-4 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-lg placeholder:text-slate-600"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <Loader2 className="text-blue-500 animate-spin" size={48} />
          <p className="text-slate-400 font-medium">Cargando flota...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-10 text-center space-y-4">
          <AlertCircle className="text-rose-500 mx-auto" size={48} />
          <p className="text-rose-400 text-lg font-medium">{error}</p>
          <button 
            onClick={fetchVehiculos}
            className="text-blue-400 hover:text-blue-300 font-bold underline"
          >
            Intentar de nuevo
          </button>
        </div>
      ) : filteredVehiculos.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-20 text-center space-y-6">
          <div className="bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <Truck className="text-slate-600" size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">No se encontraron unidades</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              {searchTerm ? `No hay resultados para "${searchTerm}". Intenta con otros términos.` : "Aún no has registrado ningún camión en el sistema."}
            </p>
          </div>
          {!searchTerm && (
            <Link 
              to="/alta-vehiculo" 
              className="inline-flex items-center gap-2 text-blue-500 font-bold hover:text-blue-400 transition-colors"
            >
              Registrar mi primera unidad <Plus size={18} />
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredVehiculos.map((v) => (
            <div 
              key={v.id} 
              className="bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-[2rem] overflow-hidden group hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1"
            >
              {/* Image Container */}
              <div className="relative h-56 overflow-hidden bg-slate-950">
                {v.imagen ? (
                  <img 
                    src={v.imagen} 
                    alt={`${v.marca} ${v.modelo}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-800">
                    <Truck size={80} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase shadow-lg">
                  {v.numero_economico}
                </div>
              </div>

              {/* Data Content */}
              <div className="p-8 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors truncate">
                    {v.marca} {v.modelo}
                  </h3>
                  <p className="text-slate-500 font-bold text-sm uppercase tracking-wider">{v.anio || 'Año no especificado'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Placas</p>
                    <p className="text-white font-mono font-bold flex items-center gap-2">
                      <CreditCard size={14} className="text-blue-500" />
                      {v.placas}
                    </p>
                  </div>
                  <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-1">Serie (VIN)</p>
                    <p className="text-white font-mono font-bold flex items-center gap-2 truncate">
                      <Binary size={14} className="text-blue-500" />
                      {v.numero_vin ? v.numero_vin.slice(-6) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/50 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-emerald-500 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    Operativo
                  </span>
                  <button 
                    onClick={() => openFacturasModal(v)}
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-bold transition-colors bg-blue-900/20 px-3 py-1.5 rounded-xl hover:bg-blue-900/40"
                  >
                    Ver Facturas <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Facturas */}
      {selectedVehiculo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header del Modal */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <FilePlus className="text-blue-500" size={24} />
                  Facturas de Unidad {selectedVehiculo.numero_economico}
                </h2>
                <p className="text-slate-400 text-sm mt-1">{selectedVehiculo.marca} - {selectedVehiculo.placas}</p>
              </div>
              <button 
                onClick={() => setSelectedVehiculo(null)}
                className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-900/50">
              {loadingFacturas ? (
                <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
              ) : facturas.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Hash size={48} className="text-slate-700 mx-auto" />
                  <p className="text-slate-400 text-lg">Esta unidad aún no tiene facturas registradas.</p>
                  <Link 
                    to="/alta-factura" 
                    className="inline-block mt-2 text-blue-400 hover:text-blue-300 font-bold underline"
                  >
                    Registrar una ahora
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {facturas.map(f => (
                    <div key={f.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 hover:border-blue-500/50 transition-colors">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-slate-400 text-xs font-bold uppercase mb-1">Folio</p>
                          <p className="text-white font-mono text-lg font-bold">{f.folio}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-400 text-xs font-bold uppercase mb-1">Monto</p>
                          <p className="text-emerald-400 font-bold text-xl">${f.monto}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-700/50">
                        <p className="text-slate-400 text-sm flex items-center gap-2">
                          <Calendar size={14} /> {f.fecha}
                        </p>
                        
                        {f.archivo_escaneado ? (
                          <a 
                            href={f.archivo_escaneado} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                          >
                            Ver Documento
                          </a>
                        ) : (
                          <span className="text-rose-400 text-xs font-bold bg-rose-500/10 px-3 py-1.5 rounded-lg">Sin Imagen</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaVehiculos;
