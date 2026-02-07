# GitHub Copilot SDK 使用指南

> 🚀 打造你的 AI 超級工人軍團 - 多線程平行開發、自動監工與自動化測試

---

## 📖 概述

GitHub Copilot SDK 讓你可以將 Copilot 的 AI Agent 能力嵌入到你的應用程式中。透過 SDK，你可以：

- **分任務多工人開發**：創建多個獨立 Session，每個負責不同任務
- **同步平行處理**：多個 AI 工人同時工作，大幅提升效率
- **自動監工系統**：監控所有工人的進度和輸出品質
- **自動化測試**：開發完成後自動執行測試驗證

```
            ┌─────────────┐
            │  Orchestrator │  ← 總監工 (管理所有任務)
            │   (監控系統)   │
            └──────┬──────┘
                   │
     ┌─────────────┼─────────────┐
     ▼             ▼             ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Worker 1 │  │ Worker 2 │  │ Worker 3 │  ← 超級工人 (各自獨立運作)
│ (前端)   │  │ (後端)   │  │ (測試)   │
└─────────┘  └─────────┘  └─────────┘
```

---

## 🔧 安裝設定

### 1. 安裝 Copilot CLI

首先需要安裝 GitHub Copilot CLI：

```bash
# macOS (Homebrew)
brew install github/copilot-cli/gh-copilot

# 或使用 npm
npm install -g @github/copilot-cli

# 驗證安裝
copilot --version
```

### 2. 安裝 SDK

```bash
# Node.js / TypeScript
npm install @github/copilot-sdk tsx zod

# Python
pip install github-copilot-sdk

# Go
go get github.com/github/copilot-sdk/go

# .NET
dotnet add package GitHub.Copilot.SDK
```

### 3. 認證

```bash
# 登入 GitHub（需要 Copilot 訂閱）
copilot auth login
```

---

## 🏗️ 架構說明

```
Your Application (FAW)
       ↓
  SDK Client (CopilotClient)
       ↓ JSON-RPC
  Copilot CLI (server mode)
       ↓
  GitHub Copilot API
       ↓
  AI Models (GPT-5, Claude Sonnet 4.5, etc.)
```

SDK 透過 JSON-RPC 與 Copilot CLI 通訊，CLI 再呼叫 GitHub Copilot API。你不需要自己處理複雜的編排邏輯。

---

## 🛠️ 基礎用法

### Hello World

```typescript
// hello-copilot.ts
import { CopilotClient } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({ model: "gpt-4.1" });

const response = await session.sendAndWait({ 
  prompt: "用繁體中文說 Hello World" 
});
console.log(response?.data.content);

await client.stop();
```

執行：
```bash
npx tsx hello-copilot.ts
```

### 串流輸出（Streaming）

```typescript
import { CopilotClient, SessionEvent } from "@github/copilot-sdk";

const client = new CopilotClient();
const session = await client.createSession({
  model: "gpt-4.1",
  streaming: true,
});

session.on((event: SessionEvent) => {
  if (event.type === "assistant.message_delta") {
    process.stdout.write(event.data.deltaContent);
  }
});

await session.sendAndWait({ prompt: "寫一首關於 AI 的短詩" });
await client.stop();
```

---

## 👷 多工人平行開發系統

### 概念圖

```
                    ┌──────────────────────┐
                    │    Task Manager      │
                    │  (任務分配與監控)     │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                    ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  Frontend   │      │  Backend    │      │  Testing    │
   │  Worker     │      │  Worker     │      │  Worker     │
   │             │      │             │      │             │
   │ • UI 元件   │      │ • API 路由  │      │ • 單元測試  │
   │ • 樣式優化  │      │ • 資料庫    │      │ • E2E 測試  │
   │ • 動畫效果  │      │ • 認證邏輯  │      │ • 效能測試  │
   └─────────────┘      └─────────────┘      └─────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │    Result Merger     │
                    │  (結果整合與審查)     │
                    └──────────────────────┘
```

### 實作：多工人管理器

