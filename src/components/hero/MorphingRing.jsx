'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 遠景：透過 shader 幻化的環狀 3D
 * 每秒幻化一次
 */
const MorphingRing = ({ position = [0, 0, -15] }) => {
  const meshRef = useRef();
  const materialRef = useRef();

  // Custom shader for morphing effect
  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uMorphPhase: { value: 0 },
      uColor1: { value: new THREE.Color('#00FF99') },
      uColor2: { value: new THREE.Color('#FF004D') },
      uColor3: { value: new THREE.Color('#00BFFF') },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uMorphPhase;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying float vDisplacement;
      
      // Noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0/6.0, 1.0/3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        
        vec3 i  = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        
        i = mod289(i);
        vec4 p = permute(permute(permute(
          i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
        
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
        
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
      }
      
      void main() {
        vUv = uv;
        vPosition = position;
        
        // Calculate morph displacement
        float morphStrength = sin(uMorphPhase * 3.14159) * 0.5 + 0.5;
        float noise1 = snoise(position * 2.0 + uTime * 0.5);
        float noise2 = snoise(position * 3.0 - uTime * 0.3);
        
        float displacement = (noise1 * 0.4 + noise2 * 0.3) * morphStrength;
        vDisplacement = displacement;
        
        vec3 newPosition = position + normal * displacement;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uMorphPhase;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      uniform vec3 uColor3;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying float vDisplacement;
      
      void main() {
        // Color mixing based on morph phase and position
        float colorMix1 = sin(uMorphPhase * 6.28318 + vUv.x * 3.0) * 0.5 + 0.5;
        float colorMix2 = cos(uMorphPhase * 6.28318 + vUv.y * 3.0) * 0.5 + 0.5;
        
        vec3 color = mix(uColor1, uColor2, colorMix1);
        color = mix(color, uColor3, colorMix2 * 0.5);
        
        // Add glow based on displacement
        float glow = abs(vDisplacement) * 2.0;
        color += glow * 0.3;
        
        // Edge glow
        float edge = 1.0 - abs(dot(normalize(vPosition), vec3(0.0, 0.0, 1.0)));
        color += edge * uColor1 * 0.5;
        
        // Alpha with pulse
        float alpha = 0.6 + sin(uTime * 2.0) * 0.1 + glow * 0.3;
        
        gl_FragColor = vec4(color, alpha * 0.8);
      }
    `,
  }), []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      meshRef.current.rotation.y = time * 0.15;
      meshRef.current.rotation.z = Math.cos(time * 0.15) * 0.05;
    }
    
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      // Morph phase cycles every 1 second
      materialRef.current.uniforms.uMorphPhase.value = (time % 1.0);
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <torusGeometry args={[8, 2.5, 64, 128]} />
        <shaderMaterial
          ref={materialRef}
          args={[shaderData]}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Inner ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.3, 32, 64]} />
        <meshBasicMaterial color="#00FF99" transparent opacity={0.3} />
      </mesh>
      
      {/* Outer glow ring */}
      <mesh>
        <torusGeometry args={[11, 0.1, 16, 64]} />
        <meshBasicMaterial color="#FF004D" transparent opacity={0.5} />
      </mesh>
    </group>
  );
};

export default MorphingRing;
