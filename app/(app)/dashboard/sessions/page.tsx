"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import { Card, Button, Badge, Spinner, EmptyState, Modal, Select, Input, Textarea, PageHeader, SectionTitle, Pagination } from '@/components/ui';
import { Calendar, Clock, Plus, CheckCircle, XCircle, FileText, ChevronLeft, ChevronRight, Check, X, AlertCircle, CalendarDays } from 'lucide-react';
import type { Session, Relationship, AvailabilitySlot } from '@/lib/types';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const durations = [
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' },
  { value: '90', label: '90 minutes' },
  { value: '120', label: '2 hours' },
];

export default function Sessions() {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBook, setShowBook] = useState(false);
  const [logSession, setLogSession] = useState<Session | null>(null);
  const [bookStep, setBookStep] = useState<'select' | 'slots' | 'propose'>('select');
  const [bookForm, setBookForm] = useState({ relationship_id: '', duration: '60', agenda: '' });
  const [availability, setAvailability] = useState<{ slots: AvailabilitySlot[]; bookedSessions: any[] }>({ slots: [], bookedSessions: [] });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logForm, setLogForm] = useState({ notes: '', goals_set: '', progress_recorded: '' });
  const [error, setError] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 5;

  const load = async () => {
    try {
      const [sess, rels] = await Promise.all([api.sessions.list(), api.relationships.list()]);
      setSessions(sess);
      setRelationships(rels.filter(r => r.status === 'active'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getWeekStart = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + offset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // Load availability when a relationship is selected for booking
  useEffect(() => {
    if (bookForm.relationship_id && showBook) {
      const rel = relationships.find(r => r.id === Number(bookForm.relationship_id));
      if (rel) {
        const mentorId = profile?.role === 'mentee' ? rel.mentor_id : rel.mentee_id;
        setLoadingSlots(true);
        const weekStart = getWeekStart(weekOffset);
        api.availability.list(mentorId, weekStart.toISOString().split('T')[0])
          .then(data => setAvailability(data))
          .catch(() => setAvailability({ slots: [], bookedSessions: [] }))
          .finally(() => setLoadingSlots(false));
      }
    }
  }, [bookForm.relationship_id, showBook, weekOffset]);

  const weekDays = useMemo(() => {
    const start = getWeekStart(weekOffset);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [weekOffset]);

  const getSlotsForDay = (day: number) => availability.slots.filter(s => s.day_of_week === day);

  const isSlotBooked = (date: Date, time: string, duration: number) => {
    const sessionStart = new Date(date);
    const [h, m] = time.split(':').map(Number);
    sessionStart.setHours(h, m, 0, 0);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);
    return availability.bookedSessions.some(bs => {
      const bsStart = new Date(bs.scheduled_at);
      const bsEnd = new Date(bsStart.getTime() + bs.duration_minutes * 60000);
      return sessionStart < bsEnd && sessionEnd > bsStart;
    });
  };

  const handleBookSlot = async () => {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    setError('');
    try {
      const dt = new Date(selectedDate);
      const [h, m] = selectedTime.split(':').map(Number);
      dt.setHours(h, m, 0, 0);
      await api.sessions.book(
        Number(bookForm.relationship_id),
        dt.toISOString(),
        parseInt(bookForm.duration),
        'booked_slot',
        bookForm.agenda
      );
      resetBooking();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProposeTime = async () => {
    if (!selectedDate || !selectedTime) return;
    setSaving(true);
    setError('');
    try {
      const dt = new Date(selectedDate);
      const [h, m] = selectedTime.split(':').map(Number);
      dt.setHours(h, m, 0, 0);
      await api.sessions.book(
        Number(bookForm.relationship_id),
        dt.toISOString(),
        parseInt(bookForm.duration),
        'proposed_time',
        bookForm.agenda
      );
      resetBooking();
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const resetBooking = () => {
    setShowBook(false);
    setBookStep('select');
    setBookForm({ relationship_id: '', duration: '60', agenda: '' });
    setSelectedDate(null);
    setSelectedTime('');
    setWeekOffset(0);
    setError('');
  };

  const handleLog = async () => {
    if (!logSession) return;
    setSaving(true);
    try {
      await api.sessions.update(logSession.id, {
        status: 'completed',
        notes: logForm.notes,
        goals_set: logForm.goals_set,
        progress_recorded: logForm.progress_recorded,
      });
      setLogSession(null);
      setLogForm({ notes: '', goals_set: '', progress_recorded: '' });
      await load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleCancel = async (id: number) => {
    if (!confirm('Cancel this session?')) return;
    await api.sessions.update(id, { status: 'cancelled' });
    await load();
  };

  const handleConfirmProposal = async (id: number) => {
    await api.sessions.confirm(id);
    await load();
  };

  const handleRejectProposal = async (id: number) => {
    await api.sessions.rejectProposal(id);
    await load();
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="h-8 w-48 skeleton rounded" />
      {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-md skeleton" />)}
    </div>
  );

  const pendingConfirmations = sessions.filter(s => s.status === 'pending_confirmation');
  const upcoming = sessions.filter(s => s.status === 'scheduled' && new Date(s.scheduled_at) >= new Date());
  const past = sessions.filter(s => s.status !== 'scheduled' && s.status !== 'pending_confirmation' || (s.status === 'scheduled' && new Date(s.scheduled_at) < new Date()));

  const getOther = (s: Session) => {
    if (!profile) return null;
    const isMentee = s.relationship?.mentee_id === profile.id;
    return isMentee ? s.relationship?.mentor : s.relationship?.mentee;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sessions"
        subtitle="Book sessions from mentor availability, propose times, and track your meetings"
        action={relationships.length > 0 && <Button onClick={() => { setShowBook(true); setBookStep('select'); }}><Plus className="w-4 h-4" /> Book Session</Button>}
      />

      {relationships.length === 0 && (
        <Card className="p-6">
          <EmptyState icon={<Calendar className="w-10 h-10" />} title="No active connections" description="You need an active mentorship connection to book sessions." />
        </Card>
      )}

      {/* Pending Confirmations (for proposed times) */}
      {pendingConfirmations.length > 0 && (
        <Card className="p-5 border-amber-200/60">
          <SectionTitle icon={<div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center"><AlertCircle className="w-4 h-4 text-amber-500" /></div>}>
            Pending Confirmations ({pendingConfirmations.length})
          </SectionTitle>
          <div className="space-y-3">
            {pendingConfirmations.map(s => {
              const other = getOther(s);
              return (
                 <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/50 rounded-lg border border-amber-100">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-amber-100 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-medium text-amber-700 leading-none">{new Date(s.scheduled_at).toLocaleDateString('en-GB', { month: 'short' })}</span>
                      <span className="text-base font-bold text-amber-700 leading-none mt-0.5">{new Date(s.scheduled_at).getDate()}</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-sm font-medium text-navy-800">
                        {new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes} min
                      </p>
                      <p className="text-xs text-navy-400">with {other?.full_name} · Proposed time awaiting confirmation</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-center sm:justify-start">
                    <Button size="sm" variant="success" onClick={() => handleConfirmProposal(s.id)}><Check className="w-3.5 h-3.5" /> Confirm</Button>
                    <Button size="sm" variant="outline" onClick={() => handleRejectProposal(s.id)}><X className="w-3.5 h-3.5" /> Decline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Upcoming Sessions */}
      <div>
        <SectionTitle icon={<Calendar className="w-5 h-5" />}>
          Upcoming ({upcoming.length})
        </SectionTitle>
        {upcoming.length === 0 ? (
          <Card className="p-6"><EmptyState icon={<Calendar className="w-8 h-8" />} title="No upcoming sessions" description="Book a session to schedule your next meeting." action={relationships.length > 0 ? <Button size="sm" onClick={() => { setShowBook(true); setBookStep('select'); }}><Plus className="w-3.5 h-3.5" /> Book Session</Button> : undefined} /></Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map(s => {
              const other = getOther(s);
              return (
                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card hover className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-navy-600 to-navy-700 flex flex-col items-center justify-center flex-shrink-0 text-white">
                          <span className="text-[10px] font-medium leading-none">{new Date(s.scheduled_at).toLocaleDateString('en-GB', { month: 'short' })}</span>
                          <span className="text-lg font-bold leading-none mt-0.5">{new Date(s.scheduled_at).getDate()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy-800">
                            {new Date(s.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {s.duration_minutes} min
                          </p>
                          <p className="text-xs text-navy-400">with {other?.full_name || 'Unknown'}</p>
                        </div>
                        <Badge variant="info" dot>{s.session_type === 'booked_slot' ? 'Booked Slot' : 'Proposed Time'}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleCancel(s.id)}><XCircle className="w-3.5 h-3.5" /> Cancel</Button>
                        <Button size="sm" onClick={() => setLogSession(s)}><FileText className="w-3.5 h-3.5" /> Log Session</Button>
                      </div>
                    </div>
                    {s.notes && s.notes.startsWith('Agenda:') && (
                      <p className="mt-3 pt-3 border-t border-navy-100 text-sm text-navy-600"><span className="font-medium">Agenda: </span>{s.notes.replace('Agenda: ', '')}</p>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Sessions */}
      {past.length > 0 && (
        <div>
          <SectionTitle icon={<Clock className="w-5 h-5" />}>
            History ({past.length})
          </SectionTitle>
          <div className="space-y-3">
            {past.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage).map(s => {
              const other = getOther(s);
              return (
                <Card key={s.id} className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-navy-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-navy-800">{new Date(s.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        <p className="text-xs text-navy-400">with {other?.full_name || 'Unknown'} · {s.duration_minutes} min</p>
                      </div>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'default'} dot>{s.status.replace('_', ' ')}</Badge>
                  </div>
                  {s.notes && !s.notes.startsWith('Agenda:') && <p className="mt-3 pt-3 border-t border-navy-100 text-sm text-navy-600"><span className="font-medium">Notes: </span>{s.notes}</p>}
                </Card>
              );
            })}
          </div>
          <Pagination
            currentPage={historyPage}
            totalPages={Math.ceil(past.length / itemsPerPage)}
            onPageChange={setHistoryPage}
          />
        </div>
      )}

      {/* Book Session Modal */}
      <Modal open={showBook} onClose={resetBooking} title="Book a Session" size="lg">
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200/60 rounded-lg text-sm text-red-700">{error}</div>}

        {/* Step 1: Select connection & method */}
        {bookStep === 'select' && (
          <div className="space-y-4">
            <Select label="Mentorship Connection" value={bookForm.relationship_id} onChange={e => setBookForm(f => ({ ...f, relationship_id: e.target.value }))}>
              <option value="">Select connection</option>
              {relationships.map(r => {
                const other = profile?.role === 'mentee' ? r.mentor : r.mentee;
                return <option key={r.id} value={r.id}>{other?.full_name} · {other?.rank}</option>;
              })}
            </Select>

            {bookForm.relationship_id && (
              <>
                <Select label="Duration" value={bookForm.duration} onChange={e => setBookForm(f => ({ ...f, duration: e.target.value }))}>
                  {durations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </Select>
                <Textarea label="Agenda (optional)" rows={2} value={bookForm.agenda} onChange={e => setBookForm(f => ({ ...f, agenda: e.target.value }))} placeholder="What would you like to discuss?" />

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setBookStep('slots')}
                    className="p-4 rounded-lg border-2 border-navy-100 hover:border-gold-400 hover:bg-gold-50/30 text-left transition-all"
                  >
                    <CalendarDays className="w-5 h-5 text-navy-500 mb-2" />
                    <p className="text-sm font-semibold text-navy-700">Book from Slots</p>
                    <p className="text-xs text-navy-400">Choose from mentor's available times</p>
                  </button>
                  <button
                    onClick={() => setBookStep('propose')}
                    className="p-4 rounded-lg border-2 border-navy-100 hover:border-gold-400 hover:bg-gold-50/30 text-left transition-all"
                  >
                    <Clock className="w-5 h-5 text-navy-500 mb-2" />
                    <p className="text-sm font-semibold text-navy-700">Propose a Time</p>
                    <p className="text-xs text-navy-400">Suggest any time for confirmation</p>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 2: Slot-based booking */}
        {bookStep === 'slots' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setWeekOffset(w => w - 1)} className="w-8 h-8 rounded-lg border border-navy-200 flex items-center justify-center hover:bg-navy-50"><ChevronLeft className="w-4 h-4" /></button>
              <p className="text-sm font-medium text-navy-700">
                {weekDays[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} — {weekDays[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
              <button onClick={() => setWeekOffset(w => w + 1)} className="w-8 h-8 rounded-lg border border-navy-200 flex items-center justify-center hover:bg-navy-50"><ChevronRight className="w-4 h-4" /></button>
            </div>

            {loadingSlots ? (
              <div className="flex justify-center py-8"><Spinner /></div>
            ) : availability.slots.length === 0 ? (
              <div className="p-6 bg-amber-50/50 rounded-lg border border-amber-100 text-center">
                <CalendarDays className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-navy-700">No availability slots set</p>
                <p className="text-xs text-navy-400 mt-1">This mentor hasn't set availability. Try proposing a time instead.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setBookStep('propose')}>Propose a Time</Button>
              </div>
            ) : (
              <div className="overflow-x-auto pb-2 -mx-1 px-1">
                <div className="grid grid-cols-7 gap-1.5 min-w-[500px]">
                  {weekDays.map((date, dayIdx) => {
                    const daySlots = getSlotsForDay(date.getDay());
                    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
                    return (
                      <div key={dayIdx} className={`min-h-[120px] ${isPast ? 'opacity-40' : ''}`}>
                        <div className="text-center mb-1.5">
                          <p className="text-[10px] font-bold text-navy-400 uppercase">{daysOfWeek[date.getDay()].slice(0, 3)}</p>
                          <p className={`text-sm font-bold ${selectedDate?.toDateString() === date.toDateString() ? 'text-gold-600' : 'text-navy-700'}`}>{date.getDate()}</p>
                        </div>
                        <div className="space-y-1">
                          {daySlots.map(slot => {
                            const intervals: string[] = [];
                            const [sh, sm] = slot.start_time.split(':').map(Number);
                            const [eh, em] = slot.end_time.split(':').map(Number);
                            let ch = sh, cm = sm;
                            while (ch < eh || (ch === eh && cm < em)) {
                              intervals.push(`${String(ch).padStart(2, '0')}:${String(cm).padStart(2, '0')}`);
                              cm += 30;
                              if (cm >= 60) { cm -= 60; ch++; }
                            }
                            return intervals.map(time => {
                              const booked = isSlotBooked(date, time, parseInt(bookForm.duration));
                              const isSelected = selectedDate?.toDateString() === date.toDateString() && selectedTime === time;
                              return (
                                <button
                                  key={time}
                                  disabled={isPast || booked}
                                  onClick={() => { setSelectedDate(date); setSelectedTime(time); }}
                                  className={`w-full text-[10px] py-1 px-1 rounded transition-all ${
                                    isSelected ? 'bg-gold-500 text-navy-900 font-bold' :
                                    booked ? 'bg-red-50 text-red-300 cursor-not-allowed line-through' :
                                    'bg-navy-50 text-navy-600 hover:bg-navy-100'
                                  }`}
                                >
                                  {time}
                                </button>
                              );
                            });
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedDate && selectedTime && (
              <div className="p-3 bg-gold-50/50 rounded-lg border border-gold-200/60 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-navy-700">Selected: {selectedDate.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  <p className="text-xs text-navy-400">at {selectedTime} · {bookForm.duration} min</p>
                </div>
                <Button size="sm" onClick={handleBookSlot} loading={saving}><Check className="w-3.5 h-3.5" /> Confirm Booking</Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setBookStep('select')}><ChevronLeft className="w-4 h-4" /> Back</Button>
            </div>
          </div>
        )}

        {/* Step 3: Propose a time */}
        {bookStep === 'propose' && (
          <div className="space-y-4">
            <div className="p-3 bg-ocean-50/50 rounded-lg border border-ocean-200/60">
              <p className="text-sm text-ocean-700">
                <Clock className="w-4 h-4 inline mr-1.5" />
                Propose a time that works for you. The other person will need to confirm before it's scheduled.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Date" type="date" value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} onChange={e => setSelectedDate(new Date(e.target.value))} />
              <Input label="Time" type="time" value={selectedTime} onChange={e => setSelectedTime(e.target.value)} />
            </div>
            <Select label="Duration" value={bookForm.duration} onChange={e => setBookForm(f => ({ ...f, duration: e.target.value }))}>
              {durations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </Select>
            <Textarea label="Agenda (optional)" rows={2} value={bookForm.agenda} onChange={e => setBookForm(f => ({ ...f, agenda: e.target.value }))} placeholder="What would you like to discuss?" />

            {error && <div className="p-3 bg-red-50 border border-red-200/60 rounded-lg text-sm text-red-700">{error}</div>}

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setBookStep('select')}><ChevronLeft className="w-4 h-4" /> Back</Button>
              <Button onClick={handleProposeTime} loading={saving} disabled={!selectedDate || !selectedTime}>
                <Clock className="w-4 h-4" /> Send Proposal
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Log Session Modal */}
      <Modal open={!!logSession} onClose={() => setLogSession(null)} title="Log Session Notes">
        <div className="space-y-4">
          {logSession && (
            <p className="text-sm text-navy-500 p-3 bg-navy-50/50 rounded-lg">
              Session on {new Date(logSession.scheduled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} at {new Date(logSession.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
          <Textarea label="Session Notes" rows={3} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} placeholder="Key discussion points and observations..." />
          <Textarea label="Goals Set" rows={2} value={logForm.goals_set} onChange={e => setLogForm(f => ({ ...f, goals_set: e.target.value }))} placeholder="Goals agreed upon in this session..." />
          <Textarea label="Progress Recorded" rows={2} value={logForm.progress_recorded} onChange={e => setLogForm(f => ({ ...f, progress_recorded: e.target.value }))} placeholder="Progress made since last session..." />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setLogSession(null)}>Cancel</Button>
            <Button onClick={handleLog} loading={saving}><CheckCircle className="w-4 h-4" /> Complete & Log</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
