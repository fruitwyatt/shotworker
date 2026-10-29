import { Navigate, Route, Routes } from 'react-router-dom';
import App from './App';
import GifTool from './pages/GifTool';
import ImageTool from './pages/ImageTool';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

// Shared by the client (BrowserRouter) and the build-time prerender
// (StaticRouter) so server HTML and hydration match.
// Old /tools/* URLs are 301'd by public/_redirects; the <Navigate>s only
// cover the dev server.
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route index element={<GifTool />} />
        <Route path="background-remover" element={<ImageTool />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="tools" element={<Navigate to="/" replace />} />
        <Route path="tools/gif-background-remover" element={<Navigate to="/" replace />} />
        <Route path="tools/image-background-remover" element={<Navigate to="/background-remover" replace />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
