'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 近景：粒子組成的文字，每秒幻化一次
 */

const PHRASES = [
  '千變萬化，只為了與你相遇',
  '萬種型態，只為了助你業績',
  '隨心所欲，只為了尋找真理',
  '萬般改變，只為了博君一笑',
  '眾裡尋他，只為了雪中送炭',
  '一笑生花，只為了萬眾矚目',
];

const ParticleText = ({ position = [0, -2, 3] }) => {
  const pointsRef = useRef();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [targetPositions, setTargetPositions] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const morphProgressRef = useRef(0);
  const currentPositionsRef = useRef(null);
  
  const PARTICLE_COUNT = 2500;
  
  // Check if client-side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Generate particle positions for text
  const generateTextParticles = useCallback((text) => {
    if (typeof window === 'undefined') return [];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024;
    canvas.height = 128;
    
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Use web-safe Chinese font
    ctx.font = 'bold 42px "Noto Sans TC", "Microsoft YaHei", "PingFang SC", sans-serif';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const positions = [];
    
    // Sample white pixels
    for (let y = 0; y < canvas.height; y += 2) {
      for (let x = 0; x < canvas.width; x += 2) {
        const i = (y * canvas.width + x) * 4;
        if (imageData.data[i] > 128) {
          positions.push({
            x: (x - canvas.width / 2) * 0.007,
            y: (canvas.height / 2 - y) * 0.007,
            z: (Math.random() - 0.5) * 0.15,
          });
        }
      }
    }
    
    return positions;
  }, []);
  
  // Initial particle geometry
  const { geometry } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread out initial positions
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1;
      
      // Green to cyan gradient
      const colorChoice = Math.random();
      if (colorChoice < 0.6) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 1;
        colors[i * 3 + 2] = 0.6;
      } else if (colorChoice < 0.85) {
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0.75;
        colors[i * 3 + 2] = 1;
      } else {
        colors[i * 3] = 1;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0.3;
      }
      
      sizes[i] = Math.random() * 2.5 + 1;
    }
    
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    return { geometry: geo };
  }, []);
  
  // Change phrase every 1 second
  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      morphProgressRef.current = 0;
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isClient]);
  
  // Generate new target positions when phrase changes
  useEffect(() => {
    if (isClient) {
      const textPositions = generateTextParticles(PHRASES[currentPhraseIndex]);
      setTargetPositions(textPositions);
    }
  }, [currentPhraseIndex, isClient, generateTextParticles]);
  
  // Animation frame
  useFrame((state, delta) => {
    if (!pointsRef.current || targetPositions.length === 0) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array;
    const time = state.clock.getElapsedTime();
    
    // Smooth morph progress
    morphProgressRef.current = Math.min(1, morphProgressRef.current + delta * 4);
    const morphT = morphProgressRef.current;
    const easeT = morphT < 0.5 
      ? 4 * morphT * morphT * morphT 
      : 1 - Math.pow(-2 * morphT + 2, 3) / 2;
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      if (i < targetPositions.length) {
        // Morph to text position
        const target = targetPositions[i];
        const currentX = positions[i3];
        const currentY = positions[i3 + 1];
        const currentZ = positions[i3 + 2];
        
        // Add slight wave motion
        const waveOffset = Math.sin(time * 3 + i * 0.01) * 0.02;
        
        positions[i3] = THREE.MathUtils.lerp(currentX, target.x, easeT * 0.2);
        positions[i3 + 1] = THREE.MathUtils.lerp(currentY, target.y + waveOffset, easeT * 0.2);
        positions[i3 + 2] = THREE.MathUtils.lerp(currentZ, target.z, easeT * 0.2);
      } else {
        // Float around randomly for excess particles
        positions[i3] += Math.sin(time + i * 0.5) * 0.003;
        positions[i3 + 1] += Math.cos(time * 0.7 + i * 0.3) * 0.003;
        positions[i3 + 2] += Math.sin(time * 0.4 + i * 0.2) * 0.002;
        
        // Keep in bounds
        if (Math.abs(positions[i3]) > 6) positions[i3] *= 0.98;
        if (Math.abs(positions[i3 + 1]) > 2) positions[i3 + 1] *= 0.98;
        if (Math.abs(positions[i3 + 2]) > 1) positions[i3 + 2] *= 0.98;
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  // Particle material
  const particleMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1 },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (180.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.2, 0.5, dist);
          float glow = exp(-dist * 4.0) * 0.5;
          
          gl_FragColor = vec4(vColor + glow, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }, []);
  
  return (
    <group position={position}>
      <points ref={pointsRef} geometry={geometry} material={particleMaterial} />
    </group>
  );
};

export default ParticleText;
