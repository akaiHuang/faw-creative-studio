# Locomotive Scroll v5 使用筆記（FAW 專案用）

> 目標：整理 Locomotive Scroll（基於 Lenis）所有主要用法與官方示範，方便日後快速下指令整合到 FAW 網站。

## 1) 版本重點（v5）
- 基於 Lenis 1.3.17，體積更小（約 9.4kB gz）。
- TypeScript 友善。
- 以 Intersection Observer 做偵測（分為簡單觸發/連續動畫兩種策略）。
- 行動裝置預設關閉視差（可自行開啟）。
- 支援自訂滾動容器。
- 不再透過大量 transform 造成版面位移。
- Resize 由 Lenis 的 ResizeObserver 同步處理。

## 2) 安裝與引入
### NPM（建議）
- 安裝：`npm install locomotive-scroll`
- JS 引入：`import LocomotiveScroll from 'locomotive-scroll'`
- CSS 引入：`@import 'locomotive-scroll/dist/locomotive-scroll.css';`

### CDN
- JS：`https://cdn.jsdelivr.net/npm/locomotive-scroll/bundled/locomotive-scroll.min.js`
- CSS：`https://cdn.jsdelivr.net/npm/locomotive-scroll/bundled/locomotive-scroll.css`

## 3) 最小可運作範例
HTML
- 對要偵測/視差的元素加上 `data-scroll`。
- 視差元素再加 `data-scroll-speed="0.5"` 等。

JS
- `const locomotiveScroll = new LocomotiveScroll()`

## 4) 核心屬性（data-*）
> 這些屬性是主要的「視差 + 進場 + 事件」控制入口。

### 基本觸發
- `data-scroll`：啟用視窗內偵測。
- `data-scroll-class`：進入視窗時加入的 class（預設 `is-inview`）。
- `data-scroll-repeat`：重複觸發進入/離開（不加則只觸發一次）。

### 視差
- `data-scroll-speed`：視差速度（正負皆可，數值與容器尺寸成比例）。
  - 值越大移動越大；負值反方向。
  - 行動裝置預設關閉視差。
- `data-scroll-enable-touch-speed`：行動裝置啟用視差。

### 位置與偏移
- `data-scroll-position="start,end"`：設定進入與離開的觸發點（start/middle/end）。
- `data-scroll-offset="0,0"`：設定進入/離開偏移，可用 px 或 %。

### 進度事件
- `data-scroll-css-progress`：在元素上提供 CSS 變數 `--progress`（0~1）。
- `data-scroll-event-progress="eventName"`：觸發自訂事件，事件中可取得 progress。

### 自訂事件
- `data-scroll-call="eventName"`：元素進入視窗時觸發自訂事件。

### ScrollTo 相關
- `data-scroll-to`：點擊時阻止預設並滾動到目標。
- `data-scroll-to-href`：指定目標（若不是 `<a>`）。
- `data-scroll-to-offset`：滾動偏移（像 scroll-padding-top）。
- `data-scroll-to-duration`：滾動時間（秒）。

### 其他
- `data-scroll-ignore-fold`：忽略「在 fold 內」的進度校正。

## 5) 初始化 Options（常用）
> `new LocomotiveScroll({ ... })`

### `lenisOptions`（最重要）
- `wrapper`：滾動容器（預設 `window`）。
- `content`：滾動內容（預設 `document.documentElement`）。
- `lerp`、`duration`、`orientation`、`gestureOrientation`
- `smoothWheel`、`smoothTouch`、`wheelMultiplier`、`touchMultiplier`
- `normalizeWheel`、`easing`

### 其他 Options
- `triggerRootMargin`：Intersection Observer root margin（簡單觸發）。
- `rafRootMargin`：需要 RAF 的元素（視差/進度）root margin。
- `autoStart`：是否自動開始（預設 true）。
- `scrollCallback`：取得 `{ scroll, limit, velocity, direction, progress }`。
- `initCustomTicker` / `destroyCustomTicker`：自訂 ticker（如 GSAP）。

### 自訂滾動容器範例規則
- `wrapper` 需固定高度並有 `overflow`。
- `content` 必須是 `wrapper` 的直接子元素。

## 6) API Methods
- `start()`：手動啟動滾動（搭配 `autoStart: false`）。
- `stop()`：停止滾動。
- `destroy()`：清除事件與實例。
- `resize()`：手動觸發尺寸更新（動態排版才需要）。
- `addScrollElements(container)`：新增區塊後，重新觀察 `data-scroll`。
- `removeScrollElements(container)`：移除區塊後，解除觀察。
- `scrollTo(target, options)`：程式捲動到目標（元素/selector/數值）。

## 7) 官方 Demo（網站上的互動示範）
> 來自官方 demo 頁展示的功能項目

- `data-scroll-speed`：不同 speed 值展示（正/負）。
- `data-scroll-class`：進入視窗時套 class。
- `data-scroll-repeat`：重複觸發。
- `data-scroll-css-progress`：CSS progress 變數。
- `data-scroll-event-progress`：自訂 progress 事件。
- `data-scroll-position`：start/middle/end 進出點。
- `data-scroll-call`：自訂事件觸發。
- Lenis direction callback：滾動方向回報。

## 8) 官方 CodeSandbox Examples（最重要）
1. Basic Usage — https://codesandbox.io/s/basic-76t7lh
2. Scroll Call — https://codesandbox.io/s/scroll-call-k6eqen
3. Progress — https://codesandbox.io/s/progress-srtqx9
4. GSAP Timeline — https://codesandbox.io/s/gsap-timeline-4kk8dc
5. Dynamic Content — https://codesandbox.io/p/sandbox/dynamic-content-5m30r6
6. Next.js Integration — https://codesandbox.io/p/devbox/cocky-star-5vcklc?file=%2Fapp%2Fpage.tsx
7. Third Party Injected Popups — https://codesandbox.io/p/sandbox/third-party-injected-popups-xch5tq
8. GSAP ScrollTrigger — https://codesandbox.io/p/sandbox/gsap-scrolltrigger-tt7sjd

## 9) Next.js 整合注意事項（FAW 會用到）
- Locomotive Scroll 依賴 `window` 與 Intersection Observer，需 **client-only**。
- App Router 中建議使用 `useEffect` 初始化，並在 `return` 清掉 `destroy()`。
- 若頁面內容是動態渲染（部落格列表、遊戲對話），記得在內容更新後呼叫 `addScrollElements()` 或 `resize()`。
- SSR 環境需特別測試與保護（避免 server 端執行）。

## 10) 限制與踩雷
- SSR 有相容性限制（需 client-only 保護）。
- 行動裝置預設禁用視差，需 `data-scroll-enable-touch-speed`。
- 若有第三方注入 modal/iframe 需要內部滾動，可用 Lenis `prevent` 避免攔截滾動事件。

## 11) 未來擴充建議（FAW 專案方向）
- 部落格首頁加入 `data-scroll-speed` 小幅視差。
- Hero 或案例卡片使用 `data-scroll-css-progress` 搭配漸入/位移。
- `data-scroll-call` 觸發你現有的動畫系統或 GA 事件追蹤。

---

## 參考連結
- 官方首頁：https://scroll.locomotive.ca
- 官方文件：https://scroll.locomotive.ca/docs
- GitHub：https://github.com/locomotivemtl/locomotive-scroll
