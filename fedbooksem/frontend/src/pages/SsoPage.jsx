import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ssoUser } from '../api/client';
import { useAuth } from '../context/AuthContext';

// Passwordless landing page for users coming in from Intelligent Bookstore.
// Reads ?username= (and optional ?displayName=) from the URL, calls
// /api/auth/sso, stores the JWT via AuthContext, then redirects.
//
// Errors surface inline instead of throwing the visitor into the login page
// so it's obvious what went wrong (missing username, backend down, etc.).
export default function SsoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const ran = useRef(false); // React 18 StrictMode double-invokes effects in dev

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const username = (params.get('username') || '').trim();
    const displayName = (params.get('displayName') || '').trim();
    const next = params.get('next') || '/books';

    if (!username) {
      setError('No username passed. Log in from the Intelligent Bookstore first, then click FedBook.');
      return;
    }

    ssoUser(username, displayName)
      .then((data) => {
        login({ ...data.actor, token: data.token });
        navigate(next, { replace: true });
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.message || 'SSO failed.';
        setError(msg);
      });
  }, [params, login, navigate]);

  return (
    <div className="container" style={{ paddingTop: 96, textAlign: 'center' }}>
      {error ? (
        <>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 12 }}>
            Couldn't sign you in
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>{error}</p>
          <a href="/login" className="btn btn-primary">Use FedBook login instead</a>
        </>
      ) : (
        <>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 28, marginBottom: 12 }}>
            Signing you in…
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>One moment.</p>
        </>
      )}
    </div>
  );
}
