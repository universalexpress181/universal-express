"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { 
  UploadCloud, FileSpreadsheet, ListPlus, Loader2, 
  CheckCircle2, Search, ArrowRight, Save, LayoutGrid, AlertCircle
} from "lucide-react";
import * as XLSX from "xlsx";

// 🚀 1. MASTER STATUS DATA (The Brain)
const MASTER_STATUSES = [
  { code: "99", status: "PENDING PICKUP", remark: "Shipment created; waiting for courier collection" },
  { code: "100", status: "PICKUP DONE", remark: "Package successfully collected from sender" },
  { code: "201", status: "IN-TRANSIT", remark: "Standard movement between hubs" },
  { code: "305", status: "OUT FOR DELIVERY", remark: "Handed over to delivery agent for final leg" },
  { code: "400", status: "DELIVERED", remark: "Shipment successfully received by consignee" },
  { code: "500", status: "UNDELIVERED", remark: "Consignee refused to accept package" },
  { code: "501", status: "UNDELIVERED", remark: "Incomplete or incorrect address" },
  { code: "507", status: "UNDELIVERED", remark: "Consignee not ready with COD amount" },
  { code: "508", status: "UNDELIVERED", remark: "Office or residence closed" },
  { code: "526", status: "UNDELIVERED", remark: "OTP for delivery not shared by customer" },
  { code: "600", status: "RTO INITIATED", remark: "Return process started back to sender" },
  { code: "601", status: "RTO IN-TRANSIT", remark: "Parcel moving back toward origin" },
  { code: "401", status: "RTO DELIVERED", remark: "Return successfully received by original sender" },
  { code: "900", status: "PICKUP CANCELLED", remark: "Pickup cancelled" }
];

// 🚀 2. SIMPLE UI MAPPING
// These are the simple texts you see in the dropdown. 
// They map to the default code for that category.
const STATUS_MAP: Record<string, string> = {
  "Pending Pickup": "99",
  "Pickup Done": "100",
  "In Transit": "201",
  "Out for Delivery": "305",
  "Delivered": "400",
  "Cancelled": "900",
  "RTO Initiated": "600",
  "RTO In Transit": "601",
  "RTO Delivered": "401"
};

// Available Statuses for Main Dropdown
const STATUS_OPTIONS = [...Object.keys(STATUS_MAP), "Undelivered"];

// Sub-Menu options exclusively for Undelivered
const UNDELIVERED_CODES = [
  { code: "500", label: "500 - Refused to accept" },
  { code: "501", label: "501 - Incomplete address" },
  { code: "507", label: "507 - COD not ready" },
  { code: "508", label: "508 - Premises closed" },
  { code: "526", label: "526 - OTP not shared" }
];

// Helper to safely get the full object by its code
const getMasterDetails = (code: string) => {
  return MASTER_STATUSES.find(s => s.code === String(code)) || MASTER_STATUSES[0];
};

// 🚀 3. EXCEL AUTO-PARSER (Reads plain text and assigns code & remark)
const resolveExcelStatus = (input: string) => {
  const val = String(input).toUpperCase().trim();

  if (val.includes("PICKUP DONE") || val.includes("PICKED UP")) return getMasterDetails("100");
  if (val.includes("RTO IN-TRANSIT") || val.includes("RTO IN TRANSIT") || val.includes("RTO TRANSIT")) return getMasterDetails("601");
  if (val.includes("RTO DELIVERED")) return getMasterDetails("401");
  if (val.includes("RTO")) return getMasterDetails("600");
  if (val.includes("IN-TRANSIT") || val.includes("IN TRANSIT") || val.includes("TRANSIT")) return getMasterDetails("201");
  if (val.includes("OUT FOR") || val.includes("OFD")) return getMasterDetails("305");
  if (val === "DELIVERED" || val === "DELIVER") return getMasterDetails("400");
  if (val.includes("UNDELIVER")) return getMasterDetails("500");
  if (val.includes("CANCEL")) return getMasterDetails("900");
  
  // Default fallback if unknown
  return getMasterDetails("99"); 
};

