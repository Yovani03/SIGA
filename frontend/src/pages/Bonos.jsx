import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Award, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import api from '../services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const Bonos = () => {
  const [operadores, setOperadores] = useState([]);
  const [viajes, setViajes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [configBonos, setConfigBonos] = useState([]);
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isSancionModalOpen, setIsSancionModalOpen] = useState(false);
  const [selectedViajeForSancion, setSelectedViajeForSancion] = useState(null);
  const [isJustifyModalOpen, setIsJustifyModalOpen] = useState(false);
  const [justification, setJustification] = useState('');
  const [submittingSancion, setSubmittingSancion] = useState(false);
  
  const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    
    // Ajustar para que el da sea relativo al viernes (5)
    // Si es viernes, diff es 0. Si es jueves (4), diff es 6.
    const diffToFriday = (day + 2) % 7;
    
    const start = new Date(d);
    start.setDate(d.getDate() - diffToFriday);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
  };

  const [referenceDate, setReferenceDate] = useState(new Date());
  const period = getWeekRange(referenceDate);
  
  const startDate = period.start.toISOString().split('T')[0];
  const endDate = period.end.toISOString().split('T')[0];

  const handlePrevWeek = () => {
    const newDate = new Date(referenceDate);
    newDate.setDate(referenceDate.getDate() - 7);
    setReferenceDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(referenceDate);
    newDate.setDate(referenceDate.getDate() + 7);
    setReferenceDate(newDate);
  };
  const [selectedOpForDetails, setSelectedOpForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resOps, resViajes, resVehiculos, resConfig] = await Promise.all([
          api.get('operadores/'),
          api.get('viajes/'),
          api.get('vehiculos/'),
          api.get('configuracion-bonos/')
        ]);
        setOperadores(resOps.data);
        setViajes(resViajes.data);
        setVehiculos(resVehiculos.data);
        setConfigBonos(resConfig.data);
      } catch (err) {
        console.error("Error fetching data for bonuses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper to get base bonus from config
  const getBaseBono = (capacidad) => {
    // Buscar la configuración que más se acerque o sea exacta
    // En el backend guardamos capacidades específicas: 0.0, 1.5, 3.5, 5.0, 8.0, 10.0, 30.0
    const capNum = parseFloat(capacidad);
    const config = configBonos.find(c => parseFloat(c.capacidad) === capNum);
    
    if (config) return parseFloat(config.monto_base);
    
    // Fallback por si no hay coincidencia exacta (lógica previa simplificada)
    if (capNum <= 1.5) return 20;
    if (capNum <= 3.5) return 35;
    if (capNum <= 5.0) return 60;
    if (capNum <= 8.0) return 85;
    if (capNum <= 10.0) return 120;
    return 200;
  };

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [editingConfigs, setEditingConfigs] = useState([]);

  const openConfigModal = () => {
    setEditingConfigs([...configBonos].sort((a, b) => a.capacidad - b.capacidad));
    setIsConfigModalOpen(true);
  };

  const handleUpdateConfigs = async () => {
    try {
      await Promise.all(editingConfigs.map(c => 
        api.patch(`configuracion-bonos/${c.id}/`, { monto_base: c.monto_base })
      ));
      const res = await api.get('configuracion-bonos/');
      setConfigBonos(res.data);
      setIsConfigModalOpen(false);
      alert("Tabulador de bonos actualizado correctamente.");
    } catch (err) {
      console.error("Error updating configs", err);
      alert("Error al actualizar el tabulador.");
    }
  };

  const getStatsForOperador = (opId) => {
    const asMainDriver = viajes.filter(v => {
      if (v.operador !== opId || !v.completado || !v.fecha_llegada) return false;
      if (v.destino && v.destino === 'Transporte de Personal') return false;
      const vehiculo = vehiculos.find(veh => veh.id === v.vehiculo);
      if (vehiculo?.capacidad === 0.0 || vehiculo?.capacidad === "0.0") return false;
      const completionDate = new Date(v.fecha_llegada);
      return completionDate >= period.start && completionDate <= period.end;
    });

    const asHelper = viajes.filter(v => {
      if (v.ayudante !== opId || !v.completado || !v.fecha_llegada) return false;
      if (v.destino && v.destino === 'Transporte de Personal') return false;
      const vehiculo = vehiculos.find(veh => veh.id === v.vehiculo);
      if (vehiculo?.capacidad === 0.0 || vehiculo?.capacidad === "0.0") return false;
      const completionDate = new Date(v.fecha_llegada);
      return completionDate >= period.start && completionDate <= period.end;
    });
    
    let totalBonoTeorico = 0;
    let totalBonoReal = 0;
    
    // Calcular bonos como chofer principal
    asMainDriver.forEach(viaje => {
      const vehiculo = vehiculos.find(v => v.id === viaje.vehiculo);
      const capacidad = vehiculo ? parseFloat(vehiculo.capacidad) : 10.0;
      const baseBono = getBaseBono(capacidad);

      const montoBase = viaje.ayudante ? baseBono * 0.7 : baseBono;
      totalBonoTeorico += montoBase;
      
      if (!viaje.bono_sancionado) {
        totalBonoReal += montoBase;
      }
    });

    // Calcular bonos como ayudante
    asHelper.forEach(viaje => {
      const vehiculo = vehiculos.find(v => v.id === viaje.vehiculo);
      const capacidad = vehiculo ? parseFloat(vehiculo.capacidad) : 10.0;
      const baseBono = getBaseBono(capacidad);

      const montoBase = baseBono * 0.3;
      totalBonoTeorico += montoBase;

      if (!viaje.bono_sancionado) {
        totalBonoReal += montoBase;
      }
    });

    return {
      viajesCompletados: asMainDriver.length + asHelper.length,
      bonoSugerido: totalBonoTeorico,
      bonoReal: totalBonoReal,
      viajes: [
        ...asMainDriver.map(v => ({ ...v, role: 'Chofer' })),
        ...asHelper.map(v => ({ ...v, role: 'Ayudante' }))
      ]
    };
  };

  // Function to calculate theoretical trip bonus (without sanction check)
  const calculateTheoreticalTripBonus = (viaje, role) => {
    if (viaje.destino && viaje.destino === 'Transporte de Personal') return 0;
    const vehiculo = vehiculos.find(v => v.id === viaje.vehiculo);
    const capacidad = vehiculo ? parseFloat(vehiculo.capacidad) : 10.0;
    const baseBono = getBaseBono(capacidad);

    if (role === 'Chofer') {
      return viaje.ayudante ? baseBono * 0.7 : baseBono;
    }
    return baseBono * 0.3;
  };

  // Helper function to calculate single trip bonus
  const calculateTripBonus = (viaje, role) => {
    if (viaje.destino && viaje.destino === 'Transporte de Personal') return 0;
    const vehiculo = vehiculos.find(v => v.id === viaje.vehiculo);
    const capacidad = vehiculo ? parseFloat(vehiculo.capacidad) : 10.0;
    const baseBono = getBaseBono(capacidad);

    if (viaje.bono_sancionado) return 0;

    if (role === 'Chofer') {
      return viaje.ayudante ? baseBono * 0.7 : baseBono;
    }
    return baseBono * 0.3;
  };

  const handleApplySancion = async () => {
    if (!selectedViajeForSancion || !justification) return;
    setSubmittingSancion(true);
    try {
      await api.patch(`viajes/${selectedViajeForSancion.id}/`, {
        bono_sancionado: true,
        justificacion_sancion: justification
      });
      // Refresh voyages
      const res = await api.get('viajes/');
      setViajes(res.data);
      setIsJustifyModalOpen(false);
      setJustification('');
      setSelectedViajeForSancion(null);
    } catch (err) {
      console.error("Error applying sancion", err);
    } finally {
      setSubmittingSancion(false);
    }
  };

  const handleRemoveSancion = async (viajeId) => {
    try {
      await api.patch(`viajes/${viajeId}/`, {
        bono_sancionado: false,
        justificacion_sancion: ''
      });
      const res = await api.get('viajes/');
      setViajes(res.data);
    } catch (err) {
      console.error("Error removing sancion", err);
    }
  };

  const openDetails = (op) => {
    setSelectedOpForDetails(op);
    setIsDetailsModalOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedOpForDetails(null);
  };

  const exportToCSV = () => {
    const totalReal = filteredOperadores.reduce((sum, op) => sum + getStatsForOperador(op.id).bonoReal, 0);
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const dateRange = `${period.start.toLocaleDateString('es-MX', options)} AL ${period.end.toLocaleDateString('es-MX', options)}`.toUpperCase();
    
    const getWeekNumber = (d) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };
    const semNum = getWeekNumber(period.start);

    const sortedOps = [...filteredOperadores].sort((a, b) => 
      (`${a.nombre} ${a.apellido}`).localeCompare(`${b.nombre} ${b.apellido}`)
    );

    // Generar HTML que Excel interpreta como hoja de cálculo con formato
    let excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Nómina de Bonos</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          .header-main { background-color: #B43232; color: white; font-weight: bold; font-size: 16pt; text-align: center; border: 1pt solid #702020; }
          .header-sub { background-color: #C85050; color: white; font-weight: bold; font-size: 12pt; text-align: center; border: 1pt solid #702020; }
          .header-cols { background-color: #8C2828; color: white; font-weight: bold; text-align: center; border: 1pt solid #501010; }
          .cell-name { text-align: left; border: 0.5pt solid #CCCCCC; padding: 5pt; font-family: Calibri, sans-serif; }
          .cell-amount { 
            text-align: right; 
            border: 0.5pt solid #CCCCCC; 
            font-family: Calibri, sans-serif; 
            mso-number-format: "\\$#,##0.00"; 
          }
          .row-even { background-color: #FFFFFF; }
          .row-odd { background-color: #FFF0F0; }
          .footer { background-color: #8C2828; color: white; font-weight: bold; font-size: 14pt; border: 1pt solid #501010; }
        </style>
      </head>
      <body>
        <table>
          <tr><th colspan="2" class="header-main">BONOS</th></tr>
          <tr><th colspan="2" class="header-sub">SEM ${semNum} (${dateRange})</th></tr>
          <tr>
            <th class="header-cols" style="width: 300px;">NOMBRE</th>
            <th class="header-cols" style="width: 120px;">IMPORTE</th>
          </tr>
    `;

    sortedOps.forEach((op, index) => {
      const stats = getStatsForOperador(op.id);
      const rowClass = index % 2 === 0 ? 'row-even' : 'row-odd';
      excelHtml += `
        <tr class="${rowClass}">
          <td class="cell-name">${(op.nombre + ' ' + op.apellido).toUpperCase()}</td>
          <td class="cell-amount">${stats.bonoReal.toFixed(2)}</td>
        </tr>
      `;
    });

    excelHtml += `
          <tr>
            <th class="footer">TOTALES</th>
            <th class="footer" style="text-align: right; mso-number-format: '\\$#,##0.00';">${totalReal.toFixed(2)}</th>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', excelHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nomina_Bonos_Sem${semNum}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("REPORTE DE BONOS POR DESEMPEÑO", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("SIGA - Sistema de Gestión de Autotransporte", pageWidth / 2, 28, { align: 'center' });
    doc.text(`Periodo: ${period.start.toLocaleDateString()} al ${period.end.toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 40, pageWidth - 20, 40);

    let currentY = 50;

    // Summary Stats
    const totalDispersar = filteredOperadores.reduce((sum, op) => sum + getStatsForOperador(op.id).bonoReal, 0);
    const totalSugerido = filteredOperadores.reduce((sum, op) => sum + getStatsForOperador(op.id).bonoSugerido, 0);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.text(`Total Sugerido: $${totalSugerido.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, currentY);
    doc.text(`Total Real: $${totalDispersar.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, currentY + 7);
    doc.text(`Operadores: ${filteredOperadores.length}`, pageWidth - 20, currentY, { align: 'right' });
    
    currentY += 22;

    // Table of Totals
    const tableData = filteredOperadores.map(op => {
      const stats = getStatsForOperador(op.id);
      return [
        op.id,
        `${op.nombre} ${op.apellido}`,
        stats.viajesCompletados,
        `$${stats.bonoSugerido.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${stats.bonoReal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['ID', 'Operador', 'Viajes', 'Bono Sugerido', 'Bono Real']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
      margin: { top: 40 },
    });

    currentY = doc.lastAutoTable.finalY + 20;

    // Detailed Section
    doc.setFontSize(16);
    doc.text("DESGLOSE DETALLADO POR OPERADOR", 20, currentY);
    currentY += 10;

    filteredOperadores.forEach((op, index) => {
      const stats = getStatsForOperador(op.id);
      if (stats.viajes.length === 0) return;

      // Check for page break
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text(`${op.nombre} ${op.apellido} (ID: ${op.id})`, 20, currentY);
      currentY += 5;

      const detailData = stats.viajes.map(v => [
        new Date(v.fecha_llegada).toLocaleDateString(),
        v.vehiculo_detalle?.numero_economico,
        v.destino || (v.tienda ? `Tienda ${v.tienda}` : 'Salida Especial'),
        v.role,
        `$${calculateTripBonus(v, v.role).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Fecha', 'Unidad', 'Destino', 'Rol', 'Monto']],
        body: detailData,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105] },
        margin: { left: 25 },
        styles: { fontSize: 9 }
      });

      currentY = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`Reporte_Bonos_${startDate}_al_${endDate}.pdf`);
  };

  const filteredOperadores = operadores.filter(op => 
    op.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin text-blue-500 mb-4">
          <Award size={48} />
        </div>
        <p className="text-slate-400">Preparando cálculos de bonos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Award className="text-yellow-500" size={28} />
            Cálculo de Bonos
          </h2>
          <p className="text-slate-400 text-sm mt-1">Gestiona y calcula los incentivos por desempeño de los operadores.</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-col items-start w-full md:w-auto">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Semana Operativa (Vie - Jue)</span>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl shadow-inner">
              <button 
                onClick={handlePrevWeek}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                title="Semana Anterior"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="px-4 py-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center gap-3">
                <Calendar size={16} className="text-blue-500" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-bold uppercase leading-none mb-1">Periodo Actual</span>
                  <span className="text-white text-xs font-black tracking-tight">
                    {period.start.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} - {period.end.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>

              <button 
                onClick={handleNextWeek}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                title="Semana Siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full justify-end">
            <button 
              onClick={() => setIsSancionModalOpen(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-rose-500 px-6 py-3 rounded-2xl transition-all border border-slate-700 text-sm font-black tracking-tight hover:scale-[1.02] active:scale-[0.98]"
            >
              <AlertTriangle size={18} />
              AJUSTE (SANCIÓN)
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-3 rounded-2xl transition-all shadow-xl shadow-blue-900/40 text-sm font-black tracking-tight hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download size={18} />
              DESCARGAR NÓMINA
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-xl text-blue-500">
              <Users size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Operadores Elegibles</p>
              <h3 className="text-2xl font-bold text-white">{operadores.length}</h3>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Bono Promedio</p>
              <h3 className="text-2xl font-bold text-white">
                ${(filteredOperadores.reduce((sum, op) => sum + getStatsForOperador(op.id).bonoReal, 0) / (filteredOperadores.length || 1)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/10 p-3 rounded-xl text-yellow-500">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Real a Dispersar</p>
              <h3 className="text-2xl font-bold text-white">
                ${filteredOperadores.reduce((sum, op) => sum + getStatsForOperador(op.id).bonoReal, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text"
              placeholder="Buscar operador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-blue-400 px-4 py-2.5 rounded-xl border border-slate-700 transition-all text-xs font-bold shadow-lg"
            >
              <Download size={16} />
              DESCARGAR DETALLES
            </button>
            <button className="p-2.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-700 transition-colors">
              <Filter size={18} />
            </button>
            {user?.rol === 'jefe_logistica' && (
              <button 
                onClick={openConfigModal}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-95 ml-2"
              >
                <DollarSign size={18} />
                CONFIGURAR TABULADOR
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Operador</th>
                <th className="px-6 py-4 font-semibold">Viajes Completados</th>
                <th className="px-6 py-4 font-semibold text-right">Bono Sugerido</th>
                <th className="px-6 py-4 font-semibold text-right">Bono Real</th>
                <th className="px-6 py-4 font-semibold"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredOperadores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-500 italic">
                    No se encontraron operadores para mostrar.
                  </td>
                </tr>
              ) : (
                filteredOperadores.map((op) => {
                  const stats = getStatsForOperador(op.id);
                  return (
                    <tr 
                      key={op.id} 
                      onClick={() => openDetails(op)}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                            {op.nombre.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{op.nombre}</p>
                            <p className="text-xs text-slate-500">ID: {op.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium">{stats.viajesCompletados}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-400 font-bold font-mono text-lg">
                          ${stats.bonoSugerido.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-emerald-400 font-bold font-mono text-lg">
                          ${stats.bonoReal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <ChevronRight size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Modal Detalles Justificados */}
      {isDetailsModalOpen && selectedOpForDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold text-xl uppercase">
                  {selectedOpForDetails.nombre[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Justificación de Bonos</h2>
                  <p className="text-slate-400 text-sm">{selectedOpForDetails.nombre} {selectedOpForDetails.apellido} • {period.start.toLocaleDateString()} a {period.end.toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={closeDetails} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-x-auto overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3">Tienda</th>
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {getStatsForOperador(selectedOpForDetails.id).viajes.map((v, idx) => (
                    <tr key={idx} className="text-sm text-slate-300">
                      <td className="px-4 py-4">{v.fecha_llegada ? new Date(v.fecha_llegada).toLocaleDateString() : 'N/A'}</td>
                      <td className="px-4 py-4">{v.vehiculo_detalle?.numero_economico}</td>
                      <td className="px-4 py-4">{v.destino || (v.tienda ? `Tienda ${v.tienda}` : 'Salida Especial')}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${v.role === 'Chofer' ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                          {v.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-bold text-white">
                        ${calculateTripBonus(v, v.role).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {getStatsForOperador(selectedOpForDetails.id).viajes.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-10 text-center text-slate-500 italic">No hay viajes registrados en este periodo.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950/50 flex justify-between items-center">
              <div className="flex flex-col">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Sugerido</p>
                <p className="text-lg font-bold text-slate-400">${getStatsForOperador(selectedOpForDetails.id).bonoSugerido.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm font-medium">Total Real a Pagar</p>
                <h4 className="text-3xl font-black text-emerald-400">
                  ${getStatsForOperador(selectedOpForDetails.id).bonoReal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h4>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal Ajuste (Sanción) */}
      {isSancionModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div>
                <h2 className="text-3xl font-black text-white flex items-center gap-3">
                  <AlertTriangle className="text-rose-500" size={32} />
                  Panel de Ajuste de Bonos
                </h2>
                <p className="text-slate-400 mt-1 font-medium">Calendario de viajes operativos (Vie - Jue, exc. Dom)</p>
              </div>
              <button 
                onClick={() => setIsSancionModalOpen(false)}
                className="h-12 w-12 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500 transition-all flex items-center justify-center"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-0 bg-slate-950">
              {(() => {
                const dates = [];
                let current = new Date(period.start);
                for (let i = 0; i < 7; i++) {
                  if (current.getDay() !== 0) {
                    dates.push(new Date(current));
                  }
                  current.setDate(current.getDate() + 1);
                }

                // Calcular el máximo de viajes por día de cualquier operador para definir las columnas V
                let maxTrips = 2; // Mínimo 2 columnas V
                filteredOperadores.forEach(op => {
                  dates.forEach(date => {
                    const dateStr = date.toISOString().split('T')[0];
                    const count = viajes.filter(v => {
                      if (!v.completado || !v.fecha_llegada) return false;
                      const arrivalDate = new Date(v.fecha_llegada).toISOString().split('T')[0];
                      return (v.operador === op.id || v.ayudante === op.id) && arrivalDate === dateStr;
                    }).length;
                    if (count > maxTrips) maxTrips = count;
                  });
                });

                return (
                  <table className="w-full border-collapse text-[10px]">
                    <thead className="sticky top-0 z-20 bg-slate-900 shadow-xl">
                      {/* Fila de Fechas */}
                      <tr>
                        <th rowSpan="2" className="sticky left-0 z-30 bg-slate-900 border-r border-b border-slate-700 p-4 text-slate-500 uppercase tracking-widest font-black min-w-[200px] text-left">
                          Nombre del Operador
                        </th>
                        {dates.map((date, idx) => (
                          <th key={idx} colSpan={maxTrips} className="border-r border-b border-slate-700 p-2 text-white bg-slate-900/80">
                            <div className="flex flex-col items-center">
                              <span className="uppercase text-[9px] text-blue-400 font-black">
                                {date.toLocaleDateString('es-MX', { weekday: 'long' })}
                              </span>
                              <span className="text-sm font-bold">
                                {date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                      {/* Fila de V1, V2... */}
                      <tr className="bg-slate-950/50">
                        {dates.map((_, dIdx) => (
                          Array.from({ length: maxTrips }).map((_, vIdx) => (
                            <th key={`${dIdx}-${vIdx}`} className="border-r border-b border-slate-800 p-1 text-[9px] text-slate-600 font-black w-24">
                              V{dIdx * maxTrips + vIdx + 1}
                            </th>
                          ))
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredOperadores.map(op => (
                        <tr key={op.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="sticky left-0 z-10 bg-slate-900 border-r border-slate-800 p-4 font-bold text-white uppercase text-[11px] shadow-lg">
                            {op.nombre} {op.apellido}
                          </td>
                          {dates.map((date, dIdx) => {
                            const dateStr = date.toISOString().split('T')[0];
                            const tripsOfDay = viajes.filter(v => {
                              if (!v.completado || !v.fecha_llegada) return false;
                              const arrivalDate = new Date(v.fecha_llegada).toISOString().split('T')[0];
                              return (v.operador === op.id || v.ayudante === op.id) && arrivalDate === dateStr;
                            });

                            return Array.from({ length: maxTrips }).map((_, vIdx) => {
                              const trip = tripsOfDay[vIdx];
                              if (!trip) return <td key={`${dIdx}-${vIdx}`} className="border-r border-slate-800/30"></td>;

                              const role = trip.operador === op.id ? 'Chofer' : 'Ayudante';
                              const monto = calculateTheoreticalTripBonus(trip, role);

                              return (
                                <td key={`${dIdx}-${vIdx}`} className="border-r border-slate-800 p-0">
                                  <button
                                    onClick={() => {
                                      if (trip.bono_sancionado) {
                                        handleRemoveSancion(trip.id);
                                      } else {
                                        setSelectedViajeForSancion(trip);
                                        setIsJustifyModalOpen(true);
                                      }
                                    }}
                                    className={`w-full h-full p-2 flex flex-col items-center justify-center gap-1 transition-all hover:brightness-125 active:scale-95 ${
                                      trip.bono_sancionado 
                                        ? 'bg-rose-600 text-white font-black' 
                                        : 'bg-blue-600/20 text-blue-400 font-bold hover:bg-blue-600/40'
                                    }`}
                                  >
                                    <span className="text-[9px] opacity-80">U-{trip.vehiculo_detalle?.numero_economico}</span>
                                    <span className="text-xs">${monto}</span>
                                  </button>
                                </td>
                              );
                            });
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal Justificación de Sanción */}
      {isJustifyModalOpen && selectedViajeForSancion && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <AlertTriangle className="text-rose-500" size={24} />
                Justificar Sanción
              </h3>
              <button onClick={() => setIsJustifyModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500">
                  <span>Detalle del Viaje</span>
                  <span className="text-blue-500">#{selectedViajeForSancion.id}</span>
                </div>
                <p className="text-white font-bold">Unidad: {selectedViajeForSancion.vehiculo_detalle?.numero_economico}</p>
                <p className="text-slate-400 text-sm">Destino: {selectedViajeForSancion.destino || (selectedViajeForSancion.tienda ? `Tienda ${selectedViajeForSancion.tienda}` : 'Salida Especial')}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Motivo de la sanción</label>
                <textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Escriba el motivo por el cual se descuenta este bono..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500/50 transition-all h-32 resize-none"
                />
              </div>

              <button
                onClick={handleApplySancion}
                disabled={!justification || submittingSancion}
                className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-rose-900/20 flex items-center justify-center gap-2"
              >
                {submittingSancion ? (
                  <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    APLICAR SANCIÓN
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Configuración de Tabulador */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-2xl font-black text-white flex items-center gap-3">
                <DollarSign className="text-indigo-500" size={28} />
                Configurar Bonos
              </h3>
              <button onClick={() => setIsConfigModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {editingConfigs.map((config, idx) => (
                  <div key={config.id} className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Capacidad</p>
                      <p className="text-white font-bold">
                        {config.capacidad === "0.0" || config.capacidad === 0 
                          ? 'Vehículo Ligero' 
                          : config.capacidad === "30.0" || config.capacidad === 30
                          ? 'Tráiler / Full'
                          : `${config.capacidad} Toneladas`}
                      </p>
                    </div>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                      <input 
                        type="number"
                        value={config.monto_base}
                        onChange={(e) => {
                          const newConfigs = [...editingConfigs];
                          newConfigs[idx].monto_base = e.target.value;
                          setEditingConfigs(newConfigs);
                        }}
                        className="w-32 bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-4 py-3 text-white font-bold focus:ring-2 focus:ring-indigo-500/50 transition-all outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex gap-4">
                <button 
                  onClick={() => setIsConfigModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleUpdateConfigs}
                  className="flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-900/20"
                >
                  GUARDAR CAMBIOS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bonos;
