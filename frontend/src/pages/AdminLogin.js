import { Chrome, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'

export default function AdminLogin() {
  // ===== ADMIN LOGIN (GOOGLE OAUTH ONLY) =====
  // Admins log in with Google OAuth same as students
  // Backend assigns admin role based on email in ADMIN_EMAILS env var
  // No special login page - same Google flow as regular users
  // Email determines role at token exchange time
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Google OAuth flow through Supabase
    // After consent, redirects back with access_token
    // AuthCallback.js will call backend's /api/token-exchange
    // Backend checks if email is in ADMIN_EMAILS and assigns admin role
    const redirectTarget = process.env.REACT_APP_SUPABASE_REDIRECT || window.location.origin;
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTarget
        }
      });
    } catch (err) {
      console.error('Google sign in failed', err);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/28428587/pexels-photo-28428587.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-md w-full">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 text-white hover:text-indigo-200 mb-6 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Admin Login
            </h1>
            <p className="text-slate-600">Access admin dashboard</p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-full px-6 py-3 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center space-x-3"
          >
            <Chrome className="w-5 h-5 text-red-600" />
            <span>Sign in with Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Not an admin?{' '}
              <a href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Student Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

