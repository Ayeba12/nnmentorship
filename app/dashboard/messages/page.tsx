"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import supabase from '@/lib/supabase';
import { Card, Button, Avatar, Spinner, EmptyState, Badge } from '@/components/ui';
import { Send, MessageSquare, Lock, Wifi, WifiOff } from 'lucide-react';
import type { Relationship, Message } from '@/lib/types';

export default function Messages() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const relationshipId = searchParams ? searchParams.get('relationshipId') : null;

  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [activeRel, setActiveRel] = useState<Relationship | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadRelationships = useCallback(async () => {
    try {
      const rels = await api.relationships.list();
      setRelationships(rels);
      if (rels.length > 0 && !activeRel) {
        const selected = relationshipId ? rels.find(r => r.id === Number(relationshipId)) : rels[0];
        setActiveRel(selected || rels[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [relationshipId, activeRel]);

  const loadMessages = useCallback(async (relId: number) => {
    try {
      const msgs = await api.messages.list(relId);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadRelationships();
  }, []);

  // Set up Realtime listener with state awareness and re-fetch on reconnect
  useEffect(() => {
    if (!activeRel) return;

    loadMessages(activeRel.id);

    const channel = supabase
      .channel(`room:${activeRel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `relationship_id=eq.${activeRel.id}`
      }, async () => {
        // Fetch decrypted messages upon receiving realtime insert
        await loadMessages(activeRel.id);
      })
      .subscribe((status) => {
        setConnectionStatus(status);
        if (status === 'SUBSCRIBED') {
          // Re-fetch messages on connection recovery
          loadMessages(activeRel.id);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRel, loadMessages]);

  const handleSend = async () => {
    if (!input.trim() || !activeRel) return;
    setSending(true);
    try {
      await api.messages.send(activeRel.id, input.trim());
      setInput('');
      await loadMessages(activeRel.id);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  if (relationships.length === 0) {
    return (
      <Card className="p-6">
        <EmptyState icon={<MessageSquare className="w-10 h-10" />} title="No conversations yet" description="Once you have an active mentorship connection, you can send secure messages here." />
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'SUBSCRIBED':
        return <Badge variant="success" dot className="flex items-center gap-1"><Wifi className="w-3 h-3" /> Live</Badge>;
      case 'TIMED_OUT':
      case 'CLOSED':
        return <Badge variant="danger" dot className="flex items-center gap-1 animate-pulse"><WifiOff className="w-3 h-3" /> Offline</Badge>;
      default:
        return <Badge variant="default" dot className="flex items-center gap-1 animate-pulse">Connecting...</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-navy-900">Messages</h1>
          <Badge variant="default"><Lock className="w-3 h-3 mr-1" /> Encrypted</Badge>
        </div>
        <div>{activeRel && getStatusBadge()}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-auto lg:h-[calc(100vh-200px)] lg:min-h-[500px]">
        {/* Conversation List */}
        <Card className="p-2 overflow-y-auto h-[180px] lg:h-auto">
          {relationships.map(rel => {
            const other = profile?.role === 'mentee' ? rel.mentor : rel.mentee;
            if (!other) return null;
            return (
              <button
                key={rel.id}
                onClick={() => setActiveRel(rel)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left mb-1 ${
                  activeRel?.id === rel.id ? 'bg-navy-100' : 'hover:bg-navy-50'
                }`}
              >
                <Avatar name={other.full_name} src={other.avatar_url} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-medium text-navy-900 truncate">{other.full_name}</p>
                    {rel.status === 'ended' && (
                      <span className="text-[10px] bg-navy-200 text-navy-600 px-1.5 py-0.5 rounded font-normal shrink-0">Ended</span>
                    )}
                  </div>
                  <p className="text-xs text-navy-400 truncate">{other.rank}</p>
                </div>
              </button>
            );
          })}
        </Card>

        {/* Chat Area */}
        <Card className="flex flex-col overflow-hidden h-[450px] lg:h-auto">
          {activeRel ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-navy-100">
                {(() => {
                  const other = profile?.role === 'mentee' ? activeRel.mentor : activeRel.mentee;
                  return other ? (
                    <>
                      <Avatar name={other.full_name} src={other.avatar_url} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{other.full_name}</p>
                        <p className="text-xs text-navy-400">{other.rank} · {other.specialization}</p>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>

              {/* Reconnection Banner */}
              {connectionStatus !== 'SUBSCRIBED' && (
                <div className="bg-amber-50 border-b border-amber-100 text-amber-800 text-xs px-4 py-2 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span>Reconnecting to live chat... Showing local message history.</span>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-navy-50/30">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-sm text-navy-400">Start the conversation — send a message below.</div>
                ) : (
                  messages.map(msg => {
                    const isOwn = msg.sender_id === profile?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] ${isOwn ? 'order-2' : ''}`}>
                          <div className={`px-3.5 py-2.5 rounded-lg ${isOwn ? 'bg-navy-700 text-white rounded-br-sm' : 'bg-white border border-navy-100 text-navy-900 rounded-bl-sm'}`}>
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          </div>
                          <p className={`text-[10px] text-navy-300 mt-1 ${isOwn ? 'text-right' : ''}`}>
                            {msg.sender?.full_name?.split(' ')[0]} · {new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              {activeRel.status === 'ended' ? (
                <div className="p-4 border-t border-navy-100 bg-navy-50/50 text-center text-sm text-navy-400 font-medium">
                  This mentorship relationship has ended. The conversation history is read-only.
                </div>
              ) : (
                <div className="p-3 border-t border-navy-100 flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder="Type a secure message..."
                    className="flex-1 px-3.5 py-2.5 rounded-lg border border-navy-200 bg-white text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400"
                  />
                  <Button onClick={handleSend} loading={sending} disabled={!input.trim()}><Send className="w-4 h-4" /></Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-navy-400">Select a conversation</div>
          )}
        </Card>
      </div>
    </div>
  );
}
