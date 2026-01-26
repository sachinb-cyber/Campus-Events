import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function ProfileCompletion({ user }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [years, setYears] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    college: '',
    department: '',
    division: '',
    year: '',
    phone: '',
    prn: ''
  });

  useEffect(() => {
    fetchProfileOptions();
  }, []);

  const fetchProfileOptions = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/profile-options`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load options');
      const data = await response.json();
      setColleges(data.colleges || []);
      setDepartments(data.departments || []);
      setDivisions(data.divisions || []);
      setYears(data.years || []);
    } catch (error) {
      toast.error('Failed to load colleges and departments');
      console.error(error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.college || !formData.department || !formData.division || !formData.year || !formData.phone || !formData.prn) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate phone number (exactly 10 digits)
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Please enter a valid mobile number (exactly 10 digits)');
      return;
    }

    // Validate PRN (9 digits only)
    if (!/^\d{9}$/.test(formData.prn)) {
      toast.error('Please enter a valid PRN (9 digits only)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/complete-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          college: formData.college,
          department: formData.department,
          division: formData.division,
          year: formData.year,
          phone: formData.phone,
          prn: formData.prn
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to complete profile');
      }

      const data = await response.json();
      toast.success('Profile completed successfully!');
      
      // Update localStorage with updated user
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      
      // Redirect to home page
      setTimeout(() => navigate('/'), 500);
    } catch (error) {
      toast.error(error.message || 'Failed to complete profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
            <AlertCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
            Complete Your Profile
          </h1>
          <p className="text-slate-600 text-sm">
            We need a few more details to get you started
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* College */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              College *
            </label>
            <select
              name="college"
              value={formData.college}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select your college</option>
              {colleges.map((college) => (
                <option key={college} value={college}>
                  {college}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Department *
            </label>
            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select your department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Division */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Division *
            </label>
            <select
              name="division"
              value={formData.division}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select your division</option>
              {divisions.map((div) => (
                <option key={div} value={div}>
                  {div}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Year *
            </label>
            <select
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select your year</option>
              {years.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mobile Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                handleChange({ target: { name: 'phone', value } });
              }}
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              maxLength="10"
              required
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">Exactly 10 digits</p>
          </div>

          {/* PRN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              PRN (Registration Number) *
            </label>
            <input
              type="text"
              name="prn"
              value={formData.prn}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                handleChange({ target: { name: 'prn', value } });
              }}
              placeholder="e.g., 241101101"
              pattern="[0-9]{9}"
              maxLength="9"
              required
              className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <p className="text-xs text-slate-500 mt-1">9 digits only</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-lg font-semibold shadow-lg transition-all mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                Completing...
              </span>
            ) : (
              'Complete Profile'
            )}
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            * Required fields
          </p>
        </form>
      </div>
    </div>
  );
}
