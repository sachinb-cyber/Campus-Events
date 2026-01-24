import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Users, MapPin, Filter } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [eventTypeFilter, categoryFilter, fetchEvents]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // If backend URL is not set, skip fetch
      if (!BACKEND_URL || BACKEND_URL.includes('undefined')) {
        console.warn('BACKEND_URL not set or invalid, skipping fetch');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (eventTypeFilter) params.append('event_type', eventTypeFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (search) params.append('search', search);

      const response = await fetch(`${BACKEND_URL}/api/events?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events', error);
      // Don't show toast error for development; just set empty events
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      {/* Hero Section */}
      <div
        className="relative h-64 md:h-80 bg-gradient-to-br from-indigo-600 to-indigo-800 overflow-hidden"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/6213665/pexels-photo-6213665.jpeg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-indigo-900/70"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: 'Outfit, sans-serif' }}
            data-testid="home-hero-title"
          >
            Discover Events
          </h1>
          <p className="text-lg sm:text-xl text-indigo-100 max-w-2xl">
            Find and register for exciting college events happening around campus
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="search-input"
                  className="w-full pl-12 pr-4 h-12 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="filter-toggle"
                className="md:hidden bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-lg px-6 py-3 font-medium transition-all flex items-center justify-center space-x-2"
              >
                <Filter className="w-5 h-5" />
                <span>Filters</span>
              </button>
              <button
                type="submit"
                data-testid="search-button"
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all active:scale-95"
              >
                Search
              </button>
            </div>

            {/* Filters */}
            <div className={`${showFilters ? 'block' : 'hidden'} md:flex gap-3`}>
              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                data-testid="event-type-filter"
                className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="single">Single</option>
                <option value="team">Team</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                data-testid="category-filter"
                className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
              </select>
            </div>
          </form>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12" data-testid="no-events-message">
            <p className="text-slate-500 text-lg">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
            {events.map((event) => (
              <EventCard key={event.event_id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({ event }) {
  const eventDate = new Date(event.event_date);
  const deadline = new Date(event.deadline);
  const isDeadlinePassed = deadline < new Date();

  const categoryImages = {
    'Technical': 'https://images.pexels.com/photos/1181260/pexels-photo-1181260.jpeg',
    'Cultural': 'https://images.unsplash.com/photo-1553194731-e7253cd148d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxtdXNpYyUyMGNvbmNlcnQlMjBjcm93ZCUyMGxpZ2h0c3xlbnwwfHx8fDE3NjkwMTg5NTJ8MA&ixlib=rb-4.1.0&q=85',
    'default': 'https://images.pexels.com/photos/6213665/pexels-photo-6213665.jpeg'
  };

  return (
    <Link
      to={`/events/${event.event_id}`}
      data-testid={`event-card-${event.event_id}`}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col h-full"
    >
      <div
        className="h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${categoryImages[event.category] || categoryImages.default})` }}
      >
        <div className="h-full bg-gradient-to-t from-black/60 to-transparent p-5 flex flex-col justify-end">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              {event.category}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
              {event.event_type === 'team' ? 'Team' : 'Single'}
            </span>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {event.title}
        </h3>
        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="space-y-2 mt-auto">
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <Calendar className="w-4 h-4" />
            <span>{eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4" />
            <span>{event.venue}</span>
          </div>
          {event.event_type === 'team' && (
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Users className="w-4 h-4" />
              <span>Team of {event.team_size}</span>
            </div>
          )}
        </div>

        {isDeadlinePassed ? (
          <div className="mt-4 bg-red-50 text-red-700 text-center py-2 rounded-lg text-sm font-medium">
            Registration Closed
          </div>
        ) : (
          <div className="mt-4 bg-green-50 text-green-700 text-center py-2 rounded-lg text-sm font-medium">
            Register by {deadline.toLocaleDateString()}
          </div>
        )}
      </div>
    </Link>
  );
}