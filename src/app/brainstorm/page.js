'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateRelatedWords, generateCreativeCombination, initGemini, setCurrentTheme } from '@/gemini';
import { RotateCcw, Clock, Settings, LogIn, Maximize2, User, Move, ZoomIn, ZoomOut, X, Sparkles, Lightbulb, Plus } from 'lucide-react';
import clsx from 'clsx';
import { auth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

// --- Components ---

/** 
 * Glass Panel Wrapper 
 */
const GlassPanel = ({ children, className, ...props }) => (
  <div 
    className={clsx(
      "backdrop-blur-xl bg-white/70 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] rounded-2xl", 
      className
    )}
    {...props}
  >
    {children}
  </div>
);

/**
 * Node Component with floating animation - Updated to match reference
 */
const Node = ({ id, x, y, data, isSelected, isCenter, isExpanded, depth, onClick, onContextMenu, onDrag, isDraggable }) => {
  // data: { word: string, en: string }
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, nodeX: 0, nodeY: 0 });
  const hasDraggedRef = useRef(false); // Track if actual drag occurred
  
  // A node is a "center" if it's the root OR if it has been expanded (clicked)
  const isNodeCenter = (isCenter === true && depth === 0) || isExpanded;
  
  // Size: expanded nodes become center size (110px)
  // White balls (non-center) are 1.4x larger
  const getSize = () => {
    if (isNodeCenter) return 110;
    if (depth === 1) return Math.round(105 * 1.4); // 147px
    return Math.round(80 * 1.5); // 112px
  };
  
  const size = getSize();
  
  // Hover scale for non-center nodes only
  const hoverScale = !isNodeCenter && isHovered ? 1.5 : 1;
  
  // Random floating parameters for each node (memoized via useMemo pattern inline)
  const floatParams = useMemo(() => ({
    duration: 4 + Math.random() * 3,
    delay: Math.random() * 2,
    x: (Math.random() - 0.5) * 8,
    y: (Math.random() - 0.5) * 8
  }), [id]);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (!isDraggable) return;
    e.stopPropagation();
    setIsDragging(true);
    hasDraggedRef.current = false; // Reset drag flag
    dragStart.current = { x: e.clientX, y: e.clientY, nodeX: x, nodeY: y };
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !onDrag) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    
    // Check if moved enough to be considered a drag (threshold: 5px)
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      hasDraggedRef.current = true;
    }
    
    onDrag(id, dragStart.current.nodeX + dx, dragStart.current.nodeY + dy);
  }, [isDragging, onDrag, id]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle click - only trigger if not dragged
  const handleClick = (e) => {
    if (hasDraggedRef.current) {
      // Was a drag, not a click - don't trigger onClick
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ 
        scale: hoverScale, 
        opacity: 1,
        x: isDragging ? 0 : [0, floatParams.x, 0, -floatParams.x, 0],
        y: isDragging ? 0 : [0, floatParams.y, -floatParams.y, 0, floatParams.y, 0]
      }}
      transition={{ 
        scale: { type: "spring", stiffness: 400, damping: 25 },
        opacity: { duration: 0.3 },
        x: { repeat: Infinity, duration: floatParams.duration, delay: floatParams.delay, ease: "easeInOut" },
        y: { repeat: Infinity, duration: floatParams.duration * 1.2, delay: floatParams.delay, ease: "easeInOut" }
      }}
      style={{
        position: 'absolute',
        left: x - size/2,
        top: y - size/2,
        width: size,
        height: size,
        zIndex: isDragging ? 100 : (isHovered ? 50 : (isNodeCenter ? 20 : 10)),
        cursor: isDraggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
      }}
      onClick={handleClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      <div 
        className={clsx(
          "w-full h-full relative flex flex-col items-center justify-center text-center rounded-full transition-all duration-300",
          // Colors: Center nodes (root or expanded) are yellow, others are white
          isNodeCenter
            ? "bg-gradient-to-br from-[#FFD700] to-[#FFC000] text-black shadow-lg"
            : "bg-white text-gray-800 border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.08)] hover:shadow-xl",
          // Selection ring for selected nodes (yellow glow)
          isSelected && "ring-4 ring-[#FFD700]/50 ring-offset-2 ring-offset-white"
        )}
      >
         <div className="px-2 pointer-events-none flex flex-col items-center justify-center">
           <div className={clsx(
             "font-bold leading-tight break-words",
             size > 100 ? "text-base" : "text-sm"
           )}>
             {data.word}
           </div>
           <div className={clsx(
             "opacity-60 mt-0.5 uppercase tracking-wider font-light",
             size > 100 ? "text-[9px]" : "text-[8px]"
           )}>
             {data.en}
           </div>
         </div>
      </div>
    </motion.div>
  );
};

/**
 * Connection Line - Gray dashed style
 */
