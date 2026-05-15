import React from 'react';
import { Toaster } from 'sonner';

const SileoToaster = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        className: 'sileo-toast',
        style: {
          // Additional inline styles if needed
        },
      }}
      expand={false}
      richColors
      closeButton
    />
  );
};

export default SileoToaster;
