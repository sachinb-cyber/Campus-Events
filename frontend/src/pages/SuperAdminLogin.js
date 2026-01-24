import { Chrome, ArrowLeft, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient'

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState('google'); // 'google' or 'credentials'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
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
      toast.error('Google login failed');
    }
  };

  const handleCredentialsLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/superadmin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const user = await response.json();
      toast.success('Login successful!');
      
      // Store user data
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      // Redirect to superadmin panel
      navigate('/superadmin/panel');
    } catch (error) {
      toast.error(error.message || 'Invalid credentials');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

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

          {/* Login Method Tabs */}
          <div className="flex gap-2 mb-6 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setLoginMethod('google')}
              className={`flex-1 py-2 rounded font-medium transition-all ${
                loginMethod === 'google'
                  ? 'bg-white text-purple-600 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Chrome className="w-4 h-4 inline mr-2" />
              Google
            </button>
            <button
              onClick={() => setLoginMethod('credentials')}
              className={`flex-1 py-2 rounded font-medium transition-all ${
                loginMethod === 'credentials'
                  ? 'bg-white text-purple-600 shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Email
            </button>
          </div>

          {loginMethod === 'google' ? (
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-full px-6 py-3 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center space-x-3"
            >
              <Chrome className="w-5 h-5 text-purple-600" />
              <span>Sign in with Google</span>
            </button>
          ) : (
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="superadmin@college.edu"
                  required
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white rounded-full px-6 py-3 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Sign in</span>
                  </>
                )}
              </button>
            </form>
          )}

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