```typescript
// src/lib/copilot-workers/multi-worker.ts
import { CopilotClient, CopilotSession, SessionEvent } from "@github/copilot-sdk";

// 工人類型定義
interface Worker {
  id: string;
  name: string;
  role: string;
  session: CopilotSession;
  status: "idle" | "working" | "completed" | "error";
  result?: string;
}

// 任務定義
interface Task {
  id: string;
  description: string;
  workerId: string;
  dependencies?: string[]; // 依賴的任務 ID
}

export class MultiWorkerManager {
  private client: CopilotClient;
  private workers: Map<string, Worker> = new Map();

  constructor() {
    this.client = new CopilotClient();
  }

  async initialize() {
    await this.client.start();
  }

  // 創建工人
  async createWorker(
    id: string,
    name: string,
    role: string,
    systemPrompt: string
  ): Promise<Worker> {
    const session = await this.client.createSession({
      sessionId: `worker-${id}`,
      model: "gpt-5",
      streaming: true,
      systemMessage: {
        content: `
你是 ${name}，一位專業的 ${role}。
${systemPrompt}

工作原則：
- 專注於你的專業領域
- 輸出高品質、可維護的程式碼
- 遵循最佳實踐和設計模式
- 確保程式碼有適當的註解
        `,
      },
    });

    const worker: Worker = {
      id,
      name,
      role,
      session,
      status: "idle",
    };

    this.workers.set(id, worker);
    console.log(`✅ 工人 ${name} (${role}) 已就位`);
    return worker;
  }

  // 分配任務給工人
  async assignTask(workerId: string, task: string): Promise<string> {
    const worker = this.workers.get(workerId);
    if (!worker) throw new Error(`Worker ${workerId} not found`);

    worker.status = "working";
    console.log(`🔨 ${worker.name} 開始工作: ${task.substring(0, 50)}...`);

    const response = await worker.session.sendAndWait({
      prompt: task,
    });

    worker.status = "completed";
    worker.result = response?.data.content || "";
    console.log(`✅ ${worker.name} 完成任務`);

    return worker.result;
  }

  // 平行執行多個任務
  async executeParallel(tasks: Array<{ workerId: string; task: string }>) {
    console.log(`\n🚀 開始平行執行 ${tasks.length} 個任務...\n`);

    const startTime = Date.now();
    const results = await Promise.all(
      tasks.map(({ workerId, task }) => this.assignTask(workerId, task))
    );
    const endTime = Date.now();

    console.log(`\n⏱️  總耗時: ${(endTime - startTime) / 1000}s`);
    return results;
  }

  // 依序執行（有依賴關係時）
  async executeSequential(tasks: Task[]) {
    const results: Map<string, string> = new Map();

    for (const task of tasks) {
      // 等待依賴任務完成
      if (task.dependencies) {
        for (const depId of task.dependencies) {
          if (!results.has(depId)) {
            throw new Error(`Dependency ${depId} not completed`);
          }
        }
      }

      const result = await this.assignTask(task.workerId, task.description);
      results.set(task.id, result);
    }

    return results;
  }

  // 關閉所有工人
  async shutdown() {
    for (const worker of this.workers.values()) {
      await worker.session.destroy();
    }
    await this.client.stop();
    console.log("👋 所有工人已下班");
  }
}
```

### 使用範例：FAW 專案開發

```typescript
// src/lib/copilot-workers/faw-dev-team.ts
import { MultiWorkerManager } from "./multi-worker";

async function developFeature() {
  const manager = new MultiWorkerManager();
  await manager.initialize();

  // 創建開發團隊
  const frontend = await manager.createWorker(
    "fe",
    "小前",
    "前端工程師",
    `
你專精於：
- React / Next.js 開發
- Tailwind CSS 樣式設計
- 動畫效果與互動體驗
- 響應式設計

專案背景：FAW Creative Studio 是一個遊戲化品牌展示網站
    `
  );

  const backend = await manager.createWorker(
    "be",
    "小後",
    "後端工程師",
    `
你專精於：
- Next.js API Routes
- Firebase / Firestore
- 認證與授權
- 資料庫設計

專案背景：FAW 使用 Next.js 15 + Firebase
    `
  );

  const tester = await manager.createWorker(
    "qa",
    "小測",
    "測試工程師",
    `
你專精於：
- Jest 單元測試
- Playwright E2E 測試
- 測試驅動開發 (TDD)
- 效能測試

