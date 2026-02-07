/**
 * 多工人管理器 - Multi-Worker Manager
 * 
 * 用於創建和管理多個 AI 工人，實現平行開發
 * 
 * @module multi-worker
 * @author FAW Creative Studio
 * @version 1.0.0
 */

import { CopilotClient, CopilotSession, SessionEvent } from "@github/copilot-sdk";

// ============================================================
// 類型定義
// ============================================================

/**
 * 工人狀態
 */
export type WorkerStatus = "idle" | "working" | "completed" | "error";

/**
 * 工人介面
 */
export interface Worker {
  id: string;
  name: string;
  role: string;
  session: CopilotSession;
  status: WorkerStatus;
  result?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * 任務介面
 */
export interface Task {
  id: string;
  description: string;
  workerId: string;
  dependencies?: string[];
  priority?: number;
}

/**
 * 任務結果
 */
export interface TaskResult {
  taskId: string;
  workerId: string;
  success: boolean;
  result?: string;
  error?: string;
  duration: number;
}

/**
 * 工人配置
 */
export interface WorkerConfig {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  model?: string;
  streaming?: boolean;
}

// ============================================================
// 多工人管理器
// ============================================================

export class MultiWorkerManager {
  private client: CopilotClient;
  private workers: Map<string, Worker> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.client = new CopilotClient();
  }

