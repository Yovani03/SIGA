const fs = require('fs');

const filePath = 'c:\\Autrotransportes\\frontend\\src\\pages\\Combustibles.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
if (!content.includes('Edit2')) {
    content = content.replace(
        "Loader2\n} from 'lucide-react';", 
        "Loader2,\n  Edit2,\n  Check,\n  XCircle,\n  PlusCircle\n} from 'lucide-react';"
    );
}

// 2. Add State inside Combustibles component
const stateCode = `
  // State for adding/editing loads inside a block
  const [editingCargaId, setEditingCargaId] = useState(null);
  const [editCargaData, setEditCargaData] = useState({});
  const [showAddCarga, setShowAddCarga] = useState(false);
  const [newCargaData, setNewCargaData] = useState({
    unidad: '',
    fecha: new Date().toISOString().split('T')[0],
    tipo_combustible: 'diesel',
    litros: '',
    precio_unitario: '',
    kilometraje: '',
    ignorar_kilometraje: false,
    km_equivocado: false
  });
`;
if (!content.includes('const [editingCargaId, setEditingCargaId] = useState(null);')) {
    content = content.replace(
        'const [isEditingBlock, setIsEditingBlock] = useState(false);', 
        'const [isEditingBlock, setIsEditingBlock] = useState(false);\n' + stateCode
    );
}

// 3. Add Handlers before return
const handlersCode = `
  const handleEditClick = (carga) => {
    setEditingCargaId(carga.id);
    setEditCargaData({
      litros: carga.litros,
      precio_unitario: carga.precio_unitario,
      kilometraje: carga.kilometraje || '',
      ignorar_kilometraje: carga.ignorar_kilometraje,
      km_equivocado: carga.km_equivocado
    });
  };

  const handleSaveEdit = async (cargaId) => {
    try {
      const payload = {
        litros: parseFloat(editCargaData.litros),
        precio_unitario: parseFloat(editCargaData.precio_unitario),
        ignorar_kilometraje: editCargaData.ignorar_kilometraje,
        km_equivocado: editCargaData.km_equivocado,
        kilometraje: editCargaData.ignorar_kilometraje ? null : (parseInt(editCargaData.kilometraje) || 0)
      };
      await api.patch(\`cargas-combustible/\${cargaId}/\`, payload);
      notify.success("Carga actualizada");
      setEditingCargaId(null);
      refreshSelectedBlock();
    } catch(err) {
      notify.error("Error al actualizar carga");
    }
  };

  const handleDeleteCargaInBlock = async (cargaId) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta carga?")) return;
    try {
      await api.delete(\`cargas-combustible/\${cargaId}/\`);
      notify.success("Carga eliminada");
      refreshSelectedBlock();
    } catch(err) {
      notify.error("Error al eliminar carga");
    }
  };

  const handleAddNewCargaToBlock = async () => {
    if(!newCargaData.unidad || !newCargaData.litros || !newCargaData.precio_unitario || (!newCargaData.ignorar_kilometraje && !newCargaData.km_equivocado && !newCargaData.kilometraje)){
      notify.info("Completa los campos obligatorios");
      return;
    }
    try {
      const is_variado = newCargaData.unidad.startsWith('v-');
      const unidadId = parseInt(newCargaData.unidad.split('-')[1]);
      
      const payload = {
        bloque: selectedBlock.id,
        unidad: is_variado ? null : unidadId,
        unidad_variada: is_variado ? unidadId : null,
        fecha: newCargaData.fecha,
        tipo_combustible: newCargaData.tipo_combustible,
        precio_unitario: parseFloat(newCargaData.precio_unitario),
        litros: parseFloat(newCargaData.litros),
        ignorar_kilometraje: newCargaData.ignorar_kilometraje,
        km_equivocado: newCargaData.km_equivocado,
        kilometraje: newCargaData.ignorar_kilometraje ? null : (parseInt(newCargaData.kilometraje) || 0),
        es_especial: selectedBlock.es_especial || false
      };
      
      await api.post('cargas-combustible/', payload);
      notify.success("Carga agregada al bloque");
      setShowAddCarga(false);
      refreshSelectedBlock();
    } catch(err) {
      notify.error("Error al agregar carga");
    }
  };

  const refreshSelectedBlock = async () => {
    if (!selectedBlock) return;
    try {
      if (historialTipo === 'normal') {
        await fetchHistorial();
      } else {
        await fetchHistorialEspecial();
      }
      const blocksEndpoint = selectedBlock.es_especial ? \`cargas-combustible/historial_especiales/?limit=50\` : \`cargas-combustible/historial_bloques/?fecha=\${fechaHistorial}\`;
      const res = await api.get(blocksEndpoint);
      const updatedBlock = res.data.find(b => b.id === selectedBlock.id);
      if(updatedBlock){
        setSelectedBlock(updatedBlock);
      } else {
        setSelectedBlock(null);
      }
    } catch(err) {
      console.error(err);
    }
  };
`;
if (!content.includes('refreshSelectedBlock')) {
    content = content.replace(
        'const filteredUnidadesEspecial', 
        handlersCode + '\n  const filteredUnidadesEspecial'
    );
}

