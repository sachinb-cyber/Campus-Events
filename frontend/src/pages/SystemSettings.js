import { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, Link as LinkIcon, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function SystemSettings() {
  const [config, setConfig] = useState({
    colleges: [],
    departments: [],
    divisions: [],
    years: [],
    popup_enabled: false,
    popup_type: 'instagram',
    popup_content: {},
    required_fields: [],
    social_links: {
      instagram: '',
      facebook: '',
      whatsapp: '',
      linkedin: '',
      twitter: '',
      youtube: '',
      website: ''
    },
    support_email: '',
    support_phone: '',
    help_link: '',
    terms_link: '',
    privacy_link: '',
    about_link: '',
    event_registration_enabled: true,
    max_team_size: 5,
    custom_footer_text: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [newCollege, setNewCollege] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newDivision, setNewDivision] = useState('');
  const [newYear, setNewYear] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/config`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load config');
      let data = await response.json();
      
      // Ensure all required arrays and objects exist
      data = {
        colleges: Array.isArray(data.colleges) ? data.colleges : [],
        departments: Array.isArray(data.departments) ? data.departments : [],
        divisions: Array.isArray(data.divisions) ? data.divisions : [],
        years: Array.isArray(data.years) ? data.years : [],
        popup_enabled: data.popup_enabled || false,
        popup_type: data.popup_type || 'instagram',
        popup_content: data.popup_content || {},
        required_fields: Array.isArray(data.required_fields) ? data.required_fields : [],
        social_links: data.social_links || {
          instagram: '',
          facebook: '',
          whatsapp: '',
          linkedin: '',
          twitter: '',
          youtube: '',
          website: ''
        },
        support_email: data.support_email || '',
        support_phone: data.support_phone || '',
        help_link: data.help_link || '',
        terms_link: data.terms_link || '',
        privacy_link: data.privacy_link || '',
        about_link: data.about_link || '',
        event_registration_enabled: data.event_registration_enabled !== false,
        max_team_size: data.max_team_size || 5,
        custom_footer_text: data.custom_footer_text || ''
      };
      
      setConfig(data);
      setError(null);
    } catch (error) {
      const errorMsg = 'Failed to load settings';
      toast.error(errorMsg);
      console.error(error);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/superadmin/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save');
      }
      toast.success('Settings saved successfully');
      setError(null);
      // Fetch the updated config to refresh
      await fetchConfig();
    } catch (error) {
      console.error('Save error:', error);
      const errorMsg = error.message || 'Failed to save settings';
      toast.error(errorMsg);
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const addCollege = () => {
    if (!newCollege.trim()) return;
    if (config.colleges.includes(newCollege.trim())) {
      toast.error('College already exists');
      return;
    }
    setConfig({
      ...config,
      colleges: [...config.colleges, newCollege.trim()]
    });
    setNewCollege('');
  };

  const removeCollege = (college) => {
    setConfig({
      ...config,
      colleges: config.colleges.filter(c => c !== college)
    });
  };

  const addDepartment = () => {
    if (!newDepartment.trim()) return;
    if (config.departments.includes(newDepartment.trim())) {
      toast.error('Department already exists');
      return;
    }
    setConfig({
      ...config,
      departments: [...config.departments, newDepartment.trim()]
    });
    setNewDepartment('');
  };

  const removeDepartment = (department) => {
    setConfig({
      ...config,
      departments: config.departments.filter(d => d !== department)
    });
  };

  const addDivision = () => {
    if (!newDivision.trim()) return;
    const divisionsList = config.divisions || [];
    if (divisionsList.includes(newDivision.trim())) {
      toast.error('Division already exists');
      return;
    }
    setConfig({
      ...config,
      divisions: [...divisionsList, newDivision.trim()]
    });
    setNewDivision('');
  };

  const removeDivision = (division) => {
    setConfig({
      ...config,
      divisions: (config.divisions || []).filter(d => d !== division)
    });
  };

  const addYear = () => {
    if (!newYear.trim()) return;
    const yearsList = config.years || [];
    if (yearsList.includes(newYear.trim())) {
      toast.error('Year already exists');
      return;
    }
    setConfig({
      ...config,
      years: [...yearsList, newYear.trim()]
    });
    setNewYear('');
  };

  const removeYear = (year) => {
    setConfig({
      ...config,
      years: (config.years || []).filter(y => y !== year)
    });
  };

  const toggleRequiredField = (field) => {
    const fields = config.required_fields || [];
    if (fields.includes(field)) {
      setConfig({
        ...config,
        required_fields: fields.filter(f => f !== field)
      });
    } else {
      setConfig({
        ...config,
        required_fields: [...fields, field]
      });
    }
  };

  const availableFields = ['name', 'email', 'phone', 'college', 'department', 'division', 'year', 'prn'];

  const initializeDefaultDivisions = () => {
    const defaultDivisions = ['AD1', 'AD2', 'AI', 'CE', 'CO1', 'CO2', 'CO3', 'DS1', 'DS2', 'EE', 'ET1', 'ET2', 'IT1', 'IT2', 'ME'];
    const existingDivisions = config.divisions || [];
    const newDivisions = defaultDivisions.filter(d => !existingDivisions.includes(d));
    
    setConfig({
      ...config,
      divisions: [...existingDivisions, ...newDivisions]
    });
    toast.success(`Added ${newDivisions.length} divisions`);
  };

  const initializeDefaultYears = () => {
    const defaultYears = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
    const existingYears = config.years || [];
    const newYears = defaultYears.filter(y => !existingYears.includes(y));
    
    setConfig({
      ...config,
      years: [...existingYears, ...newYears]
    });
    toast.success(`Added ${newYears.length} years`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="system-settings-title">
              System Settings
            </h1>
            <p className="text-slate-600">Configure colleges, departments, and registration settings</p>
          </div>
          <button
            onClick={saveConfig}
            disabled={saving}
            data-testid="save-settings"
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save All'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
            <p className="text-red-800 font-medium">{error}</p>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchConfig();
              }}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Colleges */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Colleges
              </h2>
              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={newCollege}
                  onChange={(e) => setNewCollege(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCollege()}
                  data-testid="college-input"
                  placeholder="Enter college name"
                  className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addCollege}
                  data-testid="add-college"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-2">
                {(config.colleges || []).map((college, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3" data-testid={`college-${idx}`}>
                    <span className="text-slate-900">{college}</span>
                    <button
                      onClick={() => removeCollege(college)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(config.colleges || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No colleges added yet</p>
                )}
              </div>
            </div>

            {/* Departments */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Departments
              </h2>
              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
                  data-testid="department-input"
                  placeholder="Enter department name"
                  className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addDepartment}
                  data-testid="add-department"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-2">
                {(config.departments || []).map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3" data-testid={`department-${idx}`}>
                    <span className="text-slate-900">{dept}</span>
                    <button
                      onClick={() => removeDepartment(dept)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(config.departments || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No departments added yet</p>
                )}
              </div>
            </div>

            {/* Divisions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Divisions
                </h2>
                <button
                  onClick={initializeDefaultDivisions}
                  className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-medium transition-all"
                  title="Add default divisions: AD1, AD2, AI, CE, CO1, CO2, CO3, DS1, DS2, EE, ET1, ET2, IT1, IT2, ME"
                >
                  + Load Defaults
                </button>
              </div>
              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={newDivision}
                  onChange={(e) => setNewDivision(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addDivision()}
                  data-testid="division-input"
                  placeholder="Enter division name (e.g., A, B, C)"
                  className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addDivision}
                  data-testid="add-division"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-2">
                {(config.divisions || []).map((div, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3" data-testid={`division-${idx}`}>
                    <span className="text-slate-900">{div}</span>
                    <button
                      onClick={() => removeDivision(div)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(config.divisions || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No divisions added yet</p>
                )}
              </div>
            </div>

            {/* Years */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Years
                </h2>
                <button
                  onClick={initializeDefaultYears}
                  className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded font-medium transition-all"
                  title="Add default years: 1st Year, 2nd Year, 3rd Year, 4th Year"
                >
                  + Load Defaults
                </button>
              </div>
              <div className="flex space-x-3 mb-4">
                <input
                  type="text"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addYear()}
                  data-testid="year-input"
                  placeholder="Enter year (e.g., 1st Year, 2nd Year)"
                  className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={addYear}
                  data-testid="add-year"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold transition-all flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add</span>
                </button>
              </div>
              <div className="space-y-2">
                {(config.years || []).map((year, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-3" data-testid={`year-${idx}`}>
                    <span className="text-slate-900">{year}</span>
                    <button
                      onClick={() => removeYear(year)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {(config.years || []).length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No years added yet</p>
                )}
              </div>
            </div>

            {/* Required Fields */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Required Registration Fields
              </h2>
              <p className="text-sm text-slate-600 mb-4">Select which fields are mandatory for registration</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {availableFields.map((field) => (
                  <label key={field} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                    <input
                      type="checkbox"
                      checked={config.required_fields?.includes(field) || false}
                      onChange={() => toggleRequiredField(field)}
                      className="w-4 h-4 text-indigo-600 rounded"
                    />
                    <span className="text-slate-900 capitalize">{field}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Post-Registration Popup */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Post-Registration Popup
              </h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={config.popup_enabled}
                    onChange={(e) => setConfig({ ...config, popup_enabled: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-slate-900 font-medium">Enable popup after registration</span>
                </label>

                {config.popup_enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Popup Type</label>
                      <select
                        value={config.popup_type}
                        onChange={(e) => setConfig({ ...config, popup_type: e.target.value })}
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="instagram">Instagram Follow</option>
                        <option value="whatsapp">WhatsApp Community</option>
                        <option value="custom">Custom Message</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        {config.popup_type === 'instagram' ? 'Instagram Username' : config.popup_type === 'whatsapp' ? 'WhatsApp Link' : 'Custom Message'}
                      </label>
                      <input
                        type="text"
                        value={config.popup_content?.[config.popup_type] || ''}
                        onChange={(e) => setConfig({
                          ...config,
                          popup_content: { ...config.popup_content, [config.popup_type]: e.target.value }
                        })}
                        placeholder={
                          config.popup_type === 'instagram' ? '@your_handle' :
                          config.popup_type === 'whatsapp' ? 'https://chat.whatsapp.com/...' :
                          'Enter your custom message'
                        }
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <LinkIcon className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Social Links
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['instagram', 'facebook', 'whatsapp', 'linkedin', 'twitter', 'youtube', 'website'].map((platform) => (
                  <div key={platform}>
                    <label className="block text-sm font-medium text-slate-700 mb-2 capitalize">{platform} Link</label>
                    <input
                      type="text"
                      value={config.social_links?.[platform] || ''}
                      onChange={(e) => setConfig({
                        ...config,
                        social_links: { ...config.social_links, [platform]: e.target.value }
                      })}
                      placeholder={
                        platform === 'instagram' ? '@username or https://instagram.com/...' :
                        platform === 'facebook' ? 'https://facebook.com/...' :
                        platform === 'whatsapp' ? 'https://chat.whatsapp.com/...' :
                        platform === 'linkedin' ? 'https://linkedin.com/...' :
                        platform === 'twitter' ? 'https://twitter.com/...' :
                        platform === 'youtube' ? 'https://youtube.com/...' :
                        'https://example.com'
                      }
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Support & Contact */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <Mail className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Support & Contact
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Support Email</label>
                  <input
                    type="email"
                    value={config.support_email || ''}
                    onChange={(e) => setConfig({ ...config, support_email: e.target.value })}
                    placeholder="support@example.com"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Support Phone</label>
                  <input
                    type="tel"
                    value={config.support_phone || ''}
                    onChange={(e) => setConfig({ ...config, support_phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Important Links */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-6">
                <LinkIcon className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  Important Links
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Help/Documentation Link</label>
                  <input
                    type="url"
                    value={config.help_link || ''}
                    onChange={(e) => setConfig({ ...config, help_link: e.target.value })}
                    placeholder="https://help.example.com"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Terms & Conditions Link</label>
                  <input
                    type="url"
                    value={config.terms_link || ''}
                    onChange={(e) => setConfig({ ...config, terms_link: e.target.value })}
                    placeholder="https://example.com/terms"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Privacy Policy Link</label>
                  <input
                    type="url"
                    value={config.privacy_link || ''}
                    onChange={(e) => setConfig({ ...config, privacy_link: e.target.value })}
                    placeholder="https://example.com/privacy"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">About Page Link</label>
                  <input
                    type="url"
                    value={config.about_link || ''}
                    onChange={(e) => setConfig({ ...config, about_link: e.target.value })}
                    placeholder="https://example.com/about"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Event Settings */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Event Settings
              </h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-all">
                  <input
                    type="checkbox"
                    checked={config.event_registration_enabled || false}
                    onChange={(e) => setConfig({ ...config, event_registration_enabled: e.target.checked })}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-slate-900 font-medium">Enable Event Registration</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Maximum Team Size</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.max_team_size || 5}
                    onChange={(e) => setConfig({ ...config, max_team_size: parseInt(e.target.value) })}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Custom Footer */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                Custom Footer Text
              </h2>
              <textarea
                value={config.custom_footer_text || ''}
                onChange={(e) => setConfig({ ...config, custom_footer_text: e.target.value })}
                placeholder="Enter custom footer text or copyright information"
                rows="4"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
