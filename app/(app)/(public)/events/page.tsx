"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Video, Headphones, Search, ArrowRight, UserCheck } from "lucide-react";
import type { AppEvent } from "@/lib/types";
import { api } from "@/lib/api";

export default function PublicEventsPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    api.events.list()
      .then(data => {
        if (Array.isArray(data)) {
          setEvents(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading events:", err);
        setLoading(false);
      });
  }, []);

  const filteredEvents = events.filter(e => {
    const isPast = new Date(e.scheduled_at).getTime() + (e.duration_minutes || 60) * 60 * 1000 < Date.now();
    const matchesTab = activeTab === "upcoming" ? !isPast : isPast;

    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || e.event_type === selectedType;

    return matchesTab && matchesSearch && matchesType;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="main-wrapper">
      {/* Page Header */}
      <section className="section-card" style={{ paddingTop: "6rem", paddingBottom: "4rem" }}>
        <div className="padding-global">
          <div className="container-large">
            <div className="text_title scroll-into-view">Maritime Events Hub</div>
            <div className="spacer-xlarge" />
            <h1 className="scroll-into-view" style={{ maxWidth: "60rem" }}>
              Nigerian Navy Events & Seminars
            </h1>
            <div className="spacer-medium" />
            <p className="text-color-tertiary scroll-into-view" style={{ maxWidth: "48rem", fontSize: "1.125rem" }}>
              Explore upcoming leadership seminars, online tactical webinars, and professional development podcasts scheduled for the naval mentorship platform.
            </p>
          </div>
        </div>
      </section>

      {/* Filters and Cards */}
      <section className="section-card" style={{ padding: "3.5rem 0" }}>
        <div className="padding-global">
          <div className="container-large" style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            
            {/* Neomorphic Archive Tab Switcher */}
            <div style={{
              display: "flex",
              background: "#e0e5ec",
              borderRadius: "2rem",
              padding: "0.4rem",
              boxShadow: "inset 3px 3px 6px #b8b9be, inset -3px -3px 6px #fff",
              width: "fit-content",
              alignSelf: "center",
              gap: "0.25rem"
            }}>
              <button
                onClick={() => setActiveTab("upcoming")}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "0.6rem 1.75rem",
                  borderRadius: "2rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  background: activeTab === "upcoming" ? "#e0e5ec" : "transparent",
                  color: activeTab === "upcoming" ? "#0f205b" : "var(--brand-gray-500)",
                  boxShadow: activeTab === "upcoming" ? "3px 3px 6px #b8b9be, -3px -3px 6px #fff" : "none"
                }}
              >
                Upcoming Events
              </button>
              <button
                onClick={() => setActiveTab("past")}
                style={{
                  border: "none",
                  outline: "none",
                  padding: "0.6rem 1.75rem",
                  borderRadius: "2rem",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s ease-in-out",
                  background: activeTab === "past" ? "#e0e5ec" : "transparent",
                  color: activeTab === "past" ? "#0f205b" : "var(--brand-gray-500)",
                  boxShadow: activeTab === "past" ? "3px 3px 6px #b8b9be, -3px -3px 6px #fff" : "none"
                }}
              >
                Past Events Archive
              </button>
            </div>

            {/* Search and Filters panel */}
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "1.5rem",
              borderBottom: "1px solid var(--border-primary)"
            }}>
              {/* Search input */}
              <div style={{ position: "relative", flex: "1", minWidth: "280px" }}>
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.85rem 1.5rem 0.85rem 3rem",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border-secondary)",
                    background: "var(--bg-secondary)",
                    fontSize: "0.9375rem",
                    color: "var(--text-primary)",
                    outline: "none"
                  }}
                />
                <Search className="w-4 h-4 text-navy-400" style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%)", color: "var(--brand-gray-500)" }} />
              </div>

              {/* Type filter buttons */}
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {["all", "online", "offline", "podcast"].map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedType(t)}
                    className={`button ${selectedType === t ? "is-secondary" : "is-outline"}`}
                    style={{
                      padding: "0.5rem 1.25rem",
                      fontSize: "0.8125rem",
                      textTransform: "uppercase",
                      borderRadius: "2rem"
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid list content */}
            {loading ? (
              <div style={{ textAlign: "center", padding: "4rem 0" }}>
                <div className="spinner" style={{ margin: "0 auto" }}></div>
                <p style={{ marginTop: "1rem", color: "var(--brand-gray-500)" }}>Loading events calendar...</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "5rem 2rem",
                border: "1px dashed var(--border-secondary)",
                borderRadius: "0.75rem"
              }}>
                <Calendar className="w-12 h-12 text-navy-200" style={{ margin: "0 auto 1.5rem auto", color: "var(--brand-gray-400)" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--text-primary)" }}>No events found</h3>
                <p style={{ color: "var(--brand-gray-500)", marginTop: "0.5rem", fontSize: "0.875rem" }}>
                  There are no scheduled events matching your selection at this time.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "2rem" }}>
                {filteredEvents.map(e => {
                  const isPast = new Date(e.scheduled_at).getTime() < Date.now();
                  const attendeesCount = e.registrations?.filter(r => r.status === 'attending').length || 0;

                  return (
                    <div key={e.id} className="article_card" style={{
                      background: "var(--bg-primary)",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%"
                    }}>
                      {/* Tag bar */}
                      <div style={{
                        padding: "1.25rem 1.5rem 0.5rem 1.5rem",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          fontSize: "0.6875rem",
                          fontWeight: 800,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          padding: "0.25rem 0.6rem",
                          borderRadius: "4px",
                          background: e.event_type === "online" ? "rgba(37, 99, 235, 0.1)" : e.event_type === "offline" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                          color: e.event_type === "online" ? "var(--brand-black)" : e.event_type === "offline" ? "#b45309" : "#047857"
                        }}>
                          {e.event_type === "online" && <Video className="w-3 h-3" />}
                          {e.event_type === "offline" && <MapPin className="w-3 h-3" />}
                          {e.event_type === "podcast" && <Headphones className="w-3 h-3" />}
                          {e.event_type}
                        </span>
                        {isPast && (
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--brand-gray-450)", textTransform: "uppercase" }}>
                            Ended
                          </span>
                        )}
                      </div>

                      {/* Content block */}
                      <div style={{ padding: "0.75rem 1.5rem 1.5rem 1.5rem", flex: "1", display: "flex", flexDirection: "column" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3, marginBottom: "0.75rem" }}>
                          {e.title}
                        </h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-tertiary)", lineHeight: 1.5, flex: "1", marginBottom: "1.25rem" }}>
                          {e.description && e.description.length > 130 ? `${e.description.substring(0, 130)}...` : e.description}
                        </p>

                        {/* Date details */}
                        <div style={{ borderTop: "1px solid var(--border-primary)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--brand-gray-500)" }}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(e.scheduled_at)}</span>
                          </div>
                          
                          {e.event_type === "offline" && e.location && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", color: "var(--brand-gray-500)" }}>
                              <MapPin className="w-3.5 h-3.5" />
                              <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.location}</span>
                            </div>
                          )}

                          {attendeesCount > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{attendeesCount} Attending</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* View details footer strip */}
                      <Link href={`/events/${e.id}`} style={{
                        background: "rgba(0, 32, 91, 0.02)",
                        borderTop: "1px solid var(--border-primary)",
                        padding: "1rem 1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: "var(--brand-black)",
                        textDecoration: "none"
                      }}>
                        <span>View Event Details</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
