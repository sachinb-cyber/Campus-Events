import { Chrome, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'

export default function SuperAdminLogin() {
  // ===== SUPERADMIN LOGIN (GOOGLE OAUTH ONLY) =====
  // Only superadmins can access /superadmin routes
  // Login uses same Google OAuth as students and admins
  // Backend assigns superadmin role based on email in SUPER_ADMIN_EMAILS env var
  // Currently: sachinb2800@gmail.com is the only superadmin
  // For production, update SUPER_ADMIN_EMAILS=your-superadmin-email@college.edu
  const navigate = useNavigate();

  const handleLogin = async () => {
    // Google OAuth flow through Supabase
    // Backend checks if email is in SUPER_ADMIN_EMAILS
    // Strict role check: only superadmin role gets access to /superadmin routes
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
      <div className="absolute inset-0 bg-purple-900/60 backdrop-blur-sm"></div>
      <div className="relative z-10 max-w-md w-full">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 text-white hover:text-purple-200 mb-6 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Super Admin
            </h1>
            <p className="text-slate-600">Full system access and control</p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-full px-6 py-3 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center space-x-3"
          >
            <Chrome className="w-5 h-5 text-purple-600" />
            <span>Sign in with Google</span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Not a super admin?{' '}
              <a href="/login" className="text-purple-600 hover:text-purple-700 font-medium">
                Student Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}