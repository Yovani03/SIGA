import re

with open('frontend/src/pages/ContraRecibos.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states for search
state_search = '''
  const [busquedaEntidad, setBusquedaEntidad] = useState('');
  const [mostrarDropdownEntidad, setMostrarDropdownEntidad] = useState(false);
  const [entidadSeleccionada, setEntidadSeleccionada] = useState(null);

  const entidades = [
    ...proveedores.map(p => ({ ...p, tipo: 'proveedor' })),
    ...talleres.map(t => ({ ...t, tipo: 'taller' }))
  ];

  const entidadesFiltradas = entidades.filter(e => {
    const searchLower = busquedaEntidad.toLowerCase();
    return (
      (e.nombre && e.nombre.toLowerCase().includes(searchLower)) ||
      (e.razon_social && e.razon_social.toLowerCase().includes(searchLower)) ||
      (e.rfc && e.rfc.toLowerCase().includes(searchLower))
    );
  });

  const seleccionarEntidad = (entidad) => {
    setEntidadSeleccionada(entidad);
    setOrigenTipo(entidad.tipo);
    setOrigenId(entidad.id);
    setBusquedaEntidad(entidad.razon_social || entidad.nombre);
    setMostrarDropdownEntidad(false);
  };
'''

content = content.replace('const [nuevaFactura, setNuevaFactura] = useState({', state_search + '\n  const [nuevaFactura, setNuevaFactura] = useState({')

# Add Store icon import
content = content.replace('from \'lucide-react\';', ', Store } from \'lucide-react\';')

# Now replace the Datos Generales block.
# We will just merge it into the Invoices Section.
old_datos_generales = '''          {/* General Data Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Datos Generales</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo de Origen
                </label>
                <select
                  value={origenTipo}
                  onChange={(e) => {
                    setOrigenTipo(e.target.value);
                    setOrigenId('');
                  }}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="proveedor">Proveedor</option>
                  <option value="taller">Taller</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seleccionar {origenTipo === 'proveedor' ? 'Proveedor' : 'Taller'}
                </label>
                <select
                  value={origenId}
                  onChange={(e) => setOrigenId(e.target.value)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Selecciona una opción...</option>
                  {origenTipo === 'proveedor'
                    ? proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)
                    : talleres.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)
                  }
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center">
              <input
                id="resico"
                type="checkbox"
                checked={resicoAplicado}
                onChange={(e) => setResicoAplicado(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="resico" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                Aplica RESICO
              </label>
            </div>
          </div>

          {/* Invoices Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agregar Facturas</h2>'''

new_section = '''          {/* Invoices Section with General Data */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Generar Contra Recibo</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                    <Store size={14} /> Taller / Proveedor
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="text-gray-500/40" size={12} />
                    </div>
                    <input
                      type="text"
                      placeholder="Buscar taller o proveedor..."
                      value={busquedaEntidad}
                      onChange={(e) => {
                        setBusquedaEntidad(e.target.value);
                        if (!e.target.value) {
                           setEntidadSeleccionada(null);
                           setOrigenId('');
                        }
                      }}
                      onFocus={() => setMostrarDropdownEntidad(true)}
                      onBlur={() => setTimeout(() => setMostrarDropdownEntidad(false), 200)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-8 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                    />
                    
                    {mostrarDropdownEntidad && (
                      <div 
                        onMouseDown={(e) => e.preventDefault()}
                        className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto custom-scrollbar"
                      >
                        {entidadesFiltradas.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 italic">
                            No se encontraron resultados
                          </div>
                        ) : (
                          entidadesFiltradas.map(e => (
                            <button
                              key={`${e.tipo}-${e.id}`}
                              type="button"
                              onClick={() => seleccionarEntidad(e)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 text-left border-b border-gray-100 dark:border-gray-750 last:border-0 transition-colors group"
                            >
                              <div>
                                <div className="text-gray-900 dark:text-white font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-sm">
                                  {e.razon_social || e.nombre}
                                </div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                                  <span className="uppercase font-semibold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[9px]">
                                    {e.tipo === 'taller' ? 'Taller' : 'Proveedor'}
                                  </span>
                                  {e.rfc && <span>RFC: {e.rfc}</span>}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-end mb-2">
                  <div className="flex items-center">
                    <input
                      id="resico"
                      type="checkbox"
                      checked={resicoAplicado}
                      onChange={(e) => setResicoAplicado(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="resico" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Aplica RESICO
                    </label>
                  </div>
                </div>
            </div>
'''

content = content.replace(old_datos_generales, new_section)

# Handle Reset Form in handleSaveAndPrint and clean all
content = content.replace("setOrigenId('');", "setOrigenId('');\n      setBusquedaEntidad('');\n      setEntidadSeleccionada(null);")

with open('frontend/src/pages/ContraRecibos.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Replacement done')
