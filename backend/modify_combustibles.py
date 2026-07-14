import re

file_path = r'c:\Autrotransportes\frontend\src\pages\Combustibles.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state variables
state_injection = """
  // State for Evidencias Gas
  const [evidenciasGas, setEvidenciasGas] = useState([]);
  const [loadingEvidencias, setLoadingEvidencias] = useState(false);
  const [evidenciaForm, setEvidenciaForm] = useState({ folio_factura: '', monto: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], archivo_escaneado: null });
"""
content = re.sub(
    r'(const \[fechaHistorial, setFechaHistorial\] = useState\(new Date\(\)\.toISOString\(\)\.split\(\'T\'\)\[0\]\);\n)',
    r'\1' + state_injection,
    content
)

# 2. Add fetchEvidenciasGas function
fetch_injection = """
  const fetchEvidenciasGas = async () => {
    setLoadingEvidencias(true);
    try {
      const res = await api.get('evidencias-gas/');
      setEvidenciasGas(res.data);
    } catch(err) {
      console.error(err);
      notify.error("Error al cargar evidencias de gas");
    } finally {
      setLoadingEvidencias(false);
    }
  };

  const handleEvidenciaFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEvidenciaForm({ ...evidenciaForm, archivo_escaneado: e.target.files[0] });
    }
  };

  const handleSubmitEvidencia = async (e) => {
    e.preventDefault();
    if(!evidenciaForm.folio_factura || !evidenciaForm.monto || !evidenciaForm.fecha) {
        notify.info("Completa los campos obligatorios");
        return;
    }
    const formData = new FormData();
    formData.append('folio_factura', evidenciaForm.folio_factura);
    formData.append('monto', evidenciaForm.monto);
    formData.append('fecha', evidenciaForm.fecha);
    if(evidenciaForm.descripcion) formData.append('descripcion', evidenciaForm.descripcion);
    if(evidenciaForm.archivo_escaneado) formData.append('archivo_escaneado', evidenciaForm.archivo_escaneado);

    setLoading(true);
    try {
      await api.post('evidencias-gas/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      notify.success("Evidencia registrada");
      setEvidenciaForm({ folio_factura: '', monto: '', descripcion: '', fecha: new Date().toISOString().split('T')[0], archivo_escaneado: null });
      fetchEvidenciasGas();
    } catch(err) {
      notify.error("Error al registrar evidencia");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvidencia = async (id) => {
    if(!window.confirm("¿Eliminar esta evidencia?")) return;
    try {
      await api.delete(`evidencias-gas/${id}/`);
      notify.success("Evidencia eliminada");
      fetchEvidenciasGas();
    } catch(err) {
      notify.error("Error al eliminar evidencia");
    }
  };
"""
content = re.sub(
    r'(const fetchTotalizador = async \(\) => \{[\s\S]*?\}\n  \};\n)',
    r'\1' + fetch_injection,
    content
)

# 3. Add to useEffect dependencies
content = re.sub(
    r'(if \(activeTab === \'historial\'\) \{)',
    r'if (activeTab === \'evidencia\') fetchEvidenciasGas();\n      \1',
    content
)

# 4. Add Tab Button
tab_injection = """
        <button 
          onClick={() => { setActiveTab('evidencia'); }}
          className={`relative flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ease-out overflow-hidden ${
            activeTab === 'evidencia' 
              ? 'text-white shadow-lg shadow-emerald-900/20' 
              : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50'
          }`}
        >
          {activeTab === 'evidencia' && (
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full" />
          )}
          <span className="relative z-10 flex items-center gap-2">
            <FileEdit size={18} /> Evidencia Gas
          </span>
        </button>
"""
# Need to import FileEdit if not imported, it's imported in layout but maybe not here.
# Let's replace FileEdit with Save or File, let's use History as placeholder if needed, wait, Lucide has many icons. Droplets is imported. Let's use CheckCircle2.
tab_injection = tab_injection.replace("FileEdit", "CheckCircle2")

content = re.sub(
    r'(</button>\n      </div>\n\n      \{activeTab === \'nuevo\' \? \()',
    tab_injection + r'\n\1',
    content
)

# 5. Add Tab Content
content_injection = """
      {activeTab === 'evidencia' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-sm">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={32} />
                Evidencia de Cargas de Gas
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Respaldo documental de facturas y tickets (No suma a gastos globales)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm backdrop-blur-xl h-max">
              <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-6 flex items-center gap-2">
                <Plus size={20} className="text-emerald-500"/>
                Nueva Evidencia
              </h3>
              
              <form onSubmit={handleSubmitEvidencia} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Folio Factura</label>
                  <input type="text" required value={evidenciaForm.folio_factura} onChange={e => setEvidenciaForm({...evidenciaForm, folio_factura: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Monto</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input type="number" step="0.01" required value={evidenciaForm.monto} onChange={e => setEvidenciaForm({...evidenciaForm, monto: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Fecha de Carga</label>
                  <input type="date" required value={evidenciaForm.fecha} onChange={e => setEvidenciaForm({...evidenciaForm, fecha: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Descripción (Opcional)</label>
                  <textarea value={evidenciaForm.descripcion} onChange={e => setEvidenciaForm({...evidenciaForm, descripcion: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none h-24" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Archivo Escaneado</label>
                  <input type="file" accept="image/*,.pdf" onChange={handleEvidenciaFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400" />
                </div>
                
                <button type="submit" disabled={loading} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50">
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Guardar Evidencia
                </button>
              </form>
            </div>
            
            <div className="lg:col-span-2 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-xl">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/30">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">Historial de Evidencias</h3>
                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 py-1 px-3 rounded-full text-xs font-bold">
                  {evidenciasGas.length} registros
                </span>
              </div>
              <div className="overflow-x-auto">
                {loadingEvidencias ? (
                  <div className="flex items-center justify-center p-12"><Loader2 className="animate-spin text-emerald-500" size={32} /></div>
                ) : evidenciasGas.length === 0 ? (
                  <div className="text-center p-12 text-slate-500 dark:text-slate-400">No hay evidencias registradas.</div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Folio</th>
                        <th className="px-6 py-4 font-semibold">Fecha</th>
                        <th className="px-6 py-4 font-semibold text-right">Monto</th>
                        <th className="px-6 py-4 font-semibold text-center">Archivo</th>
                        <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {evidenciasGas.map(ev => (
                        <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{ev.folio_factura}</td>
                          <td className="px-6 py-4 text-slate-500">{ev.fecha}</td>
                          <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">${parseFloat(ev.monto).toLocaleString('es-MX', {minimumFractionDigits: 2})}</td>
                          <td className="px-6 py-4 text-center">
                            {ev.archivo_escaneado ? (
                              <a href={ev.archivo_escaneado} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ver</a>
                            ) : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleDeleteEvidencia(ev.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
"""
content = re.sub(
    r'(</main>\n    </div>\n  \);\n};\n\nexport default Combustibles;)',
    content_injection + r'\n\1',
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Modification done")
