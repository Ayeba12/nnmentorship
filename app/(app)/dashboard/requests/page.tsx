"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import { Card, Button, Avatar, Badge, Spinner, EmptyState } from '@/components/ui';
import { UserPlus, Clock, Check, X, MessageSquare, ArrowRight, Inbox, Send, Award, FileText } from 'lucide-react';
import type { MentorshipRequest, Profile } from '@/lib/types';

function parseRoutingInfo(messageText: string) {
  if (!messageText) return { cleanMessage: '', divisionOfficer: null, commandingOfficer: null };
  const matchDo = messageText.match(/Division Officer:\s*(.*)/);
  const matchCo = messageText.match(/Commanding Officer:\s*(.*)/);
  
  let cleanMessage = messageText;
  const routingIdx = messageText.indexOf('[Routing Info]');
  if (routingIdx !== -1) {
    cleanMessage = messageText.substring(0, routingIdx).trim();
  }
  
  return {
    divisionOfficer: matchDo ? matchDo[1].trim() : null,
    commandingOfficer: matchCo ? matchCo[1].trim() : null,
    cleanMessage
  };
}

export default function Requests() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<(MentorshipRequest & { mentee?: Profile; mentor?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [menteeTab, setMenteeTab] = useState<'all' | 'pending' | 'resolved'>('all');
  const [confirmWithdrawId, setConfirmWithdrawId] = useState<number | null>(null);

  const load = async () => {
    try {
      setRequests(await api.requests.list());
    } catch (e) { 
      console.error('Error loading requests:', e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Update default tab for mentees who only have sent requests
  useEffect(() => {
    if (profile && profile.role === 'mentee') {
      setTab('sent');
    }
  }, [profile]);

  const handleAccept = async (id: number) => {
    try { 
      await api.requests.accept(id); 
      await load(); 
    } catch (e: any) { 
      alert(e.message || 'Failed to accept request'); 
    }
  };

  const handleDecline = async (id: number) => {
    try { 
      await api.requests.decline(id); 
      setConfirmWithdrawId(null);
      await load(); 
    } catch (e: any) { 
      alert(e.message || 'Failed to decline request'); 
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const isMentor = profile?.role === 'active_mentor' || profile?.role === 'retired_mentor';
  const received = requests.filter(r => r.mentor_id === profile?.id);
  const sent = requests.filter(r => r.mentee_id === profile?.id);
  
  // Decide which requests to show based on tabs
  const activeTabList = isMentor ? (tab === 'received' ? received : sent) : sent;

  // For mentees, apply sub-tabs filtering
  const filteredList = isMentor 
    ? activeTabList 
    : activeTabList.filter(r => {
        if (menteeTab === 'pending') return r.status === 'pending';
        if (menteeTab === 'resolved') return r.status !== 'pending';
        return true;
      });

  const pending = filteredList.filter(r => r.status === 'pending');
  const resolved = filteredList.filter(r => r.status !== 'pending');

  const requestTypeLabels: Record<string, string> = {
    mentee_choice: 'Direct Request',
    auto_assign: 'System Recommendation',
    admin_review: 'Admin Review',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-navy-100 pb-5">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Mentorship Requests</h1>
          <p className="text-sm text-navy-400">Manage your incoming and outgoing mentorship connections</p>
        </div>
      </div>

      {/* Tabs / Filters Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-navy-50/20 p-2 rounded-xl border border-navy-100/40">
        {/* Mentor Primary Tabs */}
        {isMentor ? (
          <div className="flex gap-1.5 bg-navy-100/40 p-1 rounded-lg border border-navy-100/30 w-fit">
            <button
              onClick={() => setTab('received')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
                tab === 'received' 
                  ? 'bg-navy-700 text-white shadow-soft' 
                  : 'text-navy-600 hover:bg-navy-100/60'
              }`}
            >
              <Inbox className="w-3.5 h-3.5" /> Received ({received.length})
            </button>
            <button
              onClick={() => setTab('sent')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-all duration-200 ${
                tab === 'sent' 
                  ? 'bg-navy-700 text-white shadow-soft' 
                  : 'text-navy-600 hover:bg-navy-100/60'
              }`}
            >
              <Send className="w-3.5 h-3.5" /> Sent ({sent.length})
            </button>
          </div>
        ) : (
          /* Mentee Filter Tabs */
          <div className="flex gap-1.5 bg-navy-100/40 p-1 rounded-lg border border-navy-100/30 w-fit">
            {[
              { id: 'all', label: 'All Outgoing', count: sent.length },
              { id: 'pending', label: 'Awaiting Approval', count: sent.filter(r => r.status === 'pending').length },
              { id: 'resolved', label: 'History', count: sent.filter(r => r.status !== 'pending').length }
            ].map(subTab => (
              <button
                key={subTab.id}
                onClick={() => setMenteeTab(subTab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-200 ${
                  menteeTab === subTab.id 
                    ? 'bg-navy-700 text-white shadow-soft' 
                    : 'text-navy-600 hover:bg-navy-100/60'
                }`}
              >
                {subTab.label} ({subTab.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-500" />
            {tab === 'received' ? 'Pending Requests' : 'Awaiting Response'} ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((req, idx) => {
              const other = req.mentee_id === profile?.id ? req.mentor : req.mentee;
              const isIncoming = req.mentor_id === profile?.id;
              if (!other) return null;

              const routing = parseRoutingInfo(req.message);

              return (
                <motion.div 
                  key={req.id} 
                  initial={{ opacity: 0, y: 8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card hover className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <Avatar name={other.full_name} src={other.avatar_url} size="md" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-navy-800 truncate">{other.full_name}</p>
                            <Badge variant={other.role === 'retired_mentor' ? 'gold' : 'success'} dot>
                              {other.role === 'retired_mentor' 
                                ? 'Retired Mentor' 
                                : other.role === 'active_mentor' 
                                ? 'Active Mentor' 
                                : 'Mentee'}
                            </Badge>
                          </div>
                          <p className="text-xs text-navy-400 truncate mt-0.5">
                            {other.rank} · {other.specialization} {other.command_location ? `· ${other.command_location}` : ''}
                          </p>
                          <p className="text-[10px] text-navy-400 mt-1 font-medium bg-navy-50/50 px-2 py-0.5 rounded border border-navy-100/50 w-fit">
                            {requestTypeLabels[req.request_type] || req.request_type} · Sent {new Date(req.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      
                      {isIncoming ? (
                        <div className="flex gap-2 self-center">
                          <Button size="sm" variant="success" onClick={() => handleAccept(req.id)}>
                            <Check className="w-3.5 h-3.5" /> Accept
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDecline(req.id)}>
                            <X className="w-3.5 h-3.5" /> Decline
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 self-center">
                          <Badge variant="warning" dot>Awaiting Response</Badge>
                          
                          {/* Withdraw Confirm Control */}
                          {confirmWithdrawId === req.id ? (
                            <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg p-1">
                              <span className="text-[10px] font-bold text-red-600 px-1.5 animate-pulse">Confirm?</span>
                              <Button size="sm" variant="danger" onClick={() => handleDecline(req.id)} className="h-6 px-2 text-[10px]">
                                Withdraw
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setConfirmWithdrawId(null)} className="h-6 px-1.5 text-[10px] text-navy-400">
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => setConfirmWithdrawId(req.id)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                              Withdraw
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {routing.cleanMessage && (
                      <div className="mt-4 p-3.5 bg-navy-50/40 rounded-md border border-navy-100/50">
                        <p className="text-xs font-semibold text-navy-500 mb-1">
                          {isIncoming ? 'Message from Mentee:' : 'Your message:'}
                        </p>
                        <p className="text-sm text-navy-600 italic">“{routing.cleanMessage}”</p>
                      </div>
                    )}

                    {/* Endorsement Routing Info List */}
                    {(routing.divisionOfficer || routing.commandingOfficer) && (
                      <div className="mt-2.5 px-3.5 py-2 bg-navy-50/10 rounded-md border border-navy-100/30 flex items-center gap-4 flex-wrap">
                        <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wider flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-gold-500" /> Command Endorsements
                        </span>
                        {routing.divisionOfficer && (
                          <span className="text-xs text-navy-500">
                            Division Officer (DO): <span className="font-semibold text-navy-700">{routing.divisionOfficer}</span>
                          </span>
                        )}
                        {routing.commandingOfficer && (
                          <span className="text-xs text-navy-500">
                            Commanding Officer (CO): <span className="font-semibold text-navy-700">{routing.commandingOfficer}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Resolved Requests */}
      {resolved.length > 0 && (
        <div className="space-y-3 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-navy-400 flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            History ({resolved.length})
          </h2>
          <div className="space-y-3">
            {resolved.map(req => {
              const other = req.mentee_id === profile?.id ? req.mentor : req.mentee;
              const isSent = req.mentee_id === profile?.id;
              if (!other) return null;

              // Customize status mapping for sent request withdrawals
              const displayStatus = (req.status === 'declined' && isSent) ? 'withdrawn' : req.status;

              return (
                <Card key={req.id} className="p-4 bg-white/70">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={other.full_name} src={other.avatar_url} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-navy-800 truncate">{other.full_name}</p>
                        <p className="text-xs text-navy-400 truncate">
                          {other.rank} · {other.specialization}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {req.status === 'accepted' && (
                        <Link href="/dashboard/messages">
                          <Button size="sm" variant="ghost" className="h-8">
                            <MessageSquare className="w-3.5 h-3.5" /> Message
                          </Button>
                        </Link>
                      )}
                      <Badge variant={displayStatus === 'accepted' ? 'success' : displayStatus === 'withdrawn' ? 'default' : 'danger'} dot>
                        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredList.length === 0 && (
        <Card className="p-6">
          <EmptyState
            icon={<UserPlus className="w-8 h-8" />}
            title={isMentor && tab === 'received' ? 'No incoming requests' : 'No requests sent'}
            description={
              isMentor && tab === 'received' 
                ? "When mentees request you as a mentor, they'll appear here." 
                : 'Browse active/retired mentors and send a mentorship request to get started.'
            }
            action={
              profile?.role === 'mentee' ? (
                <Link href="/dashboard/mentors">
                  <Button variant="gold" size="sm">
                    Find a Mentor <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              ) : undefined
            }
          />
        </Card>
      )}
    </div>
  );
}