專案背景：確保 FAW 的所有功能正常運作
    `
  );

  // 平行開發任務
  console.log("\n📋 階段一：平行開發\n");
  const [uiCode, apiCode] = await manager.executeParallel([
    {
      workerId: "fe",
      task: `
請為 FAW 的部落格系統創建一個新的文章卡片元件：

需求：
1. 顯示文章封面圖、標題、摘要、日期
2. 滑鼠懸停時有放大效果
3. 支援暗色模式
4. 使用 Tailwind CSS

輸出完整的 React 元件程式碼。
      `,
    },
    {
      workerId: "be",
      task: `
請為 FAW 創建一個部落格 API 路由：

需求：
1. GET /api/blog - 取得所有文章列表
2. GET /api/blog/[slug] - 取得單篇文章
3. 使用 Firestore 作為資料庫
4. 包含錯誤處理

輸出完整的 Next.js API 路由程式碼。
      `,
    },
  ]);

  // 測試階段（依賴前面的開發結果）
  console.log("\n📋 階段二：自動化測試\n");
  const testCode = await manager.assignTask(
    "qa",
    `
請為以下元件和 API 編寫測試：

【前端元件】
${uiCode}

【後端 API】
${apiCode}

請使用 Jest 編寫單元測試，涵蓋：
1. 元件渲染測試
2. API 回應測試
3. 錯誤處理測試
4. 邊界情況測試

輸出完整的測試程式碼。
    `
  );

  console.log("\n📦 開發成果\n");
  console.log("=".repeat(50));
  console.log("前端元件：", uiCode.substring(0, 200), "...");
  console.log("=".repeat(50));
  console.log("後端 API：", apiCode.substring(0, 200), "...");
  console.log("=".repeat(50));
  console.log("測試程式碼：", testCode.substring(0, 200), "...");

  await manager.shutdown();
}

developFeature().catch(console.error);
```

---

## 🔍 監工系統（Orchestrator）

### 實作：自動監工

```typescript
// src/lib/copilot-workers/orchestrator.ts
import { CopilotClient, CopilotSession, SessionEvent } from "@github/copilot-sdk";

interface TaskResult {
  workerId: string;
  task: string;
  result: string;
  status: "pending" | "approved" | "rejected" | "revision_needed";
  feedback?: string;
}

export class Orchestrator {
  private client: CopilotClient;
  private reviewerSession: CopilotSession | null = null;
  private taskHistory: TaskResult[] = [];

  constructor() {
    this.client = new CopilotClient();
  }

  async initialize() {
    await this.client.start();

    // 創建監工 Session
    this.reviewerSession = await this.client.createSession({
      sessionId: "orchestrator-reviewer",
      model: "gpt-5", // 使用較強的模型做審查
      systemMessage: {
        content: `
你是一位資深的技術總監（Tech Lead），負責審查團隊成員的程式碼。

審查標準：
1. 程式碼品質：可讀性、可維護性、效能
2. 最佳實踐：是否遵循設計模式和架構原則
3. 安全性：是否有安全漏洞
4. 完整性：是否符合需求，是否遺漏邊界情況
5. 測試覆蓋：測試是否充分

你的回覆格式：
{
  "status": "approved" | "rejected" | "revision_needed",
  "score": 0-100,
  "feedback": "詳細的審查意見",
  "suggestions": ["改善建議1", "改善建議2"]
}
        `,
      },
    });

    console.log("👔 監工系統已上線");
  }

  // 審查程式碼
  async review(workerId: string, task: string, result: string): Promise<TaskResult> {
    if (!this.reviewerSession) {
      throw new Error("Orchestrator not initialized");
    }

    console.log(`\n🔍 監工正在審查 ${workerId} 的工作成果...`);

    const response = await this.reviewerSession.sendAndWait({
      prompt: `
請審查以下工作成果：

【任務描述】
${task}

【輸出結果】
${result}