// 4. Modify the table row in the modal to support editing and deleting
const rowHtml = `                      <th className="px-4 py-3 font-semibold text-right">Kilometraje</th>
                      <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {selectedBlock.cargas?.map((carga) => (
                      <tr key={carga.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        {editingCargaId === carga.id ? (
                          <>
                            <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{carga.unidad_detalle}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs uppercase font-bold text-slate-500">{carga.tipo_combustible}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number" 
                                className="w-20 p-1 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 text-right text-black dark:text-white"
                                value={editCargaData.litros} 
                                onChange={e => setEditCargaData({...editCargaData, litros: e.target.value})} 
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number" 
                                className="w-20 p-1 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 text-right text-black dark:text-white"
                                value={editCargaData.precio_unitario} 
                                onChange={e => setEditCargaData({...editCargaData, precio_unitario: e.target.value})} 
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-black font-mono text-emerald-500">
                              \${(parseFloat(editCargaData.litros || 0) * parseFloat(editCargaData.precio_unitario || 0)).toLocaleString('es-MX', {minimumFractionDigits:2})}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <input 
                                type="number" 
                                className="w-20 p-1 border rounded bg-white dark:bg-slate-800 dark:border-slate-600 text-right text-black dark:text-white"
                                value={editCargaData.kilometraje} 
                                onChange={e => setEditCargaData({...editCargaData, kilometraje: e.target.value})}
                                disabled={editCargaData.ignorar_kilometraje || editCargaData.km_equivocado}
                              />
                              <div className="flex justify-end gap-2 mt-1">
                                <label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={editCargaData.km_equivocado} onChange={e=>setEditCargaData({...editCargaData, km_equivocado: e.target.checked})} /> Mal</label>
                                <label className="text-[10px] flex items-center gap-1"><input type="checkbox" checked={editCargaData.ignorar_kilometraje} onChange={e=>setEditCargaData({...editCargaData, ignorar_kilometraje: e.target.checked})} /> Ign</label>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center flex justify-center gap-2">
                              <button onClick={() => handleSaveEdit(carga.id)} className="text-emerald-500 hover:text-emerald-700 p-1"><Check size={18} /></button>
                              <button onClick={() => setEditingCargaId(null)} className="text-slate-400 hover:text-slate-600 p-1"><XCircle size={18} /></button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{carga.unidad_detalle}</td>
                            <td className="px-4 py-3">
                              <span className="text-xs uppercase font-bold text-slate-500">{carga.tipo_combustible}</span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-mono font-medium">{parseFloat(carga.litros).toFixed(2)} L</td>
                            <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">\${parseFloat(carga.precio_unitario).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-black font-mono text-emerald-500">
                              \${parseFloat(carga.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {carga.ignorar_kilometraje ? (
                                <span className="text-slate-400 text-xs italic">Ignorado</span>
                              ) : carga.km_equivocado ? (
                                <div className="flex flex-col items-end">
                                  <span className="text-amber-500 font-bold text-xs">KM Equivocado</span>
                                  <span className="text-slate-900 dark:text-white font-mono">{carga.kilometraje}</span>
                                </div>
                              ) : (
                                <span className="text-slate-900 dark:text-white font-mono">{carga.kilometraje}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center flex justify-center gap-2">
                              <button onClick={() => handleEditClick(carga)} className="text-blue-500 hover:text-blue-700 p-1"><Edit2 size={16} /></button>
                              <button onClick={() => handleDeleteCargaInBlock(carga.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                            </td>
                          </>
                        )}
                      </tr>`;

