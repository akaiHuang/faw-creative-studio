'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

// Dynamic import for 3D alien
const Pixel3DAlien = dynamic(
  () => import('@/components/game-v3/Pixel3DAlien'),
  { ssr: false }
);

/**
 * 勝利卡牌元件
 * 顯示能力卡牌 + 3D 外星人
 * 
 * @param {string} title - 英文標題 (VISUAL, VIRAL, ENGAGEMENT, STRATEGY)
 * @param {string} subtitle - 中文副標題
 * @param {string} color - 主題色
 * @param {string} alienId - 外星人 ID
 * @param {boolean} isActive - 是否啟用（用於視差動畫）
 * @param {string} direction - 外星人位置 ('left' | 'right')
 */
const VictoryCard = ({
  title = 'VISUAL',
  subtitle = '視覺識別定錨',
  color = '#ef4444',
  alienId = 'ufo',
  isActive = true,
  direction = 'right',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // 滑鼠移動傾斜效果
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * 10, y: -x * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  // 根據顏色計算 RGB 值
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const rgb = hexToRgb(color);
  const glowColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`;
  const borderColor = color;

  const cardContent = (
    <motion.div
      ref={cardRef}
      className="relative"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
      }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: isActive ? 1 : 0.3, 
        y: isActive ? 0 : 50,
      }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* 卡牌本體 */}
      <motion.div
        className="relative w-[200px] md:w-[280px] aspect-[3/4] bg-black"
        style={{
          border: `4px solid ${borderColor}`,
          boxShadow: isHovered 
            ? `0 0 40px ${glowColor}, inset 0 0 20px ${glowColor}` 
            : `0 0 20px ${glowColor}`,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateX: tilt.x,
          rotateY: tilt.y,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* 掃描線效果 */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.5) 50%)',
            backgroundSize: '100% 4px',
          }}
        />

        {/* 角落裝飾 */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor }} />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor }} />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor }} />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor }} />

        {/* 卡牌內容 */}
        <div className="h-full flex flex-col items-center justify-center p-4 md:p-6">
          {/* 英文標題 */}
          <motion.h2 
            className="font-retro text-lg md:text-2xl tracking-[0.2em] mb-2 md:mb-4"
            style={{ color, textShadow: `0 0 10px ${glowColor}` }}
            animate={{ 
              textShadow: isHovered 
                ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}` 
                : `0 0 10px ${glowColor}` 
            }}
          >
            {title}
          </motion.h2>

          {/* 分隔線 */}
          <div 
            className="w-16 md:w-24 h-0.5 mb-2 md:mb-4"
            style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
          />

          {/* 中文副標題 */}
          <p className="text-white text-sm md:text-base font-bold tracking-wider">
            {subtitle}
          </p>

          {/* 裝飾圖案 */}
          <div className="mt-4 md:mt-6 opacity-30">
            <svg viewBox="0 0 40 40" className="w-8 h-8 md:w-12 md:h-12">
              <rect x="0" y="0" width="10" height="10" fill={color} />
              <rect x="15" y="0" width="10" height="10" fill={color} />
              <rect x="30" y="0" width="10" height="10" fill={color} />
              <rect x="0" y="15" width="10" height="10" fill={color} />
              <rect x="30" y="15" width="10" height="10" fill={color} />
              <rect x="0" y="30" width="10" height="10" fill={color} />
              <rect x="15" y="30" width="10" height="10" fill={color} />
              <rect x="30" y="30" width="10" height="10" fill={color} />
            </svg>
          </div>
        </div>

        {/* Hover 光暈 */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 70%)`,
            }}
          />
        )}
      </motion.div>
    </motion.div>
  );

  const alienContent = (
    <motion.div
      className="relative"
      initial={{ opacity: 0, x: direction === 'right' ? 100 : -100 }}
      animate={{ 
        opacity: isActive ? 1 : 0, 
        x: isActive ? 0 : (direction === 'right' ? 100 : -100),
      }}
      transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
    >
      {/* 3D 外星人 */}
      <div className="relative">
        {/* 光暈背景 */}
        <div 
          className="absolute inset-0 blur-3xl opacity-30"
          style={{ backgroundColor: color }}
        />
        <Pixel3DAlien
          alienId={alienId}
          color={color}
          width={180}
          height={180}
          autoRotate={true}
          float={true}
          config={{ depth: 2, emissiveIntensity: 0.3 }}
        />
      </div>
    </motion.div>
  );

  return (
    <div className={`flex items-center justify-center gap-8 md:gap-16 ${className}`}>
      {direction === 'left' ? (
        <>
          {alienContent}
          {cardContent}
        </>
      ) : (
        <>
          {cardContent}
          {alienContent}
        </>
      )}
    </div>
  );
};

export default VictoryCard;

// 預設卡牌配置
export const VICTORY_CARDS = [
  {
    id: 'visual',
    title: 'VISUAL',
    subtitle: '視覺識別定錨',
    color: '#ef4444',
    alienId: 'ufo',
  },
  {
    id: 'viral',
    title: 'VIRAL',
    subtitle: '擴散機制建立',
    color: '#22c55e',
    alienId: 'green_alien',
  },
  {
    id: 'engagement',
    title: 'ENGAGEMENT',
    subtitle: '互動深度優化',
    color: '#22d3ee',
    alienId: 'squid',
  },
  {
    id: 'strategy',
    title: 'STRATEGY',
    subtitle: '策略核心聚焦',
    color: '#facc15',
    alienId: 'octopus',
  },
];