請根據審查標準給出評價。
      `,
    });

    const content = response?.data.content || "";
    let reviewResult: any;

    try {
      // 嘗試解析 JSON 回覆
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reviewResult = JSON.parse(jsonMatch[0]);
      } else {
        reviewResult = {
          status: "revision_needed",
          score: 50,
          feedback: content,
          suggestions: [],
        };
      }
    } catch {
      reviewResult = {
        status: "revision_needed",
        score: 50,
        feedback: content,
        suggestions: [],
      };
    }

    const taskResult: TaskResult = {
      workerId,
      task,
      result,
      status: reviewResult.status,
      feedback: reviewResult.feedback,
    };

    this.taskHistory.push(taskResult);

    // 顯示審查結果
    console.log(`\n📋 審查結果：`);
    console.log(`   狀態：${this.getStatusEmoji(reviewResult.status)} ${reviewResult.status}`);
    console.log(`   分數：${reviewResult.score}/100`);
    console.log(`   意見：${reviewResult.feedback?.substring(0, 100)}...`);

    return taskResult;
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "revision_needed":
        return "🔄";
      default:
        return "❓";
    }
  }

  // 生成專案總結報告
  async generateReport(): Promise<string> {
    if (!this.reviewerSession) {
      throw new Error("Orchestrator not initialized");
    }

    const response = await this.reviewerSession.sendAndWait({
      prompt: `
請根據以下審查歷史生成一份專案總結報告：

${JSON.stringify(this.taskHistory, null, 2)}

報告應包含：
1. 整體完成度
2. 程式碼品質評估
3. 主要問題和風險
4. 改善建議
5. 下一步行動項目
      `,
    });

    return response?.data.content || "";
  }

  async shutdown() {
    if (this.reviewerSession) {
      await this.reviewerSession.destroy();
    }
    await this.client.stop();
    console.log("👔 監工系統已離線");
  }
}
```

---

## 🧪 自動化測試系統（Next.js）

### 整合 Jest 與 Playwright

```typescript
// src/lib/copilot-workers/test-runner.ts
import { CopilotClient, defineTool } from "@github/copilot-sdk";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export class TestRunner {
  private client: CopilotClient;

  constructor() {
    this.client = new CopilotClient();
  }

  async initialize() {
    await this.client.start();

    // 創建測試專用 Session，配備執行測試的工具
    const session = await this.client.createSession({
      sessionId: "test-runner",
      model: "gpt-4.1",
      tools: [
        // 執行 Jest 測試
        defineTool("run_jest", {
          description: "執行 Jest 單元測試",
          parameters: z.object({
            testPath: z.string().describe("測試檔案路徑，例如 __tests__/components"),
            coverage: z.boolean().optional().describe("是否生成覆蓋率報告"),
          }),
          handler: async ({ testPath, coverage }) => {
            try {
              const coverageFlag = coverage ? "--coverage" : "";
              const { stdout, stderr } = await execAsync(
                `npx jest ${testPath} ${coverageFlag} --json`
              );
              return { success: true, output: stdout, errors: stderr };
            } catch (error: any) {
              return { success: false, output: error.stdout, errors: error.stderr };
            }
          },
        }),

        // 執行 Playwright E2E 測試
        defineTool("run_playwright", {
          description: "執行 Playwright E2E 測試",
          parameters: z.object({
            testPath: z.string().describe("E2E 測試檔案路徑"),
            browser: z.enum(["chromium", "firefox", "webkit"]).optional(),
          }),
          handler: async ({ testPath, browser = "chromium" }) => {
            try {
              const { stdout, stderr } = await execAsync(
                `npx playwright test ${testPath} --project=${browser}`
              );
              return { success: true, output: stdout };
            } catch (error: any) {
              return { success: false, output: error.stdout, errors: error.stderr };
            }
          },
        }),

        // 檢查 TypeScript 型別
        defineTool("check_types", {
          description: "執行 TypeScript 型別檢查",
          parameters: z.object({}),
          handler: async () => {
            try {
              const { stdout } = await execAsync("npx tsc --noEmit");
              return { success: true, output: stdout || "無型別錯誤" };
            } catch (error: any) {
              return { success: false, errors: error.stdout };
            }
          },
        }),

        // ESLint 檢查
        defineTool("run_lint", {
          description: "執行 ESLint 程式碼檢查",
          parameters: z.object({
            path: z.string().describe("要檢查的路徑"),
          }),
          handler: async ({ path }) => {
            try {
              const { stdout } = await execAsync(`npx eslint ${path} --format json`);
              return { success: true, output: stdout };
            } catch (error: any) {
              return { success: false, errors: error.stdout };
            }
          },
        }),
      ],
      systemMessage: {
        content: `
