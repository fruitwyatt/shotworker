import { Link, NavLink, Outlet } from 'react-router-dom';

function Logo() {
  return (
    <Link to="/" className="logo" aria-label="ShotWorker home">
      <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6a63f6" />
            <stop offset="1" stopColor="#4338ca" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#lg)" />
        <circle cx="32" cy="32" r="15" fill="none" stroke="#fff" strokeWidth="4.5" />
        <circle cx="32" cy="32" r="5.5" fill="#fff" />
        <rect x="41" y="12" width="9" height="5" rx="2.5" fill="#a5f3ec" />
      </svg>
      <span>
        Shot<em>Worker</em>
      </span>
    </Link>
  );
}

export default function App() {
  return (
    <div className="site">
      <header className="site-header">
        <div className="wrap header-inner">
          <Logo />
          <nav className="site-nav">
            <NavLink to="/tools/image-background-remover">Image BG Remover</NavLink>
            <NavLink to="/tools/gif-background-remover">GIF BG Remover</NavLink>
          </nav>
          <Link to="/tools/image-background-remover" className="btn btn-primary btn-small header-cta">
            Try free
          </Link>
        </div>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <Logo />
            <p>AI Product Photography &amp; Image Tools. Everything runs in your browser — files never leave your device.</p>
          </div>
          <div className="footer-col">
            <h4>Tools</h4>
            <Link to="/tools/image-background-remover">Image Background Remover</Link>
            <Link to="/tools/gif-background-remover">GIF Background Remover</Link>
            <span className="muted">White Background — soon</span>
            <span className="muted">AI Scenes — soon</span>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/privacy">Privacy</Link>
            <a href="mailto:hello@shotworker.com">hello@shotworker.com</a>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear()} ShotWorker. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
