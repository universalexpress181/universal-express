"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Loader2, Search, User, Phone, 
  Package, X, Truck, Mail, Calendar, ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// The shape of our SQL View Data
type CustomerProfile = {
  id: string; 
  name: string;
  email: string;
  phone: string;
  joined_at: string; 
  company?: string; 
  address?: string;     
  total_shipments: number;
  total_spend: number; 
  last_active: string;
};

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

export default function UsersPage() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('admin_customers_view')
        .select('*')
        .order('joined_at', { ascending: false });

      if (error) {
        console.error("Error fetching customers:", error);
      } else if (data) {
        setCustomers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  // 🔍 Filter Logic
  const filtered = customers.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || "").includes(search) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalOrders = customers.reduce((acc, c) => acc + c.total_shipments, 0);

  return (
    <div className="flex relative h-[calc(100vh-100px)] overflow-hidden bg-gray-50 dark:bg-[#050b14] text-gray-900 dark:text-white transition-colors duration-500">
      
      {/* --- LEFT SIDE: MAIN LIST --- */}
      <div className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-8 transition-all duration-300 ${selectedCustomer ? 'w-full md:w-2/3 md:pr-6 hidden md:block' : 'w-full'}`}>
        
        {/* Header & Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 tracking-tight">
                Customer Database
                <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">Manage registered users and profiles.</p>
            </div>
            
            <div className="relative w-full md:w-72 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors" size={20} />
              <input 
                  type="text" 
                  placeholder="Search Name, Phone, Email..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111827] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm"
              />
            </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-6 rounded-3xl shadow-lg shadow-blue-500/20 relative overflow-hidden">
               <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
               <div className="flex items-center gap-3 mb-2 opacity-90"><User size={20}/> <span className="text-sm font-bold uppercase tracking-wider">Total Customers</span></div>
               <p className="text-4xl font-black relative z-10">{customers.length}</p>
            </div>
            <div className="bg-white dark:bg-[#0a101f] p-6 rounded-3xl border border-gray-200 dark:border-[#1e293b] shadow-sm relative overflow-hidden">
               <div className="flex items-center gap-3 mb-2 text-gray-500 dark:text-gray-400"><Package size={20}/> <span className="text-sm font-bold uppercase tracking-wider">Total Orders</span></div>
               <p className="text-4xl font-black text-gray-900 dark:text-white">{totalOrders}</p>
            </div>
        </div>

        {/* Table / List */}
        <div className="bg-white dark:bg-[#0a101f] rounded-3xl border border-gray-200 dark:border-[#1e293b] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800">
                <tr>
                    <th className="p-5 pl-6 font-bold text-gray-500 uppercase text-xs tracking-wider">Name</th>
                    <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider">Contact Info</th>
                    <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider">Activity</th>
                    <th className="p-5 font-bold text-gray-500 uppercase text-xs tracking-wider">Joined</th>
                    <th className="p-5 pr-6 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Action</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                    <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500"/></td></tr>
                ) : filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-500">No customers found.</td></tr>
                ) : (
                    filtered.map((c, idx) => (
                    <motion.tr 
                        key={idx} 
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        className={`group hover:bg-gray-50 dark:hover:bg-[#111827] transition-colors ${selectedCustomer?.id === c.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                    >
                        <td className="p-5 pl-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                 {c.name && c.name !== 'Unknown' ? c.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <p className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{c.name}</p>
                           </div>
                        </td>
                        <td className="p-5">
                           <div className="space-y-1.5">
                               <div className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                   <Mail size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors"/> {c.email}
                               </div>
                               <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                   <Phone size={14} className="group-hover:text-green-500 transition-colors"/> {c.phone}
                               </div>
                           </div>
                        </td>
                        <td className="p-5">
                           <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#111827] rounded-lg text-xs border border-gray-200 dark:border-gray-800">
                               <Package size={14} className="text-blue-500"/>
                               <span className="font-bold text-gray-900 dark:text-white">{c.total_shipments} Orders</span>
                           </div>
                        </td>
                        <td className="p-5 text-gray-500 text-xs font-medium">
                           {new Date(c.joined_at).toLocaleDateString()}
                        </td>
                        <td className="p-5 pr-6 text-right">
                            <button 
                                onClick={() => setSelectedCustomer(c)}
                                className="bg-white dark:bg-[#111827] hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-gray-200 dark:border-gray-700 hover:border-transparent shadow-sm flex items-center gap-2 ml-auto group/btn"
                            >
                                View 
                                <ChevronRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform"/>
                            </button>
                        </td>
                    </motion.tr>
                    ))
                )}
                </tbody>
            </table>
            </div>
        </div>
      </div>

      {/* --- RIGHT SIDE: DETAIL PANEL --- */}
      <AnimatePresence>
        {selectedCustomer && (
            <motion.div 
                initial={{ x: "100%" }} 
                animate={{ x: 0 }} 
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute inset-y-0 right-0 w-full md:w-[480px] bg-white dark:bg-[#0a101f] shadow-2xl border-l border-gray-200 dark:border-[#1e293b] z-50 flex flex-col"
            >
                 <CustomerDetailPanel customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// --- SUB-COMPONENT: DETAIL PANEL ---
function CustomerDetailPanel({ customer, onClose }: { customer: CustomerProfile, onClose: () => void }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            const { data } = await supabase
                .from('shipments')
                .select('*')
                .or(`user_id.eq.${customer.id},sender_phone.eq.${customer.phone}`)
                .order('created_at', { ascending: false });
            
            if (data) setHistory(data);
            setLoading(false);
        };
        fetchHistory();
    }, [customer]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#0a101f] text-gray-900 dark:text-white">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 dark:border-[#1e293b] flex justify-between items-start bg-gray-50 dark:bg-[#111827]">
                <div>
                    <h2 className="text-2xl font-black tracking-tight">{customer.name}</h2>
                    <div className="mt-3 space-y-2 text-sm text-gray-500 dark:text-gray-400">
                        <p className="flex items-center gap-2 font-medium"><Mail size={16} className="text-blue-500"/> {customer.email}</p>
                        <p className="flex items-center gap-2 font-medium"><Phone size={16} className="text-green-500"/> {customer.phone}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-gray-700 rounded-full text-gray-500 hover:text-red-500 transition-colors shadow-sm">
                    <X size={20}/>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-white dark:bg-[#0a101f]">
                
                {/* Stats */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#111827] dark:to-[#0f172a] border border-blue-100 dark:border-[#1e293b] flex justify-between items-center shadow-sm">
                    <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Lifetime Orders</p>
                        <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{customer.total_shipments}</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl text-blue-500 shadow-md">
                        <Package size={28}/>
                    </div>
                </div>

                {/* History List */}
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 text-gray-400"><Truck size={16}/> Shipment History</h3>
                    
                    {loading ? (
                        <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-500"/></div>
                    ) : history.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl text-gray-400">
                            No shipments found for this user.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {history.map(ship => (
                                <div key={ship.id} className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-[#1e293b] flex justify-between items-center hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-sm group">
                                    <div>
                                        <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm group-hover:underline">{ship.awb_code}</p>
                                        <div className="text-xs text-gray-500 mt-1.5 flex flex-col gap-1">
                                            <span className="flex items-center gap-1.5 font-medium"><Calendar size={12}/> {new Date(ship.created_at).toLocaleDateString()}</span>
                                            <span className="text-gray-400 dark:text-gray-500 truncate w-40">To: {ship.receiver_name}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md border ${
                                            ship.current_status === 'delivered' 
                                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/30' 
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                        }`}>
                                            {ship.current_status?.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}