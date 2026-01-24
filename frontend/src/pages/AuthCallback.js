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
      console.log('=== AuthCallback DEBUG START ===');
      console.log('Full URL:', window.location.href);
      console.log('Hash:', hash);
      console.log('Search:', search);
      console.log('Processing auth response', { hash: hash.substring(0, 100), search: search.substring(0, 100) });
      const sessionIdMatch = hash.match(/session_id=([^&]+)/) || search.match(/[?&]session_id=([^&]+)/);

      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        console.log('✓ Found session_id:', sessionId);
        try {
          console.log('→ Calling /api/auth/session endpoint...');
          const response = await fetch(`${BACKEND_URL}/api/auth/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ session_id: sessionId })
          });

          console.log('← Response status:', response.status);
          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Session exchange failed: ${response.status} ${errText}`);
          }

          const user = await response.json();
          console.log('✓ Session exchange successful, user:', user);
          toast.success(`Welcome, ${user.name}!`);

          console.log('→ Redirecting based on role:', user.role);
          if (user.role === 'admin') {
            console.log('→ Redirecting to /rcpitadmin/login');
            navigate('/rcpitadmin/login', { state: { user }, replace: true });
          } else {
            console.log('→ Redirecting to /login');
            navigate('/login', { state: { user }, replace: true });
          }
          return;
        } catch (error) {
          console.error('✗ Session exchange failed:', error);
          console.error('Error details:', error.message);
          toast.error(`Authentication failed: ${error.message}`);
          console.log('→ Redirecting to /login due to error');
          navigate('/login');
          return;
        }
      }

      // If no session_id, check for Supabase tokens (access_token) in redirect
      const accessTokenMatch = hash.match(/access_token=([^&]+)/) || search.match(/[?&]access_token=([^&]+)/);
      console.log('Token matching results:', { 
        hasHashToken: hash.match(/access_token=([^&]+)/) ? true : false,
        hasSearchToken: search.match(/[?&]access_token=([^&]+)/) ? true : false,
        accessTokenMatch: accessTokenMatch ? 'found' : 'not found'
      });
      
      if (accessTokenMatch) {
        const accessToken = accessTokenMatch[1];
        console.log('✓ Found access_token, token length:', accessToken.length, ', first 50 chars:', accessToken.substring(0, 50) + '...');
        
        // If no backend URL, store token in localStorage and redirect
        if (!BACKEND_URL) {
          console.warn('⚠ BACKEND_URL not configured, using local token storage');
          localStorage.setItem('supabase_token', accessToken);
          navigate('/', { replace: true });
          return;
        }
        
        console.log('→ Calling /api/auth/exchange-supabase endpoint...');
        console.log('Backend URL:', BACKEND_URL);
        try {
          const response = await fetch(`${BACKEND_URL}/api/auth/exchange-supabase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ access_token: accessToken })
          });

          console.log('← Response status:', response.status);
          console.log('← Response headers:', {
            'Content-Type': response.headers.get('Content-Type'),
            'Content-Length': response.headers.get('Content-Length')
          });
          
          if (!response.ok) {
            const errText = await response.text();
            console.log('← Error response body:', errText);
            let errData = {};
            try {
              errData = JSON.parse(errText);
            } catch (e) {
              // If not JSON, just use empty object
            }
            const errorDetail = errData.detail || response.statusText;
            throw new Error(`Token exchange failed (${response.status}): ${errorDetail}`);
          }

          const responseText = await response.text();
          console.log('← Response body (raw):', responseText);
          const user = JSON.parse(responseText);
          console.log('✓ Exchange successful, user:', user);
          toast.success(`Welcome, ${user.name}!`);
          
          // Store user in localStorage as fallback
          localStorage.setItem('auth_user', JSON.stringify(user));
          console.log('✓ User stored in localStorage');
          
          // Start session refresh timer - refresh every 50 minutes (before 1 hour expiration)
          const refreshInterval = 50 * 60 * 1000; // 50 minutes
          const refreshTimer = setInterval(async () => {
            try {
              const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              });
              if (refreshResponse.ok) {
                const refreshedUser = await refreshResponse.json();
                localStorage.setItem('auth_user', JSON.stringify(refreshedUser.user));
                console.log('✓ Session refreshed successfully');
              }
            } catch (error) {
              console.warn('⚠ Session refresh failed, will require re-login:', error);
            }
          }, refreshInterval);
          localStorage.setItem('sessionRefreshTimer', refreshTimer);
          
          console.log('→ Redirecting based on role:', user.role);
          if (user.role === 'admin') {
            console.log('→ Redirecting to /admin');
            navigate('/admin', { state: { user }, replace: true });
          } else if (user.role === 'superadmin') {
            console.log('→ Redirecting to /superadmin/panel');
            navigate('/superadmin/panel', { state: { user }, replace: true });
          } else {
            console.log('→ Redirecting to / (home page)');
            navigate('/', { state: { user }, replace: true });
          }
          return;
        } catch (error) {
          console.error('✗ Supabase exchange failed:', error);
          console.error('Error details:', error.message);
          const errorMsg = error.message || 'Authentication failed';
          toast.error(`Auth Error: ${errorMsg}`);
          console.log('→ Redirecting to /login due to error');
          navigate('/login');
          return;
        }
      }

      console.error('✗ No session_id or access_token found in URL');
      console.log('=== AuthCallback DEBUG END - FAILED ===');
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