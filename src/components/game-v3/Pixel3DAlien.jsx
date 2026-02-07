'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { 
  ALIEN_2D_MATRICES, 
  TROPHY_2D_MATRIX,
  ALIEN_3D_CONFIGS,
  DEFAULT_3D_CONFIG,
  loadCustomConfigs 
} from '@/data/alienDefinitions';

/**
 * 3D Pixel 外星人元件
 * 將 2D pixel matrix 轉換為 Three.js 3D 方塊群組
 * 
 * @param {string} alienId - 外星人 ID (crab, squid, octopus, ufo, green_alien, trophy)
 * @param {string} color - 覆蓋顏色（可選）
 * @param {object} config - 3D 配置覆蓋（可選）
 * @param {number} width - Canvas 寬度
 * @param {number} height - Canvas 高度
 * @param {boolean} autoRotate - 是否自動旋轉
 * @param {boolean} float - 是否浮動動畫
 * @param {number} frame - 動畫幀 (1 或 2)
 */
const Pixel3DAlien = ({
  alienId = 'squid',
  color = null,
  config = {},
  width = 200,
  height = 200,
  autoRotate = true,
  float = true,
  frame = 1,
  className = '',
  style = {},
}) => {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const groupRef = useRef(null);
  const animationRef = useRef(null);
  const timeRef = useRef(0);

  // 取得外星人資料
  const alienData = useMemo(() => {
    if (alienId === 'trophy') {
      return {
        matrix: TROPHY_2D_MATRIX,
        color: '#facc15',
        config3D: { ...ALIEN_3D_CONFIGS.trophy, ...config },
      };
    }
    
    const base = ALIEN_2D_MATRICES[alienId];
    if (!base) {
      console.warn(`Unknown alien ID: ${alienId}`);
      return null;
    }
    
    // 載入自訂配置
    const customConfigs = loadCustomConfigs();
    const customConfig = customConfigs?.[alienId] || {};
    
    return {
      matrix: frame === 1 ? base.frame1 : base.frame2,
      color: color || base.defaultColor,
      config3D: { 
        ...(ALIEN_3D_CONFIGS[alienId] || DEFAULT_3D_CONFIG),
        ...customConfig,
        ...config 
      },
    };
  }, [alienId, color, config, frame]);

  useEffect(() => {
    if (!containerRef.current || !alienData) return;

    const { matrix, color: alienColor, config3D } = alienData;
    const {
      depth,
      pixelSize,
      gap,
      rotationSpeed,
      floatAmplitude,
      floatSpeed,
      wireframe,
      wireframeColor,
      wireframeOpacity,
      emissive,
      emissiveIntensity,
    } = config3D;

    // 初始化場景
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 相機設置
    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
    cameraRef.current = camera;

    // 計算 matrix 尺寸以設定相機位置
    const matrixWidth = matrix[0]?.length || 11;
    const matrixHeight = matrix.length || 8;
    const maxDim = Math.max(matrixWidth, matrixHeight);
    camera.position.z = maxDim * 1.8;
    camera.position.y = 0;

    // 渲染器
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    rendererRef.current = renderer;

    // 清除舊的 canvas
    while (containerRef.current.firstChild) {
      containerRef.current.removeChild(containerRef.current.firstChild);
    }
    containerRef.current.appendChild(renderer.domElement);

    // 燈光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 10);
    scene.add(directionalLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -5, -10);
    scene.add(backLight);

    // 創建方塊群組
    const group = new THREE.Group();
    groupRef.current = group;

    // 材質
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(alienColor),
      metalness: 0.3,
      roughness: 0.4,
      emissive: emissive ? new THREE.Color(alienColor) : new THREE.Color(0x000000),
      emissiveIntensity: emissive ? emissiveIntensity : 0,
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(wireframeColor),
      wireframe: true,
      transparent: true,
      opacity: wireframeOpacity,
    });

    // 方塊幾何
    const boxSize = pixelSize - gap;
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize * depth);

    // 計算偏移量使群組居中
    const offsetX = -matrixWidth / 2;
    const offsetY = matrixHeight / 2;

    // 根據 matrix 創建方塊
    matrix.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const pixelGroup = new THREE.Group();

          // 核心方塊
          const core = new THREE.Mesh(geometry, coreMaterial.clone());
          pixelGroup.add(core);

          // 線框
          if (wireframe) {
            const wire = new THREE.Mesh(geometry, wireframeMaterial.clone());
            wire.scale.set(1.02, 1.02, 1.02);
            pixelGroup.add(wire);
          }

          pixelGroup.position.set(
            x + offsetX + 0.5,
            -(y - offsetY) - 0.5,
            0
          );

          // 儲存原始位置供動畫使用
          pixelGroup.userData = {
            originalPos: pixelGroup.position.clone(),
            phaseOffset: Math.random() * Math.PI * 2,
          };

          group.add(pixelGroup);
        }
      });
    });

    scene.add(group);

    // 動畫循環
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.016; // ~60fps

      // 自動旋轉
      if (autoRotate && group) {
        group.rotation.y += rotationSpeed;
      }

      // 浮動動畫
      if (float && group) {
        group.position.y = Math.sin(timeRef.current * floatSpeed * 60) * floatAmplitude;
      }

      renderer.render(scene, camera);
    };

    animate();

    // 清理
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.clear();
      }
      geometry.dispose();
      coreMaterial.dispose();
      wireframeMaterial.dispose();
    };
  }, [alienData, width, height, autoRotate, float]);

  if (!alienData) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <span className="text-red-500 font-mono text-xs">Unknown Alien</span>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${className}`}
      style={{ width, height, ...style }}
    />
  );
};

export default Pixel3DAlien;

/**
 * 2D Pixel 外星人預覽元件（SVG）
 * 用於設定頁面的 2D 預覽
 */
export const Pixel2DAlien = ({
  alienId = 'squid',
  color = null,
  frame = 1,
  size = 100,
  className = '',
}) => {
  const alienData = useMemo(() => {
    if (alienId === 'trophy') {
      return {
        matrix: TROPHY_2D_MATRIX,
        color: '#facc15',
      };
    }
    
    const base = ALIEN_2D_MATRICES[alienId];
    if (!base) return null;
    
    return {
      matrix: frame === 1 ? base.frame1 : base.frame2,
      color: color || base.defaultColor,
    };
  }, [alienId, color, frame]);

  if (!alienData) return null;

  const { matrix, color: alienColor } = alienData;
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;

  return (
    <svg 
      viewBox={`0 0 ${cols} ${rows}`} 
      width={size} 
      height={size * (rows / cols)}
      className={className}
    >
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell === 1 ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={alienColor}
            />
          ) : null
        )
      )}
    </svg>
  );
};
