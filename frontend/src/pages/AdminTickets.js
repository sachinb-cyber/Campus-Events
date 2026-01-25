import { useState, useEffect } from 'react';
import { MessageCircle, Clock, CheckCircle, Send, X } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/tickets`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to load tickets');
      const data = await response.json();
      setTickets(data);
    } catch (error) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/tickets/${selectedTicket.ticket_id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: replyMessage })
      });

      if (!response.ok) throw new Error('Failed to send reply');
      toast.success('Reply sent successfully');
      setReplyMessage('');
      fetchTickets();
      const updated = await response.json();
      setSelectedTicket(updated);
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId) => {
    if (!window.confirm('Close this ticket?')) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/tickets/${ticketId}/close`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to close ticket');
      toast.success('Ticket closed');
      fetchTickets();
      if (selectedTicket?.ticket_id === ticketId) {
        setSelectedTicket(null);
      }
    } catch (error) {
      toast.error('Failed to close ticket');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-8 md:pt-16">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8" style={{ fontFamily: 'Outfit, sans-serif' }} data-testid="admin-tickets-title">
          Help Tickets
        </h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket List */}
            <div className="lg:col-span-1 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
              {tickets.map((ticket) => (
                <div
                  key={ticket.ticket_id}
                  onClick={() => setSelectedTicket(ticket)}
                  data-testid={`admin-ticket-${ticket.ticket_id}`}
                  className={`bg-white rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedTicket?.ticket_id === ticket.ticket_id
                      ? 'border-indigo-500 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500">{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{ticket.subject}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{ticket.message}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{ticket.user?.name}</span>
                    <span className="text-xs text-indigo-600">{ticket.replies?.length || 0} replies</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {selectedTicket.subject}
                      </h2>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedTicket.status)}`}>
                          {selectedTicket.status.replace('_', ' ')}
                        </span>
                        <span className="text-sm text-slate-600">From: {selectedTicket.user?.name}</span>
                      </div>
                    </div>
                    {selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => handleCloseTicket(selectedTicket.ticket_id)}
                        className="bg-green-50 hover:bg-green-100 text-green-700 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                      >
                        Close Ticket
                      </button>
                    )}
                  </div>

                  <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                    <div className="bg-slate-50 rounded-xl p-4">
                      <p className="text-sm font-medium text-slate-500 mb-2">Student Message</p>
                      <p className="text-slate-900">{selectedTicket.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>

                    {selectedTicket.replies && selectedTicket.replies.map((reply) => (
                      <div key={reply.reply_id} className="bg-indigo-50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-semibold text-indigo-900">{reply.user_name}</span>
                          <span className="text-xs px-2 py-0.5 bg-indigo-200 text-indigo-800 rounded-full">{reply.user_role}</span>
                        </div>
                        <p className="text-slate-900">{reply.message}</p>
                        <p className="text-xs text-slate-500 mt-2">{new Date(reply.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {selectedTicket.status !== 'closed' && (
                    <form onSubmit={handleReply} className="space-y-3">
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        data-testid="reply-message"
                        placeholder="Type your reply..."
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !replyMessage.trim()}
                        data-testid="send-reply"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-6 py-3 font-semibold shadow-lg transition-all disabled:opacity-50 flex items-center space-x-2"
                      >
                        <Send className="w-5 h-5" />
                        <span>{submitting ? 'Sending...' : 'Send Reply'}</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-slate-900 mb-2">Select a ticket</h2>
                  <p className="text-slate-600">Choose a ticket from the list to view and reply</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
