/**
 * 完整工作流程 - Full Workflow
 * 
 * 整合多工人、監工、測試執行器的完整開發流程
 * 
 * @module full-workflow
 * @author FAW Creative Studio
 * @version 1.0.0
 */

import { MultiWorkerManager, DEFAULT_WORKERS, TaskResult } from "./multi-worker";
import { Orchestrator, ReviewResult } from "./orchestrator";
import { TestRunner, TestSuiteResult } from "./test-runner";

// ============================================================
// 類型定義
// ============================================================

export interface WorkflowConfig {
  projectRoot?: string;
  enableTesting?: boolean;
  enableReview?: boolean;
  autoFix?: boolean;
  maxRevisions?: number;
}

export interface WorkflowResult {
  success: boolean;
  phase: string;
  tasks: TaskResult[];
  reviews: ReviewResult[];
  testResults?: TestSuiteResult;
  report: string;
  duration: number;
}

// ============================================================
// 完整工作流程
// ============================================================

export class FullWorkflow {
  private workerManager: MultiWorkerManager;
  private orchestrator: Orchestrator;
  private testRunner: TestRunner;
  private config: Required<WorkflowConfig>;

  constructor(config: WorkflowConfig = {}) {
    this.workerManager = new MultiWorkerManager();
    this.orchestrator = new Orchestrator();
    this.testRunner = new TestRunner(config.projectRoot);

    this.config = {
      projectRoot: config.projectRoot || process.cwd(),
      enableTesting: config.enableTesting ?? true,
      enableReview: config.enableReview ?? true,
      autoFix: config.autoFix ?? true,
      maxRevisions: config.maxRevisions ?? 2,
    };
  }

  /**
   * 初始化工作流程
   */
  async initialize(): Promise<void> {
    console.log("\n🚀 初始化 AI 開發工作流程...\n");
    console.log("═".repeat(60));

    await Promise.all([
      this.workerManager.initialize(),
      this.orchestrator.initialize(),
    ]);

    if (this.config.enableTesting) {
      await this.testRunner.initialize();
    }

    console.log("═".repeat(60));
    console.log("\n✅ 工作流程初始化完成\n");
  }

