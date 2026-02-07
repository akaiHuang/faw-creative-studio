'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import { 
  Crosshair, ArrowRight, Shield, Zap, Activity, 
  Instagram, Lock, Menu, X, Terminal, Database,
  Cpu, Share2, Send, ChevronRight
} from 'lucide-react';

// Dynamic imports for 3D components (避免 SSR 問題)
const GameV3Hero = dynamic(() => import('@/components/game-v3/GameV3Hero'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-[#00FF99] font-mono text-sm animate-pulse">
        LOADING_SCENE...
      </div>
    </div>
  )
});

// Dynamic imports for sections
const BlogSection = dynamic(() => import('@/components/sections/BlogSection'), { ssr: false });
const BrandExperience = dynamic(() => import('@/components/sections/BrandExperience'), { ssr: false });

/**
 * Universal FAW Labs - 主頁面
 */
export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [scrolled, setScrolled] = useState(false);
  
  // 模組選擇狀態
  const [selectedModules, setSelectedModules] = useState({
    luckyDraw: false,
    igShare: false,
    crmApi: false,
  });
  
  // 計算總金額
  const basePrice = 150000;
  const modulesPrices = {
    luckyDraw: 50000,
    igShare: 80000,
    crmApi: 60000,
  };
  const totalPrice = basePrice + 
    (selectedModules.luckyDraw ? modulesPrices.luckyDraw : 0) +
    (selectedModules.igShare ? modulesPrices.igShare : 0) +
    (selectedModules.crmApi ? modulesPrices.crmApi : 0);
  
  // 切換模組選擇
  const toggleModule = (moduleName) => {
    setSelectedModules(prev => ({
      ...prev,
      [moduleName]: !prev[moduleName]
    }));
  };

  // 時鐘 & 滾動偵測
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentTime(
        `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}:${d.getSeconds().toString().padStart(2,'0')}`
      );
    }, 1000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-[#EAEAEA] font-mono overflow-x-hidden selection:bg-[#FF004D] selection:text-black">
      {/* Global Styles */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&family=Chakra+Petch:wght@400;600;700&family=Noto+Sans+TC:wght@400;500;700&display=swap');
        
        :root {
          --c-primary: #00FF99;
          --c-alert: #FF004D;
          --c-dark: #050505;
          --c-grid: #1A1A1A;
        }

        .font-tech { font-family: 'Chakra Petch', sans-serif; }
        .font-code { font-family: 'JetBrains Mono', monospace; }
        
        /* Blueprint Grid Background */
        .bg-grid-pattern {
          background-size: 40px 40px;
          background-image:
            linear-gradient(to right, var(--c-grid) 1px, transparent 1px),
            linear-gradient(to bottom, var(--c-grid) 1px, transparent 1px);
        }

        /* Slow spin animation */
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }

        /* Line clamp */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      
      {/* Scanline Overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />

      {/* Header / HUD Top Bar */}
      <nav className={`fixed w-full z-50 border-b border-[#222] transition-all duration-300 ${
        scrolled ? 'bg-black/95 backdrop-blur-md' : 'bg-black/80 backdrop-blur-sm'
      }`}>
        <div className="flex justify-between items-stretch h-12 font-mono text-xs">
          {/* Logo Area */}
          <div className="flex items-center px-4 border-r border-[#222] bg-[#111]/50">
            <img src="/logo.svg" alt="FAW" className="h-6 w-auto opacity-90" />
          </div>

          {/* Status Bar */}
          <div className="hidden md:flex flex-1 items-center px-4 overflow-hidden text-[#555]">
            <span className="animate-pulse mr-4 text-[#00FF99]">● SYSTEM OPTIMAL</span>
            <span className="mr-8">LOAD: 12%</span>
            <span className="mr-8">LATENCY: 4ms</span>
            <span className="mr-8 truncate">LATEST: NEW PORTFOLIO UPDATE...</span>
          </div>

          {/* Clock & Menu */}
          <div className="flex items-center">
            <div className="hidden md:flex items-center px-6 border-l border-[#222] h-full text-[#00FF99]">
              {currentTime} TPE
            </div>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="px-6 border-l border-[#222] h-full hover:bg-[#FF004D] hover:text-white transition-colors uppercase tracking-wider"
            >
              {isMenuOpen ? 'Close_X' : 'Menu_+'}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Fullscreen Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex flex-col justify-center items-center space-y-8 text-2xl tracking-widest"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
          >
            <a href="#hero" onClick={() => setIsMenuOpen(false)} className="hover:text-[#00FF99] hover:underline decoration-1 underline-offset-8 transition-colors">01 // HOME</a>
            <a href="#experience" onClick={() => setIsMenuOpen(false)} className="hover:text-[#00FF99] hover:underline decoration-1 underline-offset-8 transition-colors">02 // EXPERIENCE</a>
            <a href="#blog" onClick={() => setIsMenuOpen(false)} className="hover:text-[#00FF99] hover:underline decoration-1 underline-offset-8 transition-colors">03 // BLOG</a>
            <a href="#solutions" onClick={() => setIsMenuOpen(false)} className="hover:text-[#00FF99] hover:underline decoration-1 underline-offset-8 transition-colors">04 // SOLUTIONS</a>
            <a href="#lab" onClick={() => setIsMenuOpen(false)} className="hover:text-[#00FF99] hover:underline decoration-1 underline-offset-8 transition-colors">05 // LAB</a>
            <a href="#contact" onClick={() => setIsMenuOpen(false)} className="hover:text-[#FF004D] hover:underline decoration-1 underline-offset-8 text-[#FF004D] transition-colors">06 // CONTACT</a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main>
        {/* HERO SECTION - 3D 場景 */}
        <section id="hero">
          <GameV3Hero />
        </section>

        {/* 品牌經驗區塊 */}
        <BrandExperience />

        {/* Blog 區塊 */}
        <BlogSection />

        {/* SOLUTIONS - DUAL TERMINAL STYLE */}
        <section id="solutions" className="grid grid-cols-1 md:grid-cols-2 border-b border-[#222] bg-grid-pattern">
          {/* Left Terminal */}
          <div className="border-r border-[#222] p-8 md:p-16 hover:bg-[#080808] transition-colors group relative">
            <div className="absolute top-4 right-4">
              <Shield className="text-[#333] group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-blue-500 font-mono text-xs mb-2 tracking-widest">[ SECTOR_A: AGENCY ]</h3>
            <h2 className="text-4xl mb-6 text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              AGENCY<br/>PROTOCOL
            </h2>
            <div className="font-mono text-xs text-gray-500 space-y-4 mb-8">
              <div className="flex justify-between border-b border-[#222] pb-2">
                <span>UPTIME_GUARANTEE</span>
                <span className="text-white">99.99%</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-2">
                <span>WHITE_LABEL_MODE</span>
                <span className="text-white">ACTIVE</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-2">
                <span>LINE_OA_MODULE</span>
                <span className="text-white">INSTALLED</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              "穩定"是我們的核心算法。我們為代理商提供隱形且堅固的技術後盾。
            </p>
            <button className="text-blue-500 text-xs border border-blue-500/30 px-4 py-2 hover:bg-blue-500 hover:text-white transition-colors">
              ACCESS_DOCS
            </button>
          </div>

          {/* Right Terminal */}
          <div className="p-8 md:p-16 hover:bg-[#080808] transition-colors group relative overflow-hidden">
            <div className="absolute top-4 right-4">
              <Zap className="text-[#333] group-hover:text-[#FF004D] transition-colors" />
            </div>
            <h3 className="text-[#FF004D] font-mono text-xs mb-2 tracking-widest">[ SECTOR_B: WEB3 ]</h3>
            <h2 className="text-4xl mb-6 text-white group-hover:animate-pulse" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              INNOVATION<br/>FRONTIER
            </h2>
            <div className="font-mono text-xs text-gray-500 space-y-4 mb-8">
              <div className="flex justify-between border-b border-[#222] pb-2">
                <span>TOKEN_GATE</span>
                <span className="text-[#00FF99]">ENABLED</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-2">
                <span>GEN_AI_ENGINE</span>
                <span className="text-[#00FF99]">STANDBY</span>
              </div>
              <div className="flex justify-between border-b border-[#222] pb-2">
                <span>VISUAL_BONDING</span>
                <span className="text-[#00FF99]">V.2.0</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-6">
              實驗性質的技術沙盒。故障藝術、鏈上數據、生成式行銷。
            </p>
            <button className="text-[#FF004D] text-xs border border-[#FF004D]/30 px-4 py-2 hover:bg-[#FF004D] hover:text-black transition-colors">
              ENTER_NODE
            </button>
          </div>
        </section>

        {/* LAB - DATA GRID STYLE */}
        <section id="lab" className="py-20 border-b border-[#222] bg-[#020202]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-12 border-b border-[#333] pb-4">
              <div>
                <h2 className="text-4xl text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>FAW_LAB</h2>
                <p className="font-mono text-xs text-[#666] mt-2">Experimental Builds // Do Not Distribute</p>
              </div>
              <div className="font-mono text-xs text-[#00FF99] animate-pulse">
                STATUS: RUNNING TESTS
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#222] border border-[#222]">
              {/* Demo A */}
              <div className="bg-black p-8 relative group">
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#555]"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#555]"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#555]"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#555]"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#111] border border-[#333] p-2">
                    <Activity className="text-[#00FF99] w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] bg-[#00FF99] text-black px-1">ONLINE</span>
                </div>
                
                <h3 className="text-2xl mb-2 text-white group-hover:text-[#00FF99] transition-colors" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  CYBER PINBALL
                </h3>
                <p className="font-mono text-xs text-gray-500 mb-8 h-12">
                  WebSocket 低延遲雙機連動測試。手機即時控制大螢幕。
                </p>
                
                <div className="w-full bg-[#111] h-32 mb-6 border border-[#222] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'linear-gradient(#00FF99 1px, transparent 1px)', backgroundSize: '100% 20px'}}></div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-[#00FF99]" style={{animation: 'pulse 2s ease-in-out infinite'}}></div>
                </div>

                <button className="w-full border border-[#333] py-3 font-mono text-xs hover:bg-[#00FF99] hover:text-black transition-colors">
                  LAUNCH_DEMO.EXE
                </button>
              </div>

              {/* Demo B */}
              <div className="bg-black p-8 relative group">
                <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-[#555]"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-r border-t border-[#555]"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-[#555]"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-[#555]"></div>
                
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#111] border border-[#333] p-2">
                    <Instagram className="text-[#FF004D] w-6 h-6" />
                  </div>
                  <span className="font-mono text-[10px] bg-[#FF004D] text-white px-1">POPULAR</span>
                </div>
                
                <h3 className="text-2xl mb-2 text-white group-hover:text-[#FF004D] transition-colors" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  AI FORTUNE
                </h3>
                <p className="font-mono text-xs text-gray-500 mb-8 h-12">
                  生成式 AI 算命攤。自動合成 IG 限時動態格式影像。
                </p>
                
                <div className="w-full bg-[#111] h-32 mb-6 border border-[#222] flex items-center justify-center">
                  <div className="text-[#333] text-4xl" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>?</div>
                </div>

                <button className="w-full border border-[#333] py-3 font-mono text-xs hover:bg-[#FF004D] hover:text-black transition-colors">
                  GENERATE_IMG.PY
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* MAKER - COCKPIT STYLE */}
        <section id="maker" className="py-20 border-b border-[#222] bg-[#050505]">
          <div className="max-w-5xl mx-auto px-4">
            <div className="border border-[#333] bg-[#000] p-1 relative">
              {/* Decorative Rivets */}
              <div className="absolute top-0 left-0 p-1"><div className="w-1 h-1 bg-[#555] rounded-full"></div></div>
              <div className="absolute top-0 right-0 p-1"><div className="w-1 h-1 bg-[#555] rounded-full"></div></div>
              <div className="absolute bottom-0 left-0 p-1"><div className="w-1 h-1 bg-[#555] rounded-full"></div></div>
              <div className="absolute bottom-0 right-0 p-1"><div className="w-1 h-1 bg-[#555] rounded-full"></div></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                {/* Left Panel */}
                <div className="md:col-span-1 border-r border-[#222] p-8 bg-[#080808]">
                  <h2 className="text-2xl text-white mb-2" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>CONFIGURATOR</h2>
                  <p className="font-mono text-xs text-gray-500 mb-8">
                    Build your project specs.
                  </p>
                  
                  <div className="space-y-2 font-mono text-xs">
                    <div className="bg-[#111] p-2 text-[#00FF99] border-l-2 border-[#00FF99]">User: GUEST_01</div>
                    <div className="bg-[#111] p-2 text-gray-500 border-l-2 border-[#333]">Access: RESTRICTED</div>
                    <div className="mt-8 border border-dashed border-[#333] p-4 text-center">
                      <Lock className="w-4 h-4 mx-auto mb-2 text-[#555]" />
                      <span className="text-[#555]">LOGIN REQUIRED</span>
                    </div>
                  </div>
                </div>

                {/* Right Panel - The Calculator */}
                <div className="md:col-span-2 p-8 relative">
                  <div className="absolute top-4 right-4 text-[10px] text-[#333] font-mono">SYS_VER_2.5</div>
                  
                  <div className="space-y-4 font-mono text-sm">
                    <div className="flex items-center justify-between p-3 border border-[#222] bg-[#050505]">
                      <span className="text-gray-300">[x] CORE_AUTH_MODULE</span>
                      <span className="text-[#00FF99]">REQUIRED</span>
                    </div>
                    <div 
                      onClick={() => toggleModule('luckyDraw')}
                      className={`flex items-center justify-between p-3 border bg-[#111] cursor-pointer transition-colors ${
                        selectedModules.luckyDraw 
                          ? 'border-[#00FF99] bg-[#00FF99]/10' 
                          : 'border-[#333] hover:border-[#00FF99]'
                      }`}
                    >
                      <span className="text-white">[{selectedModules.luckyDraw ? 'x' : ' '}] MODULE_LUCKY_DRAW</span>
                      <span className={selectedModules.luckyDraw ? 'text-[#00FF99]' : 'text-gray-500'}>+ $50,000</span>
                    </div>
                    <div 
                      onClick={() => toggleModule('igShare')}
                      className={`flex items-center justify-between p-3 border bg-[#111] cursor-pointer transition-colors ${
                        selectedModules.igShare 
                          ? 'border-[#00FF99] bg-[#00FF99]/10' 
                          : 'border-[#333] hover:border-[#00FF99]'
                      }`}
                    >
                      <span className="text-white">[{selectedModules.igShare ? 'x' : ' '}] MODULE_IG_SHARE</span>
                      <span className={selectedModules.igShare ? 'text-[#00FF99]' : 'text-gray-500'}>+ $80,000</span>
                    </div>
                    <div 
                      onClick={() => toggleModule('crmApi')}
                      className={`flex items-center justify-between p-3 border bg-[#111] cursor-pointer transition-colors ${
                        selectedModules.crmApi 
                          ? 'border-[#00FF99] bg-[#00FF99]/10' 
                          : 'border-[#333] hover:border-[#00FF99]'
                      }`}
                    >
                      <span className="text-white">[{selectedModules.crmApi ? 'x' : ' '}] MODULE_CRM_API</span>
                      <span className={selectedModules.crmApi ? 'text-[#00FF99]' : 'text-gray-500'}>+ $60,000</span>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-[#222] flex justify-between items-end">
                    <div className="text-xs text-[#555]">
                      {Object.values(selectedModules).some(v => v) ? 'MODULES SELECTED' : 'SELECT MODULES ABOVE'}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-[#00FF99] mb-1">TOTAL_ESTIMATE</div>
                      <div className="text-4xl text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                        ${totalPrice.toLocaleString()}<span className="text-base text-gray-600">.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FOOTER / CONTACT */}
        <section id="contact" className="bg-[#000] border-t border-[#222] py-20 font-mono">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="inline-block border border-[#FF004D] p-1 mb-8">
              <div className="bg-[#FF004D] px-4 py-1 text-black font-bold text-xs uppercase">
                Transmission Open
              </div>
            </div>
            
            <h2 className="text-4xl text-white mb-8" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              READY TO INITIALIZE?
            </h2>
            
            <div className="bg-[#080808] border border-[#333] p-2 text-left mb-8">
              <div className="flex border-b border-[#333] pb-2 mb-2">
                <span className="text-[#555] text-xs px-2">root@faw-labs:~/contact$</span>
              </div>
              <input 
                type="text" 
                className="w-full bg-transparent text-[#00FF99] focus:outline-none px-2 py-1" 
                placeholder="./send_inquiry --email your@email.com" 
              />
            </div>

            <button className="bg-[#EAEAEA] text-black px-12 py-3 font-bold hover:bg-[#FF004D] hover:text-white transition-colors uppercase tracking-widest text-sm">
              Execute_Handshake
            </button>
            
            {/* Footer Info */}
            <div className="mt-16 pt-8 border-t border-[#222] text-[10px] text-[#555] space-y-2">
              <div>UNIVERSAL FAW LABS © 2024 - TAIPEI, TAIWAN</div>
              <div className="flex justify-center gap-4">
                <span>PRIVACY_POLICY</span>
                <span>|</span>
                <span>TERMS_OF_SERVICE</span>
                <span>|</span>
                <span>SITEMAP</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
