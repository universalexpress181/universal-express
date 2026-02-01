"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, ArrowRight, ShieldCheck, Globe, Clock, ChevronDown, PhoneCall, 
  Mail, Facebook, Twitter, Linkedin, Instagram
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// --- CONTENT CONFIGURATION ---
const features = [
  {
    id: 1,
    title: "Pan India Delivery",
    description: [
      "Hassle free documentation.",
      "Economical material supply contracts on PAN India basis.",
      "Fastest deliveries on PAN India basis in any mode i.e Rail, Air & Surface.",
      "Famous for undertaking challenges in Logistics and delivering special category materials and goods.",
      "Online tracking of goods and materials."
    ],
    icon: <Globe size={32} />,
    gradient: "from-emerald-500/20 to-teal-500/20",
    iconColor: "text-emerald-500",
    bulletColor: "bg-emerald-500", 
    borderColor: "border-emerald-500/20"
  },
  {
    id: 2,
    title: "Our Service",
    description: [
      "End-to-end supply chain solutions.",
      "Safe & secure warehousing.",
      "FTL/PL & Door-to-Door Service.",
      "Tailored B2B and B2C solutions."
    ],
    icon: <ShieldCheck size={32} />,
    gradient: "from-blue-500/20 to-indigo-500/20",
    iconColor: "text-blue-500",
    bulletColor: "bg-blue-500",
    borderColor: "border-blue-500/20"
  },
  {
    id: 3,
    title: "Delivering Trust",
    description: [
      "Right Service, Place, Qty & Price.",
      "Innovative handling of challenges.",
      "Deliverables treated as Trust.",
      "Transparent & reliable business."
    ],
    icon: <Clock size={32} />,
    gradient: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-500",
    bulletColor: "bg-orange-500",
    borderColor: "border-orange-500/20"
  },
  {
    id: 4,
    title: "Specialized Services",
    description: [
      "Warehousing & Inventory Management.",
      "Pro-active Tele-calling & Track n Trace.",
      "Wide distribution at prompt pace.",
      "Secured delivery of High-Value Goods (Laptops, Mobiles, etc)."
    ],
    icon: <PhoneCall size={32} />,
    gradient: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-500",
    bulletColor: "bg-purple-500",
    borderColor: "border-purple-500/20"
  }
];

// ⚡ ANIMATION VARIANTS
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, y: 0, 
    transition: { type: "spring", stiffness: 100, damping: 12 } 
  }
};

