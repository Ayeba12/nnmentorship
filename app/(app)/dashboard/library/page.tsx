"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, Button, Badge, Spinner, EmptyState, Select, Pagination } from '@/components/ui';
import { useAuth } from '@/components/AuthContext';
import { 
  BookMarked, FileText, Video, Headphones, Download, 
  ExternalLink, Search, Filter, Library as LibIcon, 
  ListChecks, BookmarkPlus 
} from 'lucide-react';
import type { LibraryItem } from '@/lib/types-phase2';

const categories = ['Leadership', 'Naval Doctrine', 'Career Transition', 'Technical Manuals', 'History', 'Mentorship'];
const formats = ['pdf', 'video', 'audio', 'document'];

export default function Library() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: 'all', format: 'all', rank_level: 'all', q: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [tab, setTab] = useState<'library' | 'reading-lists'>('library');
  const [readingLists, setReadingLists] = useState<any[]>([]);
  const { profile } = useAuth();
  const [myLists, setMyLists] = useState<any[]>([]);
  const [activeAddDropdown, setActiveAddDropdown] = useState<number | null>(null);

  const handleAddItemToList = async (listId: number, bookId: number) => {
    try {
      const res = await api.readingLists.addItem(listId, bookId);
      if (res && res.message) {
        alert(res.message);
      } else {
        alert('Successfully added to reading list!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add item to reading list');
    } finally {
      setActiveAddDropdown(null);
    }
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, tab]);

  const load = async () => {
    setLoading(true);
    try {
      if (tab === 'library') {
        const params: Record<string, string> = {};
        if (filters.category !== 'all') params.category = filters.category;
        if (filters.format !== 'all') params.format = filters.format;
        if (filters.rank_level !== 'all') params.rank_level = filters.rank_level;
        if (filters.q) params.q = filters.q;
        setItems(await api.library.list(params));
      } else {
        setReadingLists(await api.readingLists.list());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [tab, filters.category, filters.format, filters.rank_level]);

  useEffect(() => {
    if (profile) {
      api.readingLists.list()
        .then(lists => {
          const editable = lists.filter(l => profile.role === 'admin' || l.curator_id === profile.id);
          setMyLists(editable);
        })
        .catch(err => console.error("Error loading reading lists:", err));
    }
  }, [profile]);

  const handleDownload = async (item: LibraryItem) => {
    try {
      await api.library.download(item.id);
      if (item.file_url) window.open(item.file_url, '_blank');
      else if (item.external_link) window.open(item.external_link, '_blank');
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const formatIcon = (format: string) => {
    if (format === 'video') return <Video className="w-5 h-5" />;
    if (format === 'audio') return <Headphones className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex-shrink-0 cursor-pointer ${
        active ? 'bg-navy-700 text-white shadow-soft' : 'bg-white border border-navy-200 text-navy-600 hover:bg-navy-50'
      }`}
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-navy-800 tracking-tight">Digital Library</h1>
        <p className="text-sm text-navy-400 mt-0.5">Downloadable resources organized by topic and career stage</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <TabButton active={tab === 'library'} onClick={() => setTab('library')} icon={LibIcon} label="Library" />
        <TabButton active={tab === 'reading-lists'} onClick={() => setTab('reading-lists')} icon={ListChecks} label="Reading Lists" />
      </div>

      {tab === 'library' && (
        <>
          {/* Search & Filter toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-300" />
              <input
                type="text"
                placeholder="Search library..."
                value={filters.q}
                onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && load()}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-navy-200 bg-navy-50/50 text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-gold-400/40 focus:border-gold-400 focus:bg-white transition-all text-sm"
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Active filter chips */}
          {(filters.category !== 'all' || filters.format !== 'all' || filters.rank_level !== 'all') && (
            <div className="flex flex-wrap gap-2">
              {filters.category !== 'all' && (
                <button onClick={() => setFilters(f => ({ ...f, category: 'all' }))} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-100 text-navy-600 text-xs font-medium hover:bg-navy-200 transition-colors">
                  {filters.category} <span className="text-navy-400">✕</span>
                </button>
              )}
              {filters.format !== 'all' && (
                <button onClick={() => setFilters(f => ({ ...f, format: 'all' }))} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-100 text-navy-600 text-xs font-medium hover:bg-navy-200 transition-colors">
                  {filters.format.toUpperCase()} <span className="text-navy-400">✕</span>
                </button>
              )}
              {filters.rank_level !== 'all' && (
                <button onClick={() => setFilters(f => ({ ...f, rank_level: 'all' }))} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-navy-100 text-navy-600 text-xs font-medium hover:bg-navy-200 transition-colors">
                  {filters.rank_level} <span className="text-navy-400">✕</span>
                </button>
              )}
            </div>
          )}

          {/* Collapsible Filters */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Select label="Category" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
                  <option value="all">All Categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Select label="Format" value={filters.format} onChange={e => setFilters(f => ({ ...f, format: e.target.value }))}>
                  <option value="all">All Formats</option>
                  {formats.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
                </Select>
                <Select label="Rank Level" value={filters.rank_level} onChange={e => setFilters(f => ({ ...f, rank_level: e.target.value }))}>
                  <option value="all">All Levels</option>
                  <option value="junior">Junior Officers & Ratings</option>
                  <option value="senior">Senior Officers</option>
                  <option value="all_ranks">All Ranks</option>
                </Select>
              </div>
            </Card>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-xl border border-navy-100 p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="skeleton h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-3/4 rounded" />
                      <div className="skeleton h-2 w-1/2 rounded" />
                    </div>
                  </div>
                  <div className="skeleton h-2 w-full rounded" />
                  <div className="skeleton h-8 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card className="p-6">
              <EmptyState icon={<BookMarked className="w-10 h-10" />} title="No items found" description="Try adjusting your filters or search terms." />
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <Card hover className="p-4 flex flex-col h-full">
                      <div className="flex items-start justify-between gap-3 mb-3 relative">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center text-navy-600 flex-shrink-0">
                            {formatIcon(item.format)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-navy-800 text-sm truncate">{item.title}</h3>
                            <p className="text-xs text-navy-400 truncate">{item.author || 'Unknown'}</p>
                          </div>
                        </div>

                        {/* Bookmark / Reading list icon */}
                        <div className="relative shrink-0">
                          <button
                            onClick={() => setActiveAddDropdown(activeAddDropdown === item.id ? null : item.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border border-navy-100 hover:bg-navy-50 text-navy-400 hover:text-navy-600 transition-all cursor-pointer shadow-soft"
                            title="Add to Reading List"
                          >
                            <BookmarkPlus className="w-4 h-4" />
                          </button>

                          {/* Dropdown list of user's reading lists */}
                          {activeAddDropdown === item.id && (
                            <div className="absolute right-0 top-8 z-20 w-52 bg-white rounded-lg border border-navy-100 shadow-md py-1.5 text-left animation-fade-in">
                              <div className="px-2.5 py-1 border-b border-navy-50 text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                                Add to Reading List
                              </div>
                              {myLists.length === 0 ? (
                                <div className="px-3 py-2 text-xxs text-navy-400 italic">
                                  No curated lists available.
                                </div>
                              ) : (
                                <div className="max-h-36 overflow-y-auto">
                                  {myLists.map(list => (
                                    <button
                                      key={list.id}
                                      onClick={() => handleAddItemToList(list.id, item.id)}
                                      className="w-full px-3 py-1.5 text-left text-xs text-navy-700 hover:bg-navy-50 hover:text-gold-700 transition-colors truncate block font-medium"
                                    >
                                      {list.title}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-navy-500 mb-3 line-clamp-2 flex-1">{item.description}</p>
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Badge variant="default">{item.category}</Badge>
                        <Badge variant="info">{(item.format || 'pdf').toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-navy-400 flex items-center gap-1">
                          <Download className="w-3 h-3" /> {item.downloads_count}
                        </span>
                        <Button size="sm" variant="outline" onClick={() => handleDownload(item)}>
                          {item.external_link ? <><ExternalLink className="w-3.5 h-3.5" /> Get</> : <><Download className="w-3.5 h-3.5" /> Download</>}
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(items.length / itemsPerPage)}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </>
      )}

      {tab === 'reading-lists' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="skeleton h-40 w-full rounded-xl" />
              ))}
            </div>
          ) : readingLists.length === 0 ? (
            <Card className="p-6">
              <EmptyState icon={<ListChecks className="w-10 h-10" />} title="No reading lists yet" description="Curated reading lists will appear here." />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {readingLists.map((list, i) => (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  <Card hover className="p-5 cursor-pointer h-full">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gold-50 flex items-center justify-center flex-shrink-0">
                        <ListChecks className="w-5 h-5 text-gold-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-navy-800 text-sm">{list.title}</h3>
                        <div className="mt-1"><Badge variant="default">{list.category}</Badge></div>
                      </div>
                    </div>
                    <p className="text-xs text-navy-500 mb-3 line-clamp-2">{list.description}</p>
                    <p className="text-xs text-navy-400">Curated by {list.curator?.full_name} · {list.curator?.rank}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
