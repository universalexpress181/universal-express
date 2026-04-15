"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Bell, Package, X, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();

    // 🚀 LISTEN FOR REAL-TIME NEW BOOKINGS
    const channel = supabase
      .channel('admin_notifications_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_notifications' }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllRead = async () => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // 🚀 NEW: Clear Single Notification
  const clearNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents marking as read when clicking the X
    await supabase.from("admin_notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // 🚀 NEW: Clear All Notifications
  const clearAllNotifications = async () => {
    const ids = notifications.map(n => n.id);
    if (ids.length > 0) {
      await supabase.from("admin_notifications").delete().in("id", ids);
      setNotifications([]);
    }
  };

  return (
    <div className="relative z-50">
      {/* BELL BUTTON */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
      >
        <Bell size={20} className="text-slate-600 dark:text-slate-300" />
        {unreadCount > 0 && (
          <motion.span 
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800"
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      {/* DROPDOWN PANEL */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                
                <div className="flex items-center gap-3">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button onClick={clearAllNotifications} className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1">
                      <Trash2 size={12} /> Clear all
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm font-medium flex flex-col items-center gap-2">
                    <Bell size={24} className="opacity-20" />
                    No new notifications.
                  </div>
                ) : (
                  <AnimatePresence>
                    {notifications.map((notif) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`relative p-4 border-b border-gray-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors flex gap-3 group ${notif.is_read ? 'opacity-60' : 'bg-blue-50/30 dark:bg-blue-900/10'}`}
                      >
                        <div className="mt-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Package size={16} />
                          </div>
                        </div>
                        <div className="flex-1 pr-6">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{notif.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notif.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>}

                        {/* SINGLE CLEAR BUTTON (Appears on hover) */}
                        <button 
                          onClick={(e) => clearNotification(e, notif.id)}
                          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}