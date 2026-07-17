import { NextRequest, NextResponse } from 'next/server';
import { supabaseService as supabase } from '@/lib/supabase';
import { requireProfile, logAudit } from '@/lib/api-helpers';

// Beautiful mock data for local fallback and instant visual demo
const MOCK_COURSES = [
  {
    id: 101,
    title: 'Naval Leadership & Professional Ethics',
    description: 'A comprehensive study of military leadership principles, moral ethics, and administrative responsibilities in the Nigerian Navy.',
    category: 'Leadership',
    difficulty: 'beginner',
    thumbnail_url: null,
    author_id: 1,
    status: 'published',
    created_at: new Date().toISOString(),
    author: { id: 1, full_name: 'Rear Admiral A. O. Bello', rank: 'Rear Admiral' },
    lessons: [
      {
        id: 201,
        course_id: 101,
        title: 'Core Values of the Nigerian Navy',
        content: 'The Nigerian Navy core values are Honor, Commitment, and Patriotism. These pillars guide every decision and action, both in maritime operations and administrative duties. Understanding these core tenets is crucial for all junior officers and ratings. Officers must embody integrity, lead by example, and maintain high standards of discipline at all times.',
        video_url: null,
        duration_minutes: 15,
        order_index: 1,
        quizzes: [
          {
            id: 301,
            lesson_id: 201,
            title: 'Navy Core Values Quiz',
            passing_score: 70,
            questions: [
              {
                id: 401,
                quiz_id: 301,
                question: 'Which of the following is NOT one of the core values of the Nigerian Navy?',
                options: ['Honor', 'Commitment', 'Individualism', 'Patriotism'],
                correct_index: 2
              },
              {
                id: 402,
                quiz_id: 301,
                question: 'What is the primary foundation of military leadership?',
                options: ['Fear', 'Integrity and Example', 'Command Rank Only', 'Administrative Skill'],
                correct_index: 1
              }
            ]
          }
        ]
      },
      {
        id: 202,
        course_id: 101,
        title: 'The Chain of Command and Reporting',
        content: 'Military order relies entirely on the chain of command. In this lesson, we examine the structural hierarchy of the Nigerian Navy, how messages are transmitted up and down the chain, and the protocol for submitting reports. We will also cover professional courtesy and the significance of respect for seniority.',
        video_url: null,
        duration_minutes: 20,
        order_index: 2
      }
    ]
  },
  {
    id: 102,
    title: 'Maritime Security and Patrol Operations',
    description: 'An overview of tactics, regulations, and operational guidelines for combating piracy, oil theft, and illegal fishing in Nigerian territorial waters.',
    category: 'Operations',
    difficulty: 'intermediate',
    thumbnail_url: null,
    author_id: 2,
    status: 'published',
    created_at: new Date().toISOString(),
    author: { id: 2, full_name: 'Commodore S. I. Alabi', rank: 'Commodore' },
    lessons: [
      {
        id: 203,
        course_id: 102,
        title: 'Anti-Piracy Procedures',
        content: 'Combating piracy requires coordinated surveillance, rapid boarding tactics, and adherence to international maritime law. This lesson details standard patrol routes, communication encryption, and response rules of engagement when intercepting suspicious vessels.',
        video_url: null,
        duration_minutes: 25,
        order_index: 1
      }
    ]
  },
  {
    id: 103,
    title: 'Special Naval Warfare & SBS Tactics',
    description: 'Operational protocols and tactical insertion strategies for the Special Boat Service (SBS), including maritime counter-terrorism.',
    category: 'Combat Systems',
    difficulty: 'advanced',
    thumbnail_url: null,
    author_id: 2,
    status: 'published',
    created_at: new Date().toISOString(),
    author: { id: 2, full_name: 'Commodore Adebayo Balogun', rank: 'Commodore' },
    lessons: [
      {
        id: 204,
        course_id: 103,
        title: 'Special Boat Service Operations',
        content: 'Special Boat Service (SBS) operations require meticulous navigation, watermanship, and close combat skills. This module covers silent beach landings and target reconnaissance.',
        video_url: null,
        duration_minutes: 30,
        order_index: 1
      }
    ]
  },
  {
    id: 104,
    title: 'Naval Communications & Signal Encryption',
    description: 'Advanced radio wave propagation, military satellite communication, and secure signal encryption key distribution protocols.',
    category: 'Combat Systems',
    difficulty: 'advanced',
    thumbnail_url: null,
    author_id: 2,
    status: 'published',
    created_at: new Date().toISOString(),
    author: { id: 2, full_name: 'Commodore Adebayo Balogun', rank: 'Commodore' },
    lessons: [
      {
        id: 205,
        course_id: 104,
        title: 'Military Radio Operations',
        content: 'HF, VHF, and UHF spectrums form the backbone of naval radio communication. Secure operations require strict signal hygiene and regular frequency shifts.',
        video_url: null,
        duration_minutes: 20,
        order_index: 1
      }
    ]
  },
  {
    id: 105,
    title: 'Oceanography & Marine Meteorology',
    description: 'Study of ocean currents, wave heights, and weather forecasting methodologies for planning safe sea maneuvers and naval landing operations.',
    category: 'Navigation',
    difficulty: 'intermediate',
    thumbnail_url: null,
    author_id: 1,
    status: 'published',
    created_at: new Date().toISOString(),
    author: { id: 1, full_name: 'Captain Kelechi Amadi', rank: 'Captain' },
    lessons: [
      {
        id: 206,
        course_id: 105,
        title: 'Ocean Currents & Bathymetry',
        content: 'Ocean currents and bathymetry data affect ship drift, propulsion efficiency, and sonar performance. Modern surveyors must master multi-beam echo sounding.',
        video_url: null,
        duration_minutes: 25,
        order_index: 1
      }
    ]
  },
  {
    id: 106,
    title: 'Marine Gas Turbine Engines & Maintenance',
    description: 'Technical instruction on operational cycles, compressor wash procedures, and fuel nozzle calibrations for shipboard LM2500 gas turbines.',
    category: 'Engineering',
    difficulty: 'advanced',
    thumbnail_url: null,
    author_id: 1,
    status: 'published',
    created_at: new Date().toISOString(),
    author: { id: 1, full_name: 'Captain Kelechi Amadi', rank: 'Captain' },
    lessons: [
      {
        id: 207,
        course_id: 106,
        title: 'LM2500 Turbine Systems Overview',
        content: 'LM2500 gas turbines deliver high-density propulsion. Proper upkeep requires daily pressure checks, stator vane inspection, and nozzle cleaning.',
        video_url: null,
        duration_minutes: 35,
        order_index: 1
      }
    ]
  }
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const enrolled = searchParams.get('enrolled');
    const category = searchParams.get('category');
    const id = searchParams.get('id');

    let profile = null;
    try {
      profile = await requireProfile(req);
    } catch (e) {
      // Ignore auth error for public requests
    }

    if (enrolled === 'true' && !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch single course details (with lessons/quizzes)
    if (id) {
      const courseId = Number(id);
      const { data: dbCourse, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error || !dbCourse) {
        // Fallback to mock course
        const mockC = MOCK_COURSES.find(c => c.id === courseId);
        if (mockC) return NextResponse.json(mockC);
        return NextResponse.json({ error: 'Course not found' }, { status: 404 });
      }

      // Fetch author profile
      let author = null;
      if (dbCourse.author_id) {
        const { data: authData } = await supabase
          .from('profiles')
          .select('id, full_name, rank')
          .eq('id', dbCourse.author_id)
          .single();
        author = authData;
      }

      // Fetch lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      const lessonsList = lessons || [];
      const lessonIds = lessonsList.map(l => l.id);

      // Fetch quizzes for those lessons
      let quizzes: any[] = [];
      if (lessonIds.length > 0) {
        const { data: qz } = await supabase
          .from('quizzes')
          .select('*')
          .in('lesson_id', lessonIds);
        quizzes = qz || [];
      }
      const quizIds = quizzes.map(q => q.id);

      // Fetch quiz questions
      let questions: any[] = [];
      if (quizIds.length > 0) {
        const { data: qq } = await supabase
          .from('quiz_questions')
          .select('*')
          .in('quiz_id', quizIds);
        questions = qq || [];
      }

      // Map questions to quizzes
      const quizzesWithQuestions = quizzes.map(q => {
        return {
          ...q,
          quiz_questions: questions.filter(qn => qn.quiz_id === q.id)
        };
      });

      // Map quizzes to lessons
      const lessonsWithQuizzes = lessonsList.map(l => {
        return {
          ...l,
          quizzes: quizzesWithQuestions.filter(q => q.lesson_id === l.id)
        };
      });

      const fullCourse = {
        ...dbCourse,
        author,
        lessons: lessonsWithQuizzes
      };

      return NextResponse.json(fullCourse);
    }

    // 2. Fetch enrolled courses
    if (enrolled === 'true') {
      if (!profile) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { data: enrollments, error: enrError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', profile.id);

      if (enrError || !enrollments || enrollments.length === 0) {
        return NextResponse.json({ courses: [], enrollments: {} });
      }

      const courseIds = enrollments.map(e => e.course_id).filter(Boolean);
      let dbCoursesList: any[] = [];
      if (courseIds.length > 0) {
        const { data: cList } = await supabase
          .from('courses')
          .select('*')
          .in('id', courseIds);
        dbCoursesList = cList || [];
      }
      const courseMap = new Map(dbCoursesList.map(c => [c.id, c]));

      const enrollmentsWithCourses = enrollments.map(e => {
        return {
          ...e,
          course: courseMap.get(e.course_id) || null
        };
      });

      const courses = enrollmentsWithCourses.map(e => e.course).filter(Boolean);
      const enrollMap = enrollmentsWithCourses.reduce((acc: any, curr) => {
        acc[curr.course_id] = curr;
        return acc;
      }, {});

      return NextResponse.json({ courses, enrollments: enrollMap });
    }

    // 3. Fetch list of published courses
    let query = supabase
      .from('courses')
      .select('*')
      .eq('status', 'published');

    if (category) {
      query = query.eq('category', category);
    }

    const { data: dbCourses, error: listError } = await query;
    if (listError || !dbCourses || dbCourses.length === 0) {
      // Fallback to mock courses
      let filteredMock = [...MOCK_COURSES];
      if (category) {
        filteredMock = MOCK_COURSES.filter(c => c.category === category);
      }
      filteredMock.sort((a: any, b: any) => {
        const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });
      return NextResponse.json(filteredMock);
    }

    // Fetch authors in JS
    const authorIds = Array.from(new Set(
      dbCourses.map(c => c.author_id).filter(Boolean)
    ));

    let profiles: any[] = [];
    if (authorIds.length > 0) {
      const { data: profs } = await supabase
        .from('profiles')
        .select('id, full_name, rank')
        .in('id', authorIds);
      profiles = profs || [];
    }
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Fetch lessons in JS to get the count
    const courseIds = dbCourses.map(c => c.id);
    let lessons: any[] = [];
    if (courseIds.length > 0) {
      const { data: lesData } = await supabase
        .from('lessons')
        .select('id, course_id')
        .in('course_id', courseIds);
      lessons = lesData || [];
    }

    const coursesWithAuthors = dbCourses.map(c => {
      const author = profileMap.get(c.author_id) || null;
      const courseLessons = lessons.filter(l => l.course_id === c.id);
      return { ...c, author, lessons: courseLessons };
    });

    // Sort by updated_at || created_at descending
    coursesWithAuthors.sort((a: any, b: any) => {
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
      return timeB - timeA;
    });

    return NextResponse.json(coursesWithAuthors);
  } catch (err: any) {
    console.error('Courses GET error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!profile.is_content_contributor && profile.role !== 'admin' && !profile.can_manage_courses) {
      return NextResponse.json({ error: 'Only approved content contributors can create courses' }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, category, difficulty, thumbnail_url, lessons } = body;

    if (!title || !description || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Create course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        title,
        description,
        category,
        difficulty,
        thumbnail_url: thumbnail_url || null,
        author_id: profile.id,
        status: profile.role === 'admin' ? 'published' : 'pending',
      })
      .select()
      .single();
    if (courseError) throw courseError;

    // Create lessons if provided
    if (lessons && Array.isArray(lessons)) {
      for (let i = 0; i < lessons.length; i++) {
        const les = lessons[i];
        const { data: dbLesson, error: lesError } = await supabase
          .from('lessons')
          .insert({
            course_id: course.id,
            title: les.title,
            content: les.content,
            video_url: les.video_url || null,
            duration_minutes: les.duration_minutes || 10,
            order_index: i + 1,
          })
          .select()
          .single();
        if (lesError) throw lesError;

        // Create quizzes if provided
        if (les.quizzes && Array.isArray(les.quizzes)) {
          for (const q of les.quizzes) {
            const { data: dbQuiz, error: qError } = await supabase
              .from('quizzes')
              .insert({
                lesson_id: dbLesson.id,
                title: q.title,
                passing_score: q.passing_score || 70,
              })
              .select()
              .single();
            if (qError) throw qError;

            // Create questions if provided
            if (q.questions && Array.isArray(q.questions)) {
              for (const ques of q.questions) {
                await supabase
                  .from('quiz_questions')
                  .insert({
                    quiz_id: dbQuiz.id,
                    question: ques.question,
                    options: ques.options,
                    correct_index: ques.correct_index,
                  });
              }
            }
          }
        }
      }
    }

    await logAudit(profile.id, 'create_course', 'course', String(course.id), `Title: ${title}`);
    return NextResponse.json(course, { status: 201 });
  } catch (err: any) {
    console.error('Courses POST error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
    }

    if (action === 'approve' || action === 'reject') {
      if (profile.role !== 'admin') return NextResponse.json({ error: 'Only admins can approve/reject courses' }, { status: 403 });

      let statusUpdate = 'pending';
      if (action === 'approve') statusUpdate = 'published';
      else if (action === 'reject') statusUpdate = 'rejected';

      const { data: course, error } = await supabase
        .from('courses')
        .update({ status: statusUpdate })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await logAudit(profile.id, `${action}_course`, 'course', String(id), `Course status set to: ${statusUpdate}`);
      return NextResponse.json(course);
    }

    // General course editing
    if (!profile.is_content_contributor && profile.role !== 'admin' && !profile.can_manage_courses) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { title, description, category, difficulty, thumbnail_url, lessons, status } = body;

    // Update course metadata
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (difficulty !== undefined) updates.difficulty = difficulty;
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (status !== undefined) updates.status = status;

    const updatesWithTime = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    let course: any = null;
    let courseError: any = null;

    try {
      const { data, error } = await supabase
        .from('courses')
        .update(updatesWithTime)
        .eq('id', id)
        .select()
        .single();
      course = data;
      courseError = error;

      // Check if error is due to missing updated_at column
      if (error && (error.message?.includes('column "updated_at"') || String(error.code) === '42703')) {
        console.warn('updated_at column not found on courses table, retrying update without it.');
        const retry = await supabase
          .from('courses')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        course = retry.data;
        courseError = retry.error;
      }
    } catch (err: any) {
      console.warn('Exception during update with updated_at, retrying without it:', err);
      const retry = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      course = retry.data;
      courseError = retry.error;
    }

    if (courseError) throw courseError;

    // If lessons array is provided, replace lessons structure
    if (lessons && Array.isArray(lessons)) {
      // 1. Fetch current lessons to get their IDs for quiz cleanup
      const { data: oldLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', id);

      const oldLessonIds = (oldLessons || []).map(l => l.id);

      if (oldLessonIds.length > 0) {
        // Fetch quizzes for those lessons
        const { data: oldQuizzes } = await supabase
          .from('quizzes')
          .select('id')
          .in('lesson_id', oldLessonIds);
        const oldQuizIds = (oldQuizzes || []).map(q => q.id);

        if (oldQuizIds.length > 0) {
          // Delete old quiz questions
          await supabase.from('quiz_questions').delete().in('quiz_id', oldQuizIds);
          // Delete old quizzes
          await supabase.from('quizzes').delete().in('id', oldQuizIds);
        }

        // Delete old lessons
        await supabase.from('lessons').delete().eq('course_id', id);
      }

      // 2. Re-insert new lessons
      for (let i = 0; i < lessons.length; i++) {
        const les = lessons[i];
        const { data: dbLesson, error: lesError } = await supabase
          .from('lessons')
          .insert({
            course_id: id,
            title: les.title,
            content: les.content,
            video_url: les.video_url || null,
            duration_minutes: les.duration_minutes || 10,
            order_index: i + 1,
            section_title: les.section_title || 'General',
            lesson_type: les.lesson_type || 'text',
            resources: les.resources || null
          })
          .select()
          .single();
        if (lesError) throw lesError;

        // Create quizzes if provided
        if (les.quizzes && Array.isArray(les.quizzes)) {
          for (const q of les.quizzes) {
            const { data: dbQuiz, error: qError } = await supabase
              .from('quizzes')
              .insert({
                lesson_id: dbLesson.id,
                title: q.title,
                passing_score: q.passing_score || 70,
                time_limit_minutes: q.time_limit_minutes || null,
                max_retakes: q.max_retakes || null,
              })
              .select()
              .single();
            if (qError) throw qError;

            // Create questions if provided
            if (q.questions && Array.isArray(q.questions)) {
              for (const ques of q.questions) {
                await supabase
                  .from('quiz_questions')
                  .insert({
                    quiz_id: dbQuiz.id,
                    question: ques.question,
                    type: ques.type || 'multiple_choice',
                    options: ques.options || null,
                    correct_index: ques.correct_index !== undefined ? ques.correct_index : null,
                    correct_short_answer: ques.correct_short_answer || null,
                  });
              }
            }
          }
        }
      }
    }

    await logAudit(profile.id, 'edit_course', 'course', String(id), `Updated course details`);
    return NextResponse.json(course);
  } catch (err: any) {
    console.error('Courses PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (profile.role !== 'admin' && !profile.can_manage_courses) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });

    const courseId = Number(id);

    // Delete lessons first
    await supabase.from('lessons').delete().eq('course_id', courseId);

    // Delete course
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    if (error) throw error;

    await logAudit(profile.id, 'delete_course', 'course', String(courseId), `Deleted course ID: ${courseId}`);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Courses DELETE error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
