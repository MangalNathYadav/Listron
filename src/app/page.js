"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Check,
  Code,
  ThumbsUp,
  ListChecks,
  Globe,
  Lock,
  Star,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="bg-mesh-landing min-h-screen relative overflow-hidden">
      
      {/* Floating decorative blobs */}
      <div className="fixed pointer-events-none inset-0 overflow-hidden">
        <div className="blob-cherry absolute w-[500px] h-[500px] -top-40 -right-40 opacity-50" />
        <div className="blob-cherry-sm absolute w-[300px] h-[300px] bottom-20 -left-20 opacity-40" />
        <div className="blob-cherry absolute w-[200px] h-[200px] top-1/2 right-1/4 opacity-30" />
      </div>

      {/* Floating particles */}
      <div className="fixed pointer-events-none inset-0 overflow-hidden">
        {mounted && (
          <>
            <div className="absolute w-2 h-2 rounded-full bg-rose-300/30 top-[20%] left-[15%]" style={{ animation: 'particle-drift 8s ease-in-out infinite' }} />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-rose-400/20 top-[60%] right-[20%]" style={{ animation: 'particle-drift 12s ease-in-out infinite 2s' }} />
            <div className="absolute w-1 h-1 rounded-full bg-rose-300/25 top-[40%] left-[60%]" style={{ animation: 'particle-drift 10s ease-in-out infinite 4s' }} />
            <div className="absolute w-2.5 h-2.5 rounded-full bg-rose-200/20 top-[80%] left-[40%]" style={{ animation: 'particle-drift 14s ease-in-out infinite 1s' }} />
          </>
        )}
      </div>

      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-8 sm:py-16 flex flex-col min-h-screen">
        
        {/* Sticky Top Nav Bar */}
        <nav className={`flex items-center justify-between mb-12 sm:mb-20 transition-all duration-700 ${mounted ? 'animate-slideDown' : 'opacity-0'}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ListChecks className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight">Listron</span>
          </div>
          <button
            onClick={() => router.push("/app")}
            className="btn-primary px-5 py-2.5 text-xs flex items-center gap-1.5 cursor-pointer"
          >
            Open App
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>

        {/* ===== HERO SECTION ===== */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center flex-1">
          
          {/* Left: Hero Copy */}
          <div className={`space-y-8 text-center lg:text-left transition-all duration-700 delay-100 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
            
            {/* Announcement badge */}
            <div className="inline-flex items-center gap-2 badge-cherry animate-pulse-glow">
              <Sparkles className="w-3 h-3" />
              <span>Public Collaborative Checklists</span>
            </div>
            
            {/* Main headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
                Pack smarter,
                <br />
                <span className="gradient-text">together.</span>
              </h1>
              
              <p className="text-base sm:text-lg text-slate-500 max-w-lg mx-auto lg:mx-0 font-normal leading-relaxed">
                Create public checklists for hostel essentials and let your seniors add exactly what you&apos;ll need. Real-time, spam-proof, and beautifully simple.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center lg:items-start gap-3">
              <button
                onClick={() => router.push("/app")}
                className="btn-primary px-8 py-4 text-sm flex items-center gap-2.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <span>Start Building Lists</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-secondary px-6 py-3.5 text-sm flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
              >
                See How It Works
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                <Globe className="w-3.5 h-3.5 text-rose-400" />
                <span>No login required</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Anti-spam protection</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold">
                <Zap className="w-3.5 h-3.5 text-rose-400" />
                <span>Real-time sync</span>
              </div>
            </div>
          </div>

          {/* Right: Phone Mockup */}
          <div className={`flex justify-center relative transition-all duration-700 delay-200 ${mounted ? 'animate-slideUp' : 'opacity-0'}`}>
            
            {/* Glow behind phone */}
            <div className="absolute w-[350px] h-[350px] bg-gradient-to-tr from-rose-200/40 to-rose-100/20 rounded-full blur-[80px] pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

            {/* Orbiting decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none">
              <div className="animate-orbit">
                <div className="w-8 h-8 rounded-xl bg-white/80 border border-rose-100/50 shadow-lg flex items-center justify-center backdrop-blur-sm">
                  <ThumbsUp className="w-3.5 h-3.5 text-rose-500" />
                </div>
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none">
              <div className="animate-orbit-reverse">
                <div className="w-7 h-7 rounded-lg bg-white/80 border border-rose-100/50 shadow-lg flex items-center justify-center backdrop-blur-sm">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
              </div>
            </div>
            
            {/* Phone container */}
            <div className="relative w-[280px] h-[500px] sm:w-[300px] sm:h-[540px] bg-gradient-to-b from-slate-800 to-slate-900 rounded-[42px] p-2.5 shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden animate-float">
              
              {/* Camera island */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-950 rounded-full z-30 flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-slate-800 rounded-full border border-slate-700" />
              </div>

              {/* App screen */}
              <div className="w-full h-full bg-[#fffafb] rounded-[34px] overflow-hidden p-4 pt-8 relative flex flex-col justify-between text-left select-none">
                
                {/* Simulated content */}
                <div className="space-y-3.5">
                  
                  {/* Header */}
                  <div className="space-y-2 border-b border-rose-50 pb-3">
                    <div className="badge-cherry !py-0.5 !px-2 !text-[7px]">
                      <Sparkles className="w-2 h-2" />
                      <span>LIVE LIST</span>
                    </div>
                    <h3 className="text-[13px] font-extrabold text-slate-900">IIT Hostel H15 Essentials</h3>
                    
                    {/* Progress bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[8px] font-bold">
                        <span className="text-slate-400">Packing Progress</span>
                        <span className="sim-progress-percent text-rose-500 font-extrabold" />
                      </div>
                      <div className="progress-bar-track !h-1.5">
                        <div className="sim-progress-bar progress-bar-fill" style={{ width: '50%' }} />
                      </div>
                    </div>
                  </div>

                  {/* Item rows */}
                  <div className="space-y-2">
                    
                    {/* Row 1 */}
                    <div className="bg-white rounded-xl p-2.5 flex items-center justify-between border border-rose-50 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 rounded-md border border-rose-200 bg-white flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">Surge protector board</p>
                          <span className="text-[7px] text-rose-400 font-bold uppercase tracking-wider">Electronics</span>
                        </div>
                      </div>
                      <button className="sim-upvote-btn flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-100 text-slate-500 transition text-[9px]">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span className="sim-upvote-count font-extrabold" />
                      </button>
                    </div>

                    {/* Row 2 - animated */}
                    <div className="bg-white rounded-xl p-2.5 flex items-center justify-between border border-rose-50 shadow-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="sim-checkbox w-4 h-4 rounded-md border flex items-center justify-center text-transparent transition flex-shrink-0">
                          <Check className="w-2.5 h-2.5 stroke-[3.5]" />
                        </div>
                        <div className="min-w-0">
                          <p className="sim-label text-[10px] font-bold truncate">Bed sheets & pillow</p>
                          <span className="text-[7px] text-rose-400 font-bold uppercase tracking-wider">Bedding</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-100 text-slate-400 bg-slate-50/50 text-[9px]">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span className="font-extrabold">24</span>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="bg-white rounded-xl p-2.5 flex items-center justify-between border border-rose-50 shadow-sm opacity-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 rounded-md border border-slate-200 bg-white flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">Laundry wash bags</p>
                          <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Laundry</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg border border-slate-100 text-slate-400 text-[9px]">
                        <ThumbsUp className="w-2.5 h-2.5" />
                        <span className="font-extrabold">8</span>
                      </div>
                    </div>

                    {/* Row 4 - even more faded */}
                    <div className="bg-white rounded-xl p-2.5 flex items-center justify-between border border-rose-50 shadow-sm opacity-30">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-4 h-4 rounded-md border border-slate-200 bg-white flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-800 truncate">Water bottle (1L)</p>
                          <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider">Kitchen</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-rose-50 pt-2 flex items-center justify-between">
                  <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">Listron Live</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== FEATURES SECTION ===== */}
        <section id="features" className="mt-20 sm:mt-32 scroll-mt-20">
          
          <div className={`text-center space-y-3 mb-12 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            <div className="badge-cherry mx-auto">
              <Star className="w-3 h-3" />
              <span>Why Listron?</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Built for the <span className="gradient-text">real world</span>
            </h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Every feature designed with freshmen and seniors in mind. No signup walls. No friction.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Feature 1 */}
            <div className="cherry-card cherry-card-hover rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50">
                <Globe className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Public & Shareable</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create a list and share the link. Anyone with the URL can add items — no sign up needed.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="cherry-card cherry-card-hover rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Smart Anti-Spam</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Adaptive rate limiting catches spam before it happens. Cooldowns escalate automatically for repeat offenders.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="cherry-card cherry-card-hover rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50">
                <Zap className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Real-Time Sync</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Powered by Firebase Realtime DB. Every addition, upvote, and check appears instantly for everyone.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="cherry-card cherry-card-hover rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50">
                <ThumbsUp className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Community Upvoting</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Best suggestions rise to the top. The crowd decides what&apos;s truly essential.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="cherry-card cherry-card-hover rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50">
                <Users className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Anonymous Access</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                No accounts, no passwords. Just open, contribute, and help the next batch of freshers.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="cherry-card cherry-card-hover rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 flex items-center justify-center border border-rose-100/50">
                <ListChecks className="w-5 h-5 text-rose-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Track Progress</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check off items as you pack. See your progress bar fill up before the big move-in day.
              </p>
            </div>
          </div>
        </section>

        {/* ===== CTA BANNER ===== */}
        <section className="mt-20 sm:mt-28 mb-12">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-rose-500 to-rose-600 p-8 sm:p-12 text-center text-white shadow-2xl shadow-rose-500/20 animate-gradient">
            
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            
            <div className="relative z-10 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Ready to build your checklist?
              </h2>
              <p className="text-sm text-rose-100 max-w-md mx-auto">
                Join hundreds of students who are using Listron to make their hostel move-in stress-free.
              </p>
              <button
                onClick={() => router.push("/app")}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold bg-white text-rose-600 text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="pt-8 pb-6 border-t border-rose-50 flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full cherry-glass text-slate-600 text-[10px] font-bold shadow-sm">
            <Code className="w-3.5 h-3.5 text-rose-500" />
            <span>Vibe coded by shadowXg on Antigravity IDE</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-slate-400 font-semibold">
            <span>Gemini 3.5 Flash</span>
            <span className="w-1 h-1 rounded-full bg-rose-200" />
            <span>Claude Opus 4.5 Thinking</span>
            <span className="w-1 h-1 rounded-full bg-rose-200" />
            <span>Firebase RTDB</span>
            <span className="w-1 h-1 rounded-full bg-rose-200" />
            <span>Next.js + Tailwind</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