const Connection = ({ start, end }) => {
  return (
    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-visible">
      <line
        x1={start.x}
        y1={start.y}
        x2={end.x}
        y2={end.y}
        stroke="#9CA3AF"
        strokeWidth="1.5"
        strokeDasharray="8 6"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Creative Combination Panel (Left Side) - New component matching reference
 */
const CreativeCombinationPanel = ({ selectedNodes, onRemove, onGenerate, isGenerating }) => {
  if (selectedNodes.length === 0) return null;
  
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -100, opacity: 0 }}
      className="fixed top-4 left-4 z-50"
    >
      <div className="bg-black/90 backdrop-blur-xl rounded-2xl p-4 w-64 shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white">
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            <span className="font-bold text-sm">創意組合</span>
          </div>
          <button 
            onClick={() => selectedNodes.forEach(n => onRemove(n.id))}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Selected Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedNodes.map(node => (
            <div 
              key={node.id}
              className="bg-[#FFD700] text-black px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
            >
              {node.data.word}
              <button 
                onClick={() => onRemove(node.id)}
                className="ml-1 hover:bg-black/20 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={isGenerating || selectedNodes.length < 2}
          className={clsx(
            "w-full py-2 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold transition-all",
            selectedNodes.length >= 2
              ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
              : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
          )}
        >
          <Lightbulb className="w-4 h-4" />
          <span>✨ 生成創意方案</span>
        </button>
      </div>
    </motion.div>
  );
};

/**
 * Status Indicator (Top Center) - New component matching reference
 */
const StatusIndicator = ({ isActive, nodeCount, theme }) => {
  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
    >
      <div className={clsx(
        "px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg",
        isActive 
          ? "bg-[#FFD700] text-black" 
          : "bg-white/80 backdrop-blur border border-gray-200 text-gray-600"
      )}>
        <motion.div 
          animate={isActive ? { rotate: 360 } : {}}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="w-4 h-4"
        >
          {isActive ? "🌟" : "💭"}
        </motion.div>
        <span>
          {isActive 
            ? "思考關聯中..." 
            : theme 
              ? `主題：${theme} · ${nodeCount} 個節點`
              : `${nodeCount} 個節點`
          }
        </span>
      </div>
    </motion.div>
  );
};

/**
 * History / Sidebar - Hidden by default, accessible via button
 */
