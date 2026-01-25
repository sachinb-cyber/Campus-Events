import { Chrome } from 'lucide-react'
import { supabase } from '../supabaseClient'

export default function Login() {
  // ===== STUDENT/USER LOGIN =====
  // Only uses Google OAuth (no username/password)
  // Users can be students or general participants
  // After login, role is determined on backend based on email
  const handleLogin = async () => {
    console.log('=== LOGIN DEBUG START ===');
    console.log('✓ handleLogin called');
    
    // Use Supabase OAuth for Google login
    // After user consents on Google, redirects back to REACT_APP_SUPABASE_REDIRECT
    // Supabase includes access_token in URL, AuthCallback.js extracts it
    const redirectTarget = process.env.REACT_APP_SUPABASE_REDIRECT || window.location.origin;
    console.log('→ Supabase OAuth redirect target:', redirectTarget);
    
    // Runtime check for configuration
    if (!process.env.REACT_APP_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY.includes('your-supabase-anon-key')) {
      console.warn('⚠ Supabase anon key looks missing or is a placeholder. Set REACT_APP_SUPABASE_ANON_KEY in frontend/.env');
    }
    try {
      console.log('→ Calling supabase.auth.signInWithOAuth with provider: google');
      // Initiates Google OAuth flow through Supabase
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTarget
        }
      });
      console.log('✓ Supabase signInWithOAuth call completed');
    } catch (err) {
      console.error('✗ Supabase signInWithOAuth failed:', err);
      console.log('=== LOGIN DEBUG END - FAILED ===');
      throw err;
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage:
          'url(https://images.pexels.com/photos/28428587/pexels-photo-28428587.jpeg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute inset-0 bg-indigo-900/60 backdrop-blur-sm"></div>

      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-2">
              Campus Events
            </h1>

            <p className="text-slate-600">
              Register for your favorite college events in just a few clicks
            </p>
          </div>

          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-full px-6 py-3 font-semibold shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center justify-center space-x-3"
          >
            <Chrome className="w-5 h-5 text-indigo-600" />
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-xs text-slate-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white text-sm">
            🎓 Join hundreds of students experiencing seamless event registration
          </p>
        </div>
      </div>
    </div>
  )
}
