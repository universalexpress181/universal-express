"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Key, Copy, RefreshCw, Check, Shield, Code, Server, 
  Eye, EyeOff, Box, Layers, Terminal, FileJson, 
  BookOpen, Globe, Zap, Hash, Coffee, Menu 
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
  const [baseUrl, setBaseUrl] = useState("");
  const [showKey, setShowKey] = useState(false);
  
  // UI States
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // Tabs & Config
  const [reqType, setReqType] = useState<'single' | 'bulk'>('single');
  const [lang, setLang] = useState<'curl' | 'node' | 'python' | 'php' | 'csharp' | 'go'>('curl');
  const [viewMode, setViewMode] = useState<'request' | 'response' | 'schema'>('request');

  useEffect(() => {
    // Check if window exists to prevent SSR errors
    if (typeof window !== 'undefined') {
        setBaseUrl(window.location.origin);
    }
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('api_keys')
      .select('secret_key')
      .eq('user_id', user.id)
      .single();

    if (data) setApiKey(data.secret_key);
    setLoading(false);
  };

  const generateNewKey = async () => {
    if (!confirm("⚠️ WARNING: Generating a new key will stop all your existing integrations immediately. Are you sure?")) return;
    setRegenerating(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newKey = "univ_live_" + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
    
    const { error } = await supabase
        .from('api_keys')
        .upsert({ user_id: user.id, secret_key: newKey }, { onConflict: 'user_id' });

    if (!error) {
        setApiKey(newKey);
        alert("✅ New API Key Generated!");
    }
    setRegenerating(false);
  };

  const copyToClipboard = (text: string, isKey: boolean) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (isKey) {
        setCopiedKey(true);
        setTimeout(() => setCopiedKey(false), 2000);
    } else {
        setCopiedSnippet(true);
        setTimeout(() => setCopiedSnippet(false), 2000);
    }
  };

  // 🧑‍💻 CODE GENERATOR LOGIC
  const getCodeSnippet = () => {
    const url = `${baseUrl}/api/v1/shipment/create`;
    const safeKey = apiKey || "YOUR_API_KEY";
    const payloadData = reqType === 'single' ? singleOrderObj : bulkOrderObj;
    const payloadStr = JSON.stringify(payloadData, null, 2);

    switch (lang) {
        case 'curl':
            return `# Universal integration for any terminal
curl -X POST "${url}" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${safeKey}" \\
  -d '${JSON.stringify(payloadData)}'`;

        case 'node':
            return `const axios = require('axios');

// 1. Setup
const config = {
  method: 'post',
  url: '${url}',
  headers: { 
    'Content-Type': 'application/json', 
    'x-api-key': '${safeKey}'
  },
  data: ${payloadStr}
};

// 2. Execute
axios(config)
.then(function (response) {
  console.log(JSON.stringify(response.data));
})
.catch(function (error) {
  console.log(error);
});`;

        case 'python':
            return `import requests
import json

url = "${url}"

payload = ${payloadStr}

headers = {
  'Content-Type': 'application/json',
  'x-api-key': '${safeKey}'
}

response = requests.request("POST", url, headers=headers, json=payload)

print(response.text)`;

        case 'php':
            return `<?php
$curl = curl_init();

$payload = json_encode(${payloadStr});

curl_setopt_array($curl, array(
  CURLOPT_URL => '${url}',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS => $payload,
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/json',
    'x-api-key: ${safeKey}'
  ),
));

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;

        case 'csharp':
            return `var client = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.Post, "${url}");

request.Headers.Add("x-api-key", "${safeKey}");

var content = new StringContent(
    ${JSON.stringify(JSON.stringify(payloadData))},
    null, 
    "application/json"
);

request.Content = content;
var response = await client.SendAsync(request);
response.EnsureSuccessStatusCode();
Console.WriteLine(await response.Content.ReadAsStringAsync());`;

        case 'go':
            return `package main

import (
  "fmt"
  "strings"
  "net/http"
  "io/ioutil"
)

func main() {
  url := "${url}"
  method := "POST"

  payload := strings.NewReader(\`${JSON.stringify(payloadData)}\`)

  client := &http.Client {}
  req, err := http.NewRequest(method, url, payload)

  if err != nil { fmt.Println(err); return }

  req.Header.Add("Content-Type", "application/json")
  req.Header.Add("x-api-key", "${safeKey}")

  res, err := client.Do(req)
  if err != nil { fmt.Println(err); return }
  defer res.Body.Close()

  body, err := ioutil.ReadAll(res.Body)
  if err != nil { fmt.Println(err); return }
  fmt.Println(string(body))
}`;
        default: return "";
    }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-7xl mx-auto space-y-8 md:space-y-10 pb-20 px-4 sm:px-6 lg:px-8 relative"
    >
      {/* ✨ Background Glows - Hidden on small mobile to save battery/performance */}
      <div className="hidden sm:block fixed top-20 right-20 w-96 h-96 bg-violet-500/10 dark:bg-violet-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="hidden sm:block fixed bottom-20 left-20 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* 🟢 HEADER */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                <div className="p-2 md:p-2.5 bg-gradient-to-br from-violet-500 to-fuchsia-600 rounded-xl text-white shadow-lg shadow-violet-500/20">
                    <Code size={24}/>
                </div>
                Developer Portal
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm mt-2 font-medium ml-1 max-w-lg">
                Complete documentation & tools for integrating our logistics API into your platform.
            </p>
        </div>
      </motion.div>

      {/* 🛠️ INTEGRATION STEPS - Stack on mobile, Grid on desktop */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepCard number="1" title="Get API Key" desc="Generate your x-api-key below. This token authenticates your account." />
          <StepCard number="2" title="Send JSON Payload" desc="POST your order data to our endpoint. We support Single & Bulk arrays." />
          <StepCard number="3" title="Handle Response" desc="Store the returned AWB code and Label URL in your database." />
      </motion.div>

      {/* 🔑 API KEY SECTION - Responsive Flex */}
      <motion.div variants={itemVariants} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-yellow-400 to-orange-500"></div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Key size={20} className="text-orange-500"/> Authentication
                </h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Pass this in the <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-orange-600 dark:text-orange-400 font-mono text-[10px] md:text-xs border border-slate-200 dark:border-slate-700">x-api-key</code> header.
                </p>
            </div>
            <button 
                onClick={generateNewKey} 
                disabled={regenerating} 
                className="w-full md:w-auto text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 flex items-center justify-center md:justify-start gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
            >
                <RefreshCw size={14} className={regenerating ? "animate-spin" : ""} /> Regenerate Key
            </button>
        </div>

        {/* Responsive Key Display */}
        <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 md:p-2 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="w-full md:flex-1 px-2 md:px-4 py-2 font-mono text-slate-600 dark:text-slate-300 text-xs md:text-sm lg:text-base break-all flex items-center justify-between md:justify-start gap-3">
                <span className={showKey ? "" : "blur-sm select-none transition-all duration-300"}>
                    {apiKey || "Generating..."}
                </span>
                <button onClick={() => setShowKey(!showKey)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1">
                    {showKey ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
            </div>
            <motion.button 
                whileTap={{ scale: 0.9 }}
                onClick={() => copyToClipboard(apiKey, true)} 
                disabled={!apiKey}
                className="w-full md:w-auto p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-white rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all flex justify-center"
            >
                {copiedKey ? <Check size={20} className="text-green-500"/> : <Copy size={20}/>}
            </motion.button>
        </div>
      </motion.div>

      {/* 💻 CODE & DOCS SECTION - Stack order change on mobile */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        
        {/* LEFT: CONTROLS & INFO (On mobile: Top) */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Terminal size={18} className="text-blue-500"/> Integration Config
                </h3>
                
                {/* 1. Request Type */}
                <div className="mb-6">
                    <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mb-2 block">Payload Mode</label>
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
                        <button onClick={() => setReqType('single')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${reqType === 'single' ? 'bg-white dark:bg-slate-800 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                            <Box size={14}/> Single
                        </button>
                        <button onClick={() => setReqType('bulk')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${reqType === 'bulk' ? 'bg-white dark:bg-slate-800 shadow text-purple-600 dark:text-purple-400' : 'text-slate-500'}`}>
                            <Layers size={14}/> Bulk
                        </button>
                    </div>
                </div>

                {/* 2. Language */}
                <div>
                    <label className="text-[10px] md:text-xs font-bold text-slate-400 uppercase mb-2 block">Platform / Language</label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        <LanguageOption label="cURL / Shell" icon="🐚" active={lang === 'curl'} onClick={() => setLang('curl')} />
                        <LanguageOption label="Node.js (Axios)" icon="🟩" active={lang === 'node'} onClick={() => setLang('node')} />
                        <LanguageOption label="Python (Requests)" icon="🐍" active={lang === 'python'} onClick={() => setLang('python')} />
                        <LanguageOption label="PHP (cURL)" icon="🐘" active={lang === 'php'} onClick={() => setLang('php')} />
                        <LanguageOption label="C# (.NET)" icon="#️⃣" active={lang === 'csharp'} onClick={() => setLang('csharp')} />
                        <LanguageOption label="Go (Golang)" icon="🔵" active={lang === 'go'} onClick={() => setLang('go')} />
                    </div>
                </div>
            </div>

            {/* Endpoints Info */}
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                    <Server size={16} className="text-violet-500"/> API Endpoints
                </h4>
                <div className="space-y-3">
                    <div className="text-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-black text-[10px]">POST</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300 break-all">/api/v1/shipment/create</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-tight">Create orders. Returns AWB & Label.</p>
                    </div>
                    <div className="h-px bg-slate-200 dark:bg-slate-800"></div>
                    <div className="text-xs">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded font-black text-[10px]">GET</span>
                            <span className="font-mono text-slate-600 dark:text-slate-300 break-all">/api/v1/shipment/track/[awb]</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 leading-tight">Get live status & timeline.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT: CODE & SCHEMA (On mobile: Bottom) */}
        <div className="lg:col-span-8">
            <div className="bg-slate-900 rounded-2xl md:rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-full min-h-[500px] md:min-h-[600px]">
                
                {/* Editor Tabs - Horizontally scrollable on mobile */}
                <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-slate-800 bg-slate-950/50">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        <TabButton active={viewMode === 'request'} onClick={() => setViewMode('request')} label="Request Code" icon={Code}/>
                        <TabButton active={viewMode === 'response'} onClick={() => setViewMode('response')} label="Response Example" icon={FileJson}/>
                        <TabButton active={viewMode === 'schema'} onClick={() => setViewMode('schema')} label="Field Reference" icon={BookOpen}/>
                    </div>
                    {viewMode !== 'schema' && (
                        <button 
                            onClick={() => copyToClipboard(viewMode === 'request' ? getCodeSnippet() || "" : responseJson, false)}
                            className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors ml-4 shrink-0"
                        >
                            {copiedSnippet ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                            {copiedSnippet ? "Copied!" : "Copy"}
                        </button>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 p-4 md:p-6 overflow-auto custom-scrollbar bg-[#0D1117] relative">
                    
                    {/* Floating Copy Button for Mobile */}
                    {viewMode !== 'schema' && (
                        <button 
                            onClick={() => copyToClipboard(viewMode === 'request' ? getCodeSnippet() || "" : responseJson, false)}
                            className="md:hidden absolute top-4 right-4 p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white shadow-lg border border-slate-700 z-10"
                        >
                            {copiedSnippet ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                        </button>
                    )}

                    {viewMode === 'request' && (
                        <pre className="font-mono text-[10px] md:text-sm leading-relaxed text-blue-300 animate-in fade-in whitespace-pre-wrap md:whitespace-pre">
                            {getCodeSnippet()}
                        </pre>
                    )}

                    {viewMode === 'response' && (
                        <pre className="font-mono text-[10px] md:text-sm leading-relaxed text-emerald-400 animate-in fade-in whitespace-pre-wrap md:whitespace-pre">
                            {responseJson}
                        </pre>
                    )}

                    {/* 📖 SCHEMA GUIDE TABLE - Responsive scroll */}
                    {viewMode === 'schema' && (
                        <div className="animate-in fade-in space-y-6 overflow-x-auto">
                            <SchemaTable title="Sender Details" fields={[
                                { name: "sender_name", type: "String", req: "Yes", desc: "Name of the business/sender." },
                                { name: "sender_phone", type: "String", req: "Yes", desc: "10-digit mobile number." },
                                { name: "sender_address", type: "String", req: "Yes", desc: "Building, Street, Area." },
                                { name: "sender_city", type: "String", req: "Yes", desc: "City name (e.g. Mumbai)." },
                                { name: "sender_pincode", type: "String", req: "Yes", desc: "6-digit postal code." },
                            ]}/>
                            
                            <SchemaTable title="Receiver Details" fields={[
                                { name: "receiver_name", type: "String", req: "Yes", desc: "Customer's full name." },
                                { name: "receiver_phone", type: "String", req: "Yes", desc: "Customer's mobile number." },
                                { name: "receiver_address", type: "String", req: "Yes", desc: "Full delivery address." },
                                { name: "receiver_pincode", type: "String", req: "Yes", desc: "Destination pincode." },
                            ]}/>

                            <SchemaTable title="Shipment Info" fields={[
                                { name: "weight", type: "Number", req: "Yes", desc: "Weight in KG (e.g. 0.5)." },
                                { name: "package_type", type: "String", req: "No", desc: "Default: 'Standard Box'." },
                                { name: "payment_mode", type: "String", req: "Yes", desc: "'Prepaid' or 'COD'." },
                                { name: "cod_amount", type: "Number", req: "Cond", desc: "Required if mode is COD." },
                                { name: "declared_value", type: "Number", req: "Yes", desc: "Product value for insurance." },
                            ]}/>
                        </div>
                    )}

                </div>
            </div>
        </div>

      </motion.div>
    </motion.div>
  );
}

// 🧩 SUB-COMPONENTS

function StepCard({ number, title, desc }: { number: string, title: string, desc: string }) {
    return (
        <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-start gap-4 hover:bg-white/80 dark:hover:bg-slate-900/80 transition-colors">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 shrink-0 border border-slate-300 dark:border-slate-700">
                {number}
            </div>
            <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}

function LanguageOption({ label, icon, active, onClick }: any) {
    return (
        <button 
            onClick={onClick}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-bold transition-all ${active ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-slate-400'}`}
        >
            <span className="flex items-center gap-2"><span className="text-lg">{icon}</span> {label}</span>
            {active && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
        </button>
    )
}

function TabButton({ active, onClick, label, icon: Icon }: any) {
    return (
        <button 
            onClick={onClick} 
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${active ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
        >
            <Icon size={14}/> {label}
        </button>
    )
}

function SchemaTable({ title, fields }: { title: string, fields: any[] }) {
    return (
        <div className="min-w-[500px]">
            <h4 className="text-violet-400 font-bold text-sm mb-2 px-1 border-b border-slate-800 pb-2">{title}</h4>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-800">
                        <th className="py-2 pl-1 w-32">Field</th>
                        <th className="py-2 w-20">Type</th>
                        <th className="py-2 w-16">Required</th>
                        <th className="py-2">Description</th>
                    </tr>
                </thead>
                <tbody className="text-xs text-slate-300">
                    {fields.map((f, i) => (
                        <tr key={i} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                            <td className="py-2 pl-1 font-mono text-blue-300">{f.name}</td>
                            <td className="py-2 text-purple-400">{f.type}</td>
                            <td className="py-2">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${f.req === 'Yes' ? 'bg-red-900/30 text-red-400' : 'bg-slate-800 text-slate-400'}`}>{f.req}</span>
                            </td>
                            <td className="py-2 text-slate-400">{f.desc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

// 📦 DUMMY DATA FOR CODE GEN
const singleOrderObj = {
  sender_name: "My Store",
  sender_phone: "9876543210",
  sender_address: "123 Market St",
  sender_city: "Mumbai",
  sender_state: "Maharashtra",
  sender_pincode: "400001",
  receiver_name: "Rahul Sharma",
  receiver_phone: "9123456789",
  receiver_address: "Flat 101, Green Apts",
  receiver_city: "Delhi",
  receiver_state: "Delhi",
  receiver_pincode: "110001",
  weight: 0.5,
  package_type: "Standard Box",
  payment_mode: "Prepaid",
  declared_value: 1500
};

const bulkOrderObj = [
  { ...singleOrderObj, receiver_name: "Amit Verma", payment_mode: "COD", cod_amount: 2500 },
  { ...singleOrderObj, receiver_name: "Priya Singh", weight: 1.2 }
];

const responseJson = `{
  "success": true,
  "message": "1 Shipment(s) booked successfully",
  "data": [
    {
      "awb_code": "UEX28374928",
      "receiver_name": "Rahul Sharma",
      "status": "created",
      "label_url": "https://universal.express/print/UEX28374928"
    }
  ]
}`;