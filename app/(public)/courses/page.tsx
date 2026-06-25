"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { MockDatabase, type Course } from "@/domain/MockDatabase";
import {
  BookOpen,
  User,
  Clock,
  CheckCircle2,
  Search,
  Grid,
  List,
  Anchor,
  Settings,
  Shield,
  Package,
  Compass,
  ChevronRight,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

/* ─── Category helpers ─── */
type Category = "ALL" | "Navigation" | "Engineering" | "Combat" | "Logistics" | "Leadership" | "Hydrography" | "SAR";

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "ALL", label: "All Courses", icon: <BookOpen style={{ width: 14, height: 14 }} /> },
  { value: "Navigation", label: "Navigation", icon: <Compass style={{ width: 14, height: 14 }} /> },
  { value: "Engineering", label: "Engineering", icon: <Settings style={{ width: 14, height: 14 }} /> },
  { value: "Combat", label: "Combat Systems", icon: <Shield style={{ width: 14, height: 14 }} /> },
  { value: "Logistics", label: "Logistics", icon: <Package style={{ width: 14, height: 14 }} /> },
  { value: "Leadership", label: "Leadership", icon: <Anchor style={{ width: 14, height: 14 }} /> },
  { value: "Hydrography", label: "Hydrography", icon: <Compass style={{ width: 14, height: 14 }} /> },
  { value: "SAR", label: "Search & Rescue", icon: <Shield style={{ width: 14, height: 14 }} /> },
];

function categorize(course: Course): Category {
  const t = course.title.toLowerCase();
  if (t.includes("watch") || t.includes("seamanship") || t.includes("navigation") || t.includes("maritime boundary") || t.includes("eez")) return "Navigation";
  if (t.includes("diesel") || t.includes("propulsion") || t.includes("engineering") || t.includes("auxiliary")) return "Engineering";
  if (t.includes("combat") || t.includes("electronic warfare") || t.includes("weapon") || t.includes("alignment")) return "Combat";
  if (t.includes("logistics") || t.includes("supply") || t.includes("sustainment")) return "Logistics";
  if (t.includes("command") || t.includes("leadership") || t.includes("administrative") || t.includes("doctrine")) return "Leadership";
  if (t.includes("hydrographic") || t.includes("surveying") || t.includes("charting")) return "Hydrography";
  if (t.includes("search and rescue") || t.includes("sar")) return "SAR";
  return "Navigation"; // fallback
}

const BG_COLORS = ["bg-soft-yellow", "bg-lilac", "bg-pink", "bg-green"];
const ICON_COLORS = [
  "var(--brand-yellow)",
  "#7e9bce",
  "#c7a0b8",
  "#8ab5a8)",
];

