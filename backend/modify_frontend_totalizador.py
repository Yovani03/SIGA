import os

file_path = r'C:\Autrotransportes\frontend\src\pages\Combustibles.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
if 'ChevronLeft' not in content:
    content = content.replace('ChevronRight,', 'ChevronRight,\n  ChevronLeft,')

# 2. States
states_code = """
  // States for Totalizador
  const [totalizadorData, setTotalizadorData] = useState([]);
  const [loadingTotalizador, setLoadingTotalizador] = useState(false);
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  const getEndOfWeek = (d) => {
    const date = new Date(getStartOfWeek(d));
    return new Date(date.setDate(date.getDate() + 6));
  };
  const [totalizadorDateRef, setTotalizadorDateRef] = useState(new Date());
  
  const formatDateISO = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
  };
"""
if 'totalizadorData' not in content:
    content = content.replace(
        'const [showAddCarga, setShowAddCarga] = useState(false);',
        'const [showAddCarga, setShowAddCarga] = useState(false);\n' + states_code
    )

# 3. Fetch Function
fetch_code = """
  const fetchTotalizador = async () => {
    setLoadingTotalizador(true);
    try {
      const start = getStartOfWeek(totalizadorDateRef);
      const end = getEndOfWeek(totalizadorDateRef);
      const res = await api.get(`/cargas-combustible/totalizador_unidades/?fecha_inicio=${formatDateISO(start)}&fecha_fin=${formatDateISO(end)}`);
      setTotalizadorData(res.data);
    } catch(err) {
      console.error(err);
      notify.error("Error al cargar totalizador");
    } finally {
      setLoadingTotalizador(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'historial' && historialTipo === 'totalizador') {
      fetchTotalizador();
    }
  }, [activeTab, historialTipo, totalizadorDateRef]);

  const handlePrevWeek = () => {
    const newDate = new Date(totalizadorDateRef);
    newDate.setDate(newDate.getDate() - 7);
    setTotalizadorDateRef(newDate);
  };
  const handleNextWeek = () => {
    const newDate = new Date(totalizadorDateRef);
    newDate.setDate(newDate.getDate() + 7);
    setTotalizadorDateRef(newDate);
  };

  const generarPDFTotalizador = () => {
    const doc = new jsPDF();
    const start = getStartOfWeek(totalizadorDateRef);
    const end = getEndOfWeek(totalizadorDateRef);
    const dateStr = `${start.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})} - ${end.toLocaleDateString('es-MX', {day:'2-digit', month:'short'})}`;

    doc.setFontSize(16);
    doc.setTextColor(30, 64, 175);
    doc.text("Reporte de Totalizador de Combustibles", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Semana del: ${dateStr}`, 14, 28);
    
    doc.text(`Fecha de impresión: ${new Date().toLocaleString('es-MX')}`, 14, 34);

    const tableBody = totalizadorData.map(item => [
      item.unidad_nombre,
      item.cantidad_cargas,
      parseFloat(item.total_litros).toFixed(2) + " L",
      "$" + parseFloat(item.total_monto).toLocaleString('es-MX', {minimumFractionDigits:2})
    ]);

    const granTotalLitros = totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_litros), 0);
    const granTotalMonto = totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_monto), 0);

    tableBody.push([
      "GRAN TOTAL",
      totalizadorData.reduce((acc, curr) => acc + curr.cantidad_cargas, 0),
      granTotalLitros.toFixed(2) + " L",
      "$" + granTotalMonto.toLocaleString('es-MX', {minimumFractionDigits:2})
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Unidad', 'Total Cargas', 'Total Litros', 'Monto Total']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138] }, 
      footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42] },
      didParseCell: function (data) {
        if (data.row.index === tableBody.length - 1) {
           data.cell.styles.fontStyle = 'bold';
           data.cell.styles.fillColor = [241, 245, 249];
        }
      }
    });

    doc.save(`Totalizador_Combustible_${dateStr}.pdf`);
  };
"""
if 'fetchTotalizador' not in content:
    content = content.replace(
        '  const fetchHistorialEspecial = async () => {',
        fetch_code + '\n  const fetchHistorialEspecial = async () => {'
    )

# 4. Tab Selector
old_tabs = """            <div className="flex bg-slate-900/50 p-1.5 rounded-full backdrop-blur-xl">
              <button 
                onClick={() => setHistorialTipo('normal')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'normal' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Diarias
              </button>
              <button 
                onClick={() => setHistorialTipo('especial')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'especial' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Especiales
              </button>
            </div>"""
