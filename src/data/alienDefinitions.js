/**
 * 3D Pixel 外星人定義資料
 * 從 GameV3Hero.jsx 的 2D pixel matrix 轉換而來
 * 支援 Three.js 3D 方塊渲染
 */

// --- 基礎外星人 2D Pixel Matrix 定義 ---
export const ALIEN_2D_MATRICES = {
  crab: {
    id: 'crab',
    name: 'COMMANDER',
    defaultColor: '#a855f7', // 紫色
    frame1: [
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,0,0,1,0,0,0,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,0,1,1,1,1,1,1,1,0,1],
      [1,0,1,0,0,0,0,0,1,0,1],
      [0,0,0,1,1,0,1,1,0,0,0]
    ],
    frame2: [
      [0,0,0,1,0,0,0,1,0,0,0],
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,1,1,1,1,1,1,1,1,1,0],
      [0,0,1,0,0,0,0,0,1,0,0],
      [0,1,0,1,1,0,1,1,0,1,0]
    ]
  },
  squid: {
    id: 'squid',
    name: 'INVADER',
    defaultColor: '#22d3ee', // 青色
    frame1: [
      [0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,0,0,1,1,0,0],
      [0,1,1,0,1,0,1,0,1,1,0],
      [1,1,0,0,0,1,0,0,0,1,1]
    ],
    frame2: [
      [0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,1,1,1,1,1,0,0],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,0,0,1,1,0,0],
      [0,0,1,1,0,1,0,1,1,0,0],
      [0,0,0,1,1,0,1,1,0,0,0]
    ]
  },
  octopus: {
    id: 'octopus',
    name: 'DROID',
    defaultColor: '#facc15', // 黃色
    frame1: [
      [0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,0,1,1,0,0,1,1,0,0],
      [0,0,1,1,0,1,1,0,1,1,0]
    ],
    frame2: [
      [0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,1,1,1,1,0,0,0],
      [0,1,1,1,1,1,1,1,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [1,1,1,0,0,1,1,0,0,1,1],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,0,0,0,1,1,0,0],
      [0,1,0,0,0,0,0,0,0,1,0]
    ]
  },
  ufo: {
    id: 'ufo',
    name: 'MOTHERSHIP',
    defaultColor: '#ef4444', // 紅色
    frame1: [
      [0,0,0,0,0,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,1],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,1,1,1,0,0,0,1,0,0],
      [0,0,0,1,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0]
    ],
    frame2: [
      [0,0,0,0,0,1,1,1,1,0,0],
      [0,0,0,1,1,1,1,1,1,1,0],
      [0,0,1,1,1,1,1,1,1,1,1],
      [0,1,1,0,1,1,1,0,1,1,0],
      [1,1,1,1,1,1,1,1,1,1,1],
      [0,0,0,1,1,1,0,0,0,0,0],
      [0,0,0,0,1,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0]
    ]
  },
  green_alien: {
    id: 'green_alien',
    name: 'SCOUT',
    defaultColor: '#22c55e', // 綠色
    frame1: [
      [0,0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,0,1,0,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,0],
      [0,1,0,1,1,1,1,1,0,1,0],
      [0,1,0,1,0,0,0,1,0,1,0],
      [0,0,0,0,1,1,1,0,0,0,0]
    ],
    frame2: [
      [0,0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,0,0,0],
      [0,0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,0,1,0,1,1,0,0],
      [0,1,1,1,1,1,1,1,1,1,0],
      [0,0,0,1,1,1,1,1,0,0,0],
      [0,0,1,1,0,0,0,1,1,0,0],
      [0,1,0,0,0,0,0,0,0,1,0]
    ]
  }
};

// --- 獎盃 2D Pixel Matrix ---
export const TROPHY_2D_MATRIX = [
  [0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,0],
  [0,0,1,1,1,1,1,1,1,1,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,0,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0]
];