const HistorySidebar = ({ history, onRestore, isOpen, onToggle }) => {
  return (
    <>
      {/* Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
          >
            <GlassPanel className="fixed top-16 right-4 w-56 p-4 z-50 max-h-[50vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-2" /> 歷史紀錄
                </div>
                <button onClick={onToggle} className="text-gray-400 hover:text-black">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {history.map((item, idx) => (
                   <div key={idx} onClick={() => onRestore(item)} className="cursor-pointer p-2 hover:bg-black/5 rounded text-sm group flex justify-between">
                      <span>{item.word}</span>
                      <span className="text-gray-400 text-xs hidden group-hover:inline">載入</span>
                   </div>
                ))}
                {history.length === 0 && <div className="text-gray-300 text-sm">尚無歷史記錄</div>}
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Main App ---

export default function App() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [inputValue, setInputValue] = useState('');
  
  // Theme for creative exploration
  const [theme, setTheme] = useState('');
  const [showThemeModal, setShowThemeModal] = useState(true);
  const [themeInput, setThemeInput] = useState('');
  
  // Track which nodes have been expanded (clicked and generated children)
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
  
  // Physics velocities for each node { nodeId: { vx, vy } }
  const nodeVelocities = useRef({});
  const physicsAnimationRef = useRef(null);
  
  // Multi-selection support
  const [selectedNodeIds, setSelectedNodeIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  
  // Canvas pan & zoom state
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const lastPanPoint = useRef({ x: 0, y: 0 });

  // Drag state
  const dragStartPoint = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);

  const windowSize = useRef({ w: 0, h: 0 });

  // Get selected nodes as array
  const selectedNodes = useMemo(() => {
    return nodes.filter(n => selectedNodeIds.has(n.id));
  }, [nodes, selectedNodeIds]);

  // Calculate node depth
  const getNodeDepth = useCallback((nodeId) => {
    let depth = 0;
    let currentId = nodeId;
    while (currentId && !currentId.startsWith('root')) {
      const node = nodes.find(n => n.id === currentId);
      if (node && node.parent) {
        currentId = node.parent;
        depth++;
      } else {
        break;
      }
    }
    return depth;
  }, [nodes]);

  // Physics simulation - runs continuously for collision and floating
  useEffect(() => {
    const COLLISION_DISTANCE = 180; // Minimum distance between nodes
    const REPULSION_STRENGTH = 2.5; // How strongly nodes push each other
    const DAMPING = 0.92; // Velocity decay (friction)
    const MIN_VELOCITY = 0.1; // Stop moving below this speed
    
    const runPhysics = () => {
      if (nodes.length < 2) {
        physicsAnimationRef.current = requestAnimationFrame(runPhysics);
        return;
      }
      
      // Initialize velocities for new nodes
      nodes.forEach(node => {
        if (!nodeVelocities.current[node.id]) {
          nodeVelocities.current[node.id] = { vx: 0, vy: 0 };
        }
      });
      
      // Clean up velocities for removed nodes
      Object.keys(nodeVelocities.current).forEach(id => {
        if (!nodes.find(n => n.id === id)) {
          delete nodeVelocities.current[id];
        }
      });
      
      let hasMovement = false;
      const newPositions = {};
      
      // Calculate repulsion forces between all pairs of nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i];
          const nodeB = nodes[j];
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < COLLISION_DISTANCE && dist > 0) {
            // Nodes are too close - apply repulsion
            const overlap = COLLISION_DISTANCE - dist;
            const force = (overlap / COLLISION_DISTANCE) * REPULSION_STRENGTH;
            
            // Normalize direction
            const nx = dx / dist;
            const ny = dy / dist;
            
            // Apply force to velocities (opposite directions)
            nodeVelocities.current[nodeA.id].vx -= nx * force;
            nodeVelocities.current[nodeA.id].vy -= ny * force;
            nodeVelocities.current[nodeB.id].vx += nx * force;
            nodeVelocities.current[nodeB.id].vy += ny * force;
            
            hasMovement = true;
          }
        }
      }
      
      // Apply velocities and damping
      nodes.forEach(node => {
        const vel = nodeVelocities.current[node.id];
        if (!vel) return;
        
        // Apply damping
        vel.vx *= DAMPING;
        vel.vy *= DAMPING;
        
        // Stop if velocity is too small
        if (Math.abs(vel.vx) < MIN_VELOCITY) vel.vx = 0;
        if (Math.abs(vel.vy) < MIN_VELOCITY) vel.vy = 0;
        
        if (vel.vx !== 0 || vel.vy !== 0) {
          newPositions[node.id] = {
            x: node.x + vel.vx,
            y: node.y + vel.vy
          };
          hasMovement = true;
        }
      });
      
      // Update positions if there's movement
      if (hasMovement && Object.keys(newPositions).length > 0) {
        setNodes(prev => prev.map(node => {
          if (newPositions[node.id]) {
            return { ...node, ...newPositions[node.id] };
          }
          return node;
        }));
      }
      
      physicsAnimationRef.current = requestAnimationFrame(runPhysics);
    };
    
    physicsAnimationRef.current = requestAnimationFrame(runPhysics);
    
    return () => {
      if (physicsAnimationRef.current) {
        cancelAnimationFrame(physicsAnimationRef.current);
      }
    };
  }, [nodes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      windowSize.current = { w: window.innerWidth, h: window.innerHeight };
    }

    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    const envKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const savedKey = localStorage.getItem('gemini_api_key');
    
    if (envKey) {
      setApiKey(envKey);
      initGemini(envKey);
      setShowApiKeyModal(false);
    } else if (savedKey) {
      setApiKey(savedKey);
      initGemini(savedKey);
    } else {
      setShowApiKeyModal(true);
    }
    
    const handleResize = () => windowSize.current = { w: window.innerWidth, h: window.innerHeight };
    window.addEventListener('resize', handleResize);
    return () => {
      unsub();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // --- Actions ---

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => signOut(auth);

  const saveApiKey = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    initGemini(apiKey);
    setShowApiKeyModal(false);
  };

  const addCenterNode = async (text) => {
    const centerX = windowSize.current.w / 2;
    const centerY = windowSize.current.h / 2;
    
    // Get first selected node if any
    const firstSelectedId = selectedNodeIds.size > 0 ? [...selectedNodeIds][0] : null;
    
    if (firstSelectedId) {
      const parent = nodes.find(n => n.id === firstSelectedId);
      const newId = Date.now().toString();
      
      const angle = Math.random() * Math.PI * 2;
      const dist = 180;
      const nx = parent.x + Math.cos(angle) * dist;
      const ny = parent.y + Math.sin(angle) * dist;

      const newNode = {
        id: newId,
        x: nx,
        y: ny,
        data: { word: text, en: '輸入' },
        parent: firstSelectedId
      };

      setNodes(prev => [...prev, newNode]);
      setEdges(prev => [...prev, { source: firstSelectedId, target: newId }]);
      setSelectedNodeIds(new Set([newId]));
    } else {
      // New Independent Center - add to existing, don't replace
      const existingRoots = nodes.filter(n => n.id.startsWith('root'));
      const offsetX = existingRoots.length * 350;
      
      const newNodeId = 'root-' + Date.now();
      const newNode = {
        id: newNodeId,
        x: centerX + offsetX,
        y: centerY,
        data: { word: text, en: '核心' },
        isCenter: true
      };
      
      setNodes(prev => [...prev, newNode]);
      setSelectedNodeIds(new Set([newNodeId]));
      
      // Auto-expand the new center node with AI
      setHistory(prev => [{ word: text, date: new Date() }, ...prev]);
      
      // Call expandNode after state update using the new node directly
      setTimeout(() => {
        expandNodeDirect(newNode);
      }, 100);
      return; // Exit early since we already added to history
    }

    setHistory(prev => [{ word: text, date: new Date() }, ...prev]);
  };

  // Check if a position overlaps with any existing node
  // Returns true if there's a collision
  const checkCollision = (x, y, existingNodes, minDistance = 160) => {
    for (const node of existingNodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        return true; // Collision detected
      }
    }
    return false;
  };

  // Find a valid position for a new node that doesn't overlap with existing nodes
  const findNonOverlappingPosition = (centerX, centerY, baseRadius, angle, existingNodes, minDistance = 160) => {
    let radius = baseRadius;
    let x = centerX + Math.cos(angle) * radius;
    let y = centerY + Math.sin(angle) * radius;
    
    // Try increasing radius until no collision, max 10 attempts
    let attempts = 0;
    while (checkCollision(x, y, existingNodes, minDistance) && attempts < 10) {
      radius += 120; // Increase radius by 120px each attempt
      x = centerX + Math.cos(angle) * radius;
      y = centerY + Math.sin(angle) * radius;
      attempts++;
    }
    
    // If still colliding, try adjusting angle slightly
    if (checkCollision(x, y, existingNodes, minDistance)) {
      for (let angleOffset = 0.1; angleOffset <= Math.PI; angleOffset += 0.1) {
        // Try positive offset
        x = centerX + Math.cos(angle + angleOffset) * radius;
        y = centerY + Math.sin(angle + angleOffset) * radius;
        if (!checkCollision(x, y, existingNodes, minDistance)) break;
        
        // Try negative offset
        x = centerX + Math.cos(angle - angleOffset) * radius;
        y = centerY + Math.sin(angle - angleOffset) * radius;
        if (!checkCollision(x, y, existingNodes, minDistance)) break;
      }
    }
    
    return { x, y };
  };

  // Direct expand function that takes the node object directly (for auto-expand on creation)
  const expandNodeDirect = async (node) => {
    if (!node) return;

    setIsLoading(true);
    try {
      const results = await generateRelatedWords(node.data.word);
      
      if (!results || results.length === 0) {
        alert("抱歉，找不到相關詞彙或 API 錯誤。");
        setIsLoading(false);
        return;
      }

      const count = results.length;
      const radius = 225; // First layer radius
      const angleStep = (2 * Math.PI) / count;
      const baseAngle = Math.random() * Math.PI * 2;

      // Get all current nodes for collision detection
      const currentNodes = nodes;
      const newNodesPositions = [];

      const newNodes = results.map((item, index) => {
        const angle = baseAngle + index * angleStep;
        // Find non-overlapping position
        const { x, y } = findNonOverlappingPosition(
          node.x, node.y, radius, angle, 
          [...currentNodes, ...newNodesPositions]
        );
        const newNode = {
          id: `${node.id}-${index}-${Date.now()}`,
          x,
          y,
          data: item,
          parent: node.id
        };
        newNodesPositions.push(newNode);
        return newNode;
      });

      const newEdges = newNodes.map(n => ({ source: node.id, target: n.id }));

      setNodes(prev => [...prev, ...newNodes]);
      setEdges(prev => [...prev, ...newEdges]);

    } catch (err) {
      console.error(err);
      alert(`AI 生成失敗: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const expandNode = async (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setIsLoading(true);
    try {
      const results = await generateRelatedWords(node.data.word);
      
      if (!results || results.length === 0) {
        alert("Sorry, no related words found or API error.");
        return;
      }

      const count = results.length;
      const depth = getNodeDepth(nodeId);
      
      // Get existing children to avoid overlap
      const existingChildren = edges.filter(e => e.source === nodeId);
      const existingChildNodes = existingChildren.map(e => nodes.find(n => n.id === e.target)).filter(Boolean);
      
      // Calculate how many "layers" of children already exist from this node
      // by finding the max distance of existing children
      let expansionCount = 0;
      if (existingChildNodes.length > 0) {
        const distances = existingChildNodes.map(child => 
          Math.sqrt(Math.pow(child.x - node.x, 2) + Math.pow(child.y - node.y, 2))
        );
        const maxDist = Math.max(...distances);
        // Estimate how many expansions based on distance
        if (maxDist > 200) expansionCount = Math.ceil((maxDist - 150) / 80);
      }
      
      const usedAngles = existingChildren.map(e => {
        const child = nodes.find(n => n.id === e.target);
        if (child) return Math.atan2(child.y - node.y, child.x - node.x);
        return 0;
      });
      
      // RADIUS CALCULATION - Each expansion from the same node increases radius
      // Base radius depends on depth, then add extra for each expansion
      // First layer radius = 225px
      // When clicking first layer elements (depth 1), radius = 225 * 3 * 1.4 = 945px (1.4x more)
      let baseRadius;
      if (depth === 0) {
        baseRadius = 225; // First layer base (from center)
      } else if (depth === 1) {
        baseRadius = 225 * 3 * 1.4; // Second layer = 3x * 1.4 = 945px (1.4x more distance)
      } else {
        baseRadius = 225 * 3 * 1.4 + ((depth - 1) * 140); // Deeper layers continue expanding
      }
      
      // Add 100px for each previous expansion from this node
      const radius = baseRadius + (expansionCount * 100);
      
      const angleStep = (2 * Math.PI) / count;
      
      // Find best starting angle
      let baseAngle = Math.random() * Math.PI * 2;
      if (usedAngles.length > 0) {
        const sortedAngles = [...usedAngles].sort((a, b) => a - b);
        let maxGap = 0;
        let gapStart = 0;
        for (let i = 0; i < sortedAngles.length; i++) {
          const next = (i + 1) % sortedAngles.length;
          let gap = sortedAngles[next] - sortedAngles[i];
          if (next === 0) gap += 2 * Math.PI;
          if (gap > maxGap) {
            maxGap = gap;
            gapStart = sortedAngles[i];
          }
        }
        baseAngle = gapStart + maxGap / 2;
      }

      const newNodes = results.map((item, index) => {
        const angle = baseAngle + index * angleStep;
        return {
          id: `${nodeId}-${index}-${Date.now()}`,
          x: node.x + Math.cos(angle) * radius,
          y: node.y + Math.sin(angle) * radius,
          data: item,
          parent: nodeId
        };
      });

      // Apply collision detection - adjust positions to avoid overlaps
      const currentNodes = nodes;
      const adjustedNodes = [];
      
      for (const newNode of newNodes) {
        const angle = Math.atan2(newNode.y - node.y, newNode.x - node.x);
        const currentRadius = Math.sqrt(
          Math.pow(newNode.x - node.x, 2) + Math.pow(newNode.y - node.y, 2)
        );
        const { x, y } = findNonOverlappingPosition(
          node.x, node.y, currentRadius, angle,
          [...currentNodes, ...adjustedNodes]
        );
        adjustedNodes.push({ ...newNode, x, y });
      }

      const newEdges = adjustedNodes.map(n => ({ source: nodeId, target: n.id }));

      setNodes(prev => [...prev, ...adjustedNodes]);
      setEdges(prev => [...prev, ...newEdges]);

    } catch (err) {
      console.error(err);
      alert(`AI 生成失敗: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Move node to 2x * 1.4 = 2.8x distance from its parent (center) and return new position
  // Uses smooth animation instead of instant jump
  // Also ensures the new position doesn't overlap with existing nodes
  const moveNodeAway = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !node.parent) return null;
    
    const parent = nodes.find(n => n.id === node.parent);
    if (!parent) return null;
    
    // Calculate current distance and angle from parent
    const dx = node.x - parent.x;
    const dy = node.y - parent.y;
    const currentDist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    
    // New distance is 2x * 1.4 = 2.8x current (1.4x more than before)
    const newDist = currentDist * 2 * 1.4;
    
    // Find non-overlapping position (exclude the node being moved)
    const otherNodes = nodes.filter(n => n.id !== nodeId);
    const { x: targetX, y: targetY } = findNonOverlappingPosition(
      parent.x, parent.y, newDist, angle, otherNodes
    );
    
    // Move node instantly to target position so children spawn correctly around it
    setNodes(prev => prev.map(n => 
      n.id === nodeId ? { ...n, x: targetX, y: targetY } : n
    ));
    
    // Return the target position for immediate use (children will spawn at target)
    return { x: targetX, y: targetY };
  };

  // Expand node with a specific position (for moved nodes)
  const expandNodeAtPosition = async (nodeId, position) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Use provided position or node's current position
    const nodeX = position ? position.x : node.x;
    const nodeY = position ? position.y : node.y;

    setIsLoading(true);
    try {
      const results = await generateRelatedWords(node.data.word);
      
      if (!results || results.length === 0) {
        alert("抱歉，找不到相關詞彙或 API 錯誤。");
        return;
      }

      const count = results.length;
      const depth = getNodeDepth(nodeId);
      
      // RADIUS CALCULATION for children (1.4x larger for second layer and beyond)
      let baseRadius;
      if (depth === 0) {
        baseRadius = 225;
      } else if (depth === 1) {
        baseRadius = 225 * 3 * 1.4; // 1.4x more distance
      } else {
        baseRadius = 225 * 3 * 1.4 + ((depth - 1) * 140);
      }
      
      const radius = baseRadius;
      const angleStep = (2 * Math.PI) / count;
      const baseAngle = Math.random() * Math.PI * 2;

      const newNodes = results.map((item, index) => {
        const angle = baseAngle + index * angleStep;
        return {
          id: `${nodeId}-${index}-${Date.now()}`,
          x: nodeX + Math.cos(angle) * radius,
          y: nodeY + Math.sin(angle) * radius,
          data: item,
          parent: nodeId
        };
      });

      // Apply collision detection - adjust positions to avoid overlaps
      const currentNodes = nodes;
      const adjustedNodes = [];
      
      for (const newNode of newNodes) {
        const angle = Math.atan2(newNode.y - nodeY, newNode.x - nodeX);
        const currentRadius = Math.sqrt(
          Math.pow(newNode.x - nodeX, 2) + Math.pow(newNode.y - nodeY, 2)
        );
        const { x, y } = findNonOverlappingPosition(
          nodeX, nodeY, currentRadius, angle,
          [...currentNodes, ...adjustedNodes]
        );
        adjustedNodes.push({ ...newNode, x, y });
      }

      const newEdges = adjustedNodes.map(n => ({ source: nodeId, target: n.id }));

      setNodes(prev => [...prev, ...adjustedNodes]);
      setEdges(prev => [...prev, ...newEdges]);

    } catch (err) {
      console.error(err);
      alert(`AI 生成失敗: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    if (hasDragged.current) return;
    
    const node = nodes.find(n => n.id === nodeId);
    const isRootNode = node?.isCenter === true;
    const isAlreadyExpanded = expandedNodeIds.has(nodeId);
    
    if (isAlreadyExpanded) {
      // Already expanded node (center): can still be clicked for more inspiration
      // Expand at current position without moving
      expandNode(nodeId);
    } else if (!isRootNode && node?.parent) {
      // Non-center node (white ball): move away to 2x distance, then expand at new position
      const newPosition = moveNodeAway(nodeId);
      expandNodeAtPosition(nodeId, newPosition);
      // Mark as expanded
      setExpandedNodeIds(prev => new Set([...prev, nodeId]));
    } else {
      // Root center node: expand normally
      expandNode(nodeId);
      // Mark as expanded
      setExpandedNodeIds(prev => new Set([...prev, nodeId]));
    }
  };

  // Handle dragging a node - move it and all its children
  const handleNodeDrag = useCallback((nodeId, newX, newY) => {
    setNodes(prev => {
      const node = prev.find(n => n.id === nodeId);
      if (!node) return prev;
      
      // Calculate the movement delta
      const dx = newX - node.x;
      const dy = newY - node.y;
      
      // Get all descendant node IDs
      const getDescendants = (parentId) => {
        const children = prev.filter(n => n.parent === parentId);
        let descendants = children.map(c => c.id);
        children.forEach(child => {
          descendants = [...descendants, ...getDescendants(child.id)];
        });
        return descendants;
      };
      
      const descendantIds = getDescendants(nodeId);
      
      // Update the dragged node and all its descendants
      return prev.map(n => {
        if (n.id === nodeId) {
          return { ...n, x: newX, y: newY };
        }
        if (descendantIds.includes(n.id)) {
          return { ...n, x: n.x + dx, y: n.y + dy };
        }
        return n;
      });
    });
  }, []);

  const handleNodeContextMenu = (e, nodeId) => {
    e.preventDefault();
    e.stopPropagation();
    // Multi-select toggle
    setSelectedNodeIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  const removeFromSelection = (nodeId) => {
    setSelectedNodeIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(nodeId);
      return newSet;
    });
  };

  const generateCreativeIdea = async () => {
    if (selectedNodes.length < 2) return;
    
    const words = selectedNodes.map(n => n.data.word);
    setIsLoading(true);
    
    try {
      const ideas = await generateCreativeCombination(words);
      
      if (!ideas || ideas.length === 0) {
        alert('抱歉，無法生成創意方案。請稍後再試。');
        return;
      }
      
      // Show creative ideas in a modal-like alert with formatted content
      const ideaText = ideas.map((idea, idx) => 
        `${idx + 1}. 【${idea.name}】\n   ${idea.desc}`
      ).join('\n\n');
      
      alert(`✨ 創意方案 - ${words.join(' × ')}\n\n${ideaText}`);
      
      // Clear selection after generation
      setSelectedNodeIds(new Set());
      
    } catch (err) {
      console.error(err);
      alert(`創意生成失敗: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCanvasClick = (e) => {
    if (!hasDragged.current) {
      setSelectedNodeIds(new Set()); 
    }
  };

  // Canvas pan handlers
  const handleCanvasMouseDown = (e) => {
    if (e.button === 0) {
      setIsPanning(true);
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
      dragStartPoint.current = { x: e.clientX, y: e.clientY };
      hasDragged.current = false;
    }
  };

  const handleCanvasMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.clientX - lastPanPoint.current.x;
      const dy = e.clientY - lastPanPoint.current.y;
      
      const totalDx = Math.abs(e.clientX - dragStartPoint.current.x);
      const totalDy = Math.abs(e.clientY - dragStartPoint.current.y);
      if (totalDx > 5 || totalDy > 5) {
        hasDragged.current = true;
      }
      
      setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.clientX, y: e.clientY };
    }
  }, [isPanning]);

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragStartPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      hasDragged.current = false;
    }
  };

  const handleTouchMove = useCallback((e) => {
    if (isPanning && e.touches.length === 1) {
      const dx = e.touches[0].clientX - lastPanPoint.current.x;
      const dy = e.touches[0].clientY - lastPanPoint.current.y;
      
      const totalDx = Math.abs(e.touches[0].clientX - dragStartPoint.current.x);
      const totalDy = Math.abs(e.touches[0].clientY - dragStartPoint.current.y);
      if (totalDx > 5 || totalDy > 5) {
        hasDragged.current = true;
      }
      
      setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      lastPanPoint.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, [isPanning]);

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  const handleWheel = useCallback((e) => {
    // Zoom with mouse wheel (no modifier key needed)
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom(prev => Math.min(Math.max(prev + delta, 0.3), 2));
  }, []);

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.3));
  const resetView = () => {
    setZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  const handleInputSubmit = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addCenterNode(inputValue);
      setInputValue('');
    }
  };

  // Get the first selected node for input hint
  const firstSelectedNode = selectedNodes[0];

  return (
    <div 
      className={clsx(
        "relative w-screen h-screen bg-gradient-to-br from-gray-50 to-white overflow-hidden text-black font-sans selection:bg-[#FFD700] selection:text-black",
        isPanning ? "cursor-grabbing" : "cursor-default"
      )}
      onClick={handleCanvasClick}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      
      {/* Background Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', 
          backgroundSize: '30px 30px',
          backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
        }}>
      </div>

      {/* Status Indicator - Top Center */}
      <StatusIndicator isActive={isLoading} nodeCount={nodes.length} theme={theme} />

      {/* Creative Combination Panel - Left Side */}
      <AnimatePresence>
        <CreativeCombinationPanel 
          selectedNodes={selectedNodes}
          onRemove={removeFromSelection}
          onGenerate={generateCreativeIdea}
          isGenerating={isLoading}
        />
      </AnimatePresence>

      {/* Top Right Controls */}
      <div className="fixed top-4 right-4 flex gap-2 z-50 pointer-events-auto">
        <GlassPanel 
          className="p-2 cursor-pointer hover:bg-black/5" 
          onClick={() => setHistoryOpen(!historyOpen)}
        >
          <Clock className="w-5 h-5" />
        </GlassPanel>
        {user ? (
          <GlassPanel className="p-2 flex items-center gap-2 text-sm px-4">
            <img src={user.photoURL} className="w-6 h-6 rounded-full" alt="User" />
            <button onClick={handleLogout} className="text-red-500 hover:underline">Log Out</button>
          </GlassPanel>
        ) : (
          <GlassPanel className="p-2">
            <button onClick={handleLogin} className="flex items-center text-sm font-bold px-3 py-1 hover:text-[#000]/70">
              <LogIn className="w-4 h-4 mr-2"/> Login
            </button>
          </GlassPanel>
        )}
        <GlassPanel className="p-2 cursor-pointer hover:bg-black/5" onClick={() => setShowApiKeyModal(true)}>
          <Settings className="w-5 h-5" />
        </GlassPanel>
      </div>

      <HistorySidebar 
        history={history} 
        onRestore={(h) => addCenterNode(h.word)}
        isOpen={historyOpen}
        onToggle={() => setHistoryOpen(!historyOpen)}
      />

      {/* Main Canvas */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanning ? 'none' : 'transform 0.1s ease-out'
        }}
      >
         {/* Edges */}
         {edges.map((edge, i) => {
           const start = nodes.find(n => n.id === edge.source);
           const end = nodes.find(n => n.id === edge.target);
           if (!start || !end) return null;
           return <Connection key={i} start={start} end={end} />;
         })}

         {/* Nodes */}
         <AnimatePresence>
           {nodes.map(node => {
             const isExpanded = expandedNodeIds.has(node.id);
             const isRootOrExpanded = node.isCenter || isExpanded;
             return (
               <Node 
                 key={node.id} 
                 {...node}
                 depth={getNodeDepth(node.id)}
                 isSelected={selectedNodeIds.has(node.id)}
                 isExpanded={isExpanded}
                 isDraggable={isRootOrExpanded}
                 onClick={(e) => handleNodeClick(e, node.id)}
                 onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
                 onDrag={handleNodeDrag}
               />
             );
           })}
         </AnimatePresence>
      </div>

      {/* Zoom Controls - Bottom Left */}
      <div className="fixed bottom-28 left-4 z-50 flex flex-col gap-2">
        <GlassPanel className="p-1">
          <button onClick={zoomIn} className="p-2 hover:bg-black/5 rounded-lg" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
        </GlassPanel>
        <GlassPanel className="p-1">
          <button onClick={zoomOut} className="p-2 hover:bg-black/5 rounded-lg" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
        </GlassPanel>
        <GlassPanel className="p-1">
          <button onClick={resetView} className="p-2 hover:bg-black/5 rounded-lg" title="Reset View">
            <Move className="w-4 h-4" />
          </button>
        </GlassPanel>
        <div className="text-center text-xs text-gray-400 mt-1">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Loading Indicator */}
      <AnimatePresence>
        {isLoading && (
          <div className="fixed inset-0 z-40 bg-white/30 backdrop-blur-sm flex items-center justify-center pointer-events-none">
             <motion.div 
               animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }} 
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
               className="absolute w-40 h-40 rounded-full border-2 border-[#FFD700]"
             />
             <motion.div 
               animate={{ rotate: 360 }} 
               transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
               className="absolute w-36 h-36 rounded-full border-2 border-dashed border-black/20"
             />
             <motion.div 
               animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }} 
               transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
               className="w-28 h-28 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center shadow-lg"
             >
               <span className="font-medium tracking-wide text-black text-xs">思考關聯中...</span>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Input UI */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <motion.div 
          layout
          initial={{ y: nodes.length === 0 ? -150 : 0 }}
          animate={{ y: nodes.length === 0 ? -150 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="pointer-events-auto"
        >
          <GlassPanel className="flex items-center p-2 rounded-full w-[400px] max-w-[90vw] shadow-2xl border-white/80 h-12">
             <span className="text-gray-400 pl-4 pr-2">
               <Plus className="w-4 h-4" />
             </span>
             <input 
               type="text" 
               value={inputValue}
               onChange={(e) => setInputValue(e.target.value)}
               onKeyDown={handleInputSubmit}
               placeholder={
                 firstSelectedNode 
                   ? `連接到「${firstSelectedNode.data.word}」...` 
                   : nodes.length === 0 
                     ? "輸入關鍵字開始發想..." 
                     : "輸入新詞開始..."
               }
               className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-gray-400"
             />
             <div className="flex gap-1 pr-1">
               <button 
                  onClick={() => handleInputSubmit({ key: 'Enter' })}
                  className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white hover:bg-[#FFD700] hover:text-black transition-colors"
               >
                  <Sparkles className="w-4 h-4" />
               </button>
             </div>
          </GlassPanel>
          {nodes.length === 0 && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 text-xs mt-3"
            >
              按 Enter 開始 · 右鍵選擇節點
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur flex items-center justify-center">
           <GlassPanel className="w-96 p-8 bg-white text-center">
             <h2 className="text-2xl font-bold mb-4">設定智能系統</h2>
             <p className="text-gray-500 mb-6 text-sm">需要有效的 Gemini API 金鑰來啟用神經擴展功能。</p>
             <input 
               type="password" 
               placeholder="貼上 Gemini API 金鑰"
               className="w-full border p-3 rounded mb-4 bg-gray-50"
               value={apiKey}
               onChange={(e) => setApiKey(e.target.value)}
             />
             <button onClick={saveApiKey} className="w-full bg-black text-white py-3 rounded hover:bg-[#FFD700] hover:text-black font-bold">
               初始化系統
             </button>
             <div className="mt-4 text-xs text-gray-400">
               <a href="https://makersuite.google.com/app/apikey" target="_blank" className="underline">取得 API 金鑰</a>
             </div>
           </GlassPanel>
        </div>
      )}

      {/* Theme Selection Modal - Only show after login */}
      {showThemeModal && !showApiKeyModal && user && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <GlassPanel className="w-[450px] p-8 bg-white/90 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8 text-black" />
              </div>
              <h2 className="text-2xl font-bold mb-2">開始創意發想</h2>
              <p className="text-gray-500 mb-6 text-sm">
                請輸入這次想要探索的主題<br/>
                AI 將依照此主題方向生成創意關聯
              </p>
              <input 
                type="text" 
                placeholder="例如：永續設計、未來教育、健康生活..."
                className="w-full border border-gray-200 p-4 rounded-xl mb-4 bg-gray-50 text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && themeInput.trim()) {
                    setTheme(themeInput.trim());
                    setCurrentTheme(themeInput.trim());
                    setShowThemeModal(false);
                  }
                }}
                autoFocus
              />
              <button 
                onClick={() => {
                  if (themeInput.trim()) {
                    setTheme(themeInput.trim());
                    setCurrentTheme(themeInput.trim());
                    setShowThemeModal(false);
                  }
                }}
                disabled={!themeInput.trim()}
                className={clsx(
                  "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  themeInput.trim()
                    ? "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:shadow-lg"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                )}
              >
                <Sparkles className="w-5 h-5" />
                開始探索
              </button>
              <button 
                onClick={() => {
                  setShowThemeModal(false);
                }}
                className="mt-3 text-gray-400 text-sm hover:text-gray-600"
              >
                跳過，自由發想
              </button>
            </GlassPanel>
          </motion.div>
        </div>
      )}

      {/* Login Required Modal - Show when not logged in */}
      {!user && !showApiKeyModal && (
        <div className="fixed inset-0 z-[100] bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <div className="w-[450px] p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/30">
                <Sparkles className="w-10 h-10 text-black" />
              </div>
              <h1 className="text-4xl font-bold mb-3 text-white">創意發散工具</h1>
              <p className="text-gray-400 mb-8 text-base">
                AI 驅動的心智圖發想工具<br/>
                探索無限創意可能
              </p>
              
              <button 
                onClick={handleLogin}
                className="w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-3 bg-white text-black hover:bg-[#FFD700] hover:shadow-lg hover:shadow-amber-500/20"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 帳號登入
              </button>
              
              <p className="mt-6 text-gray-500 text-xs">
                登入即表示您同意我們的服務條款
              </p>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