new_tabs = """            <div className="flex bg-slate-900/50 p-1.5 rounded-full backdrop-blur-xl overflow-x-auto custom-scrollbar">
              <button 
                onClick={() => setHistorialTipo('normal')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'normal' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Diarias
              </button>
              <button 
                onClick={() => setHistorialTipo('especial')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'especial' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Especiales
              </button>
              <button 
                onClick={() => setHistorialTipo('totalizador')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${historialTipo === 'totalizador' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                Totalizador
              </button>
            </div>"""
content = content.replace(old_tabs, new_tabs)

# 5. Totalizador View
total_view = """
          {historialTipo === 'totalizador' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-700/50 gap-4">
                <div className="flex items-center bg-slate-950/50 rounded-xl overflow-hidden border border-slate-800">
                  <button onClick={handlePrevWeek} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <div className="px-6 py-2 text-center min-w-[200px]">
                    <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1">Semana Del</p>
                    <p className="text-white font-bold text-lg whitespace-nowrap">
                      {getStartOfWeek(totalizadorDateRef).toLocaleDateString('es-MX', {day:'2-digit', month:'short'})} - {getEndOfWeek(totalizadorDateRef).toLocaleDateString('es-MX', {day:'2-digit', month:'short'})}
                    </p>
                  </div>
                  <button onClick={handleNextWeek} className="p-3 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
                
                <button onClick={generarPDFTotalizador} className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/50 active:scale-95">
                  <Download size={18} />
                  Descargar PDF
                </button>
              </div>

              <div className="bg-slate-900/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-700">
                      <tr>
                        <th className="px-6 py-4 font-bold text-slate-300 uppercase text-xs tracking-wider">Unidad</th>
                        <th className="px-6 py-4 font-bold text-center uppercase text-xs tracking-wider">Total Cargas</th>
                        <th className="px-6 py-4 font-bold text-right text-blue-400 uppercase text-xs tracking-wider">Total Litros</th>
                        <th className="px-6 py-4 font-bold text-right text-emerald-400 uppercase text-xs tracking-wider">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {loadingTotalizador ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
                            <p className="text-slate-400">Calculando totales...</p>
                          </td>
                        </tr>
                      ) : totalizadorData.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                            No hay cargas registradas en esta semana.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {totalizadorData.map((item) => (
                            <tr key={item.id_key} className="hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-4 text-white font-bold text-base group-hover:text-emerald-400 transition-colors">{item.unidad_nombre}</td>
                              <td className="px-6 py-4 text-center text-slate-300 font-medium">
                                <span className="bg-slate-800/80 px-3 py-1 rounded-full text-xs font-bold border border-slate-700 group-hover:border-emerald-500/50 transition-colors">{item.cantidad_cargas}</span>
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-blue-300 font-bold text-base">
                                {parseFloat(item.total_litros).toFixed(2)} L
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-emerald-400 font-bold text-base">
                                ${parseFloat(item.total_monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-800/90 border-t-2 border-emerald-500/30">
                            <td className="px-6 py-5 text-white font-black text-lg uppercase tracking-wider">Gran Total</td>
                            <td className="px-6 py-5 text-center text-white font-bold text-lg">
                              {totalizadorData.reduce((acc, curr) => acc + curr.cantidad_cargas, 0)}
                            </td>
                            <td className="px-6 py-5 text-right font-mono text-blue-400 font-black text-lg">
                              {totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_litros), 0).toFixed(2)} L
                            </td>
                            <td className="px-6 py-5 text-right font-mono text-emerald-400 font-black text-lg">
                              ${totalizadorData.reduce((acc, curr) => acc + parseFloat(curr.total_monto), 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : historialTipo === 'especial' ? (
"""
old_view = """
            {/* Content depending on normal vs especial */}
            <div className="space-y-4">
              {historialTipo === 'especial' ? ("""
if "historialTipo === 'totalizador'" not in content:
    content = content.replace(old_view, old_view.replace("{historialTipo === 'especial' ? (", total_view))

    end_view = """
            </div>
          )}
        </div>
      </div>
    );
  };

  const filteredUnidadesEspecial = unidades.filter(u => """
    content = content.replace(
        "</div>\n        </div>\n      </div>\n    );\n  };\n\n  const filteredUnidadesEspecial = unidades.filter(u => ",
        end_view
    )

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Combustibles.jsx parcheado en Python con éxito!")
