"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { ZoomIn, Calendar, ImageIcon, Search, SlidersHorizontal, Grid, List, ChevronDown } from "lucide-react";

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"DEFAULT" | "TITLE">("DEFAULT");
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string; category: string; date: string } | null>(null);



  const galleryItems = [
    {
      src: "/assets/gallery/nn_page5.png",
      title: "Fleet Planning & Navigation Operations",
      category: "COMMAND",
      date: "May 2026",
    },
    {
      src: "/assets/gallery/NN_01_1.png",
      title: "Bridge Navigation Training Session",
      category: "TRAINING",
      date: "April 2026",
    },
    {
      src: "/assets/gallery/nn_page6_1.png",
      title: "Engine Propulsion Systems Review",
      category: "ENGINEERING",
      date: "June 2026",
    },
    {
      src: "/assets/gallery/NN_02.png",
      title: "Weapons Guidance System Calibrations",
      category: "TRAINING",
      date: "May 2026",
    },
    {
      src: "/assets/gallery/banner5.png",
      title: "Naval Officer Cadet Leadership Seminar",
      category: "SEMINAR",
      date: "March 2026",
    },
    {
      src: "/assets/gallery/olga_kononenko_unsplash.jpg",
      title: "Maritime Watchstanding & Tactical Operations",
      category: "COMMAND",
      date: "June 2026",
    },
  ];

  const categories = ["ALL", "COMMAND", "TRAINING", "ENGINEERING", "SEMINAR"];



  const bgColors = ["bg-soft-yellow", "bg-lilac", "bg-pink", "bg-green", "bg-blue"];

  const filteredItems = useMemo(() => {
    const list = galleryItems.filter((item) => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = activeCategory === "ALL" ? true : item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });

    if (sortBy === "TITLE") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [galleryItems, searchTerm, activeCategory, sortBy]);

  return (
    <div className="main-wrapper">
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Gallery</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view" style={{ maxWidth: "60rem" }}>
              Moments of Excellence
            </h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "48rem", fontSize: "1.125rem" }}>
              Explore photographs depicting simulation exercises, auxiliary engine checks, command classrooms, and official naval mentorship assemblies.
            </p>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          onClick={() => setLightboxImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(4px)",
            padding: "1.5rem",
            cursor: "pointer"
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "1rem",
              padding: "1.5rem",
              maxWidth: "800px",
              width: "100%",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
            }}
          >
            <div style={{ position: "relative", width: "100%", height: "450px", overflow: "hidden", borderRadius: "0.75rem", background: "var(--bg-secondary)" }}>
              <img 
                src={lightboxImage.src} 
                alt={lightboxImage.title} 
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
              <div>
                <span className="batch" style={{ background: "var(--bg-secondary)" }}>
                  <div className="text-sm">{lightboxImage.category}</div>
                </span>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: "0.5rem" }}>{lightboxImage.title}</h3>
              </div>
              <button 
                onClick={() => setLightboxImage(null)}
                style={{
                  border: "none",
                  background: "var(--brand-gray-800)",
                  color: "white",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Tabs & Grid Content */}
      <section className="section-card" style={{ padding: "3rem 0" }}>
        <div className="padding-global">
          <div className="container-large" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Search and Filters Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Row 1: Search Bar & Filter Button Inline */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
                  <input
                    type="text"
                    placeholder="Search gallery by title or category..."
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
                    </select>
                  </div>
                </div>
              )}

              {/* Row 2: Category Tabs inline with Grid/List Toggle */}
              <div className="filter-toggle-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "1rem", width: "100%" }}>
                {/* Category Tabs */}
                <div className="tab_nav" style={{ justifyContent: "flex-start", margin: 0, borderBottom: "none", padding: 0, flex: 1, minWidth: 0 }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`tab_button${activeCategory === cat ? " is-active" : ""}`}
                      style={{ border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem", flexWrap: "nowrap" }}
                    >
                      <div className="tab_text">{cat === "ALL" ? "All Photos" : cat}</div>
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

            {/* Gallery Grid / List */}
            <div>
              {filteredItems.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "6rem 2rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "1rem",
                  color: "var(--text-tertiary)"
                }}>
                  <ImageIcon style={{ width: 48, height: 48, margin: "0 auto 1rem", opacity: 0.5 }} />
                  <p style={{ fontSize: "1rem" }}>No photos matching your criteria could be found.</p>
                </div>
              ) : viewMode === "GRID" ? (
                /* ─── GRID VIEW ─── */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }}>
                  {filteredItems.map((item, idx) => {
                    return (
                      <div
                        key={idx}
                        onClick={() => setLightboxImage(item)}
                        className="gallery-card"
                      >
                        <div style={{ position: "relative", height: "220px", overflow: "hidden" }}>
                          <img
                            src={item.src}
                            alt={item.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                          <div style={{
                            position: "absolute",
                            top: "1rem",
                            right: "1rem",
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.85)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--brand-gray-800)"
                          }}>
                            <ZoomIn style={{ width: 16, height: 16 }} />
                          </div>
                        </div>
                        
                        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "0.75rem", flexGrow: 1 }}>
                          <div className="batch" style={{ background: "white", width: "fit-content", margin: 0 }}>
                            <div className="text-sm">{item.category}</div>
                          </div>
                          <h3 style={{ fontSize: "1.125rem", fontWeight: 700, margin: 0, color: "var(--brand-black)" }}>{item.title}</h3>
                          
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "auto" }}>
                            <Calendar style={{ width: 12, height: 12 }} />
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ─── LIST VIEW ─── */
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {filteredItems.map((item, idx) => {
                    const bgClass = bgColors[idx % bgColors.length];
                    return (
                      <div
                        key={idx}
                        onClick={() => setLightboxImage(item)}
                        className={`gallery-card ${bgClass}`}
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: "1.5rem",
                          padding: "1.25rem",
                          borderRadius: "0.75rem",
                          border: "1px solid var(--border-primary)",
                          minHeight: "100px",
                          flexWrap: "wrap"
                        }}
                      >
                        <div style={{ width: "80px", height: "80px", overflow: "hidden", borderRadius: "0.5rem", flexShrink: 0 }}>
                          <img
                            src={item.src}
                            alt={item.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        </div>
                        
                        <div style={{ flex: 1, minWidth: "200px", display: "flex", flexDirection: "column", gap: "0.25rem", alignItems: "flex-start" }}>
                          <div className="batch" style={{ background: "rgba(255, 255, 255, 0.7)", margin: 0, padding: "0.1rem 0.5rem" }}>
                            <div className="text-sm" style={{ fontSize: "0.6875rem" }}>{item.category}</div>
                          </div>
                          <h3 style={{ fontSize: "1.0625rem", fontWeight: 700, margin: 0, color: "var(--brand-black)" }}>{item.title}</h3>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                            <Calendar style={{ width: 12, height: 12 }} />
                            <span>{item.date}</span>
                          </div>
                        </div>
                        
                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--brand-black)", fontWeight: 700, fontSize: "0.875rem", marginLeft: "auto" }}>
                          <span>View</span>
                          <ZoomIn style={{ width: 14, height: 14 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* bottom CTA */}
      <section className="section-card section_joinus" style={{ padding: "4rem 0" }}>
        <div className="padding-global padding-section-bottom">
          <div className="container-large">
            <div className="w-layout-grid grid-col-2">
              <div className="join_left">
                <div>
                  <div className="text_title scroll-into-view">Contribute</div>
                  <div className="spacer-medium" />
                  <div className="title-max is-32rem scroll-into-view">
                    <h2 className="heading-style-h2">Have photos to share with us?</h2>
                  </div>
                  <div className="spacer-medium" />
                  <div className="text-color-tertiary scroll-into-view">
                    If you have official training photos or pairing ceremony snapshots, submit them to our admin office.
                  </div>
                </div>
                <div className="button_wrap scroll-into-view">
                  <Link href="/contact" className="button is-secondary">
                    Contact Us
                  </Link>
                </div>
              </div>
              <div className="join_image scroll-into-img">
                <img
                  src="/assets/navy-gallery-cta.png"
                  loading="lazy"
                  alt="CTA"
                  className="img"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
