import { useState, useEffect } from 'react';
import { Users, Shield, Ban, Check, Trash2, UserPlus, Award, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SuperAdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/users`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId) => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/users/${userId}/block`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to block user');
      toast.success('User blocked successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to block user');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/users/${userId}/unblock`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to unblock user');
      toast.success('User unblocked successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unblock user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This will also delete all their registrations.')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete user');
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: newAdminEmail, name: newAdminName })
      });
      if (!response.ok) throw new Error('Failed to add admin');
      toast.success('Admin added successfully');
      setShowAddAdmin(false);
      setNewAdminEmail('');
      setNewAdminName('');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to add admin');
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!window.confirm('Remove admin privileges from this user?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/admins/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to remove admin');
      toast.success('Admin removed successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to remove admin');
    }
  };

  const admins = users.filter(u => u.role === 'admin' || u.role === 'superadmin');
  const students = users.filter(u => u.role === 'user');

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="superadmin-panel-title">
              Super Admin Panel
            </h1>
            <p className="text-slate-600">Manage users, admins, and system settings</p>
          </div>
        </div>

        {/* Admin Management */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Admins ({admins.length})
              </h2>
            </div>
            <button
              onClick={() => setShowAddAdmin(true)}
              data-testid="add-admin-button"
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-2 font-semibold shadow-lg transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Add Admin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {admins.map((admin) => (
              <div key={admin.user_id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between" data-testid={`admin-card-${admin.user_id}`}>
                <div>
                  <p className="font-semibold text-slate-900">{admin.name}</p>
                  <p className="text-sm text-slate-600">{admin.email}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                    admin.role === 'superadmin' ? 'bg-purple-100 text-purple-800' : 'bg-indigo-100 text-indigo-800'
                  }`}>
                    {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                  </span>
                </div>
                {admin.role === 'admin' && (
                  <button
                    onClick={() => handleRemoveAdmin(admin.user_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Student Management */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Students ({students.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.user_id} className="bg-slate-50 rounded-xl p-4 flex items-center justify-between" data-testid={`student-card-${student.user_id}`}>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{student.name}</p>
                    <p className="text-sm text-slate-600">{student.email}</p>
                    {student.college && <p className="text-xs text-slate-500">{student.college}</p>}
                    {student.is_blocked && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                        Blocked
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {student.is_blocked ? (
                      <button
                        onClick={() => handleUnblockUser(student.user_id)}
                        data-testid={`unblock-${student.user_id}`}
                        className="bg-green-50 hover:bg-green-100 text-green-700 rounded-lg px-3 py-2 font-medium transition-all flex items-center space-x-1"
                      >
                        <Check className="w-4 h-4" />
                        <span>Unblock</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBlockUser(student.user_id)}
                        data-testid={`block-${student.user_id}`}
                        className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-3 py-2 font-medium transition-all flex items-center space-x-1"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Block</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(student.user_id)}
                      data-testid={`delete-${student.user_id}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg px-3 py-2 font-medium transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Add New Admin
            </h3>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  data-testid="new-admin-email"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  data-testid="new-admin-name"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg px-6 py-3 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="submit-add-admin"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-3 font-semibold shadow-lg transition-all"
                >
                  Add Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
