"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { generateProfessionalAWB } from "@/lib/awbGenerator"; 
import { Package, Truck, User, MapPin, Loader2, Phone, AlertTriangle, Scale, CheckCircle, IndianRupee, Calculator } from "lucide-react";

export default function BookShipmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingUser, setFetchingUser] = useState(true);
  
  const [packageTypes, setPackageTypes] = useState<string[]>(["Standard Box"]);

  const [formData, setFormData] = useState({
    sender_name: "",
    sender_mobile: "",
    sender_address: "",
    sender_city: "",
    sender_state: "",
    sender_pincode: "",
    
    receiver_name: "",
    receiver_mobile: "",
    receiver_address: "",
    receiver_city: "",
    receiver_state: "",
    receiver_pincode: "",
    
    weightKg: "",    
    weightGrams: "", 
    
    package_type: "Standard Box",
    payment_mode: "Prepaid",
    declared_value: "" 
  });

  // ⚡ DYNAMIC TOTAL WEIGHT CALCULATION
  // This automatically detects that 2500g = 2.5kg
  const kg = parseFloat(formData.weightKg) || 0;
  const grams = parseFloat(formData.weightGrams) || 0;
  const totalWeight = kg + (grams / 1000); 

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFormData(prev => ({ ...prev, sender_name: user.user_metadata?.full_name || "" }));
      } else {
        router.push("/login");
      }
      setFetchingUser(false);

      const { data: rules } = await supabase.from('pricing_config').select('package_type');
      if (rules && rules.length > 0) {
          setPackageTypes(rules.map(r => r.package_type));
      }
    };
    initData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ SMART WEIGHT HANDLER (Allows 2500g)
  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 1. Grams: Allow ANY number (e.g., 2500). Just block letters.
    if (name === "weightGrams") {
        const cleanValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({ ...prev, [name]: cleanValue }));
    } 
    // 2. KG: Allow decimals
    else if (name === "weightKg") {
        if (parseFloat(value) < 0) return;
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const isFormValid = () => {
    const requiredFields = [
        formData.sender_name, formData.sender_mobile, formData.sender_address, formData.sender_city, formData.sender_state, formData.sender_pincode,
        formData.receiver_name, formData.receiver_mobile, formData.receiver_address, formData.receiver_city, formData.receiver_state, formData.receiver_pincode,
        formData.declared_value
    ];
    
    return requiredFields.every(field => field && field.trim() !== "") && totalWeight > 0 && Number(formData.declared_value) > 0;
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
        alert("⚠️ Please fill in all fields before proceeding.");
        return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newAwb = generateProfessionalAWB();
    const valueAmount = Number(formData.declared_value) || 0;

    const { error } = await supabase.from('shipments').insert({
      awb_code: newAwb,
      user_id: user.id,
      sender_name: formData.sender_name,
      sender_phone: formData.sender_mobile,
      sender_address: formData.sender_address,
      sender_city: formData.sender_city,
      sender_state: formData.sender_state,
      sender_pincode: formData.sender_pincode,
      receiver_name: formData.receiver_name,
      receiver_phone: formData.receiver_mobile,
      receiver_address: formData.receiver_address,
      receiver_city: formData.receiver_city,
      receiver_state: formData.receiver_state,
      receiver_pincode: formData.receiver_pincode,
      
      weight: totalWeight, // ⚡ Uses the smart total (e.g. 3.5)
      package_type: formData.package_type,
      payment_mode: formData.payment_mode,
      
      declared_value: valueAmount,
      cod_amount: formData.payment_mode === "COD" ? valueAmount : 0,
      
      cost: 0,
      base_fee: 0,
      tax_amount: 0,
      
      current_status: "created",
      payment_status: "paid", 
      created_at: new Date().toISOString()
    });

    if (error) {
      alert("Error: " + error.message);
      setLoading(false);
    } else {
      const { data: shipData } = await supabase.from('shipments').select('id').eq('awb_code', newAwb).single();
      if (shipData) {
        await supabase.from('tracking_events').insert({
          shipment_id: shipData.id,
          status: "order_placed",
          location: "Online Booking",
          timestamp: new Date().toISOString()
        });
      }
      router.push("/dashboard/history");
    }
  };

  if (fetchingUser) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 gap-4">
        <Loader2 className="animate-spin text-blue-500" size={40} /> 
        <p className="animate-pulse">Loading Profile...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 grid md:grid-cols-3 gap-8">
      
      {/* --- LEFT: BOOKING FORM --- */}
      <div className="md:col-span-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Book Shipment</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Enter details to generate AWB.</p>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-8">
            {/* Sender Section */}
            <div className="space-y-4">
                <div className="flex justify-between">
                   <h3 className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 flex items-center gap-2"><User size={14}/> Sender Details</h3>
                   <span className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">AUTO-FILLED</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                    <input name="sender_name" value={formData.sender_name} onChange={handleChange} placeholder="Sender Name *" className="input-field" />
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input name="sender_mobile" type="tel" value={formData.sender_mobile} onChange={handleChange} placeholder="Mobile Number *" className="input-field pl-10" />
                    </div>
                    <input name="sender_address" value={formData.sender_address} onChange={handleChange} placeholder="Street Address / Building *" className="input-field md:col-span-2" />
                    
                    <input name="sender_city" value={formData.sender_city} onChange={handleChange} placeholder="City *" className="input-field" />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="sender_state" value={formData.sender_state} onChange={handleChange} placeholder="State *" className="input-field" />
                        <input name="sender_pincode" value={formData.sender_pincode} onChange={handleChange} placeholder="Pincode *" className="input-field" />
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

            {/* Receiver Section */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-orange-600 dark:text-orange-400 flex items-center gap-2"><MapPin size={14}/> Receiver Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <input name="receiver_name" onChange={handleChange} placeholder="Receiver Name *" className="input-field" />
                    <div className="relative">
                        <Phone size={16} className="absolute left-3 top-3.5 text-slate-400" />
                        <input name="receiver_mobile" type="tel" onChange={handleChange} placeholder="Receiver Mobile *" className="input-field pl-10" />
                    </div>
                    <input name="receiver_address" onChange={handleChange} placeholder="Street Address / Building *" className="input-field md:col-span-2" />
                    
                    <input name="receiver_city" onChange={handleChange} placeholder="City *" className="input-field" />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="receiver_state" onChange={handleChange} placeholder="State *" className="input-field" />
                        <input name="receiver_pincode" onChange={handleChange} placeholder="Pincode *" className="input-field" />
                    </div>
                </div>
            </div>

            <div className="h-px bg-slate-100 dark:bg-slate-800"></div>

            {/* Package Details */}
            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 flex items-center gap-2"><Package size={14}/> Package Info</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                    {/* Weight Inputs */}
                    <div className="space-y-1">
                         <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            <Scale size={10}/> Weight *
                         </label>
                         <div className="flex gap-2">
                             <div className="relative flex-1">
                                 <input 
                                    name="weightKg" 
                                    type="number" 
                                    placeholder="0" 
                                    className="input-field pr-8" 
                                    onChange={handleWeightChange} 
                                    value={formData.weightKg}
                                 />
                                 <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">KG</span>
                             </div>
                             <div className="relative flex-1">
                                 <input 
                                    name="weightGrams" 
                                    type="number" 
                                    placeholder="0" 
                                    className="input-field pr-10" 
                                    onChange={handleWeightChange} 
                                    value={formData.weightGrams} 
                                 />
                                 <span className="absolute right-3 top-3 text-xs text-slate-400 font-bold">Grams</span>
                             </div>
                         </div>
                         
                         {/* 🌟 SMART TOTAL DISPLAY */}
                         {totalWeight > 0 && (
                             <div className="flex items-center gap-2 text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1.5 rounded-lg mt-1 border border-slate-200 dark:border-slate-700 animate-in fade-in">
                                 <Calculator size={12} className="text-blue-500"/>
                                 <span>Total Detected Weight:</span>
                                 <span className="font-black text-slate-900 dark:text-white">{totalWeight} KG</span>
                             </div>
                         )}
                    </div>

                    {/* Type Selection */}
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Package Type</label>
                        <select name="package_type" className="input-field" onChange={handleChange} value={formData.package_type}>
                            {packageTypes.map((type) => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- RIGHT: SUMMARY & CONFIRMATION --- */}
      <div className="md:col-span-1 space-y-6">
        
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sticky top-24 transition-all">
            <h3 className="text-slate-900 dark:text-white font-bold text-lg flex items-center gap-2 mb-6">
                <CheckCircle size={20} className="text-blue-600" /> Summary
            </h3>

            <div className="space-y-4">
                
                {/* Payment Mode Selector */}
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Payment Mode</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setFormData({ ...formData, payment_mode: "Prepaid" })}
                            className={`py-2 rounded-lg text-sm font-bold border transition-all ${formData.payment_mode === "Prepaid" ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-blue-400"}`}
                        >Prepaid</button>
                        <button onClick={() => setFormData({ ...formData, payment_mode: "COD" })}
                            className={`py-2 rounded-lg text-sm font-bold border transition-all ${formData.payment_mode === "COD" ? "bg-green-600 text-white border-green-600" : "bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700 hover:border-green-400"}`}
                        >COD</button>
                    </div>
                </div>

                {/* DYNAMIC VALUE INPUT */}
                <div className="animate-in fade-in slide-in-from-top-2">
                    <label className={`text-xs font-bold mb-1 block transition-colors ${formData.payment_mode === "COD" ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                        {formData.payment_mode === "COD" ? "Amount to Collect (COD) *" : "Declared Value (₹) *"}
                    </label>
                    <div className="relative">
                        <IndianRupee size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${formData.payment_mode === "COD" ? "text-green-500" : "text-blue-500"}`}/>
                        <input 
                            name="declared_value" 
                            type="number" 
                            placeholder={formData.payment_mode === "COD" ? "e.g. 1500" : "e.g. 1000"}
                            className={`input-field pl-9 transition-colors ${formData.payment_mode === "COD" ? "border-green-500/50 focus:border-green-500 bg-green-50 dark:bg-green-900/10" : "border-blue-500/50 focus:border-blue-500 bg-blue-50 dark:bg-blue-900/10"}`}
                            onChange={handleChange}
                            value={formData.declared_value}
                        />
                    </div>
                    {formData.payment_mode === "Prepaid" && (
                        <p className="text-[10px] text-slate-400 mt-1">
                            * Enter product value for insurance/liability purposes.
                        </p>
                    )}
                </div>

                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl text-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="text-slate-500">Receiver</span>
                        <span className="font-bold text-slate-900 dark:text-white">{formData.receiver_name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-500">Weight</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                            {totalWeight} kg
                        </span>
                    </div>
                </div>

                {!isFormValid() && (
                     <div className="flex items-center gap-2 text-[11px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                        <AlertTriangle size={14} className="shrink-0" />
                        <p>Fill all details & Value.</p>
                    </div>
                )}

                <button 
                    onClick={handleSubmit}
                    disabled={loading || !isFormValid()}
                    className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 disabled:bg-slate-200 disabled:dark:bg-slate-800 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Confirm & Book <CheckCircle size={18} /></>}
                </button>
            </div>
        </div>
      </div>

    </div>
  );
}