if (!content.includes('<th className="px-4 py-3 font-semibold text-center">Acciones</th>')) {
    const toReplace = \`                      <th className="px-4 py-3 font-semibold text-right">Kilometraje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                    {selectedBlock.cargas?.map((carga, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{carga.unidad_detalle}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs uppercase font-bold text-slate-500">{carga.tipo_combustible}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700 dark:text-slate-300 font-mono font-medium">{parseFloat(carga.litros).toFixed(2)} L</td>
                        <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">\${parseFloat(carga.precio_unitario).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-black font-mono text-emerald-500">
                          \${parseFloat(carga.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {carga.ignorar_kilometraje ? (
                            <span className="text-slate-400 text-xs italic">Ignorado</span>
                          ) : carga.km_equivocado ? (
                            <div className="flex flex-col items-end">
                              <span className="text-amber-500 font-bold text-xs">KM Equivocado</span>
                              <span className="text-slate-900 dark:text-white font-mono">{carga.kilometraje}</span>
                            </div>
                          ) : (
                            <span className="text-slate-900 dark:text-white font-mono">{carga.kilometraje}</span>
                          )}
                        </td>
                      </tr>\`;
    content = content.replace(toReplace, rowHtml);
}

// 5. Add "Add load" form at the bottom of the modal
const addFormHtml = `
              {/* Add New Carga to Block */}
              <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-6">
                {!showAddCarga ? (
                  <button onClick={() => setShowAddCarga(true)} className="flex items-center gap-2 text-blue-500 hover:text-blue-600 font-bold px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-colors">
                    <PlusCircle size={20} /> Agregar carga olvidada al bloque
                  </button>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/50">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><PlusCircle size={20} className="text-blue-500" /> Nueva Carga</h4>
                      <button onClick={() => setShowAddCarga(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Unidad</label>
                        <select className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newCargaData.unidad} onChange={e => setNewCargaData({...newCargaData, unidad: e.target.value})}>
                          <option value="">Selecciona unidad</option>
                          {unidades.map(u => (
                            <option key={\`\${u.is_variado?'v':'t'}-\${u.id}\`} value={\`\${u.is_variado?'v':'t'}-\${u.id}\`}>{u.numero_economico}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                        <input type="date" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newCargaData.fecha} onChange={e => setNewCargaData({...newCargaData, fecha: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Combustible</label>
                        <select className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newCargaData.tipo_combustible} onChange={e => setNewCargaData({...newCargaData, tipo_combustible: e.target.value})}>
                          <option value="magna">Magna</option>
                          <option value="premium">Premium</option>
                          <option value="diesel">Diesel</option>
                          <option value="electrico">Eléctrico</option>
                          <option value="gas_lp">Gas LP</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Precio Unit.</label>
                        <input type="number" step="0.01" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newCargaData.precio_unitario} onChange={e => setNewCargaData({...newCargaData, precio_unitario: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Litros</label>
                        <input type="number" step="0.001" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={newCargaData.litros} onChange={e => setNewCargaData({...newCargaData, litros: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Kilometraje</label>
                        <input type="number" className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50" value={newCargaData.kilometraje} onChange={e => setNewCargaData({...newCargaData, kilometraje: e.target.value})} disabled={newCargaData.ignorar_kilometraje || newCargaData.km_equivocado} />
                      </div>
                      <div className="flex flex-col justify-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                          <input type="checkbox" checked={newCargaData.km_equivocado} onChange={e=>setNewCargaData({...newCargaData, km_equivocado: e.target.checked})} className="rounded text-blue-500 w-4 h-4" /> KM Equivocado
                        </label>
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-medium">
                          <input type="checkbox" checked={newCargaData.ignorar_kilometraje} onChange={e=>setNewCargaData({...newCargaData, ignorar_kilometraje: e.target.checked})} className="rounded text-blue-500 w-4 h-4" /> Ignorar KM
                        </label>
                      </div>
                      <div className="flex items-end">
                        <button onClick={handleAddNewCargaToBlock} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                          <Save size={18} /> Guardar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
`;

if (!content.includes('Agregar carga olvidada al bloque')) {
    content = content.replace(
        '</div>\n\n            </div>\n          </div>\n        </div>\n      )}', 
        '</div>\n\n' + addFormHtml + '\n            </div>\n          </div>\n        </div>\n      )}'
    );
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Combustibles.jsx modificado exitosamente.');
