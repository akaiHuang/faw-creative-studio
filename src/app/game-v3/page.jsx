'use client';

import GameV3Hero from '@/components/game-v3/GameV3Hero';

export default function GameV3Page() {
  return (
    <div className="bg-black text-white font-sans select-none">
      {/* Fixed Header Nav - Always on top */}
      <nav className="fixed top-0 left-0 right-0 z-[9999] h-12 bg-black/90 backdrop-blur-md border-b border-gray-800 flex items-center justify-between px-4">
        <a href="/" className="flex items-center gap-3 group">
          <img src="/logo.svg" alt="FAW Universal Studio" className="h-6 w-auto opacity-90 group-hover:opacity-100 transition-opacity" />
          <span className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors">SYSTEM://FAW.EXE</span>
        </a>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="text-green-500 animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            <span className="hidden sm:inline">LIVE DEMO</span>
          </span>
          <a href="/" className="text-gray-400 hover:text-white transition-colors">← HOME</a>
        </div>
      </nav>
      
      {/* Spacer for fixed nav */}
      <div className="h-12"></div>
      
      <GameV3Hero />

      <div className="relative z-10 bg-black">
        {/* Unit 2: Brand Experience */}
        <div id="services" className="min-h-screen border-t border-gray-800 flex items-center justify-center p-8">
          <div className="max-w-4xl text-center">
            <img src="/logo.svg" alt="FAW" className="w-24 h-auto mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-bold mb-4 font-tech text-white">BRAND EXPERIENCE</h2>
            <p className="text-gray-400 leading-relaxed">We create memorable moments that stick.</p>
          </div>
        </div>

        {/* Unit 3: AI Lab */}
        <div className="min-h-screen border-t border-gray-800 flex items-center justify-center p-8 bg-gray-900/30">
          <div className="max-w-4xl text-center">
            <img src="/logo.svg" alt="FAW" className="w-24 h-auto mx-auto mb-6 opacity-80" />
            <h2 className="text-4xl font-bold mb-4 font-tech text-white">AI LABORATORY</h2>
            <p className="text-gray-400 leading-relaxed">Leveraging the latest in generative technology.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
