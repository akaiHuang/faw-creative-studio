/**
 * 自動化測試執行器 - Test Runner
 * 
 * 整合 Jest 和 Playwright，提供 AI 驅動的測試執行和分析
 * 
 * @module test-runner
 * @author FAW Creative Studio
 * @version 1.0.0
 */

import { CopilotClient, CopilotSession, defineTool } from "@github/copilot-sdk";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";

const execAsync = promisify(exec);

// ============================================================
// 類型定義
// ============================================================

export interface TestResult {
  testType: "jest" | "playwright" | "typescript" | "eslint";
  success: boolean;
  passed?: number;
  failed?: number;
  skipped?: number;
  duration?: number;
  coverage?: number;
  output: string;
  errors?: string[];
}

export interface TestSuiteResult {
  timestamp: Date;
  results: TestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    duration: number;
    overallSuccess: boolean;
  };
  report?: string;
}

// ============================================================
// 測試執行器
// ============================================================

export class TestRunner {
  private client: CopilotClient;
  private session: CopilotSession | null = null;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.client = new CopilotClient();
    this.projectRoot = projectRoot;
  }

  /**
   * 初始化測試執行器
   */
  async initialize(): Promise<void> {
    await this.client.start();

    this.session = await this.client.createSession({
      sessionId: `test-runner-${Date.now()}`,
      model: "gpt-4.1",
      tools: this.createTestTools(),
      systemMessage: {
        content: `
# 你的身份
你是一位專業的 QA 自動化工程師，負責執行和分析測試結果。

# 可用工具
- run_jest: 執行 Jest 單元測試
- run_playwright: 執行 Playwright E2E 測試
- check_types: TypeScript 型別檢查
- run_lint: ESLint 程式碼檢查
- read_test_file: 讀取測試檔案內容
- write_test_file: 寫入測試檔案

# 工作流程
1. 先執行型別檢查確保程式碼正確
2. 執行 lint 檢查程式碼風格
3. 執行單元測試驗證功能
4. 執行 E2E 測試驗證整合
5. 分析結果並生成報告

# 輸出格式
使用繁體中文，提供清晰的測試報告和改善建議。
        `.trim(),
      },
    });

    console.log("🧪 測試執行器已初始化");
  }

  /**
   * 創建測試工具
   */
  private createTestTools() {
    return [
      // Jest 測試工具
      defineTool("run_jest", {
        description: "執行 Jest 單元測試",
        parameters: z.object({
          testPath: z
            .string()
            .optional()
            .describe("測試檔案或目錄路徑，留空執行所有測試"),
          coverage: z.boolean().optional().describe("是否生成覆蓋率報告"),
          watch: z.boolean().optional().describe("是否監聽模式"),
          updateSnapshots: z.boolean().optional().describe("是否更新快照"),
        }),
        handler: async ({ testPath, coverage, watch, updateSnapshots }) => {
          try {
            const args = ["npx", "jest"];
            if (testPath) args.push(testPath);
            if (coverage) args.push("--coverage");
            if (watch) args.push("--watch");
            if (updateSnapshots) args.push("--updateSnapshot");
            args.push("--passWithNoTests");

            const { stdout, stderr } = await execAsync(args.join(" "), {
              cwd: this.projectRoot,
              timeout: 120000, // 2 分鐘超時
            });

            return {
              success: true,
              output: stdout,
              warnings: stderr || undefined,
            };
          } catch (error: any) {
            return {
              success: false,
              output: error.stdout || "",
              errors: error.stderr || error.message,
            };
          }
        },
      }),

      // Playwright E2E 測試工具
      defineTool("run_playwright", {
        description: "執行 Playwright E2E 測試",
        parameters: z.object({
          testPath: z.string().optional().describe("E2E 測試檔案路徑"),
          browser: z
            .enum(["chromium", "firefox", "webkit", "all"])
            .optional()
            .describe("測試瀏覽器"),
          headed: z.boolean().optional().describe("是否顯示瀏覽器視窗"),
          workers: z.number().optional().describe("平行執行的 worker 數量"),
        }),
        handler: async ({ testPath, browser = "chromium", headed, workers }) => {
          try {
            const args = ["npx", "playwright", "test"];
            if (testPath) args.push(testPath);
            if (browser !== "all") args.push(`--project=${browser}`);
            if (headed) args.push("--headed");
            if (workers) args.push(`--workers=${workers}`);

            const { stdout, stderr } = await execAsync(args.join(" "), {
              cwd: this.projectRoot,
              timeout: 300000, // 5 分鐘超時
            });

            return {
              success: true,
              output: stdout,
              warnings: stderr || undefined,
            };
          } catch (error: any) {
            return {
              success: false,
              output: error.stdout || "",
              errors: error.stderr || error.message,
            };
          }
        },
      }),

      // TypeScript 型別檢查工具
      defineTool("check_types", {
        description: "執行 TypeScript 型別檢查",
        parameters: z.object({
          strict: z.boolean().optional().describe("是否使用嚴格模式"),
        }),
        handler: async ({ strict }) => {
          try {
            const args = ["npx", "tsc", "--noEmit"];
            if (strict) args.push("--strict");

            const { stdout, stderr } = await execAsync(args.join(" "), {
              cwd: this.projectRoot,
              timeout: 60000,
            });

            return {
              success: true,
              output: stdout || "✅ 無型別錯誤",
            };
          } catch (error: any) {
            // TypeScript 錯誤會輸出到 stdout
            return {
              success: false,
              output: error.stdout || "",
              errors: error.message,
            };
          }
        },
      }),

      // ESLint 檢查工具
      defineTool("run_lint", {
        description: "執行 ESLint 程式碼檢查",
        parameters: z.object({
          path: z.string().optional().describe("要檢查的路徑，預設為 src/"),
          fix: z.boolean().optional().describe("是否自動修復"),
        }),
        handler: async ({ path: checkPath = "src/", fix }) => {
          try {
            const args = ["npx", "eslint", checkPath];
            if (fix) args.push("--fix");
            args.push("--format", "stylish");

            const { stdout, stderr } = await execAsync(args.join(" "), {
              cwd: this.projectRoot,
              timeout: 60000,
            });

            return {
              success: true,
              output: stdout || "✅ 無 lint 錯誤",
            };
          } catch (error: any) {
            return {
              success: false,
              output: error.stdout || "",
              errors: error.stderr || error.message,
            };
          }
        },
      }),

      // 讀取測試檔案
      defineTool("read_test_file", {
        description: "讀取測試檔案內容",
        parameters: z.object({
          filePath: z.string().describe("測試檔案路徑"),
        }),
        handler: async ({ filePath }) => {
          try {
            const fullPath = path.join(this.projectRoot, filePath);
            const content = await fs.readFile(fullPath, "utf-8");
            return { success: true, content };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },
      }),

      // 寫入測試檔案
      defineTool("write_test_file", {
        description: "寫入測試檔案",
        parameters: z.object({
          filePath: z.string().describe("測試檔案路徑"),
          content: z.string().describe("測試檔案內容"),
        }),
        handler: async ({ filePath, content }) => {
          try {
            const fullPath = path.join(this.projectRoot, filePath);
            const dir = path.dirname(fullPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(fullPath, content, "utf-8");
            return { success: true, message: `已寫入 ${filePath}` };
          } catch (error: any) {
            return { success: false, error: error.message };
          }
        },
      }),
    ];
  }

  /**
   * 執行完整測試套件
   */
  async runFullTestSuite(): Promise<TestSuiteResult> {
    if (!this.session) {
      throw new Error("測試執行器尚未初始化");
    }

    console.log("\n🧪 開始執行完整測試套件...\n");
    console.log("═".repeat(50));

    const startTime = Date.now();
    const results: TestResult[] = [];

    // 透過 AI 執行測試
    const response = await this.session.sendAndWait({
      prompt: `
請執行完整的測試流程：

1. 執行 TypeScript 型別檢查
2. 執行 ESLint 程式碼檢查（檢查 src/ 目錄）
3. 執行 Jest 單元測試（包含覆蓋率報告）
4. 如果有 E2E 測試目錄（e2e/ 或 tests/），執行 Playwright 測試

每個步驟完成後，請總結：
- 是否成功
- 發現的問題數量
- 需要修復的項目

最後請給出：
1. 整體測試結果（通過/失敗）
2. 各項指標摘要
3. 優先修復建議
      `,
      timeout: 300000, // 5 分鐘
    });

    const endTime = Date.now();

    console.log("═".repeat(50));
    console.log("\n📊 測試報告：\n");
    console.log(response?.data.content || "無測試結果");

    return {
      timestamp: new Date(),
      results,
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        duration: endTime - startTime,
        overallSuccess: true,
      },
      report: response?.data.content,
    };
  }

  /**
   * 執行單元測試
   */
  async runUnitTests(testPath?: string): Promise<TestResult> {
    console.log("\n🔬 執行單元測試...");

    try {
      const args = ["npx", "jest"];
      if (testPath) args.push(testPath);
      args.push("--coverage", "--passWithNoTests");

      const { stdout, stderr } = await execAsync(args.join(" "), {
        cwd: this.projectRoot,
        timeout: 120000,
      });

      // 解析 Jest 輸出
      const passMatch = stdout.match(/(\d+) passed/);
      const failMatch = stdout.match(/(\d+) failed/);
      const skipMatch = stdout.match(/(\d+) skipped/);

      return {
        testType: "jest",
        success: !failMatch || parseInt(failMatch[1]) === 0,
        passed: passMatch ? parseInt(passMatch[1]) : 0,
        failed: failMatch ? parseInt(failMatch[1]) : 0,
        skipped: skipMatch ? parseInt(skipMatch[1]) : 0,
        output: stdout,
      };
    } catch (error: any) {
      return {
        testType: "jest",
        success: false,
        output: error.stdout || "",
        errors: [error.stderr || error.message],
      };
    }
  }

  /**
   * 執行 E2E 測試
   */
  async runE2ETests(testPath?: string): Promise<TestResult> {
    console.log("\n🌐 執行 E2E 測試...");

    try {
      const args = ["npx", "playwright", "test"];
      if (testPath) args.push(testPath);

      const { stdout, stderr } = await execAsync(args.join(" "), {
        cwd: this.projectRoot,
        timeout: 300000,
      });

      const passMatch = stdout.match(/(\d+) passed/);
      const failMatch = stdout.match(/(\d+) failed/);

      return {
        testType: "playwright",
        success: !failMatch || parseInt(failMatch[1]) === 0,
        passed: passMatch ? parseInt(passMatch[1]) : 0,
        failed: failMatch ? parseInt(failMatch[1]) : 0,
        output: stdout,
      };
    } catch (error: any) {
      return {
        testType: "playwright",
        success: false,
        output: error.stdout || "",
        errors: [error.stderr || error.message],
      };
    }
  }

  /**
   * 生成測試報告
   */
  async generateTestReport(results: TestSuiteResult): Promise<string> {
    if (!this.session) {
      throw new Error("測試執行器尚未初始化");
    }

    const response = await this.session.sendAndWait({
      prompt: `
請根據以下測試結果生成專業的測試報告：

${JSON.stringify(results, null, 2)}

報告格式：
1. 執行摘要
2. 各測試類型結果
3. 發現的問題
4. 改善建議
5. 下一步行動
      `,
    });

    return response?.data.content || "";
  }

  /**
   * 分析測試失敗原因
   */
  async analyzeFailures(failedTests: string[]): Promise<string> {
    if (!this.session) {
      throw new Error("測試執行器尚未初始化");
    }

    const response = await this.session.sendAndWait({
      prompt: `
請分析以下測試失敗的原因並提供修復建議：

${failedTests.join("\n\n---\n\n")}

請提供：
1. 失敗根本原因分析
2. 修復步驟
3. 預防類似問題的建議
      `,
    });

    return response?.data.content || "";
  }

  /**
   * 關閉測試執行器
   */
  async shutdown(): Promise<void> {
    if (this.session) {
      await this.session.destroy();
    }
    await this.client.stop();
    console.log("🏁 測試執行器已關閉");
  }
}

