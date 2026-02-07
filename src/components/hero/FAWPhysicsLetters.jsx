'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useBox, usePlane, Physics } from '@react-three/cannon';
import * as THREE from 'three';

/**
 * 中景：FAW 3D 立體字母，帶物理重力和碰撞效果
 * 支援手機六軸搖晃控制
 */

// 字母尺寸常數 - 約螢幕寬度的 0.4
const LETTER_WIDTH = 2.2;  // 字母碰撞箱寬度
const LETTER_HEIGHT = 3.0; // 字母碰撞箱高度
const LETTER_DEPTH = 0.8;  // 字母碰撞箱深度

// 邊界牆壁 - 考慮字母大小，讓字母完全不會超出螢幕
const Boundaries = () => {
  // 邊界要內縮字母的一半大小
  const boundaryX = 4.5 - LETTER_WIDTH / 2;  // 左右邊界
  const boundaryY = 6 - LETTER_HEIGHT / 2;    // 上下邊界
  
  // 上邊界
  const [ceiling] = usePlane(() => ({
    rotation: [Math.PI / 2, 0, 0],
    position: [0, boundaryY, 0],
    type: 'Static',
  }));
  
  // 下邊界
  const [floor] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -boundaryY, 0],
    type: 'Static',
  }));
  
  // 左邊界
  const [leftWall] = usePlane(() => ({
    rotation: [0, Math.PI / 2, 0],
    position: [-boundaryX, 0, 0],
    type: 'Static',
  }));
  
  // 右邊界
  const [rightWall] = usePlane(() => ({
    rotation: [0, -Math.PI / 2, 0],
    position: [boundaryX, 0, 0],
    type: 'Static',
  }));
  
  // 前後邊界（Z軸）- 限制在很窄的範圍讓字母保持在同一平面
  const [backWall] = usePlane(() => ({
    rotation: [0, 0, 0],
    position: [0, 0, -LETTER_DEPTH],
    type: 'Static',
  }));
  
  const [frontWall] = usePlane(() => ({
    rotation: [0, Math.PI, 0],
    position: [0, 0, LETTER_DEPTH],
    type: 'Static',
  }));
  
  return (
    <>
      <mesh ref={ceiling} visible={false} />
      <mesh ref={floor} visible={false} />
      <mesh ref={leftWall} visible={false} />
      <mesh ref={rightWall} visible={false} />
      <mesh ref={backWall} visible={false} />
      <mesh ref={frontWall} visible={false} />
    </>
  );
};

