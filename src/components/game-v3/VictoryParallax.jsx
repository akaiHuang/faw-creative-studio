'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import VictoryCard, { VICTORY_CARDS } from './VictoryCard';

// Dynamic imports
const Pixel3DAlien = dynamic(
  () => import('@/components/game-v3/Pixel3DAlien'),
  { ssr: false }
);

/**
 * Scroll Down 指示器元件
 */
const ScrollIndicator = ({ show = true }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <span className="font-retro text-[10px] text-gray-400 tracking-widest">
          SCROLL DOWN
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/**
 * 3D 旋轉獎盃元件
 */
const Trophy3D = ({ size = 200 }) => (
  <div className="relative">
    {/* 光暈效果 */}
    <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-20 animate-pulse" />
    <Pixel3DAlien
      alienId="trophy"
      color="#facc15"
      width={size}
      height={size}
      autoRotate={true}
      float={true}
      config={{
        depth: 3,
        rotationSpeed: 0.015,
        floatAmplitude: 0.2,
        emissiveIntensity: 0.4,
      }}
    />
  </div>
);

/**
 * 視差滾動勝利頁面
 * 
 * @param {function} onRestart - 重新開始遊戲
 * @param {function} onLearnMore - 了解更多 FAW（滾動到品牌區）
 */
const VictoryParallax = ({
  onRestart = () => {},
  onLearnMore = () => {},
}) => {
  const containerRef = useRef(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);
  
  // 總共 6 個 section
  const totalSections = 6;

  // 處理滾動
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrollHeight = container.scrollHeight - container.clientHeight;
      const progress = scrollTop / scrollHeight;
      
      setScrollProgress(progress);
      
      // 計算當前 section
      const sectionIndex = Math.min(
        Math.floor(progress * totalSections),
        totalSections - 1
      );
      setCurrentSection(sectionIndex);

      // 標記正在滾動
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 滾動到指定 section
  const scrollToSection = useCallback((index) => {
    const container = containerRef.current;
    if (!container) return;
    
    const sectionHeight = container.clientHeight;
    container.scrollTo({
      top: index * sectionHeight,
      behavior: 'smooth',
    });
  }, []);

  // Section 進入視口檢測
  const isSectionActive = (index) => {
    const threshold = 0.3;
    const sectionStart = index / totalSections;
    const sectionEnd = (index + 1) / totalSections;
    return scrollProgress >= sectionStart - threshold && scrollProgress < sectionEnd + threshold;
  };

  return (
    <div 
      ref={containerRef}
      className="h-screen w-full overflow-y-auto overflow-x-hidden bg-black snap-y snap-mandatory"
      style={{
        scrollSnapType: 'y mandatory',
        scrollBehavior: 'smooth',
      }}
    >
      {/* 進度指示器 */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
        {[...Array(totalSections)].map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToSection(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentSection === i 
                ? 'bg-cyan-400 scale-150' 
                : 'bg-gray-600 hover:bg-gray-400'
            }`}
          />
        ))}
      </div>

      {/* === Section 1: 獎盃 === */}
      <section 
        className="h-screen w-full flex items-center justify-center snap-start relative"
        style={{ scrollSnapAlign: 'start' }}
      >
        <motion.div
          className="text-center flex flex-col items-center gap-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: isSectionActive(0) ? 1 : 0.3, 
            scale: isSectionActive(0) ? 1 : 0.8 
          }}
          transition={{ duration: 0.6 }}
        >
          {/* 3D 獎盃 */}
          <Trophy3D size={200} />
          
          {/* 標題 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="font-retro text-[10px] md:text-xs text-yellow-400 tracking-[0.3em] mb-4">
              [ OPTIMIZATION COMPLETE ]
            </div>
            <h1 className="font-retro text-2xl md:text-4xl text-white tracking-[0.2em]">
              自我檢測完成
            </h1>
          </motion.div>
        </motion.div>

        <ScrollIndicator show={currentSection === 0 && !isScrolling} />
      </section>

      {/* === Section 2-5: 卡牌 === */}
      {VICTORY_CARDS.map((card, index) => (
        <section
          key={card.id}
          className="h-screen w-full flex items-center justify-center snap-start relative"
          style={{ scrollSnapAlign: 'start' }}
        >
          <VictoryCard
            title={card.title}
            subtitle={card.subtitle}
            color={card.color}
            alienId={card.alienId}
            isActive={isSectionActive(index + 1)}
            direction={index % 2 === 0 ? 'right' : 'left'}
          />
          
          <ScrollIndicator show={currentSection === index + 1 && !isScrolling} />
        </section>
      ))}

      {/* === Section 6: 結語 === */}
      <section 
        className="h-screen w-full flex items-center justify-center snap-start relative px-4"
        style={{ scrollSnapAlign: 'start' }}
      >
        <motion.div
          className="max-w-3xl text-center flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: isSectionActive(5) ? 1 : 0.3 }}
          transition={{ duration: 0.6 }}
        >
          {/* 主要訊息 */}
          <motion.div
            className="border-4 border-white/20 bg-black/80 p-6 md:p-8 w-full"
            initial={{ y: 30 }}
            animate={{ y: isSectionActive(5) ? 0 : 30 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-retro text-[10px] md:text-xs leading-relaxed text-white">
              恭喜！你已經領先許多企業完成自我檢測，我們希望這樣的互動能讓你有更多靈感發揮創意在面對市場的同時具備攻守兼備的能力。
            </p>
          </motion.div>

          {/* FAW Labs 介紹 */}
          <motion.div
            className="w-full"
            initial={{ y: 30, opacity: 0 }}
            animate={{ 
              y: isSectionActive(5) ? 0 : 30, 
              opacity: isSectionActive(5) ? 1 : 0 
            }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <p className="font-retro text-[10px] md:text-xs text-yellow-500 leading-relaxed">
              <span className="text-yellow-400 font-bold">Universal FAW Labs</span>{' '}
              從策略到視覺到互動，都能有效應用 AI 協助您消弭無效溝通，精準對接市場需求，極大化品牌溝通效率。
            </p>
          </motion.div>

          {/* CTA 按鈕 */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4"
            initial={{ y: 30, opacity: 0 }}
            animate={{ 
              y: isSectionActive(5) ? 0 : 30, 
              opacity: isSectionActive(5) ? 1 : 0 
            }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <button 
              onClick={onRestart}
              className="group px-6 py-3 border-4 border-yellow-400 text-yellow-300 bg-black font-retro text-[10px] md:text-xs tracking-widest hover:bg-yellow-400 hover:text-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              [ 再次體驗 ]
            </button>
            <button 
              onClick={onLearnMore}
              className="group px-6 py-3 border-4 border-cyan-400 text-cyan-300 bg-black font-retro text-[10px] md:text-xs tracking-widest hover:bg-cyan-400 hover:text-black transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
            >
              [ 了解更多 FAW ]
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Footer */}
          <motion.p 
            className="text-gray-600 font-retro text-[8px] md:text-[10px] mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: isSectionActive(5) ? 1 : 0 }}
            transition={{ delay: 0.6 }}
          >
            © 2026 FAW Creative Studio. All rights reserved.
          </motion.p>
        </motion.div>
      </section>

      {/* 全局樣式 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .font-retro {
          font-family: 'Press Start 2P', cursive;
        }

        /* 隱藏滾動條但保持功能 */
        .snap-y::-webkit-scrollbar {
          width: 0;
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default VictoryParallax;
