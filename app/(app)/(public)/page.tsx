"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { MockDatabase, type Course } from "@/domain/MockDatabase";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen, Calendar, Video, Headphones, MapPin } from "lucide-react";
import { api } from "@/lib/api";

export default function PublicHome() {
  const [stats, setStats] = useState({
    totalPersonnel: 240,
    activeMatches: 48,
    coursesCount: 18,
    booksCount: 32,
  });

  const [latestCourses, setLatestCourses] = useState<any[]>([]);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [hoveredCardId, setHoveredCardId] = useState<any | null>(null);
  const [isBtnHovered, setIsBtnHovered] = useState(false);

  useEffect(() => {
    api.events.list()
      .then(data => {
        if (Array.isArray(data)) {
          const now = Date.now();
          const upcoming = data.filter(e => {
            const scheduledTime = new Date(e.scheduled_at).getTime();
            const durationMs = (e.duration_minutes || 60) * 60 * 1000;
            return scheduledTime + durationMs >= now;
          });
          upcoming.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
          setUpcomingEvents(upcoming.slice(0, 3));
        }
      })
      .catch(err => console.error("Error fetching homepage events:", err));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setVisibleCount(1);
      } else if (window.innerWidth < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      MockDatabase.initialize();
      const users = MockDatabase.getUsers();
      const pairs = MockDatabase.getPairs();
      const courses = MockDatabase.getCourses();
      const books = MockDatabase.getLibraryBooks();

      setStats({
        totalPersonnel: users.length || 240,
        activeMatches: pairs.filter((p) => p.status === "ACTIVE").length || 48,
        coursesCount: courses.filter((c) => c.status === "APPROVED").length || 18,
        booksCount: books.filter((b) => b.status === "APPROVED").length || 32,
      });
    } catch (e) {
      console.error(e);
    }

    // Dynamic courses
    api.courses.list()
      .then(data => {
        if (Array.isArray(data)) {
          const published = data.filter(c => c.status === 'published');
          const sorted = [...published].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          setLatestCourses(sorted.slice(0, 3));
        }
      })
      .catch(err => console.error("Error fetching homepage courses:", err));

    // Dynamic blogs
    api.blog.list()
      .then(data => {
        if (Array.isArray(data)) {
          const published = data.filter(b => b.status === 'published');
          const sorted = [...published].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
          setLatestBlogs(sorted.slice(0, 2));
        }
      })
      .catch(err => console.error("Error fetching homepage blogs:", err));
  }, []);

  const getVisibleTestimonials = () => {
    const list = [];
    for (let i = 0; i < visibleCount; i++) {
      const index = (activeTestimonial + i) % testimonials.length;
      list.push({ ...testimonials[index], originalIndex: index });
    }
    return list;
  };

  const services = [
    {
      title: "Operational Command & Tactics",
      description: "One-on-one leadership development focusing on watchkeeping excellence, tactical operations command, and fleet readiness under pressure.",
      image: "/assets/cap-strategic-leadership.jpg",
      category: "STRATEGIC LEADERSHIP",
    },
    {
      title: "Command Doctrine Preservation",
      description: "Preserving decades of institutional naval wisdom by pairing retiring flag officers with junior officers to hand off vital custom, command, and tactical doctrines.",
      image: "/assets/cap-doctrine-preservation.jpg",
      category: "DOCTRINE PRESERVATION",
    },
    {
      title: "Technical & Maritime Training",
      description: "Structured mentoring centered on specialized technical competencies including marine propulsion diagnostics, secure communication setups, and maritime safety logs.",
      image: "/assets/cap-technical-excellence.png",
      category: "TECHNICAL EXCELLENCE",
    },
    {
      title: "Rigorous Service Vetting",
      description: "Maintaining absolute trust and security on the platform by verifying the service numbers, rank achievements, and active command history of all mentors.",
      image: "/assets/cap-vetting-credentials.jpg",
      category: "VETTING & CREDENTIALS",
    },
  ];

  const testimonials = [
    {
      quote: "The platform enabled me to match with a sub-lieutenant at the Western Dockyard. Our watchkeeping guidelines directly improved shift safety logs during sea deployment.",
      author: "Captain Kelechi Amadi",
      role: "Marine Engineering • Western Command",
      avatar: "KA",
    },
    {
      quote: "As a retired officer, this has allowed me to publish active watch guidelines. Passing down watchkeeping doctrine ensures our traditions and readiness remain intact.",
      author: "Rear Admiral Joseph Okonkwo (Rtd.)",
      role: "Former Logistics Director • Command HQ",
      avatar: "JO",
    },
    {
      quote: "The mentoring modules allowed me to bridge the gaps in communication protocols, aligning sea logs across naval sectors with absolute consistency.",
      author: "Lieutenant Yusuf Sani",
      role: "Communications Officer • Eastern Command",
      avatar: "YS",
    },
    {
      quote: "Matching with an operations expert from NNS Beecroft helped me master offshore patrol techniques. The structured checklist format is extremely practical for junior officers.",
      author: "Sub-Lieutenant Amina Yusuf",
      role: "Navigation Officer • Central Naval Command",
      avatar: "AY",
    },
    {
      quote: "Managing electronic warfare training requires continuous learning. Through the platform, I was able to consult a retired commander who provided invaluable tactical manuals.",
      author: "Commander Tunde Folayan",
      role: "Operations Director • Naval War College Nigeria",
      avatar: "TF",
    },
  ];

  const successStories = [
    {
      title: "Western Command Watchkeeping Alignment",
      description: "Sub-lieutenants paired with senior captains at the Western Dockyard standardized shift handover checklist workflows, reducing watch transition communication discrepancies by 40%.",
      image: "/assets/fleet-docked-234.jpg",
      link: "/login",
    },
    {
      title: "NNS Beecroft Propulsion Sync",
      description: "Junior engineering ratings worked directly with retired marine engineering commanders to identify auxiliary propulsion faults, creating a troubleshooting guide now used across three fleet sectors.",
      image: "/assets/fleet-at-sea.jpg",
      link: "/login",
    },
    {
      title: "Generational Transfer of Tactical Command",
      description: "Transitioning flag officers documented and hand-delivered strategic sea maneuvering and security protocols, bridging the knowledge gap for incoming commanders at the Naval War College Nigeria.",
      image: "/assets/fleet-frigate-41.jpg",
      link: "/login",
    },
    {
      title: "Signal Security & Encryption Upgrade",
      description: "Junior signal officers and telecommunication mentors successfully updated encrypted radio protocols, ensuring unified communications across tactical maritime watch commands.",
      image: "/assets/fleet-patrol-boat.png",
      link: "/login",
    },
  ];

  const defaultBlogs = [
    {
      id: 1,
      title: "Naval Leadership in Modern Warfare",
      excerpt: "Explore how embedding core leadership doctrines into early-career mentoring prepares officers for high-stress deployments.",
      category: "Insights",
      bgColor: "#ffbdf5",
      cover_image: "/assets/template/68926d2cedeb81b5f977f9cd_blog-1.webp",
    },
    {
      id: 2,
      title: "Engineering Excellence at Sea",
      excerpt: "Senior marine engineers share key diagnostic insights to enhance auxiliary system reliability and dockyard safety protocols.",
      category: "News",
      bgColor: "#fcffa8",
      cover_image: "/assets/template/68926eb0fdab3f7fd48e8fce_blog.png",
    },
  ];

  const blogPosts = (latestBlogs.length > 0 ? latestBlogs : defaultBlogs).map((b, idx) => ({
    title: b.title,
    description: b.excerpt || (b.content ? b.content.replace(/<[^>]*>/g, '').substring(0, 150) : ''),
    category: b.category || 'News',
    bgColor: idx % 2 === 0 ? "#ffbdf5" : "#fcffa8",
    link: `/blog/${b.id}`,
    image: b.cover_image || '/assets/template/68926d2cedeb81b5f977f9cd_blog-1.webp'
  }));

  const defaultCourses = [
    {
      id: 1,
      title: "Bridge Watchkeeping & Navigation",
      description: "Master the art of fleet navigation, watchkeeping, collision avoidance protocols, and radar operations.",
    },
    {
      id: 2,
      title: "Marine Propulsion Auxiliaries",
      description: "A comprehensive deep dive into shipboard engineering systems, machinery diagnostics, and command watchkeeping.",
    },
    {
      id: 3,
      title: "Fleet Logistics & Supply Chain",
      description: "Learn the fundamentals of military supply chain operations, fleet replenishment, and dockyard logistics.",
    }
  ];

  const displayCourses = latestCourses.length > 0 ? latestCourses : defaultCourses;

  const handlePrevTestimonial = () => {
    setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
  };

  const handleNextTestimonial = () => {
    setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="main-wrapper">
      
      {/* ── 1. HERO SECTION ── */}
      <section className="section-card" style={{ padding: "6rem 0 3rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "4rem", alignItems: "start" }} className="hide-mobile-landscape-grid">
              <div>
                <h1 style={{ fontSize: "4.5rem", lineHeight: 1.05, fontWeight: 700, letterSpacing: "-0.03em" }}>
                  Naval Mentorship.<br />Fleet Readiness.
                </h1>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                <p className="text-color-tertiary" style={{ fontSize: "1.125rem", lineHeight: 1.6 }}>
                  Connecting junior officers, ratings, and cadets with veteran naval commanders to preserve institutional knowledge, master tactical sea operations, and ensure command readiness.
                </p>
                <div className="button_wrap">
                  <Link href="/login" className="button">
                    GET STARTED
                  </Link>
                </div>
              </div>
            </div>

            {/* Mobile Fallback for grid */}
            <div className="show-mobile-landscape-flex" style={{ display: "none", flexDirection: "column", gap: "1.5rem", textAlign: "left" }}>
              <h1 style={{ fontSize: "3rem", lineHeight: 1.1 }}>Naval Mentorship. Fleet Readiness.</h1>
              <p className="text-color-tertiary" style={{ fontSize: "1rem" }}>
                Connecting junior officers, ratings, and cadets with veteran naval commanders to preserve institutional knowledge, master tactical sea operations, and ensure command readiness.
              </p>
              <Link href="/login" className="button" style={{ width: "fit-content" }}>
                GET STARTED
              </Link>
            </div>

            {/* Giant Hero Video */}
            <div className="hero-video-container" style={{ position: "relative", marginTop: "4rem", borderRadius: "1rem", overflow: "hidden", border: "1px solid var(--border-primary)", aspectRatio: "16/9" }}>
              {/* Video Overlay */}
              <div 
                style={{ 
                  position: "absolute", 
                  inset: 0, 
                  background: "linear-gradient(to bottom, rgba(15, 23, 42, 0.15), rgba(15, 23, 42, 0.45))", 
                  zIndex: 1, 
                  pointerEvents: "none" 
                }} 
              />
              <video
                autoPlay
                loop
                muted
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }}
              >
                <source src="https://stream.mux.com/2jWFc8eFNHfdqHWAV8vPYLKySCwUOJsUXPqQGS6QrcU/medium.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>

            </div>
          </div>
        </div>
      </section>

      {/* ── 1.5 UPCOMING EVENTS SECTION ── */}
      {upcomingEvents.length > 0 && (
        <section className="section-card" style={{ background: "var(--brand-white)", borderTop: "1px solid var(--border-primary)" }}>
          <div className="padding-global padding-section-small">
            <div className="container-large" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              
              {/* Section Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
                <div>
                  <span className="text_title" style={{ color: "var(--brand-yellow)", fontWeight: 800 }}>
                    Naval Knowledge Exchange
                  </span>
                  <h2 className="heading-style-h3" style={{ color: "var(--brand-black)", marginTop: "0.5rem" }}>
                    Upcoming Mentorship Sessions & Events
                  </h2>
                </div>
                <Link href="/events" className="button is-outline" style={{ display: "inline-flex", gap: "0.5rem" }}>
                  View All Events
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Grid Layout of Events */}
              <div className="grid-col-3" style={{ gap: "2rem" }}>
                {upcomingEvents.map(e => {
                  const isHovered = hoveredCardId === e.id;
                  return (
                    <Link
                      href={`/events/${e.id}`}
                      key={e.id}
                      onMouseEnter={() => setHoveredCardId(e.id)}
                      onMouseLeave={() => setHoveredCardId(null)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        background: "var(--bg-secondary)",
                        border: isHovered ? "1px solid var(--brand-yellow)" : "1px solid var(--border-primary)",
                        borderRadius: "1rem",
                        padding: "2rem",
                        textDecoration: "none",
                        color: "var(--brand-black)",
                        boxShadow: isHovered ? "0 16px 32px rgba(0, 32, 91, 0.06)" : "0 4px 16px rgba(0, 32, 91, 0.01)",
                        transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                        gap: "1.25rem",
                        minHeight: "220px"
                      }}
                    >
                      {/* Event Meta Row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "0.375rem",
                          background: e.event_type === "online" ? "rgba(37, 99, 235, 0.06)" : e.event_type === "offline" ? "rgba(245, 158, 11, 0.06)" : "rgba(16, 185, 129, 0.06)",
                          color: e.event_type === "online" ? "#2563eb" : e.event_type === "offline" ? "#d97706" : "#059669"
                        }}>
                          {e.event_type === "online" && <Video className="w-3.5 h-3.5" />}
                          {e.event_type === "offline" && <MapPin className="w-3.5 h-3.5" />}
                          {e.event_type === "podcast" && <Headphones className="w-3.5 h-3.5" />}
                          {e.event_type}
                        </span>
                        
                        <span style={{ fontSize: "0.8125rem", color: "var(--brand-gray-500)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Calendar className="w-4 h-4" />
                          {new Date(e.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "var(--brand-black)", fontFamily: "'Host Grotesk', sans-serif" }}>
                          {e.title}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--brand-gray-500)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {e.description || "Join this mentorship session to connect with senior officers and gain key tactical navy operational knowledge."}
                        </p>
                      </div>

                      {/* View details CTA at bottom */}
                      <div style={{ 
                        marginTop: "auto", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.25rem", 
                        fontSize: "0.8125rem", 
                        fontWeight: 700, 
                        color: isHovered ? "var(--brand-yellow)" : "var(--brand-black)",
                        transition: "color 0.2s ease"
                      }}>
                        View Event Details
                        <ArrowRight className="w-4 h-4" style={{ transform: isHovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.2s ease" }} />
                      </div>

                    </Link>
                  );
                })}
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── 2. STATS & LOGOS SECTION ── */}
      <section className="section-card" style={{ background: "var(--bg-secondary)" }}>
        <div className="padding-global padding-section-small" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
          <div className="container-large" style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
            
            {/* Centered Large Intro Text */}
            <div style={{ maxWidth: "60rem", margin: "0 auto", textAlign: "center" }}>
              <div className="text_title" style={{ marginBottom: "1.5rem" }}>NAVY MENTORSHIP</div>
              <p className="text-4xl" style={{ fontWeight: 600, color: "var(--brand-gray-800)" }}>
                Decades of combined command experience guiding active duty officers, junior ratings, and cadets.
              </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              <div className="consulting_card" style={{ background: "white" }}>
                <div className="card_title-max">
                  <div className="text-all-caps text-color-tertiary" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>ACTIVE ENROLLED PERSONNEL</div>
                </div>
                <div className="text-4xl">{stats.totalPersonnel}</div>
              </div>
              <div className="consulting_card" style={{ background: "white" }}>
                <div className="card_title-max">
                  <div className="text-all-caps text-color-tertiary" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>ACTIVE MENTORSHIP PAIRS</div>
                </div>
                <div className="text-4xl">{stats.activeMatches}</div>
              </div>
              <div className="consulting_card" style={{ background: "white" }}>
                <div className="card_title-max">
                  <div className="text-all-caps text-color-tertiary" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>APPROVED NAVAL COURSES</div>
                </div>
                <div className="text-4xl">{stats.coursesCount}</div>
              </div>
              <div className="consulting_card" style={{ background: "white" }}>
                <div className="card_title-max">
                  <div className="text-all-caps text-color-tertiary" style={{ fontSize: "0.6875rem", fontWeight: 700 }}>LIBRARY PUBLICATIONS</div>
                </div>
                <div className="text-4xl">{stats.booksCount}</div>
              </div>
            </div>

            {/* Logos / Emblems Row (Auto-Scrolling Marquee) */}
            <div style={{
              overflow: "hidden",
              width: "100%",
              paddingTop: "2rem",
              borderTop: "1px solid var(--border-primary)",
              position: "relative",
              display: "flex",
            }}>
              <div 
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "max-content",
                  animation: "marquee-scroll 30s linear infinite",
                  gap: "3rem",
                  color: "var(--brand-gray-600)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  paddingRight: "3rem", // to match the gap when repeating
                  whiteSpace: "nowrap"
                }}
              >
                {/* First Set of Items */}
                <span style={{ whiteSpace: "nowrap" }}>WESTERN NAVAL COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>EASTERN NAVAL COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>CENTRAL NAVAL COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NAVAL TRAINING COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>LOGISTICS COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NAVAL WAR COLLEGE NIGERIA</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NNS BEECROFT</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NAVAL DOCKYARD ABUJA</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>

                {/* Duplicated Set for Infinite Seamless Scroll */}
                <span style={{ whiteSpace: "nowrap" }}>WESTERN NAVAL COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>EASTERN NAVAL COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>CENTRAL NAVAL COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NAVAL TRAINING COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>LOGISTICS COMMAND</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NAVAL WAR COLLEGE NIGERIA</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NNS BEECROFT</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
                <span style={{ whiteSpace: "nowrap" }}>NAVAL DOCKYARD ABUJA</span>
                <span style={{ color: "var(--brand-yellow)", userSelect: "none" }}>★</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 3. SERVICES SECTION ── */}
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            
            {/* Services Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }} className="hide-mobile-landscape-flex">
              <div>
                <div className="text_title">CAPABILITIES</div>
                <div className="spacer-medium" />
                <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Core Mentorship Capability Areas</h2>
                <div className="spacer-small" />
                <p className="text-color-tertiary" style={{ maxWidth: "44rem", fontSize: "0.9375rem" }}>
                  Structured mentorship focus areas designed to support the training, readiness, and transition requirements of naval personnel.
                </p>
              </div>
              <Link href="/login" className="button">
                GET STARTED
              </Link>
            </div>

            {/* Mobile Services Header */}
            <div className="show-mobile-landscape-flex" style={{ display: "none", flexDirection: "column", gap: "1rem", marginBottom: "3rem" }}>
              <div className="text_title">CAPABILITIES</div>
              <h2 style={{ fontSize: "2.5rem" }}>Core Mentorship Capability Areas</h2>
              <p className="text-color-tertiary" style={{ fontSize: "0.875rem" }}>
                Structured mentorship focus areas designed to support the training, readiness, and transition requirements of naval personnel.
              </p>
              <Link href="/login" className="button" style={{ width: "fit-content" }}>
                GET STARTED
              </Link>
            </div>

            {/* Services Cards Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "3rem" }} className="hide-mobile-portrait-grid">
              {services.map((svc, idx) => (
                <div key={idx} style={{ display: "flex", flexDirection: "column", background: "var(--brand-gray-100)", borderRadius: "1rem", padding: "1.5rem", border: "1px solid var(--border-primary)" }}>
                  <div style={{ height: "300px", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1.5rem" }}>
                    <img src={svc.image} alt={svc.title} className="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="text_title" style={{ fontSize: "0.6875rem", fontWeight: 700, marginBottom: "0.75rem" }}>
                    {svc.category}
                  </div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{svc.title}</h3>
                  <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "2rem", flexGrow: 1 }}>{svc.description}</p>
                  <Link href="/courses" className="button is-outline" style={{ width: "fit-content" }}>
                    LEARN MORE
                  </Link>
                </div>
              ))}
            </div>

            {/* Mobile Fallback for grid */}
            <div className="show-mobile-portrait-flex" style={{ display: "none", flexDirection: "column", gap: "2rem" }}>
              {services.map((svc, idx) => (
                <div key={idx} style={{ background: "var(--brand-gray-100)", borderRadius: "1rem", padding: "1.25rem", border: "1px solid var(--border-primary)" }}>
                  <div style={{ height: "200px", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1rem" }}>
                    <img src={svc.image} alt={svc.title} className="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="text_title" style={{ fontSize: "0.625rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                    {svc.category}
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>{svc.title}</h3>
                  <p className="text-color-tertiary" style={{ fontSize: "0.8125rem", marginBottom: "1.5rem" }}>{svc.description}</p>
                  <Link href="/courses" className="button is-outline" style={{ width: "100%", textAlign: "center" }}>
                    LEARN MORE
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── 3.5 LATEST COURSES SECTION ── */}
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            
            {/* Section Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "3rem" }} className="hide-mobile-landscape-flex">
              <div>
                <div className="text_title">LATEST COURSES</div>
                <div className="spacer-medium" />
                <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>Featured Training Modules</h2>
                <div className="spacer-small" />
                <p className="text-color-tertiary" style={{ maxWidth: "44rem", fontSize: "0.9375rem" }}>
                  Explore the newest instructional modules published by senior command mentors covering bridge watchkeeping, technical propulsion, security tactics, and fleet logistics.
                </p>
              </div>
              <Link href="/courses" className="button">
                VIEW ALL COURSES
              </Link>
            </div>

            {/* Mobile Section Header */}
            <div className="show-mobile-landscape-flex" style={{ display: "none", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
              <div className="text_title">LATEST COURSES</div>
              <h2 style={{ fontSize: "2.5rem" }}>Featured Training Modules</h2>
              <p className="text-color-tertiary" style={{ fontSize: "0.875rem" }}>
                Explore the newest instructional modules published by senior command mentors covering bridge watchkeeping, technical propulsion, security tactics, and fleet logistics.
              </p>
              <Link href="/courses" className="button" style={{ width: "fit-content" }}>
                VIEW ALL COURSES
              </Link>
            </div>

            {/* Courses Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "2rem" }}>
              {displayCourses.map((course, idx) => {
                const bgColors = ["bg-pink", "bg-soft-yellow", "bg-lilac"];
                const bgClass = bgColors[idx % bgColors.length];
                
                // Categorize course
                let category = "Tactics";
                if (course.title.toLowerCase().includes("engineer") || course.title.toLowerCase().includes("propulsion") || course.title.toLowerCase().includes("machinery")) {
                  category = "Marine Engineering";
                } else if (course.title.toLowerCase().includes("logistics") || course.title.toLowerCase().includes("supply") || course.title.toLowerCase().includes("replenishment")) {
                  category = "Logistics & Supply";
                } else if (course.title.toLowerCase().includes("watchkeeping") || course.title.toLowerCase().includes("navigation") || course.title.toLowerCase().includes("seamanship")) {
                  category = "Navigation & Tactics";
                } else if (course.title.toLowerCase().includes("intel") || course.title.toLowerCase().includes("security") || course.title.toLowerCase().includes("communication")) {
                  category = "Naval Intelligence";
                }
                
                return (
                  <div 
                    key={course.id} 
                    className={`article_card is-scroll ${bgClass}`}
                    style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      height: "100%", 
                      position: "relative",
                      borderRadius: "1rem",
                      overflow: "hidden"
                    }}
                  >
                    <div className="article_card_img" style={{ height: "180px", overflow: "hidden", borderRadius: "0.5rem 0.5rem 0 0" }}>
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <BookOpen style={{ width: 44, height: 44, margin: "auto", color: "var(--brand-gray-800)", opacity: 0.7 }} />
                        </div>
                      )}
                    </div>
                    <div className="spacer-small" />
                    <div className="w-layout-vflex" style={{ flexGrow: 1, padding: "0 1.25rem 1.25rem 1.25rem", display: "flex", flexDirection: "column" }}>
                      <div className="batch" style={{ background: "rgba(255, 255, 255, 0.7)" }}>
                        <div className="text-sm" style={{ fontWeight: 600 }}>{category}</div>
                      </div>
                      <div className="spacer-xsmall" />
                      <h3 className="heading-style-h4" style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1.25rem", lineHeight: 1.3 }}>{course.title}</h3>
                      <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                        {course.description.length > 110 ? course.description.substring(0, 110) + "..." : course.description}
                      </p>
                      
                      {/* Enroll Link */}
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.25rem", 
                        color: "var(--brand-black)", 
                        fontWeight: 700, 
                        fontSize: "0.875rem",
                        marginTop: "auto"
                      }}>
                        <span>Enroll in Program</span>
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
                        <span>Instructor: {course.instructorName || course.author?.full_name || 'Senior Command Mentor'}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <span>{course.lessons?.length || 0} Modules</span>
                      </div>
                    </div>

                    <Link href={`/courses`} className="article_card-link w-inline-block" />
                  </div>
                );
              })}
            </div>
            
          </div>
        </div>
      </section>

      {/* ── 4. TESTIMONIALS SECTION ── */}
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            
            {/* Header */}
            <div style={{ marginBottom: "4rem" }}>
              <div className="text_title">TESTIMONIALS</div>
              <div className="spacer-medium" />
              <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em" }}>What they say about Us?</h2>
              <div className="spacer-xsmall" />
              <p className="text-color-tertiary" style={{ fontSize: "0.9375rem" }}>
                Here&apos;s what they shared about their experience working with our team.
              </p>
            </div>

            {/* Testimonials Slider Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${visibleCount}, 1fr)`,
              gap: "2rem",
              minHeight: "320px",
              marginBottom: "3rem"
            }}>
              {getVisibleTestimonials().map((t) => (
                <div
                  key={t.originalIndex}
                  className="testimonial-card"
                  style={{
                    background: "var(--bg-primary)",
                    borderRadius: "0.75rem",
                    padding: "2.5rem",
                    border: "1px solid var(--border-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "280px",
                    position: "relative",
                    animation: "cookie-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards"
                  }}
                >
                  {/* Decorative background quote symbol */}
                  <div style={{
                    position: "absolute",
                    top: "1.5rem",
                    left: "2rem",
                    fontSize: "6rem",
                    lineHeight: 1,
                    color: "rgba(0, 32, 91, 0.04)",
                    fontFamily: "Georgia, serif",
                    userSelect: "none",
                    pointerEvents: "none"
                  }}>
                    “
                  </div>

                  <p style={{
                    fontSize: "1.0625rem",
                    lineHeight: 1.65,
                    fontWeight: 500,
                    color: "var(--brand-black)",
                    marginBottom: "2rem",
                    fontStyle: "normal",
                    position: "relative",
                    zIndex: 2
                  }} className="testimonial-quote-text">
                    &quot;{t.quote}&quot;
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "auto", position: "relative", zIndex: 2 }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      backgroundColor: "var(--brand-black)",
                      color: "var(--brand-yellow)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.9375rem",
                      border: "2px solid var(--border-primary)",
                      flexShrink: 0
                    }}>
                      {t.avatar}
                    </div>
                    <div>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--brand-black)", margin: 0 }}>
                        {t.author}
                      </h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", fontWeight: 500, margin: "0.15rem 0 0" }}>
                        {t.role}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "2rem"
            }}>
              {/* Pagination Dots */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestimonial(idx)}
                    style={{
                      width: idx === activeTestimonial ? "1.5rem" : "0.5rem",
                      height: "0.5rem",
                      borderRadius: "1rem",
                      background: idx === activeTestimonial ? "var(--brand-black)" : "var(--brand-gray-200)",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                      transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={handlePrevTestimonial}
                  style={{
                    border: "1px solid var(--border-secondary)",
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "white",
                    color: "var(--brand-black)",
                    transition: "all 0.2s ease"
                  }}
                  className="testimonial-nav-btn"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft style={{ width: 20, height: 20 }} />
                </button>
                <button
                  onClick={handleNextTestimonial}
                  style={{
                    border: "1px solid var(--border-secondary)",
                    borderRadius: "50%",
                    width: "48px",
                    height: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    background: "white",
                    color: "var(--brand-black)",
                    transition: "all 0.2s ease"
                  }}
                  className="testimonial-nav-btn"
                  aria-label="Next testimonial"
                >
                  <ChevronRight style={{ width: 20, height: 20 }} />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 5. SUCCESS STORIES (PORTFOLIO) SECTION ── */}
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "4rem" }}>
              <div style={{ maxWidth: "60rem" }}>
                <div className="text_title">FLEET IMPACT</div>
                <div className="spacer-medium" />
                <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
                  Mentorship milestones<br />strategic command impact
                </h2>
              </div>
              <div style={{ fontSize: "6rem", fontWeight: 800, color: "var(--brand-gray-300)", lineHeight: 1, letterSpacing: "-0.03em" }} className="hide-mobile-landscape">
                100%
              </div>
            </div>

            {/* Stack of Horizontal Cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              {successStories.map((story, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "320px 1fr",
                    gap: "3rem",
                    background: "white",
                    borderRadius: "1rem",
                    padding: "2rem",
                    border: "1px solid var(--border-primary)",
                    alignItems: "center"
                  }}
                  className="hide-mobile-landscape-grid"
                >
                  <div style={{ height: "240px", borderRadius: "0.75rem", overflow: "hidden" }}>
                    <img src={story.image} alt={story.title} className="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", textAlign: "left" }}>
                    <h3 className="heading-style-h3" style={{ fontSize: "1.75rem", fontWeight: 700 }}>{story.title}</h3>
                    <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6, maxWidth: "54rem" }}>
                      {story.description}
                    </p>
                    <Link href={story.link} className="button is-outline" style={{ width: "fit-content", marginTop: "1rem" }}>
                      LEARN MORE
                    </Link>
                  </div>
                </div>
              ))}

              {/* Mobile Fallback list */}
              <div className="show-mobile-landscape-flex" style={{ display: "none", flexDirection: "column", gap: "2rem" }}>
                {successStories.map((story, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "white",
                      borderRadius: "1rem",
                      padding: "1.5rem",
                      border: "1px solid var(--border-primary)"
                    }}
                  >
                    <div style={{ height: "180px", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1rem" }}>
                      <img src={story.image} alt={story.title} className="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                    <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>{story.title}</h3>
                    <p className="text-color-tertiary" style={{ fontSize: "0.875rem", marginBottom: "1.5rem" }}>{story.description}</p>
                    <Link href={story.link} className="button is-outline" style={{ width: "100%", textAlign: "center" }}>
                      LEARN MORE
                    </Link>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. LATEST INSIGHTS (BLOG) SECTION ── */}
      <section className="section-card section_blog" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large">
            <div>
              <div className="text_title">BLOGS AND ARTICLES</div>
              <div className="spacer-medium" />
              <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em", marginBottom: "3rem" }}>Latest insights and trends</h2>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "2.5rem" }} className="hide-mobile-portrait-grid">
              {blogPosts.map((post, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: post.bgColor,
                    borderRadius: "1rem",
                    padding: "2rem",
                    border: "1px solid var(--border-primary)",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    minHeight: "480px"
                  }}
                >
                  <div style={{ height: "240px", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1.5rem" }}>
                    <img src={post.image} alt={post.title} className="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="batch" style={{ background: "white", width: "fit-content", marginBottom: "1rem" }}>
                    <div className="text-sm" style={{ fontWeight: 600 }}>{post.category}</div>
                  </div>
                  <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem", letterSpacing: "-0.01em" }}>{post.title}</h3>
                  <p className="text-color-tertiary" style={{ fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>{post.description}</p>
                  <Link href={post.link} className="article_card-link w-inline-block" />
                </div>
              ))}
            </div>

            {/* Mobile Fallback for Blog */}
            <div className="show-mobile-portrait-flex" style={{ display: "none", flexDirection: "column", gap: "2rem" }}>
              {blogPosts.map((post, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: post.bgColor,
                    borderRadius: "1rem",
                    padding: "1.25rem",
                    border: "1px solid var(--border-primary)"
                  }}
                >
                  <div style={{ height: "180px", borderRadius: "0.75rem", overflow: "hidden", marginBottom: "1rem" }}>
                    <img src={post.image} alt={post.title} className="img" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  <div className="batch" style={{ background: "white", width: "fit-content", marginBottom: "0.5rem" }}>
                    <div className="text-sm">{post.category}</div>
                  </div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>{post.title}</h3>
                  <p className="text-color-tertiary" style={{ fontSize: "0.8125rem", marginBottom: "1rem" }}>{post.description}</p>
                  <Link href={post.link} className="button is-outline" style={{ width: "100%" }}>
                    LEARN MORE
                  </Link>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── 7. CTA SECTION ── */}
      <section className="section-card" style={{ height: "80vh", position: "relative" }}>
        <img
          src="/assets/navy-ship-sea.png"
          alt="CTA background"
          style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, zIndex: 0 }}
        />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 100%)",
          zIndex: 1
        }} />
        <div className="padding-global" style={{ height: "100%", display: "flex", alignItems: "center", position: "relative", zIndex: 2 }}>
          <div className="container-large" style={{ textAlign: "left", color: "white" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: "48rem" }}>
              <div className="text_title" style={{ color: "white" }}>JOIN US</div>
              <h2 style={{ fontWeight: 700, letterSpacing: "-0.02em", color: "white", lineHeight: 1.1 }}>
                Ready to serve with purpose?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.9375rem", lineHeight: 1.6 }}>
                Join the Nigerian Navy Mentorship Platform to connect with experienced leaders and advance your naval career.
              </p>
              <div className="button_wrap" style={{ marginTop: "1rem" }}>
                <Link href="/signup" className="button">
                  GET STARTED
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
