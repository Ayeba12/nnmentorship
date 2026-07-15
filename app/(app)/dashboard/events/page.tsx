"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, MapPin, Video, Headphones, Search, Plus, Edit, Trash2, Clock, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import type { Profile, AppEvent } from "@/lib/types";
import { api } from "@/lib/api";

export default function DashboardEventsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "my-rsvps" | "manage">("all");

  // Modal forms states
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AppEvent | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<"online" | "offline" | "podcast">("online");
  const [formVis, setFormVis] = useState<"public" | "private">("public");
  const [formDate, setFormDate] = useState("");
  const [formDuration, setFormDuration] = useState(60);
  const [formLocation, setFormLocation] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formAudio, setFormAudio] = useState("");
  const [formExternal, setFormExternal] = useState("");

  useEffect(() => {
    // Fetch profile and events
    const loadData = async () => {
      try {
        const userProfile = await api.profiles.me();
        setProfile(userProfile);

        const evs = await api.events.list();
        setEvents(evs);
      } catch (err) {
        console.error("Error loading events data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const refreshEvents = async () => {
    try {
      const evs = await api.events.list();
      setEvents(evs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDate) return;

    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDesc,
        event_type: formType,
        visibility: formVis,
        scheduled_at: new Date(formDate).toISOString(),
        duration_minutes: Number(formDuration),
        location: formType === "offline" ? formLocation : null,
        meeting_link: formType === "online" ? formLink : null,
        audio_url: formType === "podcast" ? formAudio : null,
        external_link: formType === "podcast" ? formExternal : null
      };

      await api.events.create(payload);
      setShowCreate(false);
      resetForm();
      await refreshEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to create event.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !formTitle || !formDate) return;

    setSaving(true);
    try {
      const payload = {
        title: formTitle,
        description: formDesc,
        event_type: formType,
        visibility: formVis,
        scheduled_at: new Date(formDate).toISOString(),
        duration_minutes: Number(formDuration),
        location: formType === "offline" ? formLocation : null,
        meeting_link: formType === "online" ? formLink : null,
        audio_url: formType === "podcast" ? formAudio : null,
        external_link: formType === "podcast" ? formExternal : null
      };

      await api.events.update(selectedEvent.id, payload);
      setShowEdit(false);
      setSelectedEvent(null);
      resetForm();
      await refreshEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to update event.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event? This action is permanent.")) return;

    try {
      await api.events.delete(eventId);
      await refreshEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to delete event.");
    }
  };

  const handleRSVP = async (eventId: number, status: "attending" | "interested") => {
    try {
      await api.events.rsvp(eventId, { status });
      await refreshEvents();
    } catch (err) {
      console.error(err);
      alert("Failed to save RSVP.");
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormDesc("");
    setFormType("online");
    setFormVis("public");
    setFormDate("");
    setFormDuration(60);
    setFormLocation("");
    setFormLink("");
    setFormAudio("");
    setFormExternal("");
  };

  const openEditModal = (event: AppEvent) => {
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormDesc(event.description || "");
    setFormType(event.event_type);
    setFormVis(event.visibility);
    
    // Format timestamp for datetime-local input
    const d = new Date(event.scheduled_at);
    const offset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - offset).toISOString().slice(0, 16);
    setFormDate(localISOTime);
    
    setFormDuration(event.duration_minutes || 60);
    setFormLocation(event.location || "");
    setFormLink(event.meeting_link || "");
    setFormAudio(event.audio_url || "");
    setFormExternal(event.external_link || "");
    setShowEdit(true);
  };

  const isAdmin = profile?.role === "admin";

  const myRsvps = events.filter(e => 
    e.registrations?.some(r => r.user_id === profile?.id)
  );

  const visibleEvents = activeTab === "my-rsvps" ? myRsvps : events;

  const filteredEvents = visibleEvents.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === "all" || e.event_type === selectedType;

    return matchesSearch && matchesType;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Events Directory</h1>
          <p className="text-sm text-navy-500 mt-1">Browse scheduled online trainings, physical gatherings, and audio podcasts.</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowCreate(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg transition-colors font-semibold text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create Event</span>
          </button>
        )}
      </div>

      {/* Tabs bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-navy-100/60 shadow-sm">
        <div className="flex gap-2 border-b sm:border-b-0 pb-2 sm:pb-0 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === "all" ? "bg-navy-600 text-white" : "text-navy-600 hover:bg-navy-50"}`}
          >
            All Events
          </button>
          <button
            onClick={() => setActiveTab("my-rsvps")}
            className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${activeTab === "my-rsvps" ? "bg-navy-600 text-white" : "text-navy-600 hover:bg-navy-50"}`}
          >
            My RSVPs ({myRsvps.length})
          </button>
        </div>

        <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
          {/* Search bar */}
          <div className="relative flex-1 sm:flex-none sm:w-60">
            <Search className="w-3.5 h-3.5 text-navy-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-navy-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400 bg-white"
            />
          </div>

          {/* Type filters */}
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs border border-navy-200 bg-white text-navy-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-navy-400"
          >
            <option value="all">All Types</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="podcast">Podcasts</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="text-center py-20 bg-white border border-navy-100 rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-navy-400 mt-3 font-medium">Synchronizing events feed...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-white border border-navy-100 rounded-2xl shadow-sm">
          <Calendar className="w-12 h-12 text-navy-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-navy-900">No events found</h3>
          <p className="text-sm text-navy-400 mt-1">There are no upcoming sessions match the selected query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(e => {
            const myRsvp = e.registrations?.find(r => r.user_id === profile?.id);
            const attendeesCount = e.registrations?.filter(r => r.status === 'attending').length || 0;

            return (
              <div key={e.id} className="bg-white border border-navy-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative">
                {/* Visual Header Strip */}
                <div className="p-4 pb-2 flex justify-between items-center">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    e.event_type === "online" ? "bg-blue-50 text-blue-700 border border-blue-100" :
                    e.event_type === "offline" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    {e.event_type === "online" && <Video className="w-3 h-3" />}
                    {e.event_type === "offline" && <MapPin className="w-3 h-3" />}
                    {e.event_type === "podcast" && <Headphones className="w-3 h-3" />}
                    {e.event_type}
                  </span>

                  <div className="flex items-center gap-1">
                    {e.visibility === "private" ? (
                      <span className="p-1 rounded bg-navy-50 text-navy-400" title="Private (logged-in users only)">
                        <EyeOff className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-navy-50 text-navy-400" title="Public (visible to everyone)">
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    )}

                    {isAdmin && (
                      <div className="flex gap-0.5">
                        <button
                          onClick={() => openEditModal(e)}
                          className="p-1 rounded hover:bg-navy-50 text-navy-500 hover:text-navy-700 transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(e.id)}
                          className="p-1 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body details */}
                <div className="p-5 pt-2 flex-1 flex flex-col">
                  <h3 className="font-bold text-navy-950 text-base leading-tight mb-2 hover:text-navy-800">
                    <Link href={`/dashboard/events/${e.id}`}>{e.title}</Link>
                  </h3>
                  
                  <p className="text-xs text-navy-500 leading-relaxed mb-4 flex-1">
                    {e.description && e.description.length > 120 ? `${e.description.substring(0, 120)}...` : e.description}
                  </p>

                  <div className="space-y-2 border-t border-navy-50 pt-3 mt-auto">
                    <div className="flex items-center gap-2 text-[11px] text-navy-400 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-navy-400" />
                      <span>{formatDate(e.scheduled_at)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-navy-400 font-medium">
                      <Clock className="w-3.5 h-3.5 text-navy-400" />
                      <span>{e.duration_minutes || 60} mins duration</span>
                    </div>

                    {e.event_type === "offline" && e.location && (
                      <div className="flex items-center gap-2 text-[11px] text-navy-400 font-medium truncate">
                        <MapPin className="w-3.5 h-3.5 text-navy-400" />
                        <span className="truncate">{e.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer RSVP Actions */}
                <div className="bg-navy-50/40 border-t border-navy-50 p-4 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-navy-400 font-semibold uppercase">
                    {attendeesCount} Registered
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleRSVP(e.id, "attending")}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                        myRsvp?.status === "attending" ? "bg-green-600 text-white" : "bg-white border border-navy-200 text-navy-600 hover:bg-navy-50"
                      }`}
                    >
                      Attending
                    </button>
                    <button
                      onClick={() => handleRSVP(e.id, "interested")}
                      className={`px-3 py-1 rounded text-[10px] font-bold transition-colors ${
                        myRsvp?.status === "interested" ? "bg-amber-600 text-white" : "bg-white border border-navy-200 text-navy-600 hover:bg-navy-50"
                      }`}
                    >
                      Interested
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-navy-100">
            <div className="bg-navy-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base">Create Scheduled Event</h3>
              <button onClick={() => setShowCreate(false)} className="text-white/60 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-navy-500 uppercase">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leadership Strategy Seminar"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Event Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Visibility</label>
                  <select
                    value={formVis}
                    onChange={e => setFormVis(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Duration (mins)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={e => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-navy-500 uppercase">Description</label>
                <textarea
                  placeholder="Outline details, objectives, or schedules..."
                  rows={3}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                />
              </div>

              {formType === "offline" && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Location / Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Naval Base Conference Room, Lagos"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                  />
                </div>
              )}

              {formType === "online" && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Meeting / Zoom URL</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://zoom.us/j/..."
                    value={formLink}
                    onChange={e => setFormLink(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                  />
                </div>
              )}

              {formType === "podcast" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-navy-500 uppercase">Audio Stream URL (MP3)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://domain.com/audio.mp3"
                      value={formAudio}
                      onChange={e => setFormAudio(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-navy-500 uppercase">Spotify/YouTube Link</label>
                    <input
                      type="url"
                      placeholder="e.g. https://spotify.com/..."
                      value={formExternal}
                      onChange={e => setFormExternal(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-navy-200 hover:bg-navy-50 rounded-lg font-semibold text-sm transition-colors text-navy-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Save Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-navy-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-navy-100">
            <div className="bg-navy-900 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-base">Modify Scheduled Event</h3>
              <button onClick={() => setShowEdit(false)} className="text-white/60 hover:text-white font-bold text-sm">✕</button>
            </div>
            
            <form onSubmit={handleEditEvent} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-navy-500 uppercase">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leadership Strategy Seminar"
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Event Type</label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Visibility</label>
                  <select
                    value={formVis}
                    onChange={e => setFormVis(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Duration (mins)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={e => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white text-navy-950"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-navy-500 uppercase">Description</label>
                <textarea
                  placeholder="Outline details, objectives, or schedules..."
                  rows={3}
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                />
              </div>

              {formType === "offline" && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Location / Venue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Naval Base Conference Room, Lagos"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                  />
                </div>
              )}

              {formType === "online" && (
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-navy-500 uppercase">Meeting / Zoom URL</label>
                  <input
                    type="url"
                    required
                    placeholder="e.g. https://zoom.us/j/..."
                    value={formLink}
                    onChange={e => setFormLink(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                  />
                </div>
              )}

              {formType === "podcast" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-navy-500 uppercase">Audio Stream (MP3) URL</label>
                    <input
                      type="url"
                      placeholder="e.g. https://domain.com/audio.mp3"
                      value={formAudio}
                      onChange={e => setFormAudio(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-navy-500 uppercase">Spotify/YouTube Link</label>
                    <input
                      type="url"
                      placeholder="e.g. https://spotify.com/..."
                      value={formExternal}
                      onChange={e => setFormExternal(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-400 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 border border-navy-200 hover:bg-navy-50 rounded-lg font-semibold text-sm transition-colors text-navy-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-navy-600 hover:bg-navy-700 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Update Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