export default function CoursesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollingCourse, setEnrollingCourse] = useState<string | null>(null);
  const [successEnroll, setSuccessEnroll] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category>("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"DEFAULT" | "TITLE" | "MODULES">("DEFAULT");



  useEffect(() => {
    try {
      MockDatabase.initialize();
      const approved = MockDatabase.getCourses().filter((c) => c.status === "APPROVED");
      setCourses(approved);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleEnroll = (course: Course) => {
    if (!user) {
      router.push(`/login?redirect=/courses`);
      return;
    }
    setEnrollingCourse(course.id);
    setTimeout(() => {
      setEnrollingCourse(null);
      setSuccessEnroll(course.title);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    }, 1200);
  };

  const filteredCourses = useMemo(() => {
    const list = courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.instructorName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === "ALL" ? true : categorize(c) === categoryFilter;

      return matchesSearch && matchesCategory;
    });

    if (sortBy === "TITLE") {
      return [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "MODULES") {
      return [...list].sort((a, b) => b.lessons.length - a.lessons.length);
    }
    return list;
  }, [courses, searchTerm, categoryFilter, sortBy]);

  return (
    <div className="main-wrapper">
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Digital Depot</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view" style={{ maxWidth: "60rem" }}>
              Available Training Courses
            </h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "48rem", fontSize: "1.125rem" }}>
              Access official training manuals, watchkeeping guidelines, and tactical courses. Note: enrollment requires active duty command clearance and account authentication.
            </p>
          </div>
        </div>
      </section>

      {/* Success Modal */}
      {successEnroll && (
        <div style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "white",
            borderRadius: "1rem",
            padding: "2.5rem",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)"
          }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "var(--brand-green)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
              color: "var(--brand-gray-800)"
            }}>
              <CheckCircle2 style={{ width: 28, height: 28 }} />
            </div>
            <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Enrollment Successful</h3>
            <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
              You have been enrolled in <strong>{successEnroll}</strong>. Redirecting to your command dashboard...
            </p>
          </div>
        </div>
      )}

      {/* Search, Filters & Courses Content */}
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
                    placeholder="Search courses by title, instructor, or keyword..."
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
                      boxSizing: "border-box",
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
                      <option value="MODULES">Modules count (High to Low)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Row 2: Category Tabs inline with Grid/List Toggle */}
              <div className="filter-toggle-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "1rem", width: "100%" }}>
                {/* Category Filter Tabs */}
                <div className="tab_nav" style={{ justifyContent: "flex-start", margin: 0, borderBottom: "none", padding: 0, flex: 1, minWidth: 0 }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => setCategoryFilter(cat.value)}
                      className={`tab_button${categoryFilter === cat.value ? " is-active" : ""}`}
                      style={{ border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.5rem", flexWrap: "nowrap" }}
                    >
                      {cat.icon}
                      <div className="tab_text">{cat.label}</div>
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
                  flexShrink: 0,
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
                      transition: "all 0.2s",
                      fontFamily: "inherit",
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
                      transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                    aria-label="List view"
                  >
                    <List style={{ width: 16, height: 16 }} />
                    List
                  </button>
                </div>
              </div>

              {/* Results count */}
              <div className="text-color-tertiary" style={{ fontSize: "0.875rem" }}>
                Showing <strong style={{ color: "var(--brand-black)" }}>{filteredCourses.length}</strong> of{" "}
                <strong style={{ color: "var(--brand-black)" }}>{courses.length}</strong> courses
              </div>
            </div>

            {/* Separator / Divider */}
            <div style={{ borderTop: "1px solid var(--border-primary)" }} />

            {/* Courses Content Grid / List */}
            <div>
              {filteredCourses.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "6rem 2rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "1rem",
                  color: "var(--text-tertiary)"
                }}>
                  <BookOpen style={{ width: 48, height: 48, margin: "0 auto 1rem", opacity: 0.5 }} />
                  <p style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>No courses match your search criteria.</p>
                  <button
                    onClick={() => { setSearchTerm(""); setCategoryFilter("ALL"); }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--brand-yellow)",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontSize: "0.875rem",
                      textDecoration: "underline",
                      fontFamily: "inherit",
                    }}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : viewMode === "GRID" ? (
                /* ─── GRID VIEW ─── */
                <div className="courses-grid" style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
                  gap: "1.5rem",
                }}>
                  {filteredCourses.map((course, idx) => {
                    const bgClass = BG_COLORS[idx % BG_COLORS.length];
                    const cat = categorize(course);
                    return (
                      <div
                        key={course.id}
                        className="course-card"
                        style={{
                          background: "var(--bg-primary)",
                          borderRadius: "0.75rem",
                          border: "1px solid var(--border-primary)",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
                          animation: "cookie-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        }}
                      >
                        {/* Card top – colored header area */}
                        <div className={bgClass} style={{
                          padding: "2rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minHeight: "140px",
                          position: "relative",
                        }}>
                          <BookOpen style={{ width: 48, height: 48, color: "var(--brand-gray-800)", opacity: 0.25 }} />
                          <div className="batch" style={{
                            position: "absolute",
                            top: "0.75rem",
                            left: "0.75rem",
                            background: "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(4px)",
                            borderColor: "transparent",
                            borderRadius: "0.375rem",
                            padding: "0.2rem 0.625rem",
                          }}>
                            <div className="text-sm" style={{ fontWeight: 600, color: "var(--brand-black)", fontSize: "0.6875rem" }}>
                              {cat}
                            </div>
                          </div>
                          <div style={{
                            position: "absolute",
                            top: "0.75rem",
                            right: "0.75rem",
                            background: "rgba(255,255,255,0.85)",
                            backdropFilter: "blur(4px)",
                            borderRadius: "0.375rem",
                            padding: "0.2rem 0.625rem",
                            fontSize: "0.6875rem",
                            fontWeight: 600,
                            color: "var(--brand-gray-600)",
                          }}>
                            {course.lessons.length} Modules
                          </div>
                        </div>

                        {/* Card body */}
                        <div style={{
                          padding: "1.5rem",
                          display: "flex",
                          flexDirection: "column",
                          flex: 1,
                          gap: "0.75rem",
                        }}>
                          <h3 style={{
                            fontFamily: "'Host Grotesk', sans-serif",
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            lineHeight: 1.3,
                            color: "var(--brand-black)",
                            margin: 0,
                          }}>
                            {course.title}
                          </h3>
                          <p className="text-color-tertiary" style={{
                            fontSize: "0.8125rem",
                            lineHeight: 1.55,
                            margin: 0,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {course.description}
                          </p>

                          {/* Meta row */}
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                            fontSize: "0.75rem",
                            color: "var(--brand-gray-500)",
                            marginTop: "auto",
                            paddingTop: "0.5rem",
                            borderTop: "1px solid var(--border-primary)",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <User style={{ width: 13, height: 13 }} />
                              <span>{course.instructorName}</span>
                            </div>
                          </div>

                          {/* Enroll button */}
                          <button
                            onClick={() => handleEnroll(course)}
                            disabled={enrollingCourse === course.id}
                            className="button is-secondary"
                            style={{
                              width: "100%",
                              marginTop: "0.5rem",
                              justifyContent: "center",
                              gap: "0.5rem",
                            }}
                          >
                            {enrollingCourse === course.id ? "Enrolling..." : "Enroll Now"}
                            {enrollingCourse !== course.id && <ChevronRight style={{ width: 16, height: 16 }} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ─── LIST VIEW ─── */
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {filteredCourses.map((course, idx) => {
                    const cat = categorize(course);
                    return (
                      <div
                        key={course.id}
                        className="course-list-card"
                        style={{
                          background: "var(--bg-primary)",
                          borderRadius: "0.75rem",
                          border: "1px solid var(--border-primary)",
                          padding: "1.25rem 2rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "1.5rem",
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
                          animation: "cookie-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        }}
                      >
                        {/* Icon */}
                        <div className={BG_COLORS[idx % BG_COLORS.length]} style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "0.75rem",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <BookOpen style={{ width: 24, height: 24, color: "var(--brand-gray-800)" }} />
                        </div>

                        {/* Title & Description */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 className="course-list-title" style={{
                            fontFamily: "'Host Grotesk', sans-serif",
                            fontSize: "1.0625rem",
                            fontWeight: 700,
                            color: "var(--brand-black)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {course.title}
                          </h3>
                          <p className="text-color-tertiary course-list-desc" style={{
                            fontSize: "0.8125rem",
                            margin: "0.25rem 0 0",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {course.description}
                          </p>
                        </div>

                        {/* Meta row: Category + Instructor + Modules — wraps on mobile */}
                        <div className="course-list-meta-row" style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexShrink: 0 }}>
                          {/* Category Batch */}
                          <div className="batch" style={{
                            background: "var(--brand-gray-100)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "0.375rem",
                            padding: "0.25rem 0.75rem",
                            whiteSpace: "nowrap",
                          }}>
                            <div className="text-sm" style={{ fontWeight: 600, color: "var(--brand-black)", fontSize: "0.75rem" }}>
                              {cat}
                            </div>
                          </div>

                          {/* Instructor */}
                          <div className="text-color-tertiary course-list-meta" style={{
                            fontSize: "0.8125rem",
                            whiteSpace: "nowrap",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <User style={{ width: 14, height: 14 }} />
                              {course.instructorName}
                            </div>
                          </div>

                          {/* Modules count */}
                          <div className="text-color-tertiary" style={{
                            fontSize: "0.8125rem",
                            whiteSpace: "nowrap",
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                              <Clock style={{ width: 14, height: 14 }} />
                              {course.lessons.length} Modules
                            </div>
                          </div>
                        </div>

                        {/* Enroll */}
                        <button
                          onClick={() => handleEnroll(course)}
                          disabled={enrollingCourse === course.id}
                          className="button is-secondary"
                          style={{ flexShrink: 0, padding: "0.625rem 1.25rem", fontSize: "0.8125rem" }}
                        >
                          {enrollingCourse === course.id ? "Enrolling..." : "Enroll"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-card section_joinus" style={{ padding: "4rem 0" }}>
        <div className="padding-global padding-section-bottom">
          <div className="container-large">
            <div className="w-layout-grid grid-col-2">
              <div className="join_left">
                <div>
                  <div className="text_title scroll-into-view">Advance Skills</div>
                  <div className="spacer-medium" />
                  <div className="title-max is-32rem scroll-into-view">
                    <h2 className="heading-style-h2">Ready to advance your tactical credentials?</h2>
                  </div>
                  <div className="spacer-medium" />
                  <div className="text-color-tertiary scroll-into-view">
                    Sign up for an active service account to begin enrolling and download technical watch manuals.
                  </div>
                </div>
                <div className="button-group scroll-into-view">
                  <div className="button_wrap">
                    <Link href="/signup" className="button is-secondary">
                      Sign Up
                    </Link>
                  </div>
                  <div className="button_wrap">
                    <Link href="/contact" className="button is-outline">
                      Contact Us
                    </Link>
                  </div>
                </div>
              </div>
              <div className="join_image scroll-into-img">
                <img
                  src="/assets/battle-navy-ship.png"
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
