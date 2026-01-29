"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Plus, Loader2, Trash2, Edit2, Save, X, Package, Box 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PackageType {
  id: number;
  package_type: string;
}

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

// 💎 INPUT STYLE
const inputClass = `
  flex-1 bg-white dark:bg-[#111827] 
  border border-gray-200 dark:border-gray-700 
  text-gray-900 dark:text-white 
  px-4 py-3 rounded-xl 
  outline-none focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-cyan-500/50 focus:border-indigo-500 dark:focus:border-cyan-500
  transition-all placeholder-gray-400 dark:placeholder-gray-500
`;

export default function PackageTypesPage() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageType[]>([]);
  
  // State for Adding
  const [newPackage, setNewPackage] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // State for Editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    const { data, error } = await supabase
      .from('pricing_config')
      .select('id, package_type')
      .order('id', { ascending: true });

    if (error) console.error("Error:", error);
    else setPackages(data || []);
    
    setLoading(false);
  };

  // ✅ ADD NEW PACKAGE TYPE
  const handleAdd = async () => {
    if (!newPackage.trim()) return;
    setIsAdding(true);

    const { error } = await supabase
        .from('pricing_config')
        .insert({ package_type: newPackage });

    if (error) {
        alert("Error adding: " + error.message);
    } else {
        setNewPackage("");
        fetchPackages();
    }
    setIsAdding(false);
  };

  // ✅ DELETE PACKAGE TYPE
  const handleDelete = async (id: number) => {
      if(!confirm("Are you sure? This might affect existing shipments using this type.")) return;

      const { error } = await supabase
          .from('pricing_config')
          .delete()
          .eq('id', id);

      if (!error) fetchPackages();
  };

  // ✅ START EDITING
  const startEdit = (pkg: PackageType) => {
      setEditingId(pkg.id);
      setEditValue(pkg.package_type);
  };

  // ✅ SAVE EDIT
  const saveEdit = async () => {
      if (!editingId || !editValue.trim()) return;

      const { error } = await supabase
          .from('pricing_config')
          .update({ package_type: editValue })
          .eq('id', editingId);

      if (error) {
          alert("Error updating: " + error.message);
      } else {
          setEditingId(null);
          fetchPackages();
      }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#050b14] text-indigo-500 gap-3">
        <Loader2 className="animate-spin" size={32}/> <span className="font-medium animate-pulse tracking-widest">LOADING CONFIG...</span>
    </div>
  );

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="min-h-screen bg-gray-50 dark:bg-[#050b14] p-4 md:p-8 relative overflow-x-hidden transition-colors duration-500"
    >
      
      {/* 🔮 Background Atmosphere */}
      <div className="fixed top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-200/40 dark:bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-fuchsia-200/40 dark:bg-purple-900/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-3 tracking-tight">
                    <div className="p-2.5 bg-indigo-600 dark:bg-cyan-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                        <Package size={24} />
                    </div>
                    Package Types
                </h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium ml-1">Define the types of packages available for shipment.</p>
            </div>
        </div>

        {/* 🟦 ADD NEW SECTION */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] p-6 rounded-3xl flex flex-col md:flex-row gap-4 items-center shadow-lg relative overflow-hidden">
            {/* Accent Line */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 dark:bg-cyan-500"></div>
            
            <input 
                type="text" 
                placeholder="e.g. Heavy Cargo, Document, Fragile..." 
                className={inputClass}
                value={newPackage}
                onChange={(e) => setNewPackage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button 
                onClick={handleAdd}
                disabled={isAdding || !newPackage}
                className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white px-8 py-3.5 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isAdding ? <Loader2 className="animate-spin" size={20}/> : <Plus size={20}/>}
                Add Type
            </button>
        </motion.div>

        {/* 📋 LIST OF PACKAGES */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-[#1e293b] rounded-3xl overflow-hidden shadow-xl">
            <div className="p-5 bg-gray-50 dark:bg-[#111827] border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h3 className="font-black text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2">
                    <Box size={14}/> Available Configuration
                </h3>
                <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md text-[10px] font-bold">
                    {packages.length} Types
                </span>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <AnimatePresence>
                    {packages.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center text-gray-400 dark:text-gray-600 font-medium">
                            No package types defined yet. Start by adding one above.
                        </motion.div>
                    ) : (
                        packages.map((pkg) => (
                            <motion.div 
                                key={pkg.id} 
                                layout
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="p-5 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-[#111827]/50 transition-colors"
                            >
                                
                                {/* EDIT MODE vs VIEW MODE */}
                                {editingId === pkg.id ? (
                                    <div className="flex items-center gap-3 flex-1 mr-4 animate-in fade-in slide-in-from-left-2">
                                        <input 
                                            autoFocus
                                            className="flex-1 bg-white dark:bg-[#0f172a] border border-indigo-500 dark:border-cyan-500 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl outline-none shadow-sm"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                                        />
                                        <button onClick={saveEdit} className="p-2.5 bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-xl hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors">
                                            <Save size={18}/>
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="p-2.5 bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors">
                                            <X size={18}/>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-indigo-100 dark:group-hover:bg-cyan-900/30 group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                                            <Box size={20}/>
                                        </div>
                                        <span className="text-gray-900 dark:text-white font-bold text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-cyan-400 transition-colors">
                                            {pkg.package_type}
                                        </span>
                                    </div>
                                )}

                                {/* ACTION BUTTONS (Only show if not editing) */}
                                {editingId !== pkg.id && (
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 duration-200">
                                        <button 
                                            onClick={() => startEdit(pkg)}
                                            className="p-2.5 text-gray-400 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-indigo-50 dark:hover:bg-cyan-900/20 rounded-xl transition-colors"
                                            title="Edit Name"
                                        >
                                            <Edit2 size={18}/>
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(pkg.id)}
                                            className="p-2.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                            title="Delete Type"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
      </div>

    </motion.div>
  );
}