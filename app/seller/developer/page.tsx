"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Key, Copy, RefreshCw, Check, Code, Server, 
  Eye, EyeOff, Box, Layers, Terminal, FileJson, 
  BookOpen, Search, Globe, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 🎭 ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } }
};

export default function DeveloperSettings() {
  const [loading, setLoading] = useState(true);
  const [apiKey, setApiKey] = useState("");
  // 🌐 PRODUCTION BASE URL
  const baseUrl = "https://www.universalexpress.live";
  
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  const [apiOperation, setApiOperation] = useState<'create' | 'track_single' | 'track_bulk'>('create');
  const [reqType, setReqType] = useState<'single' | 'bulk'>('single');
  const [lang, setLang] = useState<'curl' | 'node' | 'python' | 'php'>('curl');
  const [viewMode, setViewMode] = useState<'request' | 'response' | 'schema'>('request');

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('api_keys').select('secret_key').eq('user_id', user.id).single();
    if (data) setApiKey(data.secret_key);
    setLoading(false);
  };

  const generateNewKey = async () => {
    if (!confirm("⚠️ WARNING: New key will invalidate existing integrations. Proceed?")) return;
    setRegenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const newKey = "univ_live_" + Math.random().toString(36).substr(2, 18);
    const { error } = await supabase.from('api_keys').upsert({ user_id: user.id, secret_key: newKey }, { onConflict: 'user_id' });
    if (!error) setApiKey(newKey);
    setRegenerating(false);
  };

  const copyToClipboard = (text: string, isKey: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isKey) { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
    else { setCopiedSnippet(true); setTimeout(() => setCopiedSnippet(false), 2000); }
  };

  const getCodeSnippet = () => {
    let url = "";
    let method = "POST";
    let payloadData: any = {};
    const safeKey = apiKey || "YOUR_API_KEY";

    if (apiOperation === 'create') {
        url = `${baseUrl}/api/v1/shipment/create`;
        payloadData = { data: reqType === 'single' ? singleOrderObj : bulkOrderObj };
    } else if (apiOperation === 'track_single') {
        url = `${baseUrl}/api/v1/shipment/track?awb=UEX12345678`;
        method = "GET";
        payloadData = null;
    } else {
        url = `${baseUrl}/api/v1/shipment/track/bulk`;
        payloadData = { awbs: ["UEX12345678", "UEX87654321"] };
    }

    const payloadStr = JSON.stringify(payloadData, null, 2);

    switch (lang) {
        case 'curl':
            return method === "GET" 
                ? `curl -X GET "${url}" \\\n  -H "x-api-key: ${safeKey}"`
                : `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${safeKey}" \\\n  -d '${JSON.stringify(payloadData)}'`;
        case 'node':
            return `const axios = require('axios');\n\naxios({\n  method: '${method.toLowerCase()}',\n  url: '${url}',\n  headers: { 'x-api-key': '${safeKey}', 'Content-Type': 'application/json' },\n  ${payloadData ? `data: ${payloadStr}` : ''}\n}).then(res => console.log(res.data));`;
        case 'python':
            return `import requests\nimport json\n\nurl = "${url}"\nheaders = {"x-api-key": "${safeKey}", "Content-Type": "application/json"}\n${payloadData ? `payload = ${payloadStr}\n` : ''}response = requests.request("${method}", url, headers=headers${payloadData ? ', json=payload' : ''})\nprint(response.json())`;
        case 'php':
            return `<?php\n$ch = curl_init("${url}");\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['x-api-key: ${safeKey}', 'Content-Type: application/json']);\n${payloadData ? `curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(${payloadStr}));` : ''}\n$res = curl_exec($ch);\necho $res;`;
        default: return "";
    }
  };

  // ✅ DEFINED ONLY ONCE: REACTIVE RESPONSE PREVIEW
  const getCurrentResponse = () => {
    if (apiOperation === 'create') {
        return reqType === 'single' ? responseJsonCreateSingle : responseJsonCreateBulk;
    }
    if (apiOperation === 'track_single') return responseJsonTrackSingle;
    return responseJsonTrackBulk;
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="max-w-7xl mx-auto space-y-8 pb-20 px-4 relative">
      <div className="hidden sm:block fixed top-20 right-20 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* 🟢 HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-2 md:p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl text-white shadow-lg"><Code size={24}/></div>
                Developer Portal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-2 font-medium ml-1">Complete REST API documentation.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl text-xs font-bold text-emerald-600 border border-emerald-200">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> API System Live
        </div>
      </motion.div>

      {/* 🔑 API KEY SECTION */}
      <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h3 className="text-base md:text-lg font-bold flex items-center gap-2 dark:text-white"><Key size={20} className="text-orange-500"/> Authentication</h3>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Pass this in the <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-orange-600 font-mono">x-api-key</code> header.</p>
            </div>
            <button onClick={generateNewKey} disabled={regenerating} className="w-full md:w-auto text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-2.5 rounded-xl border border-red-200 flex items-center justify-center gap-2 hover:bg-red-100 transition-all">
                <RefreshCw size={14} className={regenerating ? "animate-spin" : ""}/> Regenerate Key
            </button>
        </div>
        <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex items-center gap-3">
            <div className="flex-1 px-4 font-mono text-sm break-all flex items-center justify-between dark:text-slate-300">
                <span className={showKey ? "" : "blur-sm select-none"}>{apiKey || "Loading..."}</span>
                <button onClick={() => setShowKey(!showKey)} className="text-slate-400 hover:text-slate-200 ml-4">
                    {showKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
            </div>
            <button onClick={() => copyToClipboard(apiKey, true)} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 transition-all">
                {copiedKey ? <Check size={20} className="text-green-500"/> : <Copy size={20} className="dark:text-white"/>}
            </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><Terminal size={18} className="text-blue-500"/> API Explorer</h3>
                <div className="space-y-4">
                    <div className="flex flex-col gap-2">
                        <EndpointTab active={apiOperation==='create'} onClick={()=>setApiOperation('create')} icon={<Box size={14}/>} label="Create Shipment"/>
                        <EndpointTab active={apiOperation==='track_single'} onClick={()=>setApiOperation('track_single')} icon={<Search size={14}/>} label="Track Single"/>
                        <EndpointTab active={apiOperation==='track_bulk'} onClick={()=>setApiOperation('track_bulk')} icon={<Layers size={14}/>} label="Track Bulk"/>
                    </div>

                    {apiOperation === 'create' && (
                        <div className="pt-2 animate-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Request Mode</label>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button onClick={()=>setReqType('single')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${reqType==='single' ? 'bg-white dark:bg-slate-700 shadow text-blue-500' : 'text-slate-500'}`}>Single</button>
                                <button onClick={()=>setReqType('bulk')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${reqType==='bulk' ? 'bg-white dark:bg-slate-700 shadow text-blue-500' : 'text-slate-500'}`}>Bulk Array</button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Language</label>
                        <select value={lang} onChange={(e:any)=>setLang(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 text-sm font-bold dark:text-white outline-none">
                            <option value="curl">cURL (CLI)</option>
                            <option value="node">Node.js (Axios)</option>
                            <option value="python">Python (Requests)</option>
                            <option value="php">PHP (cURL)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* REST ENDPOINTS WITH SUBTEXT */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
                <h4 className="font-bold text-sm mb-3 flex items-center gap-2 dark:text-white"><Server size={16} className="text-violet-500"/> Available Endpoints</h4>
                <div className="space-y-4 font-mono text-[11px]">
                    <div className="text-xs group">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black text-[10px]">POST</span>
                            <span className="text-slate-600 dark:text-slate-300">/api/v1/shipment/create</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-sans mt-1 leading-relaxed">
                            Generate new shipping labels and book pick-ups. Returns internal AWB and printable PDF link.
                        </p>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
                    <div className="text-xs group">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-black text-[10px]">GET</span>
                            <span className="text-slate-600 dark:text-slate-300">/api/v1/shipment/track</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-sans mt-1 leading-relaxed">
                            Retrieve real-time status updates and complete chronological tracking history for a single AWB.
                        </p>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
                    <div className="text-xs group">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded font-black text-[10px]">POST</span>
                            <span className="text-slate-600 dark:text-slate-300">/api/v1/shipment/track/bulk</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-sans mt-1 leading-relaxed">
                            Optimized batch tracking for up to 100 shipments. Ideal for dashboard overview syncs.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT CODE VIEWER */}
        <div className="lg:col-span-8 h-full">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col h-full min-h-[600px] overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex gap-4">
                        <TabBtn active={viewMode==='request'} onClick={()=>setViewMode('request')} label="Request Body"/>
                        <TabBtn active={viewMode==='response'} onClick={()=>setViewMode('response')} label="Response JSON"/>
                        <TabBtn active={viewMode==='schema'} onClick={()=>setViewMode('schema')} label="Field Reference"/>
                    </div>
                    <button onClick={()=>copyToClipboard(viewMode==='request' ? getCodeSnippet() : getCurrentResponse(), false)} className="text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold transition-all">
                        {copiedSnippet ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>} {copiedSnippet ? "Copied" : "Copy"}
                    </button>
                </div>

                <div className="flex-1 p-6 font-mono text-sm overflow-auto custom-scrollbar bg-[#0D1117]">
                    {viewMode === 'request' && <pre className="text-blue-300 whitespace-pre-wrap leading-relaxed animate-in fade-in">{getCodeSnippet()}</pre>}
                    {viewMode === 'response' && <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed animate-in fade-in">{getCurrentResponse()}</pre>}
                    {viewMode === 'schema' && (
                        <div className="space-y-8 min-w-[600px] pb-10 animate-in fade-in">
                            {apiOperation === 'create' ? (
                                <>
                                    <SchemaSection title="1. Identity & Corporate" fields={[
                                        { field: "client_order_id", type: "string", req: "No", desc: "Your internal order number." },
                                        { field: "ship_from_company", type: "string", req: "No", desc: "Pickup business name." },
                                        { field: "ship_to_company", type: "string", req: "No", desc: "Receiver business name." },
                                    ]}/>
                                    <SchemaSection title="2. Address Mapping" fields={[
                                        { field: "sender_name", type: "string", req: "Yes", desc: "Full name of the shipper." },
                                        { field: "sender_phone", type: "string", req: "Yes", desc: "10-digit mobile number." },
                                        { field: "sender_address", type: "string", req: "Yes", desc: "Full pickup street address." },
                                        { field: "sender_pincode", type: "string", req: "Yes", desc: "6-digit pickup ZIP code." },
                                        { field: "receiver_name", type: "string", req: "Yes", desc: "Customer full name." },
                                        { field: "receiver_phone", type: "string", req: "Yes", desc: "10-digit delivery contact." },
                                        { field: "receiver_address", type: "string", req: "Yes", desc: "Full delivery street address." },
                                        { field: "receiver_pincode", type: "string", req: "Yes", desc: "6-digit delivery ZIP code." },
                                    ]}/>
                                    <SchemaSection title="3. Financials & Logistics" fields={[
                                        { field: "payment_mode", type: "enum", req: "Yes", desc: "'Prepaid' or 'COD'." },
                                        { field: "cod_amount", type: "number", req: "Cond.", desc: "Required only if payment_mode is COD." },
                                        { field: "declared_value", type: "number", req: "Yes", desc: "Product value for insurance." },
                                        { field: "weight", type: "number", req: "Yes", desc: "Weight in KG (minimum 0.5)." },
                                    ]}/>
                                    <SchemaSection title="4. Dimensions (CM)" fields={[
                                        { field: "length", type: "number", req: "No", desc: "Default: 10 CM." },
                                        { field: "width", type: "number", req: "No", desc: "Default: 10 CM." },
                                        { field: "height", type: "number", req: "No", desc: "Default: 10 CM." },
                                        { field: "identical_package_count", type: "int", req: "No", desc: "Total number of boxes." },
                                    ]}/>
                                </>
                            ) : (
                                <SchemaSection title="Tracking Schema" fields={[
                                    { field: "awb", type: "string", req: "Yes", desc: "Internal code (UEX...)." },
                                    { field: "status.current", type: "string", req: "Yes", desc: "Latest status (e.g. In Transit)." },
                                    { field: "history[]", type: "array", req: "Yes", desc: "Event timeline array." },
                                ]}/>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </motion.div>
  );
}

// 🧩 INTERNAL COMPONENTS
function EndpointTab({ active, onClick, icon, label }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${active ? 'bg-blue-600 border-blue-700 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
            {icon} {label}
        </button>
    );
}

function TabBtn({ active, onClick, label }: any) {
    return (
        <button onClick={onClick} className={`text-xs font-bold pb-2 border-b-2 transition-all ${active ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {label}
        </button>
    );
}

function SchemaSection({ title, fields }: { title: string, fields: any[] }) {
    return (
        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
            <h4 className="text-violet-400 font-bold text-[11px] uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">{title}</h4>
            <div className="grid grid-cols-12 gap-2 text-[10px] text-slate-500 font-black mb-2 px-2">
                <div className="col-span-4">PROPERTY</div><div className="col-span-2">TYPE</div><div className="col-span-2">REQUIRED</div><div className="col-span-4">DESCRIPTION</div>
            </div>
            <div className="space-y-1">
                {fields.map((f, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 bg-slate-800/20 p-2 rounded-lg items-center hover:bg-slate-800/50 transition-colors">
                        <div className="col-span-4 font-mono text-blue-300 text-[12px]">{f.field}</div>
                        <div className="col-span-2 text-purple-400 text-[11px]">{f.type}</div>
                        <div className="col-span-2"><span className={`px-1.5 py-0.5 rounded text-[10px] ${f.req==='Yes' ? 'bg-red-500/10 text-red-400' : 'bg-slate-700 text-slate-400'}`}>{f.req}</span></div>
                        <div className="col-span-4 text-slate-400 text-[11px] leading-tight">{f.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 📦 API DUMMY DATA
const singleOrderObj = {
  client_order_id: "ORD-99881",
  ship_from_company: "Global Warehouse",
  sender_name: "Sonu Kumar",
  sender_phone: "9876543210",
  sender_address: "B-102, Industrial Estate",
  sender_city: "Mumbai",
  sender_state: "Maharashtra",
  sender_pincode: "400001",
  ship_to_company: "Acme Corp Ltd",
  receiver_name: "Rahul Verma",
  receiver_phone: "9123456789",
  receiver_address: "Suite 405, Tech Plaza",
  receiver_city: "Delhi",
  receiver_state: "Delhi",
  receiver_pincode: "110001",
  weight: 0.5,
  length: 10, width: 10, height: 10,
  identical_package_count: 1,
  package_type: "Standard Box",
  product_description: "Electronics",
  payment_mode: "Prepaid",
  declared_value: 2500
};

const bulkOrderObj = [
  { ...singleOrderObj, client_order_id: "ORD-99882", payment_mode: "COD", cod_amount: 3000 },
  { ...singleOrderObj, client_order_id: "ORD-99883", receiver_name: "Anjali Gupta" }
];

const responseJsonCreateSingle = `{
  "success": true,
  "message": "1 Shipment(s) booked successfully",
  "data": [
    {
      "awb_code": "UEX48291039",
      "client_order_id": "ORD-99881",
      "status": "created",
      "label_url": "https://www.universalexpress.live/print/UEX48291039"
    }
  ]
}`;

const responseJsonCreateBulk = `{
  "success": true,
  "message": "2 Shipment(s) booked successfully",
  "data": [
    {
      "awb_code": "UEX48291039",
      "client_order_id": "ORD-99882",
      "status": "created",
      "label_url": "https://www.universalexpress.live/print/UEX48291039"
    },
    {
      "awb_code": "UEX48291040",
      "client_order_id": "ORD-99883",
      "status": "created",
      "label_url": "https://www.universalexpress.live/print/UEX48291040"
    }
  ]
}`;

const responseJsonTrackSingle = `{
  "success": true,
  "data": {
    "awb": "UEX48291039",
    "status": {
        "current": "In Transit",
        "booked_on": "2026-02-26T10:00:00Z"
    },
    "route": { "origin": "Mumbai, Maharashtra", "destination": "Delhi, Delhi" },
    "financials": { "payment_mode": "Prepaid", "cod_to_collect": 0, "insured_value": 2500 },
    "history": [
        { "status": "In Transit", "location": "Mumbai Hub", "timestamp": "..." },
        { "status": "Pending", "location": "Mumbai", "timestamp": "..." }
    ]
  }
}`;

const responseJsonTrackBulk = `{
  "success": true,
  "total_requested": 2,
  "total_found": 2,
  "data": [
    {
      "awb": "UEX48291039",
      "status": { "current": "Pending", "booked_on": "..." },
      "route": { "origin": "Mumbai", "destination": "Delhi" },
      "history": [...]
    },
    {
      "awb": "UEX48291040",
      "status": { "current": "Delivered", "booked_on": "..." },
      "route": { "origin": "Mumbai", "destination": "Pune" },
      "history": [...]
    }
  ]
}`;