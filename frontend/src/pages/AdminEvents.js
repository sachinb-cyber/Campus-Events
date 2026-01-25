import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, Settings, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Multiple Choice' },
  { value: 'select', label: 'Dropdown' },
  { value: 'file', label: 'File Upload' }
];

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [useExtendedForm, setUseExtendedForm] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchEvents();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data);
      }
    } catch (error) {
      console.error('Failed to load user');
    }
  };

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
    setUseExtendedForm(false);
    setShowModal(true);
  };

  const handleCreateExtended = () => {
    setEditingEvent(null);
    setUseExtendedForm(true);
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
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              data-testid="create-event-button"
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden md:inline">Create Event</span>
            </button>
          </div>
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
          isSuperAdmin={user?.role === 'superadmin'}
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

function EventModal({ event, onClose, onSuccess, isSuperAdmin }) {
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
    is_paid: event?.is_paid || false,
    registration_fee: event?.registration_fee || 0,
    custom_fields: event?.custom_fields || []
  });
  const [submitting, setSubmitting] = useState(false);
  const [showCustomFields, setShowCustomFields] = useState(event?.custom_fields?.length > 0 || false);
  const [nextFieldId, setNextFieldId] = useState(event?.custom_fields?.length > 0 ? Math.max(...event.custom_fields.map(f => f.id)) + 1 : 1);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        team_size: formData.event_type === 'team' ? parseInt(formData.team_size) : null,
        registration_fee: parseInt(formData.registration_fee) || 0
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

  const handleAddField = () => {
    const newField = {
      id: nextFieldId,
      label: `Field ${nextFieldId}`,
      type: 'text',
      required: false,
      options: []
    };
    setFormData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }));
    setNextFieldId(nextFieldId + 1);
  };

  const handleUpdateField = (fieldId, key, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId ? { ...field, [key]: value } : field
      )
    }));
  };

  const handleDeleteField = (fieldId) => {
    if (formData.custom_fields.length === 1) {
      toast.error('Event must have at least one field');
      return;
    }
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter(field => field.id !== fieldId)
    }));
  };

  const handleDuplicateField = (fieldId) => {
    const fieldToDuplicate = formData.custom_fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField = {
      ...JSON.parse(JSON.stringify(fieldToDuplicate)),
      id: nextFieldId,
      label: `${fieldToDuplicate.label} (Copy)`
    };

    setFormData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }));
    setNextFieldId(nextFieldId + 1);
  };

  const handleAddOption = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), ''] }
          : field
      )
    }));
  };

  const handleUpdateOption = (fieldId, optionIndex, value) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              )
            }
          : field
      )
    }));
  };

  const handleRemoveOption = (fieldId, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId
          ? {
              ...field,
              options: field.options.filter((_, idx) => idx !== optionIndex)
            }
          : field
      )
    }));
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
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      checked={!formData.is_paid}
                      onChange={() => setFormData({ ...formData, is_paid: false, registration_fee: 0 })}
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
                {formData.is_paid && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fee Amount (₹)</label>
                    <input
                      type="number"
                      value={formData.registration_fee}
                      onChange={(e) => setFormData({ ...formData, registration_fee: e.target.value })}
                      min="0"
                      step="10"
                      className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            </div>

            {isSuperAdmin && (
              <div className="md:col-span-2 border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Custom Form Fields (Optional)</h3>
                  <button
                    type="button"
                    onClick={() => setShowCustomFields(!showCustomFields)}
                    className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-all"
                  >
                    {showCustomFields ? 'Hide' : 'Show'}
                  </button>
                </div>
                {showCustomFields && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600">Add custom registration form fields. Users will be asked to fill these when registering.</p>
                    <div className="space-y-3">
                      {formData.custom_fields.map((field, index) => (
                        <FieldEditor
                          key={field.id}
                          field={field}
                          index={index}
                          onUpdate={handleUpdateField}
                          onDelete={handleDeleteField}
                          onDuplicate={handleDuplicateField}
                          onAddOption={handleAddOption}
                          onUpdateOption={handleUpdateOption}
                          onRemoveOption={handleRemoveOption}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Field
                    </button>
                  </div>
                )}
              </div>
            )}
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

function ExtendedFieldEditor({
  field,
  index,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddOption,
  onUpdateOption,
  onRemoveOption
}) {
  const needsOptions = ['radio', 'select'].includes(field.type);

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-indigo-700 bg-indigo-100 px-2 py-1 rounded">
          Field {index + 1}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(field.id)}
            className="p-1 hover:bg-indigo-100 text-indigo-600 rounded text-sm"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(field.id)}
            className="p-1 hover:bg-red-100 text-red-600 rounded text-sm"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-600 mb-1">Label *</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, 'label', e.target.value)}
            className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Type *</label>
          <select
            value={field.type}
            onChange={(e) => onUpdate(field.id, 'type', e.target.value)}
            className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-sm"
          >
            {FIELD_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate(field.id, 'required', e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="ml-2 text-xs text-slate-700">Required</span>
          </label>
        </div>
      </div>

      {needsOptions && (
        <div className="mt-3 pt-3 border-t border-slate-200">
          <div className="flex justify-between mb-2">
            <label className="text-xs font-medium text-slate-700">Options</label>
            <button
              type="button"
              onClick={() => onAddOption(field.id)}
              className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200"
            >
              + Add
            </button>
          </div>
          <div className="space-y-1">
            {(field.options || []).map((option, optIdx) => (
              <div key={optIdx} className="flex gap-1">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOption(field.id, optIdx, e.target.value)}
                  className="flex-1 h-7 px-2 bg-white border border-slate-200 rounded text-xs"
                />
                <button
                  type="button"
                  onClick={() => onRemoveOption(field.id, optIdx)}
                  className="px-2 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FormPreview({ fields }) {
  return (
    <div className="bg-slate-100 rounded-lg p-6 space-y-4 border-2 border-indigo-200">
      <p className="text-xs text-slate-600 text-center">Live Preview</p>
      {fields.map((field) => (
        <div key={field.id}>
          <label className="block text-xs font-medium text-slate-700 mb-2">
            {field.label} {field.required && <span className="text-red-600">*</span>}
          </label>
          {field.type === 'text' && (
            <input type="text" disabled className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-sm" />
          )}
          {field.type === 'textarea' && (
            <textarea disabled rows={2} className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm" />
          )}
          {['number', 'email', 'phone', 'date'].includes(field.type) && (
            <input type={field.type} disabled className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-sm" />
          )}
          {field.type === 'checkbox' && (
            <input type="checkbox" disabled className="w-4 h-4 rounded" />
          )}
          {field.type === 'radio' && (
            <div className="space-y-1">
              {(field.options || []).map((opt, i) => (
                <label key={i} className="flex items-center text-sm">
                  <input type="radio" disabled className="w-4 h-4" />
                  <span className="ml-2">{opt}</span>
                </label>
              ))}
            </div>
          )}
          {field.type === 'select' && (
            <select disabled className="w-full h-8 px-2 bg-white border border-slate-200 rounded text-sm">
              <option>Select</option>
              {(field.options || []).map((opt, i) => (
                <option key={i}>{opt}</option>
              ))}
            </select>
          )}
          {field.type === 'file' && (
            <div className="border-2 border-dashed border-slate-300 rounded p-4 text-center text-xs text-slate-400">
              File upload
            </div>
          )}
        </div>
      ))}
    </div>
  );
}