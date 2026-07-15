"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { api } from '@/lib/api';
import supabase from '@/lib/supabase';
import { Card, Button, Avatar, Spinner, EmptyState, Badge } from '@/components/ui';
import { Send, Lock, Wifi, WifiOff, ChevronLeft, ShieldAlert } from 'lucide-react';
import type { Relationship, Message } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatRoom() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const relId = id ? Number(id) : null;
  
  const router = useRouter();
  const { profile } = useAuth();

  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    if (!relId) return;
    try {
      const msgs = await api.messages.list(relId);
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (e) {
      console.error(e);
    }
  }, [relId]);

  useEffect(() => {
    const init = async () => {
      if (!relId) return;
      try {
        const rels = await api.relationships.list();
        const found = rels.find(r => r.id === relId);
        if (found) {
          setRelationship(found);
          await loadMessages();
        } else {
          setRelationship(null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [relId, loadMessages]);

  // Set up Realtime listener with state awareness and re-fetch on reconnect
  useEffect(() => {
    if (!relationship) return;

    const channel = supabase
      .channel(`room:${relationship.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `relationship_id=eq.${relationship.id}`
      }, async () => {
        // Fetch decrypted messages upon receiving realtime insert
        await loadMessages();
      })
      .subscribe((status) => {
        setConnectionStatus(status);
        if (status === 'SUBSCRIBED') {
          // Re-fetch messages on connection recovery
          loadMessages();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [relationship, loadMessages]);

  const handleSend = async () => {
    if (!input.trim() || !relationship) return;
    setSending(true);
    try {
      await api.messages.send(relationship.id, input.trim());
      setInput('');
      await loadMessages();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'SUBSCRIBED':
        return (
          <Badge variant="success" dot className="flex items-center gap-1 py-1 text-[10px]">
            <Wifi className="w-3 h-3 text-green-600" /> Live
          </Badge>
        );
      case 'TIMED_OUT':
      case 'CLOSED':
        return (
          <Badge variant="danger" dot className="flex items-center gap-1 animate-pulse py-1 text-[10px]">
            <WifiOff className="w-3 h-3 text-red-600" /> Offline
          </Badge>
        );
      default:
        return (
          <Badge variant="default" dot className="flex items-center gap-1 animate-pulse py-1 text-[10px]">
            Connecting...
          </Badge>
        );
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!relationship) {
    return (
      <Card className="p-8 max-w-md mx-auto">
        <EmptyState
          icon={<ShieldAlert className="w-12 h-12 text-red-500" />}
          title="Conversation Not Found"
          description="This chat room does not exist, or you do not have permission to view it."
          action={
            <Button onClick={() => router.push('/dashboard/messages')}>
              Back to Messages
            </Button>
          }
        />
      </Card>
    );
  }

  const otherUser = profile?.role === 'mentee' ? relationship.mentor : relationship.mentee;
  if (!otherUser) return null;

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] min-h-[500px] bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-soft">
      {/* Dynamic Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-navy-100 bg-navy-50/10">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/messages')}
            className="p-1 px-2 -ml-2 text-navy-600 hover:text-navy-900 active:scale-[0.98]"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            <span className="hidden sm:inline text-xs font-semibold">Inbox</span>
          </Button>

          <Avatar name={otherUser.full_name} src={otherUser.avatar_url} size="sm" />
          
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-navy-900 truncate">{otherUser.full_name}</h2>
            <p className="text-[11px] text-navy-400 truncate">
              {otherUser.rank} • {otherUser.specialization}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {getStatusBadge()}
        </div>
      </div>

      {/* Security Status Ribbon */}
      <div className="bg-navy-800 text-white/90 px-4 py-1.5 text-[10px] font-medium flex items-center justify-center gap-1.5 tracking-wide uppercase">
        <Lock className="w-3 h-3 text-gold-400" />
        SECURE CHANNEL • END-TO-END ENCRYPTED COMMUNICATIONS
      </div>

      {/* Reconnection Banner */}
      {connectionStatus !== 'SUBSCRIBED' && (
        <div className="bg-amber-50 border-b border-amber-100 text-amber-800 text-xs px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Connecting to live chat... Showing local message history.</span>
          </div>
        </div>
      )}

      {/* Scrollable Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-navy-50/20">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center text-navy-400 mb-2">
              <Lock className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-navy-800">Secure Channel Initialized</p>
            <p className="text-xs text-navy-400 max-w-xs mt-1">
              Start the conversation. Send a message to {otherUser.full_name} below.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map(msg => {
              const isOwn = msg.sender_id === profile?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] md:max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                    {/* Message bubble */}
                    <div
                      className={`px-4 py-2.5 shadow-sm ${
                        isOwn
                          ? 'bg-navy-700 text-white rounded-2xl rounded-tr-none'
                          : 'bg-white border border-navy-100 text-navy-900 rounded-2xl rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                        {msg.content}
                      </p>
                    </div>

                    {/* Metadata line */}
                    <p className={`text-[9px] text-navy-400 mt-1 px-1 ${isOwn ? 'text-right' : ''}`}>
                      {!isOwn && <span className="font-semibold text-navy-600 mr-1">{msg.sender?.full_name?.split(' ')[0]}</span>}
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Action Bar */}
      {relationship.status === 'ended' ? (
        <div className="p-4 border-t border-navy-100 bg-navy-50/50 text-center text-sm text-navy-500 font-semibold flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-navy-400" />
          This mentorship relationship has ended. Conversation history is read-only.
        </div>
      ) : (
        <div className="p-3 border-t border-navy-100 flex items-center gap-2 bg-white">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Type a secure message..."
            className="flex-1 px-4 py-2.5 rounded-full border border-navy-200 bg-white text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-navy-400 focus:border-navy-400 transition-all text-sm shadow-inner"
          />
          <Button
            onClick={handleSend}
            loading={sending}
            disabled={!input.trim()}
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
