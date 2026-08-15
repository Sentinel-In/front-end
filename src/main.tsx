/* ============================================================
   Main Entry Point — SPEC §1
   Imports fonts, globals, mounts <App />.
   ============================================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted IBM Plex fonts — SPEC §2
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-sans/700.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

// Global styles — must be after font imports
import './styles/globals.css';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
