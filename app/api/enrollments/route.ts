import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const progress = searchParams.get('progress');
    const enrollmentId = searchParams.get('enrollment_id');
    const certificate = searchParams.get('certificate');
    const courseId = searchParams.get('course_id');
    const submissions = searchParams.get('submissions');

    if (submissions === 'true') {
      const { data: subs, error } = await supabase
        .from('assignment_submissions')
        .select('*');
      if (error) {
        console.warn('Assignment submissions GET error:', error);
        return NextResponse.json([]);
      }

      const userIds = Array.from(new Set((subs || []).map(s => s.user_id)));
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('id, full_name, rank')
          .in('id', userIds);
        profiles = profs || [];
      }
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      const submissionsWithUser = (subs || []).map(s => ({
        ...s,
        user: profileMap.get(s.user_id) || null
      }));
      return NextResponse.json(submissionsWithUser);
    }

    if (progress === 'true' && enrollmentId) {
      const { data: rows, error } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', Number(enrollmentId));
      if (error) {
        console.warn('Lesson progress fetch error:', error);
        return NextResponse.json([]);
      }
      return NextResponse.json(rows || []);
    }

    if (certificate === 'true' && courseId) {
      const { data: cert, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('course_id', Number(courseId))
        .eq('user_id', profile.id)
        .maybeSingle();
      if (error) {
        console.warn('Certificate fetch error:', error);
        return NextResponse.json(null);
      }
      return NextResponse.json(cert || null);
    }

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
      await supabase
        .from('quiz_attempts')
        .insert({
          enrollment_id,
          user_id: profile.id,
          quiz_id,
          score: quiz_score,
          passed: quiz_passed
        });

      await logAudit(profile.id, 'submit_quiz', 'quiz', String(quiz_id), `Score: ${quiz_score}%, Passed: ${quiz_passed}`);
      return NextResponse.json(enrollment);
    }

    // Handle Assignment Submissions and Grading
    const { assignment_submit, grade_submit, text_content, file_url, submission_id, score } = body;

    if (assignment_submit) {
      const { data: sub, error: subError } = await supabase
        .from('assignment_submissions')
        .insert({
          enrollment_id,
          user_id: profile.id,
          lesson_id,
          text_content: text_content || '',
          file_url: file_url || '',
          status: 'pending'
        })
        .select()
        .single();
      if (subError) throw subError;

      await logAudit(profile.id, 'submit_assignment', 'assignment', String(sub.id), `Lesson ID: ${lesson_id}`);
      return NextResponse.json(sub);
    }

    if (grade_submit) {
      if (profile.role !== 'admin' && !profile.can_manage_courses) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { data: sub, error: gradeError } = await supabase
        .from('assignment_submissions')
        .update({
          status: 'graded',
          score: score,
          graded_at: new Date().toISOString(),
          graded_by: profile.id
        })
        .eq('id', submission_id)
        .select()
        .single();
      if (gradeError) throw gradeError;

      await logAudit(profile.id, 'grade_assignment', 'assignment_submission', String(submission_id), `Score: ${score}`);
      return NextResponse.json(sub);
    }

    return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
  } catch (err: any) {
    console.error('Enrollments PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
