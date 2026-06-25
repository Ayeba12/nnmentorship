"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Card, Button, Select, Badge, Spinner, EmptyState, SectionTitle, Modal } from '@/components/ui';
import { Calendar, Plus, Trash2, Clock, Repeat, CalendarDays } from 'lucide-react';
import type { AvailabilitySlot } from '@/lib/types';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30',
];

export default function AvailabilityManager() {
  const { profile } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ day_of_week: '1', start_time: '10:00', end_time: '12:00', is_recurring: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!profile) return;
    try {
      const data = await api.availability.list(profile.id);
      setSlots(data.slots);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [profile]);

  const handleAdd = async () => {
    setSaving(true);
    setError('');
    try {
      await api.availability.create({
        day_of_week: parseInt(form.day_of_week),
        start_time: form.start_time,
        end_time: form.end_time,
        is_recurring: form.is_recurring,
      });
      setShowAdd(false);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.availability.remove(id);
      await load();
    } catch (e: any) { alert(e.message); }
  };

  const groupedByDay = days.map((day, idx) => ({
    day,
    idx,
    slots: slots.filter(s => s.day_of_week === idx).sort((a, b) => a.start_time.localeCompare(b.start_time)),
  })).filter(g => g.slots.length > 0);

  if (loading) return (
    <Card className="p-5">
      <div className="flex justify-center py-8"><Spinner /></div>
    </Card>
  );

  return (
    <Card className="p-5">
      <SectionTitle
        icon={<Calendar className="w-5 h-5 text-navy-400" />}
        action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5" /> Add Slot</Button>}
      >
        My Availability
      </SectionTitle>

      <p className="text-xs text-navy-400 mb-4">Set your weekly availability so mentees can book sessions from your open time slots.</p>

      {slots.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8" />}
          title="No availability set"
          description="Add time slots when you're available for mentorship sessions."
          action={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-3.5 h-3.5" /> Add Your First Slot</Button>}
        />
      ) : (
        <div className="space-y-4">
          {groupedByDay.map(group => (
            <div key={group.idx}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-navy-50 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-navy-500" />
                </div>
                <h4 className="text-sm font-bold text-navy-700">{group.day}</h4>
                <Badge variant="default">{group.slots.length} slot{group.slots.length > 1 ? 's' : ''}</Badge>
              </div>
              <div className="ml-10 space-y-1.5">
                {group.slots.map(slot => (
                  <motion.div
                    key={slot.id}
                    layout
                    className="flex items-center gap-3 p-2.5 bg-navy-50/50 rounded-lg border border-navy-100/50 group"
                  >
                    <Clock className="w-4 h-4 text-navy-400" />
                    <span className="text-sm text-navy-700 font-medium">{slot.start_time} — {slot.end_time}</span>
                    {slot.is_recurring && <Badge variant="info"><Repeat className="w-2.5 h-2.5 mr-0.5" /> Weekly</Badge>}
                    <button
                      onClick={() => handleDelete(slot.id)}
                      className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Slot Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Availability Slot" size="sm">
        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200/60 rounded-lg text-sm text-red-700">{error}</div>}
        <div className="space-y-4">
          <Select label="Day of Week" value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
            {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Start Time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
            <Select label="End Time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}>
              {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2.5 p-3 rounded-lg bg-navy-50/50 border border-navy-100 cursor-pointer">
            <input type="checkbox" checked={form.is_recurring} onChange={e => setForm(f => ({ ...f, is_recurring: e.target.checked }))} className="w-4 h-4 rounded text-gold-500 focus:ring-gold-400" />
            <span className="text-sm text-navy-700">Repeats weekly</span>
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} loading={saving}><Plus className="w-4 h-4" /> Add Slot</Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
