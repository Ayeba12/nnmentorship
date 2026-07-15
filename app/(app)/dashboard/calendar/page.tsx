"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, Video, MapPin, Headphones, Clock, ArrowRight } from "lucide-react";
import type { AppEvent } from "@/lib/types";
import { api } from "@/lib/api";

export default function DashboardCalendarPage() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const evs = await api.events.list();
        setEvents(evs);
      } catch (err) {
        console.error("Error loading events for calendar:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const daysArray: (Date | null)[] = [];
  // Padded blank spaces at the start of the grid
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }

  const getEventsForDay = (day: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.scheduled_at);
      return eDate.getFullYear() === day.getFullYear() &&
        eDate.getMonth() === day.getMonth() &&
        eDate.getDate() === day.getDate();
    });
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Calendar Schedule</h1>
          <p className="text-sm text-navy-500 mt-1">Track and manage your upcoming webinars, meetings, and podcasts.</p>
        </div>
        <Link
          href="/dashboard/events"
          className="flex items-center gap-1.5 text-xs font-bold text-navy-600 hover:text-navy-800 transition-colors"
        >
          <span>List View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Calendar Header Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-navy-100/60 shadow-sm">
        <h2 className="text-lg font-bold text-navy-950 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-navy-600" />
          <span>{monthNames[month]} {year}</span>
        </h2>

        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="p-2 border border-navy-200 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1.5 border border-navy-200 rounded-lg hover:bg-navy-50 text-navy-600 text-xs font-bold transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 border border-navy-200 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors"
            aria-label="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 bg-white border border-navy-100 rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-4 border-navy-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-navy-400 mt-3 font-medium">Loading calendar schedules...</p>
        </div>
      ) : (
        <div className="bg-white border border-navy-100 rounded-xl shadow-sm overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-navy-100 bg-navy-50/50">
            {dayNames.map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-navy-500 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 grid-rows-5 auto-rows-fr border-r border-b border-navy-100">
            {daysArray.map((day, index) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="border-l border-t border-navy-100 bg-navy-50/10 min-h-[100px] p-2"
                  />
                );
              }

              const dayEvents = getEventsForDay(day);
              const isToday = new Date().toDateString() === day.toDateString();

              return (
                <div
                  key={`day-${day.getDate()}`}
                  className={`border-l border-t border-navy-100 min-h-[100px] p-2 flex flex-col hover:bg-navy-50/30 transition-colors ${
                    isToday ? "bg-blue-50/20" : ""
                  }`}
                >
                  {/* Date Number */}
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                      isToday ? "bg-navy-600 text-white" : "text-navy-700"
                    }`}>
                      {day.getDate()}
                    </span>
                  </div>

                  {/* Day Events list */}
                  <div className="flex-1 space-y-1 overflow-y-auto scrollbar-none">
                    {dayEvents.map(e => (
                      <Link
                        key={e.id}
                        href={`/dashboard/events/${e.id}`}
                        className={`block p-1 text-[10px] rounded border truncate font-medium transition-colors ${
                          e.event_type === "online" ? "bg-blue-50 text-blue-800 border-blue-100 hover:bg-blue-100" :
                          e.event_type === "offline" ? "bg-amber-50 text-amber-800 border-amber-100 hover:bg-amber-100" :
                          "bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100"
                        }`}
                        title={`${e.title} (${e.event_type})`}
                      >
                        {e.title}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
