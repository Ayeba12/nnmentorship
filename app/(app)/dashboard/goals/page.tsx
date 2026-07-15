"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import { Card, Button, Spinner, EmptyState, Modal, Input, Textarea, ProgressBar, Badge } from '@/components/ui';
import { Target, Plus, Check, Circle, ChevronDown, ChevronUp, Trash2, FileText, CheckSquare, Square, Search, Award, Clock, BarChart2, CheckCircle2, AlertCircle, HelpCircle, User, Compass } from 'lucide-react';
import type { Goal, Relationship, Milestone, SubTask } from '@/lib/types';

export default function Goals() {
  const { profile } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newGoal, setNewGoal] = useState({ relationship_id: '', title: '', description: '', target_date: '' });
  const [newMilestone, setNewMilestone] = useState<{ goalId: number; title: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [expandedMilestones, setExpandedMilestones] = useState<Record<number, boolean>>({});
  const [newSubTask, setNewSubTask] = useState<{ milestoneId: number | null; title: string; type: 'checkbox' | 'choice' | 'note'; optional: boolean }>({ milestoneId: null, title: '', type: 'checkbox', optional: false });
  const [notesInput, setNotesInput] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'personal' | 'connection' | 'completed'>('all');
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [editingSubTask, setEditingSubTask] = useState<{ milestone: Milestone; taskId: string; title: string } | null>(null);

  const loadGoals = async () => {
    try {
      const gls = await api.goals.list();
      setGoals(gls);
    } catch (e) {
      console.error(e);
    }
  };

  const load = async () => {
    try {
      const [gls, rels] = await Promise.all([api.goals.list(), api.relationships.list()]);
      setGoals(gls);
      setRelationships(rels.filter(r => r.status === 'active'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDeleteGoal = async (id: number) => {
    if (!confirm("Are you sure you want to delete this goal and all its milestones?")) return;
    setSaving(true);
    try {
      await api.goals.deleteGoal(id);
      await loadGoals();
    } catch (e: any) {
      alert("Failed to delete goal: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMilestone = async (id: number) => {
    if (!confirm("Are you sure you want to delete this milestone?")) return;
    setSaving(true);
    try {
      await api.goals.deleteMilestone(id);
      await loadGoals();
    } catch (e: any) {
      alert("Failed to delete milestone: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateGoalDetails = async () => {
    if (!editingGoal || !editingGoal.title) return;
    setSaving(true);
    try {
      await api.goals.updateGoal(editingGoal.id, {
        title: editingGoal.title,
        description: editingGoal.description,
        target_date: editingGoal.target_date
      });
      setEditingGoal(null);
      await loadGoals();
    } catch (e: any) {
      alert("Failed to update goal: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMilestoneTitle = async () => {
    if (!editingMilestone || !editingMilestone.title) return;
    setSaving(true);
    try {
      await api.goals.updateMilestone(editingMilestone.id, editingMilestone.title);
      setEditingMilestone(null);
      await loadGoals();
    } catch (e: any) {
      alert("Failed to update milestone: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newGoal.title) return;
    setSaving(true);
    try {
      let createPayload: any = {
        title: newGoal.title,
        description: newGoal.description,
        target_date: newGoal.target_date || null,
        mentee_id: profile?.id,
        mentor_id: null,
        relationship_id: null
      };

      if (newGoal.relationship_id) {
        const rel = relationships.find(r => r.id === Number(newGoal.relationship_id));
        if (rel) {
          createPayload.mentee_id = profile?.role === 'mentee' ? profile.id : rel.mentee_id;
          createPayload.mentor_id = profile?.role === 'mentee' ? rel.mentor_id : profile?.id;
          createPayload.relationship_id = Number(newGoal.relationship_id);
        }
      }

      await api.goals.create(createPayload);
      setShowCreate(false);
      setNewGoal({ relationship_id: '', title: '', description: '', target_date: '' });
      await loadGoals();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone) return;
    setSaving(true);
    try {
      await api.goals.addMilestone(newMilestone.goalId, newMilestone.title);
      setNewMilestone(null);
      await loadGoals();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleMilestone = async (m: Milestone) => {
    const originalGoals = [...goals];

    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== m.goal_id) return g;
      return {
        ...g,
        milestones: g.milestones?.map(ms => {
          if (ms.id !== m.id) return ms;
          return {
            ...ms,
            completed: !m.completed,
            completed_at: !m.completed ? new Date().toISOString() : null
          };
        })
      };
    }));

    try {
      await api.goals.toggleMilestone(m.id, !m.completed);
      await loadGoals();
    } catch (e: any) {
      setGoals(originalGoals);
      alert("Failed to update milestone: " + e.message);
    }
  };

  const updateGoalStatus = async (id: number, status: string) => {
    const originalGoals = [...goals];

    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== id) return g;
      return {
        ...g,
        status: status as 'active' | 'completed' | 'abandoned',
        completed_at: status === 'completed' ? new Date().toISOString() : null
      };
    }));

    try {
      await api.goals.update(id, status);
      await loadGoals();
    } catch (e: any) {
      setGoals(originalGoals);
      alert("Failed to update goal: " + e.message);
    }
  };

  const toggleExpandMilestone = (id: number) => {
    setExpandedMilestones(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSubTask = async (milestone: Milestone) => {
    if (!newSubTask.title.trim()) return;
    const taskObj: SubTask = {
      id: `task-${Date.now()}`,
      title: newSubTask.title.trim(),
      completed: false,
      type: newSubTask.type,
      value: newSubTask.type === 'choice' ? null : '',
      optional: newSubTask.optional
    };
    const updatedSubtasks = [...(milestone.subtasks || []), taskObj];
    const originalGoals = [...goals];
    
    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== milestone.goal_id) return g;
      return {
        ...g,
        milestones: g.milestones?.map(m => {
          if (m.id !== milestone.id) return m;
          return { ...m, subtasks: updatedSubtasks };
        })
      };
    }));
    
    try {
      await api.goals.updateMilestoneSubtasks(milestone.id, updatedSubtasks);
      setNewSubTask({ milestoneId: null, title: '', type: 'checkbox', optional: false });
      await loadGoals();
    } catch (e: any) {
      setGoals(originalGoals);
      alert("Failed to add task: " + e.message);
    }
  };

  const handleUpdateSubTaskTitle = async () => {
    if (!editingSubTask || !editingSubTask.title.trim()) return;
    const { milestone, taskId, title } = editingSubTask;
    const updatedSubtasks = (milestone.subtasks || []).map(t => {
      if (t.id === taskId) {
        return { ...t, title: title.trim() };
      }
      return t;
    });

    const originalGoals = [...goals];
    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== milestone.goal_id) return g;
      return {
        ...g,
        milestones: g.milestones?.map(m => {
          if (m.id !== milestone.id) return m;
          return { ...m, subtasks: updatedSubtasks };
        })
      };
    }));

    try {
      await api.goals.updateMilestoneSubtasks(milestone.id, updatedSubtasks);
      setEditingSubTask(null);
      await loadGoals();
    } catch (e: any) {
      setGoals(originalGoals);
      alert("Failed to update task: " + e.message);
    }
  };

  const handleDeleteSubTask = async (milestone: Milestone, taskId: string) => {
    const updatedSubtasks = (milestone.subtasks || []).filter(t => t.id !== taskId);
    const originalGoals = [...goals];
    
    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== milestone.goal_id) return g;
      return {
        ...g,
        milestones: g.milestones?.map(m => {
          if (m.id !== milestone.id) return m;
          return { ...m, subtasks: updatedSubtasks };
        })
      };
    }));
    
    try {
      await api.goals.updateMilestoneSubtasks(milestone.id, updatedSubtasks);
      await loadGoals();
    } catch (e: any) {
      setGoals(originalGoals);
      alert("Failed to delete task: " + e.message);
    }
  };

  const handleUpdateSubTaskState = async (milestone: Milestone, taskId: string, updates: Partial<SubTask>) => {
    const updatedSubtasks = (milestone.subtasks || []).map(t => {
      if (t.id !== taskId) return t;
      const updatedTask = { ...t, ...updates };
      let isCompleted = false;
      if (updatedTask.type === 'checkbox') {
        isCompleted = !!updatedTask.completed;
      } else if (updatedTask.type === 'choice') {
        isCompleted = updatedTask.value === 'yes' || updatedTask.value === 'no';
      } else if (updatedTask.type === 'note') {
        isCompleted = !!(updatedTask.value && updatedTask.value.toString().trim().length > 0);
      }
      updatedTask.completed = isCompleted;
      return updatedTask;
    });

    const mandatoryTasks = updatedSubtasks.filter(t => !t.optional);
    const allMandatoryCompleted = mandatoryTasks.length > 0 && mandatoryTasks.every(t => t.completed);
    const shouldMilestoneBeCompleted = allMandatoryCompleted;

    const originalGoals = [...goals];
    
    setGoals(prevGoals => prevGoals.map(g => {
      if (g.id !== milestone.goal_id) return g;
      return {
        ...g,
        milestones: g.milestones?.map(m => {
          if (m.id !== milestone.id) return m;
          return {
            ...m,
            subtasks: updatedSubtasks,
            completed: shouldMilestoneBeCompleted ? true : m.completed,
            completed_at: shouldMilestoneBeCompleted ? (m.completed_at || new Date().toISOString()) : m.completed_at
          };
        })
      };
    }));

    try {
      await api.goals.updateMilestoneSubtasks(milestone.id, updatedSubtasks);
      if (shouldMilestoneBeCompleted && !milestone.completed) {
        await api.goals.toggleMilestone(milestone.id, true);
      }
      await loadGoals();
    } catch (e: any) {
      setGoals(originalGoals);
      alert("Failed to update task: " + e.message);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  // Calculate statistics
  const totalGoalsCount = goals.length;
  const activeGoalsCount = goals.filter(g => g.status === 'active' || g.status.toLowerCase() === 'active' || g.status.toUpperCase() === 'IN_PROGRESS' || g.status.toUpperCase() === 'PENDING').length;
  const completedGoalsCount = goals.filter(g => g.status === 'completed' || g.status.toLowerCase() === 'completed' || g.status.toUpperCase() === 'COMPLETED').length;
  
  const totalMilestonesCount = goals.reduce((acc, g) => acc + (g.milestones?.length || 0), 0);
  const completedMilestonesCount = goals.reduce((acc, g) => acc + (g.milestones?.filter(m => m.completed).length || 0), 0);
  
  const totalSubTasksCount = goals.reduce((acc, g) => acc + (g.milestones?.reduce((subAcc, m) => subAcc + (m.subtasks?.length || 0), 0) || 0), 0);
  const completedSubTasksCount = goals.reduce((acc, g) => acc + (g.milestones?.reduce((subAcc, m) => subAcc + (m.subtasks?.filter(t => t.completed).length || 0), 0) || 0), 0);
  
  const milestoneProgressPercent = totalMilestonesCount > 0 ? Math.round((completedMilestonesCount / totalMilestonesCount) * 100) : 0;
  const taskProgressPercent = totalSubTasksCount > 0 ? Math.round((completedSubTasksCount / totalSubTasksCount) * 100) : 0;

  // Filter goals based on search query and active tab
  const filteredGoals = goals.filter(g => {
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (g.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const isCompleted = g.status === 'completed' || g.status.toLowerCase() === 'completed' || g.status.toUpperCase() === 'COMPLETED';
    
    if (!matchesSearch) return false;
    
    if (activeTab === 'completed') {
      return isCompleted;
    }
    
    if (isCompleted) return false; // Hide completed in other tabs
    
    if (activeTab === 'personal') {
      return !g.relationship_id;
    }
    if (activeTab === 'connection') {
      return !!g.relationship_id;
    }
    
    return true; // 'all' tab shows active goals
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Goals & Milestones</h1>
          <p className="text-sm text-navy-400">Track connection roadmaps, personal targets, and documented progress</p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setShowCreate(true)} className="shadow-md shadow-navy-100 hover:shadow-lg transition-all duration-300">
            <Plus className="w-4 h-4 mr-1.5" /> Create New Goal
          </Button>
        </motion.div>
      </div>

      {/* Stats Cards Dashboard Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-navy-50/20 border border-navy-100/50 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-navy-100/50 flex items-center justify-center text-navy-900">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Active Goals</p>
            <h3 className="text-xl font-bold text-navy-900">{activeGoalsCount}</h3>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-amber-50/10 border border-navy-100/50 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Milestone Progress</p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-xl font-bold text-navy-900">{milestoneProgressPercent}%</h3>
              <span className="text-[10px] text-navy-400 font-medium">({completedMilestonesCount}/{totalMilestonesCount})</span>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-green-50/10 border border-navy-100/50 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Action Items Done</p>
            <div className="flex items-baseline gap-1.5">
              <h3 className="text-xl font-bold text-navy-900">{taskProgressPercent}%</h3>
              <span className="text-[10px] text-navy-400 font-medium">({completedSubTasksCount}/{totalSubTasksCount})</span>
            </div>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -3 }} className="bg-gradient-to-br from-white to-navy-50/20 border border-navy-100/50 rounded-xl p-4 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-navy-100/50 flex items-center justify-center text-navy-900">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Completed Goals</p>
            <h3 className="text-xl font-bold text-navy-900">{completedGoalsCount}</h3>
          </div>
        </motion.div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-md border border-navy-100/40 rounded-xl p-3 shadow-sm select-none">
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'all' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-500 hover:text-navy-900 hover:bg-navy-100/30'}`}
          >
            Active Goals ({activeGoalsCount})
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'personal' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-500 hover:text-navy-900 hover:bg-navy-100/30'}`}
          >
            Personal Targets
          </button>
          <button
            onClick={() => setActiveTab('connection')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'connection' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-500 hover:text-navy-900 hover:bg-navy-100/30'}`}
          >
            Mentorship Roadmap
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${activeTab === 'completed' ? 'bg-navy-900 text-white shadow-sm' : 'text-navy-500 hover:text-navy-900 hover:bg-navy-100/30'}`}
          >
            Completed Archive ({completedGoalsCount})
          </button>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 text-navy-900"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      {filteredGoals.length === 0 ? (
        <Card className="p-10 flex flex-col items-center justify-center text-center">
          <EmptyState
            icon={<Target className="w-12 h-12 text-navy-300 stroke-[1.5]" />}
            title={searchQuery ? "No matching goals found" : "No goals in this section"}
            description={searchQuery ? "Try refining your search keyword." : "Create a goal above to outline path and milestones."}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredGoals.map(g => {
            const isCompletedGoal = g.status === 'completed' || g.status.toLowerCase() === 'completed' || g.status.toUpperCase() === 'COMPLETED';
            const total = g.milestones?.length || 0;
            const done = g.milestones?.filter(m => m.completed).length || 0;
            const targetRel = g.relationship_id ? relationships.find(r => r.id === g.relationship_id) : null;
            const relationshipPartner = targetRel ? (profile?.role === 'mentee' ? targetRel.mentor : targetRel.mentee) : null;

            return (
              <Card key={g.id} className={`p-6 border border-navy-100/60 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-navy-200 ${isCompletedGoal ? 'bg-gradient-to-br from-white to-green-50/5' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`font-bold text-navy-900 text-lg break-words ${isCompletedGoal ? 'line-through text-navy-400' : ''}`}>{g.title}</h3>
                      {g.relationship_id ? (
                        <Badge variant="default" className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[9px] py-0.5 px-2 select-none uppercase tracking-wider shrink-0">
                          Mentorship: {relationshipPartner?.full_name}
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-navy-50 text-navy-600 border border-navy-100 font-bold text-[9px] py-0.5 px-2 select-none uppercase tracking-wider shrink-0">
                          Personal Target
                        </Badge>
                      )}
                    </div>
                    {g.description && <p className="text-sm text-navy-500 break-words leading-relaxed max-w-3xl">{g.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-navy-400 pt-1">
                      {g.target_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Target: {new Date(g.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      )}
                      {isCompletedGoal && g.completed_at && (
                        <span className="text-green-600 font-medium flex items-center gap-1 select-none">
                          <Check className="w-3.5 h-3.5" /> Achieved {new Date(g.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-start">
                    {!isCompletedGoal && (
                      <Button
                        size="sm"
                        onClick={() => updateGoalStatus(g.id, 'completed')}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-sm flex-shrink-0"
                      >
                        <Check className="w-3.5 h-3.5 mr-1 stroke-[2.5]" /> Achieve
                      </Button>
                    )}
                    <button
                      onClick={() => setEditingGoal(g)}
                      className="p-1.5 border border-navy-200 rounded-lg hover:bg-navy-50 text-navy-600 hover:text-navy-900 transition-colors"
                      title="Edit Goal"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(g.id)}
                      className="p-1.5 border border-red-200 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                  <div className="mb-6 bg-navy-50/30 border border-navy-100/30 rounded-xl p-3.5 select-none">
                    <div className="flex items-center justify-between mb-1.5 text-xs">
                      <span className="font-semibold text-navy-500 uppercase tracking-wider">Milestone Breakdown</span>
                      <span className="font-bold text-navy-800">{Math.round((done / total) * 100)}% ({done} of {total} completed)</span>
                    </div>
                    <ProgressBar value={done} max={total} color="gold" />
                  </div>
                )}

                {/* Timeline Roadmap Pathway of Milestones */}
                {g.milestones && g.milestones.length > 0 ? (
                  <div className="space-y-4 relative pl-5 border-l border-dashed border-navy-200/80 ml-3.5">
                    {g.milestones.map((m, idx) => {
                      const isExpanded = !!expandedMilestones[m.id];
                      const subTasksCount = m.subtasks?.length || 0;
                      const subTasksCompleted = m.subtasks?.filter(t => t.completed).length || 0;
                      
                      return (
                        <div key={m.id} className="relative group/milestone">
                          {/* Timeline Node dot */}
                          <div className={`absolute -left-[26px] top-1.5 w-3 h-3 rounded-full border-2 transition-all duration-300 flex items-center justify-center bg-white group-hover/milestone:scale-125 ${m.completed ? 'border-green-600 bg-green-50 shadow-sm' : 'border-navy-300 bg-white shadow-sm'}`} />

                          {/* Milestone Main Box */}
                          <div className="bg-white border border-navy-100/60 rounded-xl p-4 shadow-sm hover:border-navy-200 transition-all duration-200 space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0 flex-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMilestone(m);
                                  }}
                                  className="focus:outline-none flex-shrink-0 mt-0.5 transition-transform duration-200 active:scale-95"
                                  aria-label="Toggle milestone state"
                                >
                                  {m.completed ? (
                                    <div className="w-5 h-5 rounded-full bg-green-100 border border-green-300 flex items-center justify-center text-green-700">
                                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border border-navy-300 bg-white hover:border-navy-500 transition-colors" />
                                  )}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <span
                                    onClick={() => toggleExpandMilestone(m.id)}
                                    className={`text-sm font-semibold truncate cursor-pointer hover:text-navy-900 select-none block ${m.completed ? 'text-navy-400 line-through' : 'text-navy-800'}`}
                                  >
                                    {m.title}
                                  </span>
                                  {subTasksCount > 0 && (
                                    <span className="text-[10px] text-navy-400 font-medium select-none mt-0.5 block">
                                      Action items: {subTasksCompleted} of {subTasksCount} completed ({Math.round((subTasksCompleted / subTasksCount) * 100)}%)
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 select-none">
                                <button
                                  onClick={() => setEditingMilestone(m)}
                                  className="text-navy-400 hover:text-navy-600 transition-colors p-1 rounded hover:bg-navy-100/50 focus:outline-none"
                                  title="Edit Milestone"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteMilestone(m.id)}
                                  className="text-navy-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 focus:outline-none"
                                  title="Delete Milestone"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => toggleExpandMilestone(m.id)}
                                  className="text-navy-400 hover:text-navy-600 transition-colors p-1 bg-navy-50 hover:bg-navy-100/50 rounded-lg focus:outline-none"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            {/* Sub-tasks Drawer */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden space-y-3 pt-3 border-t border-navy-100/30"
                                >
                                  {/* Subtasks List */}
                                  <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-none pr-1">
                                    {m.subtasks && m.subtasks.length > 0 ? (
                                      m.subtasks.map(task => (
                                        <div key={task.id} className="flex flex-col gap-2 p-3 bg-navy-50/20 border border-navy-100/30 rounded-xl hover:bg-navy-50/40 transition-colors">
                                          <div className="flex items-start justify-between gap-3 w-full">
                                            <div className="flex items-start gap-3 flex-1 min-w-0">
                                              {/* Checkbox Action Item */}
                                              {task.type === 'checkbox' && (
                                                <button
                                                  onClick={() => handleUpdateSubTaskState(m, task.id, { completed: !task.completed })}
                                                  className="mt-0.5 flex-shrink-0 focus:outline-none"
                                                  aria-label="Toggle action item"
                                                >
                                                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 ${task.completed ? 'border-navy-900 bg-navy-900 text-white scale-105 shadow-sm' : 'border-navy-300 bg-white hover:border-navy-500'}`}>
                                                    <Check className={`w-3 h-3 stroke-[3] transition-transform duration-200 ${task.completed ? 'scale-100' : 'scale-0'}`} />
                                                  </div>
                                                </button>
                                              )}
                                              
                                              {/* Decision Pill Action Item */}
                                              {task.type === 'choice' && (
                                                <div className="flex items-center gap-2 flex-shrink-0 mt-0.5 bg-white border border-navy-100 rounded-full px-2 py-0.5 select-none shadow-sm">
                                                  <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] font-bold">
                                                    <input
                                                      type="radio"
                                                      name={`choice-${task.id}`}
                                                      checked={task.value === 'yes'}
                                                      onChange={() => handleUpdateSubTaskState(m, task.id, { value: 'yes' })}
                                                      className="sr-only"
                                                    />
                                                    <span className={`px-2 py-0.5 rounded-full transition-all duration-200 ${task.value === 'yes' ? 'bg-green-100 text-green-700 font-extrabold shadow-sm' : 'text-navy-400 hover:bg-navy-50'}`}>Yes</span>
                                                  </label>
                                                  <div className="h-2 w-px bg-navy-200" />
                                                  <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] font-bold">
                                                    <input
                                                      type="radio"
                                                      name={`choice-${task.id}`}
                                                      checked={task.value === 'no'}
                                                      onChange={() => handleUpdateSubTaskState(m, task.id, { value: 'no' })}
                                                      className="sr-only"
                                                    />
                                                    <span className={`px-2 py-0.5 rounded-full transition-all duration-200 ${task.value === 'no' ? 'bg-red-100 text-red-700 font-extrabold shadow-sm' : 'text-navy-400 hover:bg-navy-50'}`}>No</span>
                                                  </label>
                                                </div>
                                              )}

                                              {/* Documentation note icon */}
                                              {task.type === 'note' && (
                                                <FileText className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                              )}

                                              <div className="min-w-0 flex-1">
                                                {editingSubTask?.taskId === task.id && editingSubTask?.milestone.id === m.id ? (
                                                  <div className="flex items-center gap-1.5 w-full">
                                                    <input
                                                      type="text"
                                                      value={editingSubTask.title}
                                                      onChange={e => setEditingSubTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                                                      className="w-full px-2 py-0.5 text-xs border border-navy-300 rounded focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white text-navy-850"
                                                      autoFocus
                                                      onKeyDown={e => {
                                                        if (e.key === 'Enter') handleUpdateSubTaskTitle();
                                                        else if (e.key === 'Escape') setEditingSubTask(null);
                                                      }}
                                                    />
                                                    <button
                                                      onClick={handleUpdateSubTaskTitle}
                                                      className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                                                      title="Save"
                                                    >
                                                      <Check className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                      onClick={() => setEditingSubTask(null)}
                                                      className="p-0.5 text-navy-400 hover:bg-navy-50 rounded flex items-center justify-center font-bold text-xs font-mono w-4 h-4"
                                                      title="Cancel"
                                                    >
                                                      ✕
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <div className="flex items-center justify-between gap-2 w-full">
                                                    <span className={`text-xs block leading-tight ${task.completed ? 'text-navy-400 line-through' : 'text-navy-800 font-medium'}`}>
                                                      {task.title} {task.optional && <span className="text-[9px] text-navy-400 font-normal uppercase tracking-wider select-none bg-navy-100/50 px-1 py-0.2 rounded ml-1">Optional</span>}
                                                    </span>
                                                    <button
                                                      onClick={() => setEditingSubTask({ milestone: m, taskId: task.id, title: task.title })}
                                                      className="text-navy-300 hover:text-navy-600 transition-colors p-0.5"
                                                      title="Edit Subtask Title"
                                                    >
                                                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            <button
                                              onClick={() => handleDeleteSubTask(m, task.id)}
                                              className="text-navy-300 hover:text-red-500 transition-colors p-0.5 flex-shrink-0"
                                              aria-label="Delete subtask"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          {/* Documentation notes textarea */}
                                          {task.type === 'note' && (
                                            <div className="w-full mt-1.5 space-y-2 pl-0 sm:pl-7">
                                              <textarea
                                                value={notesInput[`${m.id}-${task.id}`] ?? (task.value || '')}
                                                onChange={(e) => setNotesInput(prev => ({ ...prev, [`${m.id}-${task.id}`]: e.target.value }))}
                                                placeholder="Write details/findings/documentation findings..."
                                                rows={2}
                                                className="w-full px-3 py-2 text-xs border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-800 resize-y min-h-[64px]"
                                              />
                                              <div className="flex justify-end">
                                                <Button
                                                  size="sm"
                                                  onClick={() => {
                                                    const noteVal = notesInput[`${m.id}-${task.id}`] ?? (task.value || '');
                                                    handleUpdateSubTaskState(m, task.id, { value: noteVal });
                                                  }}
                                                  className="h-7 text-[10px] px-3 font-semibold"
                                                >
                                                  Save Note
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex flex-col items-center justify-center p-4 bg-navy-50/15 rounded-xl border border-dashed border-navy-200/50 text-center select-none">
                                        <Compass className="w-6 h-6 text-navy-300 mb-1" />
                                        <p className="text-[10px] text-navy-400 italic">No action items defined. Add sub-tasks below to document progress.</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Add Subtask Form */}
                                  {newSubTask.milestoneId === m.id ? (
                                    <div className="bg-navy-50/30 p-3.5 rounded-xl border border-navy-100/40 space-y-3">
                                      <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider select-none">Create Action Item / Task</p>
                                      <input
                                        type="text"
                                        value={newSubTask.title}
                                        onChange={(e) => setNewSubTask(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g. Complete review, Submit log approvals..."
                                        className="w-full px-3 py-2 text-xs border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-900"
                                        autoFocus
                                      />
                                      <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                          <select
                                            value={newSubTask.type}
                                            onChange={(e) => setNewSubTask(prev => ({ ...prev, type: e.target.value as any }))}
                                            className="px-2 py-1 text-xs border border-navy-200 rounded bg-white text-navy-700 focus:outline-none"
                                          >
                                            <option value="checkbox">Checkbox Task</option>
                                            <option value="choice">Yes/No Decision</option>
                                            <option value="note">Note Documentation</option>
                                          </select>
                                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                            <input
                                              type="checkbox"
                                              checked={newSubTask.optional}
                                              onChange={(e) => setNewSubTask(prev => ({ ...prev, optional: e.target.checked }))}
                                              className="w-3.5 h-3.5 text-navy-600 rounded border-navy-300 focus:ring-navy-400"
                                            />
                                            <span className="text-[11px] text-navy-500 font-medium">Optional</span>
                                          </label>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setNewSubTask({ milestoneId: null, title: '', type: 'checkbox', optional: false })}>Cancel</Button>
                                          <Button size="sm" className="h-7 text-[10px]" onClick={() => handleCreateSubTask(m)} disabled={!newSubTask.title.trim()}>Add Item</Button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setNewSubTask({ milestoneId: m.id, title: '', type: 'checkbox', optional: false })}
                                      className="flex items-center gap-1 text-[11px] font-bold text-navy-500 hover:text-navy-700 bg-navy-100/30 hover:bg-navy-100/60 transition-all duration-200 px-3 py-2 rounded-lg w-full justify-center border border-dashed border-navy-200/40"
                                    >
                                      <Plus className="w-3.5 h-3.5" /> Define Sub-task / Documentation Item
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-navy-50/10 rounded-xl border border-dashed border-navy-200/40 text-center select-none mb-4">
                    <Compass className="w-7 h-7 text-navy-300 mb-1" />
                    <p className="text-xs text-navy-400 italic">No milestones defined for this goal yet.</p>
                  </div>
                )}

                {!isCompletedGoal && (
                  <div className="mt-4 pt-3 border-t border-navy-100/30">
                    <Button size="sm" variant="ghost" onClick={() => setNewMilestone({ goalId: g.id, title: '' })}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Milestone
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Connection Goal">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-navy-500 uppercase tracking-wider">Mentorship Connection</label>
            <select className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-400 text-sm" value={newGoal.relationship_id} onChange={e => setNewGoal(f => ({ ...f, relationship_id: e.target.value }))}>
              <option value="">Personal Goal (Self-Directed)</option>
              {relationships.map(r => {
                const other = profile?.role === 'mentee' ? r.mentor : r.mentee;
                return <option key={r.id} value={r.id}>Connection: {other?.full_name}</option>;
              })}
            </select>
          </div>
          <Input label="Goal Title" value={newGoal.title} onChange={e => setNewGoal(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Master engine diagnostics" />
          <Textarea label="Description" rows={3} value={newGoal.description} onChange={e => setNewGoal(f => ({ ...f, description: e.target.value }))} placeholder="Outline what you want to achieve..." />
          <Input label="Target Date" type="date" value={newGoal.target_date} onChange={e => setNewGoal(f => ({ ...f, target_date: e.target.value }))} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={saving} disabled={!newGoal.title}>Create Goal</Button>
          </div>
        </div>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal open={!!newMilestone} onClose={() => setNewMilestone(null)} title="Add Milestone" size="sm">
        <div className="space-y-4">
          <Input label="Milestone Title" value={newMilestone?.title || ''} onChange={e => setNewMilestone(m => m ? { ...m, title: e.target.value } : null)} placeholder="e.g. Complete safety clearance" autoFocus />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNewMilestone(null)}>Cancel</Button>
            <Button onClick={handleAddMilestone} loading={saving} disabled={!newMilestone?.title}>Add Milestone</Button>
          </div>
        </div>
      </Modal>
      {/* Edit Goal Modal */}
      <Modal open={!!editingGoal} onClose={() => setEditingGoal(null)} title="Edit Goal">
        {editingGoal && (
          <div className="space-y-4">
            <Input
              label="Goal Title"
              value={editingGoal.title}
              onChange={e => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder="e.g. Master engine diagnostics"
            />
            <Textarea
              label="Description"
              rows={3}
              value={editingGoal.description}
              onChange={e => setEditingGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
              placeholder="Outline what you want to achieve..."
            />
            <Input
              label="Target Date"
              type="date"
              value={editingGoal.target_date || ''}
              onChange={e => setEditingGoal(prev => prev ? { ...prev, target_date: e.target.value } : null)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditingGoal(null)}>Cancel</Button>
              <Button onClick={handleUpdateGoalDetails} loading={saving} disabled={!editingGoal.title}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Milestone Modal */}
      <Modal open={!!editingMilestone} onClose={() => setEditingMilestone(null)} title="Edit Milestone" size="sm">
        {editingMilestone && (
          <div className="space-y-4">
            <Input
              label="Milestone Title"
              value={editingMilestone.title}
              onChange={e => setEditingMilestone(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder="e.g. Complete safety clearance"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditingMilestone(null)}>Cancel</Button>
              <Button onClick={handleUpdateMilestoneTitle} loading={saving} disabled={!editingMilestone.title}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
