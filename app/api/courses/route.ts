import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
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
  }
];

export async function GET(req: NextRequest) {
  try {
    const profile = await requireProfile(req);
    if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = req.nextUrl;
    const enrolled = searchParams.get('enrolled');
    const category = searchParams.get('category');
    const id = searchParams.get('id');

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
      let filteredMock = MOCK_COURSES;
      if (category) {
        filteredMock = MOCK_COURSES.filter(c => c.category === category);
      }
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

    const coursesWithAuthors = dbCourses.map(c => {
      const author = profileMap.get(c.author_id) || null;
      return { ...c, author };
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

    if (!profile.is_content_contributor && profile.role !== 'admin') {
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
    if (profile.role !== 'admin') return NextResponse.json({ error: 'Only admins can approve/reject courses' }, { status: 403 });

    const { searchParams } = req.nextUrl;
    const action = searchParams.get('action');

    const body = await req.json();
    const { id } = body;

    let statusUpdate = 'pending';
    if (action === 'approve') statusUpdate = 'published';
    else if (action === 'reject') statusUpdate = 'rejected';
    else return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    const { data: course, error } = await supabase
      .from('courses')
      .update({ status: statusUpdate })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(profile.id, `${action}_course`, 'course', String(id), `Course status set to: ${statusUpdate}`);
    return NextResponse.json(course);
  } catch (err: any) {
    console.error('Courses PUT error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
