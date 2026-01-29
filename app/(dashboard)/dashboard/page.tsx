"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Package, Truck, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardOverview() {
  const [stats, setStats] = useState({ total: 0, active: 0, delivered: 0 });
  const [recentShipments, setRecentShipments] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Get Stats
      const { data: all } = await supabase
        .from('shipments')
        .select('current_status')
        .eq('user_id', user.id);

      if (all) {
        setStats({
          total: all.length,
          active: all.filter(s => s.current_status !== 'delivered').length,
          delivered: all.filter(s => s.current_status === 'delivered').length,
        });
      }

      // 2. Get Recent 5 Shipments
      const { data: recent } = await supabase
        .from('shipments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (recent) setRecentShipments(recent);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title: Dark text on light mode, White text on dark mode */}
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
        Dashboard Overview
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total Bookings Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-4 rounded-full text-blue-600 dark:text-blue-400">
            <Package size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase">Total Bookings</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</h3>
          </div>
        </div>

        {/* Active Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 dark:bg-orange-900/50 p-4 rounded-full text-orange-600 dark:text-orange-400">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase">Active / In-Transit</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.active}</h3>
          </div>
        </div>

        {/* Delivered Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 dark:bg-green-900/50 p-4 rounded-full text-green-600 dark:text-green-400">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase">Delivered</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.delivered}</h3>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Recent Shipments</h3>
          <Link href="/dashboard/history" className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
            View All &rarr;
          </Link>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {recentShipments.map((s) => (
            <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded-lg text-slate-500 dark:text-slate-400">
                  <Truck size={18} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{s.awb_code}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{s.receiver_name}</p>
                </div>
              </div>
              <span className="text-xs font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">
                {s.current_status}
              </span>
            </div>
          ))}
          {recentShipments.length === 0 && (
            <div className="p-6 text-center text-slate-500 dark:text-slate-400">
              No active shipments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}