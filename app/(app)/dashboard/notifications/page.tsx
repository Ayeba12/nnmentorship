"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { Bell, UserPlus, Calendar, BookOpen, ShieldCheck, Check, Trash2, Megaphone } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface NotificationItem {
  id: string;
  type: 'request' | 'session' | 'course' | 'system' | 'announcement';
  title: string;
  message: string;
  time: string;
  read: boolean;
  link: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await api.notifications.list();
      setNotifications(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => api.notifications.markRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.notifications.remove(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'request': return <UserPlus className="w-4 h-4 text-amber-600" />;
      case 'session': return <Calendar className="w-4 h-4 text-green-600" />;
      case 'course': return <BookOpen className="w-4 h-4 text-blue-600" />;
      case 'system': return <ShieldCheck className="w-4 h-4 text-navy-600" />;
      case 'announcement': return <Megaphone className="w-4 h-4 text-gold-600" />;
      default: return <Bell className="w-4 h-4 text-navy-400" />;
    }
  };

  const getBgClass = (type: NotificationItem['type']) => {
    switch (type) {
      case 'request': return 'bg-amber-50';
      case 'session': return 'bg-green-50';
      case 'course': return 'bg-blue-50';
      case 'system': return 'bg-navy-50';
      case 'announcement': return 'bg-gold-50';
      default: return 'bg-navy-50/50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-navy-100 skeleton rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 w-full bg-white border border-navy-100 rounded-lg p-4 space-y-2">
              <div className="h-4 w-1/4 bg-navy-50 skeleton rounded" />
              <div className="h-3 w-3/4 bg-navy-50 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-navy-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-navy-400 mt-1">
            You have {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''} in your naval inbox.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead} className="text-xs font-semibold self-start">
            <Check className="w-3.5 h-3.5 mr-1.5" /> Mark All as Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-12 h-12 rounded-full bg-navy-50 flex items-center justify-center text-navy-400 mb-3">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-navy-800 text-sm">Naval Inbox Clear</h3>
          <p className="text-xs text-navy-400 mt-1 max-w-sm mx-auto">
            You have no system alerts or notifications at this time. Check back later.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card
              key={n.id}
              className={`p-4 transition-all duration-200 border border-navy-100 hover:shadow-soft flex items-start gap-4 bg-white relative ${
                !n.read ? 'ring-1 ring-navy-200/50 bg-navy-50/5' : ''
              }`}
            >
              {/* Type icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${getBgClass(n.type)}`}>
                {getIcon(n.type)}
              </div>

              {/* Text content */}
              <div className="min-w-0 flex-1 pr-12">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className={`font-semibold text-sm ${!n.read ? 'text-navy-900' : 'text-navy-700'}`}>{n.title}</h3>
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-navy-600" title="Unread" />
                  )}
                </div>
                <p className="text-xs text-navy-500 mt-1">{n.message}</p>
                
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] text-navy-400 font-medium">
                    {new Date(n.time).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {n.link && (
                    <Link href={n.link} className="text-[10px] text-navy-600 hover:text-navy-800 font-semibold underline">
                      View Details
                    </Link>
                  )}
                </div>
              </div>

              {/* Actions panel */}
              <div className="absolute right-4 top-4 flex items-center gap-1">
                {!n.read && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    className="p-1 rounded hover:bg-navy-50 text-navy-400 hover:text-navy-600 transition-colors"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(n.id)}
                  className="p-1 rounded hover:bg-red-50 text-navy-400 hover:text-red-600 transition-colors"
                  title="Delete alert"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
