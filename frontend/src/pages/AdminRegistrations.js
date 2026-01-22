import { useState, useEffect } from 'react';
import { Download, Users, Filter, Award, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState('');
  const [exporting, setExporting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchEvents();
    fetchRegistrations();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Failed to load user');
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [eventFilter]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events`, {
        credentials: 'include'
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events');
    }
  };

  const fetchRegistrations = async () => {
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.append('event_id', eventFilter);

      const response = await fetch(`${BACKEND_URL}/api/admin/registrations?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load registrations');
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (eventFilter) params.append('event_id', eventFilter);

      const response = await fetch(`${BACKEND_URL}/api/admin/registrations/export?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to export');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Export completed successfully');
    } catch (error) {
      toast.error('Failed to export registrations');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-registrations-title">
              All Registrations
            </h1>
            <p className="text-slate-600">{registrations.length} total registrations</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || registrations.length === 0}
            data-testid="export-button"
            className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>{exporting ? 'Exporting...' : 'Export to Excel'}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Filter className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event</label>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                data-testid="event-filter"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Events</option>
                {events.map((event) => (
                  <option key={event.event_id} value={event.event_id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Registrations List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center" data-testid="no-registrations-message">
            <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No registrations found</h2>
            <p className="text-slate-600">Registrations will appear here once students start signing up</p>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <RegistrationCard 
                key={registration.registration_id} 
                registration={registration}
                isSuperAdmin={currentUser?.role === 'superadmin'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RegistrationCard({ registration, isSuperAdmin }) {
  const event = registration.event;
  const user = registration.user;
  const registeredDate = new Date(registration.created_at);
  const [showCertModal, setShowCertModal] = useState(false);
  const [certType, setCertType] = useState('');

  const handleCancelRegistration = async () => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/registrations/${registration.registration_id}/cancel`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to cancel');
      toast.success('Registration cancelled successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to cancel registration');
    }
  };

  const handleDeleteRegistration = async () => {
    if (!window.confirm('Are you sure you want to DELETE this registration permanently? This action cannot be undone.')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/registrations/${registration.registration_id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Registration deleted successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Failed to delete registration');
    }
  };

  const handleIssueCertificate = async () => {
    if (!certType) {
      toast.error('Please select a certificate type');
      return;
    }
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/registrations/${registration.registration_id}/certificate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ certificate_type: certType })
      });
      if (!response.ok) throw new Error('Failed to issue certificate');
      toast.success('Certificate issued successfully');
      setShowCertModal(false);
      window.location.reload();
    } catch (error) {
      toast.error('Failed to issue certificate');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all" data-testid={`registration-card-${registration.registration_id}`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {event?.category || 'N/A'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              {registration.team_name ? 'Team' : 'Single'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              {registration.payment_status}
            </span>
            {registration.certificate_type && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-2">
                <Award className="w-3 h-3 mr-1" />
                {registration.certificate_type.charAt(0).toUpperCase() + registration.certificate_type.slice(1)} Certificate
              </span>
            )}
            {registration.status === 'cancelled' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                Cancelled
              </span>
            )}
            {registration.status === 'cancellation_requested' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ml-2">
                Cancellation Requested
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {event?.title || 'Event Not Found'}
          </h3>
          {registration.team_name && (
            <p className="text-indigo-600 font-semibold mb-2">Team: {registration.team_name}</p>
          )}
          <div className="text-sm text-slate-600">
            <p>Registered by: {user?.name || 'Unknown'} ({user?.email || 'N/A'})</p>
            <p>Date: {registeredDate.toLocaleString()}</p>
            <p>Registration ID: {registration.registration_id}</p>
          </div>
        </div>
      </div>
      {registration.status === 'cancelled' && (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 mt-2">
          Cancelled
        </span>
      )}

      {isSuperAdmin && (registration.status === 'active' || registration.status === 'cancellation_requested') && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowCertModal(true)}
            data-testid="issue-certificate-button"
            className="bg-green-50 hover:bg-green-100 text-green-700 rounded-lg px-4 py-2 font-medium transition-all flex items-center space-x-2"
          >
            <Award className="w-4 h-4" />
            <span>Issue Certificate</span>
          </button>
          <button
            onClick={handleCancelRegistration}
            data-testid="cancel-registration-button"
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-lg px-4 py-2 font-medium transition-all flex items-center space-x-2"
          >
            <XCircle className="w-4 h-4" />
            <span>{registration.status === 'cancellation_requested' ? 'Approve Cancellation' : 'Cancel'}</span>
          </button>
          <button
            onClick={handleDeleteRegistration}
            data-testid="delete-registration-button"
            className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-4 py-2 font-medium transition-all flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}

      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowCertModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Issue Certificate
            </h3>
            <div className="space-y-3 mb-6">
              {['participant', 'winner', '1st', '2nd', '3rd'].map((type) => (
                <label key={type} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                  <input
                    type="radio"
                    name="cert_type"
                    value={type}
                    checked={certType === type}
                    onChange={(e) => setCertType(e.target.value)}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-slate-900 font-medium capitalize">{type} {type.includes('st') || type.includes('nd') || type.includes('rd') ? 'Place' : ''}</span>
                </label>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCertModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg px-6 py-3 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleIssueCertificate}
                data-testid="confirm-issue-certificate"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-6 py-3 font-semibold shadow-lg transition-all"
              >
                Issue
              </button>
            </div>
          </div>
        </div>
      )}

      {registration.team_members && registration.team_members.length > 0 && (
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Team Members ({registration.team_members.length})</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {registration.team_members.map((member, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-3">
                <p className="font-medium text-slate-900">{member.name}</p>
                <p className="text-sm text-slate-600">{member.email}</p>
                <p className="text-sm text-slate-600">{member.phone}</p>
                <p className="text-sm text-slate-600">{member.college}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}