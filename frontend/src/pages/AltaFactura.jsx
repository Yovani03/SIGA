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
  AlertCircle,
  Tag,
  Ticket as TicketIcon,
  Store,
  Info,
  Search
} from 'lucide-react';

const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const AltaFactura = ({ onSuccess, onClose }) => {
  const [vehiculos, setVehiculos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [ticketsPendientes, setTicketsPendientes] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [entidades, setEntidades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    fecha: '',
    monto: '',
    folio: '',
    unidad: '',
    producto: '',
    ticket: '',
    taller: '',
    proveedor: '',
    descripcion: '',
    archivo_escaneado: null,
    rfc_emisor: '',
    razon_social_emisor: '',
    categoria: 'Otro',
    unidades: [],
    detalles_unidades: []
  });
  const [ivaIncluido, setIvaIncluido] = useState(false);
  const [busquedaTicket, setBusquedaTicket] = useState('');
  const [busquedaUnidad, setBusquedaUnidad] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('');
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('vehiculos/'),
      api.get('productos/'),
      api.get('tickets/pendientes/'),
      api.get('talleres/'),
      api.get('proveedores/')
    ])
    .then(([vehiculosRes, productosRes, ticketsRes, talleresRes, proveedoresRes]) => {
      setVehiculos(vehiculosRes.data);
      setProductos(productosRes.data);
      setTicketsPendientes(ticketsRes.data);
      setTalleres(talleresRes.data);
      setProveedores(proveedoresRes.data);
      setEntidades([
        ...talleresRes.data.map(t => ({ ...t, tipo: 'taller' })),
        ...proveedoresRes.data.map(p => ({ ...p, tipo: 'proveedor' }))
      ]);
    })
    .catch(err => console.error("Error cargando datos:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'ticket' && value) {
      const ticket = ticketsPendientes.find(t => t.id === parseInt(value));
      if (ticket) {
        setFormData(prev => {
          const producto = productos.find(p => p.id === ticket.producto);
          if (producto) {
            setCategoriaSeleccionada(producto.categoria);
          }

          let ticketRfc = prev.rfc_emisor;
          let ticketRazon = prev.razon_social_emisor;

          if (ticket.taller) {
            const tallerTicket = talleres.find(t => t.id === ticket.taller);
            if (tallerTicket) {
              ticketRfc = tallerTicket.rfc || ticketRfc;
              ticketRazon = tallerTicket.razon_social || ticketRazon;
            }
          } else if (ticket.proveedor) {
            const provTicket = proveedores.find(p => p.id === ticket.proveedor);
            if (provTicket) {
              ticketRfc = provTicket.rfc || ticketRfc;
              ticketRazon = provTicket.razon_social || ticketRazon;
            }
          }

          return { 
            ...prev, 
            ticket: value,
            monto: ticket.monto,
            unidad: ticket.unidad || '',
            unidades: ticket.unidades || [],
            detalles_unidades: ticket.detalles_unidades || (ticket.unidades || []).map(uId => ({ unidad: uId, monto: '' })),
            producto: ticket.producto || '',
            taller: ticket.taller || '',
            proveedor: ticket.proveedor || '',
            descripcion: ticket.descripcion || '',
            fecha: ticket.fecha,
            rfc_emisor: ticketRfc,
            razon_social_emisor: ticketRazon
          };
        });
        return;
      }
    }

    if (name === 'entidad' && value) {
      const [tipo, id] = value.split('_');
      const entidadObj = entidades.find(e => e.tipo === tipo && e.id === parseInt(id));
      if (entidadObj) {
        setFormData(prev => ({
          ...prev,
          taller: tipo === 'taller' ? id : '',
          proveedor: tipo === 'proveedor' ? id : '',
          rfc_emisor: entidadObj.rfc || prev.rfc_emisor || '',
          razon_social_emisor: entidadObj.razon_social || prev.razon_social_emisor || ''
        }));
        return;
      }
    } else if (name === 'entidad' && !value) {
      setFormData(prev => ({ ...prev, taller: '', proveedor: '' }));
      return;
    }

    if (name === 'categoria') {
      setFormData(prev => ({ ...prev, categoria: value }));
      return;
    }

    if (name === 'unidad' && value) {
      const uId = parseInt(value);
      setFormData(prev => {
        if (!prev.unidades.includes(uId)) {
          return { 
            ...prev, 
            unidad: value, 
            unidades: [...prev.unidades, uId],
            detalles_unidades: [...prev.detalles_unidades, { unidad: uId, monto: '' }]
          };
        }
        return { ...prev, unidad: value };
      });
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({ ...prev, archivo_escaneado: e.target.files[0] }));
  };

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/scan');
      if (!response.ok) throw new Error('Fallo al conectar con el escáner');
      const blob = await response.blob();
      const file = new File([blob], `factura_escaneada_${Date.now()}.pdf`, { type: "application/pdf" });
      setFormData(prev => ({ ...prev, archivo_escaneado: file }));
      setSuccess(false);
    } catch (err) {
      setError('Asegúrate de encender el escáner y que tu perfil se llame "Brother" en NAPS2.');
    } finally {
      setScanning(false);
    }
  };

  const handleDetalleChange = (unidadId, monto) => {
    setFormData(prev => ({
      ...prev,
      detalles_unidades: prev.detalles_unidades.map(d => 
        d.unidad === unidadId ? { ...d, monto } : d
      )
    }));
  };

  const handleAgregarIVA = () => {
    const nuevoEstado = !ivaIncluido;
    setIvaIncluido(nuevoEstado);
    setFormData(prev => ({
      ...prev,
      detalles_unidades: prev.detalles_unidades.map(d => ({
        ...d,
        monto: d.monto ? (nuevoEstado ? (parseFloat(d.monto) * 1.16) : (parseFloat(d.monto) / 1.16)).toFixed(2) : ''
      }))
    }));
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
    data.append('descripcion', formData.descripcion);
    if (formData.taller) data.append('taller', formData.taller);
    if (formData.proveedor) data.append('proveedor', formData.proveedor);
    if (formData.unidad) data.append('unidad', formData.unidad);
    formData.unidades.forEach(uId => data.append('unidades', uId));
    if (formData.categoria) data.append('categoria', formData.categoria);
    if (formData.ticket) data.append('ticket', formData.ticket);
    if (formData.rfc_emisor) data.append('rfc_emisor', formData.rfc_emisor);
    if (formData.razon_social_emisor) data.append('razon_social_emisor', formData.razon_social_emisor);
    if (formData.archivo_escaneado) data.append('archivo_escaneado', formData.archivo_escaneado);

    // Enviar detalles de unidades como JSON string si el backend lo soporta o desglosado
    if (formData.unidades.length > 1) {
      const totalDetalles = formData.detalles_unidades.reduce((acc, d) => acc + parseFloat(d.monto || 0), 0);
      if (Math.abs(totalDetalles - parseFloat(formData.monto)) > 0.01) {
        setError(`La suma de los montos por unidad ($${totalDetalles.toFixed(2)}) debe ser igual al monto total ($${parseFloat(formData.monto).toFixed(2)})`);
        setLoading(false);
        return;
      }
      data.append('detalles_unidades', JSON.stringify(formData.detalles_unidades));
    }

    try {
      await api.post('facturas/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
      setFormData({ fecha: '', monto: '', folio: '', unidad: '', producto: '', ticket: '', taller: '', proveedor: '', descripcion: '', archivo_escaneado: null, rfc_emisor: '', razon_social_emisor: '', categoria: 'Otro', unidades: [], detalles_unidades: [] });
      setBusquedaTicket('');
      setBusquedaUnidad('');
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : "Error al guardar la factura");
    } finally {
      setLoading(false);
    }
  };

  const ticketsFiltrados = ticketsPendientes.filter(t => {
    const folio = (t.folio_interno || '').toLowerCase();
    const desc = (t.descripcion || '').toLowerCase();
    const search = busquedaTicket.toLowerCase();
    return folio.includes(search) || desc.includes(search);
  });

  const vehiculosFiltrados = vehiculos.filter(v => 
    v.numero_economico.toLowerCase().includes(busquedaUnidad.toLowerCase()) ||
    v.placas?.toLowerCase().includes(busquedaUnidad.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600/10 p-3 rounded-2xl">
            <FilePlus className="text-blue-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Registro de Factura</h1>
            <p className="text-slate-400 text-sm">Completa los datos para registrar el nuevo documento.</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-8 shadow-xl">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-4">
              <label className="block text-xs font-bold text-amber-500 mb-2 flex items-center gap-2 uppercase tracking-wider">
                <TicketIcon size={14} /> ¿Relacionar con un Ticket? (Opcional)
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-amber-500/40" size={12} />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar folio o descripción..."
                    value={busquedaTicket}
                    onChange={(e) => setBusquedaTicket(e.target.value)}
                    className="w-full bg-slate-950/50 border border-amber-500/20 rounded-lg pl-8 pr-4 py-3 text-[10px] text-white placeholder:text-amber-500/30 focus:border-amber-500/50 outline-none transition-all"
                  />
                </div>

                <select
                  name="ticket"
                  value={formData.ticket}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-amber-500/30 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none transition-all appearance-none text-sm"
                >
                  <option value="">
                    {busquedaTicket 
                      ? `Resultados (${ticketsFiltrados.length})` 
                      : ticketsPendientes.length > 0 
                        ? `Seleccionar Ticket (${ticketsPendientes.length} pendientes)` 
                        : 'No hay tickets pendientes'}
                  </option>
                  {ticketsFiltrados.map(t => (
                    <option key={t.id} value={t.id}>{t.folio_interno} - {t.descripcion || 'Sin descripción'} (${t.monto})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Hash size={14} /> Folio de Factura
                </label>
                <input
                  required
                  type="text"
                  name="folio"
                  value={formData.folio}
                  onChange={handleChange}
                  placeholder="Ej. F-99283"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Store size={14} /> Taller / Proveedor
                </label>
                <select
                  required
                  name="entidad"
                  value={formData.taller ? `taller_${formData.taller}` : formData.proveedor ? `proveedor_${formData.proveedor}` : ''}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="">Seleccionar...</option>
                  {entidades.map(e => (
                    <option key={`${e.tipo}_${e.id}`} value={`${e.tipo}_${e.id}`}>
                      {e.nombre} ({e.tipo === 'taller' ? 'Taller' : 'Proveedor'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Hash size={14} /> RFC Emisor
                </label>
                <input
                  type="text"
                  name="rfc_emisor"
                  value={formData.rfc_emisor}
                  onChange={handleChange}
                  placeholder="Ej. ABC123456T1"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Store size={14} /> Razón Social Emisor
                </label>
                <input
                  type="text"
                  name="razon_social_emisor"
                  value={formData.razon_social_emisor}
                  onChange={handleChange}
                  placeholder="Nombre de la empresa"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Info size={14} /> Descripción Breve
                </label>
                <input
                  required
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Ej. Compra de llantas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Fecha de Emisión
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
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <DollarSign size={14} /> Monto Total
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
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Truck size={14} /> Unidad(es)
                </label>
                <div className="relative mb-2">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                    <Search className="text-slate-500/40" size={12} />
                  </div>
                  <input
                    type="text"
                    placeholder="Eco o placas..."
                    value={busquedaUnidad}
                    onChange={(e) => setBusquedaUnidad(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-lg pl-8 pr-4 py-1.5 text-[10px] text-white placeholder:text-slate-700 focus:border-blue-500/50 outline-none transition-all"
                  />
                </div>
                <select
                  name="unidad"
                  value={formData.unidad}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all appearance-none text-sm"
                >
                  <option value="">Seleccionar...</option>
                  {vehiculosFiltrados.map(v => (
                    <option key={v.id} value={v.id}>{v.numero_economico}</option>
                  ))}
                </select>
                {formData.unidades.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {formData.unidades.map(uId => {
                      const v = vehiculos.find(veh => veh.id === uId);
                      return v ? (
                        <div key={uId} className="flex items-center gap-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full text-[9px] font-black">
                          {v.numero_economico}
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, unidades: prev.unidades.filter(id => id !== uId), detalles_unidades: prev.detalles_unidades.filter(d => d.unidad !== uId) }))}>✕</button>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                  <Tag size={14} /> Categoría
                </label>
                <select
                  required
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-all appearance-none"
                >
                  <option value="Otro">Seleccionar...</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Mantenimiento y Refacciones">Mantenimiento y Refacciones</option>
                  <option value="Llantas">Llantas</option>
                  <option value="Operativo">Operativo</option>
                  <option value="Combustible">Combustible</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            {formData.unidades.length > 1 && (
              <div className="mt-2 space-y-6 bg-slate-950/50 p-6 rounded-3xl border border-amber-500/20 animate-in slide-in-from-top-2 duration-300 w-full">
                <div className="flex flex-wrap items-center justify-between border-b border-amber-500/10 pb-4 gap-4">
                  <div className="flex items-center gap-4">
                    <p className="text-[12px] text-amber-500 font-black italic flex items-center gap-2 uppercase tracking-widest">
                      <Info size={16} /> Desglose de Gastos por Unidad
                    </p>
                    <button
                      type="button"
                      onClick={handleAgregarIVA}
                      className={`${ivaIncluido ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'} text-[10px] font-black px-3 py-1 rounded-lg transition-all active:scale-95 shadow-lg shadow-amber-900/20 flex items-center gap-2`}
                    >
                      <div className={`w-3 h-3 rounded-full border-2 border-slate-950 flex items-center justify-center ${ivaIncluido ? 'bg-slate-950' : 'bg-transparent'}`}>
                        {ivaIncluido && <div className="w-1 h-1 bg-emerald-500 rounded-full" />}
                      </div>
                      {ivaIncluido ? 'IVA APLICADO (16%)' : 'AGREGAR IVA (16%)'}
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Suma Total:</span>
                    <span className={`text-sm font-black px-4 py-1.5 rounded-full ${
                      Math.abs(formData.detalles_unidades.reduce((acc, d) => acc + parseFloat(d.monto || 0), 0) - parseFloat(formData.monto || 0)) < 0.01
                      ? 'text-emerald-400 bg-emerald-400/10'
                      : 'text-rose-400 bg-rose-400/10'
                    }`}>
                      ${formData.detalles_unidades.reduce((acc, d) => acc + parseFloat(d.monto || 0), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col gap-4">
                  {formData.detalles_unidades.map((detalle) => {
                    const v = vehiculos.find(veh => veh.id === detalle.unidad);
                    return v ? (
                      <div key={detalle.unidad} className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 hover:border-amber-500/30 transition-all">
                        <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 shrink-0 min-w-[80px] text-center">
                          <span className="text-xs font-black text-white">{v.numero_economico}</span>
                        </div>
                        <div className="relative flex-grow">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={detalle.monto}
                            onChange={(e) => handleDetalleChange(detalle.unidad, e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white focus:border-blue-500 outline-none transition-all font-mono"
                          />
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>
            )}
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-dashed border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-blue-500 transition-colors relative min-h-[250px]">
            <input
              type="file"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-1/2 opacity-0 cursor-pointer z-10"
              accept="image/*,.pdf"
            />
            
            <div className="bg-blue-600/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Upload className="text-blue-500" size={24} />
            </div>
            
            {formData.archivo_escaneado ? (
              <div className="space-y-2 relative z-20">
                <p className="text-emerald-400 text-xs font-medium">Archivo listo:</p>
                <p className="text-slate-300 text-[10px] italic bg-slate-800 px-3 py-1.5 rounded-lg truncate max-w-[200px]">{formData.archivo_escaneado.name}</p>
                <button 
                  type="button" 
                  onClick={() => setFormData(prev => ({...prev, archivo_escaneado: null}))}
                  className="text-rose-400 text-[10px] font-bold hover:underline"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="space-y-3 relative z-20 w-full px-4">
                <p className="text-white font-semibold text-base">Adjuntar PDF o Imagen</p>
                <div className="relative flex items-center py-1">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink-0 mx-3 text-slate-600 text-[10px] font-bold">O</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                </div>

                <button
                  type="button"
                  onClick={handleScan}
                  disabled={scanning}
                  className="w-full py-2.5 bg-slate-800 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  {scanning ? <Spinner /> : <FilePlus size={16} />}
                  <span>{scanning ? 'Escaneando...' : 'Escanear Ahora'}</span>
                </button>
              </div>
            )}
          </div>

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-xl p-3 flex items-center gap-3 text-emerald-400">
              <CheckCircle size={18} />
              <span className="font-semibold text-xs">¡Factura registrada con éxito!</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 rounded-xl p-3 flex items-center gap-3 text-rose-400">
              <AlertCircle size={18} />
              <span className="font-semibold text-xs truncate">{error}</span>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? <Spinner /> : <FilePlus size={20} />}
            <span>{loading ? 'REGISTRANDO...' : 'REGISTRAR FACTURA'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AltaFactura;
