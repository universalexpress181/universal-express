"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  Search, Filter, Package, Printer, 
  Eye, XCircle, Calendar, MapPin, IndianRupee, 
  Truck, CheckCircle, Clock, AlertTriangle, X,
  CreditCard, CalendarDays, Box 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    transition: { duration: 0.3 } 
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function MyOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  
  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all"); 
  const [customDate, setCustomDate] = useState(""); 
  
  // Side Panel State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // ⚡ PERFORMANCE: Select ONLY what we need
    const { data, error } = await supabase
      .from('shipments')
      .select('id, awb_code, created_at, receiver_name, receiver_city, receiver_phone, receiver_address, receiver_pincode, weight, payment_mode, cod_amount, declared_value, current_status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error(error);
    else setOrders(data || []);
    
    // Artificial small delay for smoothness
    setTimeout(() => setLoading(false), 300);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this shipment?")) return;

    const { error } = await supabase
        .from('shipments')
        .update({ current_status: 'cancelled' })
        .eq('id', orderId);

    if (error) {
        alert("Failed to cancel");
    } else {
        const updatedStatus = 'cancelled';
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, current_status: updatedStatus } : o));
        
        if (selectedOrder && selectedOrder.id === orderId) {
            setSelectedOrder({ ...selectedOrder, current_status: updatedStatus });
        }
    }
  };

  const handleDateFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setDateFilter(val);
      if (val === 'specific_date' && !customDate) {
          const today = new Date().toISOString().split('T')[0];
          setCustomDate(today);
      }
  };

  // 🔍 FILTER LOGIC
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
        order.awb_code.toLowerCase().includes(search.toLowerCase()) || 
        order.receiver_name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.current_status === statusFilter;

    let matchesDate = true;
    const orderDate = new Date(order.created_at);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (dateFilter === 'today') {
        matchesDate = orderDate >= today;
    } else if (dateFilter === 'last_7_days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        matchesDate = orderDate >= sevenDaysAgo;
    } else if (dateFilter === 'last_30_days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        matchesDate = orderDate >= thirtyDaysAgo;
    } else if (dateFilter === 'specific_date' && customDate) {
        const orderDateStr = orderDate.toLocaleDateString('en-CA');
        matchesDate = orderDateStr === customDate;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      exit="exit"
      variants={containerVariants}
      className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0 relative"
    >
        {/* ✨ Background Glows */}
        <div className="fixed top-20 right-20 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
        <div className="fixed bottom-20 left-20 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* 🟢 HEADER SECTION */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <Package size={24}/>
                </div>
                My Shipments
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium ml-1">
                Manage and track all your ongoing deliveries.
            </p>
        </div>
        <Link href="/seller/create">
            <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all duration-200"
            >
                <Package size={18}/> New Shipment
            </motion.button>
        </Link>
      </motion.div>

      {/* 🔍 FILTER BAR */}
      <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col md:flex-row gap-4">
        
        {/* 1. Search Box */}
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
            <input 
                type="text" 
                placeholder="Search by AWB or Customer..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-slate-900 dark:text-white placeholder-slate-400 text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        
        {/* 2. Date Dropdown */}
        <div className="relative w-full md:w-48">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
            <select 
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer text-slate-900 dark:text-white text-sm font-medium"
                value={dateFilter}
                onChange={handleDateFilterChange}
            >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Dates</option>
                <option value="today" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Today</option>
                <option value="last_7_days" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Last 7 Days</option>
                <option value="last_30_days" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Last 30 Days</option>
                <option value="specific_date" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Specific Date</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
        </div>

        {/* 3. DATE PICKER */}
        {dateFilter === 'specific_date' && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative w-full md:w-auto">
                <input 
                    type="date"
                    className="w-full md:w-40 pl-4 pr-2 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-white cursor-pointer text-sm font-medium [color-scheme:light] dark:[color-scheme:dark]"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                />
            </motion.div>
        )}

        {/* 4. Status Dropdown */}
        <div className="relative w-full md:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
            <select 
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer text-slate-900 dark:text-white text-sm font-medium"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">All Status</option>
                <option value="created" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Created</option>
                <option value="picked_up" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Picked Up</option>
                <option value="in_transit" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">In Transit</option>
                <option value="delivered" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Delivered</option>
                <option value="cancelled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">Cancelled</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
            </div>
        </div>
      </motion.div>

      {/* 📋 ORDERS LIST */}
      <motion.div layout className="space-y-4">
        <AnimatePresence mode="popLayout">
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <SkeletonRow key={`skeleton-${i}`} />
                ))
            ) : filteredOrders.length === 0 ? (
                <motion.div 
                    key="no-data"
                    variants={itemVariants} 
                    initial="hidden" animate="visible" exit="exit"
                    className="text-center py-24 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed backdrop-blur-sm"
                >
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                        <Search size={36}/>
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">No orders found</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Try adjusting your filters.</p>
                </motion.div>
            ) : (
                filteredOrders.map((order) => (
                    <motion.div 
                        layout 
                        key={order.id} 
                        variants={itemVariants}
                        initial="hidden" animate="visible" exit="exit"
                        whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-xl hover:shadow-blue-500/5 transition-all relative overflow-hidden"
                    >
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusColor(order.current_status)}`}></div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pl-2">
                            <div className="md:col-span-4 flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                    <Box size={22}/>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">AWB Number</p>
                                    <span className="font-mono font-bold text-lg text-slate-900 dark:text-white tracking-tight truncate block group-hover:text-blue-500 transition-colors">
                                        {order.awb_code}
                                    </span>
                                </div>
                            </div>

                            <div className="md:col-span-3">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate max-w-[150px]">{order.receiver_name}</h3>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap border border-slate-200 dark:border-slate-700">
                                        {order.weight} kg
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1"><MapPin size={12}/> {order.receiver_city}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(order.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-8">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">Payment</p>
                                    <div className="flex flex-col">
                                        <span className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${order.payment_mode === 'COD' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {order.payment_mode}
                                        </span>
                                        <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-sm">
                                            <IndianRupee size={12} className="text-slate-400"/> 
                                            {order.payment_mode === 'COD' ? order.cod_amount : order.declared_value}
                                        </span>
                                    </div>
                                </div>
                                <StatusBadge status={order.current_status} />
                            </div>

                            <div className="md:col-span-1 flex items-center justify-end gap-2">
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedOrder(order)}
                                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors" 
                                    title="Quick Track"
                                >
                                    <Eye size={20}/>
                                </motion.button>
                                <Link href={`/print/${order.awb_code}`} target="_blank">
                                    <motion.button whileTap={{ scale: 0.9 }} className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-colors" title="Print Label">
                                        <Printer size={20}/>
                                    </motion.button>
                                </Link>
                            </div>

                        </div>
                    </motion.div>
                ))
            )}
        </AnimatePresence>
      </motion.div>

      {/* 🟦 TRACKING SIDE PANEL (Drawer) */}
      <AnimatePresence>
        {selectedOrder && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    onClick={() => setSelectedOrder(null)}
                />
                
                <motion.div 
                    initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-slate-950 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800"
                >
                    <div className="p-6 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">Tracking Details</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">AWB: {selectedOrder.awb_code}</p>
                        </div>
                        <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white dark:bg-slate-950">
                        {/* ⚡ UPDATED: Removed "Public Page" Link, only Status Badge here */}
                        <div className="flex justify-center items-center bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                            <StatusBadge status={selectedOrder.current_status} />
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2"><Clock size={16} /> Timeline</h3>
                            <Timeline status={selectedOrder.current_status} />
                        </div>
                        <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-900">
                            <h3 className="text-sm font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2"><MapPin size={16} /> Delivery Info</h3>
                            <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl space-y-4 border border-slate-100 dark:border-slate-800">
                                <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Receiver</p><p className="font-bold text-slate-900 dark:text-white text-base">{selectedOrder.receiver_name}</p><p className="text-sm text-slate-500 dark:text-slate-400">{selectedOrder.receiver_phone}</p></div>
                                <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Address</p><p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{selectedOrder.receiver_address}</p></div>
                            </div>
                        </div>
                        {selectedOrder.current_status === 'created' ? (
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-900">
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-5 rounded-2xl">
                                    <h4 className="text-red-600 dark:text-red-400 font-bold flex items-center gap-2 text-sm"><AlertTriangle size={18}/> Cancel Shipment?</h4>
                                    <p className="text-xs text-red-500/80 dark:text-red-400/70 mt-2 mb-4 leading-relaxed">This order has not been picked up yet. You can cancel it now.</p>
                                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => handleCancelOrder(selectedOrder.id)} className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg shadow-red-500/20">Cancel Order</motion.button>
                                </div>
                            </div>
                        ) : selectedOrder.current_status === 'cancelled' ? (
                            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-xl text-center text-slate-500 text-sm font-medium border border-slate-200 dark:border-slate-800">🚫 This order was cancelled.</div>
                        ) : (
                            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl text-center text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-100 dark:border-blue-900/30">🔒 Cannot cancel: Order is already processing.</div>
                        )}
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function SkeletonRow() {
    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="h-28 w-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl animate-pulse"
        />
    );
}

function getStatusColor(status: string) {
    const colors: any = {
        created: "bg-blue-500", picked_up: "bg-orange-500", in_transit: "bg-purple-500", out_for_delivery: "bg-yellow-500", delivered: "bg-emerald-500", cancelled: "bg-red-500",
    };
    return colors[status] || "bg-slate-500";
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        created: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30",
        picked_up: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30",
        in_transit: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30",
        out_for_delivery: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30",
        delivered: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30",
        cancelled: "bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30",
    };
    const style = styles[status] || "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400";
    const label = status.replace(/_/g, " ");
    return <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${style}`}>{label}</span>;
}

