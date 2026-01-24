import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import SuperAdminLogin from './pages/SuperAdminLogin';
import AuthCallback from './pages/AuthCallback';
import ProfileCompletion from './pages/ProfileCompletion';
import Home from './pages/Home';
import AuthDebug from './pages/AuthDebug';
import EventDetails from './pages/EventDetails';
import Registration from './pages/Registration';
import MyRegistrations from './pages/MyRegistrations';
import UserProfile from './pages/UserProfile';
import ProfileCard from './pages/ProfileCard';
import Help from './pages/Help';
import AdminDashboard from './pages/AdminDashboard';
import AdminEvents from './pages/AdminEvents';
import AdminRegistrations from './pages/AdminRegistrations';
import AdminTickets from './pages/AdminTickets';
import SuperAdminPanel from './pages/SuperAdminPanel';
import SystemSettings from './pages/SystemSettings';
import ExtendedEventForm from './pages/ExtendedEventForm';
import MobileNav from './components/MobileNav';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function AppRouter() {
  const location = useLocation();
  // Support session_id delivered either in the URL hash (#session_id=...) or
  // in the query string (?session_id=...). Some providers return one or the other.
  // Also support Supabase access_token in hash
  const hash = location.hash || '';
  const search = location.search || '';
  const hasSessionIdInHash = hash.includes('session_id=');
  const hasSessionIdInSearch = search.includes('session_id=');
  const hasAccessToken = hash.includes('access_token=') || search.includes('access_token=');
  const hasErrorInAuth = hash.includes('error=') || search.includes('error=');
  
  // Log auth redirect for debugging
  if (hasAccessToken || hasSessionIdInHash || hasSessionIdInSearch) {
    console.log('AppRouter: Detected OAuth callback, routing to AuthCallback');
    console.log('Auth URL params:', { hash: hash.substring(0, 100), search: search.substring(0, 100) });
  }
  
  if (hasSessionIdInHash || hasSessionIdInSearch || hasAccessToken) {
    return <AuthCallback />;
  }
  
  if (hasErrorInAuth) {
    console.error('AppRouter: OAuth error detected in URL:', { hash, search });
    return <Navigate to="/login" />;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
  <Route path="/auth-debug" element={<AuthDebug />} />
      <Route path="/rcpitadmin/login" element={<AdminLogin />} />
      <Route path="/superadmin/login" element={<SuperAdminLogin />} />
      <Route path="/complete-profile" element={location.state?.user ? <ProfileCompletion user={location.state.user} /> : <Navigate to="/login" />} />
      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/events/:eventId" element={<ProtectedRoute><EventDetails /></ProtectedRoute>} />
      <Route path="/register/:eventId" element={<ProtectedRoute><Registration /></ProtectedRoute>} />
      <Route path="/my-registrations" element={<ProtectedRoute><MyRegistrations /></ProtectedRoute>} />
      <Route path="/profile-card" element={<ProtectedRoute><ProfileCard /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
      <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
      <Route path="/admin/registrations" element={<AdminRoute><AdminRegistrations /></AdminRoute>} />
      <Route path="/admin/tickets" element={<AdminRoute><AdminTickets /></AdminRoute>} />
      <Route path="/superadmin/panel" element={<SuperAdminRoute><SuperAdminPanel /></SuperAdminRoute>} />
      <Route path="/superadmin/settings" element={<SuperAdminRoute><SystemSettings /></SuperAdminRoute>} />
      <Route path="/superadmin/create-extended-event" element={<SuperAdminRoute><ExtendedEventForm /></SuperAdminRoute>} />
    </Routes>
  );
}

function ProtectedRoute({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // ===== THREE-LAYER AUTH FALLBACK =====
    // This provides robustness for SPA environments with OAuth
    // Priority order: localStorage -> sessionStorage -> location.state -> backend
    // CRITICAL: Backend sends session_id as httponly cookie automatically
    
    // Layer 1: sessionStorage (test user in dev)
    const testUserStr = sessionStorage.getItem('testUser');
    if (testUserStr) {
      try {
        const testUser = JSON.parse(testUserStr);
        setUser(testUser);
        setIsAuthenticated(true);
        return;
      } catch (e) {
        console.error('Failed to parse testUser', e);
      }
    }

    // Layer 2: localStorage (OAuth user after AuthCallback.js token exchange)
    // This stores the user data returned from backend token-exchange endpoint
    const authUserStr = localStorage.getItem('auth_user');
    if (authUserStr) {
      try {
        const authUser = JSON.parse(authUserStr);
        setUser(authUser);
        setIsAuthenticated(true);
        return;
      } catch (e) {
        console.error('Failed to parse auth_user', e);
        localStorage.removeItem('auth_user');
      }
    }

    // Layer 3: location.state (passed during navigation)
    if (location.state?.user) {
      setUser(location.state.user);
      setIsAuthenticated(true);
      return;
    }

    // Layer 4: Backend API (session_id cookie sent automatically)
    // Only try backend if neither localStorage nor location.state exists
    const checkAuth = async () => {
      try {
        if (!BACKEND_URL) {
          console.warn('BACKEND_URL not set, auth check skipped');
          setIsAuthenticated(false);
          return;
        }
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [location.state]);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <>
      {children}
      <MobileNav user={user} />
    </>
  );
}

function AdminRoute({ children }) {
  // ===== ADMIN ROLE PROTECTION =====
  // Checks if user has admin OR superadmin role
  // Only admins and superadmins can access /admin, /admin/events, etc.
  // Non-admin users see "Access Denied" error page
  const [isAdmin, setIsAdmin] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      const userData = location.state.user;
      setUser(userData);
      // Allow both admin and superadmin roles
      setIsAdmin(userData.role === 'admin' || userData.role === 'superadmin');
      return;
    }

    // Try localStorage first (OAuth user data)
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAdmin(userData.role === 'admin' || userData.role === 'superadmin');
        if (userData.role !== 'admin' && userData.role !== 'superadmin') {
          setIsAdmin(false);
        }
        return;
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }

    // Backend validation with session_id cookie
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'  // Includes session_id httponly cookie
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setUser(userData);
        setIsAdmin(userData.role === 'admin' || userData.role === 'superadmin');
      } catch (error) {
        console.error('Admin auth check failed:', error);
        setIsAdmin(false);
      }
    };
    checkAuth();
  }, [location]);

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m6-8a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            You do not have permission to access the admin dashboard. Only authorized administrators can access this area.
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <MobileNav user={user} isAdmin={true} />
    </>
  );
}

