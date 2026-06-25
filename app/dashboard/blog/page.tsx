"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, Badge, Button, Spinner, EmptyState, Avatar } from '@/components/ui';
import { Newspaper, Search, Calendar, User, Filter } from 'lucide-react';
import type { BlogPost } from '@/lib/types-phase2';

const categories = ['Career Advice', 'Mentorship Stories', 'Naval History', 'Veteran Transition', 'Announcements'];

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.blog.list(category !== 'all' ? category : undefined);
      setPosts(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [category]);

  const filtered = q
    ? posts.filter(p =>
        p.title.toLowerCase().includes(q.toLowerCase()) ||
        p.excerpt.toLowerCase().includes(q.toLowerCase())
      )
    : posts;
  const featured = filtered[0];
  const rest = filtered.slice(1);

  const CategoryPill = ({ label, value }: { label: string; value: string }) => (
    <button
      onClick={() => { setCategory(value); setShowFilters(false); }}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all cursor-pointer ${
        category === value
          ? 'bg-navy-700 text-white shadow-soft'
          : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50 hover:border-navy-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight">Blog</h1>
          <p className="text-sm text-navy-400 mt-0.5">Career advice, mentorship stories, and naval history</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden flex-shrink-0"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4" /> Filters
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
        <input
          type="text"
          placeholder="Search articles..."
          value={q}
          onChange={e => setQ(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="hidden lg:flex gap-2 overflow-x-auto pb-1">
        <CategoryPill label="All Articles" value="all" />
        {categories.map(c => <CategoryPill key={c} label={c} value={c} />)}
      </div>

      {/* Mobile collapsible filters */}
      {showFilters && (
        <div className="lg:hidden">
          <Card className="p-3">
            <div className="flex flex-wrap gap-2">
              <CategoryPill label="All" value="all" />
              {categories.map(c => <CategoryPill key={c} label={c} value={c} />)}
            </div>
          </Card>
        </div>
      )}

      {/* Active filter indicator on mobile */}
      {!showFilters && (
        <div className="lg:hidden -mt-2">
          <p className="text-xs text-navy-400">
            Showing: <span className="font-medium text-navy-600">{category === 'all' ? 'All Articles' : category}</span>
            {filtered.length > 0 && <span> · {filtered.length} article{filtered.length !== 1 ? 's' : ''}</span>}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="skeleton h-64 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="skeleton h-48 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Newspaper className="w-10 h-10" />}
            title="No articles found"
            description={q ? `No results for "${q}". Try a different search term.` : "Check back later for new content."}
          />
        </Card>
      ) : (
        <>
          {/* Featured Post */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Link href={`/dashboard/blog/${featured.id}`}>
                <Card hover className="overflow-hidden cursor-pointer">
                  {featured.cover_image ? (
                    <img src={featured.cover_image} alt={featured.title} className="w-full h-48 sm:h-56 object-cover" />
                  ) : (
                    <div className="w-full h-32 sm:h-40 bg-navy-100 flex items-center justify-center">
                      <Newspaper className="w-10 h-10 text-navy-300" />
                    </div>
                  )}
                  <div className="p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Badge variant="gold" dot>Featured</Badge>
                      <Badge variant="default">{featured.category}</Badge>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-navy-800 tracking-tight">{featured.title}</h2>
                    <p className="text-sm text-navy-500 mt-2 line-clamp-2 leading-relaxed">{featured.excerpt}</p>
                    <div className="flex items-center gap-3 mt-4 text-xs text-navy-400 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Avatar name={featured.author?.full_name || 'Author'} src={featured.author?.avatar_url} size="sm" />
                        <span className="font-medium text-navy-600">{featured.author?.full_name}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(featured.published_at || featured.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          )}

          {/* Section divider with count */}
          {rest.length > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <h2 className="font-bold text-navy-800 text-base sm:text-lg">More Articles</h2>
              <Badge variant="default">{rest.length}</Badge>
              <div className="flex-1 h-px bg-navy-100" />
            </div>
          )}

          {/* Rest of Posts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rest.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link href={`/dashboard/blog/${post.id}`}>
                  <Card hover className="overflow-hidden h-full cursor-pointer flex flex-col">
                    {post.cover_image ? (
                      <img src={post.cover_image} alt={post.title} className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-24 bg-navy-50 flex items-center justify-center">
                        <Newspaper className="w-8 h-8 text-navy-300" />
                      </div>
                    )}
                    <div className="p-4 flex flex-col flex-1">
                      <Badge variant="default" >{post.category}</Badge>
                      <h3 className="font-semibold text-navy-800 text-sm mt-2 line-clamp-2">{post.title}</h3>
                      <p className="text-xs text-navy-400 mt-1.5 line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-navy-50 text-xs text-navy-400 flex-wrap">
                        <span className="flex items-center gap-1 font-medium text-navy-500">
                          <User className="w-3 h-3" /> {post.author?.full_name}
                        </span>
                        <span className="text-navy-300">·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.published_at || post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
