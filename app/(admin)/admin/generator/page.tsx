"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Package, User, MapPin, Phone, Truck, CreditCard, 
  Save, RefreshCw, Box, Layers, ChevronDown, Check 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🎭 Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function ShipmentGeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [packageOptions, setPackageOptions] = useState<string[]>([]);
  
  // 📝 Form State
  const [formData, setFormData] = useState({
    user_id: "", 
    service_type: "Standard",
    payment_mode: "Prepaid",
    
    // Sender
    sender_name: "", sender_phone: "", sender_address: "",
    sender_city: "", sender_state: "", sender_pincode: "",

    // Receiver
    receiver_name: "", receiver_phone: "", receiver_address: "",
    receiver_city: "", receiver_state: "", receiver_pincode: "",

    // Package
    weight: "",
    package_type: "", 
    declared_value: "",
    cod_amount: "0"
  });

  // 🔄 Initial Data Fetching
  useEffect(() => {
    const initData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setFormData(prev => ({ ...prev, user_id: user.id }));

        const { data: pricingData } = await supabase
            .from('pricing_config')
            .select('package_type');

        if (pricingData) {
            const uniqueTypes = Array.from(new Set(pricingData.map(item => item.package_type)));
            setPackageOptions(uniqueTypes);
            if (uniqueTypes.length > 0) {
                setFormData(prev => ({ ...prev, package_type: uniqueTypes[0] }));
            }
        }
    };
    initData();
  }, []);

  // ⚡ Handle Text Input Change
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ⚡ Handle Custom Dropdown Change
  const handleDropdownChange = (value: string) => {
    setFormData(prev => ({ ...prev, package_type: value }));
  };

  // 🚀 Submit Handler
  const handleSubmit = async () => {
    if (!formData.sender_name || !formData.receiver_name) return alert("Please fill in Sender and Receiver details.");
    setLoading(true);

    try {
      const awb_code = `UEX${Math.floor(10000000 + Math.random() * 90000000)}`;

      const shipmentPayload = {
        ...formData,
        awb_code,
        weight: Number(formData.weight) || 0.5,
        cod_amount: formData.payment_mode === 'COD' ? Number(formData.cod_amount) : 0,
        declared_value: Number(formData.declared_value) || 0,
        current_status: "created",
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('shipments').insert([shipmentPayload]);

      if (error) throw error;

      alert(`✅ Shipment Generated Successfully!\nAWB: ${awb_code}`);
      
      setFormData(prev => ({ 
          ...prev, awb_code: "", receiver_name: "", receiver_phone: "", receiver_address: "", receiver_pincode: ""
      }));

    } catch (error: any) {
      alert("Error creating shipment: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* 🟢 Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
                    <Package size={24}/>
                </div>
                Shipment Generator
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium ml-1">
                Create internal shipments instantly.
            </p>
        </div>
      </div>

      {/* 📝 Main Form Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COL: Sender & Receiver */}
        <div className="lg:col-span-2 space-y-8">
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MapPin size={16} /> Origin Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Sender Name" name="sender_name" value={formData.sender_name} onChange={handleChange} icon={<User size={16}/>} />
                    <InputField label="Phone Number" name="sender_phone" value={formData.sender_phone} onChange={handleChange} icon={<Phone size={16}/>} />
                    <div className="md:col-span-2">
                        <InputField label="Address" name="sender_address" value={formData.sender_address} onChange={handleChange} />
                    </div>
                    <InputField label="City" name="sender_city" value={formData.sender_city} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="State" name="sender_state" value={formData.sender_state} onChange={handleChange} />
                        <InputField label="Pincode" name="sender_pincode" value={formData.sender_pincode} onChange={handleChange} />
                    </div>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <MapPin size={16} className="text-blue-500"/> Destination Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InputField label="Receiver Name" name="receiver_name" value={formData.receiver_name} onChange={handleChange} icon={<User size={16}/>} />
                    <InputField label="Phone Number" name="receiver_phone" value={formData.receiver_phone} onChange={handleChange} icon={<Phone size={16}/>} />
                    <div className="md:col-span-2">
                        <InputField label="Address" name="receiver_address" value={formData.receiver_address} onChange={handleChange} />
                    </div>
                    <InputField label="City" name="receiver_city" value={formData.receiver_city} onChange={handleChange} />
                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="State" name="receiver_state" value={formData.receiver_state} onChange={handleChange} />
                        <InputField label="Pincode" name="receiver_pincode" value={formData.receiver_pincode} onChange={handleChange} />
                    </div>
                </div>
            </motion.div>
        </div>

        {/* RIGHT COL: Settings & Package */}
        <div className="lg:col-span-1 space-y-6">
            
            <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Box size={16} /> Package Info
                </h3>
                
                <div className="space-y-5">
                    {/* Service Type */}
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Service Mode</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['Standard', 'Express'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFormData({...formData, service_type: mode})}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                        formData.service_type === mode 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30' 
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <InputField label="Weight (kg)" name="weight" type="number" value={formData.weight} onChange={handleChange} />
                        
                        {/* 🎨 COOL CUSTOM DROPDOWN */}
                        <CustomDropdown 
                            label="Package Type"
                            options={packageOptions.length > 0 ? packageOptions : ["Box"]}
                            selected={formData.package_type}
                            onChange={handleDropdownChange}
                            icon={<Layers size={16} />}
                        />
                    </div>

                    {/* Payment */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Payment</label>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                            {['Prepaid', 'COD'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setFormData({...formData, payment_mode: mode})}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                        formData.payment_mode === mode 
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/30' 
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>
                        
                        {formData.payment_mode === 'COD' && (
                            <InputField 
                                label="COD Amount (₹)" 
                                name="cod_amount" 
                                type="number" 
                                value={formData.cod_amount} 
                                onChange={handleChange} 
                                icon={<CreditCard size={16}/>}
                            />
                        )}
                        {formData.payment_mode === 'Prepaid' && (
                             <InputField 
                                label="Declared Value (₹)" 
                                name="declared_value" 
                                type="number" 
                                value={formData.declared_value} 
                                onChange={handleChange} 
                            />
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ACTION BUTTON */}
            <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <RefreshCw className="animate-spin" /> : <><Save size={20} /> Create Shipment</>}
            </motion.button>

        </div>
      </div>
    </motion.div>
  );
}

// 🎨 Reusable Input Component
const inputClass = "w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 appearance-none";

function InputField({ label, icon, ...props }: any) {
    return (
        <div>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block ml-1">{label}</label>
            <div className="relative">
                {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">{icon}</div>}
                <input 
                    {...props} 
                    className={`${inputClass} ${icon ? 'pl-11' : ''}`}
                />
            </div>
        </div>
    );
}

// ✨ NEW: COOL CUSTOM DROPDOWN COMPONENT
function CustomDropdown({ label, options, selected, onChange, icon }: any) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: any) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5 block ml-1">{label}</label>
            
            {/* Trigger Button */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-50 dark:bg-slate-800/50 border ${isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-slate-200 dark:border-slate-700'} rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white cursor-pointer flex items-center justify-between transition-all`}
            >
                <div className="flex items-center gap-3">
                    {icon && <span className="text-slate-400">{icon}</span>}
                    <span className="truncate">{selected || "Select Type"}</span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
                    >
                        {options.map((option: string) => (
                            <div
                                key={option}
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`px-4 py-3 text-sm font-medium flex items-center justify-between cursor-pointer transition-colors
                                    ${selected === option 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                `}
                            >
                                {option}
                                {selected === option && <Check size={16} className="text-blue-500" />}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}