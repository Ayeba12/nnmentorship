import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: enrollments, error } = await supabase
      .from('enrollments')
      .select('*, course:courses(*)')
      .eq('user_id', profile.id);
    if (error) {
      console.warn('Enrollments GET error or table missing:', error);
      return NextResponse.json([]); // Return empty list on failure or missing table
    }

    return NextResponse.json(enrollments || []);
  } catch (err: any) {
    console.error('Enrollments GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { course_id } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'Missing course_id' }, { status: 400 });
    }

    // Check if enrollment already exists
    const { data: existing } = await supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', course_id)
      .eq('user_id', profile.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(existing);
    }

    // Insert enrollment
    const { data: enrollment, error } = await supabase
      .from('enrollments')
      .insert({
        course_id,
        user_id: profile.id,
        status: 'in_progress',
        progress: 0,
      })
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, 'enroll_course', 'enrollment', String(enrollment.id), `Course ID: ${course_id}`);
    return NextResponse.json(enrollment, { status: 201 });
  } catch (err: any) {
    console.error('Enrollments POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { enrollment_id, lesson_id, quiz_id, quiz_score, quiz_passed } = body;

    if (!enrollment_id) {
      return NextResponse.json({ error: 'Missing enrollment_id' }, { status: 400 });
    }

    // Fetch enrollment and associated course lessons
    const { data: enrollment, error: fetchError } = await supabase
      .from('enrollments')
      .select('*, course:courses(*)')
      .eq('id', enrollment_id)
      .single();
    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.user_id !== profile.id && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const courseId = enrollment.course_id;

    // Handle Lesson Completion
    if (lesson_id) {
      // 1. Record progress for this lesson
      const { error: progError } = await supabase
        .from('lesson_progress')
        .insert({
          enrollment_id,
          lesson_id,
          completed: true,
        })
        .select()
        .single();

      // If already recorded, ignore uniqueness conflict
      if (progError && !progError.message.includes('unique')) {
        console.error('Lesson progress insert error:', progError);
      }

      // 2. Calculate new progress percentage
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId);
      
      const { data: completedLessons } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment_id);

      const totalLessons = allLessons?.length || 1;
      const completedCount = completedLessons?.length || 0;
      
      // Calculate percentage progress
      const newProgress = Math.min(100, Math.round((completedCount / totalLessons) * 100));
      const statusUpdate = newProgress === 100 ? 'completed' : 'in_progress';

      const updateData: any = {
        progress: newProgress,
        status: statusUpdate,
      };

      if (statusUpdate === 'completed' && enrollment.status !== 'completed') {
        updateData.completed_at = new Date().toISOString();

        // 3. Issue Certificate
        const certNumber = `NNMP-${courseId}-${profile.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await supabase
          .from('certificates')
          .insert({
            enrollment_id,
            user_id: profile.id,
            course_id: courseId,
            certificate_number: certNumber,
          });
      }

      const { data: updatedEnrollment, error: updateError } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', enrollment_id)
        .select()
        .single();
      if (updateError) throw updateError;

      await logAudit(profile.id, 'complete_lesson', 'lesson', String(lesson_id), `Course progress: ${newProgress}%`);
      return NextResponse.json(updatedEnrollment);
    }

    // Handle Quiz Submission
    if (quiz_id) {
      // Just log audit or update enrollment record if quiz details are required to track
      await logAudit(profile.id, 'submit_quiz', 'quiz', String(quiz_id), `Score: ${quiz_score}%, Passed: ${quiz_passed}`);
      
      // Return current enrollment state
      return NextResponse.json(enrollment);
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (err: any) {
    console.error('Enrollments PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
