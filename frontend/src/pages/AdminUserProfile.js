import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, BookOpen, Hash, MapPin, Calendar, User as UserIcon, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminUserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/users/${userId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load user');
      const userData = await response.json();
      setUser(userData);

      // Fetch user registrations
      const regResponse = await fetch(`${BACKEND_URL}/api/admin/registrations?user_id=${userId}`, {
        credentials: 'include'
      });
      if (regResponse.ok) {
        const regData = await regResponse.json();
        setRegistrations(Array.isArray(regData) ? regData : []);
      }
    } catch (error) {
      toast.error('Failed to load user details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">User not found</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-16 h-16 rounded-full border-4 border-white"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <UserIcon className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'Student'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-2">
                  {user.is_blocked ? (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span className="font-medium">Blocked</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Active</span>
                    </>
                  )}
                </div>
                {user.profile_complete ? (
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    Profile Complete
                  </span>
                ) : (
                  <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                    Profile Incomplete
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Contact Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                  <Mail className="w-6 h-6 text-indigo-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Email</p>
                    <p className="text-lg font-semibold text-slate-900 break-all">{user.email}</p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                  <Phone className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Mobile Number</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.phone ? `+91 ${user.phone}` : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Academic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PRN */}
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                  <Hash className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">PRN (Registration Number)</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.prn || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* College */}
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                  <MapPin className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">College</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.college || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Department */}
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                  <BookOpen className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Department</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.department || 'Not provided'}
                    </p>
                  </div>
                </div>

                {/* Year */}
                <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl">
                  <Calendar className="w-6 h-6 text-pink-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Year</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {user.year || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Account Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-600">User ID</p>
                  <p className="text-sm font-mono text-slate-900 break-all">{user.user_id}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm font-medium text-slate-600">Joined On</p>
                  <p className="text-sm text-slate-900">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Registrations */}
            {registrations.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Event Registrations ({registrations.length})
                </h2>
                <div className="space-y-3">
                  {registrations.map((reg) => (
                    <div
                      key={reg.registration_id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{reg.event_name}</p>
                          <p className="text-sm text-slate-600">
                            Status: {reg.payment_status === 'completed' ? '✓ Confirmed' : '⏳ Pending'}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          reg.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reg.payment_status === 'completed' ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      {reg.team_name && (
                        <p className="text-sm text-slate-600 mt-2">Team: {reg.team_name}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