function SuperAdminRoute({ children }) {
  // ===== SUPERADMIN ROLE PROTECTION =====
  // STRICT: Only allows superadmin role, NOT regular admins
  // SuperAdmins can: manage system settings, configure fields, manage admins
  // Regular admins cannot access /superadmin routes
  const [isSuperAdmin, setIsSuperAdmin] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.user) {
      const userData = location.state.user;
      setUser(userData);
      // STRICT: Only superadmin role allowed (not admin)
      setIsSuperAdmin(userData.role === 'superadmin');
      return;
    }

    // Try localStorage first
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsSuperAdmin(userData.role === 'superadmin');
        if (userData.role !== 'superadmin') {
          setIsSuperAdmin(false);
        }
        return;
      } catch (e) {
        console.error('Failed to parse stored user', e);
      }
    }

    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Not authenticated');
        const userData = await response.json();
        setUser(userData);
        setIsSuperAdmin(userData.role === 'superadmin');
      } catch (error) {
        console.error('Super admin auth check failed:', error);
        setIsSuperAdmin(false);
      }
    };
    checkAuth();
  }, [location]);

  if (isSuperAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 4v2m6-8a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Access Denied</h1>
          <p className="text-slate-600 mb-6">
            You do not have permission to access the super admin panel. Only super administrators can access this area.
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <MobileNav user={user} isAdmin={true} />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;