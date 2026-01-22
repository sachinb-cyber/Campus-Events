import { Home, Calendar, User, LayoutDashboard, FileText, Users, Shield, HelpCircle, MessageCircle, Settings, ChevronDown, LogOut } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function MobileNav({ user, isAdmin }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear all auth data
    localStorage.removeItem('auth_user');
    sessionStorage.removeItem('testUser');
    // Optional: Call backend logout
    fetch(`${process.env.REACT_APP_BACKEND_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    }).catch(err => console.log('Logout request sent'));
    
    // Redirect to login
    navigate('/login');
  };

  const userLinks = [
    { path: '/', icon: Home, label: 'Events' },
    { path: '/my-registrations', icon: Calendar, label: 'My Events' },
    { path: '/help', icon: HelpCircle, label: 'Help' }
  ];

  const adminLinks = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/events', icon: FileText, label: 'Events' },
    { path: '/admin/registrations', icon: Users, label: 'Registrations' },
    { path: '/admin/tickets', icon: MessageCircle, label: 'Tickets' }
  ];

  const superAdminLinks = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/events', icon: FileText, label: 'Events' },
    { path: '/admin/registrations', icon: Users, label: 'Registrations' },
    { path: '/admin/tickets', icon: MessageCircle, label: 'Tickets' },
    { path: '/superadmin/panel', icon: Shield, label: 'Users' },
    { path: '/superadmin/settings', icon: Settings, label: 'Settings' }
  ];

  const links = user?.role === 'superadmin' ? superAdminLinks : (isAdmin ? adminLinks : userLinks);

  return (
    <>
      {/* Desktop Nav */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link to={isAdmin ? '/admin' : '/'} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Outfit, sans-serif' }}>Campus Events</span>
              </Link>
              <div className="flex space-x-4">
                {links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center space-x-3 relative">
              <img
                src={user?.picture || 'https://via.placeholder.com/40'}
                alt={user?.name}
                className="w-10 h-10 rounded-full border-2 border-slate-200 cursor-pointer hover:border-indigo-400 transition-all"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              />
              <div className="text-right cursor-pointer hover:text-indigo-600 transition-all" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Student'}</p>
              </div>
              
              {/* Desktop Profile Dropdown */}
              {profileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 w-48">
                  <Link
                    to="/profile-card"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-b border-slate-100 rounded-t-lg transition-all"
                  >
                    View Profile
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="block px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-b border-slate-100 transition-all"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-b-lg transition-all flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
        <div className="flex items-center justify-around h-16 px-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`mobile-nav-${link.label.toLowerCase().replace(' ', '-')}`}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all ${
                  isActive ? 'text-indigo-600' : 'text-slate-600'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-xs font-medium">{link.label}</span>
              </Link>
            );
          })}
          
          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              data-testid="mobile-nav-profile"
              className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all text-slate-600 hover:text-indigo-600 relative"
            >
              <img
                src={user?.picture || 'https://via.placeholder.com/24'}
                alt="Profile"
                className="w-6 h-6 rounded-full border border-slate-200"
              />
              <span className="text-xs font-medium">Profile</span>
              <ChevronDown className={`w-3 h-3 absolute top-0 right-0 transition-transform ${profileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {profileMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 bg-white border border-slate-200 rounded-lg shadow-lg z-50 whitespace-nowrap">
                <Link
                  to="/profile-card"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-b border-slate-100 rounded-t-lg"
                >
                  View Profile
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setProfileMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 border-b border-slate-100"
                >
                  Edit Profile
                </Link>
                <button
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}