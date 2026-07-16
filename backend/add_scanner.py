import re

file_path = r'c:\Autrotransportes\frontend\src\pages\Combustibles.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Imports
# Add PDFDocument
if "from 'pdf-lib'" not in content:
    content = content.replace("import { jsPDF } from 'jspdf';", "import { jsPDF } from 'jspdf';\nimport { PDFDocument } from 'pdf-lib';")

# Add missing Lucide icons (Upload, CheckCircle, FilePlus, Eye)
lucide_icons = ['Upload', 'CheckCircle', 'FilePlus', 'Eye']
for icon in lucide_icons:
    if icon not in content.split("from 'lucide-react'")[0]:
        content = content.replace("PlusCircle\n}", f"PlusCircle,\n  {icon}\n}}")

# Add Spinner component
spinner_code = """
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
"""
if "const Spinner = () =>" not in content:
    content = content.replace("const Combustibles = () => {", spinner_code + "\nconst Combustibles = () => {")

# 2. Add State inside Combustibles
states_code = """  const [scanning, setScanning] = useState(false);
  const [scannedFiles, setScannedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
"""
if "const [scanning, setScanning] = useState" not in content:
    content = content.replace("const [evidenciaForm, setEvidenciaForm] = useState", states_code + "  const [evidenciaForm, setEvidenciaForm] = useState")

# 3. Add Scanner functions
scanner_functions = """
  const handleScan = async () => {
    if (scannedFiles.length >= 20) {
      notify.error('Límite de escaneo alcanzado (máximo 20 páginas)');
      return;
    }
    setScanning(true);
    try {
      const response = await fetch('http://localhost:3001/api/scan');
      if (!response.ok) throw new Error('Fallo al conectar con el escáner');
      const blob = await response.blob();
      const file = new File([blob], `escaneo_${Date.now()}.pdf`, { type: "application/pdf" });
      setScannedFiles(prev => [...prev, file]);
      notify.success('Página escaneada correctamente');
    } catch (err) {
      notify.error('Fallo al conectar con el escáner. Verifica NAPS2.');
    } finally {
      setScanning(false);
    }
  };

  const mergePDFs = async (files) => {
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        if (file.type === 'application/pdf') {
          const pdf = await PDFDocument.load(arrayBuffer);
          const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
          copiedPages.forEach((page) => mergedPdf.addPage(page));
        } else if (file.type.startsWith('image/')) {
          let image;
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            image = await mergedPdf.embedJpg(arrayBuffer);
          } else if (file.type === 'image/png') {
            image = await mergedPdf.embedPng(arrayBuffer);
          } else {
            continue;
          }
          
          const page = mergedPdf.addPage([image.width, image.height]);
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
          });
        }
      }
      const mergedPdfBytes = await mergedPdf.save();
      return new File([mergedPdfBytes], `evidencia_${evidenciaForm.folio_factura || 'escaneada'}.pdf`, { type: "application/pdf" });
    } catch (err) {
      console.error("Error al unir documentos:", err);
      throw new Error("No se pudieron unir los documentos. Asegúrate de que sean PDFs o imágenes válidas.");
    }
  };

  const handleEvidenciaFileChangeMulti = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (scannedFiles.length >= 20) {
        notify.error('Límite de documentos alcanzado (máximo 20 páginas)');
        return;
      }
      setScannedFiles(prev => [...prev, file]);
    }
  };
"""
if "const handleScan = async" not in content:
    content = content.replace("const handleEvidenciaFileChange = (e) =>", scanner_functions + "\n  const handleEvidenciaFileChange = (e) =>")

# 4. Modify handleSubmitEvidencia
submit_replace_target = """    if(evidenciaForm.archivo_escaneado) formData.append('archivo_escaneado', evidenciaForm.archivo_escaneado);"""
submit_replace_with = """    if (scannedFiles.length > 0) {
      if (scannedFiles.length === 1) {
        formData.append('archivo_escaneado', scannedFiles[0]);
      } else {
        try {
          const mergedFile = await mergePDFs(scannedFiles);
          formData.append('archivo_escaneado', mergedFile);
        } catch (err) {
          notify.error(err.message);
          setLoading(false);
          return;
        }
      }
    } else if (evidenciaForm.archivo_escaneado) {
       formData.append('archivo_escaneado', evidenciaForm.archivo_escaneado);
    }"""
