"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { Calendar, MapPin, Video, Headphones, ArrowLeft, Download, CheckCircle, ExternalLink, ShieldAlert, Mail } from "lucide-react";
import type { AppEvent } from "@/lib/types";
import { useAuth } from "@/components/AuthContext";
import { api } from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PublicEventDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const { profile } = useAuth();
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [rsvpStatus, setRsvpStatus] = useState<"attending" | "interested">("attending");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinName, setJoinName] = useState("");
  const [joinEmail, setJoinEmail] = useState("");

  const [mounted, setMounted] = useState(false);
  const [eventStatus, setEventStatus] = useState<"upcoming" | "live" | "completed">("upcoming");
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    setMounted(true);
    if (!event) return;

    const scheduledTime = new Date(event.scheduled_at).getTime();
    const durationMs = (event.duration_minutes || 60) * 60 * 1000;
    const endTime = scheduledTime + durationMs;
    const revealTime = scheduledTime - 15 * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      if (now > endTime) {
        setEventStatus("completed");
      } else if (now >= revealTime) {
        setEventStatus("live");
      } else {
        setEventStatus("upcoming");
        const diff = scheduledTime - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        const seconds = Math.floor((diff / 1000) % 60);
        setTimeLeft({ days, hours, minutes, seconds });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event]);

  useEffect(() => {
    if (profile) {
      setJoinName(profile.full_name || "");
      setJoinEmail(profile.email || "");
    }
  }, [profile]);

  const handleUserRSVP = async (status: "attending" | "interested") => {
    setSubmitting(true);
    try {
      await api.events.rsvp(Number(id), { status });
      // Refresh event detail
      const data = await api.events.get(Number(id));
      if (data && !(data as any).error) {
        setEvent(data);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit RSVP.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    api.events.get(Number(id))
      .then(data => {
        if (data && !(data as any).error) {
          setEvent(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading event:", err);
        setLoading(false);
      });
  }, [id]);

  const handleGuestRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestEmail) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/events/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: Number(id),
          status: rsvpStatus,
          guestName,
          guestEmail
        })
      });
      const data = await res.json();
      if (!data.error) {
        setSuccess(true);
        // Refresh event to update attendee count
        const refreshData = await api.events.get(Number(id));
        if (refreshData && !(refreshData as any).error) {
          setEvent(refreshData);
        }
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during RSVP.");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadICS = () => {
    if (!event) return;
    const title = event.title.replace(/[,;]/g, '\\$&');
    const description = (event.description || '').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n');
    const location = (event.location || event.meeting_link || '').replace(/[,;]/g, '\\$&');
    
    const start = new Date(event.scheduled_at).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const end = new Date(new Date(event.scheduled_at).getTime() + (event.duration_minutes || 60) * 60000)
      .toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nigerian Navy Mentorship Platform//Events//EN",
      "BEGIN:VEVENT",
      `UID:event-${event.id}@navymentorship.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${event.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="main-wrapper">
        <section className="section-card" style={{ padding: "8rem 2rem", textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto" }}></div>
          <p style={{ marginTop: "1rem", color: "var(--brand-gray-500)" }}>Loading event details...</p>
        </section>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="main-wrapper">
        <section className="section-card" style={{ padding: "8rem 2rem", textAlign: "center" }}>
          <ShieldAlert className="w-12 h-12" style={{ margin: "0 auto 1.5rem auto", color: "var(--brand-black)" }} />
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1rem" }}>Event Not Found</h2>
          <p style={{ color: "var(--text-tertiary)", marginBottom: "1.5rem" }}>The requested event does not exist, is private, or has been deleted.</p>
          <Link href="/events" className="button is-secondary">
            <ArrowLeft className="w-4 h-4 mr-2 inline" /> Back to Events
          </Link>
        </section>
      </div>
    );
  }

  const isPast = new Date(event.scheduled_at).getTime() < Date.now();
  const attendeesCount = event.registrations?.filter(r => r.status === 'attending').length || 0;
  const interestedCount = event.registrations?.filter(r => r.status === 'interested').length || 0;
  const myRsvp = event.registrations?.find(r => r.user_id === profile?.id);

  return (
    <div className="main-wrapper">
      <section className="section-card" style={{ padding: "4rem 0" }}>
        <div className="padding-global">
          <div className="container-large" style={{ maxWidth: "60rem", margin: "0 auto" }}>
            
            {/* Back Link */}
            <Link href="/events" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)", fontWeight: 700, textDecoration: "none", marginBottom: "2.5rem" }}>
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Events Directory</span>
            </Link>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              
              {/* Main Card Info */}
              <div className="lg:col-span-2" style={{
                background: "var(--bg-primary)",
                borderRadius: "0.75rem",
                border: "1px solid var(--border-primary)",
                padding: "2.5rem",
                boxShadow: "0 4px 30px rgba(0, 0, 0, 0.015)"
              }}>
                {/* Tag type badge */}
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "0.35rem 0.75rem",
                  borderRadius: "4px",
                  background: event.event_type === "online" ? "rgba(37, 99, 235, 0.1)" : event.event_type === "offline" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  color: event.event_type === "online" ? "var(--brand-black)" : event.event_type === "offline" ? "#b45309" : "#047857",
                  marginBottom: "1.5rem"
                }}>
                  {event.event_type === "online" && <Video className="w-3.5 h-3.5" />}
                  {event.event_type === "offline" && <MapPin className="w-3.5 h-3.5" />}
                  {event.event_type === "podcast" && <Headphones className="w-3.5 h-3.5" />}
                  {event.event_type}
                </span>

                <h1 style={{ fontSize: "2.25rem", color: "var(--text-primary)", lineHeight: 1.25, marginBottom: "1.5rem" }}>
                  {event.title}
                </h1>

                {/* Details Summary Block */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1.5rem",
                  margin: "2rem 0",
                  background: "var(--bg-secondary)",
                  padding: "1.25rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-primary)"
                }}>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                    <Calendar className="w-5 h-5 text-navy-500 mt-0.5" style={{ color: "var(--brand-black)" }} />
                    <div>
                      <h4 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-tertiary)" }}>Date & Time</h4>
                      <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>{formatDate(event.scheduled_at)}</p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.1rem" }}>Duration: {event.duration_minutes || 60} minutes</p>
                    </div>
                  </div>

                  {event.event_type === "offline" && event.location && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <MapPin className="w-5 h-5 text-navy-500 mt-0.5" style={{ color: "var(--brand-black)" }} />
                      <div>
                        <h4 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-tertiary)" }}>Location</h4>
                        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.25rem" }}>{event.location}</p>
                      </div>
                    </div>
                  )}

                  {event.event_type === "online" && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <Video className="w-5 h-5 text-navy-500 mt-0.5" style={{ color: "var(--brand-black)" }} />
                      <div>
                        <h4 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-tertiary)" }}>Webinar</h4>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>Online Meeting Session</span>
                      </div>
                    </div>
                  )}
                  {event.event_type === "podcast" && (
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "start" }}>
                      <Headphones className="w-5 h-5 text-navy-500 mt-0.5" style={{ color: "var(--brand-black)" }} />
                      <div>
                        <h4 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-tertiary)" }}>Podcast</h4>
                        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>Audio Episode Release</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Neomorphic Countdown Timer or Live Join Button */}
                {mounted && (
                  <div style={{ margin: "2rem 0" }}>
                    {eventStatus === "upcoming" && (
                      <div style={{
                        background: "#e0e5ec",
                        borderRadius: "16px",
                        padding: "2rem",
                        boxShadow: "9px 9px 16px rgba(163, 177, 198, 0.4), -9px -9px 16px rgba(255, 255, 255, 0.8)",
                        textAlign: "center"
                      }}>
                        <h3 style={{ fontSize: "0.875rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-tertiary)", letterSpacing: "0.05em", marginBottom: "1rem" }}>
                          Event Starts In
                        </h3>
                        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                          {[
                            { label: "Days", val: timeLeft.days },
                            { label: "Hrs", val: timeLeft.hours },
                            { label: "Mins", val: timeLeft.minutes },
                            { label: "Secs", val: timeLeft.seconds }
                          ].map((item, idx) => (
                            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{
                                fontSize: "2rem",
                                fontWeight: "bold",
                                color: "#0f205b",
                                background: "#e0e5ec",
                                borderRadius: "12px",
                                boxShadow: "inset 3px 3px 6px #b8b9be, inset -3px -3px 6px #fff",
                                padding: "0.5rem 1rem",
                                minWidth: "75px",
                                textAlign: "center"
                              }}>
                                {String(item.val).padStart(2, "0")}
                              </div>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {eventStatus === "live" && (
                      <div style={{
                        background: "#e0e5ec",
                        borderRadius: "16px",
                        padding: "2rem",
                        boxShadow: "9px 9px 16px rgba(163, 177, 198, 0.4), -9px -9px 16px rgba(255, 255, 255, 0.8)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "1rem"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#047857", fontWeight: 800, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#10b981", borderRadius: "50%" }} />
                          <span>Event Is Live Now</span>
                        </div>
                        
                        {event.event_type === "online" && event.meeting_link && (
                          <a
                            href={event.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: "#e0e5ec",
                              borderRadius: "12px",
                              boxShadow: "6px 6px 12px rgba(163, 177, 198, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8)",
                              padding: "0.85rem 2rem",
                              fontWeight: 700,
                              color: "#0f205b",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.2s ease-in-out",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              textDecoration: "none"
                            }}
                          >
                            <Video className="w-4 h-4" />
                            <span>Join Online Session</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {event.event_type === "podcast" && (event.external_link || event.audio_url) && (
                          <a
                            href={event.external_link || event.audio_url || undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: "#e0e5ec",
                              borderRadius: "12px",
                              boxShadow: "6px 6px 12px rgba(163, 177, 198, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8)",
                              padding: "0.85rem 2rem",
                              fontWeight: 700,
                              color: "#0f205b",
                              border: "none",
                              cursor: "pointer",
                              transition: "all 0.2s ease-in-out",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              textDecoration: "none"
                            }}
                          >
                            <Headphones className="w-4 h-4" />
                            <span>Listen to Podcast Stream</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {event.event_type === "offline" && event.location && (
                          <div style={{ textAlign: "center" }}>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                              Physical Location: <strong style={{ color: "#0f205b" }}>{event.location}</strong>
                            </p>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: "#e0e5ec",
                                borderRadius: "12px",
                                boxShadow: "6px 6px 12px rgba(163, 177, 198, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8)",
                                padding: "0.85rem 2rem",
                                fontWeight: 700,
                                color: "#0f205b",
                                border: "none",
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                textDecoration: "none"
                              }}
                            >
                              <MapPin className="w-4 h-4" />
                              <span>Get Directions on Google Maps</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    {eventStatus === "completed" && (
                      <div style={{
                        background: "#f3f4f6",
                        borderRadius: "16px",
                        padding: "1.5rem",
                        border: "1px solid var(--border-secondary)",
                        textAlign: "center",
                        color: "var(--brand-gray-500)"
                      }}>
                        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-tertiary)" }}>
                          Event Completed
                        </h3>
                        <p style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>
                          This scheduled training session or webinar has ended.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--text-primary)", marginBottom: "2.5rem" }}>
                  <p style={{ whiteSpace: "pre-line" }}>{event.description}</p>
                </div>

                {/* Audio Player for Podcast Events */}
                {event.event_type === "podcast" && event.audio_url && (
                  <AudioPlayer src={event.audio_url} externalLink={event.external_link} />
                )}

                {/* Event Links visible after registration or when live */}
                {mounted && eventStatus !== "completed" && (myRsvp?.status === "attending" || success || eventStatus === "live") && (
                  <div style={{
                    marginTop: "1.5rem",
                    padding: "1.25rem",
                    background: "rgba(16, 185, 129, 0.05)",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem"
                  }}>
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--text-primary)" }}>Access Details</h4>
                    {event.event_type === "online" && event.meeting_link && (
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", fontSize: "0.8125rem", gap: "1rem" }}>
                        <span style={{ color: "var(--text-tertiary)" }}>Online Meeting Link:</span>
                        <a
                          href={event.meeting_link ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline font-bold"
                          style={{ color: "var(--brand-black)" }}
                        >
                          <span>Join Live Zoom/Online Session</span>
                          <ExternalLink className="w-3.5 h-3.5 inline ml-1" />
                        </a>
                      </div>
                    )}
                    {event.event_type === "podcast" && (event.external_link || event.audio_url) && (
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", fontSize: "0.8125rem", gap: "1rem" }}>
                        <span style={{ color: "var(--text-tertiary)" }}>Podcast External Stream:</span>
                        <a
                          href={(event.external_link || event.audio_url) ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline font-bold"
                          style={{ color: "#047857" }}
                        >
                          <span>Listen on Spotify / Stream URL</span>
                          <ExternalLink className="w-3.5 h-3.5 inline ml-1" />
                        </a>
                      </div>
                    )}
                    {event.event_type === "offline" && event.location && (
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", fontSize: "0.8125rem", gap: "1rem" }}>
                        <span style={{ color: "var(--text-tertiary)" }}>Google Maps Navigation:</span>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 hover:underline font-bold"
                          style={{ color: "#b45309" }}
                        >
                          <span>Get Directions on Maps</span>
                          <ExternalLink className="w-3.5 h-3.5 inline ml-1" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Join / Attend CTA */}
                {mounted && eventStatus !== "completed" && (
                  <div style={{
                    marginTop: "1.5rem",
                    padding: "1.25rem",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    justifyContent: "space-between",
                    alignItems: "start"
                  }} className="sm:flex-row">
                    <div>
                      <h4 style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)" }}>Ready to Attend?</h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>Confirm your details to access the event link, podcast, or location maps.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (profile) {
                          setJoinName(profile.full_name || "");
                          setJoinEmail(profile.email || "");
                        }
                        setShowJoinModal(true);
                      }}
                      className="button is-secondary"
                      style={{ fontSize: "0.8125rem", padding: "0.5rem 1.25rem", alignSelf: "stretch" }}
                    >
                      Join / Attend Event
                    </button>
                  </div>
                )}

                {/* Join/Check-in Modal */}
                {showJoinModal && (
                  <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0, 21, 61, 0.4)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                    zIndex: 9999
                  }}>
                    <div style={{
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-primary)",
                      borderRadius: "12px",
                      maxWidth: "400px",
                      width: "100%",
                      padding: "1.5rem",
                      boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem"
                    }}>
                      <div>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>Confirm Attendance</h3>
                        <p style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "0.25rem" }}>Please confirm your name and email to attend this event and retrieve the access links.</p>
                      </div>

                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setSubmitting(true);
                        try {
                          // RSVP to register
                          const registerPayload = profile 
                            ? { event_id: Number(id), status: "attending" }
                            : { event_id: Number(id), status: "attending", guestName: joinName, guestEmail: joinEmail };
                          
                          const res = await fetch("/api/events/register", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(registerPayload)
                          });
                          const data = await res.json();
                          if (!data.error) {
                            setSuccess(true);
                            // Refresh event detail
                            const refreshData = await api.events.get(Number(id));
                            if (refreshData && !(refreshData as any).error) {
                              setEvent(refreshData);
                            }
                            setShowJoinModal(false);
                            
                            // Redirect based on event type
                            if (event.event_type === "online" && event.meeting_link) {
                              window.open(event.meeting_link ?? undefined, "_blank");
                            } else if (event.event_type === "podcast" && (event.external_link || event.audio_url)) {
                              window.open((event.external_link || event.audio_url) ?? undefined, "_blank");
                            } else if (event.event_type === "offline" && event.location) {
                              window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`, "_blank");
                            } else {
                              alert("Event registered! This physical/offline event takes place at: " + (event.location || "N/A"));
                            }
                          } else {
                            alert(data.error);
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Failed to confirm attendance.");
                        } finally {
                          setSubmitting(false);
                        }
                      }} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)" }}>Your Name</label>
                          <input
                            type="text"
                            required
                            value={joinName}
                            onChange={e => setJoinName(e.target.value)}
                            style={{
                              padding: "0.75rem 1rem",
                              borderRadius: "0.375rem",
                              border: "1px solid var(--border-secondary)",
                              background: "var(--bg-secondary)",
                              fontSize: "0.875rem",
                              color: "var(--text-primary)",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)" }}>Email Address</label>
                          <input
                            type="email"
                            required
                            value={joinEmail}
                            onChange={e => setJoinEmail(e.target.value)}
                            style={{
                              padding: "0.75rem 1rem",
                              borderRadius: "0.375rem",
                              border: "1px solid var(--border-secondary)",
                              background: "var(--bg-secondary)",
                              fontSize: "0.875rem",
                              color: "var(--text-primary)",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", paddingTop: "0.5rem" }}>
                          <button
                            type="button"
                            onClick={() => setShowJoinModal(false)}
                            className="button is-outline"
                            style={{ flex: 1, padding: "0.65rem", fontSize: "0.8125rem" }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={submitting}
                            className="button is-secondary"
                            style={{ flex: 1, padding: "0.65rem", fontSize: "0.8125rem", justifyContent: "center" }}
                          >
                            {submitting ? "Checking in..." : "Confirm & Join"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Calendar & Share Toolbar */}
                <div style={{
                  marginTop: "3rem",
                  paddingTop: "1.5rem",
                  borderTop: "1px solid var(--border-primary)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem"
                }}>
                  <button onClick={downloadICS} className="button is-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                    <Download className="w-4 h-4" />
                    <span>Sync to Calendar (.ics)</span>
                  </button>

                  <div style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)" }}>
                    Registry: <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{attendeesCount} attending</span> | <span>{interestedCount} interested</span>
                  </div>
                </div>
              </div>

              {/* Sidebar RSVP Panel */}
              <div className="lg:col-span-1">
                {!isPast && (
                  <div style={{
                    background: "var(--bg-primary)",
                    borderRadius: "0.75rem",
                    border: "1px solid var(--border-primary)",
                    padding: "2rem",
                    boxShadow: "0 4px 30px rgba(0, 0, 0, 0.015)",
                    height: "fit-content"
                  }}>
                    {profile ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>Your RSVP Status</h3>
                        {myRsvp ? (
                          <div style={{ padding: "0.75rem 1rem", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)", borderRadius: "8px", fontSize: "0.8125rem", color: "#047857" }}>
                            <p style={{ fontWeight: 700 }}>
                              You are registered as: <span style={{ textTransform: "uppercase" }}>{myRsvp.status}</span>
                            </p>
                            <p style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", marginTop: "0.25rem" }}>Registered on: {new Date(myRsvp.created_at).toLocaleDateString()}</p>
                          </div>
                        ) : (
                          <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                            You have not registered for this event yet. RSVP below to confirm.
                          </p>
                        )}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                          <button
                            onClick={() => handleUserRSVP("attending")}
                            disabled={submitting}
                            style={{
                              width: "100%",
                              padding: "0.65rem",
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              borderRadius: "4px",
                              border: "1px solid",
                              borderColor: myRsvp?.status === "attending" ? "#047857" : "var(--border-secondary)",
                              background: myRsvp?.status === "attending" ? "#047857" : "transparent",
                              color: myRsvp?.status === "attending" ? "white" : "var(--text-tertiary)",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            I am Attending
                          </button>
                          <button
                            onClick={() => handleUserRSVP("interested")}
                            disabled={submitting}
                            style={{
                              width: "100%",
                              padding: "0.65rem",
                              fontSize: "0.8125rem",
                              fontWeight: 700,
                              borderRadius: "4px",
                              border: "1px solid",
                              borderColor: myRsvp?.status === "interested" ? "#b45309" : "var(--border-secondary)",
                              background: myRsvp?.status === "interested" ? "#b45309" : "transparent",
                              color: myRsvp?.status === "interested" ? "white" : "var(--text-tertiary)",
                              cursor: "pointer",
                              transition: "all 0.2s"
                            }}
                          >
                            I am Interested
                          </button>
                        </div>
                      </div>
                    ) : success ? (
                      <div style={{ textAlign: "center", padding: "1rem 0" }}>
                        <CheckCircle className="w-12 h-12 text-green-500" style={{ margin: "0 auto 1.25rem auto", color: "#10b981" }} />
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>RSVP Registered!</h3>
                        <p style={{ color: "var(--text-tertiary)", fontSize: "0.8125rem", marginTop: "0.5rem" }}>
                          Thank you. Your attendance status has been saved.
                        </p>
                        <button onClick={() => setSuccess(false)} className="button is-outline" style={{ width: "100%", marginTop: "1.5rem" }}>
                          Update RSVP Details
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleGuestRSVP} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <h3 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)" }}>Register as Guest</h3>
                        <p style={{ fontSize: "0.8125rem", color: "var(--text-tertiary)", lineHeight: 1.4 }}>
                          You are not logged in. Register as a guest visitor to attend this public event.
                        </p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)" }}>Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            style={{
                              padding: "0.75rem 1rem",
                              borderRadius: "0.375rem",
                              border: "1px solid var(--border-secondary)",
                              background: "var(--bg-secondary)",
                              fontSize: "0.875rem",
                              color: "var(--text-primary)",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)" }}>Email Address</label>
                          <input
                            type="email"
                            required
                            placeholder="e.g. john@example.com"
                            value={guestEmail}
                            onChange={e => setGuestEmail(e.target.value)}
                            style={{
                              padding: "0.75rem 1rem",
                              borderRadius: "0.375rem",
                              border: "1px solid var(--border-secondary)",
                              background: "var(--bg-secondary)",
                              fontSize: "0.875rem",
                              color: "var(--text-primary)",
                              outline: "none"
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)" }}>RSVP Option</label>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              type="button"
                              onClick={() => setRsvpStatus("attending")}
                              style={{
                                flex: 1,
                                padding: "0.55rem",
                                fontSize: "0.8125rem",
                                fontWeight: 700,
                                borderRadius: "4px",
                                border: "1px solid",
                                borderColor: rsvpStatus === "attending" ? "var(--brand-black)" : "var(--border-secondary)",
                                background: rsvpStatus === "attending" ? "var(--brand-black)" : "transparent",
                                color: rsvpStatus === "attending" ? "white" : "var(--text-tertiary)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              Attending
                            </button>
                            <button
                              type="button"
                              onClick={() => setRsvpStatus("interested")}
                              style={{
                                flex: 1,
                                padding: "0.55rem",
                                fontSize: "0.8125rem",
                                fontWeight: 700,
                                borderRadius: "4px",
                                border: "1px solid",
                                borderColor: rsvpStatus === "interested" ? "var(--brand-black)" : "var(--border-secondary)",
                                background: rsvpStatus === "interested" ? "var(--brand-black)" : "transparent",
                                color: rsvpStatus === "interested" ? "white" : "var(--text-tertiary)",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              Interested
                            </button>
                          </div>
                        </div>

                        <button type="submit" disabled={submitting} className="button is-secondary" style={{ width: "100%", justifyContent: "center", display: "flex", marginTop: "0.5rem" }}>
                          {submitting ? "Registering..." : "Submit RSVP"}
                        </button>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Custom HTML5 Audio Player Component ── */
function AudioPlayer({ src, externalLink }: { src: string; externalLink: string | null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div style={{
      background: "var(--brand-black)",
      color: "white",
      padding: "1.5rem",
      borderRadius: "12px",
      marginTop: "2.5rem",
      boxShadow: "0 8px 16px rgba(0, 32, 91, 0.15)"
    }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.08em", color: "#C5A029" }}>Podcast Episode Player</span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)" }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={togglePlay}
          style={{
            background: "#C5A029",
            color: "white",
            border: "none",
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "1.1rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.15)",
            outline: "none"
          }}
          aria-label={isPlaying ? "Pause audio podcast" : "Play audio podcast"}
        >
          {isPlaying ? "||" : "▶"}
        </button>
        <div style={{ flex: 1, height: "4px", background: "rgba(255, 255, 255, 0.2)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
          <div style={{
            height: "100%",
            background: "#C5A029",
            width: `${duration ? (currentTime / duration) * 100 : 0}%`,
            transition: "width 0.1s"
          }} />
        </div>
        
        {externalLink && (
          <a href={externalLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "white", textDecoration: "none", borderLeft: "1px solid rgba(255, 255, 255, 0.2)", paddingLeft: "1rem" }}>
            <span>Listen on Spotify</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
