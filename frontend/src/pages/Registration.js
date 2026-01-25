import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Registration() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [singleUserData, setSingleUserData] = useState({
    name: '', phone: '', college: '', department: '', year: '', prn: '', email: ''
  });
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [teamMembers, setTeamMembers] = useState([
    { name: '', email: '', phone: '', college: '', department: '', year: '', prn: '' }
  ]);
  const [customFormData, setCustomFormData] = useState({});

  const fetchUserAndEvent = useCallback(async () => {
    try {
      // Fetch user profile
      const userResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: 'include'
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
        // Pre-fill single user data
        setSingleUserData({
          name: userData.name || '',
          phone: userData.phone || '',
          college: userData.college || '',
          department: userData.department || '',
          year: userData.year || '',
          prn: userData.prn || '',
          email: userData.email || ''
        });
        // Check if profile is complete
        const profileComplete = userData.name && userData.college && userData.department && userData.year;
        setIsProfileComplete(profileComplete);
      }

      // Fetch event
      const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load event');
      const data = await response.json();
      setEvent(data);

      if (data.event_type === 'team') {
        const members = Array(data.team_size).fill(null).map(() => ({
          name: '', email: '', phone: '', college: '', department: '', year: '', prn: ''
        }));
        setTeamMembers(members);
      }
    } catch (error) {
      toast.error('Failed to load event');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    fetchUserAndEvent();
  }, [eventId, fetchUserAndEvent]);

  const handleMemberChange = (index, field, value) => {
    const updated = [...teamMembers];
    updated[index][field] = value;
    setTeamMembers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        event_id: eventId
      };

      if (event.event_type === 'team') {
        // Validate all team members
        const isValid = teamMembers.every(m => m.name && m.email && m.phone && m.college);
        if (!isValid) {
          toast.error('Please fill in all team member details');
          setSubmitting(false);
          return;
        }
        if (!teamName.trim()) {
          toast.error('Please enter a team name');
          setSubmitting(false);
          return;
        }
        payload.team_name = teamName;
        payload.team_members = teamMembers;
      }

      // Include custom form data if event has custom fields
      if (event.custom_fields && event.custom_fields.length > 0) {
        // Validate required custom fields
        for (const field of event.custom_fields) {
          if (field.required && !customFormData[field.id]) {
            toast.error(`Please fill in required field: ${field.label}`);
            setSubmitting(false);
            return;
          }
        }
        payload.custom_fields = customFormData;
      }

      const response = await fetch(`${BACKEND_URL}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Registration failed');
      }

      const data = await response.json();
      toast.success('Registration successful!');
      navigate('/my-registrations');
    } catch (error) {
      toast.error(error.message || 'Failed to register');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(`/events/${eventId}`)}
          data-testid="back-to-event-button"
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-6 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Event</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="registration-title">
            Register for {event.title}
          </h1>
          <p className="text-slate-600 mb-8">
            {event.event_type === 'team' ? `Complete the form below for your team of ${event.team_size}` : 'Complete the form below to register'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {event.event_type === 'team' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  data-testid="team-name-input"
                  required
                  className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="Enter your team name"
                />
              </div>
            )}

            {event.event_type === 'team' ? (
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Team Members ({event.team_size})
                </h2>
                {teamMembers.map((member, index) => (
                  <div key={index} className="bg-slate-50 rounded-xl p-4 mb-4" data-testid={`team-member-${index}`}>
                    <h3 className="font-semibold text-slate-900 mb-3">Member {index + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                        <input
                          type="text"
                          value={member.name}
                          onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                          data-testid={`member-${index}-name`}
                          required
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                        <input
                          type="email"
                          value={member.email}
                          onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                          data-testid={`member-${index}-email`}
                          required
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Phone *</label>
                        <input
                          type="tel"
                          value={member.phone}
                          onChange={(e) => handleMemberChange(index, 'phone', e.target.value)}
                          data-testid={`member-${index}-phone`}
                          required
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">College *</label>
                        <input
                          type="text"
                          value={member.college}
                          onChange={(e) => handleMemberChange(index, 'college', e.target.value)}
                          data-testid={`member-${index}-college`}
                          required
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                        <input
                          type="text"
                          value={member.department || ''}
                          onChange={(e) => handleMemberChange(index, 'department', e.target.value)}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                        <select
                          value={member.year || ''}
                          onChange={(e) => handleMemberChange(index, 'year', e.target.value)}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select Year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">PRN</label>
                        <input
                          type="text"
                          value={member.prn || ''}
                          onChange={(e) => handleMemberChange(index, 'prn', e.target.value)}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-indigo-900 font-medium text-sm">
                        Your registration details (from your profile)
                      </p>
                      <p className="text-xs text-indigo-700 mt-1">
                        {isProfileComplete ? '✓ Profile Complete' : '⚠ Profile Incomplete'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/profile')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium transition-all"
                    >
                      Edit Profile
                    </button>
                  </div>
                  <p className="text-xs text-indigo-700">Email (locked): {user?.email}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                    <div className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center text-slate-700 font-medium">
                      {singleUserData.name || '(Not set)'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <div className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center text-slate-700">
                      {singleUserData.phone || '(Not set)'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">College</label>
                    <div className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center text-slate-700">
                      {singleUserData.college || '(Not set)'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Department</label>
                    <div className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center text-slate-700">
                      {singleUserData.department || '(Not set)'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                    <div className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center text-slate-700">
                      {singleUserData.year || '(Not set)'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">PRN</label>
                    <div className="w-full h-12 px-4 bg-slate-100 border border-slate-200 rounded-lg flex items-center text-slate-700">
                      {singleUserData.prn || '(Not set)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {event.custom_fields && event.custom_fields.length > 0 && (
              <div className="border-t border-slate-200 pt-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Additional Information
                </h2>
                <div className="space-y-4">
                  {event.custom_fields.map((field) => (
                    <CustomFormField
                      key={field.id}
                      field={field}
                      value={customFormData[field.id] || ''}
                      onChange={(value) => setCustomFormData({...customFormData, [field.id]: value})}
                    />
                  ))}
                </div>
              </div>
            )}

            {event.registration_fee > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700">Registration Fee</p>
                <p className="text-2xl font-bold text-orange-600">₹ {event.registration_fee}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              data-testid="submit-registration-button"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-4 font-bold shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CustomFormField({ field, value, onChange }) {
  if (field.type === 'text') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    );
  }

  if (field.type === 'textarea') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          rows={3}
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    );
  }

  if (field.type === 'email') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    );
  }

  if (field.type === 'phone') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    );
  }

  if (field.type === 'date') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={value === true || value === 'true'}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600"
        />
        <label className="text-sm font-medium text-slate-700">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
      </div>
    );
  }

  if (field.type === 'radio') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <div className="space-y-2">
          {(field.options || []).map((option, idx) => (
            <label key={idx} className="flex items-center space-x-3">
              <input
                type="radio"
                name={field.id}
                value={option}
                checked={value === option}
                onChange={(e) => onChange(e.target.value)}
                required={field.required}
                className="w-4 h-4 rounded-full border-slate-300 text-indigo-600"
              />
              <span className="text-slate-700">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select an option</option>
          {(field.options || []).map((option, idx) => (
            <option key={idx} value={option}>{option}</option>
          ))}
        </select>
      </div>
    );
  }

  if (field.type === 'file') {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          {field.label} {field.required && <span className="text-red-600">*</span>}
        </label>
        <input
          type="file"
          onChange={(e) => onChange(e.target.files?.[0]?.name || '')}
          required={field.required}
          className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
    );
  }

  return null;
}