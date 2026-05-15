import { toast } from 'sonner';

/**
 * Sileo-style notification system
 */
export const notify = {
  success: (message, options = {}) => {
    toast.success(message, {
      ...options,
      className: 'sileo-toast sileo-toast-success',
    });
  },
  error: (message, options = {}) => {
    toast.error(message, {
      ...options,
      className: 'sileo-toast sileo-toast-error',
    });
  },
  info: (message, options = {}) => {
    toast.info(message, {
      ...options,
      className: 'sileo-toast sileo-toast-info',
    });
  },
  promise: (promise, data) => {
    toast.promise(promise, {
      loading: data.loading || 'Cargando...',
      success: (res) => {
        const msg = typeof data.success === 'function' ? data.success(res) : data.success;
        return {
          label: msg || 'Completado',
          className: 'sileo-toast sileo-toast-success'
        };
      },
      error: (err) => {
        const msg = typeof data.error === 'function' ? data.error(err) : data.error;
        return {
          label: msg || 'Error al procesar',
          className: 'sileo-toast sileo-toast-error'
        };
      },
      className: 'sileo-toast',
    });
  }
};

export default notify;
