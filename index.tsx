
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Protezione globale
// Fixed: Cast window to any to avoid property 'process' does not exist on type 'Window' error
if (typeof window !== 'undefined' && !(window as any).process) {
  (window as any).process = { env: {} };
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical error during App mount:", error);
  rootElement.innerHTML = `
    <div style="padding: 40px; color: #431407; font-family: sans-serif; text-align: center; background: #fff;">
      <h2 style="color: #f97316; font-weight: 900; text-transform: uppercase;">Errore di Caricamento</h2>
      <p style="font-size: 14px; color: #666;">L'applicazione non è riuscita a partire. Verifica la console del browser per i dettagli.</p>
      <div style="text-align: left; background: #fef2f2; padding: 20px; border-radius: 15px; overflow: auto; font-size: 11px; margin-top: 20px; border: 1px solid #fee2e2; color: #991b1b; max-width: 500px; margin-left: auto; margin-right: auto;">
        ${error instanceof Error ? error.stack || error.message : String(error)}
      </div>
      <button onclick="window.location.reload()" style="margin-top: 20px; padding: 10px 20px; background: #431407; color: #fbbf24; border: none; border-radius: 10px; font-weight: bold; cursor: pointer;">RIPROVA</button>
    </div>
  `;
}