content = content.replace(submit_replace_target, submit_replace_with)

# Modify clear form in handleSubmitEvidencia
content = content.replace("evidenciaForm.archivo_escaneado = null;\n      }", "evidenciaForm.archivo_escaneado = null;\n        setScannedFiles([]);\n      }")
content = content.replace("archivo_escaneado: null });", "archivo_escaneado: null });\n      setScannedFiles([]);")

# 5. Modify UI in render (around line 1715)
ui_replace_target = """<input type="file" accept="image/*,.pdf" onChange={handleEvidenciaFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400" />"""

scanner_ui = """<div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 flex flex-col items-center justify-center text-center group hover:border-emerald-500 transition-colors relative min-h-[250px] shadow-sm">
            <input
              type="file"
              onChange={handleEvidenciaFileChangeMulti}
              className="absolute inset-0 w-full h-1/2 opacity-0 cursor-pointer z-10"
              accept="image/*,.pdf"
              disabled={scannedFiles.length >= 20}
            />
            
            <div className="bg-emerald-600/10 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
              <Upload className="text-emerald-600 dark:text-emerald-500" size={24} />
            </div>
            
            {scannedFiles.length > 0 ? (
              <div className="w-full space-y-3 relative z-20">
                <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
                  <CheckCircle size={12} /> {scannedFiles.length}/20 {scannedFiles.length === 1 ? 'Documento' : 'Documentos'} Listos
                </p>
                
                <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {scannedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-2 rounded-xl group/item hover:border-emerald-500/50 transition-all">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="bg-emerald-600/10 p-1.5 rounded-lg">
                          <FilePlus size={12} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-mono">
                          {file.name}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <button 
                          type="button"
                          onClick={() => setPreviewFile({ url: URL.createObjectURL(file), name: file.name, isPdf: file.type === 'application/pdf' })}
                          className="text-slate-600 hover:text-emerald-500 p-1 transition-colors mr-1"
                          title="Previsualizar"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => setScannedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-600 hover:text-rose-500 p-1 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={scanning || scannedFiles.length >= 20}
                    className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 text-[10px] font-black rounded-lg border border-emerald-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {scanning ? <Spinner /> : <FilePlus size={14} />}
                    <span>ESCANEAR OTRA HOJA</span>
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setScannedFiles([])}
                    className="text-rose-400 text-[9px] font-bold hover:underline uppercase tracking-tighter"
                  >
                    Limpiar todo
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 relative z-20 w-full px-4">
                <button
                  type="button"
                  onClick={handleScan}
                  disabled={scanning}
                  className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 dark:hover:bg-emerald-600 disabled:opacity-50 text-slate-600 dark:text-white hover:text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                >
                  {scanning ? <Spinner /> : <FilePlus size={16} />}
                  <span>{scanning ? 'Escaneando...' : 'Escanear Ahora'}</span>
                </button>
                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 dark:text-slate-600 text-xs font-medium">O</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                </div>
                <div className="pointer-events-none">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm block mb-1">Seleccionar Archivo</span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">PDF, JPG o PNG (Max 10MB)</p>
                </div>
              </div>
            )}
          </div>"""

content = content.replace(ui_replace_target, scanner_ui)

# Add Preview Modal at the very end of the file, just before the last </div>
preview_modal = """
      {previewFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-4">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye size={18} className="text-blue-500" />
                Previsualización: {previewFile.name}
              </h3>
              <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[500px]">
              {previewFile.isPdf ? (
                <iframe src={previewFile.url} className="w-full h-full rounded-xl border-0" title="PDF Preview" />
              ) : (
                <img src={previewFile.url} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}
"""
if "{previewFile && (" not in content:
    content = content.replace("    </div>\n  );\n};\n\nexport default Combustibles;", preview_modal + "\n    </div>\n  );\n};\n\nexport default Combustibles;")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Scanner UI added successfully.")
