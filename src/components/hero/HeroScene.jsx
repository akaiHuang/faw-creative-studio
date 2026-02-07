'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import dynamic from 'next/dynamic';

// Dynamic imports to avoid SSR issues
// const MorphingRing = dynamic(() => import('./MorphingRing'), { ssr: false });
const ParticleText = dynamic(() => import('./ParticleText'), { ssr: false });
const FAWPhysicsLetters = dynamic(() => import('./FAWPhysicsLetters'), { ssr: false });

/**
 * Hero 3D 場景容器
 * 整合三層視覺效果
 */
const HeroScene = () => {
  const [gyroscope, setGyroscope] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [hasPermission, setHasPermission] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // 啟動畫面
  const [isClient, setIsClient] = useState(false);
  const [debugInfo, setDebugInfo] = useState('等待點擊...');
  const [isIOS, setIsIOS] = useState(false);
  
  // Check if client-side and detect iOS
  useEffect(() => {
    setIsClient(true);
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);
    
    // 檢查是否為 HTTPS（iOS Safari 需要 HTTPS）
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    if (iOS) {
      if (!isSecure) {
        setDebugInfo('⚠️ iOS 需要 HTTPS！目前: ' + window.location.protocol);
      } else {
        setDebugInfo('iOS 偵測到 - 請點擊進入');
      }
    } else {
      setDebugInfo('非 iOS 裝置');
    }
  }, []);
  
  // 點擊啟動畫面後請求權限
  const handleEnter = async () => {
    setDebugInfo('正在請求權限...');
    
    // iOS 13+ Safari 需要明確請求權限
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        setDebugInfo('呼叫 requestPermission...');
        const permission = await DeviceOrientationEvent.requestPermission();
        setDebugInfo('權限回應: ' + permission);
        
        if (permission === 'granted') {
          setHasPermission(true);
          setDebugInfo('✓ iOS 權限已授予');
        } else {
          setDebugInfo('✗ iOS 權限被拒絕');
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Permission error:', error);
        setDebugInfo('✗ 錯誤: ' + error.message);
        // 即使失敗也進入場景
        setHasPermission(false);
      }
    } else {
      // Android 或桌面或舊版 iOS
      setHasPermission(true);
      setDebugInfo('非 iOS 13+ - 直接啟用');
    }
    
    // 隱藏啟動畫面
    setShowSplash(false);
  };
  
  // 監聯設備方向
  useEffect(() => {
    if (!isClient || !hasPermission) return;
    
    let eventCount = 0;
    
    const handleOrientation = (event) => {
      eventCount++;
      const newGyro = {
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      };
      
      // 直接更新 state
      setGyroscope({...newGyro});
      
      // Debug: 每 10 次更新一次顯示
      if (eventCount % 10 === 0) {
        setDebugInfo(`γ:${newGyro.gamma.toFixed(1)} β:${newGyro.beta.toFixed(1)}`);
      }
    };
    
    // 使用 { passive: true } 提高效能
    window.addEventListener('deviceorientation', handleOrientation, true);
    setDebugInfo('六軸已啟用');
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, [hasPermission, isClient]);
  
  if (!isClient) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-[#00FF99] font-mono text-sm animate-pulse">
          LOADING_SCENE...
        </div>
      </div>
    );
  }
  
  // 啟動畫面 - 點擊進入並請求權限
  if (showSplash) {
    return (
      <div 
        className="w-full h-screen bg-black flex flex-col items-center justify-center cursor-pointer relative"
        onClick={handleEnter}
      >
        {/* Debug 資訊 - 始終顯示 */}
        <div className="absolute bottom-4 left-4 z-50 text-xs font-mono text-[#00FF99] bg-black/80 px-3 py-2 rounded border border-[#00FF99]/30">
          {debugInfo}
        </div>
        
        <div className="text-center space-y-8">
          {/* Logo */}
          <div className="text-6xl md:text-8xl font-black tracking-tighter">
            <span className="text-[#00FF99]">F</span>
            <span className="text-[#FF004D]">A</span>
            <span className="text-[#00BFFF]">W</span>
          </div>
          
          {/* Tagline */}
          <div className="text-white/60 font-mono text-sm tracking-widest">
            UNIVERSAL LABS
          </div>
          
          {/* Enter Button */}
          <div className="mt-12 space-y-4">
            <div className="inline-block px-8 py-4 border-2 border-[#00FF99] text-[#00FF99] 
                          font-bold tracking-wider hover:bg-[#00FF99] hover:text-black 
                          transition-all duration-300 animate-pulse">
              👆 點擊進入體驗
            </div>
            <div className="text-white/40 text-xs font-mono">
              TAP TO ENABLE INTERACTIVE MODE
            </div>
          </div>
          
          {/* Hint for mobile */}
          <div className="text-white/30 text-[10px] font-mono mt-8">
            📱 支援手機六軸感應互動
          </div>
        </div>
        
        {/* Animated background dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#00FF99]/30 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="relative w-full h-screen bg-black">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        dpr={[1, 2]}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: 'high-performance'
        }}
        className="absolute inset-0"
      >
        <color attach="background" args={['#000000']} />
        
        {/* 燈光 */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#00FF99" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#FF004D" />
        <spotLight
          position={[0, 10, 5]}
          angle={0.3}
          penumbra={1}
          intensity={1.2}
          color="#FFFFFF"
        />
        
        {/* 背景星星 */}
        <Stars 
          radius={100} 
          depth={50} 
          count={2000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={0.5}
        />
        
        <Suspense fallback={null}>
          {/* 中景：FAW 物理字母 */}
          <FAWPhysicsLetters gyroscope={gyroscope} />
          
          {/* 近景：粒子文字 */}
          <ParticleText position={[0, -3.5, 4]} />
        </Suspense>
      </Canvas>
      
      {/* Debug 資訊 - 顯示六軸數據 */}
      <div className="absolute bottom-4 left-4 z-50 text-xs font-mono text-[#00FF99] bg-black/80 px-3 py-2 rounded border border-[#00FF99]/30">
        📱 {debugInfo}
      </div>
      
      {/* HUD 覆蓋層 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 左上角座標 */}
        <div className="absolute top-20 left-4 md:left-8 text-[10px] font-mono text-[#555] space-y-1">
          <div>COORD: 25.0330° N, 121.5654° E</div>
          <div>SECTOR: TAIPEI_HQ</div>
          <div>MODE: <span className="text-[#00FF99]">IMMERSIVE</span></div>
        </div>
        
        {/* 右上角狀態 */}
        <div className="absolute top-20 right-4 md:right-8 text-right text-[10px] font-mono text-[#555]">
          <div className="flex items-center justify-end gap-2">
            <span className="w-2 h-2 bg-[#00FF99] rounded-full animate-pulse"></span>
            <span className="text-[#00FF99]">ONLINE</span>
          </div>
          <div>FPS: 60</div>
          <div>RENDER: WebGL2</div>
        </div>
        
        {/* 底部公司名稱 */}
        <div className="absolute bottom-24 md:bottom-16 left-1/2 transform -translate-x-1/2 text-center w-full px-4">
          <h1 className="font-bold text-3xl md:text-5xl lg:text-6xl tracking-[0.2em] md:tracking-[0.3em] text-white mb-2" 
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            UNIVERSAL FAW LABS
          </h1>
          <p className="text-[#666] text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em]">
            DIGITAL HEAVY INDUSTRIES • SINCE 2024
          </p>
        </div>
        
        {/* 滾動提示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-[#555]">
          <span className="text-[10px] font-mono mb-2">SCROLL</span>
          <div className="w-px h-8 bg-gradient-to-b from-[#555] to-transparent animate-pulse"></div>
        </div>
      </div>
      
      {/* 掃描線效果 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
        }}
      />
    </div>
  );
};

export default HeroScene;
