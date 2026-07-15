"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import { Card, Button, Avatar, Spinner, EmptyState, Badge } from '@/components/ui';
import { MessageSquare, Lock, Search, ChevronRight, MessageCircle } from 'lucide-react';
import type { Relationship, Message } from '@/lib/types';
import { motion } from 'framer-motion';

export default function MessagesDirectory() {
  const { profile } = useAuth();
  const router = useRouter();

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<number, Message | null>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLastMessages = async (rels: Relationship[]) => {
    const promises = rels.map(async (rel) => {
      try {
        const msgs = await api.messages.list(rel.id);
        return { relId: rel.id, lastMsg: msgs[msgs.length - 1] || null };
      } catch (e) {
        return { relId: rel.id, lastMsg: null };
      }
    });
    const results = await Promise.all(promises);
    const map: Record<number, Message | null> = {};
    results.forEach(r => {
      map[r.relId] = r.lastMsg;
    });
    setLastMessages(map);
  };

  const loadRelationships = useCallback(async () => {
    try {
      const rels = await api.relationships.list();
      setRelationships(rels);
      await loadLastMessages(rels);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRelationships();
  }, [loadRelationships]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Spinner size="lg" />
      </div>
    );
  }

  // Filter conversations based on name of the other participant
  const filteredRels = relationships.filter(rel => {
    const other = profile?.role === 'mentee' ? rel.mentor : rel.mentee;
    if (!other) return false;
    return other.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           other.rank.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header section with security notice */}
      <div className="flex items-center justify-between pb-4 border-b border-navy-100/60">
        <div>
          <h1 className="text-2xl font-bold text-navy-800 tracking-tight flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-navy-600" />
            Messages
          </h1>
          <p className="text-xs text-navy-400 mt-1">Connect securely with your mentorship team</p>
        </div>
        <Badge variant="default" className="bg-navy-50 text-navy-700 border border-navy-200/50">
          <Lock className="w-3.5 h-3.5 mr-1 text-navy-600" /> Encrypted
        </Badge>
      </div>

      {relationships.length === 0 ? (
        <Card className="p-8 border border-navy-100 bg-white">
          <EmptyState
            icon={<MessageSquare className="w-12 h-12 text-navy-300" />}
            title="No conversations yet"
            description="Once you establish a mentorship connection, you can start exchanging secure messages. Explore available mentors or check pending requests."
            action={
              profile?.role === 'mentee' ? (
                <Button onClick={() => router.push('/dashboard/mentors')}>Find a Mentor</Button>
              ) : (
                <Button onClick={() => router.push('/dashboard/requests')}>View Requests</Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="text"
              placeholder="Search conversations by name or rank..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-navy-200 bg-white text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-navy-400 transition-all text-sm"
            />
          </div>

          {/* Conversations list container */}
          <div className="space-y-2">
            {filteredRels.length === 0 ? (
              <div className="text-center py-12 text-sm text-navy-400 bg-navy-50/20 border border-dashed border-navy-100 rounded-lg">
                No conversations match "{searchTerm}"
              </div>
            ) : (
              filteredRels.map(rel => {
                const other = profile?.role === 'mentee' ? rel.mentor : rel.mentee;
                if (!other) return null;
                
                const lastMsg = lastMessages[rel.id];
                const hasLastMsg = lastMsg !== undefined && lastMsg !== null;
                const isOwnLastMsg = hasLastMsg && lastMsg.sender_id === profile?.id;

                return (
                  <motion.div
                    key={rel.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => router.push(`/dashboard/messages/${rel.id}`)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-navy-100/80 bg-white text-left transition-all hover:border-navy-300 hover:shadow-card hover:bg-navy-50/20 active:scale-[0.99]"
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <Avatar name={other.full_name} src={other.avatar_url} size="md" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                      </div>

                      {/* Conversation details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <p className="text-sm font-semibold text-navy-900 truncate">
                            {other.full_name}
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            {hasLastMsg && (
                              <span className="text-[10px] text-navy-400">
                                {formatTime(lastMsg.created_at)}
                              </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-navy-300" />
                          </div>
                        </div>

                        {/* Rank and last message preview */}
                        <p className="text-xs text-navy-400 font-medium truncate mb-1">
                          {other.rank} • {other.specialization}
                        </p>

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-navy-500 truncate flex-1 pr-4">
                            {hasLastMsg ? (
                              <>
                                <span className="font-semibold text-navy-600 mr-1">
                                  {isOwnLastMsg ? 'You:' : `${(other.full_name || 'User').split(' ')[0]}:`}
                                </span>
                                {lastMsg.content}
                              </>
                            ) : (
                              <span className="italic text-navy-400">No messages yet. Click to start chatting.</span>
                            )}
                          </p>

                          {rel.status === 'ended' && (
                            <Badge variant="default" className="text-[9px] bg-navy-100 text-navy-600 px-1.5 py-0.5 rounded font-normal shrink-0">
                              Ended
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

