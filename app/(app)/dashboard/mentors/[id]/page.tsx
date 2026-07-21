"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Card, Button, Avatar, Badge, Spinner, Modal, Textarea, EmptyState, ProgressBar } from '@/components/ui';
import { ArrowLeft, MapPin, Briefcase, Award, Clock, Sparkles, Check, MessageSquare, Calendar, CalendarDays, Repeat } from 'lucide-react';
import type { Profile, MatchedMentor, MentorshipRequest, AvailabilitySlot } from '@/lib/types';

export default function MentorDetail() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { profile } = useAuth();
  const [mentor, setMentor] = useState<Profile | null>(null);
  const [matchData, setMatchData] = useState<MatchedMentor | null>(null);
  const [existingRequest, setExistingRequest] = useState<MentorshipRequest | null>(null);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [message, setMessage] = useState('');
  const [requestType, setRequestType] = useState('mentee_choice');
  const [divisionOfficer, setDivisionOfficer] = useState('');
  const [commandingOfficer, setCommandingOfficer] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const m = await api.profiles.get(id as any);
        setMentor(m);
        // Load mentor availability slots using profile database ID
        const targetId = m?.id || id;
        try {
          const avail = await api.availability.list(targetId as any);
          setAvailabilitySlots(avail.slots || []);
        } catch (e) {
          console.error("Availability load error:", e);
        } finally {
          setLoadingAvailability(false);
        }

        // Load match data if user is a mentee
        if (profile?.role === 'mentee') {
          try {
            const match = await api.matching.forMentor(Number(id));
            setMatchData(match);
          } catch { /* not a mentee or error */ }
          // Check for existing request
          try {
            const requests = await api.requests.list();
            const existing = requests.find(r => r.mentor_id === Number(id) && r.status === 'pending');
            setExistingRequest(existing || null);
          } catch { /* ignore */ }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [id, profile]);

  const handleRequest = async () => {
    if (!mentor) return;
    setSending(true);
    try {
      let finalMessage = message;
      if (requestType === 'admin_review') {
        finalMessage = `${message}\n\n[Routing Info]\nDivision Officer: ${divisionOfficer}\nCommanding Officer: ${commandingOfficer}`;
      }
      await api.requests.create(mentor.id, finalMessage, requestType);
      setSent(true);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-6 w-32 skeleton rounded" />
      <div className="h-64 rounded-md skeleton" />
      <div className="h-48 rounded-md skeleton" />
    </div>
  );
  if (!mentor) return <EmptyState title="Mentor not found" action={<Link href="/dashboard/mentors"><Button>Back to Search</Button></Link>} />;

  const isRetired = mentor.role === 'retired_mentor';
  const match = matchData?.match;
  const hasExistingRequest = !!existingRequest;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.push('/dashboard/mentors')} className="flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700 transition-colors cursor-pointer">
        <ArrowLeft className="w-4 h-4" /> Back to Search
      </button>

      {/* Mentor Profile Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6 text-center sm:text-left">
            <Avatar name={mentor.full_name} src={mentor.avatar_url} size="xl" />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start mb-1">
                <h1 className="text-2xl font-bold text-navy-800">{mentor.full_name}</h1>
                <Badge variant={isRetired ? 'gold' : 'success'} dot>{isRetired ? 'Retired Mentor' : 'Active Mentor'}</Badge>
                {mentor.is_accepting_mentees ? <Badge variant="success" dot>Accepting Mentees</Badge> : <Badge variant="default">Not Available</Badge>}
              </div>
              <p className="text-sm text-navy-400">{mentor.rank} · {mentor.specialization}</p>
              <p className="text-xs text-navy-400 mt-1">{mentor.service_branch} · {mentor.years_of_service} years of service</p>
            </div>
          </div>

          {mentor.bio && (
            <div className="mb-6 p-4 bg-navy-50/50 rounded-lg border border-navy-100">
              <h3 className="text-sm font-semibold text-navy-700 mb-2">About</h3>
              <p className="text-sm text-navy-600 leading-relaxed">{mentor.bio}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Service Branch" value={mentor.service_branch} />
            <InfoRow icon={<Award className="w-4 h-4" />} label="Rank" value={mentor.rank} />
            <InfoRow icon={<Clock className="w-4 h-4" />} label="Years of Service" value={String(mentor.years_of_service)} />
            <InfoRow icon={<MapPin className="w-4 h-4" />} label="Command / Location" value={mentor.command_location} />
          </div>

          {isRetired && (
            <div className="mt-4 pt-4 border-t border-navy-100">
              <h3 className="text-sm font-bold text-gold-600 mb-3 flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Post-Service Career</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <InfoRow icon={<Award className="w-4 h-4" />} label="Last Rank Held" value={mentor.last_rank_held || '—'} />
                <InfoRow icon={<Clock className="w-4 h-4" />} label="Years Served" value={String(mentor.years_served ?? '—')} />
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Current Role" value={mentor.civilian_role || '—'} />
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Industry" value={mentor.civilian_industry || '—'} />
              </div>
            </div>
          )}

          {mentor.mentorship_interests && (
            <div className="mt-4 pt-4 border-t border-navy-100">
              <h3 className="text-sm font-bold text-navy-700 mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> Mentorship Focus</h3>
              <p className="text-sm text-navy-600">{mentor.mentorship_interests}</p>
            </div>
          )}

          {mentor.additional_pictures && mentor.additional_pictures.length > 0 && (
            <div className="mt-4 pt-4 border-t border-navy-100">
              <h3 className="text-sm font-bold text-navy-700 mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-gold-500" /> Career & Service Photos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mentor.additional_pictures.map((url, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ scale: 1.02, y: -2 }}
                    className="relative aspect-video rounded-lg overflow-hidden border border-navy-100 shadow-sm cursor-zoom-in"
                    onClick={() => setSelectedImage(url)}
                  >
                    <img src={url} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Available Mentorship Slots & Weekly Schedule */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-navy-600" />
              </div>
              <div>
                <h2 className="font-bold text-navy-800">Available Mentorship Slots</h2>
                <p className="text-xs text-navy-400">Open session slots created by {mentor.full_name}</p>
              </div>
            </div>
            {availabilitySlots.length > 0 && (
              <Badge variant="success">{availabilitySlots.length} Open Slot{availabilitySlots.length > 1 ? 's' : ''}</Badge>
            )}
          </div>

          {loadingAvailability ? (
            <div className="flex justify-center py-6"><Spinner /></div>
          ) : availabilitySlots.length === 0 ? (
            <div className="p-4 bg-navy-50/50 rounded-lg border border-navy-100 text-center">
              <CalendarDays className="w-6 h-6 text-navy-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-navy-700">No fixed weekly slots set</p>
              <p className="text-[11px] text-navy-400 mt-0.5">This mentor hasn't published recurring time slots yet. You can still send a mentorship request or propose a session time.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dayName, dayIdx) => {
                const daySlots = availabilitySlots.filter(s => s.day_of_week === dayIdx);
                if (daySlots.length === 0) return null;
                return (
                  <div key={dayIdx} className="p-3 rounded-lg bg-navy-50/60 border border-navy-100/70">
                    <div className="flex items-center gap-1.5 mb-2">
                      <CalendarDays className="w-3.5 h-3.5 text-navy-500" />
                      <span className="text-xs font-bold text-navy-800">{dayName}</span>
                    </div>
                    <div className="space-y-1.5">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between p-2 rounded bg-white border border-navy-100 text-xs">
                          <div className="flex items-center gap-1 text-navy-700 font-medium">
                            <Clock className="w-3 h-3 text-navy-400" />
                            <span>{slot.start_time} - {slot.end_time}</span>
                          </div>
                          {slot.is_recurring && (
                            <span className="text-[9px] font-bold text-navy-500 bg-navy-50 px-1.5 py-0.5 rounded">Weekly</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Compatibility Analysis (Mentees only) */}
      {match && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-gold-50 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <h2 className="font-bold text-navy-800">Compatibility Analysis</h2>
                <p className="text-xs text-navy-400">How well this mentor matches your profile</p>
              </div>
            </div>

            {/* Overall Score */}
            <div className="flex items-center gap-6 mb-6 p-4 bg-navy-50/50 rounded-lg border border-navy-100">
              <div className="flex flex-col items-center">
                <div className={`text-4xl font-bold ${match.percentage >= 75 ? 'text-green-600' : match.percentage >= 55 ? 'text-ocean-600' : match.percentage >= 35 ? 'text-amber-600' : 'text-navy-400'}`}>
                  {match.percentage}%
                </div>
                <span className="text-xs font-medium text-navy-500 mt-1">{match.tier}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm text-navy-600 mb-2">Overall compatibility score based on {match.factors.length} factors</p>
                <ProgressBar value={match.score} max={match.maxScore} color={match.percentage >= 75 ? 'green' : 'gold'} />
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              {match.factors.map((f, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-navy-700">{f.label}</span>
                    <span className="text-xs text-navy-400">{f.value}/{f.max}</span>
                  </div>
                  <ProgressBar value={f.value} max={f.max} color={f.value === f.max ? 'green' : f.value > 0 ? 'gold' : 'navy'} />
                  <p className="text-xs text-navy-400 mt-1">{f.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Connection Actions */}
      {profile?.role === 'mentee' && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
          <Card className="p-6">
            {hasExistingRequest ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-navy-800">Request Pending</h3>
                  <p className="text-sm text-navy-400">You've already sent a mentorship request to {mentor.full_name}. Waiting for their response.</p>
                </div>
                <Link href="/dashboard/messages"><Button variant="outline" size="sm"><MessageSquare className="w-4 h-4" /> Messages</Button></Link>
              </div>
            ) : mentor.is_accepting_mentees ? (
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="font-bold text-navy-800">Ready to connect?</h3>
                  <p className="text-sm text-navy-400">Send a mentorship request to start your journey with {mentor.full_name}.</p>
                </div>
                <Button variant="gold" size="lg" onClick={() => setShowRequest(true)}>
                  <Sparkles className="w-4 h-4" /> Request This Mentor
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-md bg-navy-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-navy-400" />
                </div>
                <div>
                  <h3 className="font-bold text-navy-800">Not Available</h3>
                  <p className="text-sm text-navy-400">This mentor is not currently accepting new mentees.</p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      )}

      {/* Request Modal */}
      <Modal open={showRequest} onClose={() => setShowRequest(false)} title="Request Mentor" size="md">
        {sent ? (
          <div className="text-center py-6 space-y-5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto"
            >
              <Check className="w-7 h-7 text-green-600" />
            </motion.div>
            
            <div>
              <p className="text-base font-bold text-navy-800">Mentorship Request Sent</p>
              <p className="text-xs text-navy-400 mt-1 font-medium">Your routing and pairing details have been logged.</p>
            </div>

            {/* Next Steps Checklist */}
            <div className="bg-navy-50/50 rounded-xl p-4 border border-navy-100/60 text-left max-w-sm mx-auto space-y-3">
              <h4 className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Next Steps Pipeline</h4>
              <div className="space-y-2.5 text-xs text-navy-700">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-navy-100 flex items-center justify-center text-[10px] font-bold text-navy-600 shrink-0 mt-0.5">1</span>
                  <div>
                    <span className="font-semibold block text-navy-800">Officer Review</span>
                    <span className="text-navy-500">To accept or decline, {mentor.full_name} will review your message and matching compatibility.</span>
                  </div>
                </div>
                {requestType === 'admin_review' && (
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-navy-100 flex items-center justify-center text-[10px] font-bold text-navy-600 shrink-0 mt-0.5">2</span>
                    <div>
                      <span className="font-semibold block text-navy-800">Chain of Command Audit</span>
                      <span className="text-navy-500">Administrative routing sent to DO <span className="font-semibold">{divisionOfficer}</span> and CO <span className="font-semibold">{commandingOfficer}</span> for command verification.</span>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-navy-100 flex items-center justify-center text-[10px] font-bold text-navy-600 shrink-0 mt-0.5">
                    {requestType === 'admin_review' ? '3' : '2'}
                  </span>
                  <div>
                    <span className="font-semibold block text-navy-800">Inbox Activation</span>
                    <span className="text-navy-500">Upon approval, a secure chat channel will automatically open in your Messages tab.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-center max-w-sm mx-auto">
              <Button
                variant="primary"
                onClick={() => {
                  setShowRequest(false);
                  router.push('/dashboard/requests');
                }}
                className="w-full text-xs font-semibold"
              >
                Navigate to Requests Hub
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowRequest(false);
                  setSent(false);
                  setMessage('');
                  setDivisionOfficer('');
                  setCommandingOfficer('');
                }}
                className="w-full text-xs font-semibold"
              >
                Keep Browsing
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-navy-50/50 rounded-lg border border-navy-100">
              <Avatar name={mentor.full_name} src={mentor.avatar_url} size="md" />
              <div>
                <p className="text-sm font-semibold text-navy-800">{mentor.full_name}</p>
                <p className="text-xs text-navy-400">{mentor.rank} · {mentor.specialization}</p>
              </div>
            </div>

            {/* Request Type Selector */}
            <div>
              <label className="block text-xs font-bold text-navy-400 uppercase tracking-wider mb-2">Request Routing Channel</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'mentee_choice', label: 'Direct Invite', desc: 'Direct request to mentor' },
                  { value: 'auto_assign', label: 'Algorithm Invite', desc: 'Suggested compatibility' },
                  { value: 'admin_review', label: 'Chain Endorsement', desc: 'Command routing request' },
                ].map(opt => (
                  <label key={opt.value} className={`flex flex-col p-3 rounded-lg border-2 cursor-pointer transition-all ${requestType === opt.value ? 'border-gold-400 bg-gold-50/30' : 'border-navy-100 hover:border-navy-200'}`}>
                    <div className="flex items-center gap-2">
                      <input type="radio" name="requestType" value={opt.value} checked={requestType === opt.value} onChange={e => setRequestType(e.target.value)} className="w-3.5 h-3.5 text-gold-500" />
                      <span className="text-xs font-bold text-navy-800">{opt.label}</span>
                    </div>
                    <span className="text-[10px] text-navy-400 mt-1 leading-normal">{opt.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Command Chain Verification Info */}
            {requestType === 'admin_review' && (
              <div className="bg-navy-50/50 border border-navy-100/50 p-3.5 rounded-lg space-y-3">
                <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Command Endorsements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-navy-600 mb-1">Division Officer (DO) Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Lt Cdr A. O. Sani"
                      value={divisionOfficer}
                      onChange={e => setDivisionOfficer(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-navy-200 focus:outline-none focus:ring-1 focus:ring-navy-400 text-xs bg-white text-navy-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-navy-600 mb-1">Commanding Officer (CO) Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Cdr J. B. Yusuf"
                      value={commandingOfficer}
                      onChange={e => setCommandingOfficer(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-md border border-navy-200 focus:outline-none focus:ring-1 focus:ring-navy-400 text-xs bg-white text-navy-800"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Optional message templates selector */}
            <div>
              <label className="block text-xs font-bold text-navy-400 uppercase tracking-wider mb-2">Message Templates (Optional)</label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  {
                    title: "Technical Focus",
                    text: `Dear Sir,\n\nI am currently serving in the ${profile?.specialization || 'Operations'} branch, and I would be honored to receive your mentorship. I am looking to specialize further and learn from your technical experience.\n\nRespectfully,\n${profile?.full_name || 'Officer'}`
                  },
                  {
                    title: "Career Strategy",
                    text: `Dear Sir,\n\nI hope this finds you well. I am seeking guidance on career progression, command promotion prerequisites, and strategic postings in the Nigerian Navy.\n\nRespectfully,\n${profile?.full_name || 'Officer'}`
                  },
                  {
                    title: "Command Prep",
                    text: `Dear Sir,\n\nI am preparing for upcoming command examinations. I would appreciate your mentorship to help me refine my leadership and watchkeeping judgment.\n\nRespectfully,\n${profile?.full_name || 'Officer'}`
                  }
                ].map((tmpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setMessage(tmpl.text)}
                    className="px-2.5 py-1.5 border border-navy-200 hover:border-navy-400 rounded-lg text-[10px] font-semibold text-navy-600 bg-navy-50/10 hover:bg-navy-50 transition-colors shrink-0"
                  >
                    Use {tmpl.title}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              label="Cover Message *"
              rows={4}
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Introduce yourself, outline your mentorship goals, and specify what skills you want to build..."
              className="text-xs text-navy-800"
            />
            <p className="text-[10px] text-navy-400 -mt-2">Minimum 10 characters. A personalized message improves pairings approval rates.</p>

            <div className="flex gap-2 justify-end pt-3 border-t border-navy-100">
              <Button variant="ghost" size="sm" onClick={() => setShowRequest(false)}>Cancel</Button>
              <Button
                onClick={handleRequest}
                loading={sending}
                disabled={
                  message.trim().length < 10 ||
                  (requestType === 'admin_review' && (!divisionOfficer.trim() || !commandingOfficer.trim()))
                }
                size="sm"
              >
                Send Request
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {selectedImage && (
        <Modal open={!!selectedImage} onClose={() => setSelectedImage(null)} title="Photo Viewer" size="lg">
          <div className="flex justify-center items-center max-h-[70vh]">
            <img src={selectedImage} alt="Full Preview" className="max-w-full max-h-[65vh] object-contain rounded-md shadow-lg" />
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center text-navy-500 flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-navy-400">{label}</p>
        <p className="text-sm text-navy-800 truncate font-medium">{value}</p>
      </div>
    </div>
  );
}
