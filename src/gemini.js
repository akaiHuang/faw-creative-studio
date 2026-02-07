import { GoogleGenerativeAI } from "@google/generative-ai";

// 初始化 Gemini (需要用戶提供 API Key，暫時使用佔位符)
let genAI = null;
let model = null;

// Helper to get key from env safely
const getEnvKey = () => {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }
  return null;
}

export const initGemini = (apiKey) => {
  const key = apiKey || getEnvKey();
  if (!key) {
    console.warn("initGemini called without key and no env key found");
    return;
  }
  genAI = new GoogleGenerativeAI(key);
  // Using gemini-2.0-flash (verified available via ListModels)
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
};

// Auto-init if env key exists immediately (runs on module load)
const envKey = getEnvKey();
if (envKey) {
  initGemini(envKey);
}

// Current theme for creative exploration
let currentTheme = '';

export const setCurrentTheme = (theme) => {
  currentTheme = theme;
};

export const getCurrentTheme = () => currentTheme;

export const generateRelatedWords = async (seedWord) => {
  // Try to re-init if model is missing (e.g. after HMR)
  if (!model) {
    const k = getEnvKey();
    if (k) initGemini(k);
  }

  if (!model) {
    throw new Error("Gemini API Key not set. Please check settings or .env file.");
  }

  const themeContext = currentTheme 
    ? `\n    主題背景：這次的創意發想主題是「${currentTheme}」，請在這個主題脈絡下思考關聯詞彙。`
    : '';

  const prompt = `
    請針對詞語「${seedWord}」發散聯想出 7 到 8 個相關詞彙。${themeContext}
    
    規則：
    1. 詞彙應該具有創意和啟發性${currentTheme ? `，並與「${currentTheme}」主題相關` : ''}。
    2. 返回 JSON 格式的數據。
    3. 格式必須為陣列，每個元素包含：
       - "word": 原始詞彙 (如果是中文就顯示中文)
       - "en": 該詞彙的英文翻譯
    
    範例輸出：
    [
      { "word": "未顯現", "en": "Unmanifested" },
      { "word": "潛能", "en": "Potential" }
    ]
    
    只返回 JSON，不要有其他文字。
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // 清理可能的 markdown 標記
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return [];
  }
};

// 生成跨領域創意方案
export const generateCreativeCombination = async (words) => {
  // Try to re-init if model is missing
  if (!model) {
    const k = getEnvKey();
    if (k) initGemini(k);
  }

  if (!model) {
    throw new Error("Gemini API Key not set. Please check settings or .env file.");
  }

  const wordsStr = words.join(' + ');
  
  const prompt = `
    你是一位跨領域創意大師。請將以下概念進行創意融合：「${wordsStr}」
    
    請生成 5 個具有創新性的創意方案，每個方案包含：
    1. 一個簡短有力的創意名稱（3-6個字）
    2. 一句話描述這個創意概念（20字以內）
    
    規則：
    - 創意要具有啟發性和實用性
    - 嘗試將不同領域的概念進行跨界融合
    - 返回 JSON 格式
    
    格式：
    [
      { "name": "創意名稱", "desc": "簡短描述" }
    ]
    
    只返回 JSON，不要有其他文字。
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Creative Generation Error:", error);
    return [];
  }
};
