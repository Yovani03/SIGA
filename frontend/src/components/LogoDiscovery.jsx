import React from 'react';

const LogoDiscovery = ({ className = "w-full h-full" }) => {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <style>
        {`
          @keyframes spin-3d {
            from { transform: perspective(400px) rotateY(0deg); }
            to { transform: perspective(400px) rotateY(360deg); }
          }
          .logo-spin-3d {
            animation: spin-3d 8s linear infinite;
            transform-origin: 35px 50px;
            transform-style: preserve-3d;
          }
        `}
      </style>

      {/* Círculo exterior (Azul Neón) */}
      <circle 
        cx="50" 
        cy="50" 
        r="46" 
        fill="none" 
        stroke="#3b82f6" 
        strokeWidth="1.5" 
        filter="url(#glow-blue)"
        className="opacity-80"
      />

      {/* Letra D Estilizada (Naranja Neón) */}
      <path
        d="M45 25 H65 C75 25 85 35 85 50 C85 65 75 75 65 75 H45 V65 H65 C70 65 75 60 75 50 C75 40 70 35 65 35 H45 V25 Z"
        fill="none"
        stroke="#f97316"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#glow-orange)"
      />

      {/* Globo (Verde Neón) - Ahora con animación 3D */}
      <g filter="url(#glow-green)" className="logo-spin-3d">
        {/* Círculo del mundo */}
        <circle cx="35" cy="50" r="18" fill="none" stroke="#22c55e" strokeWidth="1.2" />
        
        {/* Meridianos (Líneas verticales que dan efecto 3D) */}
        <ellipse cx="35" cy="50" rx="10" ry="18" fill="none" stroke="#22c55e" strokeWidth="0.8" opacity="0.6" />
        <ellipse cx="35" cy="50" rx="4" ry="18" fill="none" stroke="#22c55e" strokeWidth="0.8" opacity="0.4" />
        
        {/* Paralelos (Líneas horizontales) */}
        <ellipse cx="35" cy="50" rx="18" ry="6" fill="none" stroke="#22c55e" strokeWidth="0.8" opacity="0.5" />
        <line x1="17" y1="50" x2="53" y2="50" stroke="#22c55e" strokeWidth="1" opacity="0.6" />
      </g>
    </svg>
  );
};

export default LogoDiscovery;
