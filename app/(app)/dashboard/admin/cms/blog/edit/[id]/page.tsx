"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, Button, Spinner } from '@/components/ui';
import { ArrowLeft, Save, Newspaper } from 'lucide-react';
import { api } from '@/lib/api';
import RichTextEditor from '@/components/RichTextEditor';

const categories = ['Career Advice', 'Mentorship Stories', 'Naval History', 'Veteran Transition', 'Announcements'];

// Preloaded high-fidelity naval pictures for instant visual selector
const PRELOADED_IMAGES = [
  { url: '/naval_fleet_operations.png', label: 'Fleet Operations' },
  { url: '/naval_training_drill.png', label: 'Training Drill' },
  { url: '/naval_mentorship_session.png', label: 'Mentorship Session' },
  { url: '/naval_command_ceremony.png', label: 'Command Ceremony' }
];

export default function EditBlogPost() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [loadingPost, setLoadingPost] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const post = await api.blog.get(id);
        if (post) {
          setTitle(post.title);
          setExcerpt(post.excerpt);
          setContent(post.content);
          setCategory(post.category);
          setTags(post.tags || '');
          setCoverImage(post.cover_image || '');
          setStatus(post.status as 'published' | 'draft');
        }
      } catch (err: any) {
        setError('Failed to fetch blog post content');
      } finally {
        setLoadingPost(false);
      }
    };
    if (id) fetchPost();
  }, [id]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(true);
      setError('');
      try {
        const res = await api.upload(file);
        setCoverImage(res.url);
      } catch (err: any) {
        setError(err.message || 'Failed to upload image to object storage');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!title || !content || !excerpt) {
      setError('Please fill in Title, Excerpt and Article Content.');
      return;
    }
    if (uploading) {
      setError('Please wait until the cover image finishes uploading.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.blog.update({
        id,
        title,
        excerpt,
        content,
        category,
        tags,
        cover_image: coverImage || null,
        status
      });
      router.push('/dashboard/admin?tab=cms');
    } catch (err: any) {
      setError(err.message || 'Failed to save blog post');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

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
          <h1 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight">Edit Blog Post</h1>
          <p className="text-sm text-navy-400">Update your article content and publication configurations</p>
        </div>
        <Button onClick={handleSave} disabled={loading} className="shadow-soft w-full sm:w-auto">
          <Save className="w-4 h-4 mr-1.5" /> {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-700">Article Title</label>
              <input
                type="text"
                placeholder="Enter a descriptive title..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm font-semibold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-700">Excerpt / Short Description</label>
              <textarea
                placeholder="A brief summary of the article..."
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                rows={2}
                className="w-full px-3.5 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm leading-relaxed"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-navy-700">Article Content</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your article details here. Format text, add links, insert media, and create tables..."
              />
            </div>
          </Card>
        </div>

        {/* Sidebar settings */}
        <div className="space-y-5">
          <Card className="p-5 space-y-5">
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
              <label className="text-xs font-bold text-navy-500 uppercase tracking-wider">Tags</label>
              <input
                type="text"
                placeholder="e.g. Leadership, Operations"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy-500 uppercase tracking-wider">Publish Status</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'published'
                      ? 'bg-navy-700 border-navy-700 text-white shadow-soft'
                      : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50'
                  }`}
                >
                  Publish Immediately
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`flex-1 py-2 text-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    status === 'draft'
                      ? 'bg-navy-700 border-navy-700 text-white shadow-soft'
                      : 'bg-white border-navy-200 text-navy-600 hover:bg-navy-50'
                  }`}
                >
                  Save Draft
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            <h2 className="font-bold text-navy-800 text-sm border-b border-navy-50 pb-2">Cover Image</h2>

            {uploading ? (
              <div className="w-full h-24 bg-navy-50 border border-dashed border-navy-200 rounded-lg flex flex-col items-center justify-center text-navy-400">
                <div className="w-6 h-6 border-2 border-navy-400 border-t-transparent rounded-full animate-spin mb-1" />
                <p className="text-xxs">Uploading to object storage...</p>
              </div>
            ) : coverImage ? (
              <div className="space-y-2">
                <img src={coverImage} alt="Cover Preview" className="w-full h-32 object-cover rounded-lg" />
                <Button variant="outline" size="sm" onClick={() => setCoverImage('')} className="w-full text-red-500 hover:text-red-600">
                  Remove Image
                </Button>
              </div>
            ) : (
              <div className="w-full h-24 bg-navy-50 border border-dashed border-navy-200 rounded-lg flex flex-col items-center justify-center text-navy-300">
                <Newspaper className="w-8 h-8 text-navy-300 mb-1" />
                <p className="text-xxs">No cover image selected</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block">
                <span className="sr-only">Choose File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-xs text-navy-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-navy-50 file:text-navy-700 file:hover:bg-navy-100 cursor-pointer"
                />
              </label>
            </div>

            <div className="w-full flex items-center gap-1.5 my-2">
              <div className="flex-1 h-px bg-navy-100" />
              <span className="text-xxs text-navy-300 font-semibold uppercase">Or Choose Preloaded</span>
              <div className="flex-1 h-px bg-navy-100" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {PRELOADED_IMAGES.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCoverImage(img.url)}
                  className={`p-1 border rounded-lg hover:border-navy-400 transition-all text-left flex flex-col items-center gap-1 cursor-pointer bg-white ${
                    coverImage === img.url ? 'ring-2 ring-gold-400 border-gold-400' : 'border-navy-100'
                  }`}
                >
                  <div className="w-full h-12 bg-navy-100 rounded overflow-hidden relative">
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xxs text-navy-600 font-medium truncate w-full text-center">{img.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