// ============================================================
// 測試範本
// ============================================================

export const TEST_TEMPLATES = {
  /**
   * React 元件測試範本
   */
  reactComponent: (componentName: string) => `
import { render, screen, fireEvent } from "@testing-library/react";
import ${componentName} from "@/src/components/${componentName}";

describe("${componentName}", () => {
  it("應該正確渲染", () => {
    render(<${componentName} />);
    // 新增你的斷言
  });

  it("應該處理使用者互動", () => {
    render(<${componentName} />);
    // 模擬使用者操作
    // fireEvent.click(screen.getByRole("button"));
  });

  it("應該支援不同的 props", () => {
    // 測試不同的 props 組合
  });
});
`.trim(),

  /**
   * API 路由測試範本
   */
  apiRoute: (routeName: string) => `
import { createMocks } from "node-mocks-http";
import handler from "@/src/app/api/${routeName}/route";

describe("API: /${routeName}", () => {
  it("GET 應該返回正確的資料", async () => {
    const { req, res } = createMocks({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    // 新增你的斷言
  });

  it("POST 應該正確處理資料", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        // 測試資料
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
  });

  it("應該處理錯誤情況", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {}, // 空資料
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
`.trim(),

  /**
   * E2E 測試範本
   */
  e2e: (pageName: string) => `
import { test, expect } from "@playwright/test";

test.describe("${pageName} 頁面", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/${pageName.toLowerCase()}");
  });

  test("應該正確載入頁面", async ({ page }) => {
    await expect(page).toHaveTitle(/.*/);
    // 檢查重要元素
  });

  test("應該有正確的導航", async ({ page }) => {
    // 測試導航功能
  });

  test("應該響應使用者互動", async ({ page }) => {
    // 測試互動功能
  });

  test("應該在行動裝置正確顯示", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    // 測試響應式設計
  });
});
`.trim(),
};

export default TestRunner;
