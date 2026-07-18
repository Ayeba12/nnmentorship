"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, Spinner, EmptyState, Badge } from '@/components/ui';
import { Search, User, BookOpen, Newspaper } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/lib/types';
import type { Course, BlogPost } from '@/lib/types-phase2';

function SearchResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  const [loading, setLoading] = useState(false);
  const [mentors, setMentors] = useState<Profile[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'mentors' | 'courses' | 'blogs'>('all');

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) return;
      setLoading(true);
      try {
        const [mList, cList, bList] = await Promise.all([
          api.profiles.mentors(),
          api.courses.list(),
          api.blog.list()
        ]);

        const q = query.toLowerCase();

        // client-side filter
        const filteredMentors = (mList || []).filter(m => {
          if (!m) return false;
          const fullName = (m.full_name || '').toLowerCase();
          const rank = (m.rank || '').toLowerCase();
          const spec = (m.specialization || '').toLowerCase();
          const cmd = (m.command_location || '').toLowerCase();
          return fullName.includes(q) || rank.includes(q) || spec.includes(q) || cmd.includes(q);
        });

        const filteredCourses = (cList || []).filter(c => {
          if (!c) return false;
          const title = (c.title || '').toLowerCase();
          const desc = (c.description || '').toLowerCase();
          const cat = (c.category || '').toLowerCase();
          const authorName = (c.author?.full_name || '').toLowerCase();
          return title.includes(q) || desc.includes(q) || cat.includes(q) || authorName.includes(q);
        });

        const filteredBlogs = (bList || []).filter(b => {
          if (!b) return false;
          const title = (b.title || '').toLowerCase();
          const excerpt = (b.excerpt || '').toLowerCase();
          const content = (b.content || '').toLowerCase();
          const cat = (b.category || '').toLowerCase();
          const authorName = (b.author?.full_name || '').toLowerCase();
          return title.includes(q) || excerpt.includes(q) || content.includes(q) || cat.includes(q) || authorName.includes(q);
        });

        setMentors(filteredMentors);
        setCourses(filteredCourses);
        setBlogs(filteredBlogs);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const totalResults = mentors.length + courses.length + blogs.length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-navy-400 font-medium">Searching naval archives...</p>
      </div>
    );
  }

  if (!query.trim()) {
    return (
      <EmptyState
        icon={<Search className="w-8 h-8 text-navy-400" />}
        title="Start Searching"
        description="Type your keywords in the search bar above to query naval officers, courses, or guides."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-navy-900 tracking-tight">Search Results</h1>
        <p className="text-xs text-navy-400 mt-1">
          Found {totalResults} result{totalResults !== 1 ? 's' : ''} for <span className="font-semibold text-navy-700">"{query}"</span>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-navy-100 gap-1 overflow-x-auto pb-px scrollbar-none">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'all'
              ? 'border-navy-700 text-navy-800'
              : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          All Results
        </button>
        <button
          onClick={() => setActiveTab('mentors')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'mentors'
              ? 'border-navy-700 text-navy-800'
              : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          Mentors ({mentors.length})
        </button>
        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'courses'
              ? 'border-navy-700 text-navy-800'
              : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          Courses ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('blogs')}
          className={`px-4 py-2 text-xs font-semibold border-b-2 transition-all shrink-0 ${
            activeTab === 'blogs'
              ? 'border-navy-700 text-navy-800'
              : 'border-transparent text-navy-400 hover:text-navy-700'
          }`}
        >
          Articles ({blogs.length})
        </button>
      </div>

      {totalResults === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-navy-400" />}
          title="No Results Found"
          description="We couldn't find any matches. Double-check your spelling or search for broader terms."
        />
      ) : (
        <div className="space-y-8">
          {/* Mentors Section */}
          {(activeTab === 'all' || activeTab === 'mentors') && mentors.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider">Mentors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mentors.map(m => (
                  <Link href={`/dashboard/mentors/${m.id}`} key={m.id}>
                    <Card className="p-4 hover:shadow-soft hover:border-navy-200 transition-all flex items-start gap-3.5 group cursor-pointer bg-white">
                      <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy-600 group-hover:bg-navy-750 group-hover:text-white transition-colors shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h3 className="font-semibold text-navy-900 text-sm truncate">{m.full_name}</h3>
                          <Badge variant="info" className="text-[10px] py-0 px-2 shrink-0">{m.rank}</Badge>
                        </div>
                        <p className="text-xs text-navy-500 mt-1 truncate">{m.specialization || 'General Services'}</p>
                        <p className="text-[10px] text-navy-400 mt-1 truncate">{m.command_location || 'Naval Headquarters'}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Courses Section */}
          {(activeTab === 'all' || activeTab === 'courses') && courses.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider">Courses & Training</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map(c => (
                  <Link href={`/dashboard/courses/${c.id}`} key={c.id}>
                    <Card className="p-4 hover:shadow-soft hover:border-navy-200 transition-all flex items-start gap-3.5 group cursor-pointer bg-white">
                      <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy-600 group-hover:bg-navy-750 group-hover:text-white transition-colors shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h3 className="font-semibold text-navy-900 text-sm truncate">{c.title}</h3>
                          <Badge variant="success" className="text-[10px] py-0 px-2 shrink-0">{c.category}</Badge>
                        </div>
                        <p className="text-xs text-navy-500 mt-1 line-clamp-2">{c.description}</p>
                        <p className="text-[10px] text-navy-400 mt-2">Instructor: <span className="font-medium">{c.author?.full_name || 'Naval Instructor'}</span></p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Blogs Section */}
          {(activeTab === 'all' || activeTab === 'blogs') && blogs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-bold text-navy-400 uppercase tracking-wider">Naval Articles & Insights</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {blogs.map(b => (
                  <Link href={`/dashboard/blog/${b.id}`} key={b.id}>
                    <Card className="p-4 hover:shadow-soft hover:border-navy-200 transition-all flex items-start gap-3.5 group cursor-pointer bg-white">
                      <div className="w-10 h-10 rounded-lg bg-navy-50 flex items-center justify-center text-navy-600 group-hover:bg-navy-750 group-hover:text-white transition-colors shrink-0">
                        <Newspaper className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 justify-between">
                          <h3 className="font-semibold text-navy-900 text-sm truncate">{b.title}</h3>
                          <Badge variant="default" className="text-[10px] py-0 px-2 shrink-0">{b.category}</Badge>
                        </div>
                        <p className="text-xs text-navy-500 mt-1 line-clamp-2">{b.excerpt}</p>
                        <p className="text-[10px] text-navy-400 mt-2">By: <span className="font-medium">{b.author?.full_name || 'Naval Writer'}</span></p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner size="lg" />
        <p className="text-xs text-navy-400 font-medium">Loading search results...</p>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