export default function BulkOperationsPage() {
  const [activeTab, setActiveTab] = useState<"manual" | "excel">("manual");

  // MANUAL ENTRY STATE
  const [awbInput, setAwbInput] = useState("");
  const [manualRecords, setManualRecords] = useState<any[]>([]);
  const [loadingManual, setLoadingManual] = useState(false);
  const [updatingManual, setUpdatingManual] = useState(false);

  // EXCEL UPLOAD STATE
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [refColMap, setRefColMap] = useState("");
  const [statusColMap, setStatusColMap] = useState("");
  const [updatingExcel, setUpdatingExcel] = useState(false);
  const [excelProgress, setExcelProgress] = useState({ total: 0, done: 0 });

  // ----------------------------------------------------------------------
  // MANUAL WORKFLOW
  // ----------------------------------------------------------------------
  const fetchManualRecords = async () => {
    if (!awbInput.trim()) return alert("Please enter AWB numbers");
    setLoadingManual(true);
    
    const awbs = awbInput.split(",").map(a => a.trim()).filter(a => a);

    const { data, error } = await supabase
      .from("shipments")
      .select("id, awb_code, reference_id, current_status, remark_status_code") 
      .in("awb_code", awbs);

    if (error) {
      console.error("Supabase Error:", error);
      alert(`Database Error: ${error.message}`); 
    } else if (!data || data.length === 0) {
      alert("No shipments found for the entered AWB numbers.");
    } else {
      const formattedData = data.map(record => ({
        ...record,
        new_status: record.current_status || "", 
        new_status_code: record.remark_status_code || "",
        new_reference_id: record.reference_id || "" 
      }));
      setManualRecords(formattedData);
    }
    setLoadingManual(false);
  };

  const handleManualStatusChange = (id: string, value: string) => {
    // 🚀 Automatically map the simple text to the exact status code
    const newCode = value === "Undelivered" ? "" : (STATUS_MAP[value] || "99");
    
    setManualRecords(prev => prev.map(record => 
      record.id === id ? { ...record, new_status: value, new_status_code: newCode } : record
    ));
  };

  const handleManualCodeChange = (id: string, codeValue: string) => {
    setManualRecords(prev => prev.map(record => 
      record.id === id ? { ...record, new_status_code: codeValue } : record
    ));
  };

  const handleManualRefChange = (id: string, value: string) => {
    setManualRecords(prev => prev.map(record => 
      record.id === id ? { ...record, new_reference_id: value } : record
    ));
  };

  const updateManualRecords = async () => {
    const missingCode = manualRecords.find(r => r.new_status === "Undelivered" && !r.new_status_code);
    if (missingCode) return alert(`Please select an Undelivered reason for AWB: ${missingCode.awb_code}`);

    setUpdatingManual(true);
    try {
      // Update DB using the brain (getMasterDetails)
      const updates = manualRecords.map(record => {
        const matchedStatus = getMasterDetails(record.new_status_code);

        return supabase
          .from("shipments")
          .update({ 
            current_status: matchedStatus.status,
            remark_status_code: matchedStatus.code,
            remark: matchedStatus.remark, // 🚀 Fully mapped official remark!
            reference_id: record.new_reference_id
          }) 
          .eq("id", record.id);
      });

      await Promise.all(updates);
      alert("All manual records updated successfully!");
      fetchManualRecords();
    } catch (error) {
      console.error(error);
      alert("An error occurred while updating.");
    }
    setUpdatingManual(false);
  };

  // ----------------------------------------------------------------------
  // EXCEL WORKFLOW
  // ----------------------------------------------------------------------
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      if (data.length > 0) {
        setExcelData(data);
        setExcelColumns(Object.keys(data[0] as object));
      } else {
        alert("The uploaded Excel sheet is empty.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const updateFromExcel = async () => {
    if (!refColMap || !statusColMap) {
      return alert("Please select both the Reference Number column and the Status column.");
    }

    setUpdatingExcel(true);
    setExcelProgress({ total: excelData.length, done: 0 });

    try {
      let completed = 0;
      for (const row of excelData) {
        const refValue = row[refColMap];
        const rawStatusText = row[statusColMap]; // e.g. "In Transit"

        if (refValue && rawStatusText) {
          // 🚀 Smart parser converts plain text into Status, Code, and Remark
          const mappedData = resolveExcelStatus(rawStatusText);

          await supabase
            .from("shipments")
            .update({ 
              current_status: mappedData.status,
              remark_status_code: mappedData.code,
              remark: mappedData.remark
            })
            .eq("reference_id", String(refValue).trim()); 
        }
        completed++;
        setExcelProgress({ total: excelData.length, done: completed });
      }

      alert("Excel Bulk Update Complete!");
      setExcelData([]);
      setFileName("");
      setRefColMap("");
      setStatusColMap("");
    } catch (error) {
      console.error(error);
      alert("An error occurred during Excel update.");
    }
    setUpdatingExcel(false);
  };

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <LayoutGrid className="text-blue-500" /> Bulk Operations
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Update multiple shipments at once via manual entry or Excel upload.</p>
        </div>

        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 w-max">
          <button 
            onClick={() => setActiveTab("manual")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "manual" ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <ListPlus size={18} /> Update by AWB
          </button>
          <button 
            onClick={() => setActiveTab("excel")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === "excel" ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <FileSpreadsheet size={18} /> Update with Excel
          </button>
        </div>
      </div>

      <div className="mt-6">
        {/* ============================================================== */}
        {/* TAB 1: MANUAL ENTRY                                            */}
        {/* ============================================================== */}
        {activeTab === "manual" && (
          <div className="bg-white dark:bg-[#0a101f] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Enter AWB Numbers (comma separated)
            </label>
            <textarea
              rows={3}
              className="w-full bg-slate-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white placeholder:text-slate-400 resize-y"
              placeholder="e.g. UEX12345, UEX67890, UEX54321"
              value={awbInput}
              onChange={(e) => setAwbInput(e.target.value)}
            />

            <button
              onClick={fetchManualRecords}
              disabled={loadingManual || !awbInput}
              className="mt-4 w-full md:w-auto flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 px-8 rounded-xl hover:bg-slate-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-all"
            >
              {loadingManual ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              Fetch Records
            </button>

            {manualRecords.length > 0 && (
              <div className="mt-8 animate-in fade-in duration-300">
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-800 mb-6">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-4 font-bold">AWB Number</th>
                        <th className="p-4 font-bold">Current Status</th>
                        <th className="p-4 font-bold bg-blue-50/50 dark:bg-blue-900/10 border-l border-gray-200 dark:border-slate-700">Reference Number</th>
                        <th className="p-4 font-bold bg-blue-50/50 dark:bg-blue-900/10 w-96">Update Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                      {manualRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          
                          <td className="p-4 font-mono font-bold text-xs">{record.awb_code}</td>
                          
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{record.current_status || "N/A"}</span>
                              <span className="text-[10px] font-bold text-slate-400">Code: {record.remark_status_code || "N/A"}</span>
                            </div>
                          </td>
                          
                          <td className="p-3 border-l border-gray-200 dark:border-slate-800">
                            <input
                              type="text"
                              value={record.new_reference_id}
                              onChange={(e) => handleManualRefChange(record.id, e.target.value)}
                              placeholder="Enter Ref #"
                              className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-bold w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                          </td>
                          
                          <td className="p-3">
                            <div className="flex flex-col gap-2">
                              {/* 🚀 Simple Plain Text Dropdown */}
                              <select
                                value={record.new_status}
                                onChange={(e) => handleManualStatusChange(record.id, e.target.value)}
                                className="bg-white dark:bg-[#0f172a] border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-bold w-full outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                              >
                                <option value="">-- Select Status --</option>
                                {STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                              </select>

                              {/* CONDITIONAL SUB-MENU FOR UNDELIVERED */}
                              {record.new_status === "Undelivered" && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                                  <AlertCircle size={14} className="text-orange-500 shrink-0" />
                                  <select
                                    value={record.new_status_code}
                                    onChange={(e) => handleManualCodeChange(record.id, e.target.value)}
                                    className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/50 text-orange-700 dark:text-orange-400 rounded-lg px-3 py-1.5 text-[10px] font-bold w-full outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                  >
                                    <option value="">Select Reason...</option>
                                    {UNDELIVERED_CODES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                                  </select>
                                </div>
                              )}

                              {/* Smart auto-filled code badge */}
                              {record.new_status !== "Undelivered" && record.new_status_code && (
                                <span className="text-[10px] font-bold text-blue-500 ml-1">
                                  Auto-mapping to Code: {record.new_status_code}
                                </span>
                              )}
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={updateManualRecords}
                    disabled={updatingManual}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-10 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                  >
                    {updatingManual ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Update All Records
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: EXCEL UPLOAD                                            */}
        {/* ============================================================== */}
        {activeTab === "excel" && (
          <div className="bg-white dark:bg-[#0a101f] rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {!excelData.length ? (
              <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-12 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-slate-50 dark:bg-slate-900/50">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  id="excel-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-6 text-emerald-500 border border-emerald-100 dark:border-slate-700">
                    <UploadCloud size={36} />
                  </div>
                  <span className="font-bold text-lg text-slate-700 dark:text-white">Click to upload Excel File</span>
                  <span className="text-sm font-medium text-slate-400 mt-2">Supports .xlsx, .xls, .csv</span>
                </label>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                  <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={24} />
                    <div>
                      <p className="font-bold text-base leading-tight">{fileName}</p>
                      <p className="text-xs font-semibold opacity-80 mt-0.5">Ready to map columns</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold px-3 py-1.5 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
                    {excelData.length} Rows Found
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-[#0f172a] p-6 rounded-2xl border border-gray-200 dark:border-slate-700">
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                    <ArrowRight className="text-emerald-500" size={18}/> Column Mapping
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Reference Number Column
                      </label>
                      <select 
                        value={refColMap} 
                        onChange={(e) => setRefColMap(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-xl p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                      >
                        <option value="">-- Select Column --</option>
                        {excelColumns.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                      <p className="text-[10px] font-medium text-slate-400 mt-2">This column matches records in the database.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
                        Status Text Column
                      </label>
                      <select 
                        value={statusColMap} 
                        onChange={(e) => setStatusColMap(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3.5 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer shadow-sm shadow-blue-500/5"
                      >
                        <option value="">-- Select Column --</option>
                        {excelColumns.map(col => <option key={col} value={col}>{col}</option>)}
                      </select>
                      <p className="text-[10px] font-medium text-slate-400 mt-2">Will read text (e.g. "IN TRANSIT") and auto-assign Code & Remark.</p>
                    </div>
                  </div>
                </div>

                {updatingExcel && (
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3 mb-4 overflow-hidden shadow-inner">
                    <div 
                      className="bg-emerald-500 h-3 transition-all duration-300 rounded-full" 
                      style={{ width: `${(excelProgress.done / excelProgress.total) * 100}%` }}
                    ></div>
                    <p className="text-center text-xs font-bold mt-3 text-slate-500 tracking-wide">PROCESSING {excelProgress.done} OF {excelProgress.total}</p>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                  <button
                    onClick={() => { setExcelData([]); setFileName(""); }}
                    className="flex-1 py-3.5 px-4 rounded-xl font-bold text-sm bg-gray-100 hover:bg-gray-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancel / Remove File
                  </button>
                  <button
                    onClick={updateFromExcel}
                    disabled={updatingExcel || !refColMap || !statusColMap}
                    className="flex-[2] flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    {updatingExcel ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    Process Excel Update
                  </button>
                </div>

              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}