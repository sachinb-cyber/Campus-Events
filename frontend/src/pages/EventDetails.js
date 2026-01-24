import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, FileText, User as UserIcon, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEvent = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/events/${eventId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load event');
      const data = await response.json();
      setEvent(data);
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [eventId, navigate]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) return null;

  const eventDate = new Date(event.event_date);
  const deadline = new Date(event.deadline);
  const isDeadlinePassed = deadline < new Date();

  const categoryImages = {
    'Technical': 'https://images.pexels.com/photos/1181260/pexels-photo-1181260.jpeg',
    'Cultural': 'https://images.unsplash.com/photo-1553194731-e7253cd148d9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzl8MHwxfHNlYXJjaHwzfHxtdXNpYyUyMGNvbmNlcnQlMjBjcm93ZCUyMGxpZ2h0c3xlbnwwfHx8fDE3NjkwMTg5NTJ8MA&ixlib=rb-4.1.0&q=85',
    'default': 'https://images.pexels.com/photos/6213665/pexels-photo-6213665.jpeg'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate('/')}
          data-testid="back-button"
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 mb-6 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Events</span>
        </button>

        {/* Event Image */}
        <div
          className="h-64 md:h-96 bg-cover bg-center rounded-2xl overflow-hidden mb-6"
          style={{ backgroundImage: `url(${categoryImages[event.category] || categoryImages.default})` }}
        >
          <div className="h-full bg-gradient-to-t from-black/70 to-transparent p-6 flex flex-col justify-end">
            <div className="flex items-center space-x-2 mb-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                {event.category}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/90 text-slate-800">
                {event.event_type === 'team' ? 'Team Event' : 'Individual Event'}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="event-title">
              {event.title}
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          {/* Event Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Event Date</p>
                <p className="text-slate-900 font-medium">
                  {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Registration Deadline</p>
                <p className="text-slate-900 font-medium">
                  {deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-indigo-600 mt-1" />
              <div>
                <p className="text-sm text-slate-500">Venue</p>
                <p className="text-slate-900 font-medium">{event.venue}</p>
              </div>
            </div>

            {event.event_type === 'team' && (
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-indigo-600 mt-1" />
                <div>
                  <p className="text-sm text-slate-500">Team Size</p>
                  <p className="text-slate-900 font-medium">{event.team_size} members</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
              About the Event
            </h2>
            <p className="text-slate-600 leading-relaxed" data-testid="event-description">{event.description}</p>
          </div>

          {/* Rules */}
          {event.rules && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center space-x-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <FileText className="w-5 h-5" />
                <span>Rules & Guidelines</span>
              </h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{event.rules}</p>
            </div>
          )}

          {/* Organizer Info */}
          {event.organizer_info && (
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center space-x-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                <UserIcon className="w-5 h-5" />
                <span>Organizer</span>
              </h2>
              <p className="text-slate-600">{event.organizer_info}</p>
            </div>
          )}

          {/* Register Button */}
          {isDeadlinePassed ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
              <p className="text-red-700 font-medium">Registration deadline has passed</p>
            </div>
          ) : (
            <button
              onClick={() => navigate(`/register/${event.event_id}`)}
              data-testid="register-button"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-4 font-bold shadow-lg shadow-orange-500/20 transform hover:-translate-y-0.5 transition-all active:scale-95"
            >
              Register Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}