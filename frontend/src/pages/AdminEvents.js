import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events`, {
        credentials: 'include'
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete event');
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to delete event');
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingEvent(null);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-events-title">
              Manage Events
            </h1>
            <p className="text-slate-600">Create, edit, and manage all events</p>
          </div>
          <button
            onClick={handleCreate}
            data-testid="create-event-button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden md:inline">Create Event</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center" data-testid="no-events-message">
            <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">No events yet</h2>
            <p className="text-slate-600 mb-6">Create your first event to get started!</p>
            <button
              onClick={handleCreate}
              data-testid="create-first-event-button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => (
              <EventRow key={event.event_id} event={event} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <EventModal
          event={editingEvent}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingEvent(null);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

function EventRow({ event, onEdit, onDelete }) {
  const eventDate = new Date(event.event_date);
  const deadline = new Date(event.deadline);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all" data-testid={`event-row-${event.event_id}`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div className="flex-1 mb-4 md:mb-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {event.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              {event.event_type === 'team' ? `Team (${event.team_size})` : 'Single'}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {event.status}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              event.is_paid ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {event.is_paid ? 'Paid' : 'Free'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {event.title}
          </h3>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600">
            <span>Event: {eventDate.toLocaleDateString()}</span>
            <span>Deadline: {deadline.toLocaleDateString()}</span>
            <span>{event.venue}</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(event)}
            data-testid={`edit-event-${event.event_id}`}
            className="bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg px-4 py-2 font-medium transition-all flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={() => onDelete(event.event_id)}
            data-testid={`delete-event-${event.event_id}`}
            className="bg-red-50 hover:bg-red-100 text-red-700 rounded-lg px-4 py-2 font-medium transition-all flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function EventModal({ event, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    event_type: event?.event_type || 'single',
    team_size: event?.team_size || 2,
    event_date: event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
    deadline: event?.deadline ? new Date(event.deadline).toISOString().slice(0, 16) : '',
    category: event?.category || 'Technical',
    venue: event?.venue || '',
    rules: event?.rules || '',
    organizer_info: event?.organizer_info || '',
    status: event?.status || 'active',
    is_paid: event?.is_paid || false
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        team_size: formData.event_type === 'team' ? parseInt(formData.team_size) : null
      };

      const url = event
        ? `${BACKEND_URL}/api/events/${event.event_id}`
        : `${BACKEND_URL}/api/events`;
      
      const method = event ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to save event');
      toast.success(event ? 'Event updated successfully' : 'Event created successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="event-modal">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6">
          <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
            {event ? 'Edit Event' : 'Create Event'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                data-testid="event-title-input"
                required
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                data-testid="event-description-input"
                required
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event Type *</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                data-testid="event-type-select"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="single">Single</option>
                <option value="team">Team</option>
              </select>
            </div>

            {formData.event_type === 'team' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Team Size *</label>
                <input
                  type="number"
                  value={formData.team_size}
                  onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                  data-testid="team-size-input"
                  min="2"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                data-testid="category-select"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Venue *</label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                data-testid="venue-input"
                required
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Event Date *</label>
              <input
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                data-testid="event-date-input"
                required
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Registration Deadline *</label>
              <input
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                data-testid="deadline-input"
                required
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {event && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  data-testid="status-select"
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Rules & Guidelines</label>
              <textarea
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                data-testid="rules-input"
                rows={3}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Organizer Info</label>
              <input
                type="text"
                value={formData.organizer_info}
                onChange={(e) => setFormData({ ...formData, organizer_info: e.target.value })}
                data-testid="organizer-input"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Registration Fee</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={!formData.is_paid}
                    onChange={() => setFormData({ ...formData, is_paid: false })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-slate-700">Free</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    checked={formData.is_paid}
                    onChange={() => setFormData({ ...formData, is_paid: true })}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-slate-700">Paid</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              data-testid="cancel-button"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg px-6 py-3 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              data-testid="save-event-button"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Saving...' : event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}