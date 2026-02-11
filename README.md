# FAW Creative Studio

**Interactive Brand Experience with Three.js + Gemini AI -- Where Storytelling Meets Technology**

## About

FAW Creative Studio 是一個以互動 3D 與 AI 敘事為核心的品牌體驗平台，將作品集、產品展示與故事化導覽融合在同一個場域。適合用於品牌展示、互動式行銷企劃與創意技術 Demo，呈現「內容即體驗」的網站形態。

## About (EN)

FAW Creative Studio is an interactive brand experience platform that blends 3D web visuals with AI-powered storytelling. It is built for immersive brand showcases, creative demos, and narrative-driven product presentations.

## 📋 Quick Summary

> 🎨 **FAW Creative Studio** 是 Universal FAW Labs 打造的互動式品牌體驗平台，不只是作品集網站，更是一個活生生的產品展示。🌌 首頁採用 Three.js 建構即時 3D 場景，包含 Cannon.js 物理驅動的品牌字母動畫、GPU 粒子文字特效、以及支援手機陀螺儀的星空背景。🎮 內建完整的太空侵略者風格遊戲引擎，擁有三個版本的演進——從 8-bit 像素風到具備故事敘事的霓虹進化關卡。🤖 整合 Google Gemini AI 提供部落格內容生成與 AI 腦力激盪工作區。💡 模組化報價計算器讓客戶自行組合專案範圍。🛠️ 技術棧涵蓋 Next.js 16、React 19、React Three Fiber、Framer Motion、GSAP、Firebase 後端，並搭配 Copilot SDK 多代理人協作開發流程。🚀 適合創意科技工作室展示技術實力，證明「我們賣的東西，我們自己也能做出來」。

---

## 💡 Why This Exists

Traditional agency portfolios are static. They present past work in grids and slideshows, but they never demonstrate what the agency can actually build. The medium contradicts the message.

FAW Creative Studio is Universal FAW Labs' own brand experience platform -- and it practices what it preaches. The landing page itself is a real-time 3D scene powered by Three.js with physics-driven letter animations, particle text effects, and gyroscope-responsive visuals. An embedded Space Invaders-style game with narrative progression shows off interactive development capabilities. A blog system with Gemini AI integration handles content. A modular pricing calculator lets clients build their own project scope.

This is not a portfolio website. It is a living product demo that proves the studio can ship the kind of work it sells.

---

## 🏗️ Architecture

```
+------------------------------------------------------------------+
|                    FAW Creative Studio                            |
|                    Next.js 16 + React 19                         |
|                                                                  |
|  +------------------+  +-----------------+  +------------------+ |
|  |   3D Hero Scene  |  |  Game Engine    |  |   Blog System    | |
|  |   Three.js +     |  |  Space Invaders |  |   Gemini AI +    | |
|  |   React Three    |  |  w/ Narrative   |  |   Firebase       | |
|  |   Fiber + Drei   |  |  Progression    |  |   Markdown CMS   | |
|  +------------------+  +-----------------+  +------------------+ |
|                                                                  |
|  +------------------+  +-----------------+  +------------------+ |
|  |   Brand Exp.     |  |  Pixel Editor   |  |  Alien Studio    | |
|  |   Module Pricing  |  |  Custom Sprite  |  |  3D Character    | |
|  |   Calculator     |  |  Design Tool    |  |  Showcase         | |
|  +------------------+  +-----------------+  +------------------+ |
|                                                                  |
|  +-------------------------------------------------------------+|
|  |   AI Integration Layer                                       ||
|  |   Copilot SDK Orchestrator + Multi-Worker Pipeline           ||
|  |   Gemini AI (Content Generation + Brainstorming)             ||
|  +-------------------------------------------------------------+|
+------------------------------------------------------------------+
```

### Key Sections

| Route | Feature | Description |
|-------|---------|-------------|
| `/` | 3D Hero + Brand Experience | Physics-driven FAW letters (cannon.js), particle text, star field, gyroscope support, module pricing calculator |
| `/game-v1` | Game Engine v1 | 8-bit Space Invaders with pixel-art aliens, CRT scanline effects |
| `/game-v2` | Game Engine v2 | Extended version with weapons, power-ups, badge system |
| `/game-v3` | Game Engine v3 | Full narrative progression: monochrome to color to neon, story-driven level design with victory parallax |
| `/blog` | Blog Platform | Category-based articles with cyberpunk aesthetics |
| `/brainstorm` | AI Brainstorm | Gemini-powered idea generation workspace |
| `/alien-studio` | Alien Studio | 3D alien character showcase and design exploration |
| `/pixel-editor` | Pixel Editor | Custom sprite design tool for game assets |

### 3D Visual Stack

The hero section layers three visual systems:

1. **FAWPhysicsLetters** -- Cannon.js physics simulation for the "FAW" brand letters with gravity, collision, and interactive response
2. **ParticleText** -- GPU-driven particle system that renders text through thousands of individual points
3. **Stars** -- Three.js Drei star field as the ambient background layer

All three respond to device gyroscope data on mobile (with iOS permission handling) and mouse position on desktop.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1 (App Router) |
| Runtime | React 19 |
| 3D Engine | Three.js 0.182, React Three Fiber 9, React Three Drei 10, React Three Cannon 6 |
| Animation | Framer Motion, GSAP, Locomotive Scroll |
| AI | Google Gemini AI (`@google/generative-ai`) |
| Backend | Firebase (Auth, Firestore, Storage) |
| Dev Orchestration | Copilot SDK multi-worker pipeline (orchestrator, test-runner, full-workflow) |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| Deployment | Vercel |

### AI Integration Docs

The project includes extensive documentation for AI-assisted development workflows:

- `COPILOT-SDK.md` (26KB) -- Complete guide to multi-agent parallel development with GitHub Copilot SDK
- `MCP-SETUP.md` -- Model Context Protocol configuration for editor integration
- `agents.md` -- Agent role definitions and workflow specifications

---

## 🏁 Quick Start

```bash
# Clone and install
git clone <repo-url>
cd faw-creative-studio
npm install

# Configure environment
cp .env.local.example .env.local
# Fill in: Google Gemini API key, Firebase config

# Run development server
npm run dev
```

### Available Commands

```bash
npm run dev        # Start development server
npm run dev:https  # HTTPS dev server (required for iOS gyroscope)
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
```

---

## 👤 Author

**Huang Akai (Kai)** -- Founder @ Universal FAW Labs | Creative Technologist | Ex-Ogilvy | 15+ years in digital creative and marketing technology.
