"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, Button, Badge, Spinner, EmptyState, ProgressBar, Avatar } from '@/components/ui';
import { useAuth } from '@/components/AuthContext';
import { 
  BookOpen, Check, Award, Clock, ChevronLeft, ChevronRight, 
  FileText, Video, List, Send, Download, AlertTriangle, ShieldCheck, HelpCircle 
} from 'lucide-react';
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
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [showLessonList, setShowLessonList] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Timed Quiz states
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizShortAnswers, setQuizShortAnswers] = useState<Record<number, string>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [maxAttemptsReached, setMaxAttemptsReached] = useState(false);

  // Assignment states
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentFile, setAssignmentFile] = useState('');
  const [assignmentSubmitting, setAssignmentSubmitting] = useState(false);
  const [assignmentSubmission, setAssignmentSubmission] = useState<any | null>(null);

  // Discussion Comments states
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Certificate Modal states
  const [showCert, setShowCert] = useState(false);
  const [certDetails, setCertDetails] = useState<any | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const c = await api.courses.get(Number(id));
      setCourse(c);
      
      const enrollmentsList = await api.enrollments.list();
      const enr = enrollmentsList.find(e => e.course_id === Number(id));
      if (enr) {
        setEnrollment(enr);
        
        // Fetch lesson completion progress
        const prog = await api.enrollments.getProgress(enr.id);
        const completedSet = new Set((prog || []).map((p: any) => p.lesson_id));
        setCompletedLessons(completedSet);

        // Fetch certificate if completed
        if (enr.status === 'completed') {
          const cert = await api.enrollments.getCertificate(Number(id));
          setCertDetails(cert);
        }
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

  // Load lesson-specific discussions and assignments when active lesson changes
  useEffect(() => {
    if (course?.lessons && course.lessons[activeLessonIdx]) {
      const activeLesson = course.lessons[activeLessonIdx];
      loadDiscussions(activeLesson.id);
      loadAssignmentSubmission(activeLesson.id);

      // Auto expand active section
      const activeSec = activeLesson.section_title || 'General Module';
      setExpandedSections(prev => ({ ...prev, [activeSec]: true }));
      
      // Reset quiz state
      setQuizAnswers({});
      setQuizShortAnswers({});
      setQuizResult(null);
      setQuizActive(false);
      setTimeLeft(null);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [activeLessonIdx, course]);

  // Quiz Timer countdown hook
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && quizActive) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && quizActive) {
      // Auto submit quiz when timer runs out
      handleQuizSubmit(true);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, quizActive]);

  const loadDiscussions = async (lessonId: number) => {
    try {
      const data = await api.comments.listForLesson(lessonId);
      setComments(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssignmentSubmission = async (lessonId: number) => {
    if (!enrollment) return;
    try {
      const allSubs = await api.enrollments.getSubmissions();
      const sub = (allSubs || []).find(s => s.lesson_id === lessonId && s.enrollment_id === enrollment.id);
      setAssignmentSubmission(sub || null);
    } catch (err) {
      console.error(err);
    }
  };

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
      
      // If course is fully completed, load certificate
      if (updated.status === 'completed') {
        const cert = await api.enrollments.getCertificate(course.id);
        setCertDetails(cert);
        setShowCert(true);
      }

      if (activeLessonIdx < course.lessons.length - 1) {
        setActiveLessonIdx(activeLessonIdx + 1);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Timed Quiz actions
  const startQuiz = () => {
    if (!course?.lessons) return;
    const lesson = course.lessons[activeLessonIdx];
    const quiz = lesson.quizzes?.[0];
    if (!quiz) return;

    setQuizAnswers({});
    setQuizShortAnswers({});
    setQuizResult(null);
    setAttemptsCount(prev => prev + 1);
    
    if (quiz.time_limit_minutes) {
      setTimeLeft(quiz.time_limit_minutes * 60);
    } else {
      setTimeLeft(null);
    }
    setQuizActive(true);
  };

  const handleQuizSubmit = async (timeOut = false) => {
    if (!course?.lessons || !enrollment) return;
    const lesson = course.lessons[activeLessonIdx];
    const quiz = lesson.quizzes?.[0];
    if (!quiz?.questions) return;

    setQuizActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);

    let correct = 0;
    quiz.questions.forEach((q: any) => {
      if (q.type === 'short_answer') {
        const userAnswer = (quizShortAnswers[q.id] || '').trim().toLowerCase();
        const correctAnswer = (q.correct_short_answer || '').trim().toLowerCase();
        if (userAnswer === correctAnswer) correct++;
      } else {
        if (quizAnswers[q.id] === q.correct_index) correct++;
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);
    const passed = score >= (quiz.passing_score || 70);
    setQuizResult({ score, passed });

    try {
      await api.enrollments.submitQuiz(enrollment.id, quiz.id, score, passed);
      if (passed) {
        await handleCompleteLesson();
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Student Assignment Uploads
  const handleAssignmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAssignmentFile(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAssignmentSubmit = async () => {
    if (!enrollment || !course?.lessons || !assignmentText) return;
    const lesson = course.lessons[activeLessonIdx];
    setAssignmentSubmitting(true);
    try {
      const sub = await api.enrollments.submitAssignment(
        enrollment.id,
        lesson.id,
        assignmentText,
        assignmentFile
      );
      setAssignmentSubmission(sub);
      setAssignmentText('');
      setAssignmentFile('');
      await handleCompleteLesson();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAssignmentSubmitting(false);
    }
  };

  // Discussion Comments handlers
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !course?.lessons) return;
    const lesson = course.lessons[activeLessonIdx];
    setPostingComment(true);
    try {
      const posted = await api.comments.addForLesson(lesson.id, newComment);
      setComments(prev => [...prev, posted]);
      setNewComment('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit discussion post');
    } finally {
      setPostingComment(false);
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

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const LessonList = () => {
    // Group lessons by section_title
    const sections: { title: string; lessons: { lesson: any; globalIndex: number }[] }[] = [];
    lessons.forEach((lesson, globalIndex) => {
      const secTitle = lesson.section_title || 'General Module';
      let group = sections.find(s => s.title === secTitle);
      if (!group) {
        group = { title: secTitle, lessons: [] };
        sections.push(group);
      }
      group.lessons.push({ lesson, globalIndex });
    });

    const toggleSection = (title: string) => {
      setExpandedSections(prev => ({ ...prev, [title]: !prev[title] }));
    };

    return (
      <div className="space-y-3">
        {sections.map((sec, secIdx) => {
          const isExpanded = !!expandedSections[sec.title];
          const completedCount = sec.lessons.filter(sl => completedLessons.has(sl.lesson.id)).length;
          const totalCount = sec.lessons.length;
          const allCompleted = completedCount === totalCount;

          return (
            <div key={sec.title || secIdx} className="border border-navy-100 rounded-lg overflow-hidden bg-navy-50/5">
              {/* Accordion Header */}
              <button
                onClick={() => toggleSection(sec.title)}
                className="w-full flex items-center justify-between p-3 text-left bg-navy-50/20 hover:bg-navy-50/40 transition-colors cursor-pointer border-b border-navy-100/50"
              >
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="text-xs font-bold text-navy-800 truncate leading-snug">{sec.title}</h4>
                  <span className="text-[10px] font-semibold text-navy-400 block mt-0.5">
                    {completedCount}/{totalCount} Lessons {allCompleted && '✓'}
                  </span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-navy-400 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Accordion Content (Lessons) */}
              {isExpanded && (
                <div className="p-1.5 space-y-1 bg-white border-t border-navy-50/30">
                  {sec.lessons.map(({ lesson, globalIndex }) => {
                    const isActive = globalIndex === activeLessonIdx;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => { setActiveLessonIdx(globalIndex); setShowLessonList(false); }}
                        className={`w-full flex items-center gap-2 p-2 rounded-md text-left text-xs transition-colors cursor-pointer ${
                          isActive ? 'bg-navy-700 text-white font-medium shadow-sm' : 'text-navy-600 hover:bg-navy-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
                          isActive ? 'bg-navy-600 text-white' : 'bg-navy-100 text-navy-500'
                        }`}>
                          {completedLessons.has(lesson.id) ? (
                            <Check className="w-3 h-3 text-green-600 font-bold" />
                          ) : (
                            <span>{sec.lessons.findIndex(l => l.lesson.id === lesson.id) + 1}</span>
                          )}
                        </div>
                        <span className="flex-1 truncate">{lesson.title}</span>
                        <div className="flex items-center gap-1">
                          {lesson.lesson_type === 'video' && <Video className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-navy-300'}`} />}
                          {lesson.lesson_type === 'quiz' && <HelpCircle className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-navy-300'}`} />}
                          {lesson.lesson_type === 'assignment' && <FileText className={`w-3 h-3 flex-shrink-0 ${isActive ? 'text-white' : 'text-navy-300'}`} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 sm:space-y-6 py-4">
      {/* Dynamic Printing Style Tag */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #certificate-print-area, #certificate-print-area * {
            visibility: visible;
          }
          #certificate-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            padding: 0;
            margin: 0;
            border: none;
          }
        }
      `}</style>

      <button onClick={() => router.push('/dashboard/courses')} className="flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700 transition-colors cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Back to Courses
      </button>

      {/* Course Banner */}
      <Card className="p-4 sm:p-6 bg-white border border-navy-100 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="default">{course.category}</Badge>
              <Badge variant="info" className="capitalize">{course.difficulty}</Badge>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight leading-tight">{course.title}</h1>
            <p className="text-sm text-navy-500 mt-1.5 leading-relaxed">{course.description}</p>
            <div className="flex items-center gap-2 mt-3 text-xs text-navy-400">
              <Avatar name={course.author?.full_name || 'Instructor'} size="sm" />
              <span>By {course.author?.full_name} ({course.author?.rank})</span>
            </div>
          </div>
          {course.thumbnail_url && (
            <img src={course.thumbnail_url} alt={course.title} className="w-full sm:w-36 h-24 sm:h-24 rounded-lg object-cover flex-shrink-0 border border-navy-100" />
          )}
        </div>

        {isEnrolled && (
          <div className="mb-4 pt-2 border-t border-navy-50">
            <div className="flex justify-between text-xs text-navy-400 mb-1.5">
              <span className="font-semibold">{isCompleted ? 'Course Fully Completed!' : 'Your Curriculum Progress'}</span>
              <span className="font-bold text-navy-700">{enrollment?.progress}%</span>
            </div>
            <ProgressBar value={enrollment?.progress || 0} color={isCompleted ? 'green' : 'gold'} />
          </div>
        )}

        {!isEnrolled ? (
          <Button variant="gold" onClick={handleEnroll} className="w-full sm:w-auto font-bold">
            <BookOpen className="w-4 h-4 mr-1.5" /> Enroll in Course
          </Button>
        ) : isCompleted ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <Award className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm text-green-800 font-bold">Congratulations! Curriculum complete.</p>
                <p className="text-xs text-green-600">You have earned an official Nigerian Navy Mentorship certificate.</p>
              </div>
            </div>
            <Button variant="success" size="sm" onClick={() => setShowCert(true)} className="font-bold flex-shrink-0">
              <Award className="w-4 h-4 mr-1.5" /> Claim Certificate
            </Button>
          </div>
        ) : null}
      </Card>

      {/* Classroom layout */}
      {isEnrolled && lessons.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <Card className="p-4 bg-white border border-navy-100 shadow-soft hidden lg:block sticky top-6">
            <h3 className="text-sm font-bold text-navy-800 border-b border-navy-50 pb-2 mb-3">Syllabus Outlines</h3>
            <LessonList />
          </Card>

          {/* Mobile outlines dropdown */}
          <div className="lg:hidden">
            <Card className="p-3 bg-white border border-navy-100">
              <button
                onClick={() => setShowLessonList(!showLessonList)}
                className="w-full flex items-center justify-between p-1.5 text-sm font-semibold text-navy-700 cursor-pointer"
              >
                <span className="flex items-center gap-2 truncate">
                  <List className="w-4 h-4 text-navy-400 flex-shrink-0" />
                  Lesson {activeLessonIdx + 1} of {lessons.length}: {activeLesson?.title}
                </span>
                <ChevronRight className={`w-4 h-4 text-navy-400 transition-transform ${showLessonList ? 'rotate-90' : ''}`} />
              </button>
              {showLessonList && (
                <div className="mt-3 pt-3 border-t border-navy-100">
                  <LessonList />
                </div>
              )}
            </Card>
          </div>

          {/* Main workspace */}
          <div className="space-y-6">
            <Card className="p-5 sm:p-6 bg-white border border-navy-100 shadow-soft">
              {activeLesson ? (
                <div className="space-y-5">
                  {/* Lesson Meta */}
                  <div className="flex items-center justify-between border-b border-navy-50 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center">{activeLessonIdx + 1}</span>
                      <div>
                        {activeLesson.section_title && (
                          <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider block mb-1">
                            {activeLesson.section_title}
                          </span>
                        )}
                        <h2 className="text-base sm:text-lg font-bold text-navy-800 leading-tight">{activeLesson.title}</h2>
                        <span className="text-xxs font-bold text-navy-400 uppercase tracking-wide">{activeLesson.lesson_type} Lecture</span>
                      </div>
                    </div>
                    <Badge variant="default" className="text-xxs py-0.5">
                      <Clock className="w-3.5 h-3.5 mr-1" /> {activeLesson.duration_minutes} Mins
                    </Badge>
                  </div>

                  {/* Resource attachments */}
                  {activeLesson.resources && activeLesson.resources.length > 0 && (
                    <div className="p-3 bg-navy-50/50 border border-navy-100 rounded-lg space-y-2">
                      <h4 className="text-xs font-bold text-navy-700 flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5 text-gold-500" /> Downloadable Resources
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        {activeLesson.resources.map((res: any, idx: number) => (
                          <a 
                            key={idx} 
                            href={res.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-xs text-gold-600 font-medium hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5 text-navy-300" /> {res.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Video Player */}
                  {activeLesson.lesson_type === 'video' && activeLesson.video_url && (
                    <div className="rounded-xl overflow-hidden bg-navy-900 border border-navy-200 aspect-video shadow-md">
                      {activeLesson.video_url.includes('youtube.com') || activeLesson.video_url.includes('youtu.be') ? (
                        <iframe 
                          src={activeLesson.video_url} 
                          className="w-full h-full"
                          allowFullScreen
                        />
                      ) : (
                        <video src={activeLesson.video_url} controls className="w-full h-full" />
                      )}
                    </div>
                  )}

                  {/* Text material rendered safely from custom WYSIWYG editor */}
                  {activeLesson.lesson_type === 'text' && activeLesson.content && (
                    <div 
                      className="prose prose-sm max-w-none text-navy-800 leading-relaxed font-normal"
                      dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                    />
                  )}

                  {/* TIMED QUIZ COMPONENT */}
                  {activeLesson.lesson_type === 'quiz' && activeLesson.quizzes?.[0] && (
                    <div className="space-y-4">
                      {/* Before starting */}
                      {!quizActive && !quizResult && (
                        <div className="text-center py-8 bg-navy-50/35 border border-navy-100 rounded-xl space-y-4">
                          <HelpCircle className="w-12 h-12 text-gold-400 mx-auto" />
                          <div className="space-y-1">
                            <h4 className="font-bold text-navy-800 text-sm">Welcome to the Lesson Quiz</h4>
                            <p className="text-xs text-navy-400 max-w-sm mx-auto leading-relaxed">
                              This is a timed quiz. You need to score at least {activeLesson.quizzes[0].passing_score}% to pass. 
                              {activeLesson.quizzes[0].time_limit_minutes && ` You will have ${activeLesson.quizzes[0].time_limit_minutes} minutes.`}
                            </p>
                          </div>
                          <Button variant="gold" className="font-bold" onClick={startQuiz}>
                            Start Quiz
                          </Button>
                        </div>
                      )}

                      {/* Quiz Active Question Board */}
                      {quizActive && (
                        <div className="space-y-5">
                          {/* Header timer */}
                          {timeLeft !== null && (
                            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg text-red-600">
                              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Clock className="w-4 h-4 animate-pulse" /> Time Remaining
                              </span>
                              <span className="font-mono font-bold text-sm">{formatTime(timeLeft)}</span>
                            </div>
                          )}

                          <div className="space-y-4">
                            {activeLesson.quizzes[0].questions?.map((q: any, qi: number) => (
                              <div key={q.id || qi} className="p-4 bg-navy-50/30 border border-navy-100 rounded-xl space-y-3">
                                <p className="text-sm font-semibold text-navy-800">{qi + 1}. {q.question}</p>
                                
                                {q.type === 'short_answer' ? (
                                  <input
                                    type="text"
                                    placeholder="Type your answer here..."
                                    value={quizShortAnswers[q.id] || ''}
                                    onChange={e => setQuizShortAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                    className="w-full px-3 py-2 rounded-lg border border-navy-200 text-xs focus:ring-2 focus:ring-gold-400"
                                  />
                                ) : (
                                  <div className="grid grid-cols-1 gap-2">
                                    {(q.options || []).map((opt: string, oi: number) => (
                                      <label 
                                        key={oi} 
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-white transition-all text-xs font-medium ${
                                          quizAnswers[q.id] === oi
                                            ? 'border-gold-400 bg-white ring-2 ring-gold-400/20'
                                            : 'border-navy-100 bg-navy-50/20'
                                        }`}
                                      >
                                        <input 
                                          type="radio" 
                                          name={`q-${q.id}`} 
                                          checked={quizAnswers[q.id] === oi} 
                                          onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oi }))} 
                                          className="w-4 h-4 text-gold-500 focus:ring-gold-400 cursor-pointer" 
                                        />
                                        <span>{opt}</span>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          <Button onClick={() => handleQuizSubmit()} className="w-full font-bold">
                            Submit Quiz Assessment
                          </Button>
                        </div>
                      )}

                      {/* Quiz result view */}
                      {quizResult && (
                        <div className="text-center py-8 bg-navy-50/20 border border-navy-100 rounded-xl space-y-4 max-w-md mx-auto">
                          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-soft ${
                            quizResult.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {quizResult.passed ? <Check className="w-8 h-8 font-bold" /> : <AlertTriangle className="w-8 h-8" />}
                          </div>
                          <div className="space-y-1">
                            <h4 className="font-bold text-navy-800 text-lg">Quiz Score: {quizResult.score}%</h4>
                            <Badge variant={quizResult.passed ? 'success' : 'danger'}>
                              {quizResult.passed ? 'PASSED' : 'FAILED'}
                            </Badge>
                            <p className="text-xs text-navy-400 pt-2 leading-relaxed px-6">
                              {quizResult.passed 
                                ? 'Congratulations! You achieved the passing grade for this lesson module.'
                                : `You did not pass. The passing score is ${activeLesson.quizzes[0].passing_score}%. Review the lecture materials and attempt the quiz again.`
                              }
                            </p>
                          </div>
                          <div className="flex gap-2 justify-center px-6">
                            {!quizResult.passed && (
                              <Button variant="outline" className="font-bold cursor-pointer" onClick={startQuiz}>
                                Retry Quiz Attempt
                              </Button>
                            )}
                            <Button variant="gold" className="font-bold" onClick={() => setQuizResult(null)}>
                              Close Score Card
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* STUDENT ASSIGNMENTS SECTION */}
                  {activeLesson.lesson_type === 'assignment' && (
                    <div className="space-y-4 border-t border-navy-100 pt-4">
                      <div className="bg-navy-50/40 p-4 rounded-xl border border-navy-100 space-y-2">
                        <h4 className="font-bold text-navy-800 text-xs flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-gold-400" /> Assignment Instructions
                        </h4>
                        <div 
                          className="prose prose-sm max-w-none text-navy-700 text-xs leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                        />
                      </div>

                      {assignmentSubmission ? (
                        <div className="p-4 bg-green-50/40 border border-green-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-green-800">Assignment Submitted Successfully</h5>
                            {assignmentSubmission.status === 'graded' ? (
                              <Badge variant="gold">Graded: {assignmentSubmission.score}/100</Badge>
                            ) : (
                              <Badge variant="default">Pending Grade</Badge>
                            )}
                          </div>
                          <p className="text-xs text-navy-600 leading-relaxed italic">"{assignmentSubmission.text_content}"</p>
                          {assignmentSubmission.file_url && (
                            <a 
                              href={assignmentSubmission.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xxs text-gold-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> View Submitted File Attachment
                            </a>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3 bg-white p-4 border border-navy-100 rounded-xl">
                          <h4 className="text-xs font-bold text-navy-800">Submit Your Solution</h4>
                          
                          <div className="space-y-1.5">
                            <label className="text-xxs font-bold text-navy-500 uppercase tracking-wider">Solution Text Content</label>
                            <textarea
                              placeholder="Write your assignment text or write-up here..."
                              value={assignmentText}
                              onChange={e => setAssignmentText(e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 rounded-lg border border-navy-200 text-xs focus:ring-2 focus:ring-gold-400"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xxs font-bold text-navy-500 uppercase tracking-wider">Upload Document File (Optional)</label>
                            <input
                              type="file"
                              onChange={handleAssignmentUpload}
                              className="block w-full text-xs text-navy-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-700 file:hover:bg-navy-100 cursor-pointer"
                            />
                          </div>

                          <Button 
                            disabled={assignmentSubmitting || !assignmentText} 
                            onClick={handleAssignmentSubmit}
                            className="w-full font-bold shadow-soft text-xs py-2"
                          >
                            {assignmentSubmitting ? 'Uploading...' : 'Submit Assignment'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation bar */}
                  <div className="flex justify-between items-center gap-2 mt-8 pt-4 border-t border-navy-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      disabled={activeLessonIdx === 0} 
                      onClick={() => setActiveLessonIdx(activeLessonIdx - 1)}
                    >
                      <ChevronLeft className="w-4 h-4 mr-0.5" /> Previous Lesson
                    </Button>
                    
                    {!completedLessons.has(activeLesson.id) && activeLesson.lesson_type !== 'quiz' && activeLesson.lesson_type !== 'assignment' && (
                      <Button size="sm" onClick={handleCompleteLesson} className="font-bold">
                        <Check className="w-4 h-4 mr-1" /> Mark Lesson Complete
                      </Button>
                    )}
                    
                    {activeLessonIdx < lessons.length - 1 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setActiveLessonIdx(activeLessonIdx + 1)}
                      >
                        Next Lesson <ChevronRight className="w-4 h-4 ml-0.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <EmptyState title="No lessons in this course" />
              )}
            </Card>

            {/* CLASSROOM DISCUSSION BOARD COMMENTS */}
            <Card className="p-5 sm:p-6 bg-white border border-navy-100 shadow-soft space-y-4">
              <h3 className="text-sm font-bold text-navy-800 border-b border-navy-50 pb-2">Lesson Discussions</h3>

              {comments.length === 0 ? (
                <p className="text-xs text-navy-400 py-2">No discussion posts here. Be the first to ask a question!</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2.5 items-start bg-navy-50/20 p-3 rounded-lg border border-navy-50">
                      <Avatar name={comment.user?.full_name || 'User'} size="sm" src={comment.user?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <span className="text-xs font-bold text-navy-800">{comment.user?.full_name}</span>
                          <span className="text-xxs text-navy-400">{comment.user?.rank || 'Naval Personnel'}</span>
                        </div>
                        <p className="text-xs text-navy-700 mt-1 leading-relaxed">{comment.content}</p>
                        <span className="text-[10px] text-navy-300 block mt-1.5">
                          {new Date(comment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {new Date(comment.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Post a comment or ask a question..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-navy-200 text-xs focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
                <Button type="submit" disabled={postingComment || !newComment.trim()} size="sm">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </Card>
          </div>
        </div>
      )}

      {/* Dynamic landscape certificate claim modal */}
      {showCert && certDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-4xl bg-white p-6 shadow-pro relative flex flex-col space-y-4">
            <button 
              onClick={() => setShowCert(false)} 
              className="absolute top-4 right-4 text-navy-400 hover:text-navy-700 cursor-pointer print:hidden"
            >
              ✕
            </button>

            {/* Print trigger */}
            <div className="flex items-center justify-between border-b border-navy-50 pb-2 print:hidden">
              <h3 className="font-bold text-navy-800 text-base flex items-center gap-1.5">
                <Award className="w-5 h-5 text-gold-500" /> Mentorship Certificate
              </h3>
              <Button onClick={() => window.print()} className="font-bold">
                <Download className="w-4 h-4 mr-1.5" /> Print Certificate / Save PDF
              </Button>
            </div>

            {/* Visual Certificate Frame */}
            <div 
              id="certificate-print-area" 
              className="w-full aspect-[1.414/1] bg-navy-50/40 border-[16px] border-double border-navy-800 p-8 sm:p-12 flex flex-col justify-between items-center text-center relative select-none rounded-sm shadow-soft overflow-hidden"
              style={{ backgroundImage: 'radial-gradient(circle, #fbfcfd 0%, #f4f6f8 100%)' }}
            >
              {/* Gold corners */}
              <div className="absolute top-3 left-3 w-8 h-8 border-t-4 border-l-4 border-gold-400" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-4 border-r-4 border-gold-400" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-4 border-l-4 border-gold-400" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-4 border-r-4 border-gold-400" />

              {/* Navy Seal logo placeholder */}
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-navy-800 border-4 border-gold-400 flex items-center justify-center text-gold-400 font-bold mb-1 shadow-soft">
                  ⚓
                </div>
                <span className="text-[10px] font-bold text-navy-800 uppercase tracking-widest">Nigerian Navy Mentorship Academy</span>
              </div>

              {/* Body */}
              <div className="space-y-4 flex-1 flex flex-col justify-center my-4">
                <span className="font-serif italic text-xs text-navy-500 tracking-wide">This document officially certifies that</span>
                
                <h2 className="font-serif font-extrabold text-2xl sm:text-3xl text-navy-900 border-b-2 border-dashed border-navy-200 pb-1 px-8 inline-block mx-auto uppercase tracking-wide">
                  {profile?.full_name || 'Naval Officer'}
                </h2>
                
                <p className="text-xs text-navy-600 max-w-md mx-auto leading-relaxed">
                  has successfully completed the instructional curriculum, course requirements, and evaluations for the platform mentorship course:
                </p>

                <h3 className="font-bold text-base sm:text-lg text-navy-800 tracking-tight italic">
                  "{course.title}"
                </h3>
              </div>

              {/* Signatures and Details */}
              <div className="w-full flex justify-between items-end text-left pt-6 border-t border-navy-100 flex-wrap gap-4">
                <div>
                  <span className="text-[9px] text-navy-400 block">Certificate Identification Code</span>
                  <span className="font-mono text-xxs font-bold text-navy-800">{certDetails.certificate_number}</span>
                </div>

                <div className="text-center">
                  <div className="w-24 border-b border-navy-800 font-serif italic text-xxs text-navy-600 py-1">Rear Admiral A. Bello</div>
                  <span className="text-[8px] text-navy-400 uppercase font-bold tracking-wider">Superintendent Commandant</span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] text-navy-400 block">Issue Date</span>
                  <span className="text-xxs font-bold text-navy-800">
                    {new Date(certDetails.issued_at || certDetails.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