export default function LandingPage() {
  const router = useRouter();
  const [awb, setAwb] = useState("");

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (awb.trim()) {
      router.push(`/track/${awb.trim()}`);
    }
  };

  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col w-full bg-slate-50 dark:bg-slate-950 min-h-screen font-sans text-slate-900 dark:text-white transition-colors duration-300">
      
      {/* ================= HERO SECTION ================= */}
      <div className="relative h-screen w-full flex flex-col justify-center items-center overflow-hidden pb-32">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 px-4 w-full max-w-4xl mx-auto flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-8 mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <Globe size={12} className="text-blue-500" /> Universal Express
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Track your package <br/>
                  <span className="text-blue-600">in Real-Time.</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  Enter your AWB number below to see live status, location history, and proof of delivery.
              </p>
            </motion.div>

            <motion.form 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={handleTrack} 
              className="w-full max-w-lg relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              
              <div className="relative bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center h-16 sm:h-auto">
                  <div className="pl-4 text-slate-400 shrink-0 flex items-center justify-center">
                    <Search size={24} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter AWB or Tracking ID" 
                    className="flex-1 w-full h-full px-4 bg-transparent outline-none text-lg font-medium text-slate-900 dark:text-white placeholder:text-slate-400 min-w-0"
                    value={awb}
                    onChange={(e) => setAwb(e.target.value)}
                  />
                  <button type="submit" className="shrink-0 h-12 w-12 bg-slate-900 dark:bg-blue-600 text-white rounded-xl hover:scale-105 active:scale-95 transition-transform shadow-lg flex items-center justify-center">
                    <ArrowRight size={24} />
                  </button>
              </div>
            </motion.form>
        </div>

        {/* 👇 FIXED CHEVRON POSITIONING & ANIMATION */}
        {/* We use a STATIC wrapper div for centering */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
          {/* We animate ONLY the bounce (y-axis) inside the wrapper */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, duration: 2, repeat: Infinity }}
            className="cursor-pointer text-slate-400 hover:text-blue-500 transition-colors p-4"
            onClick={scrollToFeatures}
          >
            <ChevronDown size={32} />
          </motion.div>
        </div>

      </div>

      {/* ================= FEATURES GRID ================= */}
      <div id="features-section" className="w-full bg-slate-50 dark:bg-slate-950 relative z-20">
        <div className="max-w-[1400px] mx-auto px-6 py-24 min-h-screen flex flex-col justify-center">
            
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }} 
                transition={{ duration: 0.7 }}
                className="text-center mb-16"
            >
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Why choose Universal Express?</h2>
            </motion.div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
            >
              {features.map((feature) => (
                  <motion.div key={feature.id} variants={cardVariants} className="group relative h-full">
                    <div className="relative overflow-hidden rounded-3xl p-6 h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col items-start">
                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className={`relative z-10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 ${feature.iconColor} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                            {feature.icon}
                        </div>
                        <div className="relative z-10 w-full">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 group-hover:translate-x-1 transition-transform">{feature.title}</h3>
                            <ul className="space-y-2">
                                {feature.description.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-400 text-xs md:text-sm leading-relaxed">
                                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${feature.bulletColor}`} />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                  </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5, duration: 1 }} className="mt-24 text-center">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Ready to ship?</h2>
                    <p className="text-slate-500 dark:text-slate-400">Join thousands of businesses that trust Universal Express.</p>
                    
                    <button 
                        onClick={() => router.push('/Partner-signup')} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-600/30 active:scale-95"
                    >
                        Get Started Now
                    </button>
                </div>
            </motion.div>
        </div>
      </div>

      {/* ================= 🤝 PARTNER SECTION ================= */}
      <div className="w-full bg-white dark:bg-[#0B1121] border-t border-slate-200 dark:border-slate-800 py-20 relative z-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="space-y-12"
            >
                <div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Our Major B2B Partner</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-2xl mx-auto">
                        We are proud to be the trusted logistics backbone for leading businesses.
                    </p>
                </div>

                <div className="relative w-full h-auto flex justify-center items-center p-4">
                    <div className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-8 md:p-12">
                        <Image 
                            src="/b2b_partner1.png" 
                            alt="Major B2B Partners"
                            width={1200}
                            height={600}
                            className="object-contain w-full h-auto"
                            priority
                        />
                    </div>
                </div>
            </motion.div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <footer className="w-full bg-slate-900 text-slate-300 py-16 border-t border-slate-800 z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
            
            {/* 1. Brand & Info */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 font-black text-xl text-white tracking-tighter">
                    <div className="relative h-8 w-8">
                        <Image 
                            src="/logo.png" 
                            alt="Universal Express Logo" 
                            fill 
                            className="object-contain" 
                        /></div>
                    <span>UNIVERSAL<span className="text-blue-500">EXPRESS</span></span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                    Simplifying global logistics with technology-driven supply chain solutions. Delivering trust since 2010.
                </p>
                <div className="flex gap-4 pt-2">
                    <a href="#" className="hover:text-blue-500 transition-colors"><Facebook size={20}/></a>
                    <a href="#" className="hover:text-blue-500 transition-colors"><Twitter size={20}/></a>
                    <a href="#" className="hover:text-blue-500 transition-colors"><Linkedin size={20}/></a>
                    <a href="#" className="hover:text-blue-500 transition-colors"><Instagram size={20}/></a>
                </div>
            </div>

            {/* 2. Quick Links */}
            <div>
                <h3 className="text-white font-bold mb-6">Quick Links</h3>
                <ul className="space-y-3 text-sm">
                    <li><Link href="/" className="hover:text-blue-500 transition-colors">Home</Link></li>
                    <li><button onClick={scrollToFeatures} className="hover:text-blue-500 transition-colors text-left">Our Services</button></li>
                    <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-blue-500 transition-colors text-left">Track Shipment</button></li>
                    <li><Link href="/Partner-signup" className="hover:text-blue-500 transition-colors">Become a Partner</Link></li>
                    <li><Link href="/login" className="hover:text-blue-500 transition-colors">Login</Link></li>
                </ul>
            </div>

            {/* 3. Contact */}
            <div>
                <h3 className="text-white font-bold mb-6">Contact Us</h3>
                <ul className="space-y-4 text-sm">
                    <li className="flex items-center gap-3">
                        <PhoneCall size={18} className="text-blue-500 shrink-0"/>
                        <span>+91 98765 43210</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Mail size={18} className="text-blue-500 shrink-0"/>
                        <span>support@universalexpress.in</span>
                    </li>
                </ul>
            </div>
        </div>

        <div className="border-t border-slate-800 mt-16 pt-8 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Universal Express Logistics. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}