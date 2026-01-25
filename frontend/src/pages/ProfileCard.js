import { useState, useEffect } from 'react';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProfileCard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      // First try from localStorage (auth_user from OAuth)
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        console.log('Profile from localStorage:', storedUser);
        setLoading(false);
        return;
      }

      // Try from sessionStorage
      const sessionUser = sessionStorage.getItem('testUser');
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
        console.log('Profile from sessionStorage:', sessionUser);
        setLoading(false);
        return;
      }

      // Try from backend API
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.warn('Backend profile fetch failed:', response.status);
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data);
      localStorage.setItem('auth_user', JSON.stringify(data));
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20 pb-20">
        <div className="max-w-md mx-auto px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pt-20 pb-20">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <p className="text-slate-600 mb-4">No profile data available</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-2 font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-slate-100 pt-20 pb-20 md:pt-24 md:pb-8">
      <div className="max-w-md mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Background */}
          <div className="h-32 bg-gradient-to-r from-indigo-600 to-indigo-800"></div>

          {/* Profile Content */}
          <div className="px-6 py-8 text-center">
            {/* Avatar */}
            <div className="flex justify-center -mt-20 mb-6">
              <img
                src={user?.picture || 'https://via.placeholder.com/100'}
                alt={user?.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            </div>

            {/* Name */}
            <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {user?.name || 'User'}
            </h1>

            {/* Email */}
            <p className="text-indigo-600 font-medium mb-6">{user?.email}</p>

            {/* Role Badge */}
            <div className="inline-block">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                user?.role === 'admin' || user?.role === 'superadmin'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Student'}
              </span>
            </div>

            {/* Details Section */}
            <div className="mt-8 pt-8 border-t border-slate-200 space-y-4 text-left">
              {user?.phone && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Phone:</span>
                  <span className="text-slate-900">{user.phone}</span>
                </div>
              )}
              {user?.college && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">College:</span>
                  <span className="text-slate-900">{user.college}</span>
                </div>
              )}
              {user?.department && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Department:</span>
                  <span className="text-slate-900">{user.department}</span>
                </div>
              )}
              {user?.year && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Year:</span>
                  <span className="text-slate-900">{user.year}</span>
                </div>
              )}
              {user?.prn && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">PRN:</span>
                  <span className="text-slate-900">{user.prn}</span>
                </div>
              )}
            </div>

            {/* Edit Button */}
            <button
              onClick={() => navigate('/profile')}
              className="mt-8 w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all"
            >
              <Edit2 className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