你是一位 QA 自動化工程師，負責執行和分析測試結果。

你可以使用以下工具：
- run_jest: 執行單元測試
- run_playwright: 執行 E2E 測試
- check_types: TypeScript 型別檢查
- run_lint: ESLint 程式碼檢查

工作流程：
1. 先執行型別檢查
2. 執行 lint 檢查
3. 執行單元測試
4. 執行 E2E 測試
5. 分析結果並生成報告
        `,
      },
    });

    return session;
  }

  async runFullTestSuite() {
    const session = await this.initialize();

    console.log("\n🧪 開始執行完整測試套件...\n");

    const response = await session.sendAndWait({
      prompt: `
請執行 FAW 專案的完整測試流程：

1. 檢查 TypeScript 型別
2. 執行 ESLint 檢查 src/ 目錄
3. 執行 Jest 單元測試 (__tests__/)
4. 執行 Playwright E2E 測試 (e2e/)

每個步驟完成後，請總結結果。最後給出整體測試報告。
      `,
    });

    console.log("\n📊 測試報告：");
    console.log(response?.data.content);

    await session.destroy();
    await this.client.stop();
  }
}
```

### Jest 測試範例

```typescript
// __tests__/components/BlogCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import BlogCard from "@/src/components/BlogCard";

describe("BlogCard", () => {
  const mockPost = {
    id: "1",
    title: "測試文章",
    excerpt: "這是測試文章的摘要",
    coverImage: "/blog/test.jpg",
    date: "2024-01-23",
    category: "AI Lab",
  };

  it("應該正確渲染文章資訊", () => {
    render(<BlogCard post={mockPost} />);

    expect(screen.getByText("測試文章")).toBeInTheDocument();
    expect(screen.getByText("這是測試文章的摘要")).toBeInTheDocument();
  });

  it("滑鼠懸停應該顯示放大效果", () => {
    render(<BlogCard post={mockPost} />);

    const card = screen.getByTestId("blog-card");
    fireEvent.mouseEnter(card);

    expect(card).toHaveClass("scale-105");
  });

  it("應該支援暗色模式", () => {
    render(<BlogCard post={mockPost} />);

    const card = screen.getByTestId("blog-card");
    expect(card).toHaveClass("dark:bg-gray-800");
  });
});
```

### Playwright E2E 測試範例

```typescript
// e2e/blog.spec.ts
import { test, expect } from "@playwright/test";

test.describe("部落格功能", () => {
  test("應該能瀏覽部落格列表", async ({ page }) => {
    await page.goto("/blog");

    // 等待文章卡片載入
    await expect(page.locator("[data-testid='blog-card']").first()).toBeVisible();

    // 檢查分類篩選器
    const categories = page.locator("[data-testid='category-filter']");
    await expect(categories).toBeVisible();
  });

  test("應該能點擊進入文章詳情", async ({ page }) => {
    await page.goto("/blog");

    // 點擊第一篇文章
    await page.locator("[data-testid='blog-card']").first().click();

    // 確認 URL 變更
    await expect(page).toHaveURL(/\/blog\/.+/);

    // 確認文章內容顯示
    await expect(page.locator("article")).toBeVisible();
  });

  test("遊戲應該能正常載入", async ({ page }) => {
    await page.goto("/game-v3");

    // 等待遊戲 Canvas 載入
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // 檢查遊戲開始按鈕
    await expect(page.getByText(/開始/)).toBeVisible();
  });
});
```

---

## 🎯 完整工作流程範例

### FAW 功能開發全流程

