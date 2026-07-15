"use client";

import React, { useEffect, useState, use, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin, Video, Headphones, Download, ExternalLink, ShieldAlert, User, UserCheck, Users, Mail, Check } from "lucide-react";
import type { Profile, AppEvent, EventRegistration } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DashboardEventDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [event, setEvent] = useState<AppEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    const loadData = async () => {
      try {
        const userProfile = await api.profiles.me();
        setProfile(userProfile);

        const ev = await api.events.get(Number(id));
        setEvent(ev);
      } catch (err) {
        console.error("Error loading event detail:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const refreshEvent = async () => {
    try {
      const ev = await api.events.get(Number(id));
      setEvent(ev);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRSVP = async (status: "attending" | "interested") => {
    setSubmitting(true);
    try {
      await api.events.rsvp(Number(id), { status });
      await refreshEvent();
    } catch (err) {
      console.error(err);
      alert("Failed to submit RSVP.");
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
      <div className="text-center py-20">
        <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-sm text-navy-400 mt-3 font-medium">Loading event specs...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20 max-w-md mx-auto">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-navy-900">Event Not Found</h2>
        <p className="text-sm text-navy-400 mt-2">The scheduled session you requested does not exist or has been removed.</p>
        <Link href="/dashboard/events" className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>
      </div>
    );
  }

  const isPast = new Date(event.scheduled_at).getTime() < Date.now();
  const myRsvp = event.registrations?.find(r => r.user_id === profile?.id);
  const registrations = event.registrations || [];

  const attendingList = registrations.filter(r => r.status === "attending");
  const interestedList = registrations.filter(r => r.status === "interested");

  const isAdmin = profile?.role === "admin";

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back link */}
      <Link href="/dashboard/events" className="inline-flex items-center gap-2 text-xs font-bold text-navy-600 hover:text-navy-800 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Events Directory</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Event Sheet */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-navy-100/80 rounded-xl p-6 sm:p-8 shadow-sm">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              event.event_type === "online" ? "bg-blue-50 text-blue-700 border border-blue-100" :
              event.event_type === "offline" ? "bg-amber-50 text-amber-700 border border-amber-100" :
              "bg-emerald-50 text-emerald-700 border border-emerald-100"
            }`}>
              {event.event_type === "online" && <Video className="w-3 h-3" />}
              {event.event_type === "offline" && <MapPin className="w-3 h-3" />}
              {event.event_type === "podcast" && <Headphones className="w-3 h-3" />}
              {event.event_type}
            </span>

            <h1 className="text-xl sm:text-2xl font-bold text-navy-950 mt-4 leading-tight">{event.title}</h1>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-navy-50/40 p-4 rounded-lg my-6 text-xs border border-navy-50">
              <div className="flex gap-2">
                <Calendar className="w-4 h-4 text-navy-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-navy-400 uppercase tracking-wider text-[9px]">Date & Time</h4>
                  <p className="font-semibold text-navy-900 mt-0.5">{formatDate(event.scheduled_at)}</p>
                  <p className="text-navy-400 mt-0.5">{event.duration_minutes || 60} mins duration</p>
                </div>
              </div>

              {event.event_type === "offline" && event.location && (
                <div className="flex gap-2">
                  <MapPin className="w-4 h-4 text-navy-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-navy-400 uppercase tracking-wider text-[9px]">Physical Location</h4>
                    <p className="font-semibold text-navy-900 mt-0.5">{event.location}</p>
                  </div>
                </div>
              )}

              {event.event_type === "online" && (
                <div className="flex gap-2">
                  <Video className="w-4 h-4 text-navy-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-navy-400 uppercase tracking-wider text-[9px]">Webinar</h4>
                    <p className="font-semibold text-navy-900 mt-0.5">Online Meeting Session</p>
                  </div>
                </div>
              )}
              {event.event_type === "podcast" && (
                <div className="flex gap-2">
                  <Headphones className="w-4 h-4 text-navy-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-bold text-navy-400 uppercase tracking-wider text-[9px]">Podcast</h4>
                    <p className="font-semibold text-navy-900 mt-0.5">Audio Episode Release</p>
                  </div>
                </div>
              )}
            </div>

            {/* Neomorphic Countdown Timer or Live Join Button */}
            {mounted && (
              <div className="my-6">
                {eventStatus === "upcoming" && (
                  <div style={{
                    background: "#e0e5ec",
                    borderRadius: "16px",
                    padding: "1.5rem",
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
                            fontSize: "1.5rem",
                            fontWeight: "bold",
                            color: "#0f205b",
                            background: "#e0e5ec",
                            borderRadius: "12px",
                            boxShadow: "inset 3px 3px 6px #b8b9be, inset -3px -3px 6px #fff",
                            padding: "0.5rem 1rem",
                            minWidth: "65px",
                            textAlign: "center"
                          }}>
                            {String(item.val).padStart(2, "0")}
                          </div>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {eventStatus === "live" && (
                  <div style={{
                    background: "#e0e5ec",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    boxShadow: "9px 9px 16px rgba(163, 177, 198, 0.4), -9px -9px 16px rgba(255, 255, 255, 0.8)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem"
                  }}>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-green-700 uppercase tracking-wider">
                      <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse" />
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
                          padding: "0.75rem 2rem",
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
                          padding: "0.75rem 2rem",
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
                      <div className="text-center">
                        <p className="text-xs text-navy-800 mb-2">
                          Physical Location: <strong className="text-navy-950">{event.location}</strong>
                        </p>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: "#e0e5ec",
                            borderRadius: "12px",
                            boxShadow: "6px 6px 12px rgba(163, 177, 198, 0.4), -6px -6px 12px rgba(255, 255, 255, 0.8)",
                            padding: "0.75rem 2rem",
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
                  <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 text-center text-gray-500">
                    <h3 className="text-sm font-bold text-gray-700">Event Completed</h3>
                    <p className="text-xs mt-1">This scheduled training session or webinar has ended.</p>
                  </div>
                )}
              </div>
            )}

            <div className="rich-text text-sm text-navy-800 leading-relaxed space-y-4">
              <p className="white-space-pre-line">{event.description}</p>
            </div>

            {/* Audio podcast embedded player */}
            {event.event_type === "podcast" && event.audio_url && (
              <AudioPlayer src={event.audio_url} externalLink={event.external_link} />
            )}

            {/* Event Links visible after registration or when live */}
            {mounted && eventStatus !== "completed" && (myRsvp?.status === "attending" || eventStatus === "live") && (
              <div className="mt-6 p-4 bg-navy-50/20 border border-navy-100 rounded-lg space-y-3">
                <h4 className="font-bold text-navy-950 text-xs uppercase tracking-wider">Access Details</h4>
                {event.event_type === "online" && event.meeting_link && (
                  <div className="flex flex-wrap items-center justify-between text-xs gap-3">
                    <span className="text-navy-600">Online Meeting Link:</span>
                    <a
                      href={event.meeting_link ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                    >
                      <span>Join Live Zoom/Online Session</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                {event.event_type === "podcast" && (event.external_link || event.audio_url) && (
                  <div className="flex flex-wrap items-center justify-between text-xs gap-3">
                    <span className="text-navy-600">Podcast External Stream:</span>
                    <a
                      href={(event.external_link || event.audio_url) ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 hover:underline font-bold"
                    >
                      <span>Listen on Spotify / Stream URL</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
                {event.event_type === "offline" && event.location && (
                  <div className="flex flex-wrap items-center justify-between text-xs gap-3">
                    <span className="text-navy-600">Google Maps Navigation:</span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-700 hover:underline font-bold"
                    >
                      <span>Get Directions on Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Join / Attend CTA */}
            {mounted && eventStatus !== "completed" && (
              <div className="mt-6 p-4 bg-navy-50/30 border border-navy-100 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-bold text-navy-900 text-sm">Ready to Attend?</h4>
                  <p className="text-navy-450 text-xs mt-1">Check in with your details to access the event link, podcast, or location maps.</p>
                </div>
                <Button
                  onClick={() => {
                    if (profile) {
                      setJoinName(profile.full_name || "");
                      setJoinEmail(profile.email || "");
                    }
                    setShowJoinModal(true);
                  }}
                  className="bg-navy-900 hover:bg-navy-950 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex-shrink-0"
                >
                  Join / Attend Event
                </Button>
              </div>
            )}

            {/* Join/Check-in Modal */}
            {showJoinModal && (
              <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-white border border-navy-100 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy-950">Confirm Attendance</h3>
                    <p className="text-xs text-navy-400 mt-1">Please confirm your name and email to attend this event and retrieve the access links.</p>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmitting(true);
                    try {
                      // Register as Attending
                      await api.events.rsvp(Number(id), { status: "attending" });
                      await refreshEvent();
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
                    } catch (err) {
                      console.error(err);
                      alert("Failed to confirm attendance.");
                    } finally {
                      setSubmitting(false);
                    }
                  }} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-navy-400 uppercase">Your Name</label>
                      <input
                        type="text"
                        required
                        value={joinName}
                        onChange={e => setJoinName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg bg-navy-50/20 text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-navy-400 uppercase">Email Address</label>
                      <input
                        type="email"
                        required
                        value={joinEmail}
                        onChange={e => setJoinEmail(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg bg-navy-50/20 text-navy-950 focus:outline-none focus:ring-2 focus:ring-navy-400"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowJoinModal(false)}
                        className="flex-1 py-2 border border-navy-200 hover:bg-navy-50 text-navy-700 font-bold rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 py-2 bg-navy-900 hover:bg-navy-950 text-white font-bold rounded-lg text-xs transition-colors"
                      >
                        {submitting ? "Checking in..." : "Confirm & Join"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ICS Sync footer block */}
            <div className="mt-8 pt-4 border-t border-navy-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <button
                onClick={downloadICS}
                className="flex items-center gap-2 px-3 py-1.5 border border-navy-200 hover:bg-navy-50 text-navy-700 text-xs font-bold rounded-lg transition-colors bg-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Sync to Calendar (.ics)</span>
              </button>

              <span className="text-[11px] text-navy-400 font-semibold uppercase tracking-wider">
                Visibility: {event.visibility}
              </span>
            </div>
          </div>

          {/* Attendee Registrations Registry */}
          <div className="bg-white border border-navy-100/80 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-navy-50 pb-3">
              <h3 className="font-bold text-navy-950 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-navy-500" />
                <span>Registered Attendees ({registrations.length})</span>
              </h3>
            </div>

            {registrations.length === 0 ? (
              <p className="text-xs text-navy-400 italic py-4 text-center">No registrations yet. Be the first to RSVP!</p>
            ) : (
              <div className="space-y-4">
                {/* Attending Section */}
                {attendingList.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-2">Attending ({attendingList.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attendingList.map(r => (
                        <div key={r.id} className="flex items-center justify-between gap-3 p-2 bg-navy-50/20 border border-navy-100/20 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 text-[10px] font-bold flex-shrink-0">
                              {r.user ? r.user.full_name.charAt(0) : (r.guest_name || "G").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-navy-900 truncate">
                                {r.user ? `${r.user.rank ? `${r.user.rank} ` : ""}${r.user.full_name}` : `${r.guest_name} (Guest)`}
                              </p>
                              {r.user?.role && (
                                <p className="text-[9px] text-navy-400 capitalize">{r.user.role.replace("_", " ")}</p>
                              )}
                            </div>
                          </div>
                          
                          {isAdmin && (r.user?.email || r.guest_email) && (
                            <a
                              href={`mailto:${r.user ? r.user.email : r.guest_email}`}
                              className="text-navy-400 hover:text-navy-700 p-1 rounded"
                              title={r.user ? r.user.email : r.guest_email || ""}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interested Section */}
                {interestedList.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-2">Interested ({interestedList.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {interestedList.map(r => (
                        <div key={r.id} className="flex items-center justify-between gap-3 p-2 bg-navy-50/20 border border-navy-100/20 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 text-[10px] font-bold flex-shrink-0">
                              {r.user ? r.user.full_name.charAt(0) : (r.guest_name || "G").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-navy-900 truncate">
                                {r.user ? `${r.user.rank ? `${r.user.rank} ` : ""}${r.user.full_name}` : `${r.guest_name} (Guest)`}
                              </p>
                              {r.user?.role && (
                                <p className="text-[9px] text-navy-400 capitalize">{r.user.role.replace("_", " ")}</p>
                              )}
                            </div>
                          </div>
                          
                          {isAdmin && (r.user?.email || r.guest_email) && (
                            <a
                              href={`mailto:${r.user ? r.user.email : r.guest_email}`}
                              className="text-navy-400 hover:text-navy-700 p-1"
                              title={r.user ? r.user.email : r.guest_email || ""}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar RSVP Box */}
        {!isPast && (
          <div className="bg-white border border-navy-100/80 rounded-xl p-6 shadow-sm h-fit space-y-4">
            <h3 className="font-bold text-navy-950 text-sm flex items-center gap-1.5 border-b border-navy-50 pb-2">
              <UserCheck className="w-4 h-4 text-navy-500" />
              <span>Your RSVP Status</span>
            </h3>

            {myRsvp ? (
              <div className="p-3 bg-green-50/50 border border-green-100 rounded-lg text-xs">
                <p className="text-green-800 font-bold">
                  You are registered as: <span className="uppercase">{myRsvp.status}</span>
                </p>
                <p className="text-navy-400 mt-1 text-[10px]">Registered on: {new Date(myRsvp.created_at).toLocaleDateString()}</p>
              </div>
            ) : (
              <p className="text-xs text-navy-500 leading-relaxed">
                You have not registered for this session yet. RSVP below to confirm attendance.
              </p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={() => handleRSVP("attending")}
                disabled={submitting}
                className={`w-full py-2 text-xs font-bold rounded-lg border transition-colors ${
                  myRsvp?.status === "attending" ? "bg-green-600 border-green-600 text-white hover:bg-green-700" : "bg-white border-navy-200 text-navy-700 hover:bg-navy-50"
                }`}
              >
                {myRsvp?.status === "attending" && <Check className="w-3.5 h-3.5 inline mr-1" />}
                I am Attending
              </Button>

              <Button
                onClick={() => handleRSVP("interested")}
                disabled={submitting}
                className={`w-full py-2 text-xs font-bold rounded-lg border transition-colors ${
                  myRsvp?.status === "interested" ? "bg-amber-600 border-amber-600 text-white hover:bg-amber-700" : "bg-white border-navy-200 text-navy-700 hover:bg-navy-50"
                }`}
              >
                {myRsvp?.status === "interested" && <Check className="w-3.5 h-3.5 inline mr-1" />}
                I am Interested
              </Button>
            </div>
          </div>
        )}
      </div>
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
      background: "var(--brand-blue-900)",
      color: "white",
      padding: "1.5rem",
      borderRadius: "12px",
      marginTop: "2.5rem",
      boxShadow: "0 8px 16px rgba(10, 37, 64, 0.15)"
    }}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 800, letterSpacing: "0.08em", color: "#10b981" }}>Podcast Episode Player</span>
        <span style={{ fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.6)" }}>{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <button
          onClick={togglePlay}
          style={{
            background: "#10b981",
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
          aria-label={isPlaying ? "Pause podcast stream" : "Play podcast stream"}
        >
          {isPlaying ? "||" : "▶"}
        </button>
        <div style={{ flex: 1, height: "4px", background: "rgba(255, 255, 255, 0.2)", borderRadius: "2px", overflow: "hidden", position: "relative" }}>
          <div style={{
            height: "100%",
            background: "#10b981",
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
