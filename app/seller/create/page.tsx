"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { generateProfessionalAWB } from "@/lib/awbGenerator";
import { 
  Truck, User, MapPin, Package, Loader2, ArrowRight, IndianRupee, X, Edit2, CheckCircle, Box, Zap 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🌈 DYNAMIC INPUT STYLES
const getBaseInputClass = (focusColor: string) => `
  w-full bg-white/50 dark:bg-slate-900/50 
  border border-slate-200 dark:border-slate-800 
  text-slate-900 dark:text-white 
  rounded-2xl p-3.5 
  outline-none 
  transition-all duration-300 
  placeholder-slate-400 dark:placeholder-slate-500 
  text-sm font-bold backdrop-blur-md
  focus:bg-white dark:focus:bg-slate-900
  focus:ring-2 focus:border-transparent
  ${focusColor}
`;

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4 } }
};

export default function CreateShipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // ⚡ Removed blocking 'initializing' state for instant render

  // --- SENDER STATE ---
  const [isCustomPickup, setIsCustomPickup] = useState(false);
  const [senderData, setSenderData] = useState({
    name: "", phone: "", email: "", 
    address: "", city: "Mumbai", state: "Maharashtra", pincode: "400001"
  });

  // --- RECEIVER & PACKAGE STATE ---
  const [formData, setFormData] = useState({
    receiver_name: "", receiver_phone: "", receiver_address: "",
    receiver_city: "", receiver_state: "", receiver_pincode: "",
    package_type: "Standard Box", 
    weight: "",
    payment_mode: "Prepaid", 
    declared_value: ""
  });

  useEffect(() => {
    const initData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.replace("/login");

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (profile) {
            setSenderData({
                name: profile.business_name || profile.full_name || "",
                phone: profile.phone || "",
                email: profile.email || "",
                address: profile.address || "",
                city: "Mumbai", state: "Maharashtra", pincode: "400001"
            });
        }
    };
    initData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (!formData.receiver_name || !formData.receiver_address || !formData.weight) {
        alert("⚠️ Please fill all required receiver and package details.");
        setLoading(false);
        return;
    }

    if (formData.payment_mode === "COD" && (!formData.declared_value || Number(formData.declared_value) <= 0)) {
        alert("⚠️ For COD shipments, please enter the Amount to Collect.");
        setLoading(false);
        return;
    }

    try {
      const awb = generateProfessionalAWB();
      
      const { error } = await supabase.from('shipments').insert({
        user_id: user.id,
        awb_code: awb,
        created_at: new Date().toISOString(),
        sender_name: senderData.name, sender_phone: senderData.phone, sender_email: senderData.email,
        sender_address: senderData.address, sender_city: senderData.city, sender_state: senderData.state, sender_pincode: senderData.pincode,
        receiver_name: formData.receiver_name, receiver_phone: formData.receiver_phone,
        receiver_address: formData.receiver_address, receiver_city: formData.receiver_city, receiver_state: formData.receiver_state, receiver_pincode: formData.receiver_pincode,
        weight: parseFloat(formData.weight) || 0.5, 
        package_type: formData.package_type,
        payment_mode: formData.payment_mode,
        cod_amount: formData.payment_mode === "COD" ? (Number(formData.declared_value) || 0) : 0,
        declared_value: Number(formData.declared_value) || 0,
        cod_fee: 0, base_fee: 0, tax_amount: 0, cost: 0, 
        current_status: "created", payment_status: "paid" 
      });

      if (error) throw error;

      alert(`✅ Shipment Booked Successfully!\nAWB: ${awb}`);
      router.push("/seller/shipments");

    } catch (err: any) {
      alert("Booking Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden" 
      animate="visible" 
      variants={containerVariants}
      className="max-w-6xl mx-auto pb-20 px-4 md:px-0 relative"
    >
      
      {/* 🌈 Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
      </div>

      {/* 🟢 HEADER SECTION */}
      <motion.div variants={itemVariants} className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
                    Create Shipment
                </span>
                <span className="text-2xl animate-pulse">⚡</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                New Order Entry
            </p>
        </div>
        <div className="hidden md:block">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">System Active</span>
            </div>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        
        {/* 📝 LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
            
            {/* 📍 CARD 1: PICKUP (BLUE THEME) */}
            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-blue-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                 
                 <div className="flex justify-between items-center mb-6 pl-2">
                    <h3 className="text-sm font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest flex items-center gap-2">
                        <MapPin size={20} className="fill-blue-500/20"/> Pickup Location
                    </h3>
                    <motion.button 
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsCustomPickup(!isCustomPickup)}
                        className={`text-xs font-extrabold px-4 py-2 rounded-full flex items-center gap-2 transition-all ${isCustomPickup ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                    >
                        {isCustomPickup ? <><X size={14}/> Cancel</> : <><Edit2 size={14}/> Change</>}
                    </motion.button>
                 </div>

                 <AnimatePresence mode="wait">
                    {!isCustomPickup ? (
                        <motion.div 
                            key="default"
                            initial={{ opacity: 0, height: 0 }} 
                            animate={{ opacity: 1, height: "auto" }} 
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-gradient-to-br from-slate-50 to-blue-50/50 dark:from-slate-950 dark:to-slate-900 p-5 rounded-2xl flex items-center gap-5 border border-slate-200 dark:border-slate-800"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <User size={24}/>
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white text-lg">{senderData.name || "My Business"}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{senderData.address}, {senderData.city}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="custom"
                            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="grid md:grid-cols-2 gap-5 pl-2"
                        >
                            <input required placeholder="Sender Name" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.name} onChange={e=>setSenderData({...senderData, name:e.target.value})}/>
                            <input required placeholder="Phone" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.phone} onChange={e=>setSenderData({...senderData, phone:e.target.value})}/>
                            <input required placeholder="Address" className={`${getBaseInputClass("focus:ring-blue-500")} md:col-span-2`} value={senderData.address} onChange={e=>setSenderData({...senderData, address:e.target.value})}/>
                            <input required placeholder="City" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.city} onChange={e=>setSenderData({...senderData, city:e.target.value})}/>
                            <input required placeholder="Pincode" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.pincode} onChange={e=>setSenderData({...senderData, pincode:e.target.value})}/>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </motion.div>

            {/* 👤 CARD 2: DELIVERY (PINK THEME) */}
            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-pink-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-pink-500"></div>
                <h3 className="text-sm font-black uppercase text-pink-600 dark:text-pink-400 tracking-widest mb-6 pl-2 flex items-center gap-2">
                    <User size={20} className="fill-pink-500/20"/> Delivery Details
                </h3>
                
                <div className="grid md:grid-cols-2 gap-5 pl-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 ml-2">Receiver Name *</label>
                        <input required type="text" placeholder="John Doe" className={getBaseInputClass("focus:ring-pink-500")}
                            value={formData.receiver_name} onChange={e => setFormData({...formData, receiver_name: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 ml-2">Mobile Number *</label>
                        <input required type="tel" placeholder="9876543210" className={getBaseInputClass("focus:ring-pink-500")}
                            value={formData.receiver_phone} onChange={e => setFormData({...formData, receiver_phone: e.target.value})} 
                        />
                    </div>
                </div>
                <div className="mt-5 space-y-1 pl-2">
                    <label className="text-xs font-bold text-slate-400 ml-2">Full Address *</label>
                    <textarea required placeholder="House No, Street, Landmark..." rows={2} className={`${getBaseInputClass("focus:ring-pink-500")} resize-none`}
                        value={formData.receiver_address} onChange={e => setFormData({...formData, receiver_address: e.target.value})} 
                    />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-5 pl-2">
                    <input required placeholder="City" className={getBaseInputClass("focus:ring-pink-500")} value={formData.receiver_city} onChange={e => setFormData({...formData, receiver_city: e.target.value})} />
                    <input required placeholder="State" className={getBaseInputClass("focus:ring-pink-500")} value={formData.receiver_state} onChange={e => setFormData({...formData, receiver_state: e.target.value})} />
                    <input required placeholder="Pincode" maxLength={6} className={getBaseInputClass("focus:ring-pink-500")} value={formData.receiver_pincode} onChange={e => setFormData({...formData, receiver_pincode: e.target.value})} />
                </div>
            </motion.div>

            {/* 📦 CARD 3: PACKAGE (AMBER THEME) */}
            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl shadow-amber-500/5 border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                <h3 className="text-sm font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest mb-6 pl-2 flex items-center gap-2">
                    <Package size={20} className="fill-amber-500/20"/> Package Info
                </h3>
                
                <div className="grid md:grid-cols-2 gap-5 pl-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 ml-2">Weight (KG) *</label>
                        <input type="number" step="0.1" placeholder="e.g. 0.5" className={getBaseInputClass("focus:ring-amber-500")}
                            value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 ml-2">Package Type</label>
                        <div className="relative">
                            <Box size={18} className="absolute left-4 top-4 text-slate-400 pointer-events-none" />
                            <select className={`${getBaseInputClass("focus:ring-amber-500")} pl-12 appearance-none cursor-pointer`} value={formData.package_type} onChange={e => setFormData({...formData, package_type: e.target.value})}>
                                <option value="Standard Box">Standard Box</option>
                                <option value="Document">Document</option>
                                <option value="Heavy Cargo">Heavy Cargo</option>
                                <option value="Fragile">Fragile</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-6"></div>

                <div className="grid md:grid-cols-2 gap-5 pl-2">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 ml-2">Payment Mode</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <button type="button" onClick={() => setFormData({ ...formData, payment_mode: "Prepaid" })}
                                className={`text-xs py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${formData.payment_mode === "Prepaid" ? "bg-white dark:bg-slate-800 text-amber-600 shadow-md shadow-amber-500/10" : "text-slate-400 hover:text-slate-600"}`}
                            >Prepaid</button>
                            <button type="button" onClick={() => setFormData({ ...formData, payment_mode: "COD" })}
                                className={`text-xs py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${formData.payment_mode === "COD" ? "bg-white dark:bg-slate-800 text-green-600 shadow-md shadow-green-500/10" : "text-slate-400 hover:text-slate-600"}`}
                            >COD</button>
                        </div>
                    </div>
                    <div className="space-y-1">
                         <label className={`text-xs font-bold ml-2 transition-colors ${formData.payment_mode === 'COD' ? 'text-green-500' : 'text-amber-500'}`}>
                            {formData.payment_mode === "COD" ? "Cash to Collect" : "Insured Value"}
                        </label>
                        <div className="relative">
                            <IndianRupee size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${formData.payment_mode === 'COD' ? 'text-green-500' : 'text-amber-500'}`}/>
                            <input type="number" placeholder="0" className={`${getBaseInputClass(formData.payment_mode === 'COD' ? "focus:ring-green-500" : "focus:ring-amber-500")} pl-9 text-lg`}
                                value={formData.declared_value} onChange={e => setFormData({...formData, declared_value: e.target.value})} 
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* 💰 RIGHT COLUMN: SUMMARY */}
        <div className="lg:col-span-1">
            <motion.div 
                variants={itemVariants}
                className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl sticky top-6 border border-slate-800 relative overflow-hidden"
            >
                {/* Background Decor */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/30 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <h3 className="font-black text-xl mb-6 flex items-center gap-2">
                        <Zap className="fill-yellow-400 text-yellow-400" size={24}/> 
                        Order Summary
                    </h3>
                    
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-slate-400">Receiver</span>
                            <span className="font-bold truncate max-w-[120px]">{formData.receiver_name || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-slate-400">Location</span>
                            <span className="font-bold">{formData.receiver_city || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-3 bg-slate-800/50 rounded-xl">
                            <span className="text-slate-400">Weight</span>
                            <span className="font-bold text-white">{formData.weight ? `${formData.weight} kg` : "-"}</span>
                        </div>
                        
                        <div className="mt-4 p-4 bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-2xl border border-slate-700">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400 uppercase">Payment Mode</span>
                                <span className={`font-black text-sm px-3 py-1 rounded-lg ${formData.payment_mode === "COD" ? "bg-green-500 text-white" : "bg-blue-500 text-white"}`}>
                                    {formData.payment_mode}
                                </span>
                            </div>
                        </div>
                    </div>

                    <motion.button 
                        type="submit" 
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-white shadow-xl shadow-violet-500/20 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Confirm Order <CheckCircle size={22} className="ml-1"/></>}
                    </motion.button>
                    
                    <p className="text-[10px] text-center text-slate-500 mt-4 leading-relaxed font-medium">
                        By clicking confirm, you agree to our logistics service terms.
                    </p>
                </div>
            </motion.div>
        </div>

      </form>
    </motion.div>
  );
}