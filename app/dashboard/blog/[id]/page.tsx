"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/components/AuthContext';
import { Card, Button, Badge, Spinner, EmptyState, Avatar, Textarea } from '@/components/ui';
import { ChevronLeft, Calendar, Tag, MessageSquare, Send } from 'lucide-react';
import type { BlogPost as BlogPostType } from '@/lib/types-phase2';

export default function BlogPostPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const { profile } = useAuth();
  
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const p = await api.blog.get(Number(id));
      setPost(p);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleComment = async () => {
    if (!comment.trim() || !post) return;
    setPosting(true);
    try {
      await api.comments.add(post.id, comment.trim());
      setComment('');
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  
  if (!post) {
    return (
      <EmptyState
        title="Article not found"
        action={
          <Link href="/dashboard/blog">
            <Button>Back to Blog</Button>
          </Link>
        }
      />
    );
  }

  const tags = post.tags ? post.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => router.push('/dashboard/blog')} className="flex items-center gap-1 text-sm text-navy-500 hover:text-navy-700 transition-colors cursor-pointer">
        <ChevronLeft className="w-4 h-4" /> Back to Blog
      </button>

      <Card className="overflow-hidden">
        {post.cover_image && <img src={post.cover_image} alt={post.title} className="w-full h-56 object-cover" />}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="default">{post.category}</Badge>
            {post.status !== 'published' && <Badge variant="warning">{post.status.replace('_', ' ')}</Badge>}
          </div>
          <h1 className="text-2xl font-semibold text-navy-900 mb-3">{post.title}</h1>
          <div className="flex items-center gap-3 text-sm text-navy-400 mb-4">
            <div className="flex items-center gap-1.5"><Avatar name={post.author?.full_name || 'Author'} src={post.author?.avatar_url} size="sm" /> <span>{post.author?.full_name} · {post.author?.rank}</span></div>
            <span>·</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(post.published_at || post.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="prose prose-sm max-w-none text-navy-700 whitespace-pre-wrap leading-relaxed">{post.content}</div>

          {tags.length > 0 && (
            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-navy-100">
              <Tag className="w-4 h-4 text-navy-400" />
              {tags.map(t => <Badge key={t} variant="default">{t}</Badge>)}
            </div>
          )}
        </div>
      </Card>

      {/* Comments */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-navy-500" />
          <h2 className="font-semibold text-navy-900">Comments ({post.comments?.length || 0})</h2>
        </div>

        {/* Add Comment */}
        <div className="flex gap-3 mb-4">
          <Avatar name={profile?.full_name || 'You'} src={profile?.avatar_url} size="sm" />
          <div className="flex-1">
            <Textarea rows={2} value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment... (will be reviewed before publishing)" />
            <Button size="sm" className="mt-2" onClick={handleComment} loading={posting} disabled={!comment.trim()}><Send className="w-3.5 h-3.5" /> Post Comment</Button>
          </div>
        </div>

        {/* Comment List */}
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-3">
            {post.comments.map(c => (
              <div key={c.id} className="flex gap-3 p-3 bg-navy-50 rounded-lg">
                <Avatar name={c.user?.full_name || 'User'} src={c.user?.avatar_url} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-900">{c.user?.full_name} <span className="text-xs text-navy-400 font-normal">· {c.user?.rank}</span></p>
                  <p className="text-sm text-navy-600 mt-0.5">{c.content}</p>
                  <p className="text-xs text-navy-300 mt-1">{new Date(c.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-navy-400 text-center py-4">No comments yet. Be the first to comment.</p>
        )}
      </Card>
    </div>
  );
}
