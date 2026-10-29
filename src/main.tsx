import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import GifTool from './pages/GifTool';
import ImageTool from './pages/ImageTool';
import Privacy from './pages/Privacy';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'tools/gif-background-remover', element: <GifTool /> },
      { path: 'tools/image-background-remover', element: <ImageTool /> },
      { path: 'privacy', element: <Privacy /> },
      { path: '*', element: <Home /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
