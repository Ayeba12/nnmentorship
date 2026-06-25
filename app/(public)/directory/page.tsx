"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthContext";
import { MockDatabase, type User } from "@/domain/MockDatabase";
import { Search, Users, Grid, List, Anchor, ArrowRight, SlidersHorizontal, UserPlus } from "lucide-react";

export default function DirectoryPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "MENTOR_ACTIVE" | "MENTOR_RETIRED" | "MENTEE">("ALL");
  const [specFilter, setSpecFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    try {
      MockDatabase.initialize();
      const allUsers = MockDatabase.getUsers();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const specializations = [
    "ALL",
    "Navigation & Operations",
    "Marine Engineering",
    "Weapons Electrical",
    "Logistics & Supply",
    "Naval Intelligence",
  ];

  // Filtering logic
  const filteredUsers = users.filter((u) => {
    // Only display approved mentors & mentees, exclude admins from directory listing
    if (u.status !== "APPROVED") return false;
    if (u.role === "ADMIN") return false;

    const matchesSearch = u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.rank.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.command.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.specialization.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesRole = true;
    if (roleFilter === "MENTOR_ACTIVE") {
      matchesRole = u.role === "MENTOR_ACTIVE";
    } else if (roleFilter === "MENTOR_RETIRED") {
      matchesRole = u.role === "MENTOR_RETIRED";
    } else if (roleFilter === "MENTEE") {
      matchesRole = u.role === "MENTEE";
    }

    const matchesSpec = specFilter === "ALL" ? true : 
      (u.specialization.toLowerCase().includes(specFilter.toLowerCase()) || 
       specFilter.toLowerCase().includes(u.specialization.toLowerCase()));

    return matchesSearch && matchesRole && matchesSpec;
  });

  return (
    <div className="main-wrapper">
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Directory</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view" style={{ maxWidth: "60rem" }}>
              Find a Mentor or Mentee
            </h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "48rem", fontSize: "1.125rem" }}>
              Browse verified naval personnel, retired officers, and active cadets currently registered on the platform.
            </p>
          </div>
        </div>
      </section>

      {/* Search, Filters & Directory Content */}
      <section className="section-card" style={{ padding: "3rem 0" }}>
        <div className="padding-global">
          <div className="container-large" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Search and Filter Controls */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Row 1: Search Bar & Filter Button Inline */}
              <div style={{ display: "flex", gap: "1rem", alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                <div style={{ position: "relative", flex: 1, minWidth: "250px" }}>
                  <input
                    type="text"
                    placeholder="Search by name, rank, or command..."
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
                    <label style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--brand-black)" }}>Specialization</label>
                    <select
                      value={specFilter}
                      onChange={(e) => setSpecFilter(e.target.value)}
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
                      {specializations.map((spec) => (
                        <option key={spec} value={spec}>
                          {spec === "ALL" ? "All Specialties" : spec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Row 2: Tabs inline with Grid/List Toggle */}
              <div className="filter-toggle-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "nowrap", gap: "1rem", width: "100%" }}>
                {/* Role Tabs */}
                <div className="tab_nav" style={{ justifyContent: "flex-start", margin: 0, borderBottom: "none", padding: 0, flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => setRoleFilter("ALL")}
                    className={`tab_button${roleFilter === "ALL" ? " is-active" : ""}`}
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    <div className="tab_text">All Personnel</div>
                  </button>
                  <button
                    onClick={() => setRoleFilter("MENTOR_ACTIVE")}
                    className={`tab_button${roleFilter === "MENTOR_ACTIVE" ? " is-active" : ""}`}
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    <div className="tab_text">Active Mentors</div>
                  </button>
                  <button
                    onClick={() => setRoleFilter("MENTOR_RETIRED")}
                    className={`tab_button${roleFilter === "MENTOR_RETIRED" ? " is-active" : ""}`}
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    <div className="tab_text">Retired Mentors</div>
                  </button>
                  <button
                    onClick={() => setRoleFilter("MENTEE")}
                    className={`tab_button${roleFilter === "MENTEE" ? " is-active" : ""}`}
                    style={{ border: "none", cursor: "pointer" }}
                  >
                    <div className="tab_text">Mentees</div>
                  </button>
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

            {/* Directory Content Cards Grid/List */}
            <div>
              {filteredUsers.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "6rem 2rem",
                  background: "var(--bg-secondary)",
                  borderRadius: "1rem",
                  color: "var(--text-tertiary)"
                }}>
                  <Users style={{ width: 48, height: 48, margin: "0 auto 1rem", opacity: 0.5 }} />
                  <p style={{ fontSize: "1rem" }}>No personnel matching your filters could be found.</p>
                </div>
              ) : (
                <div style={
                  viewMode === "GRID" 
                    ? { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "2rem" }
                    : { display: "flex", flexDirection: "column", gap: "1rem" }
                }>
                  {filteredUsers.map((u) => {
                    const dbId = (() => {
                      if (u.id === "user-mentor-1") return "2";
                      if (u.id === "user-mentor-2") return "3";
                      if (u.id === "user-mentor-3") return "4";
                      if (u.id === "user-mentor-retired-1") return "5";
                      const match = u.id.match(/\d+/);
                      return match ? match[0] : u.id;
                    })();
                    const initials = u.fullName.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
                    const isMentor = u.role.startsWith("MENTOR");
                    
                    const profileLink = user 
                      ? (isMentor ? `/dashboard/mentors/${dbId}` : `/dashboard/profile`)
                      : (isMentor ? `/login?redirect=/dashboard/mentors/${dbId}` : `/login?redirect=/dashboard/profile`);

                    if (viewMode === "LIST") {
                      return (
                        <div
                          key={u.id}
                          className="directory-list-card"
                        >
                          {/* Avatar */}
                          <div className="directory-avatar" style={{ 
                            marginBottom: 0, 
                            width: "48px", 
                            height: "48px", 
                            fontSize: "1rem", 
                            flexShrink: 0,
                            backgroundColor: isMentor ? "var(--brand-black)" : "rgba(255, 206, 0, 0.15)",
                            color: isMentor ? "var(--brand-yellow)" : "var(--brand-black)",
                            borderColor: isMentor ? "var(--brand-black)" : "var(--brand-yellow)"
                          }}>
                            {initials}
                          </div>
   
                          {/* Name & Title */}
                          <div style={{ flex: 1, minWidth: "160px", textAlign: "left" }}>
                            <h3 className="text-xl" style={{ fontWeight: 700, margin: 0, color: "var(--brand-black)", fontSize: "1.125rem" }}>
                              {u.fullName}
                            </h3>
                            <div className="text-color-tertiary" style={{ fontSize: "0.8125rem", fontWeight: 600, marginTop: "0.15rem" }}>
                              {u.rank}
                            </div>
                          </div>
   
                          {/* Role tag in list view */}
                          <div style={{ display: "flex", alignItems: "center", marginRight: "1rem" }}>
                            <div className="batch" style={{ background: isMentor ? "rgba(0, 32, 91, 0.06)" : "rgba(255, 206, 0, 0.12)", border: "1px solid var(--border-primary)", borderRadius: "0.375rem", padding: "0.2rem 0.5rem", margin: 0 }}>
                              <div className="text-sm" style={{ fontWeight: 700, color: "var(--brand-black)", fontSize: "0.6875rem", letterSpacing: "0.05em" }}>
                                {isMentor ? "MENTOR" : "MENTEE"}
                              </div>
                            </div>
                          </div>
   
                          {/* Specialization Batch */}
                          <div style={{ flex: 1, display: "flex", justifyContent: "flex-start", minWidth: "160px" }}>
                            <div className="batch" style={{ background: "var(--brand-gray-100)", border: "1px solid var(--border-primary)", borderRadius: "0.375rem", padding: "0.25rem 0.75rem", margin: 0 }}>
                              <div className="text-sm" style={{ fontWeight: 600, color: "var(--brand-black)", fontSize: "0.75rem" }}>
                                {u.specialization}
                              </div>
                            </div>
                          </div>
   
                          {/* Command / Location */}
                          <div className="text-color-tertiary" style={{ fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", minWidth: "180px", justifyContent: "flex-start" }}>
                            <Anchor style={{ width: 12, height: 12, opacity: 0.6 }} />
                            <span>{u.command}</span>
                          </div>
   
                          {/* Connect Button */}
                          <div style={{ minWidth: "140px", display: "flex", justifyContent: "flex-end" }}>
                            <Link href={profileLink} className="connect-btn" style={{ width: "auto" }}>
                              <UserPlus style={{ width: 14, height: 14 }} />
                              <span>Connect</span>
                            </Link>
                          </div>
                        </div>
                      );
                    }
   
                    return (
                      <div
                        key={u.id}
                        className="directory-card"
                      >
                        {/* Top Row: Role Tag */}
                        <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", marginBottom: "0.5rem" }}>
                          <div className="batch" style={{ background: isMentor ? "rgba(0, 32, 91, 0.06)" : "rgba(255, 206, 0, 0.12)", border: "1px solid var(--border-primary)", borderRadius: "0.375rem", padding: "0.2rem 0.5rem", margin: 0 }}>
                            <div className="text-sm" style={{ fontWeight: 700, color: "var(--brand-black)", fontSize: "0.6875rem", letterSpacing: "0.05em" }}>
                              {isMentor ? "MENTOR" : "MENTEE"}
                            </div>
                          </div>
                        </div>
   
                        {/* Avatar */}
                        <div className="directory-avatar" style={{
                          backgroundColor: isMentor ? "var(--brand-black)" : "rgba(255, 206, 0, 0.15)",
                          color: isMentor ? "var(--brand-yellow)" : "var(--brand-black)",
                          borderColor: isMentor ? "var(--brand-black)" : "var(--brand-yellow)"
                        }}>
                          {initials}
                        </div>
   
                        {/* Info */}
                        <h3 className="text-xl" style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--brand-black)" }}>
                          {u.fullName}
                        </h3>
                        <div className="text-color-tertiary" style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "1rem" }}>
                          {u.rank}
                        </div>
                        
                        <div className="batch" style={{ background: "var(--brand-gray-100)", border: "1px solid var(--border-primary)", borderRadius: "0.375rem", padding: "0.25rem 0.75rem", marginBottom: "0.75rem" }}>
                          <div className="text-sm" style={{ fontWeight: 600, color: "var(--brand-black)", fontSize: "0.8125rem" }}>{u.specialization}</div>
                        </div>
                        
                        <div className="text-color-tertiary" style={{ fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", marginBottom: "1.25rem" }}>
                          <Anchor style={{ width: 12, height: 12, opacity: 0.6 }} />
                          <span>{u.command}</span>
                        </div>
   
                        {/* Connect Button */}
                        <div style={{ marginTop: "auto", width: "100%", borderTop: "1px solid var(--border-primary)", paddingTop: "1.25rem", display: "flex", justifyContent: "center" }}>
                          <Link href={profileLink} className="connect-btn">
                            <UserPlus style={{ width: 16, height: 16 }} />
                            <span>Connect</span>
                          </Link>
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

      {/* CTA Join Directory */}
      <section className="section-card section_joinus" style={{ padding: "4rem 0" }}>
        <div className="padding-global padding-section-bottom">
          <div className="container-large">
            <div className="w-layout-grid grid-col-2">
              <div className="join_left">
                <div>
                  <div className="text_title scroll-into-view">Register</div>
                  <div className="spacer-medium" />
                  <div className="title-max is-32rem scroll-into-view">
                    <h2 className="heading-style-h2">Want to join the directory list?</h2>
                  </div>
                  <div className="spacer-medium" />
                  <div className="text-color-tertiary scroll-into-view">
                    Create a verified service account today to be listed and match with other naval members.
                  </div>
                </div>
                <div className="button_wrap scroll-into-view">
                  <Link href="/signup" className="button is-secondary">
                    Register Now
                  </Link>
                </div>
              </div>
              <div className="join_image scroll-into-img">
                <img
                  src="/assets/nigerian-navy-register.png"
                  loading="lazy"
                  alt="Join Us"
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
