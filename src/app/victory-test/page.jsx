'use client';

import dynamic from 'next/dynamic';

// Dynamic import for VictoryParallax
const VictoryParallax = dynamic(
  () => import('@/components/game-v3/VictoryParallax'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-black flex items-center justify-center">
        <div className="text-cyan-400 font-mono animate-pulse">Loading Victory Screen...</div>
      </div>
    )
  }
);

/**
 * 視差滾動測試頁面
 * 直接預覽遊戲結束的視差滾動效果
 */
export default function VictoryTestPage() {
  return (
    <div className="h-screen w-full bg-black">
      <VictoryParallax
        onRestart={() => {
          alert('重新開始遊戲！');
          window.location.href = '/';
        }}
        onLearnMore={() => {
          window.location.href = '/#brand';
        }}
      />
    </div>
  );
}
