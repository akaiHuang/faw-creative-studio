'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Edit, Save, RotateCcw, X, MousePointer2, Play, Pause, 
  Download, Upload, Copy, Check, Trash2, Plus, Home,
  ChevronLeft, ChevronRight, Palette, Grid, Layers,
  Sparkles, Zap
} from 'lucide-react';
import Link from 'next/link';

// --- Custom Fonts & Styles ---
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;600;700&display=swap');
    
    .font-retro { font-family: 'Press Start 2P', cursive; }
    .font-tech { font-family: 'Rajdhani', sans-serif; }
    
    .scanline {
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
      background-size: 100% 4px;
      pointer-events: none;
    }

    @keyframes blink-text {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    
    .animate-blink {
      animation: blink-text 0.5s step-end infinite;
    }

    @keyframes pulse-glow {
      0%, 100% { box-shadow: 0 0 5px currentColor; }
      50% { box-shadow: 0 0 20px currentColor, 0 0 30px currentColor; }
    }

    .pulse-glow {
      animation: pulse-glow 2s ease-in-out infinite;
    }
  `}</style>
);

// --- 預設外星人資料 ---
const DEFAULT_ALIENS = {
  crab: { 
    id: 'crab', 
    name: 'COMMANDER', 
    defaultColor: '#a855f7', 
    frame1: [[0,0,1,0,0,0,0,0,1,0,0],[0,0,0,1,0,0,0,1,0,0,0],[0,0,1,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[1,0,1,1,1,1,1,1,1,0,1],[1,0,1,0,0,0,0,0,1,0,1],[0,0,0,1,1,0,1,1,0,0,0]], 
    frame2: [[0,0,0,1,0,0,0,1,0,0,0],[0,0,1,0,0,0,0,0,1,0,0],[0,0,1,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[0,1,1,1,1,1,1,1,1,1,0],[0,0,1,0,0,0,0,0,1,0,0],[0,1,0,1,1,0,1,1,0,1,0]] 
  },
  squid: { 
    id: 'squid', 
    name: 'INVADER', 
    defaultColor: '#22d3ee', 
    frame1: [[0,0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[0,0,1,1,0,0,0,1,1,0,0],[0,1,1,0,1,0,1,0,1,1,0],[1,1,0,0,0,1,0,0,0,1,1]], 
    frame2: [[0,0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,0,0,0],[0,0,1,1,1,1,1,1,1,0,0],[0,1,1,0,1,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[0,0,1,1,0,0,0,1,1,0,0],[0,0,1,1,0,1,0,1,1,0,0],[0,0,0,1,1,0,1,1,0,0,0]] 
  },
  octopus: { 
    id: 'octopus', 
    name: 'DROID', 
    defaultColor: '#facc15', 
    frame1: [[0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[1,1,1,0,0,1,1,0,0,1,1],[1,1,1,1,1,1,1,1,1,1,1],[0,0,0,1,1,0,0,1,1,0,0],[0,0,1,1,0,1,1,0,1,1,0]], 
    frame2: [[0,0,0,0,0,0,0,0,0,0,0],[0,0,0,0,1,1,1,1,0,0,0],[0,1,1,1,1,1,1,1,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[1,1,1,0,0,1,1,0,0,1,1],[1,1,1,1,1,1,1,1,1,1,1],[0,0,1,1,0,0,0,1,1,0,0],[0,1,0,0,0,0,0,0,0,1,0]] 
  },
  ufo: { 
    id: 'ufo', 
    name: 'MOTHERSHIP', 
    defaultColor: '#ef4444', 
    frame1: [[0,0,0,0,0,1,1,1,1,0,0],[0,0,0,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,1,1,1],[0,1,1,0,1,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[0,0,1,1,1,0,0,0,1,0,0],[0,0,0,1,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0]], 
    frame2: [[0,0,0,0,0,1,1,1,1,0,0],[0,0,0,1,1,1,1,1,1,1,0],[0,0,1,1,1,1,1,1,1,1,1],[0,1,1,0,1,1,1,0,1,1,0],[1,1,1,1,1,1,1,1,1,1,1],[0,0,0,1,1,1,0,0,0,0,0],[0,0,0,0,1,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0,0]] 
  },
  green_alien: { 
    id: 'green_alien', 
    name: 'SCOUT', 
    defaultColor: '#22c55e', 
    frame1: [[0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,0,0,0],[0,0,1,1,0,1,0,1,1,0,0],[0,1,1,1,1,1,1,1,1,1,0],[0,1,0,1,1,1,1,1,0,1,0],[0,1,0,1,0,0,0,1,0,1,0],[0,0,0,0,1,1,1,0,0,0,0]], 
    frame2: [[0,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,1,1,1,0,0,0,0],[0,0,0,1,1,1,1,1,0,0,0],[0,0,1,1,0,1,0,1,1,0,0],[0,1,1,1,1,1,1,1,1,1,0],[0,0,0,1,1,1,1,1,0,0,0],[0,0,1,1,0,0,0,1,1,0,0],[0,1,0,0,0,0,0,0,0,1,0]] 
  }
};

// --- 空白模板 ---
const createEmptySprite = (id, name, cols = 11, rows = 8) => ({
  id,
  name,
  defaultColor: '#ffffff',
  frame1: Array(rows).fill(null).map(() => Array(cols).fill(0)),
  frame2: Array(rows).fill(null).map(() => Array(cols).fill(0)),
});

// --- 色板 ---
const COLOR_PALETTE = [
  { hex: '#ffffff', name: 'WHITE' },
  { hex: '#a855f7', name: 'PURPLE' },
  { hex: '#22d3ee', name: 'CYAN' },
  { hex: '#facc15', name: 'YELLOW' },
  { hex: '#ef4444', name: 'RED' },
  { hex: '#22c55e', name: 'GREEN' },
  { hex: '#3b82f6', name: 'BLUE' },
  { hex: '#f97316', name: 'ORANGE' },
  { hex: '#ec4899', name: 'PINK' },
  { hex: '#8b5cf6', name: 'VIOLET' },
  { hex: '#14b8a6', name: 'TEAL' },
  { hex: '#f59e0b', name: 'AMBER' },
];

// --- 像素網格元件 ---
const PixelGrid = ({ matrix, color, onPixelClick, onPixelDrag, size = 'normal', readonly = false }) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState(null); // 1 = 填色, 0 = 清除
  
  const gridSize = size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-8 h-8 md:w-10 md:h-10' : 'w-5 h-5 md:w-6 md:h-6';
  
  const handlePointerDown = (r, c, currentValue) => {
    if (readonly) return;
    setIsDrawing(true);
    const newMode = currentValue ? 0 : 1;
    setDrawMode(newMode);
    onPixelClick(r, c);
  };
  
  const handlePointerEnter = (r, c, currentValue) => {
    if (!isDrawing || readonly) return;
    if ((drawMode === 1 && !currentValue) || (drawMode === 0 && currentValue)) {
      onPixelDrag?.(r, c);
    }
  };
  
  const handlePointerUp = () => {
    setIsDrawing(false);
    setDrawMode(null);
  };

  useEffect(() => {
    const handleGlobalUp = () => {
      setIsDrawing(false);
      setDrawMode(null);
    };
    window.addEventListener('pointerup', handleGlobalUp);
    return () => window.removeEventListener('pointerup', handleGlobalUp);
  }, []);

  return (
    <div 
      className="inline-grid gap-px bg-gray-800 p-2 rounded-lg border border-gray-700"
      style={{ gridTemplateColumns: `repeat(${matrix[0]?.length || 11}, minmax(0, 1fr))` }}
      onPointerLeave={() => setIsDrawing(false)}
    >
      {matrix.map((row, r) => 
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            className={`${gridSize} ${readonly ? '' : 'cursor-pointer hover:opacity-80'} transition-all duration-75 border border-gray-700/50`}
            style={{ 
              backgroundColor: cell ? color : 'rgba(0,0,0,0.5)',
              boxShadow: cell ? `0 0 4px ${color}40` : 'none'
            }}
            onPointerDown={() => handlePointerDown(r, c, cell)}
            onPointerEnter={() => handlePointerEnter(r, c, cell)}
          />
        ))
      )}
    </div>
  );
};

// --- 預覽動畫元件 ---
const AnimatedPreview = ({ sprite, isPlaying, size = 120 }) => {
  const [currentFrame, setCurrentFrame] = useState(1);
  
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentFrame(f => f === 1 ? 2 : 1);
    }, 500);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const matrix = currentFrame === 1 ? sprite.frame1 : sprite.frame2;
  const cols = matrix[0]?.length || 11;
  const rows = matrix.length || 8;
  const pixelSize = Math.floor(size / Math.max(cols, rows));

  return (
    <div className="relative">
      <svg 
        width={size} 
        height={size * (rows / cols)} 
        viewBox={`0 0 ${cols} ${rows}`}
        className="drop-shadow-lg"
        style={{ filter: `drop-shadow(0 0 8px ${sprite.defaultColor}40)` }}
      >
        {matrix.map((row, r) => 
          row.map((cell, c) => 
            cell ? (
              <rect 
                key={`${r}-${c}`} 
                x={c} 
                y={r} 
                width="1" 
                height="1" 
                fill={sprite.defaultColor}
              />
            ) : null
          )
        )}
      </svg>
      <div className="absolute -bottom-1 -right-1 text-[8px] font-mono text-gray-500 bg-black/80 px-1 rounded">
        F{currentFrame}
      </div>
    </div>
  );
};

// --- 主頁面元件 ---
export default function PixelEditorPage() {
  // 狀態
  const [sprites, setSprites] = useState(DEFAULT_ALIENS);
  const [selectedId, setSelectedId] = useState('crab');
  const [activeFrame, setActiveFrame] = useState('frame1');
  const [isPlaying, setIsPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [gridSize, setGridSize] = useState({ cols: 11, rows: 8 });
  const [showNewSpriteModal, setShowNewSpriteModal] = useState(false);
  const [newSpriteName, setNewSpriteName] = useState('');

  // 取得目前選中的精靈
  const selectedSprite = sprites[selectedId];

  // 載入 localStorage
  useEffect(() => {
    const saved = localStorage.getItem('faw-pixel-editor-sprites');
    if (saved) {
      try {
        setSprites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved sprites:', e);
      }
    }
  }, []);

  // 儲存到 localStorage
  const handleSave = useCallback(() => {
    localStorage.setItem('faw-pixel-editor-sprites', JSON.stringify(sprites));
    // 顯示儲存成功訊息
    const btn = document.getElementById('save-btn');
    if (btn) {
      btn.classList.add('bg-green-500');
      setTimeout(() => btn.classList.remove('bg-green-500'), 500);
    }
  }, [sprites]);

  // 更新像素
  const updatePixel = useCallback((row, col) => {
    setSprites(prev => {
      const sprite = prev[selectedId];
      const newFrame = sprite[activeFrame].map((r, ri) => 
        ri === row ? r.map((c, ci) => ci === col ? (c ? 0 : 1) : c) : r
      );
      return {
        ...prev,
        [selectedId]: { ...sprite, [activeFrame]: newFrame }
      };
    });
  }, [selectedId, activeFrame]);

  // 拖曳更新像素
  const updatePixelDrag = useCallback((row, col) => {
    setSprites(prev => {
      const sprite = prev[selectedId];
      const currentValue = sprite[activeFrame][row][col];
      const newFrame = sprite[activeFrame].map((r, ri) => 
        ri === row ? r.map((c, ci) => ci === col ? (currentValue ? 0 : 1) : c) : r
      );
      return {
        ...prev,
        [selectedId]: { ...sprite, [activeFrame]: newFrame }
      };
    });
  }, [selectedId, activeFrame]);

  // 更新顏色
  const updateColor = useCallback((newColor) => {
    setSprites(prev => ({
      ...prev,
      [selectedId]: { ...prev[selectedId], defaultColor: newColor }
    }));
  }, [selectedId]);

  // 清空畫布
  const clearCanvas = useCallback(() => {
    setSprites(prev => {
      const sprite = prev[selectedId];
      const emptyFrame = sprite[activeFrame].map(row => row.map(() => 0));
      return {
        ...prev,
        [selectedId]: { ...sprite, [activeFrame]: emptyFrame }
      };
    });
  }, [selectedId, activeFrame]);

  // 複製 Frame1 到 Frame2
  const copyFrame = useCallback(() => {
    setSprites(prev => {
      const sprite = prev[selectedId];
      return {
        ...prev,
        [selectedId]: { 
          ...sprite, 
          frame2: sprite.frame1.map(row => [...row])
        }
      };
    });
  }, [selectedId]);

  // 重置為預設
  const resetToDefault = useCallback(() => {
    if (DEFAULT_ALIENS[selectedId]) {
      setSprites(prev => ({
        ...prev,
        [selectedId]: JSON.parse(JSON.stringify(DEFAULT_ALIENS[selectedId]))
      }));
    }
  }, [selectedId]);

  // 新增精靈
  const addNewSprite = useCallback(() => {
    if (!newSpriteName.trim()) return;
    const id = newSpriteName.toLowerCase().replace(/\s+/g, '_');
    const newSprite = createEmptySprite(id, newSpriteName.toUpperCase(), gridSize.cols, gridSize.rows);
    setSprites(prev => ({ ...prev, [id]: newSprite }));
    setSelectedId(id);
    setNewSpriteName('');
    setShowNewSpriteModal(false);
  }, [newSpriteName, gridSize]);

  // 刪除精靈
  const deleteSprite = useCallback(() => {
    if (Object.keys(sprites).length <= 1) return;
    setSprites(prev => {
      const newSprites = { ...prev };
      delete newSprites[selectedId];
      return newSprites;
    });
    setSelectedId(Object.keys(sprites).filter(k => k !== selectedId)[0]);
  }, [selectedId, sprites]);

  // 匯出 JSON
  const exportJSON = useCallback(() => {
    const dataStr = JSON.stringify(sprites, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-sprites.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [sprites]);

  // 匯出 JS
  const exportJS = useCallback(() => {
    const jsCode = `// FAW Pixel Sprites - Generated ${new Date().toISOString()}
export const CUSTOM_SPRITES = ${JSON.stringify(sprites, null, 2)};
`;
    const blob = new Blob([jsCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pixel-sprites.js';
    a.click();
    URL.revokeObjectURL(url);
  }, [sprites]);

  // 複製到剪貼簿
  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(sprites, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [sprites]);

  // 匯入 JSON
  const importJSON = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result);
        setSprites(imported);
        setSelectedId(Object.keys(imported)[0]);
      } catch (err) {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-tech select-none">
      <FontStyles />
      
      {/* 掃描線效果 */}
      <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] scanline" />
      
      {/* 頂部導航 */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <h1 className="text-lg font-bold text-green-400 flex items-center gap-2">
              <Grid className="w-5 h-5" />
              8-BIT PIXEL EDITOR
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExportModal(true)}
              className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">EXPORT</span>
            </button>
            <label className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span className="hidden md:inline">IMPORT</span>
              <input type="file" accept=".json" onChange={importJSON} className="hidden" />
            </label>
            <button
              id="save-btn"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs bg-green-600 hover:bg-green-500 text-black font-bold rounded flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              SAVE
            </button>
          </div>
        </div>
      </header>

      {/* 主內容區 */}
      <main className="pt-14 flex flex-col lg:flex-row min-h-screen">
        {/* 左側選單 - 精靈列表 */}
        <aside className="lg:w-64 bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-800 p-4 overflow-x-auto lg:overflow-y-auto">
          <div className="flex lg:flex-col gap-3">
            {/* 新增按鈕 */}
            <button
              onClick={() => setShowNewSpriteModal(true)}
              className="min-w-[80px] lg:min-w-0 p-3 border-2 border-dashed border-gray-700 hover:border-green-500 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-green-400 transition-colors"
            >
              <Plus className="w-6 h-6" />
              <span className="text-[10px] font-bold">NEW</span>
            </button>

            {/* 精靈列表 */}
            {Object.values(sprites).map(sprite => (
              <div
                key={sprite.id}
                onClick={() => setSelectedId(sprite.id)}
                className={`min-w-[100px] lg:min-w-0 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedId === sprite.id 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sprite.defaultColor }}
                  />
                  <span className="text-[10px] font-bold text-gray-300 truncate ml-2">
                    {sprite.name}
                  </span>
                </div>
                <div className="flex justify-center">
                  <AnimatedPreview sprite={sprite} isPlaying={isPlaying} size={60} />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* 中間 - 編輯區 */}
        <section className="flex-1 p-4 lg:p-8 overflow-y-auto">
          {selectedSprite ? (
            <div className="max-w-4xl mx-auto">
              {/* 標題與顏色選擇 */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                    <Sparkles className="w-6 h-6" />
                    {selectedSprite.name}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedSprite.frame1[0]?.length || 11} x {selectedSprite.frame1.length || 8} pixels
                  </p>
                </div>

                {/* 顏色選擇器 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Palette className="w-4 h-4 text-gray-500" />
                  {COLOR_PALETTE.map(c => (
                    <button
                      key={c.hex}
                      onClick={() => updateColor(c.hex)}
                      className={`w-7 h-7 rounded border-2 transition-transform ${
                        selectedSprite.defaultColor === c.hex 
                          ? 'border-white scale-110 pulse-glow' 
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.hex, color: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Frame 切換 */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setActiveFrame('frame1')}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                      activeFrame === 'frame1' 
                        ? 'bg-green-600 text-black font-bold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    FRAME 1
                  </button>
                  <button
                    onClick={() => setActiveFrame('frame2')}
                    className={`px-4 py-2 text-sm rounded transition-colors ${
                      activeFrame === 'frame2' 
                        ? 'bg-green-600 text-black font-bold' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    FRAME 2
                  </button>
                </div>

                <button
                  onClick={copyFrame}
                  className="px-3 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-2"
                  title="Copy Frame 1 to Frame 2"
                >
                  <Copy className="w-4 h-4" />
                  <span className="hidden sm:inline">COPY F1→F2</span>
                </button>

                <div className="flex-1" />

                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3 py-2 text-xs rounded flex items-center gap-2 ${
                    isPlaying 
                      ? 'bg-yellow-600 text-black' 
                      : 'bg-gray-800 text-gray-400 border border-gray-700'
                  }`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
              </div>

              {/* 編輯網格 */}
              <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-8">
                {/* 主編輯區 */}
                <div className="flex flex-col items-center">
                  <div className="text-xs text-gray-500 mb-2 font-mono">
                    {activeFrame.toUpperCase()} - CLICK TO TOGGLE
                  </div>
                  <PixelGrid
                    matrix={selectedSprite[activeFrame]}
                    color={selectedSprite.defaultColor}
                    onPixelClick={updatePixel}
                    onPixelDrag={updatePixelDrag}
                    size="large"
                  />
                </div>

                {/* 預覽區 */}
                <div className="flex flex-col items-center gap-4">
                  <div className="text-xs text-gray-500 font-mono">PREVIEW</div>
                  <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                    <AnimatedPreview 
                      sprite={selectedSprite} 
                      isPlaying={isPlaying} 
                      size={150}
                    />
                  </div>
                  
                  {/* 小預覽 */}
                  <div className="flex gap-4 mt-4">
                    <div className="text-center">
                      <div className="text-[10px] text-gray-600 mb-1">F1</div>
                      <div className="bg-black p-2 rounded border border-gray-800">
                        <AnimatedPreview 
                          sprite={{ ...selectedSprite, frame2: selectedSprite.frame1 }} 
                          isPlaying={false} 
                          size={50}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[10px] text-gray-600 mb-1">F2</div>
                      <div className="bg-black p-2 rounded border border-gray-800">
                        <AnimatedPreview 
                          sprite={{ ...selectedSprite, frame1: selectedSprite.frame2 }} 
                          isPlaying={false} 
                          size={50}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 工具列 */}
              <div className="flex flex-wrap justify-center gap-3 mt-8 pt-6 border-t border-gray-800">
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  CLEAR
                </button>
                
                {DEFAULT_ALIENS[selectedId] && (
                  <button
                    onClick={resetToDefault}
                    className="px-4 py-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    RESET
                  </button>
                )}
                
                {Object.keys(sprites).length > 1 && !DEFAULT_ALIENS[selectedId] && (
                  <button
                    onClick={deleteSprite}
                    className="px-4 py-2 text-xs bg-red-900/50 hover:bg-red-800 border border-red-700 rounded flex items-center gap-2 text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                    DELETE
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600">
              <MousePointer2 className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">SELECT A SPRITE TO EDIT</p>
            </div>
          )}
        </section>
      </main>

      {/* 新增精靈 Modal */}
      {showNewSpriteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="bg-gray-900 border-2 border-green-500 rounded-lg w-full max-w-md p-6 mx-4">
            <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              NEW SPRITE
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">NAME</label>
                <input
                  type="text"
                  value={newSpriteName}
                  onChange={(e) => setNewSpriteName(e.target.value)}
                  placeholder="Enter sprite name..."
                  className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                  autoFocus
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">COLUMNS</label>
                  <input
                    type="number"
                    value={gridSize.cols}
                    onChange={(e) => setGridSize(prev => ({ ...prev, cols: Math.max(1, Math.min(32, parseInt(e.target.value) || 11)) }))}
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                    min="1"
                    max="32"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">ROWS</label>
                  <input
                    type="number"
                    value={gridSize.rows}
                    onChange={(e) => setGridSize(prev => ({ ...prev, rows: Math.max(1, Math.min(32, parseInt(e.target.value) || 8)) }))}
                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-white focus:border-green-500 outline-none"
                    min="1"
                    max="32"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowNewSpriteModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                CANCEL
              </button>
              <button
                onClick={addNewSprite}
                disabled={!newSpriteName.trim()}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold rounded text-sm"
              >
                CREATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 匯出 Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur">
          <div className="bg-gray-900 border-2 border-cyan-500 rounded-lg w-full max-w-md p-6 mx-4">
            <h3 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              EXPORT SPRITES
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => { exportJSON(); setShowExportModal(false); }}
                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-yellow-500/20 rounded flex items-center justify-center">
                  <span className="text-yellow-500 text-xs font-bold">JSON</span>
                </div>
                <div className="text-left">
                  <div className="font-bold">Download JSON</div>
                  <div className="text-xs text-gray-500">Standard data format</div>
                </div>
              </button>
              
              <button
                onClick={() => { exportJS(); setShowExportModal(false); }}
                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-green-500/20 rounded flex items-center justify-center">
                  <span className="text-green-500 text-xs font-bold">JS</span>
                </div>
                <div className="text-left">
                  <div className="font-bold">Download JavaScript</div>
                  <div className="text-xs text-gray-500">Ready to import in code</div>
                </div>
              </button>
              
              <button
                onClick={() => { copyToClipboard(); }}
                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded flex items-center gap-3"
              >
                <div className="w-10 h-10 bg-blue-500/20 rounded flex items-center justify-center">
                  {copied ? <Check className="text-blue-500 w-5 h-5" /> : <Copy className="text-blue-500 w-5 h-5" />}
                </div>
                <div className="text-left">
                  <div className="font-bold">{copied ? 'Copied!' : 'Copy to Clipboard'}</div>
                  <div className="text-xs text-gray-500">JSON format</div>
                </div>
              </button>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-sm text-gray-400 hover:text-white"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
