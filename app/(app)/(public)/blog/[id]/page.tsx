"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { MockDatabase, type BlogArticle } from "@/domain/MockDatabase";
import { api } from "@/lib/api";
import { Calendar, User, ArrowLeft, BookOpen } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function BlogPostPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [post, setPost] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try API first if it's a numeric ID
    const numericId = parseInt(id);
    if (!isNaN(numericId)) {
      api.blog.get(numericId)
        .then(b => {
          if (b) {
            setPost({
              id: String(b.id),
              title: b.title,
              content: b.content,
              authorId: String(b.author_id),
              authorName: b.author?.full_name || 'Senior Command Mentor',
              category: b.category,
              tags: typeof b.tags === 'string' ? b.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (Array.isArray(b.tags) ? b.tags : []),
              status: ((b.status as any) === 'published' ? 'APPROVED' : (b.status as any) === 'pending' ? 'PENDING' : 'DRAFT') as any,
              createdAt: b.published_at || b.created_at || new Date().toISOString(),
              coverImage: b.cover_image || null
            });
          } else {
            loadFallback();
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Error loading API blog detail:", err);
          loadFallback();
        });
    } else {
      loadFallback();
    }

    function loadFallback() {
      try {
        MockDatabase.initialize();
        const article = MockDatabase.getBlogArticles().find((b) => b.id === id);
        if (article) {
          setPost({
            ...article,
            coverImage: article.coverImage || (article as any).cover_image || null
          });
        }
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", color: "var(--text-tertiary)" }}>
        <p>Loading article details...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ textAlign: "center", padding: "8rem 2rem", color: "var(--text-tertiary)" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--brand-gray-800)", marginBottom: "1rem" }}>Article Not Found</h2>
        <p style={{ marginBottom: "1.5rem" }}>The requested publication does not exist or may have been archived.</p>
        <Link href="/blog" className="button is-secondary">
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="main-wrapper">
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large" style={{ maxWidth: "48rem", marginLeft: "auto", marginRight: "auto" }}>
            
            {/* Back Button */}
            <Link href="/blog" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              color: "var(--text-tertiary)",
              textDecoration: "none",
              marginBottom: "2rem",
              fontWeight: 600
            }}>
              <ArrowLeft style={{ width: 16, height: 16 }} /> Back to News & Insights
            </Link>

            {/* Article Header */}
            <header style={{ borderBottom: "1px solid var(--border-primary)", paddingBottom: "2rem", marginBottom: "3rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.875rem", color: "var(--text-tertiary)", marginBottom: "1rem" }}>
                <div className="batch" style={{ background: "var(--bg-secondary)" }}>
                  <div className="text-sm">{post.category}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Calendar style={{ width: 14, height: 14 }} />
                  <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <h1 style={{ fontSize: "3rem", lineHeight: 1.1, fontWeight: 700, marginBottom: "2rem" }}>
                {post.title}
              </h1>

              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: "var(--brand-gray-300)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "var(--brand-gray-800)"
                }}>
                  {post.authorName.split(" ").pop()?.substring(0, 2).toUpperCase() || "NN"}
                </div>
                <div>
                  <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>By {post.authorName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>Naval Command Contributor</div>
                </div>
              </div>
            </header>

            {/* Cover Image */}
            {post.coverImage && (
              <div style={{ width: "100%", maxHeight: "500px", overflow: "hidden", borderRadius: "0.5rem", marginBottom: "3rem" }}>
                <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "auto", objectFit: "cover" }} />
              </div>
            )}

            {/* Content Body */}
            <article style={{ fontSize: "1.0625rem", lineHeight: 1.8, color: "var(--brand-gray-800)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <p style={{ fontSize: "1.25rem", lineHeight: 1.6, fontStyle: "italic", color: "var(--brand-gray-900)", marginBottom: "1rem" }}>
                &quot;{post.content.split(".")[0]}.&quot;
              </p>
              <p>{post.content}</p>
              <p>
                This publication provides general instructional guidance. Official doctrine manuals and complete interactive syllabi remain secure within the restricted authentication database group.
              </p>
              <p>
                Junior personnel are advised to pair with their assigned mentor via the Command Dashboard to logs watch hours and operational transition checklist steps.
              </p>
            </article>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", borderTop: "1px solid var(--border-primary)", paddingTop: "2rem", marginTop: "3rem" }}>
                {post.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    padding: "0.375rem 0.875rem",
                    background: "var(--bg-secondary)",
                    borderRadius: "0.5rem",
                    color: "var(--text-tertiary)"
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  );
}
