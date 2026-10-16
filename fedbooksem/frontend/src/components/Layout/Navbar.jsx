import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Matches lucide-react's BookOpen icon used on the Intelligent Bookstore
// navbar, inlined to avoid pulling in the lucide dependency for one glyph.
function BookOpenIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
  );
}

function NavAvatar({ user }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.displayName} className="avatar" style={{ width: 32, height: 32 }} />;
  }
  return (
    <div className="avatar" style={{ width: 32, height: 32, fontSize: 14 }}>
      {user.displayName?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
    </div>
  );
}

// External landing page — Intelligent Bookstore (the shared team frontend that
// hosts Discover, book grid, and SSO entry). "Home" jumps back there rather
// than to FedBook's own landing, since FedBook is a nested surface reached
// from IB. Override in dev by setting REACT_APP_IB_HOME_URL in .env.
const IB_HOME_URL = process.env.REACT_APP_IB_HOME_URL || 'https://r26-it-107.vercel.app/';

// Sign-out removed: auth is owned by Intelligent Bookstore. FedBook receives
// users via /sso; if they want to end their session they do it from IB.
export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 8, background: 'var(--gold-strong)', color: '#fff' }}>
          <BookOpenIcon />
        </span>
        Intelligent <span style={{ color: 'var(--gold)' }}>Bookstore</span>
      </Link>
      <div className="navbar-links">
        <a href={IB_HOME_URL}>Home</a>
        <Link to="/books">Library</Link>
        <Link to="/people">People</Link>
        {user && <Link to="/reading">Reading</Link>}
      </div>
      <div className="flex items-center gap-sm">
        {user && (
          <Link to={`/users/${user.username}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: 'inherit' }}>
            <NavAvatar user={user} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>@{user.username}</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