// --- 3D 配置預設值 ---
export const DEFAULT_3D_CONFIG = {
  depth: 2,              // 方塊深度（層數）
  pixelSize: 1,          // 每個像素的大小
  gap: 0.05,             // 像素之間的間隙
  rotationSpeed: 0.01,   // 自動旋轉速度
  floatAmplitude: 0.3,   // 浮動振幅
  floatSpeed: 0.02,      // 浮動速度
  wireframe: true,       // 是否顯示線框
  wireframeColor: '#ffffff', // 線框顏色
  wireframeOpacity: 0.3, // 線框透明度
  emissive: true,        // 是否發光
  emissiveIntensity: 0.2, // 發光強度
};

// --- 外星人 3D 配置（可自訂）---
export const ALIEN_3D_CONFIGS = {
  crab: {
    ...DEFAULT_3D_CONFIG,
    depth: 2,
    rotationSpeed: 0.015,
    floatAmplitude: 0.25,
  },
  squid: {
    ...DEFAULT_3D_CONFIG,
    depth: 3,
    rotationSpeed: 0.02,
    floatAmplitude: 0.35,
  },
  octopus: {
    ...DEFAULT_3D_CONFIG,
    depth: 2,
    rotationSpeed: 0.012,
    floatAmplitude: 0.3,
  },
  ufo: {
    ...DEFAULT_3D_CONFIG,
    depth: 1,
    rotationSpeed: 0.025,
    floatAmplitude: 0.4,
  },
  green_alien: {
    ...DEFAULT_3D_CONFIG,
    depth: 2,
    rotationSpeed: 0.018,
    floatAmplitude: 0.28,
  },
  trophy: {
    ...DEFAULT_3D_CONFIG,
    depth: 3,
    rotationSpeed: 0.01,
    floatAmplitude: 0.15,
    wireframeColor: '#fef3c7',
  }
};

// --- 卡牌對應外星人類型 ---
export const CARD_ALIEN_MAPPING = {
  VISUAL: { alienId: 'ufo', color: '#ef4444' },      // 紅色 - UFO
  VIRAL: { alienId: 'green_alien', color: '#22c55e' }, // 綠色 - Scout
  ENGAGEMENT: { alienId: 'squid', color: '#22d3ee' }, // 青色 - Invader
  STRATEGY: { alienId: 'octopus', color: '#facc15' }, // 黃色 - Droid
};

// --- localStorage 鍵名 ---
export const STORAGE_KEY = 'faw_alien_3d_configs';

/**
 * 從 localStorage 讀取自訂配置
 */
export const loadCustomConfigs = () => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.error('Failed to load alien configs:', e);
    return null;
  }
};

/**
 * 儲存自訂配置到 localStorage
 */
export const saveCustomConfigs = (configs) => {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
    return true;
  } catch (e) {
    console.error('Failed to save alien configs:', e);
    return false;
  }
};

/**
 * 匯出配置為 JSON 字串
 */
export const exportConfigsAsJSON = (configs) => {
  return JSON.stringify(configs, null, 2);
};

/**
 * 匯出配置為 JS 模組格式
 */
export const exportConfigsAsJS = (configs) => {
  return `// FAW Alien 3D Configurations
// Generated at: ${new Date().toISOString()}

export const CUSTOM_ALIEN_3D_CONFIGS = ${JSON.stringify(configs, null, 2)};
`;
};

/**
 * 取得外星人完整配置（合併預設與自訂）
 */
export const getAlienConfig = (alienId) => {
  const customConfigs = loadCustomConfigs();
  const baseMatrix = ALIEN_2D_MATRICES[alienId];
  const base3DConfig = ALIEN_3D_CONFIGS[alienId] || DEFAULT_3D_CONFIG;
  const customConfig = customConfigs?.[alienId] || {};
  
  return {
    ...baseMatrix,
    config3D: {
      ...base3DConfig,
      ...customConfig,
    }
  };
};

/**
 * 取得所有外星人列表
 */
export const getAllAliens = () => {
  return Object.keys(ALIEN_2D_MATRICES).map(id => ({
    id,
    ...ALIEN_2D_MATRICES[id],
    config3D: ALIEN_3D_CONFIGS[id] || DEFAULT_3D_CONFIG,
  }));
};