// 單個字母物理方塊 - 像積木一樣可分開堆疊
const PhysicsLetter = ({ letter, position, color, delay = 0, gyroscopeRef, scale = 2.5 }) => {
  const [ref, api] = useBox(() => ({
    mass: 5,
    position: [position[0], position[1], position[2]],
    args: [LETTER_WIDTH, LETTER_HEIGHT, LETTER_DEPTH], // 精確的碰撞箱
    restitution: 0.4,   // 彈性，讓它們彈開
    friction: 0.8,      // 高摩擦力，讓它們可以堆疊
    linearDamping: 0.4,
    angularDamping: 0.5,
  }));
  
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Create letter shape - 放大版
  const letterGeometry = useMemo(() => {
    const shapes = {
      'F': () => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.6, -1);
        shape.lineTo(-0.6, 1);
        shape.lineTo(0.6, 1);
        shape.lineTo(0.6, 0.7);
        shape.lineTo(-0.25, 0.7);
        shape.lineTo(-0.25, 0.15);
        shape.lineTo(0.4, 0.15);
        shape.lineTo(0.4, -0.15);
        shape.lineTo(-0.25, -0.15);
        shape.lineTo(-0.25, -1);
        shape.closePath();
        return shape;
      },
      'A': () => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.7, -1);
        shape.lineTo(-0.1, 1);
        shape.lineTo(0.1, 1);
        shape.lineTo(0.7, -1);
        shape.lineTo(0.35, -1);
        shape.lineTo(0.2, -0.5);
        shape.lineTo(-0.2, -0.5);
        shape.lineTo(-0.35, -1);
        shape.closePath();
        
        const hole = new THREE.Path();
        hole.moveTo(-0.1, -0.25);
        hole.lineTo(0, 0.4);
        hole.lineTo(0.1, -0.25);
        hole.closePath();
        shape.holes.push(hole);
        return shape;
      },
      'W': () => {
        const shape = new THREE.Shape();
        shape.moveTo(-0.8, 1);
        shape.lineTo(-0.5, -1);
        shape.lineTo(-0.25, 0.2);
        shape.lineTo(0, -1);
        shape.lineTo(0.25, 0.2);
        shape.lineTo(0.5, -1);
        shape.lineTo(0.8, 1);
        shape.lineTo(0.5, 1);
        shape.lineTo(0.35, 0);
        shape.lineTo(0.15, 0.8);
        shape.lineTo(-0.15, 0.8);
        shape.lineTo(-0.35, 0);
        shape.lineTo(-0.5, 1);
        shape.closePath();
        return shape;
      }
    };
    
    const letterShape = shapes[letter] ? shapes[letter]() : null;
    if (!letterShape) return null;
    
    const extrudeSettings = {
      steps: 1,
      depth: 0.4,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.04,
      bevelSegments: 3,
    };
    
    return new THREE.ExtrudeGeometry(letterShape, extrudeSettings);
  }, [letter]);
  
  // 初始分散 - 給予隨機速度讓它們分開
  useEffect(() => {
    const timer = setTimeout(() => {
      // 給予較大的隨機速度讓字母分散開
      api.velocity.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        0
      );
      api.angularVelocity.set(
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3,
        (Math.random() - 0.5) * 3
      );
    }, delay);
    return () => clearTimeout(timer);
  }, [api, delay]);
  
  // 根據六軸數據施加力 - 上下左右都能動
  useFrame(() => {
    if (gyroscopeRef && gyroscopeRef.current && api) {
      const gamma = gyroscopeRef.current.gamma || 0; // 左右傾斜
      const beta = gyroscopeRef.current.beta || 0;   // 前後傾斜
      
      // gamma: 左右傾斜 (-90 to 90) → X 軸
      // beta: 前後傾斜 (0=平放, 90=垂直) → Y 軸
      // 手機通常 45-60 度握持，所以 beta 需要偏移
      
      const forceX = gamma * 2.0;  // 左右傾斜 → X 軸力
      const forceY = -(beta - 50) * 1.5;  // 前後傾斜 → Y 軸力（向前傾=往上）
      
      // 傾斜超過門檻才施力
      if (Math.abs(gamma) > 2 || Math.abs(beta - 50) > 3) {
        api.applyForce(
          [forceX, forceY, 0],
          [0, 0, 0]
        );
      }
    }
  });
  
  // Click to apply impulse
  const handleClick = () => {
    api.applyImpulse(
      [(Math.random() - 0.5) * 10, 10, 0],
      [0, 0, 0]
    );
  };
  
  if (!letterGeometry) return null;
  
  return (
    <group ref={ref} onClick={handleClick}>
      <mesh
        ref={meshRef}
        geometry={letterGeometry}
        position={[0, 0, -0.2]}
        scale={[scale, scale, scale]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          color={hovered ? '#FFFFFF' : color}
          metalness={0.6}
          roughness={0.3}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>
    </group>
  );
};

// 主要 FAW 物理元件
const FAWPhysicsLetters = ({ gyroscope = { alpha: 0, beta: 0, gamma: 0 } }) => {
  const groupRef = useRef();
  const gyroscopeRef = useRef(gyroscope);
  
  // 更新 ref 來避免 stale closure
  useEffect(() => {
    gyroscopeRef.current = gyroscope;
  }, [gyroscope]);
  
  // 字母大小 scale = 1.6，每個字約佔螢幕寬度的 0.4
  const letterScale = 1.6;
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Physics 
        gravity={[0, 0, 0]}  // 無重力，完全靠六軸控制
        defaultContactMaterial={{
          friction: 0.6,      // 摩擦力讓積木能堆疊
          restitution: 0.5,   // 彈性讓它們碰撞後分開
          contactEquationStiffness: 1e8,
          contactEquationRelaxation: 3,
        }}
      >
        <Boundaries />
        {/* 三個字母從不同位置開始，讓它們像積木一樣散開 */}
        <PhysicsLetter letter="F" position={[-2, 2, 0]} color="#FFFFFF" delay={0} gyroscopeRef={gyroscopeRef} scale={letterScale} />
        <PhysicsLetter letter="A" position={[0, -1, 0]} color="#FFFFFF" delay={50} gyroscopeRef={gyroscopeRef} scale={letterScale} />
        <PhysicsLetter letter="W" position={[2, 1, 0]} color="#FFFFFF" delay={100} gyroscopeRef={gyroscopeRef} scale={letterScale} />
      </Physics>
    </group>
  );
};

export default FAWPhysicsLetters;
