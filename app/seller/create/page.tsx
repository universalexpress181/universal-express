"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Truck, User, MapPin, Package, Loader2, ArrowRight, IndianRupee, X, Edit2, CheckCircle, Box, Zap, ShieldCheck, Lock, CheckCircle2 
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", bounce: 0.4 } }
};

export default function CreateShipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [generatedAWB, setGeneratedAWB] = useState("");

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
    service_type: "Prime", 
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
                city: profile.city || "Mumbai", 
                state: profile.state || "Maharashtra", 
                pincode: profile.pincode || "400001"
            });
        }
    };
    initData();
  }, [router]);

  useEffect(() => {
    if (formData.payment_mode === "COD") {
        setFormData(prev => ({ ...prev, service_type: "COD" }));
    } else if (formData.service_type === "COD") {
        setFormData(prev => ({ ...prev, service_type: "Prime" }));
    }
  }, [formData.payment_mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const internalAwb = `UEX${Math.floor(10000000 + Math.random() * 90000000)}`;

      const { data: partnerAwb, error: rpcError } = await supabase.rpc('allocate_next_awb', {
        requested_service: formData.service_type,
        target_uex_awb: internalAwb
      });

      if (rpcError) throw new Error(rpcError.message);
      if (!partnerAwb) throw new Error(`Out of ${formData.service_type} AWBs.`);

      const { error: insertError } = await supabase.from('shipments').insert({
        user_id: user.id,
        awb_code: internalAwb,
        reference_id: partnerAwb,
        service_type: formData.service_type,
        sender_name: senderData.name, sender_phone: senderData.phone, sender_address: senderData.address, sender_city: senderData.city, sender_state: senderData.state, sender_pincode: senderData.pincode,
        receiver_name: formData.receiver_name, receiver_phone: formData.receiver_phone, receiver_address: formData.receiver_address, receiver_city: formData.receiver_city, receiver_state: formData.receiver_state, receiver_pincode: formData.receiver_pincode,
        weight: parseFloat(formData.weight) || 0.5, 
        package_type: formData.package_type,
        payment_mode: formData.payment_mode,
        cod_amount: formData.payment_mode === "COD" ? (Number(formData.declared_value) || 0) : 0,
        declared_value: Number(formData.declared_value) || 0,
        current_status: "created"
      });

      if (insertError) throw insertError;

      // 🎯 SHOW MODAL INSTEAD OF ALERT
      setGeneratedAWB(internalAwb);
      setShowModal(true);

    } catch (err: any) {
      alert("Booking Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-6xl mx-auto pb-20 px-4 md:px-0 relative">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div variants={itemVariants} className="mb-10">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">Create Shipment</span>
                <span className="text-2xl animate-pulse">⚡</span>
            </h1>
      </motion.div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            
            {/* SERVICE SELECTION */}
            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className={`absolute top-0 left-0 w-2 h-full transition-colors ${formData.payment_mode === 'COD' ? 'bg-slate-400' : 'bg-violet-600'}`}></div>
                <div className="flex justify-between items-center mb-6 pl-2">
                    <h3 className={`text-sm font-black uppercase tracking-widest flex items-center gap-2 ${formData.payment_mode === 'COD' ? 'text-slate-400' : 'text-violet-600'}`}>
                        <ShieldCheck size={20}/> Select Service Type
                    </h3>
                    {formData.payment_mode === "COD" && (
                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full flex items-center gap-1.5"><Lock size={12}/> RESTRICTED FOR COD</span>
                    )}
                </div>
                <div className={`grid md:grid-cols-3 gap-4 pl-2 transition-opacity ${formData.payment_mode === 'COD' ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
                    {['Prime', 'Air/Ground Express', 'Ground Cargo'].map((type) => (
                        <button key={type} type="button" onClick={() => setFormData({ ...formData, service_type: type })}
                            className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-2 ${formData.service_type === type ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-violet-200'}`}>
                            <span className={`text-xs font-black ${formData.service_type === type ? 'text-violet-600' : 'text-slate-400'}`}>{type.toUpperCase()}</span>
                            <span className="text-[10px] text-slate-500 leading-tight">Automated Partner Allocation.</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* PICKUP CARD */}
            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                 <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                 <div className="flex justify-between items-center mb-6 pl-2">
                    <h3 className="text-sm font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><MapPin size={20}/> Pickup Location</h3>
                    <button type="button" onClick={() => setIsCustomPickup(!isCustomPickup)} className={`text-xs font-extrabold px-4 py-2 rounded-full flex items-center gap-2 transition-all ${isCustomPickup ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                        {isCustomPickup ? <X size={14}/> : <Edit2 size={14}/>} {isCustomPickup ? 'Cancel' : 'Change'}
                    </button>
                 </div>
                 <AnimatePresence mode="wait">
                    {!isCustomPickup ? (
                        <motion.div key="default" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl flex items-center gap-5 border border-slate-200 dark:border-slate-800">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg"><User size={24}/></div>
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white text-lg">{senderData.name || "My Business"}</p>
                                <p className="text-sm text-slate-500 font-medium">{senderData.address}, {senderData.city}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div key="custom" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid md:grid-cols-2 gap-5 pl-2">
                            <input placeholder="Sender Name" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.name} onChange={e=>setSenderData({...senderData, name:e.target.value})}/>
                            <input placeholder="Phone" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.phone} onChange={e=>setSenderData({...senderData, phone:e.target.value})}/>
                            <input placeholder="Address" className={`${getBaseInputClass("focus:ring-blue-500")} md:col-span-2`} value={senderData.address} onChange={e=>setSenderData({...senderData, address:e.target.value})}/>
                            <input placeholder="City" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.city} onChange={e=>setSenderData({...senderData, city:e.target.value})}/>
                            <input placeholder="Pincode" className={getBaseInputClass("focus:ring-blue-500")} value={senderData.pincode} onChange={e=>setSenderData({...senderData, pincode:e.target.value})}/>
                        </motion.div>
                    )}
                 </AnimatePresence>
            </motion.div>

            {/* DELIVERY CARD */}
            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-pink-500"></div>
                <h3 className="text-sm font-black uppercase text-pink-600 tracking-widest mb-6 pl-2 flex items-center gap-2"><User size={20}/> Delivery Details</h3>
                <div className="grid md:grid-cols-2 gap-5 pl-2">
                    <input required placeholder="Receiver Name" className={getBaseInputClass("focus:ring-pink-500")} value={formData.receiver_name} onChange={e => setFormData({...formData, receiver_name: e.target.value})} />
                    <input required placeholder="Mobile Number" className={getBaseInputClass("focus:ring-pink-500")} value={formData.receiver_phone} onChange={e => setFormData({...formData, receiver_phone: e.target.value})} />
                    <textarea required placeholder="Full Address" rows={2} className={`${getBaseInputClass("focus:ring-pink-500")} md:col-span-2 resize-none`} value={formData.receiver_address} onChange={e => setFormData({...formData, receiver_address: e.target.value})} />
                    <input required placeholder="City" className={getBaseInputClass("focus:ring-pink-500")} value={formData.receiver_city} onChange={e => setFormData({...formData, receiver_city: e.target.value})} />
                    <input required placeholder="Pincode" className={getBaseInputClass("focus:ring-pink-500")} value={formData.receiver_pincode} onChange={e => setFormData({...formData, receiver_pincode: e.target.value})} />
                </div>
            </motion.div>

            {/* PACKAGE INFO */}
            <motion.div variants={itemVariants} className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 md:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                <h3 className="text-sm font-black uppercase text-amber-600 tracking-widest mb-6 pl-2 flex items-center gap-2"><Package size={20}/> Package & Billing</h3>
                <div className="grid md:grid-cols-2 gap-5 pl-2">
                    <input type="number" step="0.1" placeholder="Weight (KG)" className={getBaseInputClass("focus:ring-amber-500")} value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} />
                    <select className={getBaseInputClass("focus:ring-amber-500")} value={formData.package_type} onChange={e => setFormData({...formData, package_type: e.target.value})}>
                        <option value="Standard Box">Standard Box</option>
                        <option value="Document">Document</option>
                        <option value="Heavy Cargo">Heavy Cargo</option>
                    </select>
                </div>
                <div className="grid md:grid-cols-2 gap-5 mt-5 pl-2">
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200">
                        {['Prepaid', 'COD'].map(m => (
                            <button key={m} type="button" onClick={() => setFormData({ ...formData, payment_mode: m as any })} className={`text-xs py-3 rounded-xl font-bold transition-all ${formData.payment_mode === m ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm' : 'text-slate-400'}`}>{m}</button>
                        ))}
                    </div>
                    <div className="relative">
                        <IndianRupee size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${formData.payment_mode === 'COD' ? 'text-green-500' : 'text-amber-500'}`}/>
                        <input type="number" placeholder={formData.payment_mode === 'COD' ? "Cash to Collect" : "Insured Value"} className={`${getBaseInputClass(formData.payment_mode === 'COD' ? "focus:ring-green-500" : "focus:ring-amber-500")} pl-9`} value={formData.declared_value} onChange={e => setFormData({...formData, declared_value: e.target.value})} />
                    </div>
                </div>
            </motion.div>
        </div>

        {/* SUMMARY & SUBMIT */}
        <div className="lg:col-span-1">
            <motion.div variants={itemVariants} className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl sticky top-6 border border-slate-800 overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-600/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                    <h3 className="font-black text-xl mb-6 flex items-center gap-2"><Zap className="fill-yellow-400 text-yellow-400" size={24}/> Order Summary</h3>
                    <div className="space-y-3 mb-8">
                        <SummaryItem label="Receiver" value={formData.receiver_name} />
                        <SummaryItem label="Service" value={formData.service_type} />
                        <SummaryItem label="Weight" value={formData.weight ? `${formData.weight} kg` : "-"} />
                        <SummaryItem label="Mode" value={formData.payment_mode} highlight />
                    </div>
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 disabled:opacity-50 text-lg shadow-lg">
                        {loading ? <Loader2 className="animate-spin" /> : <>Assign & Book <ArrowRight size={20}/></>}
                    </motion.button>
                </div>
            </motion.div>
        </div>
      </form>
    </motion.div>

    {/* 🏁 SUCCESS MODAL */}
    <AnimatePresence>
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => router.push("/seller/shipments")}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />
          
          {/* Modal Content */}
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center overflow-hidden"
          >
            {/* Top Decor Icon */}
            <div className="mx-auto w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 size={48} className="text-emerald-500" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Shipment Booked!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-8">Your order has been assigned a tracking number.</p>

            {/* AWB BOX */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 mb-8 relative group">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] block mb-2">Universal Express AWB</label>
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-wider">{generatedAWB}</span>
                <div className="absolute top-2 right-2 p-1 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <CheckCircle2 size={12} className="text-white"/>
                </div>
            </div>

            <button onClick={() => router.push("/seller/shipments")}
              className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg shadow-xl hover:opacity-90 transition-all"
            >
              Done
            </button>

            <button onClick={() => router.push("/seller/shipments")} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}

function SummaryItem({ label, value, highlight }: { label: string, value: string, highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center text-sm p-3 bg-slate-800/50 rounded-xl border border-slate-800">
            <span className="text-slate-400">{label}</span>
            <span className={`font-bold truncate max-w-[120px] ${highlight ? 'text-amber-400' : 'text-white'}`}>{value || "-"}</span>
        </div>
    );
}