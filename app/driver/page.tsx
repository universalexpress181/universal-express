"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { 
  Truck, Package, ScanLine, MapPin, Loader2, LogOut, 
  Lock, Mail, Camera, X, AlertTriangle, Navigation, Bike, CheckCircle2 
} from "lucide-react";
import LogoutOnBack from "@/components/LogoutOnBack"; // 🛡️ Import the Security Guard

export default function DriverApp() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [driverProfile, setDriverProfile] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("pending");
  
  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // --- ACTION MODAL STATE ---
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [actionType, setActionType] = useState<"pickup" | "transit" | "start_delivery" | "deliver" | "fail" | null>(null);
  const [locationInput, setLocationInput] = useState("");
  const [failReason, setFailReason] = useState("");
  const [podFiles, setPodFiles] = useState<File[]>([]); 
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        fetchDriverProfile(session.user.id);
      }
    });
  }, []);

  // --- CORE FUNCTIONS ---
  const handleLogin = async () => {
    if(!email || !password) return alert("Please enter email and password");
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { 
        alert("❌ Login Failed: " + error.message); 
        setLoading(false); 
    } else if (data.session) { 
        setSession(data.session); 
        fetchDriverProfile(data.session.user.id); 
    }
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to end your shift and logout?")) return;
    setLoggingOut(true);
    
    // 1. Sign out
    await supabase.auth.signOut();
    
    // 2. Clear State
    setSession(null); 
    setDriverProfile(null);
    setTasks([]);
    setLoggingOut(false);

    // 3. Force reload to clear history stack fully (extra safety for drivers)
    window.location.reload();
  };

  const fetchDriverProfile = async (authId: string) => {
    const { data: staff } = await supabase.from('staff').select('*').eq('auth_id', authId).single();
    if (staff) { 
        setDriverProfile(staff); 
        fetchTasks(staff.id); 
    } else { 
        alert("⚠️ Account not linked to Staff Profile."); 
        await supabase.auth.signOut();
    }
    setLoading(false);
  };

  const fetchTasks = async (driverId: number) => {
    const { data } = await supabase.from('shipments').select('*').eq('delivery_boy_id', driverId).order('created_at', { ascending: false });
    if (data) setTasks(data);
  };

  // --- ACTION HANDLERS ---
  const openActionModal = (task: any, type: any) => {
    setSelectedTask(task);
    setActionType(type);
    setLocationInput(""); 
    setFailReason("");
    setPodFiles([]); 
  };

  const closeActionModal = () => {
    setSelectedTask(null);
    setActionType(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const selected = Array.from(e.target.files);
        if (selected.length + podFiles.length > 4) return alert("⚠️ Max 4 photos.");
        setPodFiles([...podFiles, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setPodFiles(podFiles.filter((_, i) => i !== index));
  };

  const handleSubmitAction = async () => {
    if (!selectedTask || !actionType) return;
    if (!locationInput) return alert("⚠️ Please enter current location.");

    setSubmitting(true);

    try {
      let newStatus = selectedTask.current_status; 
      
      if (actionType === "pickup") newStatus = "manifested"; 
      else if (actionType === "transit") newStatus = "in_transit";
      else if (actionType === "start_delivery") newStatus = "out_for_delivery";
      else if (actionType === "fail") {
        if (!failReason) throw new Error("Please enter a reason.");
        newStatus = "undelivered"; 
      } 
      else if (actionType === "deliver") {
        if (podFiles.length === 0) throw new Error("Proof of Delivery (Photo) is required.");
        newStatus = "delivered";
      }

      // 1. Upload Photos
      if (podFiles.length > 0) {
        for (const file of podFiles) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${selectedTask.awb_code}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('evidence').upload(fileName, file);
            if (uploadError) throw uploadError;
            
            const { data: { publicUrl } } = supabase.storage.from('evidence').getPublicUrl(fileName);
            await supabase.from('pod_images').insert({ shipment_id: selectedTask.id, image_url: publicUrl });
        }
      }

      // 2. Update Status
      await supabase.from('shipments').update({ current_status: newStatus }).eq('id', selectedTask.id);
      
      // 3. Timeline
      await supabase.from('tracking_events').insert({
        shipment_id: selectedTask.id,
        status: newStatus,
        location: locationInput + (failReason ? ` [Reason: ${failReason}]` : ""), 
        timestamp: new Date().toISOString()
      });

      fetchTasks(driverProfile.id); 
      closeActionModal();

    } catch (error: any) {
      alert("❌ Error: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // --- VIEW: LOGIN ---
  if (!session || !driverProfile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]"/>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px]"/>

        <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-md border border-slate-800 p-8 rounded-3xl shadow-2xl relative z-10">
          <div className="flex justify-center mb-6">
             <div className="bg-blue-600/20 p-4 rounded-full text-blue-500">
                <Truck size={40}/>
             </div>
          </div>
          <h1 className="text-2xl font-black text-center text-white mb-2">Driver Login</h1>
          <p className="text-slate-400 text-center text-sm mb-8">Sign in to start your deliveries</p>
          
          <div className="space-y-4">
              <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-500" size={20}/>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 p-4 pl-12 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
              </div>
              <div className="relative">
                  <Lock className="absolute left-4 top-4 text-slate-500" size={20}/>
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-slate-950 border border-slate-700 p-4 pl-12 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                  />
              </div>
              <button 
                onClick={handleLogin} 
                disabled={loading} 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin mx-auto"/> : "Start Shift"}
              </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD ---
  const currentTasks = tasks.filter(t => activeTab === 'pending' ? !['delivered','undelivered'].includes(t.current_status) : ['delivered','undelivered'].includes(t.current_status));

  return (
    <div className="min-h-screen bg-black text-white pb-20 relative">
      
      {/* 🛡️ SECURITY: PREVENT BACK BUTTON CLICK */}
      {/* This ensures if they logout, they cannot press back to return here */}
      <LogoutOnBack />

      {/* HEADER */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 border-b border-slate-800 sticky top-0 z-30 flex justify-between items-center shadow-lg">
        <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-inner border border-white/10">
                {driverProfile.name.charAt(0)}
             </div>
            <div>
                <h1 className="text-lg font-bold text-white leading-tight">{driverProfile.name.split(' ')[0]}</h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{driverProfile.designation}</p>
            </div>
        </div>
        <button 
            onClick={handleLogout} 
            disabled={loggingOut}
            className="bg-slate-800 hover:bg-red-900/20 hover:text-red-400 text-slate-400 p-2.5 rounded-xl transition-all"
        >
            {loggingOut ? <Loader2 size={20} className="animate-spin"/> : <LogOut size={20}/>}
        </button>
      </div>

      {/* TABS */}
      <div className="p-4 z-20 relative">
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button 
                onClick={() => setActiveTab('pending')} 
                className={`py-3 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'pending' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                Pending
            </button>
            <button 
                onClick={() => setActiveTab('history')} 
                className={`py-3 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
                History
            </button>
        </div>
      </div>

      {/* TASK LIST - Responsive Grid */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentTasks.map(task => (
             <div key={task.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm hover:border-slate-700 transition-colors relative group">
                 {/* Status Badge */}
                 <div className="flex justify-between items-start mb-3">
                    <h3 className="font-mono text-xl font-bold text-blue-400 tracking-tight">{task.awb_code}</h3>
                    <span className={`text-[10px] px-2 py-1 rounded border uppercase font-bold ${
                        task.current_status === 'delivered' ? 'bg-green-900/20 text-green-400 border-green-900/50' : 
                        task.current_status === 'out_for_delivery' ? 'bg-yellow-900/20 text-yellow-400 border-yellow-900/50' : 
                        'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                        {task.current_status.replace('_', ' ')}
                    </span>
                 </div>

                 {/* Address Info */}
                 <div className="mb-4 space-y-2">
                    <div className="flex gap-3">
                        <div className="mt-1 min-w-[16px]"><Package size={16} className="text-slate-500"/></div>
                        <p className="text-sm font-bold text-white">{task.receiver_name}</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="mt-1 min-w-[16px]"><MapPin size={16} className="text-slate-500"/></div>
                        <p className="text-xs text-slate-400 leading-relaxed">{task.receiver_address}</p>
                    </div>
                 </div>
                 
                 {/* Action Buttons */}
                 {activeTab === 'pending' && (
                     <div className="pt-4 border-t border-slate-800/50">
                        {/* 1. CREATED */}
                        {task.current_status === 'created' && (
                            <button onClick={() => openActionModal(task, 'pickup')} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                <ScanLine size={16}/> Pickup Package
                            </button>
                        )}

                        {/* 2. IN TRANSIT */}
                        {(task.current_status === 'manifested' || task.current_status === 'in_transit') && (
                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => openActionModal(task, 'transit')} className="bg-slate-800 hover:bg-slate-700 text-blue-400 border border-slate-700 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    <Navigation size={14}/> Update Loc
                                </button>
                                <button onClick={() => openActionModal(task, 'start_delivery')} className="bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    <Bike size={14}/> Start Delivery
                                </button>
                            </div>
                        )}

                         {/* 3. OUT FOR DELIVERY */}
                         {task.current_status === 'out_for_delivery' && (
                             <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => openActionModal(task, 'fail')} className="bg-red-900/20 hover:bg-red-900/30 text-red-400 border border-red-900/50 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    <AlertTriangle size={14}/> Failed
                                </button>
                                <button onClick={() => openActionModal(task, 'deliver')} className="bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                                    <CheckCircle2 size={16}/> Delivered
                                </button>
                             </div>
                         )}
                     </div>
                 )}
             </div>
        ))}
      </div>
      
      {currentTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Package size={48} className="text-slate-700 mb-2"/>
              <p className="text-center text-slate-500">No {activeTab} tasks found.</p>
          </div>
      )}

      {/* --- ACTION MODAL --- */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={closeActionModal} />
            
            {/* Content */}
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 relative max-h-[90vh] overflow-y-auto z-10 animate-in slide-in-from-bottom duration-300 shadow-2xl">
                <button onClick={closeActionModal} className="absolute top-4 right-4 bg-slate-800 p-1.5 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X size={18}/>
                </button>
                
                <h3 className="text-xl font-bold text-white mb-1">
                    {actionType === 'pickup' ? "Confirm Pickup" : 
                     actionType === 'transit' ? "Update Location" :
                     actionType === 'start_delivery' ? "Start Last Mile" :
                     actionType === 'deliver' ? "Complete Delivery" : "Report Failure"}
                </h3>
                <p className="text-sm text-blue-400 font-mono mb-6">{selectedTask.awb_code}</p>

                <div className="space-y-5">
                    
                    {/* Location Input (Always Required) */}
                    <div>
                        <label className="text-[10px] text-slate-500 uppercase font-bold block mb-2 tracking-wider">Current Location *</label>
                        <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-3.5 text-slate-500"/>
                            <input 
                                value={locationInput}
                                onChange={(e) => setLocationInput(e.target.value)}
                                placeholder="e.g. Pune Hub, Sector 5..."
                                className="w-full bg-slate-950 border border-slate-700 p-3 pl-12 rounded-xl text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>
                    </div>

                    {/* Failure Reason */}
                    {actionType === 'fail' && (
                        <div>
                            <label className="text-[10px] text-red-400 uppercase font-bold block mb-2 tracking-wider">Failure Reason *</label>
                            <input 
                                value={failReason}
                                onChange={(e) => setFailReason(e.target.value)}
                                placeholder="e.g. Customer Unavailable"
                                className="w-full bg-red-900/10 border border-red-900/50 p-3 rounded-xl text-white outline-none focus:border-red-500"
                            />
                        </div>
                    )}

                    {/* POD Upload */}
                    {actionType === 'deliver' && (
                        <div>
                            <label className="text-[10px] text-green-400 uppercase font-bold block mb-2 tracking-wider">Proof of Delivery (Mandatory)</label>
                            <div className="flex gap-3 mb-2 overflow-x-auto pb-2">
                                {podFiles.map((file, idx) => (
                                    <div key={idx} className="relative w-20 h-20 bg-slate-800 rounded-xl flex-shrink-0 border border-slate-700 flex items-center justify-center overflow-hidden">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover opacity-80"/>
                                        <button onClick={() => removeFile(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-red-600 transition-colors"><X size={12}/></button>
                                    </div>
                                ))}
                                {podFiles.length < 4 && (
                                    <label className="w-20 h-20 bg-slate-950 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-slate-900 transition-all group">
                                        <Camera size={24} className="text-slate-500 group-hover:text-blue-500 transition-colors"/>
                                        <span className="text-[9px] text-slate-500 font-bold mt-1">ADD</span>
                                        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 text-right">{podFiles.length}/4 photos selected</p>
                        </div>
                    )}

                    <button 
                        onClick={handleSubmitAction}
                        disabled={submitting}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 shadow-lg transition-all active:scale-[0.98] ${
                            actionType === 'fail' ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 
                            actionType === 'deliver' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 
                            'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                        }`}
                    >
                        {submitting ? <Loader2 className="animate-spin"/> : "Confirm & Update"}
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}