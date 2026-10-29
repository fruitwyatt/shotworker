import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import './index.css';

const app = (
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>
);

const root = document.getElementById('root')!;
// Production HTML is prerendered (scripts/prerender.mjs) → hydrate.
// The dev server serves an empty #root → plain client render.
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
