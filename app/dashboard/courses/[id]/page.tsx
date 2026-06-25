"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Button, Badge, Spinner, EmptyState, ProgressBar, Modal } from '@/components/ui';
import { useAuth } from '@/components/AuthContext';
import { BookOpen, Check, Award, Clock, ChevronLeft, ChevronRight, FileText, Video, List } from 'lucide-react';
import type { Course, Enrollment } from '@/lib/types-phase2';

export default function CourseDetail() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { profile } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [showLessonList, setShowLessonList] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const c = await api.courses.get(Number(id));
      setCourse(c);
      const enrollments = await api.enrollments.list();
      const enr = enrollments.find(e => e.course_id === Number(id));
      if (enr) {
        setEnrollment(enr);
        // If there is an enrollment, we should also track lesson completion
        // For local demo/mock fallback we can populate completedLessons from lesson_progress if available
        // Or we can infer it or fetch it. In our local API handler, we return the enrollment progress,
        // so we can mark lessons completed up to that progress or just query lesson_progress.
        // For simplicity, let's set completed lessons
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleEnroll = async () => {
    if (!course) return;
    try {
      const enr = await api.enrollments.enroll(course.id);
      setEnrollment(enr);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCompleteLesson = async () => {
    if (!enrollment || !course?.lessons) return;
    const lesson = course.lessons[activeLessonIdx];
    try {
      const updated = await api.enrollments.completeLesson(enrollment.id, lesson.id);
      setEnrollment(updated);
      setCompletedLessons(prev => new Set([...prev, lesson.id]));
      if (activeLessonIdx < course.lessons.length - 1) {
        setActiveLessonIdx(activeLessonIdx + 1);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleQuizSubmit = async () => {
    if (!course?.lessons || !enrollment) return;
    const lesson = course.lessons[activeLessonIdx];
    const quiz = lesson.quizzes?.[0];
    if (!quiz?.questions) return;

    let correct = 0;
    quiz.questions.forEach(q => {
      if (quizAnswers[q.id] === q.correct_index) correct++;
    });
    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= quiz.passing_score;
    setQuizResult({ score, passed });

    try {
      await api.enrollments.submitQuiz(enrollment.id, quiz.id, score, passed);
      if (passed) await handleCompleteLesson();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  
  if (!course) {
    return (
      <EmptyState
        title="Course not found"
        action={
          <Link href="/dashboard/courses">
            <Button>Back to Courses</Button>
          </Link>
        }
      />
    );
  }

  const lessons = course.lessons || [];
  const activeLesson = lessons[activeLessonIdx];
  const isEnrolled = !!enrollment;
  const isCompleted = enrollment?.status === 'completed';

  const LessonList = () => (
    <div className="space-y-1">
      {lessons.map((lesson, idx) => (
        <button
          key={lesson.id}
          onClick={() => { setActiveLessonIdx(idx); setShowLessonList(false); }}
          className={`w-full flex items-center gap-2 p-2.5 rounded-md text-left text-sm transition-colors ${
            idx === activeLessonIdx ? 'bg-navy-100 text-navy-800 font-medium' : 'text-navy-600 hover:bg-navy-50'
          }`}
        >
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0">
            {completedLessons.has(lesson.id) ? <Check className="w-4 h-4 text-green-600" /> : <span className="text-navy-400">{idx + 1}</span>}
          </div>
          <span className="flex-1 truncate">{lesson.title}</span>
          {lesson.video_url && <Video className="w-3.5 h-3.5 text-navy-300 flex-shrink-0" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <button onClick={() => router.push('/dashboard/courses')} className="flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700 transition-colors cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Back to Courses
      </button>

      {/* Course Header */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="default">{course.category}</Badge>
              <Badge variant="info">{course.difficulty}</Badge>
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-navy-800">{course.title}</h1>
            <p className="text-sm text-navy-500 mt-1">{course.description}</p>
            <p className="text-xs text-navy-400 mt-2">By {course.author?.full_name} · {course.author?.rank}</p>
          </div>
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt={course.title} className="w-full sm:w-24 h-32 sm:h-24 rounded-md object-cover flex-shrink-0" />
          )}
        </div>

        {isEnrolled && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-navy-400 mb-1">
              <span>{isCompleted ? 'Course Completed!' : 'Your Progress'}</span>
              <span className="font-medium text-navy-600">{enrollment?.progress}%</span>
            </div>
            <ProgressBar value={enrollment?.progress || 0} color={isCompleted ? 'green' : 'gold'} />
          </div>
        )}

        {!isEnrolled ? (
          <Button variant="gold" onClick={handleEnroll} className="w-full sm:w-auto">
            <BookOpen className="w-4 h-4" /> Enroll in Course
          </Button>
        ) : isCompleted ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-md border border-green-100">
            <Award className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700 font-medium">Congratulations! You\'ve completed this course and earned a certificate.</p>
          </div>
        ) : null}
      </Card>

      {/* Lessons + Content */}
      {isEnrolled && lessons.length > 0 && (
        <>
          {/* Desktop: two-column layout */}
          <div className="hidden lg:grid lg:grid-cols-[280px_1fr] gap-4">
            <Card className="p-3">
              <h3 className="text-sm font-semibold text-navy-700 px-2 py-2 mb-1">Lessons ({lessons.length})</h3>
              <LessonList />
            </Card>

            <Card className="p-5">
              {activeLesson && <LessonContent />}
            </Card>
          </div>

          {/* Mobile: stacked layout with lesson selector */}
          <div className="lg:hidden space-y-3">
            {/* Lesson selector dropdown */}
            <Card className="p-3">
              <button
                onClick={() => setShowLessonList(!showLessonList)}
                className="w-full flex items-center justify-between p-2 text-sm font-medium text-navy-700"
              >
                <span className="flex items-center gap-2">
                  <List className="w-4 h-4 text-navy-400" />
                  Lesson {activeLessonIdx + 1} of {lessons.length}: {activeLesson?.title}
                </span>
                <ChevronRight className={`w-4 h-4 text-navy-400 transition-transform ${showLessonList ? 'rotate-90' : ''}`} />
              </button>
              {showLessonList && (
                <div className="mt-2 pt-2 border-t border-navy-100">
                  <LessonList />
                </div>
              )}
            </Card>

            {/* Lesson content */}
            <Card className="p-4">
              {activeLesson && <LessonContent />}
            </Card>
          </div>
        </>
      )}

      {/* Quiz Modal */}
      <Modal open={showQuiz} onClose={() => setShowQuiz(false)} title="Lesson Quiz" size="lg">
        {activeLesson?.quizzes?.[0] && !quizResult && (
          <div className="space-y-4">
            <p className="text-sm text-navy-500">Passing score: {activeLesson.quizzes[0].passing_score}%</p>
            {activeLesson.quizzes[0].questions?.map((q, qi) => (
              <div key={q.id} className="p-3 bg-navy-50 rounded-md">
                <p className="text-sm font-medium text-navy-800 mb-2">{qi + 1}. {q.question}</p>
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-white transition-colors">
                      <input type="radio" name={`q-${q.id}`} checked={quizAnswers[q.id] === oi} onChange={() => setQuizAnswers(a => ({ ...a, [q.id]: oi }))} className="w-4 h-4 text-gold-500" />
                      <span className="text-sm text-navy-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button onClick={handleQuizSubmit} className="w-full">Submit Quiz</Button>
          </div>
        )}
        {quizResult && (
          <div className="text-center py-6">
            <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center ${quizResult.passed ? 'bg-green-100' : 'bg-red-100'}`}>
              {quizResult.passed ? <Check className="w-7 h-7 text-green-600" /> : <span className="text-2xl">✕</span>}
            </div>
            <p className="text-lg font-bold text-navy-800">Score: {quizResult.score}%</p>
            <p className="text-sm text-navy-400 mt-1">{quizResult.passed ? 'Congratulations! You passed.' : 'You did not pass. Review the lesson and try again.'}</p>
            <Button className="mt-4" onClick={() => setShowQuiz(false)}>{quizResult.passed ? 'Continue' : 'Close'}</Button>
          </div>
        )}
      </Modal>
    </div>
  );

  function LessonContent() {
    if (!activeLesson) return null;
    return (
      <>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-navy-700 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{activeLessonIdx + 1}</span>
          <h2 className="text-base sm:text-lg font-bold text-navy-800">{activeLesson.title}</h2>
        </div>
        <div className="flex items-center gap-3 text-xs text-navy-400 mb-4">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {activeLesson.duration_minutes} min</span>
        </div>

        {activeLesson.video_url && (
          <div className="mb-4 rounded-md overflow-hidden bg-navy-900 aspect-video">
            <video src={activeLesson.video_url} controls className="w-full h-full" />
          </div>
        )}

        {activeLesson.content && (
          <div className="prose prose-sm max-w-none text-navy-700 mb-4 whitespace-pre-wrap leading-relaxed">{activeLesson.content}</div>
        )}

        {activeLesson.quizzes && activeLesson.quizzes.length > 0 && (
          <div className="border-t border-navy-100 pt-4">
            <Button variant="outline" size="sm" onClick={() => { setShowQuiz(true); setQuizResult(null); setQuizAnswers({}); }}>
              <FileText className="w-4 h-4" /> Take Quiz
            </Button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-6 pt-4 border-t border-navy-100">
          <Button variant="ghost" size="sm" disabled={activeLessonIdx === 0} onClick={() => setActiveLessonIdx(activeLessonIdx - 1)}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          {!completedLessons.has(activeLesson.id) && (!activeLesson.quizzes || activeLesson.quizzes.length === 0) && (
            <Button size="sm" onClick={handleCompleteLesson}><Check className="w-4 h-4" /> Mark Complete</Button>
          )}
          {activeLessonIdx < lessons.length - 1 && (
            <Button size="sm" variant="outline" onClick={() => setActiveLessonIdx(activeLessonIdx + 1)}>Next <ChevronRight className="w-4 h-4" /></Button>
          )}
        </div>
      </>
    );
  }
}
