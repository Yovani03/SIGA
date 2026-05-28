/**
 * Formatea una URL de archivo multimedia para que utilice el origen actual (window.location.origin)
 * si es un enlace que apunta a la carpeta /media/. Esto previene problemas de puertos incorrectos
 * (por ejemplo, acceder a un puerto interno no expuesto o a una dirección sin puerto como :8090).
 * 
 * @param {string} url - La URL original del archivo (puede ser absoluta o relativa).
 * @returns {string} La URL formateada apuntando al origen actual.
 */
export const formatMediaUrl = (url) => {
  if (!url) return '';
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      if (urlObj.pathname.startsWith('/media/')) {
        return `${window.location.origin}${urlObj.pathname}${urlObj.search}`;
      }
    } catch (e) {
      console.error("Error formateando URL de media:", e);
    }
  } else if (url.startsWith('/media/')) {
    return `${window.location.origin}${url}`;
  }
  
  return url;
};
