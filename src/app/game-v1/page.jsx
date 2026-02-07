'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Terminal, Zap, Cpu, ArrowDown, Shield, Crosshair, Sparkles, Rocket, Edit, Save, Trash2, X, MousePointer2 } from 'lucide-react';
import * as THREE from 'three';

// --- Custom Fonts Injection ---
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Rajdhani:wght@400;600;700&display=swap');
    
    .font-retro { font-family: 'Press Start 2P', cursive; }
    .font-tech { font-family: 'Rajdhani', sans-serif; }
    
    .scanline {
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
      background-size: 100% 4px;
      animation: scanline 10s linear infinite;
      pointer-events: none;
    }
    
    @keyframes scanline {
      0% { background-position: 0 0; }
      100% { background-position: 0 100%; }
    }

    .crt-flicker {
      animation: flicker 0.15s infinite;
      pointer-events: none;
    }

    @keyframes flicker {
      0% { opacity: 0.97; }
      50% { opacity: 1; }
      100% { opacity: 0.98; }
    }

    .glitch-text {
      position: relative;
    }
    
    .glitch-text::before, .glitch-text::after {
      content: attr(data-text);
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }
    
    .glitch-text::before {
      left: 2px;
      text-shadow: -1px 0 #ff00c1;
      clip: rect(44px, 450px, 56px, 0);
      animation: glitch-anim 5s infinite linear alternate-reverse;
    }
    
    .glitch-text::after {
      left: -2px;
      text-shadow: -1px 0 #00fff9;
      clip: rect(44px, 450px, 56px, 0);
      animation: glitch-anim2 5s infinite linear alternate-reverse;
    }

    @keyframes glitch-anim {
      0% { clip: rect(12px, 9999px, 5px, 0); }
      20% { clip: rect(80px, 9999px, 50px, 0); }
      40% { clip: rect(30px, 9999px, 10px, 0); }
      60% { clip: rect(65px, 9999px, 80px, 0); }
      80% { clip: rect(10px, 9999px, 60px, 0); }
      100% { clip: rect(95px, 9999px, 30px, 0); }
    }
    @keyframes glitch-anim2 {
      0% { clip: rect(65px, 9999px, 80px, 0); }
      20% { clip: rect(10px, 9999px, 60px, 0); }
      40% { clip: rect(95px, 9999px, 30px, 0); }
      60% { clip: rect(12px, 9999px, 5px, 0); }
      80% { clip: rect(80px, 9999px, 50px, 0); }
      100% { clip: rect(30px, 9999px, 10px, 0); }
    }
    
    /* Pixel Editor Grid */
    .pixel-grid {
      display: grid;
      grid-template-columns: repeat(11, 1fr);
      gap: 2px;
      background: #111;
      padding: 10px;
      border: 2px solid #333;
    }
    .pixel-cell {
      aspect-ratio: 1;
      cursor: pointer;
      transition: background 0.1s;
    }
    .pixel-cell:hover {
      border: 1px solid #555;
    }
    
    .game-cursor {
      cursor: crosshair !important;
    }
  `}</style>
);

// --- ASSET DEFINITIONS (FRAME 1 & FRAME 2) ---

// 1. DEFAULT / CUSTOM (CRAB)
const CUSTOM_FRAME_1 = [
  [0,0,1,0,0,0,0,0,1,0,0], // Antennae Out
  [0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,1,1,1,1,1,1,0,1], // Arms Down
  [1,0,1,0,0,0,0,0,1,0,1],
  [0,0,0,1,1,0,1,1,0,0,0]
];

const CUSTOM_FRAME_2 = [
  [0,0,0,1,0,0,0,1,0,0,0], // Antennae In
  [0,0,1,0,0,0,0,0,1,0,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,1,1,1,1,1,1,1,1,1,0], // Arms Up/Tucked
  [0,0,1,0,0,0,0,0,1,0,0],
  [0,1,0,1,1,0,1,1,0,1,0]
];

// Set default to frame 1
const DEFAULT_MATRIX = CUSTOM_FRAME_1;

// 2. SQUID (CYAN)
const SQUID_FRAME_1 = [
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,0,0,0,1,1,0,0],
  [0,1,1,0,1,0,1,0,1,1,0],
  [1,1,0,0,0,1,0,0,0,1,1]
];
const SQUID_FRAME_2 = [
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0],
  [0,0,1,1,1,1,1,1,1,0,0],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,0,0,0,1,1,0,0],
  [0,0,1,1,0,1,0,1,1,0,0],
  [0,0,0,1,1,0,1,1,0,0,0]
];

// 3. OCTOPUS (YELLOW)
const OCTOPUS_FRAME_1 = [
  [0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,1,1,0,0,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,1,1,0,0,1,1,0,0],
  [0,0,1,1,0,1,1,0,1,1,0]
];
const OCTOPUS_FRAME_2 = [
  [0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,0,0,1,1,0,0,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,0,0,0,1,1,0,0],
  [0,1,0,0,0,0,0,0,0,1,0]
];

// 4. UFO (RED)
const UFO_FRAME_1 = [
  [0,0,0,0,0,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,0,1,1,1,0,0,0,1,0,0],
  [0,0,0,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0]
];
const UFO_FRAME_2 = [
  [0,0,0,0,0,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,1],
  [0,1,1,0,1,1,1,0,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [0,0,0,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0]
];

// 5. GREEN ALIEN (GREEN)
const GREEN_ALIEN_FRAME_1 = [
  [0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0],
  [0,0,1,1,0,1,0,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [0,1,0,1,1,1,1,1,0,1,0],
  [0,1,0,1,0,0,0,1,0,1,0],
  [0,0,0,0,1,1,1,0,0,0,0]
];
const GREEN_ALIEN_FRAME_2 = [
  [0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,0,0,0],
  [0,0,1,1,0,1,0,1,1,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [0,0,0,1,1,1,1,1,0,0,0],
  [0,0,1,1,0,0,0,1,1,0,0],
  [0,1,0,0,0,0,0,0,0,1,0]
];

// --- Pixel Editor Component ---
const PixelEditor = ({ initialMatrix, initialColor, onSave, onClose }) => {
  const [matrix, setMatrix] = useState(initialMatrix);
  const [color, setColor] = useState(initialColor || '#a855f7');

  const colors = [
    { hex: '#a855f7', name: 'CYBER_PURPLE' },
    { hex: '#ffffff', name: 'PURE_WHITE' }, 
    { hex: '#22d3ee', name: 'NEON_CYAN' },
    { hex: '#facc15', name: 'RETRO_YELLOW' },
    { hex: '#ef4444', name: 'ALERT_RED' }, 
    { hex: '#22c55e', name: 'ALIEN_GREEN' } 
  ];

  const toggleCell = (r, c) => {
    const newMatrix = matrix.map((row, rowIndex) => 
      row.map((col, colIndex) => {
        if (rowIndex === r && colIndex === c) return col ? 0 : 1;
        return col;
      })
    );
    setMatrix(newMatrix);
  };

  const clearGrid = () => {
    const empty = Array(8).fill().map(() => Array(11).fill(0));
    setMatrix(empty);
  };

  const resetDefault = () => {
    setMatrix(DEFAULT_MATRIX);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-gray-900 border-2 border-green-500 p-6 rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.3)] max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">
          <X className="w-6 h-6" />
        </button>
        
        <h3 className="text-xl font-tech text-green-400 mb-2 flex items-center">
          <Edit className="w-5 h-5 mr-2" /> ASSET_EDITOR v1.5
        </h3>
        <p className="text-xs text-gray-400 font-mono mb-4">Select color & draw entity.</p>

        {/* Color Palette */}
        <div className="flex justify-center space-x-4 mb-4">
            {colors.map((c) => (
                <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className={`w-10 h-10 rounded-full border-2 transition-all duration-200 ${color === c.hex ? 'border-green-400 scale-110 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'border-gray-600 opacity-50 hover:opacity-100'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                />
            ))}
        </div>

        <div className="pixel-grid mb-6">
          {matrix.map((row, r) => (
            row.map((cell, c) => (
              <div 
                key={`${r}-${c}`} 
                className={`pixel-cell ${cell ? '' : 'bg-gray-800'}`}
                style={cell ? { backgroundColor: color, boxShadow: `0 0 5px ${color}` } : {}}
                onClick={() => toggleCell(r, c)}
              />
            ))
          ))}
        </div>

        <div className="flex justify-between gap-4">
          <div className="flex gap-2">
             <button onClick={clearGrid} className="p-2 border border-red-900 text-red-500 hover:bg-red-900/20 rounded" title="Clear">
               <Trash2 className="w-4 h-4" />
             </button>
             <button onClick={resetDefault} className="px-3 py-2 border border-gray-700 text-gray-400 hover:bg-gray-800 rounded text-xs font-mono">
               RESET
             </button>
          </div>
          <button 
            onClick={() => onSave(matrix, color)}
            className="flex-1 bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2 font-tech"
          >
            <Save className="w-4 h-4" /> DEPLOY ASSET
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 3D Scene Component (Phase 3) ---
const ThreeScene = ({ active, triggerExplosion, matrix, color }) => {
  const mountRef = useRef(null);
  const particlesRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene Setup
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Initial Particle Group
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);
    particlesRef.current = particleGroup;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    // Animation Loop
    const animate = (time) => {
      requestRef.current = requestAnimationFrame(animate);

      if (particlesRef.current) {
        // Global Group Rotation (Idle)
        if (!particlesRef.current.children[0]?.userData.isExploding) {
          particlesRef.current.rotation.y = Math.sin(time * 0.0005) * 0.2;
          particlesRef.current.rotation.x = Math.sin(time * 0.001) * 0.1;
        }

        // Individual Particle Logic
        particlesRef.current.children.forEach(p => {
          if (p.userData.isExploding) {
            // Explosion physics
            p.position.add(p.userData.velocity);
            p.rotation.x += 0.05;
            p.rotation.z += 0.05;
            p.children.forEach(mesh => {
                if (mesh.material.opacity > 0) mesh.material.opacity -= 0.02;
            });
          } else {
            // Idle: Gentle Float + Breathing Scale Effect
            p.position.y = p.userData.originalPos.y + Math.sin(time * 0.002 + p.position.x) * 0.1;
            const scale = 1 + Math.sin(time * 0.003 + p.userData.phaseOffset) * 0.1;
            p.scale.set(scale, scale, scale);
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestRef.current);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []); 

  // --- REBUILD PARTICLES WHEN MATRIX OR COLOR CHANGES ---
  useEffect(() => {
    if (!particlesRef.current || !matrix) return;
    
    while(particlesRef.current.children.length > 0){ 
        const obj = particlesRef.current.children[0];
        particlesRef.current.remove(obj);
    }

    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 6); 
    geometry.rotateX(Math.PI / 2);
    
    const threeColor = new THREE.Color(color);
    
    // Wireframe is lighter/brighter
    const wireframeMaterial = new THREE.MeshBasicMaterial({ 
        color: threeColor.clone().offsetHSL(0, 0, 0.2), // make it slightly brighter
        wireframe: true, 
        transparent: true, 
        opacity: 0.6 
    }); 
    
    // Core is the base color
    const coreMaterial = new THREE.MeshBasicMaterial({ 
        color: threeColor, 
        transparent: true, 
        opacity: 0.8 
    });

    const offsetX = -5.5;
    const offsetY = 4;

    matrix.forEach((row, y) => {
      row.forEach((val, x) => {
        if (val === 1) {
          const pixelGroup = new THREE.Group();
          const core = new THREE.Mesh(geometry, coreMaterial);
          const wireframe = new THREE.Mesh(geometry, wireframeMaterial);
          wireframe.scale.set(1.1, 1.1, 1.1);
          pixelGroup.add(core);
          pixelGroup.add(wireframe);
          pixelGroup.position.set(x + offsetX, -(y - offsetY), 0);
          pixelGroup.rotation.z = Math.random() * 0.2; 
          pixelGroup.userData = { 
            originalPos: new THREE.Vector3(x + offsetX, -(y - offsetY), 0),
            velocity: new THREE.Vector3(0, 0, 0),
            isExploding: false,
            phaseOffset: Math.random() * Math.PI * 2 
          };
          particlesRef.current.add(pixelGroup);
        }
      });
    });
    
  }, [matrix, color]);

  // Trigger Explosion Effect
  useEffect(() => {
    if (triggerExplosion && particlesRef.current) {
      particlesRef.current.children.forEach(p => {
        p.userData.isExploding = true;
        p.userData.velocity.set(
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 1.5,
          (Math.random() - 0.5) * 8 + 3 
        );
        p.children.forEach(mesh => {
             // Turn red on destruction
             mesh.material = new THREE.MeshBasicMaterial({ color: 0xff3333, wireframe: mesh.material.wireframe });
        });
      });
    }
  }, [triggerExplosion]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" style={{ opacity: active ? 1 : 0, transition: 'opacity 1s ease' }} />;
};

// --- Main App Component ---
export default function ProjectEVO() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [phase, setPhase] = useState(0); 
  const [aiTriggered, setAiTriggered] = useState(false);
  const [retroScore, setRetroScore] = useState(0);
  
  // Custom Asset State
  const [customMatrix, setCustomMatrix] = useState(DEFAULT_MATRIX);
  const [customColor, setCustomColor] = useState('#a855f7'); // Default Purple
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCustomModified, setIsCustomModified] = useState(false); // Track if user edited

  // Animation State - Ref-based to prevent re-renders
  const animationFrameRef = useRef(0);
  const lastAnimationTime = useRef(0);

  // Retro Game State
  const canvasRef = useRef(null);
  const shipPos = useRef(50); 
  const bullets = useRef([]);
  const enemies = useRef([]);
  const gameLoopRef = useRef(null);
  const lastShotTime = useRef(0);

  // Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const totalHeight = document.body.scrollHeight - windowHeight;
      const progress = Math.min(Math.max(totalScroll / totalHeight, 0), 1);
      
      setScrollProgress(progress);

      if (progress < 0.3) setPhase(0);
      else if (progress < 0.7) setPhase(1);
      else setPhase(2);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Retro Game Logic (Phase 1)
  useEffect(() => {
    if (phase !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;

    // INIT ENEMIES (6 ROWS, Tight Spacing: Gap=4)
    if (enemies.current.length === 0) {
        const rows = [
            { y: 10, color: '#a855f7', type: 'custom' },
            { y: 14, color: '#ffffff', type: 'custom' },
            { y: 18, color: '#22d3ee', type: 'squid' },
            { y: 22, color: '#facc15', type: 'octopus' },
            { y: 26, color: '#ef4444', type: 'ufo' },
            { y: 30, color: '#22c55e', type: 'green_alien' }
        ];

        rows.forEach(row => {
            for(let i=0; i<5; i++) {
                enemies.current.push({ 
                    x: 10 + i * 20, 
                    y: row.y, 
                    alive: true, 
                    color: row.color, 
                    type: row.type 
                });
            }
        });
    }

    const updateGame = (timestamp) => {
      // --- ANIMATION TIMER (0.4s) ---
      if (timestamp - lastAnimationTime.current > 400) {
          animationFrameRef.current = animationFrameRef.current === 0 ? 1 : 0;
          lastAnimationTime.current = timestamp;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#113311';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for(let i=0; i<canvas.width; i+=40) { ctx.moveTo(i,0); ctx.lineTo(i, canvas.height); }
      for(let i=0; i<canvas.height; i+=40) { ctx.moveTo(0,i); ctx.lineTo(canvas.width, i); }
      ctx.stroke();

      bullets.current.forEach(b => b.y -= 5);
      bullets.current = bullets.current.filter(b => b.y > 0);

      const shipX = (shipPos.current / 100) * canvas.width;
      const shipY = canvas.height - 50;
      
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(shipX - 15, shipY + 10, 30, 10);
      ctx.fillRect(shipX - 5, shipY, 10, 10);

      // --- Draw Enemies with Animation ---
      const pixelSize = 3; 
      const matrixWidth = 11 * pixelSize;
      const frame = animationFrameRef.current;

      enemies.current.forEach(e => {
        if (!e.alive) return;
        const ex = (e.x / 100) * canvas.width;
        let ey = (e.y / 100) * canvas.height;
        
        ctx.fillStyle = e.color || customColor; 
        
        // SELECT MATRIX BASED ON ANIMATION FRAME
        let shapeMatrix;
        if (e.type === 'squid') {
            shapeMatrix = frame === 0 ? SQUID_FRAME_1 : SQUID_FRAME_2;
        } else if (e.type === 'octopus') {
            shapeMatrix = frame === 0 ? OCTOPUS_FRAME_1 : OCTOPUS_FRAME_2;
        } else if (e.type === 'ufo') {
            shapeMatrix = frame === 0 ? UFO_FRAME_1 : UFO_FRAME_2;
        } else if (e.type === 'green_alien') {
            shapeMatrix = frame === 0 ? GREEN_ALIEN_FRAME_1 : GREEN_ALIEN_FRAME_2;
        } else {
            // CUSTOM: Check if modified
            if (!isCustomModified) {
                // If default, use the animated frames
                shapeMatrix = frame === 0 ? CUSTOM_FRAME_1 : CUSTOM_FRAME_2;
            } else {
                // If user modified, use their matrix with simple bobbing
                shapeMatrix = customMatrix;
                if (frame === 1) ey += 2; 
            }
        }
        
        shapeMatrix.forEach((row, r) => {
            row.forEach((cell, c) => {
                if(cell) {
                    const drawX = ex - (matrixWidth/2) + c * pixelSize;
                    const drawY = ey + r * pixelSize;
                    ctx.fillRect(drawX, drawY, pixelSize, pixelSize);
                }
            });
        });

        bullets.current.forEach(b => {
            if (Math.abs(b.x - ex) < 20 && Math.abs(b.y - ey) < 20) {
                e.alive = false;
                setRetroScore(s => s + 100);
                setTimeout(() => { e.alive = true; }, 2000);
            }
        });
      });

      ctx.fillStyle = '#ffffff';
      bullets.current.forEach(b => {
        ctx.fillRect(b.x - 2, b.y, 4, 10);
      });

      gameLoopRef.current = requestAnimationFrame(updateGame);
    };

    gameLoopRef.current = requestAnimationFrame(updateGame);

    // Keyboard controls (Movement Only)
    const handleKeyDown = (e) => {
      if (phase !== 0) return;
      if (e.key === 'ArrowLeft') shipPos.current = Math.max(shipPos.current - 5, 5);
      if (e.key === 'ArrowRight') shipPos.current = Math.min(shipPos.current + 5, 95);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [phase, customMatrix, customColor, isCustomModified]); // Removed animationFrame from deps

  // New robust click handler attached to the DIV wrapper
  const handleGameInteraction = (e) => {
      if (phase !== 0 || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      
      if (!clientX) return;

      const clickX = clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;

      // Update position immediately
      shipPos.current = Math.min(Math.max(percentage, 5), 95);

      // Fire immediately
      bullets.current.push({
          x: (shipPos.current / 100) * canvas.width,
          y: canvas.height - 60
      });
  };

  const handleAiExecute = () => {
    setAiTriggered(true);
  };

  const handleSaveAsset = (newMatrix, newColor) => {
    setCustomMatrix(newMatrix);
    setCustomColor(newColor);
    setIsCustomModified(true); // Mark as modified
    setIsEditorOpen(false);
  };

  return (
    <div className="bg-black min-h-[350vh] text-white relative select-none">
      <FontStyles />

      {/* --- EDITOR MODAL --- */}
      {isEditorOpen && (
        <PixelEditor 
          initialMatrix={customMatrix} 
          initialColor={customColor}
          onSave={handleSaveAsset} 
          onClose={() => setIsEditorOpen(false)} 
        />
      )}

      {/* --- Floating Editor Button --- */}
      <div className="fixed top-24 right-6 z-50">
        <button 
          onClick={() => setIsEditorOpen(true)}
          className="bg-gray-900/80 border text-white p-3 rounded-full hover:bg-white hover:text-black transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)] cursor-pointer"
          style={{ borderColor: customColor, color: customColor }}
          title="Customize Alien Asset"
        >
            <Edit className="w-6 h-6" style={{ color: 'inherit' }} />
        </button>
      </div>

      {/* --- Sticky Viewport --- */}
      <div className="fixed top-0 left-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center">
        
        {/* === PHASE 1: RETRO === */}
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-500"
          style={{ opacity: phase === 0 ? 1 : 0 }}
        >
          {/* Scanlines on TOP of canvas, but pointer-events-none */}
          <div className="absolute inset-0 scanline z-40 opacity-50 pointer-events-none"></div>
          <div className="absolute inset-0 crt-flicker bg-green-900/10 z-40 pointer-events-none"></div>
          
          {/* Game Container - pointer-events-auto applied here explicitly */}
          <div 
            className="w-full h-full relative pointer-events-auto game-cursor z-30" 
            onPointerDown={handleGameInteraction}
          > 
            <canvas ref={canvasRef} className="w-full h-full block" />
            
            {/* UI Overlays inside relative container but absolutely positioned on top */}
            <div className="absolute top-10 left-10 font-retro text-green-400 z-50 pointer-events-none select-none">
              <p>SCORE: {retroScore}</p>
              <p className="mt-4 text-xs animate-pulse flex items-center gap-2">
                <MousePointer2 className="w-4 h-4" /> CLICK TO MOVE & SHOOT
              </p>
            </div>

            <div className="absolute bottom-20 w-full text-center font-retro text-green-500 z-50 px-4 pointer-events-none select-none">
               <h1 className="text-2xl md:text-4xl mb-4">MANUAL_MODE_INIT</h1>
               <p className="text-xs md:text-sm opacity-70">&quot;THE OLD WAY IS HARD WORK.&quot;</p>
               <div className="mt-8 flex justify-center">
                   <ArrowDown className="animate-bounce" />
               </div>
            </div>
          </div>
        </div>


        {/* === PHASE 2: MODERN === */}
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center transition-all duration-700 pointer-events-none select-none"
          style={{ 
            opacity: phase === 1 ? 1 : 0,
            transform: phase === 1 ? 'scale(1)' : 'scale(0.8)',
            filter: phase === 1 ? 'blur(0px)' : 'blur(10px)'
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

          <div className="relative z-30 text-center font-tech">
             {/* Dynamic SVG with Color Prop */}
             <div className="w-48 h-48 mx-auto mb-8 relative animate-bounce flex items-center justify-center">
                <div 
                    className="absolute inset-0 blur-2xl opacity-40 rounded-full"
                    style={{ backgroundColor: customColor }}
                ></div>
                <svg 
                    viewBox="0 0 11 8" 
                    className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    style={{ color: customColor }}
                >
                  {customMatrix.map((row, r) => row.map((cell, c) => (
                    cell ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="currentColor" /> : null
                  )))}
                </svg>
             </div>

             <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 glitch-text" data-text="SYSTEM UPGRADE">
               SYSTEM UPGRADE
             </h2>
             <p className="mt-4 text-cyan-200 text-lg tracking-widest uppercase border-y border-cyan-500/30 py-2 inline-block">
               [ Optimizing Assets... ]
             </p>

             <div className="mt-12 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
                <div className="flex flex-col items-center p-4 border border-cyan-500/20 bg-black/50 backdrop-blur-sm rounded-lg">
                    <Shield className="w-8 h-8 text-cyan-400 mb-2" />
                    <span className="text-sm">VECTOR_GRAPHICS</span>
                </div>
                <div className="flex flex-col items-center p-4 border border-purple-500/20 bg-black/50 backdrop-blur-sm rounded-lg">
                    <Zap className="w-8 h-8 text-purple-400 mb-2" />
                    <span className="text-sm">HIGH_REFRESH</span>
                </div>
                <div className="flex flex-col items-center p-4 border border-pink-500/20 bg-black/50 backdrop-blur-sm rounded-lg">
                    <Sparkles className="w-8 h-8 text-pink-400 mb-2" />
                    <span className="text-sm">NEON_FX</span>
                </div>
             </div>
          </div>
        </div>


        {/* === PHASE 3: FUTURE (Three.js) === */}
        <div 
          className="absolute inset-0 z-30 transition-opacity duration-1000"
          style={{ opacity: phase === 2 ? 1 : 0, pointerEvents: phase === 2 ? 'auto' : 'none' }}
        >
            <ThreeScene active={phase === 2} triggerExplosion={aiTriggered} matrix={customMatrix} color={customColor} />
            
            <div className={`absolute inset-0 flex flex-col items-center justify-end pb-24 transition-all duration-500 ${aiTriggered ? 'opacity-0' : 'opacity-100'}`}>
                <div className="bg-black/80 backdrop-blur-md border border-green-500/50 p-6 rounded-sm w-[90%] max-w-lg shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                    <div className="flex items-center justify-between mb-4 border-b border-green-500/30 pb-2">
                        <div className="flex items-center space-x-2">
                            <Terminal className="w-5 h-5 text-green-500" />
                            <span className="font-retro text-xs text-green-400">FAW_LABS_AI_AGENT v2.5</span>
                        </div>
                        <div className="flex space-x-1">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-xs text-red-400 font-mono">THREAT DETECTED</span>
                        </div>
                    </div>

                    <div className="font-mono text-green-300 text-sm mb-6 space-y-1">
                        <p>{'>'} Analysis: CUSTOM_ENTITY_DETECTED</p>
                        <p>{'>'} Probability of manual success: 0.04%</p>
                        <p>{'>'} Recommendation: ACTIVATE_AI_COUNTERMEASURE</p>
                        <p className="animate-pulse">{'>'} WAITING FOR INPUT_</p>
                    </div>

                    <button 
                        onClick={handleAiExecute}
                        className="w-full group relative overflow-hidden bg-green-900/20 border border-green-500 hover:bg-green-500/20 text-green-400 hover:text-green-200 transition-all duration-300 py-4 font-tech font-bold text-xl uppercase tracking-widest cursor-pointer"
                    >
                        <span className="relative z-10 flex items-center justify-center space-x-3">
                            <Cpu className="w-6 h-6" />
                            <span>Execute_AI_Agent</span>
                        </span>
                        <div className="absolute inset-0 bg-green-500/10 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    </button>
                </div>
            </div>

            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-1000 ${aiTriggered ? 'opacity-100 scale-100' : 'opacity-0 scale-150'}`}>
                <div className="text-center font-tech">
                    <h1 className="text-6xl md:text-8xl font-bold text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] glitch-text" data-text="MISSION ACCOMPLISHED">
                        MISSION<br/>ACCOMPLISHED
                    </h1>
                    <p className="mt-6 text-xl text-white font-mono tracking-widest bg-black/60 inline-block px-4 py-1">
                        EFFICIENCY: 99.9% // TIME: 0.4s
                    </p>
                    <div className="mt-12 flex justify-center space-x-6">
                        <button className="px-8 py-3 bg-white text-black font-bold hover:bg-cyan-400 hover:text-black transition-colors pointer-events-auto cursor-pointer">
                            VIEW CASE STUDY
                        </button>
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 border border-white text-white hover:bg-white/10 transition-colors pointer-events-auto cursor-pointer"
                        >
                            REPLAY SIMULATION
                        </button>
                    </div>
                </div>
            </div>
        </div>

      </div>

      <div className="relative z-0 pointer-events-none">
        <div className="h-screen flex items-center justify-center"></div>
        <div className="h-screen flex items-center justify-center"></div>
        <div className="h-[150vh] flex items-center justify-center"></div>
      </div>
      
      <div className="fixed top-6 right-6 z-50 flex flex-col items-end space-y-2 pointer-events-none">
         <div className="bg-black/80 border border-gray-700 p-2 font-mono text-xs text-gray-400">
            SCROLL_Y: {Math.round(scrollProgress * 100)}%
         </div>
         <div className="bg-black/80 border border-gray-700 p-2 font-mono text-xs text-gray-400">
            PHASE: {phase === 0 ? 'RETRO_8BIT' : phase === 1 ? 'MODERN_UI' : 'AI_FUTURE'}
         </div>
         <div className="h-32 w-1 bg-gray-800 rounded-full relative overflow-hidden">
             <div 
               className="absolute top-0 left-0 w-full bg-green-500 transition-all duration-100"
               style={{ height: `${scrollProgress * 100}%` }}
             />
         </div>
      </div>

    </div>
  );
}