function Timeline({ status }: { status: string }) {
    const steps = [
        { id: 'created', label: 'Order Created', icon: Package },
        { id: 'picked_up', label: 'Picked Up', icon: Truck },
        { id: 'in_transit', label: 'In Transit', icon: Clock },
        { id: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
        { id: 'delivered', label: 'Delivered', icon: CheckCircle },
    ];
    let activeIndex = steps.findIndex(s => s.id === status);
    if (status === 'cancelled') activeIndex = -1; 
    if (status === 'in_transit') activeIndex = 2;
    if (status === 'out_for_delivery') activeIndex = 3;

    return (
        <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-8 py-2">
            {status === 'cancelled' ? (
                <div className="ml-6 flex items-center gap-3 text-red-500"><XCircle size={20}/> <span className="font-bold">Order Cancelled</span></div>
            ) : (
                steps.map((step, index) => {
                    const isCompleted = index <= activeIndex;
                    const isCurrent = index === activeIndex;
                    return (
                        <div key={step.id} className="relative ml-6">
                            <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 transition-all duration-300 ${isCompleted ? "bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" : "bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700"}`}></div>
                            <div className={`flex items-center gap-3 transition-opacity duration-300 ${isCompleted ? "opacity-100" : "opacity-40"}`}>
                                <step.icon size={18} className={isCompleted ? "text-blue-500" : "text-slate-400"}/>
                                <div><p className={`text-sm font-bold ${isCurrent ? "text-blue-500" : "text-slate-900 dark:text-white"}`}>{step.label}</p>{isCurrent && <p className="text-[10px] text-blue-500 font-medium animate-pulse">Current Status</p>}</div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}