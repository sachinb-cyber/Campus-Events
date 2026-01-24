import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Copy, FileText } from 'lucide-react';
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

export default function ExtendedEventForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    event_type: 'single',
    team_size: 2,
    event_date: '',
    deadline: '',
    category: 'Technical',
    venue: '',
    rules: '',
    organizer_info: '',
    is_paid: false,
    custom_fields: [
      { id: 1, label: 'Name', type: 'text', required: true, options: [] }
    ]
  });

  const [nextFieldId, setNextFieldId] = useState(2);
  const [showPreview, setShowPreview] = useState(false);

  // Check if user is Super Admin
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          if (userData.role !== 'superadmin') {
            toast.error('Access denied. Only Super Admin can create extended event forms.');
            navigate('/');
          }
        } else {
          toast.error('Please login first');
          navigate('/superadmin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        toast.error('Authentication failed');
        navigate('/superadmin/login');
      } finally {
        setUserLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleEventChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddField = () => {
    const newField = {
      id: nextFieldId,
      label: `Field ${nextFieldId}`,
      type: 'text',
      required: false,
      options: []
    };
    setEventData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }));
    setNextFieldId(nextFieldId + 1);
  };

  const handleUpdateField = (fieldId, key, value) => {
    setEventData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId ? { ...field, [key]: value } : field
      )
    }));
  };

  const handleAddOption = (fieldId) => {
    setEventData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.map(field =>
        field.id === fieldId
          ? { ...field, options: [...(field.options || []), ''] }
          : field
      )
    }));
  };

  const handleUpdateOption = (fieldId, optionIndex, value) => {
    setEventData(prev => ({
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
    setEventData(prev => ({
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

  const handleDeleteField = (fieldId) => {
    if (eventData.custom_fields.length === 1) {
      toast.error('Event must have at least one field');
      return;
    }
    setEventData(prev => ({
      ...prev,
      custom_fields: prev.custom_fields.filter(field => field.id !== fieldId)
    }));
  };

  const handleDuplicateField = (fieldId) => {
    const fieldToDuplicate = eventData.custom_fields.find(f => f.id === fieldId);
    if (!fieldToDuplicate) return;

    const newField = {
      ...JSON.parse(JSON.stringify(fieldToDuplicate)),
      id: nextFieldId,
      label: `${fieldToDuplicate.label} (Copy)`
    };

    setEventData(prev => ({
      ...prev,
      custom_fields: [...prev.custom_fields, newField]
    }));
    setNextFieldId(nextFieldId + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...eventData,
        team_size: eventData.event_type === 'team' ? parseInt(eventData.team_size) : null
      };

      const response = await fetch(`${BACKEND_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create event');
      }

      toast.success('Event with extended form created successfully!');
      navigate('/admin/events');
    } catch (error) {
      toast.error(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-8 px-4">
      {userLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Verifying access...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Create Extended Event Form
          </h1>
          <p className="text-slate-600">Design custom registration forms for your events (Super Admin Only)</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Basic Details */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Event Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={eventData.title}
                  onChange={(e) => handleEventChange('title', e.target.value)}
                  placeholder="Enter event title"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={eventData.description}
                  onChange={(e) => handleEventChange('description', e.target.value)}
                  placeholder="Describe the event"
                  required
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Type *
                </label>
                <select
                  value={eventData.event_type}
                  onChange={(e) => handleEventChange('event_type', e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="single">Single Participant</option>
                  <option value="team">Team</option>
                </select>
              </div>

              {/* Team Size */}
              {eventData.event_type === 'team' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Team Size *
                  </label>
                  <input
                    type="number"
                    value={eventData.team_size}
                    onChange={(e) => handleEventChange('team_size', e.target.value)}
                    min="2"
                    required
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {/* Event Date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="datetime-local"
                  value={eventData.event_date}
                  onChange={(e) => handleEventChange('event_date', e.target.value)}
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Registration Deadline *
                </label>
                <input
                  type="datetime-local"
                  value={eventData.deadline}
                  onChange={(e) => handleEventChange('deadline', e.target.value)}
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  value={eventData.category}
                  onChange={(e) => handleEventChange('category', e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Technical">Technical</option>
                  <option value="Cultural">Cultural</option>
                  <option value="Sports">Sports</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Seminar">Seminar</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Venue *
                </label>
                <input
                  type="text"
                  value={eventData.venue}
                  onChange={(e) => handleEventChange('venue', e.target.value)}
                  placeholder="Event location"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Rules */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rules (Optional)
                </label>
                <textarea
                  value={eventData.rules}
                  onChange={(e) => handleEventChange('rules', e.target.value)}
                  placeholder="Event rules"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Organizer Info */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Organizer Info (Optional)
                </label>
                <textarea
                  value={eventData.organizer_info}
                  onChange={(e) => handleEventChange('organizer_info', e.target.value)}
                  placeholder="Organizer contact information"
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Is Paid */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_paid"
                  checked={eventData.is_paid}
                  onChange={(e) => handleEventChange('is_paid', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                />
                <label htmlFor="is_paid" className="ml-2 text-sm font-medium text-slate-700">
                  This is a paid event
                </label>
              </div>
            </div>
          </div>

          {/* Custom Fields Form Builder */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Registration Form Fields
              </h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg font-medium transition-all"
                >
                  <FileText className="w-4 h-4" />
                  {showPreview ? 'Edit' : 'Preview'}
                </button>
                <button
                  type="button"
                  onClick={handleAddField}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add Field
                </button>
              </div>
            </div>

            {showPreview ? (
              <FormPreview fields={eventData.custom_fields} />
            ) : (
              <div className="space-y-4">
                {eventData.custom_fields.map((field, index) => (
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
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-semibold shadow-lg transition-all"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              className="flex-1 h-12 bg-slate-200 hover:bg-slate-300 text-slate-900 rounded-lg font-semibold transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
        </div>
      )}
    </div>
  );
}

function FieldEditor({
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
    <div className="border-2 border-slate-200 rounded-xl p-6 bg-slate-50 hover:bg-white transition-colors">
      <div className="flex items-start justify-between mb-4">
        <span className="text-sm font-medium text-slate-600 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
          Field {index + 1}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDuplicate(field.id)}
            title="Duplicate field"
            className="p-2 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(field.id)}
            title="Delete field"
            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Field Label */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Field Label *
          </label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, 'label', e.target.value)}
            placeholder="e.g., Full Name, Email Address"
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        {/* Field Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Field Type *
          </label>
          <select
            value={field.type}
            onChange={(e) => onUpdate(field.id, 'type', e.target.value)}
            className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          >
            {FIELD_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Required */}
        <div className="flex items-end">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => onUpdate(field.id, 'required', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-indigo-600"
            />
            <span className="ml-2 text-sm font-medium text-slate-700">
              Required field
            </span>
          </label>
        </div>
      </div>

      {/* Options for Radio/Select */}
      {needsOptions && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-700">
              Options
            </label>
            <button
              type="button"
              onClick={() => onAddOption(field.id)}
              className="text-xs px-2 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded transition-all"
            >
              + Add Option
            </button>
          </div>
          <div className="space-y-2">
            {(field.options || []).map((option, optIdx) => (
              <div key={optIdx} className="flex gap-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => onUpdateOption(field.id, optIdx, e.target.value)}
                  placeholder={`Option ${optIdx + 1}`}
                  className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => onRemoveOption(field.id, optIdx)}
                  className="px-3 h-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all text-sm"
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
    <div className="bg-slate-50 rounded-xl p-8 space-y-6 border-2 border-indigo-200">
      <div className="text-center mb-8">
        <p className="text-sm text-slate-600">Live Preview</p>
      </div>

      {fields.map((field, index) => (
        <div key={field.id}>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {field.label} {field.required && <span className="text-red-600">*</span>}
          </label>

          {field.type === 'text' && (
            <input
              type="text"
              placeholder={field.label}
              disabled
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-400"
            />
          )}

          {field.type === 'textarea' && (
            <textarea
              placeholder={field.label}
              disabled
              rows={3}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-400"
            />
          )}

          {field.type === 'number' && (
            <input
              type="number"
              placeholder={field.label}
              disabled
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-400"
            />
          )}

          {field.type === 'email' && (
            <input
              type="email"
              placeholder={field.label}
              disabled
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-400"
            />
          )}

          {field.type === 'phone' && (
            <input
              type="tel"
              placeholder={field.label}
              disabled
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-400"
            />
          )}

          {field.type === 'date' && (
            <input
              type="date"
              disabled
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-400"
            />
          )}

          {field.type === 'checkbox' && (
            <input
              type="checkbox"
              disabled
              className="w-4 h-4 rounded border-slate-300"
            />
          )}

          {field.type === 'radio' && (
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <label key={idx} className="flex items-center">
                  <input
                    type="radio"
                    disabled
                    className="w-4 h-4 rounded-full border-slate-300"
                  />
                  <span className="ml-2 text-slate-400">{option || `Option ${idx + 1}`}</span>
                </label>
              ))}
            </div>
          )}

          {field.type === 'select' && (
            <select disabled className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-slate-400">
              <option>Select an option</option>
              {(field.options || []).map((option, idx) => (
                <option key={idx} disabled>{option || `Option ${idx + 1}`}</option>
              ))}
            </select>
          )}

          {field.type === 'file' && (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-white">
              <p className="text-sm text-slate-400">File upload field</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