```typescript
// src/lib/copilot-workers/full-workflow.ts
import { MultiWorkerManager } from "./multi-worker";
import { Orchestrator } from "./orchestrator";
import { TestRunner } from "./test-runner";

async function developAndTest() {
  // 1. 初始化系統
  console.log("🚀 啟動 AI 開發團隊...\n");

  const workerManager = new MultiWorkerManager();
  const orchestrator = new Orchestrator();
  const testRunner = new TestRunner();

  await Promise.all([
    workerManager.initialize(),
    orchestrator.initialize(),
  ]);

  // 2. 創建開發團隊
  await workerManager.createWorker("fe", "前端小明", "前端工程師", "專精 React/Next.js");
  await workerManager.createWorker("be", "後端小華", "後端工程師", "專精 API 開發");
  await workerManager.createWorker("qa", "測試小強", "測試工程師", "專精自動化測試");

  // 3. 平行開發
  console.log("\n📋 階段一：平行開發\n");
  const [feResult, beResult] = await workerManager.executeParallel([
    {
      workerId: "fe",
      task: "創建一個響應式的部落格文章卡片元件，使用 Tailwind CSS",
    },
    {
      workerId: "be",
      task: "創建部落格 API 路由 /api/blog，支援分頁和分類篩選",
    },
  ]);

  // 4. 監工審查
  console.log("\n📋 階段二：程式碼審查\n");
  const feReview = await orchestrator.review("fe", "前端元件開發", feResult);
  const beReview = await orchestrator.review("be", "後端 API 開發", beResult);

  // 5. 如果需要修改，重新開發
  if (feReview.status === "revision_needed") {
    console.log("\n🔄 前端需要修改，重新開發...");
    await workerManager.assignTask(
      "fe",
      `請根據以下反饋修改程式碼：\n${feReview.feedback}\n\n原始程式碼：\n${feResult}`
    );
  }

  // 6. 編寫測試
  console.log("\n📋 階段三：編寫測試\n");
  await workerManager.assignTask(
    "qa",
    `請為以下程式碼編寫測試：\n\n前端：\n${feResult}\n\n後端：\n${beResult}`
  );

  // 7. 執行測試
  console.log("\n📋 階段四：執行測試\n");
  await testRunner.runFullTestSuite();

  // 8. 生成報告
  console.log("\n📋 階段五：生成報告\n");
  const report = await orchestrator.generateReport();
  console.log(report);

  // 9. 清理
  await Promise.all([
    workerManager.shutdown(),
    orchestrator.shutdown(),
  ]);

  console.log("\n✅ 開發流程完成！");
}

developAndTest().catch(console.error);
```

---

## 📦 專案結構建議

```
FAW/
├── src/
│   ├── lib/
│   │   └── copilot-workers/
│   │       ├── multi-worker.ts      # 多工人管理器
│   │       ├── orchestrator.ts      # 監工系統
│   │       ├── test-runner.ts       # 測試執行器
│   │       ├── faw-dev-team.ts      # FAW 開發團隊配置
│   │       └── full-workflow.ts     # 完整工作流程
│   └── ...
├── __tests__/                       # Jest 單元測試
│   ├── components/
│   └── api/
├── e2e/                             # Playwright E2E 測試
│   ├── blog.spec.ts
│   └── game.spec.ts
├── jest.config.js
├── playwright.config.ts
└── package.json
```

---

## 🔐 注意事項

### 訂閱需求
- GitHub Copilot 訂閱（Free tier 有限制）
- 每個 prompt 計入 premium request quota

### 最佳實踐
1. **任務分解**：將大任務拆成小任務，每個工人專注一件事
2. **平行化**：無依賴的任務同時執行
3. **審查機制**：所有輸出都經過監工審查
4. **測試覆蓋**：確保有足夠的測試覆蓋率
5. **錯誤處理**：妥善處理工人執行失敗的情況

### 模型選擇
| 模型 | 適用場景 |
|------|----------|
| `gpt-4.1` | 一般開發任務 |
| `gpt-5` | 複雜推理、程式碼審查 |
| `claude-sonnet-4.5` | 長文本處理 |

---

## 📚 參考資源

- [GitHub Copilot SDK 官方文件](https://github.com/github/copilot-sdk)
- [Getting Started Guide](https://github.com/github/copilot-sdk/blob/main/docs/getting-started.md)
- [Node.js Cookbook](https://github.com/github/copilot-sdk/tree/main/cookbook/nodejs)
- [Multiple Sessions Recipe](https://github.com/github/copilot-sdk/blob/main/cookbook/nodejs/multiple-sessions.md)
- [Copilot CLI 安裝指南](https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli)

---

## 🏷️ 版本

- SDK 版本：v0.1.16（Technical Preview）
- 文件更新：2026-01-23
