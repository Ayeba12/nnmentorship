import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

function parseMilestoneData(m: any) {
  if (!m) return m;
  let cleanTitle = m.title;
  let subtasks = m.subtasks || [];
  if (m.title && m.title.includes(' ||| ')) {
    const parts = m.title.split(' ||| ');
    cleanTitle = parts[0];
    try {
      subtasks = JSON.parse(parts[1]);
    } catch (e) {
      subtasks = [];
    }
  }
  return {
    ...m,
    title: cleanTitle,
    subtasks
  };
}

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
      const goalMilestones = milestones
        .filter(m => m.goal_id === goal.id)
        .map(m => parseMilestoneData(m));
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

      const { data: goalData, error: goalFetchErr } = await supabase
        .from('goals')
        .select('relationship_id')
        .eq('id', targetGoalId)
        .single();
      if (goalFetchErr || !goalData) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }

      if (goalData.relationship_id) {
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
      return NextResponse.json(parseMilestoneData(milestone), { status: 201 });
    }

    // Handle Create Goal
    if (!title) {
      return NextResponse.json({ error: 'Missing title parameters for goal' }, { status: 400 });
    }

    let insertData: any = {
      title,
      description: description || '',
      status: 'active',
      target_date: target_date || null,
      mentee_id: mentee_id || profile.id,
      relationship_id: null,
      mentor_id: null,
    };

    if (relationship_id) {
      const { data: rel, error: relError } = await supabase
        .from('mentorship_relationships')
        .select('status, mentee_id, mentor_id')
        .eq('id', relationship_id)
        .single();
      if (relError || !rel) {
        return NextResponse.json({ error: 'Relationship not found' }, { status: 404 });
      }
      if (rel.status === 'ended') {
        return NextResponse.json({ error: 'Cannot create goals on an ended relationship' }, { status: 400 });
      }
      insertData.relationship_id = relationship_id;
      insertData.mentee_id = profile.role === 'mentee' ? profile.id : rel.mentee_id;
      insertData.mentor_id = profile.role === 'mentee' ? rel.mentor_id : profile.id;
    }

    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .insert(insertData)
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
    const { action, id, status, completed, subtasks, title, description, target_date } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // Handle Update Goal Details
    if (action === 'update_goal_details') {
      const { data: goalData, error: goalFetchErr } = await supabase
        .from('goals')
        .select('relationship_id')
        .eq('id', id)
        .single();
      if (goalFetchErr || !goalData) {
        return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
      }

      if (goalData.relationship_id) {
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
      }

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .update({
          title,
          description: description || '',
          target_date: target_date || null
        })
        .eq('id', id)
        .select()
        .single();
      if (goalError) throw goalError;

      await logAudit(profile.id, 'update_goal_details', 'goal', String(id), `Updated details: ${title}`);
      return NextResponse.json(goal);
    }

    // Handle Update Milestone Title
    if (action === 'update_milestone_title') {
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

      if (goalData.relationship_id) {
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
      }

      let newTitle = title;
      if (mData.title && mData.title.includes(' ||| ')) {
        const parts = mData.title.split(' ||| ');
        newTitle = `${title} ||| ${parts[1]}`;
      }

      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .update({ title: newTitle })
        .eq('id', id)
        .select()
        .single();
      if (milestoneError) throw milestoneError;

      await logAudit(profile.id, 'update_milestone_title', 'milestone', String(id), `Updated milestone title to: ${title}`);
      return NextResponse.json(parseMilestoneData(milestone));
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

      if (goalData.relationship_id) {
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
      return NextResponse.json(parseMilestoneData(milestone));
    }

    // Handle Update Milestone Subtasks
    if (action === 'update_milestone_subtasks') {
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

      if (goalData.relationship_id) {
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
      }

      let milestone: any = null;
      let milestoneError: any = null;

      try {
        const res = await supabase
          .from('milestones')
          .update({ subtasks })
          .eq('id', id)
          .select()
          .single();
        if (res.error) {
          throw res.error;
        }
        milestone = res.data;
      } catch (err: any) {
        // Fallback: serialize inside title
        const cleanTitle = mData.title.split(' ||| ')[0];
        const serializedTitle = `${cleanTitle} ||| ${JSON.stringify(subtasks)}`;
        
        const res = await supabase
          .from('milestones')
          .update({ title: serializedTitle })
          .eq('id', id)
          .select()
          .single();
        if (res.error) throw res.error;
        milestone = res.data;
      }

      await logAudit(profile.id, 'update_milestone_subtasks', 'milestone', String(id), `Updated milestone subtasks`);
      return NextResponse.json(parseMilestoneData(milestone));
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

    if (goalData.relationship_id) {
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

export async function DELETE(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    if (action === 'delete_milestone') {
      const { data: milestone, error: milestoneError } = await supabase
        .from('milestones')
        .delete()
        .eq('id', id);
      if (milestoneError) throw milestoneError;

      await logAudit(profile.id, 'delete_milestone', 'milestone', String(id), `Deleted milestone`);
      return NextResponse.json({ success: true });
    }

    // Default: Delete Goal
    const { data: goal, error: goalError } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);
    if (goalError) throw goalError;

    // Delete associated milestones
    await supabase
      .from('milestones')
      .delete()
      .eq('goal_id', id);

    await logAudit(profile.id, 'delete_goal', 'goal', String(id), `Deleted goal`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Goals DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
