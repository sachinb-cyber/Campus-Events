import { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/analytics`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-dashboard-title">
            Dashboard
          </h1>
          <p className="text-slate-600">Overview of all events and registrations</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Total Events"
            value={analytics?.total_events || 0}
            color="indigo"
            testId="stat-total-events"
          />
          <StatCard
            icon={Users}
            label="Total Registrations"
            value={analytics?.total_registrations || 0}
            color="green"
            testId="stat-total-registrations"
          />
          <StatCard
            icon={TrendingUp}
            label="Today's Registrations"
            value={analytics?.today_registrations || 0}
            color="orange"
            testId="stat-today-registrations"
          />
          <StatCard
            icon={UserCheck}
            label="Team Registrations"
            value={analytics?.team_registrations || 0}
            color="purple"
            testId="stat-team-registrations"
          />
        </div>

        {/* Registration Type Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Registration Types
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700 font-medium">Single Events</span>
                  <span className="text-slate-900 font-bold">{analytics?.single_registrations || 0}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all"
                    style={{
                      width: `${((analytics?.single_registrations || 0) / (analytics?.total_registrations || 1)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-700 font-medium">Team Events</span>
                  <span className="text-slate-900 font-bold">{analytics?.team_registrations || 0}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${((analytics?.team_registrations || 0) / (analytics?.total_registrations || 1)) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
              Quick Actions
            </h2>
            <div className="space-y-3">
              <a
                href="/admin/events"
                data-testid="quick-action-manage-events"
                className="block bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg p-4 font-medium transition-all"
              >
                Manage Events
              </a>
              <a
                href="/admin/registrations"
                data-testid="quick-action-view-registrations"
                className="block bg-green-50 hover:bg-green-100 text-green-700 rounded-lg p-4 font-medium transition-all"
              >
                View All Registrations
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, testId }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-600 text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}