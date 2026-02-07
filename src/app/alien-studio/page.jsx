'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  Download, 
  Save, 
  RotateCcw, 
  Copy, 
  Check,
  Eye,
  EyeOff,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Layers,
  Palette,
  Move3D,
  Sparkles,
  FileJson,
  FileCode,
  Home
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

import {
  ALIEN_2D_MATRICES,
  TROPHY_2D_MATRIX,
  ALIEN_3D_CONFIGS,
  DEFAULT_3D_CONFIG,
  loadCustomConfigs,
  saveCustomConfigs,
  exportConfigsAsJSON,
  exportConfigsAsJS,
  getAllAliens,
} from '@/data/alienDefinitions';

// Dynamic import for 3D component (避免 SSR)
const Pixel3DAlien = dynamic(
  () => import('@/components/game-v3/Pixel3DAlien'),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-900 animate-pulse" /> }
);

const { Pixel2DAlien } = dynamic(
  () => import('@/components/game-v3/Pixel3DAlien').then(mod => ({ default: mod.Pixel2DAlien })),
  { ssr: false }
) || {};

/**
 * 外星人 3D 設定工作室
 */
export default function AlienStudioPage() {
  // 狀態
  const [selectedAlienId, setSelectedAlienId] = useState('squid');
  const [configs, setConfigs] = useState({});
  const [currentFrame, setCurrentFrame] = useState(1);
  const [autoRotate, setAutoRotate] = useState(true);
  const [float, setFloat] = useState(true);
  const [showWireframe, setShowWireframe] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [exportFormat, setExportFormat] = useState('json');

  // 外星人列表
  const aliens = getAllAliens();
  const allItems = [
    ...aliens,
    { id: 'trophy', name: 'TROPHY', defaultColor: '#facc15', config3D: ALIEN_3D_CONFIGS.trophy }
  ];

  // 目前選中的外星人
  const selectedAlien = allItems.find(a => a.id === selectedAlienId);
  const currentConfig = configs[selectedAlienId] || selectedAlien?.config3D || DEFAULT_3D_CONFIG;

  // 載入 localStorage 設定
  useEffect(() => {
    const stored = loadCustomConfigs();
    if (stored) {
      setConfigs(stored);
    }
  }, []);

  // 更新配置
  const updateConfig = useCallback((key, value) => {
    setConfigs(prev => ({
      ...prev,
      [selectedAlienId]: {
        ...(prev[selectedAlienId] || currentConfig),
        [key]: value,
      }
    }));
  }, [selectedAlienId, currentConfig]);

  // 儲存到 localStorage
  const handleSave = useCallback(() => {
    const success = saveCustomConfigs(configs);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }, [configs]);

  // 重置配置
  const handleReset = useCallback(() => {
    setConfigs(prev => {
      const newConfigs = { ...prev };
      delete newConfigs[selectedAlienId];
      return newConfigs;
    });
  }, [selectedAlienId]);

  // 匯出配置
  const handleExport = useCallback(() => {
    const content = exportFormat === 'json' 
      ? exportConfigsAsJSON(configs)
      : exportConfigsAsJS(configs);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alien-configs.${exportFormat === 'json' ? 'json' : 'js'}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [configs, exportFormat]);

  // 複製到剪貼簿
  const handleCopy = useCallback(async () => {
    const content = exportFormat === 'json' 
      ? exportConfigsAsJSON(configs)
      : exportConfigsAsJS(configs);
    
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [configs, exportFormat]);

  // 選擇外星人 - 上一個/下一個
  const selectPrev = () => {
    const idx = allItems.findIndex(a => a.id === selectedAlienId);
    const newIdx = idx <= 0 ? allItems.length - 1 : idx - 1;
    setSelectedAlienId(allItems[newIdx].id);
  };

  const selectNext = () => {
    const idx = allItems.findIndex(a => a.id === selectedAlienId);
    const newIdx = idx >= allItems.length - 1 ? 0 : idx + 1;
    setSelectedAlienId(allItems[newIdx].id);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-400 hover:text-white transition-colors">
              <Home className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400">ALIEN</span>
              <span className="text-white">STUDIO</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`px-4 py-2 border text-sm flex items-center gap-2 transition-colors ${
                saved 
                  ? 'border-green-500 text-green-400 bg-green-500/10' 
                  : 'border-cyan-500 text-cyan-400 hover:bg-cyan-500/10'
              }`}
            >
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saved ? 'SAVED' : 'SAVE'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側：外星人選擇列表 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-gray-800 bg-gray-900/50 p-4">
            <h2 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              SELECT ENTITY
            </h2>
            
            <div className="grid grid-cols-2 gap-2">
              {allItems.map(alien => (
                <button
                  key={alien.id}
                  onClick={() => setSelectedAlienId(alien.id)}
                  className={`p-3 border transition-all ${
                    selectedAlienId === alien.id
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    {/* 2D Preview */}
                    <svg 
                      viewBox={`0 0 ${alien.id === 'trophy' ? 12 : 11} ${alien.id === 'trophy' ? 11 : 8}`}
                      className="w-12 h-10"
                    >
                      {(alien.id === 'trophy' ? TROPHY_2D_MATRIX : alien.frame1)?.map((row, y) =>
                        row.map((cell, x) =>
                          cell === 1 ? (
                            <rect
                              key={`${x}-${y}`}
                              x={x}
                              y={y}
                              width={1}
                              height={1}
                              fill={alien.defaultColor}
                            />
                          ) : null
                        )
                      )}
                    </svg>
                    <span className="text-[10px] text-gray-400">{alien.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 匯出面板 */}
          <div className="border border-gray-800 bg-gray-900/50 p-4">
            <h2 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <Download className="w-4 h-4" />
              EXPORT CONFIG
            </h2>
            
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setExportFormat('json')}
                className={`flex-1 py-2 text-xs flex items-center justify-center gap-1 border ${
                  exportFormat === 'json' ? 'border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-400'
                }`}
              >
                <FileJson className="w-3 h-3" />
                JSON
              </button>
              <button
                onClick={() => setExportFormat('js')}
                className={`flex-1 py-2 text-xs flex items-center justify-center gap-1 border ${
                  exportFormat === 'js' ? 'border-cyan-500 text-cyan-400' : 'border-gray-700 text-gray-400'
                }`}
              >
                <FileCode className="w-3 h-3" />
                JS
              </button>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 py-2 border border-green-500 text-green-400 text-xs hover:bg-green-500/10 flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                DOWNLOAD
              </button>
              <button
                onClick={handleCopy}
                className={`flex-1 py-2 border text-xs flex items-center justify-center gap-1 ${
                  copied ? 'border-green-500 text-green-400' : 'border-gray-500 text-gray-400 hover:bg-gray-500/10'
                }`}
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'COPIED' : 'COPY'}
              </button>
            </div>
          </div>
        </div>

        {/* 中間：3D 預覽 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-400 flex items-center gap-2">
                <Move3D className="w-4 h-4" />
                3D PREVIEW
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={selectPrev} className="p-1 hover:bg-gray-800">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-cyan-400 text-xs min-w-[80px] text-center">
                  {selectedAlien?.name}
                </span>
                <button onClick={selectNext} className="p-1 hover:bg-gray-800">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* 3D Canvas */}
            <div className="relative aspect-square bg-black border border-gray-700 flex items-center justify-center">
              <Pixel3DAlien
                alienId={selectedAlienId}
                color={selectedAlien?.defaultColor}
                config={{
                  ...currentConfig,
                  wireframe: showWireframe,
                }}
                width={300}
                height={300}
                autoRotate={autoRotate}
                float={float}
                frame={currentFrame}
              />
              
              {/* 控制按鈕 */}
              <div className="absolute bottom-2 left-2 flex gap-1">
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`p-2 border ${autoRotate ? 'border-cyan-500 text-cyan-400' : 'border-gray-600 text-gray-400'}`}
                  title="Toggle Rotation"
                >
                  {autoRotate ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => setFloat(!float)}
                  className={`p-2 border ${float ? 'border-green-500 text-green-400' : 'border-gray-600 text-gray-400'}`}
                  title="Toggle Float"
                >
                  <Sparkles className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setShowWireframe(!showWireframe)}
                  className={`p-2 border ${showWireframe ? 'border-yellow-500 text-yellow-400' : 'border-gray-600 text-gray-400'}`}
                  title="Toggle Wireframe"
                >
                  {showWireframe ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
              </div>
              
              {/* Frame 切換 */}
              {selectedAlienId !== 'trophy' && (
                <div className="absolute bottom-2 right-2 flex gap-1">
                  <button
                    onClick={() => setCurrentFrame(1)}
                    className={`px-2 py-1 text-[10px] border ${currentFrame === 1 ? 'border-cyan-500 text-cyan-400' : 'border-gray-600 text-gray-400'}`}
                  >
                    F1
                  </button>
                  <button
                    onClick={() => setCurrentFrame(2)}
                    className={`px-2 py-1 text-[10px] border ${currentFrame === 2 ? 'border-cyan-500 text-cyan-400' : 'border-gray-600 text-gray-400'}`}
                  >
                    F2
                  </button>
                </div>
              )}
            </div>

            {/* 2D 對照預覽 */}
            <div className="mt-4 flex items-center justify-center gap-4 p-3 bg-gray-800/50 border border-gray-700">
              <div className="text-center">
                <span className="text-[10px] text-gray-500 block mb-1">2D ORIGINAL</span>
                <svg 
                  viewBox={`0 0 ${selectedAlienId === 'trophy' ? 12 : 11} ${selectedAlienId === 'trophy' ? 11 : 8}`}
                  className="w-16 h-12"
                >
                  {(selectedAlienId === 'trophy' ? TROPHY_2D_MATRIX : selectedAlien?.frame1)?.map((row, y) =>
                    row.map((cell, x) =>
                      cell === 1 ? (
                        <rect
                          key={`${x}-${y}`}
                          x={x}
                          y={y}
                          width={1}
                          height={1}
                          fill={selectedAlien?.defaultColor}
                        />
                      ) : null
                    )
                  )}
                </svg>
              </div>
              <div className="text-2xl text-gray-600">→</div>
              <div className="text-center">
                <span className="text-[10px] text-cyan-400 block mb-1">3D VOXEL</span>
                <div className="w-16 h-12 flex items-center justify-center border border-cyan-500/30 bg-cyan-500/5">
                  <Move3D className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：參數調整 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="border border-gray-800 bg-gray-900/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm text-gray-400 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                3D PARAMETERS
              </h2>
              <button
                onClick={handleReset}
                className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                RESET
              </button>
            </div>

            <div className="space-y-4">
              {/* Depth */}
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2">
                  <span>DEPTH (厚度)</span>
                  <span className="text-cyan-400">{currentConfig.depth}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={currentConfig.depth}
                  onChange={(e) => updateConfig('depth', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Rotation Speed */}
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2">
                  <span>ROTATION SPEED (旋轉速度)</span>
                  <span className="text-cyan-400">{currentConfig.rotationSpeed.toFixed(3)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.05"
                  step="0.001"
                  value={currentConfig.rotationSpeed}
                  onChange={(e) => updateConfig('rotationSpeed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Float Amplitude */}
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2">
                  <span>FLOAT AMPLITUDE (浮動振幅)</span>
                  <span className="text-cyan-400">{currentConfig.floatAmplitude.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentConfig.floatAmplitude}
                  onChange={(e) => updateConfig('floatAmplitude', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Float Speed */}
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2">
                  <span>FLOAT SPEED (浮動速度)</span>
                  <span className="text-cyan-400">{currentConfig.floatSpeed.toFixed(3)}</span>
                </label>
                <input
                  type="range"
                  min="0.005"
                  max="0.05"
                  step="0.005"
                  value={currentConfig.floatSpeed}
                  onChange={(e) => updateConfig('floatSpeed', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Gap */}
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2">
                  <span>PIXEL GAP (像素間隙)</span>
                  <span className="text-cyan-400">{currentConfig.gap.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="0.2"
                  step="0.01"
                  value={currentConfig.gap}
                  onChange={(e) => updateConfig('gap', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Emissive Intensity */}
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2">
                  <span>GLOW INTENSITY (發光強度)</span>
                  <span className="text-cyan-400">{currentConfig.emissiveIntensity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentConfig.emissiveIntensity}
                  onChange={(e) => updateConfig('emissiveIntensity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Wireframe Opacity */}
              <div>
                <label className="text-xs text-gray-400 flex items-center justify-between mb-2">
                  <span>WIREFRAME OPACITY (線框透明度)</span>
                  <span className="text-cyan-400">{currentConfig.wireframeOpacity.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentConfig.wireframeOpacity}
                  onChange={(e) => updateConfig('wireframeOpacity', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* 顏色面板 */}
          <div className="border border-gray-800 bg-gray-900/50 p-4">
            <h2 className="text-sm text-gray-400 mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              COLOR INFO
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">BASE COLOR</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 border border-gray-600"
                    style={{ backgroundColor: selectedAlien?.defaultColor }}
                  />
                  <span className="text-xs text-gray-400">{selectedAlien?.defaultColor}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">WIREFRAME</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 border border-gray-600"
                    style={{ backgroundColor: currentConfig.wireframeColor }}
                  />
                  <span className="text-xs text-gray-400">{currentConfig.wireframeColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 快捷預設 */}
          <div className="border border-gray-800 bg-gray-900/50 p-4">
            <h2 className="text-sm text-gray-400 mb-4">QUICK PRESETS</h2>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  updateConfig('depth', 1);
                  updateConfig('gap', 0);
                }}
                className="py-2 text-xs border border-gray-700 hover:border-cyan-500 hover:text-cyan-400"
              >
                FLAT
              </button>
              <button
                onClick={() => {
                  updateConfig('depth', 3);
                  updateConfig('gap', 0.05);
                }}
                className="py-2 text-xs border border-gray-700 hover:border-cyan-500 hover:text-cyan-400"
              >
                THICK
              </button>
              <button
                onClick={() => {
                  updateConfig('rotationSpeed', 0.03);
                  updateConfig('floatAmplitude', 0.5);
                }}
                className="py-2 text-xs border border-gray-700 hover:border-cyan-500 hover:text-cyan-400"
              >
                DYNAMIC
              </button>
              <button
                onClick={() => {
                  updateConfig('rotationSpeed', 0.005);
                  updateConfig('floatAmplitude', 0.1);
                }}
                className="py-2 text-xs border border-gray-700 hover:border-cyan-500 hover:text-cyan-400"
              >
                SUBTLE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-4 mt-8">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-600">
          FAW Creative Studio - Alien 3D Studio | 設定會自動保存到 localStorage
        </div>
      </footer>
    </div>
  );
}
