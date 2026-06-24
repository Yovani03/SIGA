import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { 
  Droplets, 
  Calendar, 
  DollarSign, 
  Plus, 
  Save, 
  Trash2, 
  Truck, 
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Activity,
  History,
  Clock,
  ChevronRight,
  Filter,
  Download
} from 'lucide-react';
import notify from '../utils/notifications';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AuthContext } from '../context/AuthContext';

const Combustibles = () => {
  const { user } = useContext(AuthContext);
  const isLector = user?.rol === 'lector_gastos';

  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [precios, setPrecios] = useState({
    magna: '',
    premium: '',
    diesel: '',
    electrico: '0',
    gas_lp: ''
  });
  const [unidades, setUnidades] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaFocus, setBusquedaFocus] = useState(false);
  const [activeTab, setActiveTab] = useState(isLector ? 'historial' : 'nuevo'); // 'nuevo', 'especial' o 'historial'
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [fechaHistorial, setFechaHistorial] = useState(new Date().toISOString().split('T')[0]);

  // State for Special Load
  const [cargaEspecial, setCargaEspecial] = useState({
    unidad: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_combustible: 'diesel',
    precio_unitario: '',
    litros: '',
    kilometraje: '',
    ignorar_kilometraje: false,
    km_equivocado: false,
    ultimo_kilometraje: 0
  });
  const [cargasEspecialesList, setCargasEspecialesList] = useState([]);
  
  // State for Block Details Modal
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [isEditingBlock, setIsEditingBlock] = useState(false);

  useEffect(() => {
    fetchUnidades();
    fetchPreciosDia(fecha);
  }, [fecha]);

  useEffect(() => {
    if (activeTab === 'historial') {
      fetchHistorial();
    }
  }, [activeTab, fechaHistorial]);

  const fetchHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const res = await api.get(`bloques/por_dia/?fecha=${fechaHistorial}`);
      setHistorial(res.data);
    } catch (err) {
      console.error("Error fetching history", err);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const exportHistorialToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.setFont('helvetica', 'bold');
    doc.text("REPORTE DE CARGA DE COMBUSTIBLES", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text("SIGA - Sistema de Gestión de Autotransporte", pageWidth / 2, 27, { align: 'center' });
    doc.text(`Fecha del Reporte: ${fechaHistorial}`, pageWidth / 2, 33, { align: 'center' });
    
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.line(15, 38, pageWidth - 15, 38);

    // Extract all individual loads from blocks
    const todasLasCargas = historial.flatMap(b => b.cargas || []);

    // Summary Stats
    const totalLitros = todasLasCargas.reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const totalMonto = todasLasCargas.reduce((acc, curr) => acc + parseFloat(curr.monto_total), 0);
    const totalCargas = todasLasCargas.length;
    
    const dieselL = todasLasCargas.filter(c => c.tipo_combustible === 'diesel').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const magnaL = todasLasCargas.filter(c => c.tipo_combustible === 'magna').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const premiumL = todasLasCargas.filter(c => c.tipo_combustible === 'premium').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const gasLpL = todasLasCargas.filter(c => c.tipo_combustible === 'gas_lp').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);
    const electricoKwh = todasLasCargas.filter(c => c.tipo_combustible === 'electrico').reduce((acc, curr) => acc + parseFloat(curr.litros), 0);

    // Render Stats
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85); // Slate-700
    doc.setFont('helvetica', 'bold');
    doc.text("Resumen de Cargas:", 15, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Total de Cargas: ${totalCargas}`, 15, 51);
    doc.text(`Total Litros/Equiv: ${totalLitros.toFixed(2)} L`, 15, 56);
    doc.text(`Importe Total: $${totalMonto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`, 15, 61);

    doc.text(`Diésel: ${dieselL.toFixed(2)} L`, 110, 51);
    doc.text(`Magna: ${magnaL.toFixed(2)} L`, 110, 56);
    doc.text(`Premium: ${premiumL.toFixed(2)} L`, 110, 61);
    let yOffsetRight = 66;
    if (gasLpL > 0) {
      doc.text(`Gas LP: ${gasLpL.toFixed(2)} L`, 110, yOffsetRight);
      yOffsetRight += 5;
    }
    if (electricoKwh > 0) {
      doc.text(`Eléctrico: ${electricoKwh.toFixed(2)} kWh`, 110, yOffsetRight);
      yOffsetRight += 5;
    }
    
    let currentY = Math.max(68, yOffsetRight + 2);

    // Table Data
    const tableData = todasLasCargas.map((carga) => [
      carga.unidad_detalle,
      carga.es_especial ? 'Especial' : 'Normal',
      carga.tipo_combustible.toUpperCase(),
      `${carga.litros} L`,
      `$${parseFloat(carga.precio_unitario).toFixed(2)}`,
      `$${parseFloat(carga.monto_total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      carga.ignorar_kilometraje 
        ? 'No reg.' 
        : (carga.km_equivocado 
            ? `[KM Equiv.] ${parseInt(carga.kilometraje).toLocaleString()} KM` 
            : `${parseInt(carga.kilometraje).toLocaleString()} KM`),
      carga.fecha
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Unidad', 'Tipo', 'Combustible', 'Litros/Cant', 'Precio Unit.', 'Monto Total', 'Kilometraje', 'Fecha/Hora']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
      foot: [[
        'TOTALES',
        '',
        '',
        `${totalLitros.toFixed(2)} L`,
        '',
        `$${totalMonto.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        '',
        ''
      ]],
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      margin: { left: 15, right: 15 }
    });

    doc.save(`Reporte_Combustibles_${fechaHistorial}.pdf`);
  };

  const fetchUnidades = async () => {
    try {
      const [resUnidades, resVariados] = await Promise.all([
        api.get('vehiculos/'),
        api.get('variados/')
      ]);
      const mappedUnidades = resUnidades.data.map(u => ({ ...u, is_variado: false }));
      const mappedVariados = resVariados.data.map(v => ({ 
        ...v, 
        id: v.id, 
        is_variado: true, 
        marca: v.tipo || 'Vehículo Variado' 
      }));
      setUnidades([...mappedUnidades, ...mappedVariados]);
    } catch (err) {
      console.error("Error fetching units", err);
    }
  };

  const fetchPreciosDia = async (date) => {
    try {
      const res = await api.get(`precios-combustible/por_fecha/?fecha=${date}`);
      if (res.data) {
        setPrecios({
          magna: res.data.precio_magna,
          premium: res.data.precio_premium,
          diesel: res.data.precio_diesel,
          electrico: res.data.precio_electrico || '0',
          gas_lp: res.data.precio_gas_lp || ''
        });
      } else {
        setPrecios({ magna: '', premium: '', diesel: '', electrico: '0', gas_lp: '' });
      }
    } catch (err) {
      setPrecios({ magna: '', premium: '', diesel: '', electrico: '0', gas_lp: '' });
    }
  };

  const handleAddUnidad = (unidad) => {
    if (cargas.find(c => c.unidad === unidad.id && c.is_variado === unidad.is_variado)) return;
    
    setCargas([...cargas, {
      unidad: unidad.id,
      is_variado: unidad.is_variado,
      numero_economico: unidad.numero_economico,
      placas: unidad.placas,
      tipo_combustible: unidad.tipo_combustible || 'diesel',
      litros: '',
      kilometraje: unidad.ultimo_kilometraje || '',
      ultimo_kilometraje: unidad.ultimo_kilometraje || 0,
      ignorar_kilometraje: unidad.ignorar_kilometraje || false,
      km_equivocado: false
    }]);
    setBusqueda('');
  };

  const handleRemoveCarga = (index) => {
    const newCargas = [...cargas];
    newCargas.splice(index, 1);
    setCargas(newCargas);
  };

  const updateCarga = (index, field, value) => {
    const newCargas = [...cargas];
    newCargas[index][field] = value;
    setCargas(newCargas);
  };

  const handleSubmit = async () => {
    if (cargas.length === 0) {
      notify.info("Agrega al menos una carga.");
      return;
    }

    const typesUsed = new Set(cargas.map(c => c.tipo_combustible));
    
    if (typesUsed.has('magna') && !precios.magna) {
      notify.info("Ingresa el precio de Gasolina Magna para las cargas registradas.");
      return;
    }
    if (typesUsed.has('premium') && !precios.premium) {
      notify.info("Ingresa el precio de Gasolina Premium para las cargas registradas.");
      return;
    }
    if (typesUsed.has('diesel') && !precios.diesel) {
      notify.info("Ingresa el precio de Diésel para las cargas registradas.");
      return;
    }
    if (typesUsed.has('electrico') && !precios.electrico) {
      notify.info("Ingresa el precio de Eléctrico para las cargas registradas.");
      return;
    }
    if (typesUsed.has('gas_lp') && !precios.gas_lp) {
      notify.info("Ingresa el precio de Gas LP para las cargas registradas.");
      return;
    }

    for (let carga of cargas) {
      if (!carga.litros || (!carga.ignorar_kilometraje && !carga.kilometraje)) {
        notify.error(`Faltan datos en la unidad ${carga.numero_economico}`);
        return;
      }
    }

    setLoading(true);

    try {
      const data = {
        fecha,
        precio_magna: precios.magna || 0,
        precio_premium: precios.premium || 0,
        precio_diesel: precios.diesel || 0,
        precio_electrico: precios.electrico || 0,
        precio_gas_lp: precios.gas_lp || 0,
        cargas: cargas.map(c => ({
          unidad: c.is_variado ? null : c.unidad,
          unidad_variada: c.is_variado ? c.unidad : null,
          tipo_combustible: c.tipo_combustible,
          litros: Number(parseFloat(c.litros).toFixed(2)),
          kilometraje: c.ignorar_kilometraje ? null : parseInt(c.kilometraje),
          ignorar_kilometraje: c.ignorar_kilometraje,
          km_equivocado: c.km_equivocado || false
        }))
      };

      await api.post('cargas-combustible/registro_diario/', data);

      notify.success("Registros guardados correctamente");
      setCargas([]);
      setBusqueda('');
    } catch (err) {
      console.error("Error saving loads", err);
      notify.error("Error al guardar los registros.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEspecialToList = (e) => {
    e.preventDefault();
    if (!cargaEspecial.unidad || !cargaEspecial.precio_unitario || !cargaEspecial.litros || (!cargaEspecial.ignorar_kilometraje && !cargaEspecial.kilometraje)) {
      notify.info("Completa todos los campos requeridos.");
      return;
    }

    const is_variado = cargaEspecial.unidad.startsWith('v-');
    const unidadId = parseInt(cargaEspecial.unidad.split('-')[1]);
    const unidadObj = unidades.find(u => u.id === unidadId && u.is_variado === is_variado);
    if (!unidadObj) return;

    setCargasEspecialesList([...cargasEspecialesList, {
      ...cargaEspecial,
      unidad: unidadId,
      is_variado: is_variado,
      numero_economico: unidadObj.numero_economico,
      placas: unidadObj.placas
    }]);

    setCargaEspecial(prev => ({
      ...prev,
      unidad: '',
      litros: '',
      kilometraje: '',
      ignorar_kilometraje: false,
      km_equivocado: false,
      ultimo_kilometraje: 0
    }));
  };

  const handleRemoveEspecial = (index) => {
    const newList = [...cargasEspecialesList];
    newList.splice(index, 1);
    setCargasEspecialesList(newList);
  };

  const handleSubmitEspecial = async () => {
    if (cargasEspecialesList.length === 0) {
      notify.info("Agrega cargas a la lista.");
      return;
    }

    setLoading(true);
    try {
      const promises = cargasEspecialesList.map(carga => {
        const mappedEspecial = {
          unidad: carga.is_variado ? null : parseInt(carga.unidad),
          unidad_variada: carga.is_variado ? parseInt(carga.unidad) : null,
          fecha: carga.fecha,
          tipo_combustible: carga.tipo_combustible,
          precio_unitario: parseFloat(carga.precio_unitario),
          litros: Number(parseFloat(carga.litros).toFixed(2)),
          kilometraje: carga.ignorar_kilometraje ? null : parseInt(carga.kilometraje),
          ignorar_kilometraje: carga.ignorar_kilometraje,
          es_especial: true,
          km_equivocado: carga.km_equivocado || false
        };
        return api.post('cargas-combustible/', mappedEspecial);
      });
      
      await Promise.all(promises);
      
      notify.success("Cargas especiales guardadas");
      setCargasEspecialesList([]);
    } catch(err) {
      console.error("Error saving special loads", err);
      notify.error("Error al guardar las cargas especiales.");
    } finally {
      setLoading(false);
    }
  };

  const filteredUnidades = unidades.filter(u => 
    u.numero_economico.toLowerCase().includes(busqueda.toLowerCase()) || 
    u.placas?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex bg-white dark:bg-slate-950/80 p-1.5 rounded-full border border-slate-200 dark:border-slate-800/80 w-max mb-2 backdrop-blur-xl shadow-sm dark:shadow-inner">
        {!isLector && (
          <button 
            onClick={() => setActiveTab('nuevo')}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
              activeTab === 'nuevo' 
                ? 'text-white shadow-lg shadow-blue-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            {activeTab === 'nuevo' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Plus size={18} /> Nuevo Registro
            </span>
          </button>
        )}
        {!isLector && (
          <button 
            onClick={() => { setActiveTab('especial'); }}
            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
              activeTab === 'especial' 
                ? 'text-white shadow-lg shadow-amber-900/20' 
                : 'text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            {activeTab === 'especial' && (
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-amber-500 rounded-full" />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <AlertCircle size={18} /> Carga Especial
            </span>
          </button>
        )}
        <button 
          onClick={() => { setActiveTab('historial'); }}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'historial' 
              ? 'text-white shadow-lg shadow-blue-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'historial' && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <History size={18} /> Historial de Cargas
          </span>
        </button>
      </div>

      {activeTab === 'nuevo' ? (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Droplets className="text-blue-500" size={32} />
                Carga de Combustibles
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Registro diario de suministros por unidad</p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Calendar className="text-blue-500 dark:text-blue-400 ml-2" size={20} />
              <input 
                type="date" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-2 font-medium outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[
              { id: 'magna', label: 'Magna', color: 'bg-green-500/10 border-green-500/20 text-green-500' },
              { id: 'premium', label: 'Premium', color: 'bg-red-500/10 border-red-500/20 text-red-500' },
              { id: 'diesel', label: 'Diesel', color: 'bg-slate-700/20 border-slate-700/30 text-slate-400' },
              { id: 'gas_lp', label: 'Gas LP', color: 'bg-orange-500/10 border-orange-500/20 text-orange-500' }
            ].map(fuel => (
              <div key={fuel.id} className={`${fuel.color} border rounded-2xl p-5 flex flex-col gap-3 group transition-all hover:bg-opacity-20`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm uppercase tracking-wider">{fuel.label}</span>
                  <DollarSign size={18} />
                </div>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={precios[fuel.id]}
                    onChange={(e) => setPrecios({...precios, [fuel.id]: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-xl font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">MXN/L</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl min-h-[400px] flex flex-col shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
              <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input 
                  type="text" 
                  placeholder="Buscar unidad por económico o placa..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onFocus={() => setBusquedaFocus(true)}
                  onBlur={() => setTimeout(() => setBusquedaFocus(false), 200)}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
                
                {(busquedaFocus || busqueda) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-20 max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredUnidades.length > 0 ? (
                      filteredUnidades.map(u => (
                        <button 
                          key={`${u.is_variado ? 'v' : 't'}-${u.id}`}
                          onClick={() => handleAddUnidad(u)}
                          className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-600/10 text-left border-b border-slate-100 dark:border-slate-800 last:border-0 transition-colors group"
                        >
                          <div>
                            <div className="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400">{u.numero_economico}</div>
                            <div className="text-xs text-slate-500">{u.placas ? `${u.placas} - ` : ''}{u.marca}</div>
                          </div>
                          <Plus size={18} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-slate-500 text-center">No se encontraron unidades</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              {cargas.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4">Combustible</th>
                      <th className="px-6 py-4">Litros</th>
                      <th className="px-6 py-4">Kilometraje</th>
                      <th className="px-6 py-4">Monto Est.</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cargas.map((carga, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-500 border border-blue-500/20">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">{carga.numero_economico}</p>
                              <p className="text-xs text-slate-500">{carga.placas}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={carga.tipo_combustible}
                            onChange={(e) => updateCarga(idx, 'tipo_combustible', e.target.value)}
                            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="diesel">Diesel</option>
                            <option value="magna">Magna</option>
                            <option value="premium">Premium</option>
                            <option value="electrico">Eléctrico</option>
                            <option value="gas_lp">Gas LP</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <input 
                              type="number" 
                              value={carga.litros}
                              onChange={(e) => updateCarga(idx, 'litros', e.target.value)}
                              className="w-24 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="0.0"
                            />
                            <span className="ml-2 text-slate-500 text-xs">L</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <input 
                                  type="number" 
                                  step="1"
                                  disabled={carga.ignorar_kilometraje || carga.km_equivocado}
                                  value={carga.kilometraje}
                                  onChange={(e) => updateCarga(idx, 'kilometraje', e.target.value ? parseInt(e.target.value) : '')}
                                  className={`w-32 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white text-sm outline-none focus:ring-1 focus:ring-blue-500 ${carga.ignorar_kilometraje || carga.km_equivocado ? 'opacity-30 cursor-not-allowed' : ''}`}
                                  placeholder="Km actual"
                                />
                                {!carga.ignorar_kilometraje && !carga.km_equivocado && <Activity className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />}
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={carga.ignorar_kilometraje}
                                  disabled={carga.km_equivocado}
                                  onChange={(e) => updateCarga(idx, 'ignorar_kilometraje', e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-offset-slate-900 disabled:opacity-30"
                                />
                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Odm. Dañado</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input 
                                  type="checkbox"
                                  checked={carga.km_equivocado}
                                  disabled={carga.ignorar_kilometraje}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    updateCarga(idx, 'km_equivocado', checked);
                                    if (checked) {
                                      updateCarga(idx, 'kilometraje', carga.ultimo_kilometraje || 0);
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-offset-slate-900 disabled:opacity-30"
                                />
                                <span className="text-[10px] text-amber-500 uppercase font-bold tracking-tighter">KM Equivocado</span>
                              </label>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Km anterior: <strong className="text-slate-700 dark:text-slate-300">{(carga.ultimo_kilometraje || 0).toLocaleString()} KM</strong>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 dark:text-white font-medium">
                            ${(carga.litros * (precios[carga.tipo_combustible] || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleRemoveCarga(idx)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <div className="bg-slate-800/30 p-6 rounded-full mb-4">
                    <Droplets size={48} className="text-slate-700" />
                  </div>
                  <p className="text-lg font-medium">No has agregado ninguna carga</p>
                  <p className="text-sm">Usa el buscador para añadir unidades a este registro</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Total de unidades</span>
                <span className="text-slate-900 dark:text-white text-2xl font-black">{cargas.length}</span>
              </div>

              <div className="flex items-center gap-4">

                <button 
                  onClick={handleSubmit}
                  disabled={loading || cargas.length === 0}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-blue-900/20 hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  Guardar Cargas
                </button>
              </div>
            </div>
          </div>
        </>
      ) : activeTab === 'especial' ? (
        <div className="space-y-6 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-amber-500/20 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <AlertCircle className="text-amber-500" size={32} />
                Carga Especial
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Registra cargas de múltiples días con fechas y costos personalizados.</p>
            </div>
          </div>

          <form onSubmit={handleAddEspecialToList} className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 lg:p-8 space-y-6 backdrop-blur-xl shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Unidad</label>
                <select 
                  required
                  value={cargaEspecial.unidad}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      setCargaEspecial({ ...cargaEspecial, unidad: val, ultimo_kilometraje: 0, kilometraje: '', km_equivocado: false });
                      return;
                    }
                    const is_variado = val.startsWith('v-');
                    const unidadId = parseInt(val.split('-')[1]);
                    const unit = unidades.find(u => u.id === unidadId && u.is_variado === is_variado);
                    setCargaEspecial({
                      ...cargaEspecial,
                      unidad: val,
                      is_variado: unit ? unit.is_variado : false,
                      ultimo_kilometraje: unit ? (unit.ultimo_kilometraje || 0) : 0,
                      kilometraje: unit ? (unit.ultimo_kilometraje || '') : '',
                      km_equivocado: false
                    });
                  }}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="">Seleccionar Unidad...</option>
                  {unidades.map(u => (
                    <option key={`${u.is_variado ? 'v' : 't'}-${u.id}`} value={`${u.is_variado ? 'v' : 't'}-${u.id}`}>
                      {u.numero_economico} {u.placas ? `- ${u.placas}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha Exacta de Carga</label>
                <input 
                  type="date" 
                  required
                  value={cargaEspecial.fecha}
                  onChange={(e) => setCargaEspecial({...cargaEspecial, fecha: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo de Combustible</label>
                <select 
                  value={cargaEspecial.tipo_combustible}
                  onChange={(e) => setCargaEspecial({...cargaEspecial, tipo_combustible: e.target.value})}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                >
                  <option value="diesel">Diesel</option>
                  <option value="magna">Magna</option>
                  <option value="premium">Premium</option>
                  <option value="electrico">Eléctrico</option>
                  <option value="gas_lp">Gas LP</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-amber-400 uppercase tracking-widest">Precio Especial (por Litro)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={cargaEspecial.precio_unitario}
                    onChange={(e) => setCargaEspecial({...cargaEspecial, precio_unitario: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Litros Cargados</label>
                <div className="relative">
                  <input 
                    type="number" 
                    required
                    step="0.01"
                    value={cargaEspecial.litros}
                    onChange={(e) => setCargaEspecial({...cargaEspecial, litros: e.target.value})}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pr-8 pl-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">L</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">Kilometraje (Opcional)</label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Km anterior: <strong className="text-slate-700 dark:text-slate-300">{(cargaEspecial.ultimo_kilometraje || 0).toLocaleString()} KM</strong>
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      step="1"
                      disabled={cargaEspecial.ignorar_kilometraje || cargaEspecial.km_equivocado}
                      value={cargaEspecial.kilometraje}
                      onChange={(e) => setCargaEspecial({...cargaEspecial, kilometraje: e.target.value})}
                      className={`w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl pr-8 pl-4 py-3 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500 ${cargaEspecial.ignorar_kilometraje || cargaEspecial.km_equivocado ? 'opacity-30 cursor-not-allowed' : ''}`}
                      placeholder="Km actual"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">KM</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap bg-white dark:bg-slate-950 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input 
                      type="checkbox"
                      checked={cargaEspecial.ignorar_kilometraje}
                      disabled={cargaEspecial.km_equivocado}
                      onChange={(e) => setCargaEspecial({...cargaEspecial, ignorar_kilometraje: e.target.checked})}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-30"
                    />
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Odm. Dañado</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer select-none whitespace-nowrap bg-white dark:bg-slate-950 px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input 
                      type="checkbox"
                      checked={cargaEspecial.km_equivocado}
                      disabled={cargaEspecial.ignorar_kilometraje}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setCargaEspecial({
                          ...cargaEspecial,
                          km_equivocado: checked,
                          kilometraje: checked ? (cargaEspecial.ultimo_kilometraje || 0) : ''
                        });
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-30"
                    />
                    <span className="text-[10px] text-amber-500 uppercase font-bold tracking-tighter">KM Equivocado</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-end">
              <button 
                type="submit"
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700"
              >
                <Plus size={18} />
                Agregar a la lista
              </button>
            </div>
          </form>

          {cargasEspecialesList.length > 0 && (
            <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/50 text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-6 py-4">Unidad</th>
                      <th className="px-6 py-4">Detalles</th>
                      <th className="px-6 py-4 text-right">Monto Calculado</th>
                      <th className="px-6 py-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cargasEspecialesList.map((carga, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                              <Truck size={20} />
                            </div>
                            <div>
                              <p className="text-white font-bold">{carga.numero_economico}</p>
                              <p className="text-[10px] text-slate-500">{carga.fecha}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-300 font-medium uppercase">{carga.tipo_combustible}</span>
                            <span className="text-xs text-slate-500">{carga.litros}L a ${carga.precio_unitario}/L</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-amber-400 font-black">
                            ${(parseFloat(carga.litros) * parseFloat(carga.precio_unitario)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => handleRemoveEspecial(idx)}
                            className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-500 text-sm">Total a guardar</span>
                  <span className="text-white text-2xl font-bold">{cargasEspecialesList.length}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleSubmitEspecial}
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-xl shadow-amber-900/20 hover:scale-105 active:scale-95"
                  >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Guardar Todas las Cargas
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <History className="text-blue-500" size={32} />
                Historial de Cargas
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Consulta los registros de combustible por fecha</p>
            </div>
            
            <div className="flex items-center gap-4">
              {historial.length > 0 && (
                <button 
                  onClick={exportHistorialToPDF}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-5 py-3 rounded-2xl transition-all shadow-md text-sm font-bold active:scale-95"
                >
                  <Download size={18} />
                  Descargar PDF
                </button>
              )}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                <Filter className="text-blue-500 dark:text-blue-400 ml-2" size={20} />
                <input 
                  type="date" 
                  value={fechaHistorial}
                  onChange={(e) => setFechaHistorial(e.target.value)}
                  className="bg-transparent border-none text-slate-900 dark:text-white focus:ring-0 cursor-pointer p-2 font-medium outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden backdrop-blur-xl shadow-sm">
            {loadingHistorial ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-slate-400 font-medium">Cargando registros...</p>
              </div>
            ) : historial.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                      <th className="px-8 py-5">Bloque ID</th>
                      <th className="px-8 py-5">Hora de Registro</th>
                      <th className="px-8 py-5 text-right">Cant. Cargas</th>
                      <th className="px-8 py-5 text-right">Total Litros</th>
                      <th className="px-8 py-5 text-right">Monto Total</th>
                      <th className="px-8 py-5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {historial.map((bloque, idx) => (
                      <tr key={idx} className="group hover:bg-blue-600/5 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <History size={20} />
                            </div>
                            <div>
                              <p className="text-slate-900 dark:text-white font-bold">Bloque #{bloque.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-slate-900 dark:text-slate-300 font-medium">{new Date(bloque.fecha_registro).toLocaleTimeString()}</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-slate-900 dark:text-slate-300 font-bold">{bloque.cargas?.length || 0} unid.</p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-slate-900 dark:text-slate-300 font-bold font-mono">
                            {parseFloat(bloque.total_litros).toFixed(2)} L
                          </p>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-blue-600 dark:text-blue-400 font-black font-mono text-lg">
                            ${parseFloat(bloque.total_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </p>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button 
                            onClick={() => setSelectedBlock(bloque)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950/30 border-t border-slate-800">
                      <td colSpan="3" className="px-8 py-6 text-slate-500 font-bold text-sm uppercase">Totales del día</td>
                      <td className="px-8 py-6 text-right font-black text-white text-lg">
                        {historial.reduce((acc, curr) => acc + parseFloat(curr.total_litros), 0).toFixed(2)} <span className="text-slate-500 text-xs">L</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-emerald-400 text-2xl">
                        ${historial.reduce((acc, curr) => acc + parseFloat(curr.total_monto), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 text-slate-500">
                <div className="bg-slate-800/30 p-8 rounded-full mb-6">
                  <Calendar size={64} className="text-slate-700" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sin registros para esta fecha</h3>
                <p className="text-slate-500 max-w-xs text-center">No se encontraron cargas de combustible para el día seleccionado.</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Block Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="text-blue-500" />
                  Detalles del Bloque
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  ID: {selectedBlock.id} | Fecha Registro: {new Date(selectedBlock.fecha_registro).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedBlock(null)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Unidades</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedBlock.cargas?.length || 0}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Total Litros</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{parseFloat(selectedBlock.total_litros).toFixed(2)} L</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                  <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Monto Total</p>
                  <p className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono">
                    ${parseFloat(selectedBlock.total_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Unidad</th>
                      <th className="px-4 py-3 font-semibold">Tipo</th>
                      <th className="px-4 py-3 font-semibold text-right">Litros</th>
                      <th className="px-4 py-3 font-semibold text-right">Precio/L</th>
                      <th className="px-4 py-3 font-semibold text-right">Total</th>
                      <th className="px-4 py-3 font-semibold text-right">Kilometraje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {selectedBlock.cargas?.map((carga, i) => (
                      <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                          {carga.unidad_detalle || `Eco ${carga.unidad || carga.unidad_variada}`}
                          {carga.es_especial && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-600 px-2 py-0.5 rounded-full uppercase font-bold">Especial</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 capitalize">{carga.tipo_combustible}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">{parseFloat(carga.litros).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-300">${parseFloat(carga.precio_unitario).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ${parseFloat(carga.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {carga.ignorar_kilometraje ? (
                            <span className="text-slate-400 italic">No reg.</span>
                          ) : (
                            <span className={`font-mono ${carga.km_equivocado ? 'text-amber-500' : 'text-slate-600 dark:text-slate-300'}`}>
                              {carga.kilometraje}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(!selectedBlock.cargas || selectedBlock.cargas.length === 0) && (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                          No hay detalles disponibles para este bloque.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end">
              <button 
                onClick={() => setSelectedBlock(null)}
                className="bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Combustibles;