  /**
   * 執行完整開發流程
   */
  async execute(
    featureDescription: string,
    requirements: string[]
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const tasks: TaskResult[] = [];
    const reviews: ReviewResult[] = [];
    let testResults: TestSuiteResult | undefined;

    try {
      // ========================================
      // 階段 1：創建開發團隊
      // ========================================
      console.log("\n📋 階段 1：組建開發團隊\n");
      console.log("─".repeat(40));

      await this.workerManager.createWorkers([
        DEFAULT_WORKERS.frontend,
        DEFAULT_WORKERS.backend,
        DEFAULT_WORKERS.testing,
      ]);

      // ========================================
      // 階段 2：任務規劃
      // ========================================
      console.log("\n📋 階段 2：任務規劃\n");
      console.log("─".repeat(40));

      const plan = await this.orchestrator.planTasks(featureDescription, requirements);
      console.log(plan);

      // ========================================
      // 階段 3：平行開發
      // ========================================
      console.log("\n📋 階段 3：平行開發\n");
      console.log("─".repeat(40));

      const devTasks = await this.workerManager.executeParallel([
        {
          workerId: "frontend",
          task: `
請開發以下功能的前端部分：

【功能描述】
${featureDescription}

【需求】
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

請提供：
1. React/Next.js 元件程式碼
2. 樣式設計（使用 Tailwind CSS）
3. 必要的 hooks 和狀態管理
4. TypeScript 類型定義
          `,
        },
        {
          workerId: "backend",
          task: `
請開發以下功能的後端部分：

【功能描述】
${featureDescription}

【需求】
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

請提供：
1. API 路由程式碼（Next.js API Routes）
2. 資料驗證邏輯
3. 錯誤處理
4. TypeScript 類型定義
          `,
        },
      ]);

      tasks.push(...devTasks);

      // ========================================
      // 階段 4：程式碼審查
      // ========================================
      if (this.config.enableReview) {
        console.log("\n📋 階段 4：程式碼審查\n");
        console.log("─".repeat(40));

        for (const task of devTasks.filter((t) => t.success && t.result)) {
          const review = await this.orchestrator.review(
            task.workerId,
            featureDescription,
            task.result!
          );
          reviews.push(review);

          // 如果需要修改且啟用自動修復
          if (
            review.status === "revision_needed" &&
            this.config.autoFix &&
            review.suggestions.length > 0
          ) {
            console.log(`\n🔄 ${task.workerId} 正在根據反饋修改...`);

            const revision = await this.workerManager.assignTask(
              task.workerId,
              `
請根據以下審查意見修改程式碼：

【審查意見】
${review.suggestions.join("\n")}

【原始程式碼】
${task.result}

請提供修改後的完整程式碼。
              `
            );

            if (revision.success) {
              task.result = revision.result;
              // 重新審查
              const reReview = await this.orchestrator.review(
                task.workerId,
                `修改後：${featureDescription}`,
                revision.result!
              );
              reviews.push(reReview);
            }
          }
        }
      }

      // ========================================
      // 階段 5：編寫測試
      // ========================================
      console.log("\n📋 階段 5：編寫測試\n");
      console.log("─".repeat(40));

      const feResult = devTasks.find((t) => t.workerId === "frontend");
      const beResult = devTasks.find((t) => t.workerId === "backend");

      const testTask = await this.workerManager.assignTask(
        "testing",
        `
請為以下程式碼編寫測試：

【前端程式碼】
${feResult?.result || "無"}

【後端程式碼】
${beResult?.result || "無"}

請提供：
1. Jest 單元測試
2. React Testing Library 元件測試
3. API 測試
4. 涵蓋成功和失敗情況
        `
      );

      tasks.push(testTask);

      // ========================================
      // 階段 6：執行測試
      // ========================================
      if (this.config.enableTesting) {
        console.log("\n📋 階段 6：執行測試\n");
        console.log("─".repeat(40));

        testResults = await this.testRunner.runFullTestSuite();
      }

      // ========================================
      // 階段 7：生成報告
      // ========================================
      console.log("\n📋 階段 7：生成報告\n");
      console.log("─".repeat(40));

      const report = await this.orchestrator.generateReport();
      const duration = Date.now() - startTime;

      // 最終結果
      const allApproved =
        reviews.length === 0 || reviews.every((r) => r.status === "approved");
      const allTasksSuccess = tasks.every((t) => t.success);

      console.log("\n" + "═".repeat(60));
      console.log("🏁 開發流程完成");
      console.log("═".repeat(60));
      console.log(`   總耗時：${(duration / 1000 / 60).toFixed(1)} 分鐘`);
      console.log(`   任務成功率：${tasks.filter((t) => t.success).length}/${tasks.length}`);
      console.log(
        `   審查通過率：${reviews.filter((r) => r.status === "approved").length}/${reviews.length}`
      );
      console.log(`   整體結果：${allApproved && allTasksSuccess ? "✅ 成功" : "⚠️ 需要關注"}`);

      return {
        success: allApproved && allTasksSuccess,
        phase: "completed",
        tasks,
        reviews,
        testResults,
        report: JSON.stringify(report, null, 2),
        duration,
      };
    } catch (error: any) {
      console.error(`\n❌ 工作流程錯誤：${error.message}`);
      return {
        success: false,
        phase: "error",
        tasks,
        reviews,
        testResults,
        report: error.message,
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * 快速開發模式（不含測試和審查）
   */
  async quickDevelop(task: string): Promise<TaskResult[]> {
    console.log("\n⚡ 快速開發模式\n");

    await this.workerManager.createWorkers([
      DEFAULT_WORKERS.frontend,
      DEFAULT_WORKERS.backend,
    ]);

    return this.workerManager.executeParallel([
      { workerId: "frontend", task: `前端開發：${task}` },
      { workerId: "backend", task: `後端開發：${task}` },
    ]);
  }

  /**
   * 關閉工作流程
   */
  async shutdown(): Promise<void> {
    console.log("\n👋 正在關閉工作流程...\n");

    await Promise.all([
      this.workerManager.shutdown(),
      this.orchestrator.shutdown(),
      this.config.enableTesting ? this.testRunner.shutdown() : Promise.resolve(),
    ]);

    console.log("🏁 工作流程已結束\n");
  }
}

// ============================================================
// 範例用法
// ============================================================

/**
 * 範例：開發部落格功能
 */
async function example() {
  const workflow = new FullWorkflow({
    projectRoot: "/Users/akaihuangm1/Desktop/FAW",
    enableTesting: true,
    enableReview: true,
    autoFix: true,
  });

  try {
    await workflow.initialize();

    const result = await workflow.execute(
      "FAW 部落格系統優化",
      [
        "文章列表支援無限捲動",
        "文章卡片顯示預估閱讀時間",
        "支援文章標籤篩選",
        "API 支援分頁和搜尋",
      ]
    );

    console.log("\n📦 開發結果：", result.success ? "成功" : "需要關注");
  } finally {
    await workflow.shutdown();
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  example().catch(console.error);
}

export default FullWorkflow;
