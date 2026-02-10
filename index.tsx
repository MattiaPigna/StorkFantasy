
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
    <div style="padding: 20px; color: #431407; font-family: sans-serif; text-align: center;">
      <h2 style="color: #f97316;">Ops! Si è verificato un errore</h2>
      <p>L'applicazione non è riuscita ad avviarsi. Controlla la connessione o ricarica la pagina.</p>
      <pre style="text-align: left; background: #fff1f2; padding: 15px; border-radius: 10px; overflow: auto; font-size: 12px; margin-top: 20px;">
        ${error instanceof Error ? error.message : String(error)}
      </pre>
    </div>
  `;
}
