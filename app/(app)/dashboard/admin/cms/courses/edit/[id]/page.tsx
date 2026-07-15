"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, Spinner, Badge } from '@/components/ui';
import { 
  ArrowLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, BookOpen, 
  HelpCircle, Clock, Award, FileText, User, Video, Edit3, Check
} from 'lucide-react';
import { api } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';

const categories = ['Leadership', 'Operations', 'Seamanship', 'Engineering', 'Logistics'];
const PRELOADED_THUMBNAILS = [
  { url: '/naval_fleet_operations.png', label: 'Fleet Operations' },
  { url: '/naval_training_drill.png', label: 'Training Drill' },
  { url: '/naval_mentorship_session.png', label: 'Mentorship Session' },
  { url: '/naval_command_ceremony.png', label: 'Command Ceremony' }
];

export default function EditCourse() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [activeTab, setActiveTab] = useState<'info' | 'curriculum' | 'submissions'>('info');
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Course Info states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'pending'>('published');
  const [uploading, setUploading] = useState(false);

  // Curriculum states
  const [sections, setSections] = useState<string[]>(['Section 1: Introduction']);
  const [lessons, setLessons] = useState<any[]>([]);
  const [editingLessonIndex, setEditingLessonIndex] = useState<number | null>(null);

  // Submissions states
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const course = await api.courses.get(id);
        if (course) {
          setTitle(course.title);
          setDescription(course.description);
          setCategory(course.category);
          setDifficulty(course.difficulty as any);
          setThumbnailUrl(course.thumbnail_url || '');
          setStatus(course.status as any);

          // Extract sections from lessons
          const lesList = course.lessons || [];
          const secs = Array.from(new Set(lesList.map((l: any) => l.section_title || 'Section 1: Introduction'))) as string[];
          if (secs.length === 0) secs.push('Section 1: Introduction');
          setSections(secs);
          setLessons(lesList.map((l: any) => ({
            ...l,
            quizzes: l.quizzes || []
          })));
        }
      } catch (err: any) {
        setError('Failed to fetch course details');
      } finally {
        setLoadingCourse(false);
      }
    };

    if (id) fetchCourse();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'submissions') {
      loadSubmissions();
    }
  }, [activeTab]);

  const loadSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const data = await api.enrollments.getSubmissions();
      // Filter submissions for lessons belonging to this course
      const courseLessonIds = lessons.map(l => l.id);
      const filtered = (data || []).filter(s => courseLessonIds.includes(s.lesson_id));
      setSubmissions(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setError('');
      try {
        const res = await api.upload(file);
        setThumbnailUrl(res.url);
      } catch (err: any) {
        setError(err.message || 'Failed to upload image to object storage');
      } finally {
        setUploading(false);
      }
    }
  };

  // Reorder operations
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSecs = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSecs.length) return;
    
    // Swap sections
    const temp = newSecs[index];
    newSecs[index] = newSecs[targetIndex];
    newSecs[targetIndex] = temp;
    setSections(newSecs);
  };

  const moveLesson = (index: number, direction: 'up' | 'down') => {
    const newLessons = [...lessons];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLessons.length) return;

    const temp = newLessons[index];
    newLessons[index] = newLessons[targetIndex];
    newLessons[targetIndex] = temp;
    setLessons(newLessons);
  };

  const addSection = () => {
    const newSecName = prompt('Enter section title:', `Section ${sections.length + 1}: Title`);
    if (newSecName) {
      setSections([...sections, newSecName]);
    }
  };

  const removeSection = (secName: string) => {
    if (confirm(`Are you sure you want to remove "${secName}"? All lessons in this section will be deleted.`)) {
      setSections(sections.filter(s => s !== secName));
      setLessons(lessons.filter(l => l.section_title !== secName));
    }
  };

  const addLesson = (secName: string) => {
    const newLes = {
      title: 'New Lesson',
      content: 'Lesson content here...',
      video_url: '',
      duration_minutes: 10,
      section_title: secName,
      lesson_type: 'text',
      resources: [],
      quizzes: []
    };
    setLessons([...lessons, newLes]);
    setEditingLessonIndex(lessons.length);
  };

  const removeLesson = (index: number) => {
    if (confirm('Delete this lesson?')) {
      setLessons(lessons.filter((_, i) => i !== index));
      setEditingLessonIndex(null);
    }
  };

  // Quiz questions builder helpers
  const addQuizQuestion = (lessonIdx: number) => {
    const updated = [...lessons];
    const quiz = updated[lessonIdx].quizzes?.[0] || {
      title: 'Lesson Quiz',
      passing_score: 70,
      time_limit_minutes: 15,
      max_retakes: 3,
      questions: []
    };
    quiz.questions.push({
      question: 'New Question',
      type: 'multiple_choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_index: 0
    });
    updated[lessonIdx].quizzes = [quiz];
    setLessons(updated);
  };

  const removeQuizQuestion = (lessonIdx: number, qIdx: number) => {
    const updated = [...lessons];
    if (updated[lessonIdx].quizzes?.[0]) {
      updated[lessonIdx].quizzes[0].questions = updated[lessonIdx].quizzes[0].questions.filter((_: any, idx: number) => idx !== qIdx);
      setLessons(updated);
    }
  };

  const updateQuizMeta = (lessonIdx: number, field: string, val: any) => {
    const updated = [...lessons];
    const quiz = updated[lessonIdx].quizzes?.[0] || {
      title: 'Lesson Quiz',
      passing_score: 70,
      time_limit_minutes: 15,
      max_retakes: 3,
      questions: []
    };
    quiz[field] = val;
    updated[lessonIdx].quizzes = [quiz];
    setLessons(updated);
  };

  const handleSaveCourse = async () => {
    if (!title || !description) {
      setError('Please enter course title and description.');
      return;
    }
    if (uploading) {
      setError('Please wait until the thumbnail image finishes uploading.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await api.courses.update(id, {
        title,
        description,
        category,
        difficulty,
        thumbnail_url: thumbnailUrl || null,
        status,
        lessons
      });
      setSuccess('Course and curriculum updated successfully!');
      window.scrollTo(0, 0);
    } catch (err: any) {
      setError(err.message || 'Failed to update course');
    } finally {
      setSaving(false);
    }
  };

  const handleGradeSubmission = async (enrollmentId: number, subId: number) => {
    try {
      await api.enrollments.gradeAssignment(enrollmentId, subId, gradeScore);
      setGradingSubmissionId(null);
      loadSubmissions();
    } catch (err) {
      console.error(err);
    }
  };

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-6 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-navy-100 pb-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/admin?tab=cms')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Admin Dashboard
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight">{title || 'Edit Course'}</h1>
            <p className="text-sm text-navy-400 mt-0.5">Teachable-style course curriculum builder and submissions manager</p>
          </div>
        </div>
        <Button onClick={handleSaveCourse} disabled={saving} className="shadow-soft w-full sm:w-auto">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save All Changes'}
        </Button>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3.5 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-navy-100">
        <button
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'info'
              ? 'border-gold-400 text-navy-800'
              : 'border-transparent text-navy-400 hover:text-navy-600'
          }`}
        >
          1. Course Information
        </button>
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'curriculum'
              ? 'border-gold-400 text-navy-800'
              : 'border-transparent text-navy-400 hover:text-navy-600'
          }`}
        >
          2. Curriculum Builder
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2.5 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
            activeTab === 'submissions'
              ? 'border-gold-400 text-navy-800'
              : 'border-transparent text-navy-400 hover:text-navy-600'
          }`}
        >
          3. Submissions & Grades
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <Card className="p-5 sm:p-6 space-y-4 bg-white">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy-700">Course Title</label>
                <input
                  type="text"
                  placeholder="e.g. Navigation & Ship Handling Basics"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-navy-700">Course Description</label>
                <textarea
                  placeholder="Summarize course goals, syllabus, and learning expectations..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={6}
                  className="w-full px-3.5 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm leading-relaxed"
                />
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            <Card className="p-5 space-y-5 bg-white">
              <h2 className="font-bold text-navy-800 text-sm border-b border-navy-50 pb-2">Publish Settings</h2>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-500 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm cursor-pointer"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-500 uppercase tracking-wider">Difficulty Level</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm cursor-pointer"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy-500 uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm cursor-pointer"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="pending">Pending Approval</option>
                </select>
              </div>
            </Card>

            <Card className="p-5 space-y-4 bg-white">
              <h2 className="font-bold text-navy-800 text-sm border-b border-navy-50 pb-2">Course Thumbnail</h2>

              {uploading ? (
                 <div className="w-full h-24 bg-navy-50 border border-dashed border-navy-200 rounded-lg flex flex-col items-center justify-center text-navy-400">
                   <div className="w-6 h-6 border-2 border-navy-400 border-t-transparent rounded-full animate-spin mb-1" />
                   <p className="text-xxs">Uploading to object storage...</p>
                 </div>
               ) : thumbnailUrl ? (
                 <div className="space-y-2">
                   <img src={thumbnailUrl} alt="Thumbnail Preview" className="w-full h-32 object-cover rounded-lg" />
                   <Button variant="outline" size="sm" onClick={() => setThumbnailUrl('')} className="w-full text-red-500 hover:text-red-600">
                     Remove Image
                   </Button>
                 </div>
               ) : (
                 <div className="w-full h-24 bg-navy-50 border border-dashed border-navy-200 rounded-lg flex flex-col items-center justify-center text-navy-300">
                   <BookOpen className="w-8 h-8 text-navy-300 mb-1" />
                   <p className="text-xxs">No image selected</p>
                 </div>
               )}

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="block w-full text-xs text-navy-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-700 file:hover:bg-navy-100 cursor-pointer"
              />

              <div className="w-full flex items-center gap-1.5 my-2">
                <div className="flex-1 h-px bg-navy-100" />
                <span className="text-xxs text-navy-300 font-semibold uppercase">Or Choose Preloaded</span>
                <div className="flex-1 h-px bg-navy-100" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PRELOADED_THUMBNAILS.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setThumbnailUrl(img.url)}
                    className={`p-1 border rounded-lg hover:border-navy-400 transition-all text-left flex flex-col items-center gap-1 cursor-pointer bg-white ${
                      thumbnailUrl === img.url ? 'ring-2 ring-gold-400 border-gold-400' : 'border-navy-100'
                    }`}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-10 object-cover rounded" />
                    <span className="text-xxs text-navy-600 font-medium truncate w-full text-center mt-1">{img.label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'curriculum' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sections List */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between border-b border-navy-50 pb-2">
              <h2 className="font-bold text-navy-800 text-sm">Course Outline</h2>
              <Button size="sm" onClick={addSection}>
                <Plus className="w-3.5 h-3.5 mr-0.5" /> Add Section
              </Button>
            </div>

            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <Card key={sec} className="p-3 bg-navy-50/50 hover:bg-navy-50 transition-colors border border-navy-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-navy-800 truncate">{sec}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => moveSection(idx, 'up')} className="p-1 hover:bg-navy-100 rounded text-navy-600">
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => moveSection(idx, 'down')} className="p-1 hover:bg-navy-100 rounded text-navy-600">
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeSection(sec)} className="p-1 hover:bg-navy-100 rounded text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Lessons in Section */}
                  <div className="mt-3 space-y-1.5 pl-2 border-l border-navy-200">
                    {lessons.filter(l => l.section_title === sec).map((l, lIdx) => {
                      const absoluteIdx = lessons.findIndex(les => les === l);
                      return (
                        <div 
                          key={absoluteIdx} 
                          onClick={() => setEditingLessonIndex(absoluteIdx)}
                          className={`p-2 rounded-lg text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                            editingLessonIndex === absoluteIdx
                              ? 'bg-navy-700 text-white font-semibold'
                              : 'bg-white text-navy-700 hover:bg-navy-100 border border-navy-100'
                          }`}
                        >
                          <span className="truncate flex items-center gap-1.5">
                            {l.lesson_type === 'video' && <Video className="w-3 h-3 flex-shrink-0" />}
                            {l.lesson_type === 'text' && <BookOpen className="w-3 h-3 flex-shrink-0" />}
                            {l.lesson_type === 'quiz' && <HelpCircle className="w-3 h-3 flex-shrink-0" />}
                            {l.lesson_type === 'assignment' && <FileText className="w-3 h-3 flex-shrink-0" />}
                            {l.title}
                          </span>
                          
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveLesson(absoluteIdx, 'up'); }} 
                              className={`p-0.5 rounded ${editingLessonIndex === absoluteIdx ? 'hover:bg-navy-600 text-navy-200' : 'hover:bg-navy-200 text-navy-400'}`}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); moveLesson(absoluteIdx, 'down'); }} 
                              className={`p-0.5 rounded ${editingLessonIndex === absoluteIdx ? 'hover:bg-navy-600 text-navy-200' : 'hover:bg-navy-200 text-navy-400'}`}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      onClick={() => addLesson(sec)}
                      className="w-full text-left p-1.5 border border-dashed border-navy-200 rounded-lg text-xxs text-navy-500 font-semibold flex items-center justify-center hover:bg-white transition-all cursor-pointer"
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> Add Lesson
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Lesson Editor Workspace */}
          <div className="lg:col-span-2">
            {editingLessonIndex !== null && lessons[editingLessonIndex] ? (
              <Card className="p-5 sm:p-6 space-y-5 bg-white">
                <div className="flex items-center justify-between border-b border-navy-50 pb-2">
                  <h3 className="font-bold text-navy-800 text-base">Edit Lesson Details</h3>
                  <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => removeLesson(editingLessonIndex)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Lesson
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy-700">Lesson Title</label>
                    <input
                      type="text"
                      value={lessons[editingLessonIndex].title}
                      onChange={e => {
                        const updated = [...lessons];
                        updated[editingLessonIndex].title = e.target.value;
                        setLessons(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy-700">Lesson Type</label>
                    <select
                      value={lessons[editingLessonIndex].lesson_type || 'text'}
                      onChange={e => {
                        const updated = [...lessons];
                        updated[editingLessonIndex].lesson_type = e.target.value;
                        if (e.target.value === 'quiz' && (!updated[editingLessonIndex].quizzes || updated[editingLessonIndex].quizzes.length === 0)) {
                          updated[editingLessonIndex].quizzes = [{
                            title: 'Lesson Quiz',
                            passing_score: 70,
                            time_limit_minutes: 15,
                            max_retakes: 3,
                            questions: []
                          }];
                        }
                        setLessons(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white text-xs cursor-pointer"
                    >
                      <option value="text">Text Article</option>
                      <option value="video">Video Lecture</option>
                      <option value="quiz">Interactive Quiz</option>
                      <option value="assignment">Student Assignment</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy-700">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={lessons[editingLessonIndex].duration_minutes}
                      onChange={e => {
                        const updated = [...lessons];
                        updated[editingLessonIndex].duration_minutes = Number(e.target.value);
                        setLessons(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-navy-700">Video URL (For Video lectures)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://www.youtube.com/embed/..."
                      value={lessons[editingLessonIndex].video_url || ''}
                      onChange={e => {
                        const updated = [...lessons];
                        updated[editingLessonIndex].video_url = e.target.value;
                        setLessons(updated);
                      }}
                      className="w-full px-3 py-1.5 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Video Preview If Present */}
                {lessons[editingLessonIndex].lesson_type === 'video' && lessons[editingLessonIndex].video_url && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-navy-200 aspect-video max-w-sm mx-auto">
                    <iframe
                      src={lessons[editingLessonIndex].video_url}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Normal Text Content */}
                {lessons[editingLessonIndex].lesson_type !== 'quiz' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy-700">Lesson Material Content</label>
                    <RichTextEditor
                      value={lessons[editingLessonIndex].content || ''}
                      onChange={val => {
                        const updated = [...lessons];
                        updated[editingLessonIndex].content = val;
                        setLessons(updated);
                      }}
                      placeholder="Write the educational materials using the WYSIWYG editor..."
                    />
                  </div>
                )}

                {/* Timed Quiz Editor Block */}
                {lessons[editingLessonIndex].lesson_type === 'quiz' && (
                  <div className="space-y-5 border-t border-navy-100 pt-4">
                    <div className="bg-navy-50/40 p-4 rounded-xl border border-navy-100 space-y-4">
                      <h4 className="font-bold text-navy-800 text-sm flex items-center gap-1">
                        <HelpCircle className="w-4 h-4 text-gold-400" /> Quiz Configuration
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xxs font-bold text-navy-500">Passing Score (%)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={lessons[editingLessonIndex].quizzes?.[0]?.passing_score || 70}
                            onChange={e => updateQuizMeta(editingLessonIndex, 'passing_score', Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg border border-navy-200 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xxs font-bold text-navy-500">Time Limit (Minutes)</label>
                          <input
                            type="number"
                            placeholder="Unlimited"
                            value={lessons[editingLessonIndex].quizzes?.[0]?.time_limit_minutes || ''}
                            onChange={e => updateQuizMeta(editingLessonIndex, 'time_limit_minutes', e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-3 py-1.5 rounded-lg border border-navy-200 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xxs font-bold text-navy-500">Max Retakes</label>
                          <input
                            type="number"
                            placeholder="Unlimited"
                            value={lessons[editingLessonIndex].quizzes?.[0]?.max_retakes || ''}
                            onChange={e => updateQuizMeta(editingLessonIndex, 'max_retakes', e.target.value ? Number(e.target.value) : null)}
                            className="w-full px-3 py-1.5 rounded-lg border border-navy-200 bg-white text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-400/40 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-navy-800 text-xs">Questions</h4>
                        <Button size="sm" variant="outline" onClick={() => addQuizQuestion(editingLessonIndex)}>
                          <Plus className="w-3.5 h-3.5 mr-0.5" /> Add Question
                        </Button>
                      </div>

                      {(!lessons[editingLessonIndex].quizzes?.[0]?.questions || lessons[editingLessonIndex].quizzes[0].questions.length === 0) ? (
                        <p className="text-xs text-navy-400 text-center py-4 border border-dashed border-navy-200 rounded-lg">
                          No questions added yet. Click Add Question above.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {lessons[editingLessonIndex].quizzes[0].questions.map((q: any, qIdx: number) => (
                            <Card key={qIdx} className="p-4 border border-navy-100 bg-white relative space-y-3">
                              <button 
                                onClick={() => removeQuizQuestion(editingLessonIndex, qIdx)}
                                className="absolute top-3 right-3 text-red-400 hover:text-red-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2 space-y-1">
                                  <label className="text-xxs font-bold text-navy-400">Question {qIdx + 1}</label>
                                  <input
                                    type="text"
                                    value={q.question}
                                    onChange={e => {
                                      const updated = [...lessons];
                                      updated[editingLessonIndex].quizzes[0].questions[qIdx].question = e.target.value;
                                      setLessons(updated);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-navy-200 text-xs"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xxs font-bold text-navy-400">Type</label>
                                  <select
                                    value={q.type || 'multiple_choice'}
                                    onChange={e => {
                                      const updated = [...lessons];
                                      updated[editingLessonIndex].quizzes[0].questions[qIdx].type = e.target.value;
                                      if (e.target.value === 'short_answer') {
                                        updated[editingLessonIndex].quizzes[0].questions[qIdx].correct_short_answer = '';
                                      } else {
                                        updated[editingLessonIndex].quizzes[0].questions[qIdx].options = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
                                        updated[editingLessonIndex].quizzes[0].questions[qIdx].correct_index = 0;
                                      }
                                      setLessons(updated);
                                    }}
                                    className="w-full px-2 py-1.5 rounded-lg border border-navy-200 text-xs cursor-pointer"
                                  >
                                    <option value="multiple_choice">Multiple Choice</option>
                                    <option value="short_answer">Short Answer</option>
                                  </select>
                                </div>
                              </div>

                              {q.type === 'short_answer' ? (
                                <div className="space-y-1.5">
                                  <label className="text-xxs font-bold text-navy-400">Correct Short Answer</label>
                                  <input
                                    type="text"
                                    placeholder="Enter correct text answer..."
                                    value={q.correct_short_answer || ''}
                                    onChange={e => {
                                      const updated = [...lessons];
                                      updated[editingLessonIndex].quizzes[0].questions[qIdx].correct_short_answer = e.target.value;
                                      setLessons(updated);
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-navy-200 text-xs"
                                  />
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <label className="text-xxs font-bold text-navy-400">Options & Correct Answer Check</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(q.options || ['A', 'B', 'C', 'D']).map((opt: string, optIdx: number) => (
                                      <div key={optIdx} className="flex items-center gap-2 border border-navy-50 rounded-lg p-2 bg-navy-50/20">
                                        <input
                                          type="radio"
                                          name={`correct-${qIdx}`}
                                          checked={q.correct_index === optIdx}
                                          onChange={() => {
                                            const updated = [...lessons];
                                            updated[editingLessonIndex].quizzes[0].questions[qIdx].correct_index = optIdx;
                                            setLessons(updated);
                                          }}
                                          className="cursor-pointer text-gold-400 focus:ring-gold-400"
                                        />
                                        <input
                                          type="text"
                                          value={opt}
                                          onChange={e => {
                                            const updated = [...lessons];
                                            const newOpts = [...q.options];
                                            newOpts[optIdx] = e.target.value;
                                            updated[editingLessonIndex].quizzes[0].questions[qIdx].options = newOpts;
                                            setLessons(updated);
                                          }}
                                          className="bg-transparent border-0 border-b border-dashed border-navy-200 focus:border-navy-400 outline-none text-xs w-full"
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-20 border border-dashed border-navy-200 rounded-2xl bg-white/40">
                <BookOpen className="w-12 h-12 text-navy-300 mb-2" />
                <h4 className="font-bold text-navy-800 text-base">Curriculum Editor Workspace</h4>
                <p className="text-xs text-navy-400 max-w-xs mt-1">Select a lesson from the course outline to configure parameters, quizzes, text materials, or video content.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'submissions' && (
        <Card className="p-5 sm:p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-navy-50 pb-2">
            <h2 className="font-bold text-navy-800 text-sm">Assignment Submissions</h2>
            <Badge variant="default">{submissions.length} submission{submissions.length !== 1 ? 's' : ''}</Badge>
          </div>

          {loadingSubmissions ? (
            <div className="flex items-center justify-center py-10">
              <Spinner size="md" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="text-xs text-navy-400 text-center py-10">No assignment submissions recorded for this course.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-navy-800">
                <thead>
                  <tr className="border-b border-navy-100 bg-navy-50/50 text-xxs font-bold text-navy-500 uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Lesson</th>
                    <th className="px-4 py-3 text-left">Content / Files</th>
                    <th className="px-4 py-3 text-left">Submitted Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {submissions.map((sub) => {
                    const submissionLesson = lessons.find(l => l.id === sub.lesson_id) || { title: 'Assignment' };
                    return (
                      <tr key={sub.id} className="hover:bg-navy-50/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-navy-800">{sub.user?.full_name || 'Student'}</div>
                          <div className="text-xxs text-navy-400">{sub.user?.rank || 'Rating'}</div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-navy-700">{submissionLesson.title}</td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-xs line-clamp-2 text-navy-600 leading-relaxed mb-1">{sub.text_content}</p>
                          {sub.file_url && (
                            <a 
                              href={sub.file_url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-xxs text-gold-600 font-bold hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> View Submitted File
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-navy-400">
                          {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          {sub.status === 'graded' ? (
                            <Badge variant="gold">Graded: {sub.score}/100</Badge>
                          ) : (
                            <Badge variant="default">Pending Grade</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {gradingSubmissionId === sub.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={gradeScore}
                                onChange={e => setGradeScore(Number(e.target.value))}
                                className="w-14 px-2 py-1 border border-navy-200 rounded text-xs text-center"
                              />
                              <Button size="sm" onClick={() => handleGradeSubmission(sub.enrollment_id, sub.id)}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setGradingSubmissionId(null)}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => { setGradingSubmissionId(sub.id); setGradeScore(sub.score || 85); }}>
                              <Edit3 className="w-3 h-3 mr-0.5" /> Grade
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
