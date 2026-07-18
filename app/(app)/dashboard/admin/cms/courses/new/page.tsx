"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/ui';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';
import { api } from '@/lib/api';

const categories = ['Leadership', 'Operations', 'Seamanship', 'Engineering', 'Logistics'];
const PRELOADED_THUMBNAILS = [
  { url: '/naval_fleet_operations.png', label: 'Fleet Operations' },
  { url: '/naval_training_drill.png', label: 'Training Drill' },
  { url: '/naval_mentorship_session.png', label: 'Mentorship Session' },
  { url: '/naval_command_ceremony.png', label: 'Command Ceremony' }
];

export default function NewCourse() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'pending'>('published');
  const [uploading, setUploading] = useState(false);

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

  const handleSave = async () => {
    if (!title || !description) {
      setError('Please fill in Course Title and Description.');
      return;
    }
    if (uploading) {
      setError('Please wait until the thumbnail image finishes uploading.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Create course with a default introductory lesson
      const newCourse = await api.courses.create({
        title,
        description,
        category,
        difficulty,
        thumbnail_url: thumbnailUrl || null,
        status,
        lessons: [
          {
            title: 'Welcome & Introduction',
            content: 'Welcome to the course. Edit this lesson to write details.',
            video_url: '',
            duration_minutes: 5,
            section_title: 'Section 1: Getting Started',
            lesson_type: 'text',
            quizzes: []
          }
        ]
      });
      if (newCourse && newCourse.id) {
        router.push(`/dashboard/admin/cms/courses/edit/${newCourse.id}`);
      } else {
        router.push('/dashboard/admin?tab=cms');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push('/dashboard/admin?tab=cms')}
          className="flex items-center gap-1.5 text-navy-500 hover:text-navy-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to CMS Manager
        </Button>
      </div>

      {/* Header Info & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-100 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight">Create New Course</h1>
          <p className="text-sm text-navy-400">Design a new course syllabus, modules, and quizzes</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="shadow-soft w-full sm:w-auto">
          <Save className="w-4 h-4 mr-1.5" /> {loading ? 'Creating...' : 'Create Course'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 sm:p-6 space-y-4 bg-white">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-700">Course Title</label>
              <input
                type="text"
                placeholder="e.g. Navigational Principles & Chartwork"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-700">Course Description</label>
              <textarea
                placeholder="Describe what students will learn, target audience, and course layout..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
                className="w-full px-3.5 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm leading-relaxed"
              />
            </div>
          </Card>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-5">
          <Card className="p-5 space-y-5 bg-white">
            <h2 className="font-bold text-navy-800 text-sm border-b border-navy-50 pb-2">Course Attributes</h2>

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
              <label className="text-xs font-bold text-navy-500 uppercase tracking-wider">Default Status</label>
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
            <h2 className="font-bold text-navy-800 text-sm border-b border-navy-50 pb-2">Course Cover</h2>

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
    </div>
  );
}
