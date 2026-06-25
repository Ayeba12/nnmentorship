import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: goals, error: goalsError } = await supabase
      .from('goals')
      .select('*')
      .or(`mentee_id.eq.${profile.id},mentor_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });
    if (goalsError) throw goalsError;

    const goalIds = (goals || []).map(g => g.id);
    let milestones: any[] = [];
    if (goalIds.length > 0) {
      const { data: ms, error: msError } = await supabase
        .from('milestones')
        .select('*')
        .in('goal_id', goalIds)
        .order('created_at', { ascending: true });
      if (msError) throw msError;
      milestones = ms || [];
    }

    const goalsWithMilestones = (goals || []).map((goal: any) => {
      const goalMilestones = milestones.filter(m => m.goal_id === goal.id);
      return { ...goal, milestones: goalMilestones };
    });

    return NextResponse.json(goalsWithMilestones);
  } catch (err: any) {
    console.error('Goals GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, goalId, goal_id, title, description, target_date, mentee_id, mentor_id, relationship_id } = body;

    // Handle Add Milestone
    if (action === 'add_milestone') {
      const targetGoalId = goalId || goal_id;
      if (!targetGoalId || !title) {
        return NextResponse.json({ error: 'Missing parameters for milestone' }, { status: 400 });
      }

      // Check if relationship is ended
      const { data: goalData, error: goalFetchErr } = await supabase
        .from('goals')
        .select('relationship_id')
        .eq('id', targetGoalId)
        .single();
      if (goalFetchErr || !goalData) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }
      
      const { data: relData, error: relFetchErr } = await supabase
        .from('mentorship_relationships')
        .select('status')
        .eq('id', goalData.relationship_id)
        .single();
      if (relFetchErr || !relData) {
        return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
      }
      
      if (relData.status === 'ended') {
        return NextResponse.json({ error: 'Cannot add milestones on an ended relationship' }, { status: 400 });
      }

      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .insert({
          goal_id: targetGoalId,
          title,
          completed: false,
        })
        .select()
        .single();
      if (milestoneError) throw milestoneError;

      await logAudit(profile.id, 'add_milestone', 'milestone', String(milestone.id), `Added milestone to goal ${targetGoalId}`);
      return NextResponse.json(milestone, { status: 201 });
    }

    // Handle Create Goal
    if (!relationship_id || !title) {
      return NextResponse.json({ error: 'Missing parameters for goal' }, { status: 400 });
    }

    const { data: rel, error: relError } = await supabase
      .from('mentorship_relationships')
      .select('status')
      .eq('id', relationship_id)
      .single();
    if (relError || !rel) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }
    if (rel.status === 'ended') {
      return NextResponse.json({ error: 'Cannot create goals on an ended relationship' }, { status: 400 });
    }

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert({
        relationship_id,
        mentee_id: mentee_id || profile.id,
        mentor_id: mentor_id,
        title,
        description: description || '',
        status: 'active',
        target_date: target_date || null,
      })
      .select()
      .single();
    if (goalError) throw goalError;

    await logAudit(profile.id, 'create_goal', 'goal', String(goal.id), `Goal: ${title}`);

    return NextResponse.json(goal, { status: 201 });
  } catch (err: any) {
    console.error('Goals POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, id, status, completed } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Handle Toggle Milestone
    if (action === 'toggle_milestone') {
      // Check if relationship is ended
      const { data: mData, error: mFetchErr } = await supabase
        .from('milestones')
        .select('*')
        .eq('id', id)
        .single();
      if (mFetchErr || !mData) {
        return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
      }

      const { data: goalData, error: goalFetchErr } = await supabase
        .from('goals')
        .select('relationship_id')
        .eq('id', mData.goal_id)
        .single();
      if (goalFetchErr || !goalData) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }

      const { data: relData, error: relFetchErr } = await supabase
        .from('mentorship_relationships')
        .select('status')
        .eq('id', goalData.relationship_id)
        .single();
      if (relFetchErr || !relData) {
        return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
      }

      if (relData.status === 'ended') {
        return NextResponse.json({ error: 'Cannot update milestones on an ended relationship' }, { status: 400 });
      }

      const updateData: any = { completed };
      if (completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (milestoneError) throw milestoneError;

      await logAudit(profile.id, 'toggle_milestone', 'milestone', String(id), `Milestone status: ${completed}`);
      return NextResponse.json(milestone);
    }

    // Handle Update Goal Status
    // Check if relationship is ended
    const { data: goalData, error: goalFetchErr } = await supabase
      .from('goals')
      .select('relationship_id')
      .eq('id', id)
      .single();
    if (goalFetchErr || !goalData) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
    }

    const { data: relData, error: relFetchErr } = await supabase
      .from('mentorship_relationships')
      .select('status')
      .eq('id', goalData.relationship_id)
      .single();
    if (relFetchErr || !relData) {
      return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
    }

    if (relData.status === 'ended') {
      return NextResponse.json({ error: 'Cannot update goals on an ended relationship' }, { status: 400 });
    }

    const updateData: any = { status };
    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (goalError) throw goalError;

    await logAudit(profile.id, 'update_goal', 'goal', String(id), `Goal status: ${status}`);

    return NextResponse.json(goal);
  } catch (err: any) {
    console.error('Goals PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
