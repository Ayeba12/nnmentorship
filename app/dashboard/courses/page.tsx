"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, Button, Badge, Spinner, EmptyState, ProgressBar } from '@/components/ui';
import type { Course } from '@/lib/types-phase2';
import { BookOpen, Clock, Play, ChevronRight, GraduationCap, Filter } from 'lucide-react';

const categories = ['Leadership', 'Technical Specializations', 'Career Development', 'Mentorship Skills', 'Naval Doctrine'];

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.courses.myCourses();
      // Ensure we fetch all courses to list available ones
      const all = await api.courses.list();
      setCourses(all || []);
      setEnrollments(data.enrollments || {});
    } catch (e) {
      console.error(e);
      try {
        const all = await api.courses.list();
        setCourses(all || []);
      } catch (err) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = category === 'all' ? courses : courses.filter(c => c.category === category);
  const enrolledCourses = courses.filter(c => enrollments[c.id]);
  const availableCourses = filtered.filter(c => !enrollments[c.id]);

  const CategoryPill = ({ label, value }: { label: string; value: string }) => (
    <button
      onClick={() => { setCategory(value); setShowFilters(false); }}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex-shrink-0 transition-all ${
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
          <h1 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight">Courses</h1>
          <p className="text-sm text-navy-400 mt-0.5">Self-paced learning for professional development</p>
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

      {/* Category Filter */}
      <div className="hidden lg:flex gap-2 overflow-x-auto pb-1">
        <CategoryPill label="All Courses" value="all" />
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
            Showing: <span className="font-medium text-navy-600">{category === 'all' ? 'All Courses' : category}</span>
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border border-navy-100 p-4 space-y-3">
              <div className="skeleton h-10 w-10 rounded-lg" />
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-2 w-full rounded-full" />
              <div className="skeleton h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* My Enrolled Courses */}
          {enrolledCourses.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-bold text-navy-800 flex items-center gap-2 text-base sm:text-lg">
                <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-navy-400" />
                My Courses
                <Badge variant="info">{enrolledCourses.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {enrolledCourses.map((c, i) => {
                  const enr = enrollments[c.id];
                  if (!enr) return null;
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <Card hover className="p-4 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-navy-600" />
                          </div>
                          <Badge variant={enr.status === 'completed' ? 'success' : 'info'} dot>
                            {enr.status === 'completed' ? 'Completed' : 'In Progress'}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-navy-800 text-sm mb-1 line-clamp-2">{c.title}</h3>
                        <p className="text-xs text-navy-400 mb-3 line-clamp-2 flex-1">{c.description}</p>
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-navy-400 mb-1.5">
                            <span>Progress</span>
                            <span className="font-medium text-navy-600">{enr.progress}%</span>
                          </div>
                          <ProgressBar value={enr.progress} color={enr.status === 'completed' ? 'green' : 'gold'} />
                        </div>
                        <Link href={`/dashboard/courses/${c.id}`} className="w-full">
                          <Button size="sm" variant={enr.status === 'completed' ? 'outline' : 'primary'} className="w-full">
                            {enr.status === 'completed' ? 'Review Course' : 'Continue'}
                          </Button>
                        </Link>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Courses */}
          <div className="space-y-3">
            <h2 className="font-bold text-navy-800 flex items-center gap-2 text-base sm:text-lg">
              Available Courses
              <Badge variant="default">{availableCourses.length}</Badge>
            </h2>
            {availableCourses.length === 0 ? (
              <Card className="p-6">
                <EmptyState icon={<BookOpen className="w-10 h-10" />} title="No courses available" description="Try a different category or check back later for new courses." />
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {availableCourses.map((c, i) => (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                  >
                    <Card hover className="p-4 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-5 h-5 text-gold-600" />
                        </div>
                        <Badge variant="default">{c.difficulty}</Badge>
                      </div>
                      <h3 className="font-semibold text-navy-800 text-sm mb-1 line-clamp-2">{c.title}</h3>
                      <p className="text-xs text-navy-400 mb-3 line-clamp-2 flex-1">{c.description}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-navy-400 mb-3">
                        <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {c.lessons?.length || 0} lessons</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.category}</span>
                      </div>
                      <Link href={`/dashboard/courses/${c.id}`} className="w-full">
                        <Button size="sm" variant="outline" className="w-full">
                          View Course <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
