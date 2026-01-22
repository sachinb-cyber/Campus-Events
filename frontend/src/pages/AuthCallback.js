import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AuthCallback() {
  // ===== OAUTH CALLBACK HANDLER =====
  // Called after Supabase redirects back from Google OAuth
  // Flow:
  // 1. User clicks "Login with Google"
  // 2. Redirected to Google login
  // 3. After consent, Supabase redirects back with access_token in URL hash
  // 4. This component extracts access_token and calls /api/token-exchange
  // 5. Backend exchanges token for session_id cookie
  // 6. Frontend stores user data in localStorage
  // 7. User is redirected to home page
  const navigate = useNavigate();
  const location = useLocation();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processSession = async () => {
      // Extract tokens from URL
      // Different OAuth providers return tokens in different places:
      // - Google: #access_token=... (hash)
      // - Some: ?access_token=... (query string)
      const hash = location.hash || '';
      const search = location.search || '';
      console.log('AuthCallback: Processing auth response', { hash: hash.substring(0, 100), search: search.substring(0, 100) });
      const sessionIdMatch = hash.match(/session_id=([^&]+)/) || search.match(/[?&]session_id=([^&]+)/);

      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ session_id: sessionId })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Session exchange failed: ${response.status} ${errText}`);
          }

          const user = await response.json();
          console.log('AuthCallback: Session exchange successful, user:', user);
          toast.success(`Welcome, ${user.name}!`);

          if (user.role === 'admin') {
            navigate('/rcpitadmin/login', { state: { user }, replace: true });
          } else {
            navigate('/login', { state: { user }, replace: true });
          }
          return;
        } catch (error) {
          console.error('AuthCallback: session exchange failed', error);
          toast.error(`Authentication failed: ${error.message}`);
          navigate('/login');
          return;
        }
      }

      // If no session_id, check for Supabase tokens (access_token) in redirect
      const accessTokenMatch = hash.match(/access_token=([^&]+)/) || search.match(/[?&]access_token=([^&]+)/);
      if (accessTokenMatch) {
        const accessToken = accessTokenMatch[1];
        console.log('AuthCallback: Found access_token, exchanging with backend...');
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/exchange-supabase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ access_token: accessToken })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errorDetail = errData.detail || response.statusText;
            throw new Error(`Token exchange failed (${response.status}): ${errorDetail}`);
          }

          const user = await response.json();
          console.log('AuthCallback: Exchange successful, user:', user);
          toast.success(`Welcome, ${user.name}!`);
          
          // Store user in localStorage as fallback
          localStorage.setItem('auth_user', JSON.stringify(user));
          
          if (user.role === 'admin') {
            navigate('/admin', { state: { user }, replace: true });
          } else if (user.role === 'superadmin') {
            navigate('/superadmin/panel', { state: { user }, replace: true });
          } else {
            navigate('/', { state: { user }, replace: true });
          }
          return;
        } catch (error) {
          console.error('AuthCallback: supabase exchange failed', error);
          const errorMsg = error.message || 'Authentication failed';
          toast.error(`Auth Error: ${errorMsg}`);
          navigate('/login');
          return;
        }
      }

      console.error('AuthCallback: no session_id or access_token found', { hash, search });
      toast.error('Invalid authentication response');
      navigate('/login');
    };

    processSession();
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Completing authentication...</p>
      </div>
    </div>
  );
}