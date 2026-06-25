"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import { Card, Button, Spinner, EmptyState, Modal, Input, Textarea, ProgressBar } from '@/components/ui';
import { Target, Plus, Check, Circle } from 'lucide-react';
import type { Goal, Relationship, Milestone } from '@/lib/types';

export default function Goals() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ relationship_id: '', title: '', description: '', target_date: '' });
  const [newMilestone, setNewMilestone] = useState<{ goalId: number; title: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [gls, rels] = await Promise.all([api.goals.list(), api.relationships.list()]);
      setGoals(gls);
      setRelationships(rels.filter(r => r.status === 'active'));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newGoal.relationship_id || !newGoal.title) return;
    setSaving(true);
    try {
      const rel = relationships.find(r => r.id === Number(newGoal.relationship_id));
      if (!rel) return;
      await api.goals.create({
        mentee_id: profile?.role === 'mentee' ? profile.id : rel.mentee_id,
        mentor_id: profile?.role === 'mentee' ? rel.mentor_id : profile?.id,
        relationship_id: Number(newGoal.relationship_id),
        title: newGoal.title,
        description: newGoal.description,
        target_date: newGoal.target_date || null,
      });
      setShowCreate(false);
      setNewGoal({ relationship_id: '', title: '', description: '', target_date: '' });
      await load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone) return;
    setSaving(true);
    try {
      await api.goals.addMilestone(newMilestone.goalId, newMilestone.title);
      setNewMilestone(null);
      await load();
    } catch (e: any) { alert(e.message); }
    finally { setSaving(false); }
  };

  const toggleMilestone = async (m: Milestone) => {
    await api.goals.toggleMilestone(m.id, !m.completed);
    await load();
  };

  const updateGoalStatus = async (id: number, status: string) => {
    await api.goals.update(id, status);
    await load();
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-navy-900">Goals & Progress</h1>
          <p className="text-sm text-navy-400">Track mentorship goals and milestones</p>
        </div>
        {relationships.length > 0 && <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4" /> New Goal</Button>}
      </div>

      {relationships.length === 0 && activeGoals.length === 0 && (
        <Card className="p-6">
          <EmptyState icon={<Target className="w-10 h-10" />} title="No goals yet" description="You need an active mentorship connection to set goals." />
        </Card>
      )}

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-navy-900">Active Goals ({activeGoals.length})</h2>
          {activeGoals.map(g => {
            const total = g.milestones?.length || 0;
            const done = g.milestones?.filter(m => m.completed).length || 0;
            return (
              <Card key={g.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy-900 break-words">{g.title}</h3>
                    {g.description && <p className="text-sm text-navy-500 mt-1 break-words">{g.description}</p>}
                    {g.target_date && <p className="text-xs text-navy-400 mt-1">Target: {new Date(g.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => updateGoalStatus(g.id, 'completed')} className="self-end sm:self-start flex-shrink-0"><Check className="w-3.5 h-3.5" /> Complete</Button>
                </div>

                {total > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-navy-400">Progress</span>
                      <span className="text-xs font-medium text-navy-600">{done}/{total}</span>
                    </div>
                    <ProgressBar value={done} max={total} />
                  </div>
                )}

                {/* Milestones */}
                {g.milestones && g.milestones.length > 0 && (
                  <div className="space-y-1.5 mb-3">
                    {g.milestones.map(m => (
                      <button key={m.id} onClick={() => toggleMilestone(m)} className="flex items-center gap-2 w-full text-left p-1.5 rounded hover:bg-navy-50">
                        {m.completed ? <Check className="w-4 h-4 text-green-600 flex-shrink-0" /> : <Circle className="w-4 h-4 text-navy-300 flex-shrink-0" />}
                        <span className={`text-sm ${m.completed ? 'text-navy-400 line-through' : 'text-navy-700'}`}>{m.title}</span>
                      </button>
                    ))}
                  </div>
                )}

                <Button size="sm" variant="ghost" onClick={() => setNewMilestone({ goalId: g.id, title: '' })}><Plus className="w-3.5 h-3.5" /> Add Milestone</Button>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div>
          <h2 className="font-semibold text-navy-900 mb-3">Completed ({completedGoals.length})</h2>
          <div className="space-y-3">
            {completedGoals.map(g => (
              <Card key={g.id} className="p-4 opacity-70">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center"><Check className="w-4 h-4 text-green-600" /></div>
                  <div>
                    <p className="text-sm font-medium text-navy-900">{g.title}</p>
                    <p className="text-xs text-navy-400">Completed {g.completed_at ? new Date(g.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Goal">
        <div className="space-y-4">
          <select className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400" value={newGoal.relationship_id} onChange={e => setNewGoal(f => ({ ...f, relationship_id: e.target.value }))}>
            <option value="">Select connection</option>
            {relationships.map(r => {
              const other = profile?.role === 'mentee' ? r.mentor : r.mentee;
              return <option key={r.id} value={r.id}>{other?.full_name}</option>;
            })}
          </select>
          <Input label="Goal Title" value={newGoal.title} onChange={e => setNewGoal(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Complete leadership training" />
          <Textarea label="Description" rows={3} value={newGoal.description} onChange={e => setNewGoal(f => ({ ...f, description: e.target.value }))} placeholder="Describe the goal in detail..." />
          <Input label="Target Date" type="date" value={newGoal.target_date} onChange={e => setNewGoal(f => ({ ...f, target_date: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!newGoal.title || !newGoal.relationship_id}>Create Goal</Button>
          </div>
        </div>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal open={!!newMilestone} onClose={() => setNewMilestone(null)} title="Add Milestone" size="sm">
        <div className="space-y-4">
          <Input label="Milestone Title" value={newMilestone?.title || ''} onChange={e => setNewMilestone(m => m ? { ...m, title: e.target.value } : null)} placeholder="e.g. Complete first module" autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewMilestone(null)}>Cancel</Button>
            <Button onClick={handleAddMilestone} loading={saving} disabled={!newMilestone?.title}>Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
