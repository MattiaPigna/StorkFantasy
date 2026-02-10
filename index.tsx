
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Protezione globale ultra-robusta eseguita prima di ogni altra cosa
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Impossibile trovare l'elemento root nel DOM.");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Errore critico durante il montaggio dell'App:", error);
  rootElement.innerHTML = `
    <div style="padding: 40px; color: #431407; font-family: sans-serif; text-align: center; background: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <h2 style="color: #f97316; font-weight: 900; text-transform: uppercase; margin-bottom: 10px;">Errore di Inizializzazione</h2>
      <p style="font-size: 14px; color: #666; max-width: 400px; margin-bottom: 20px;">L'applicazione ha riscontrato un problema tecnico durante il caricamento dei moduli.</p>
      <div style="text-align: left; background: #fef2f2; padding: 20px; border-radius: 15px; overflow: auto; font-size: 11px; border: 1px solid #fee2e2; color: #991b1b; max-width: 90%; font-family: monospace;">
        ${error instanceof Error ? error.message : String(error)}
      </div>
      <button onclick="window.location.reload()" style="margin-top: 30px; padding: 12px 24px; background: #431407; color: #fbbf24; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; text-transform: uppercase; letter-spacing: 1px;">Ricarica Pagina</button>
    </div>
  `;
}
