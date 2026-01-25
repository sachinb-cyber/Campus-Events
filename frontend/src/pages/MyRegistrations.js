import { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, CheckCircle, Clock, Eye } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/registrations`, {
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="my-registrations-title">
          My Registrations
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : registrations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center" data-testid="no-registrations-message">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No registrations yet</h2>
            <p className="text-slate-600 mb-6">Start exploring events and register for your favorites!</p>
            <a
              href="/"
              data-testid="browse-events-link"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {registrations.map((registration) => (
              <RegistrationCard key={registration.registration_id} registration={registration} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RegistrationCard({ registration }) {
  const event = registration.event;
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  if (!event) return null;

  const eventDate = new Date(event.event_date);
  const registeredDate = new Date(registration.created_at);

  const handleRequestCancellation = async () => {
    if (!window.confirm('Are you sure you want to request cancellation? Super admin will review your request.')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/registrations/${registration.registration_id}/request-cancellation`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to request cancellation');
      }
      toast.success('Cancellation request submitted. Super admin will review it.');
      window.location.reload();
    } catch (error) {
      toast.error(error.message || 'Failed to request cancellation');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all" data-testid={`registration-card-${registration.registration_id}`}>
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {event.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Registered
            </span>
            {registration.status === 'cancellation_requested' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                Cancellation Requested
              </span>
            )}
            {registration.status === 'cancelled' && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ml-2">
                Cancelled
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {event.title}
          </h2>
          {registration.team_name && (
            <p className="text-indigo-600 font-semibold mb-2">
              Team: {registration.team_name}
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0">
          <div className="bg-slate-100 rounded-lg px-4 py-2 text-center">
            <p className="text-xs text-slate-500">Registration ID</p>
            <p className="text-sm font-mono font-semibold text-slate-900">{registration.registration_id.slice(0, 12)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-xs text-slate-500">Event Date</p>
            <p className="text-slate-900 font-medium">{eventDate.toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-xs text-slate-500">Venue</p>
            <p className="text-slate-900 font-medium">{event.venue}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Clock className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-xs text-slate-500">Registered On</p>
            <p className="text-slate-900 font-medium">{registeredDate.toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-xs text-slate-500">Type</p>
            <p className="text-slate-900 font-medium">
              {registration.team_name ? `Team (${registration.team_members?.length || 0} members)` : 'Individual'}
            </p>
          </div>
        </div>
      </div>

      {registration.team_members && registration.team_members.length > 0 && (
        <div className="border-t border-slate-200 pt-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Team Members</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {registration.team_members.map((member, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-3">
                <p className="font-medium text-slate-900">{member.name}</p>
                <p className="text-sm text-slate-600">{member.email}</p>
                <p className="text-sm text-slate-600">{member.college}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">Payment Status:</span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            event.is_paid ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
          }`}>
            {event.is_paid ? registration.payment_status : 'Free'}
          </span>
        </div>
        <div className="flex gap-2">
          {(registration.custom_fields && Object.keys(registration.custom_fields).length > 0) && (
            <button
              onClick={() => setShowDetailsModal(true)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              View Responses
            </button>
          )}
          {registration.status === 'active' && (
            <button
              onClick={handleRequestCancellation}
              data-testid="request-cancellation-button"
              className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            >
              Request Cancellation
            </button>
          )}
        </div>
      </div>

      {showDetailsModal && (
        <RegistrationResponsesModal registration={registration} onClose={() => setShowDetailsModal(false)} />
      )}
    </div>
  );
}

function RegistrationResponsesModal({ registration, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Your Form Responses
          </h2>
          <p className="text-sm text-slate-600 mt-1">{registration.event?.title}</p>
        </div>

        <div className="p-6 space-y-4">
          {registration.custom_fields && Object.keys(registration.custom_fields).length > 0 ? (
            Object.entries(registration.custom_fields).map(([key, value]) => (
              <div key={key} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <label className="block text-xs font-medium text-slate-600 uppercase mb-2">{key}</label>
                <p className="text-slate-900 break-words whitespace-pre-wrap font-medium">
                  {typeof value === 'object' ? JSON.stringify(value) : value || '-'}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No form responses to display</p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6">
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}