  /**
   * 初始化管理器
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn("⚠️ 管理器已經初始化");
      return;
    }

    await this.client.start();
    this.isInitialized = true;
    console.log("🚀 多工人管理器已啟動");
  }

  /**
   * 創建工人
   */
  async createWorker(config: WorkerConfig): Promise<Worker> {
    this.ensureInitialized();

    const { id, name, role, systemPrompt, model = "gpt-4.1", streaming = true } = config;

    // 檢查是否已存在
    if (this.workers.has(id)) {
      throw new Error(`工人 ${id} 已存在`);
    }

    const session = await this.client.createSession({
      sessionId: `worker-${id}-${Date.now()}`,
      model,
      streaming,
      systemMessage: {
        content: `
# 你的身份
你是 ${name}，一位專業的 ${role}。

# 專業背景
${systemPrompt}

# 工作原則
1. 專注於你的專業領域
2. 輸出高品質、可維護的程式碼
3. 遵循最佳實踐和設計模式
4. 確保程式碼有適當的註解
5. 考慮邊界情況和錯誤處理
6. 使用繁體中文回覆

# 輸出格式
- 程式碼請使用 markdown code block
- 說明請簡潔明瞭
- 如有多個檔案，請分開標示
        `.trim(),
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
    console.log(`✅ 工人就位：${name} (${role})`);

    return worker;
  }

  /**
   * 快速創建多個工人
   */
  async createWorkers(configs: WorkerConfig[]): Promise<Worker[]> {
    const workers = await Promise.all(configs.map((config) => this.createWorker(config)));
    console.log(`\n📋 共創建 ${workers.length} 位工人`);
    return workers;
  }

  /**
   * 分配任務給工人
   */
  async assignTask(workerId: string, task: string): Promise<TaskResult> {
    this.ensureInitialized();

    const worker = this.workers.get(workerId);
    if (!worker) {
      throw new Error(`找不到工人：${workerId}`);
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    worker.status = "working";
    worker.startTime = Date.now();

    console.log(`\n🔨 ${worker.name} 開始工作...`);
    console.log(`   任務：${task.substring(0, 60)}${task.length > 60 ? "..." : ""}`);

    try {
      const response = await worker.session.sendAndWait({ prompt: task });

      worker.status = "completed";
      worker.endTime = Date.now();
      worker.result = response?.data.content || "";

      const duration = worker.endTime - worker.startTime;
      console.log(`✅ ${worker.name} 完成任務 (${(duration / 1000).toFixed(1)}s)`);

      return {
        taskId,
        workerId,
        success: true,
        result: worker.result,
        duration,
      };
    } catch (error: any) {
      worker.status = "error";
      worker.endTime = Date.now();
      worker.error = error.message;

      const duration = worker.endTime - (worker.startTime || Date.now());
      console.error(`❌ ${worker.name} 任務失敗：${error.message}`);

      return {
        taskId,
        workerId,
        success: false,
        error: error.message,
        duration,
      };
    }
  }

  /**
   * 平行執行多個任務
   */
  async executeParallel(
    tasks: Array<{ workerId: string; task: string }>
  ): Promise<TaskResult[]> {
    console.log(`\n🚀 開始平行執行 ${tasks.length} 個任務...\n`);
    console.log("─".repeat(50));

    const startTime = Date.now();
    const results = await Promise.all(
      tasks.map(({ workerId, task }) => this.assignTask(workerId, task))
    );
    const endTime = Date.now();

    console.log("─".repeat(50));
    console.log(`\n⏱️  平行執行總耗時：${((endTime - startTime) / 1000).toFixed(1)}s`);

    const successCount = results.filter((r) => r.success).length;
    console.log(`📊 成功：${successCount}/${results.length}`);

    return results;
  }

  /**
   * 依序執行任務（支援依賴關係）
   */
  async executeSequential(tasks: Task[]): Promise<Map<string, TaskResult>> {
    const results: Map<string, TaskResult> = new Map();
    const completed: Set<string> = new Set();

    // 按優先級排序
    const sortedTasks = [...tasks].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    console.log(`\n📋 開始依序執行 ${sortedTasks.length} 個任務...\n`);

    for (const task of sortedTasks) {
      // 檢查依賴是否完成
      if (task.dependencies) {
        const unmetDeps = task.dependencies.filter((dep) => !completed.has(dep));
        if (unmetDeps.length > 0) {
          console.error(`⚠️ 任務 ${task.id} 的依賴未完成：${unmetDeps.join(", ")}`);
          results.set(task.id, {
            taskId: task.id,
            workerId: task.workerId,
            success: false,
            error: `依賴未完成：${unmetDeps.join(", ")}`,
            duration: 0,
          });
          continue;
        }
      }

      const result = await this.assignTask(task.workerId, task.description);
      results.set(task.id, result);

      if (result.success) {
        completed.add(task.id);
      }
    }

    return results;
  }

  /**
   * 取得工人狀態
   */
  getWorker(workerId: string): Worker | undefined {
    return this.workers.get(workerId);
  }

  /**
   * 取得所有工人
   */
  getAllWorkers(): Worker[] {
    return Array.from(this.workers.values());
  }

  /**
   * 取得工人統計
   */
  getStats(): {
    total: number;
    idle: number;
    working: number;
    completed: number;
    error: number;
  } {
    const workers = this.getAllWorkers();
    return {
      total: workers.length,
      idle: workers.filter((w) => w.status === "idle").length,
      working: workers.filter((w) => w.status === "working").length,
      completed: workers.filter((w) => w.status === "completed").length,
      error: workers.filter((w) => w.status === "error").length,
    };
  }

  /**
   * 重置工人狀態
   */
  resetWorker(workerId: string): void {
    const worker = this.workers.get(workerId);
    if (worker) {
      worker.status = "idle";
      worker.result = undefined;
      worker.error = undefined;
      worker.startTime = undefined;
      worker.endTime = undefined;
    }
  }

  /**
   * 關閉所有工人
   */
  async shutdown(): Promise<void> {
    console.log("\n👋 正在關閉所有工人...");

    for (const worker of this.workers.values()) {
      try {
        await worker.session.destroy();
        console.log(`   ✓ ${worker.name} 已離線`);
      } catch (error: any) {
        console.error(`   ✗ ${worker.name} 關閉失敗：${error.message}`);
      }
    }

    this.workers.clear();
    await this.client.stop();
    this.isInitialized = false;

    console.log("🏁 所有工人已下班\n");
  }

  /**
   * 確保已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("管理器尚未初始化，請先呼叫 initialize()");
    }
  }
}

// ============================================================
// 預設工人配置
// ============================================================

export const DEFAULT_WORKERS = {
  frontend: {
    id: "frontend",
    name: "前端小明",
    role: "前端工程師",
    systemPrompt: `
你專精於：
- React / Next.js 開發
- TypeScript 類型安全
- Tailwind CSS 樣式設計
- 動畫效果與互動體驗
- 響應式設計與無障礙
- 效能優化
    `.trim(),
  },

  backend: {
    id: "backend",
    name: "後端小華",
    role: "後端工程師",
    systemPrompt: `
你專精於：
- Next.js API Routes
- Node.js 後端開發
- 資料庫設計（SQL / NoSQL）
- RESTful API 設計
- 認證與授權
- 效能與安全
    `.trim(),
  },

  testing: {
    id: "testing",
    name: "測試小強",
    role: "測試工程師",
    systemPrompt: `
你專精於：
- Jest 單元測試
- React Testing Library
- Playwright E2E 測試
- 測試驅動開發 (TDD)
- 測試覆蓋率優化
- Mock 與 Stub 技巧
    `.trim(),
  },

  devops: {
    id: "devops",
    name: "維運小美",
    role: "DevOps 工程師",
    systemPrompt: `
你專精於：
- CI/CD 流程設計
- Docker 容器化
- GitHub Actions
- Vercel / AWS 部署
- 監控與日誌
- 自動化腳本
    `.trim(),
  },

  architect: {
    id: "architect",
    name: "架構小龍",
    role: "系統架構師",
    systemPrompt: `
你專精於：
- 系統設計與架構
- 設計模式應用
- 可擴展性規劃
- 技術選型評估
- 程式碼審查
- 效能調優
    `.trim(),
  },
} as const;

export default MultiWorkerManager;
