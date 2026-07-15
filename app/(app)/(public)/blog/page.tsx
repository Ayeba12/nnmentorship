"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { MockDatabase, type BlogArticle } from "@/domain/MockDatabase";
import { api } from "@/lib/api";
import { BookOpen, Calendar, Search, X, ArrowRight, Clock, SlidersHorizontal, Grid, List, ChevronDown } from "lucide-react";

export default function BlogDirectory() {
  const [posts, setPosts] = useState<BlogArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"DEFAULT" | "TITLE" | "DATE">("DEFAULT");



  useEffect(() => {
    api.blog.list()
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map(b => ({
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
          }));
          setPosts(mapped.filter(p => p.status === 'APPROVED'));
        } else {
          loadFallback();
        }
      })
      .catch(err => {
        console.error("Error loading API blog posts:", err);
        loadFallback();
      });

    function loadFallback() {
      try {
        MockDatabase.initialize();
        const approved = MockDatabase.getBlogArticles().filter((b) => b.status === "APPROVED");
        setPosts(approved.map((b: any) => ({
          ...b,
          coverImage: b.coverImage || b.cover_image || null
        })));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const categories = [
    "ALL",
    "Navigation & Tactics",
    "Career Transition",
    "Marine Engineering",
    "Logistics & Supply",
    "Naval Intelligence",
    "Doctrine & Manuals"
  ];



  const bgColors = ["bg-pink", "bg-soft-yellow", "bg-green", "bg-blue", "bg-lilac"];

  // Search & Filter Logic
  const filteredPosts = useMemo(() => {
    const list = posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" ? true : post.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    if (sortBy === "TITLE") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "DATE") {
      return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [posts, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="main-wrapper">
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Insights & News</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view" style={{ maxWidth: "60rem" }}>
              Latest Insights & Trends
            </h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "48rem", fontSize: "1.125rem" }}>
              Read articles on seamanship, navigation systems, logistics operations, and career transition guidelines written by active commanders and retired flag officers.
            </p>
          </div>
        </div>
      </section>

      {/* Search, Filters & Blog Content */}
      <section className="section-card" style={{ padding: "3rem 0" }}>
        <div className="padding-global">
          <div className="container-large" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Search and Filters Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Row 1: Search Input & Filter Button Inline */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
                  <input
                    type="text"
                    placeholder="Search articles by title, content, author, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "1rem 1.5rem 1rem 3rem",
                      borderRadius: "0.5rem",
                      border: "1px solid var(--border-secondary)",
                      background: "var(--bg-secondary)",
                      fontSize: "1rem",
                      fontFamily: "inherit",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                  <Search style={{
                    position: "absolute",
                    left: "1.25rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "20px",
                    height: "20px",
                    color: "var(--brand-gray-500)"
                  }} />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      style={{
                        position: "absolute",
                        right: "1.25rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: 0,
                        color: "var(--brand-gray-500)",
                        display: "flex",
                        alignItems: "center"
                      }}
                      aria-label="Clear search"
                    >
                      <X style={{ width: 18, height: 18 }} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="button is-outline"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.875rem 1.5rem",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    height: "100%",
                    minHeight: "48px",
                    backgroundColor: showFilters ? "var(--brand-black)" : "transparent",
                    color: showFilters ? "var(--brand-yellow)" : "var(--brand-black)",
                    borderColor: "var(--border-primary)",
                    fontWeight: 600,
                    fontFamily: "inherit"
                  }}
                >
                  <SlidersHorizontal style={{ width: 16, height: 16 }} />
                  <span>Filters</span>
                </button>
              </div>

              {/* Collapsible Filter Panel */}
              {showFilters && (
                <div style={{
                  padding: "1.5rem",
                  borderRadius: "0.5rem",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-secondary)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  animation: "cookie-slide-up 0.2s ease-out"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--brand-black)" }}>Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      style={{
                        padding: "0.75rem",
                        borderRadius: "0.375rem",
                        border: "1px solid var(--border-secondary)",
                        background: "white",
                        outline: "none",
                        fontSize: "0.875rem",
                        fontFamily: "inherit",
                        color: "var(--brand-black)"
                      }}
                    >
                      <option value="DEFAULT">Default Order</option>
                      <option value="TITLE">Title (A-Z)</option>
                      <option value="DATE">Published Date (Newest first)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Row 2: Category Tabs inline with Grid/List Toggle */}
              <div className="filter-toggle-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "1rem", width: "100%" }}>
                {/* Category Filter Tabs */}
                <div className="tab_nav" style={{ justifyContent: "flex-start", margin: 0, borderBottom: "none", padding: 0, flex: 1, minWidth: 0 }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`tab_button${categoryFilter === cat ? " is-active" : ""}`}
                      style={{ border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem", flexWrap: "nowrap" }}
                    >
                      <div className="tab_text">{cat === "ALL" ? "All Categories" : cat}</div>
                    </button>
                  ))}
                </div>

                {/* Grid/List Toggle */}
                <div className="view-toggle-group" style={{
                  display: "flex",
                  background: "var(--brand-gray-100)",
                  borderRadius: "0.5rem",
                  padding: "0.25rem",
                  border: "1px solid var(--border-primary)",
                  width: "fit-content",
                  flexShrink: 0
                }}>
                  <button
                    onClick={() => setViewMode("GRID")}
                    style={{
                      border: "none",
                      background: viewMode === "GRID" ? "var(--brand-black)" : "transparent",
                      color: viewMode === "GRID" ? "var(--brand-yellow)" : "var(--brand-black)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      transition: "all 0.2s"
                    }}
                    aria-label="Grid view"
                  >
                    <Grid style={{ width: 16, height: 16 }} />
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("LIST")}
                    style={{
                      border: "none",
                      background: viewMode === "LIST" ? "var(--brand-black)" : "transparent",
                      color: viewMode === "LIST" ? "var(--brand-yellow)" : "var(--brand-black)",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "0.375rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                      transition: "all 0.2s"
                    }}
                    aria-label="List view"
                  >
                    <List style={{ width: 16, height: 16 }} />
                    List
                  </button>
                </div>
              </div>
            </div>

            {/* Separator / Divider */}
            <div style={{ borderTop: "1px solid var(--border-primary)" }} />

            {/* Blog Cards Grid / List */}
            <div>
              {filteredPosts.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "5rem 2rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "1rem",
                  color: "var(--text-tertiary)"
                }}>
                  <BookOpen style={{ width: 48, height: 48, margin: "0 auto 1rem auto", opacity: 0.5 }} />
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--brand-black)", marginBottom: "0.5rem" }}>
                    No articles found
                  </h3>
                  <p style={{ marginBottom: "1.5rem" }}>
                    We couldn&apos;t find any articles matching your search criteria. Try adjusting your filters or search terms.
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setCategoryFilter("ALL");
                    }}
                    className="button is-secondary"
                    style={{ cursor: "pointer" }}
                  >
                    Reset Filters
                  </button>
                </div>
              ) : viewMode === "GRID" ? (
                /* ─── GRID VIEW ─── */
                <div className="blog_list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: "2rem" }}>
                  {filteredPosts.map((post, idx) => {
                    const bgClass = bgColors[idx % bgColors.length];
                    const wordCount = post.content.split(/\s+/).filter(Boolean).length;
                    const minRead = Math.max(1, Math.ceil(wordCount / 200));

                    return (
                      <div
                        key={post.id}
                        className={`article_card is-scroll ${bgClass}`}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          position: "relative"
                        }}
                      >
                        <div className="article_card_img" style={{ height: "200px", overflow: "hidden", borderRadius: "0.5rem 0.5rem 0 0" }}>
                          {post.coverImage ? (
                            <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <BookOpen style={{ width: 44, height: 44, margin: "auto", color: "var(--brand-gray-800)", opacity: 0.7 }} />
                            </div>
                          )}
                        </div>
                        <div className="spacer-small" />
                        <div className="w-layout-vflex" style={{ flexGrow: 1, padding: "0 1.25rem 1.25rem 1.25rem", display: "flex", flexDirection: "column" }}>
                          <div className="batch" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
                            <div className="text-sm" style={{ fontWeight: 600 }}>{post.category}</div>
                          </div>
                          <div className="spacer-xsmall" />
                          <h3 className="heading-style-h4" style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1.25rem", lineHeight: 1.3 }}>{post.title}</h3>
                          <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                            {post.content.length > 130 ? post.content.substring(0, 130) + "..." : post.content}
                          </p>
                          
                          {/* Read More Link */}
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "0.25rem", 
                            color: "var(--brand-black)", 
                            fontWeight: 700, 
                            fontSize: "0.875rem",
                            marginTop: "auto"
                          }}>
                            <span>Read More</span>
                            <ArrowRight style={{ width: 16, height: 16 }} />
                          </div>
                        </div>

                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "1rem 1.25rem",
                          borderTop: "1px solid rgba(0,0,0,0.06)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: "var(--brand-gray-800)"
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Clock style={{ width: 14, height: 14 }} />
                            <span>{minRead} min read</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <Calendar style={{ width: 14, height: 14 }} />
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <Link href={`/blog/${post.id}`} className="article_card-link w-inline-block" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ─── LIST VIEW ─── */
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {filteredPosts.map((post, idx) => {
                    const bgClass = bgColors[idx % bgColors.length];
                    const wordCount = post.content.split(/\s+/).filter(Boolean).length;
                    const minRead = Math.max(1, Math.ceil(wordCount / 200));

                    return (
                      <div
                        key={post.id}
                        className={`article_card is-scroll ${bgClass}`}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: "1.5rem",
                          padding: "1.25rem",
                          borderRadius: "0.75rem",
                          border: "1px solid var(--border-primary)",
                          position: "relative",
                          minHeight: "120px",
                          flexWrap: "wrap",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
                          animation: "cookie-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        }}
                      >
                        <div className="article_card_img" style={{ width: "80px", height: "80px", overflow: "hidden", borderRadius: "0.5rem", flexShrink: 0 }}>
                          {post.coverImage ? (
                            <img src={post.coverImage} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <BookOpen style={{ width: 28, height: 28, color: "var(--brand-gray-800)", opacity: 0.7 }} />
                            </div>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                            <span className="batch" style={{ background: "rgba(255, 255, 255, 0.7)", padding: "0.1rem 0.5rem", fontSize: "0.6875rem", margin: 0 }}>
                              {post.category}
                            </span>
                            <span style={{ fontSize: "0.75rem", color: "var(--brand-gray-600)", fontWeight: 600 }}>
                              {minRead} min read • {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--brand-black)", margin: 0 }}>
                            {post.title}
                          </h3>
                          <p className="text-color-tertiary" style={{ fontSize: "0.8125rem", margin: 0, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {post.content}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--brand-black)", fontWeight: 700, fontSize: "0.875rem", marginLeft: "auto" }}>
                          <span>Read</span>
                          <ArrowRight style={{ width: 14, height: 14 }} />
                        </div>
                        <Link href={`/blog/${post.id}`} className="article_card-link w-inline-block" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
}
