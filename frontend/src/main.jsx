import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Prevent ArrowUp, ArrowDown, and minus (-), plus (+), and 'e'/'E' (exponential) keys in input[type=number] globally
document.addEventListener('keydown', function(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
    }
    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
      e.preventDefault();
    }
  }
}, { capture: true });

// Prevent mouse wheel scrolling from changing input values in input[type=number]
document.addEventListener('wheel', function(e) {
  if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

// Prevent pasting negative values in input[type=number]
document.addEventListener('paste', function(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    const pastedData = (e.clipboardData || window.clipboardData)?.getData('text');
    if (pastedData && (pastedData.includes('-') || parseFloat(pastedData) < 0)) {
      e.preventDefault();
    }
  }
}, { capture: true });

// Prevent drag & drop of negative values in input[type=number]
document.addEventListener('drop', function(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    const textData = e.dataTransfer?.getData('text');
    if (textData && (textData.includes('-') || parseFloat(textData) < 0)) {
      e.preventDefault();
    }
  }
}, { capture: true });

// Enforce non-negative values in input[type=number] globally (for autocomplete, autofill, mobile keyboards, etc.)
document.addEventListener('input', function(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    const value = e.target.value;
    if (value.includes('-') || parseFloat(value) < 0) {
      const cleanValue = value.replace(/-/g, '');
      const finalValue = parseFloat(cleanValue) < 0 ? '' : cleanValue;
      
      // Update value bypassing React's internal tracker
      const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
      if (descriptor && descriptor.set) {
        descriptor.set.call(e.target, finalValue);
      } else {
        e.target.value = finalValue;
      }
      
      // Dispatch input event to notify React
      const event = new Event('input', { bubbles: true });
      e.target.dispatchEvent(event);
    }
  }
}, { capture: true });

// Dynamically set min="0" on any number input when focused/interacted with
document.addEventListener('focusin', function(e) {
  if (e.target && e.target.tagName === 'INPUT' && e.target.type === 'number') {
    if (!e.target.hasAttribute('min') || parseFloat(e.target.getAttribute('min')) < 0) {
      e.target.setAttribute('min', '0');
    }
  }
}, { capture: true });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

