/**
 * 監工系統 - Orchestrator
 * 
 * 負責審查程式碼品質、監控進度、整合結果
 * 
 * @module orchestrator
 * @author FAW Creative Studio
 * @version 1.0.0
 */

import { CopilotClient, CopilotSession, defineTool } from "@github/copilot-sdk";
import { z } from "zod";

// ============================================================
// 類型定義
// ============================================================

/**
 * 審查狀態
 */
export type ReviewStatus = "pending" | "approved" | "rejected" | "revision_needed";

/**
 * 審查嚴重程度
 */
export type Severity = "critical" | "major" | "minor" | "suggestion";

/**
 * 審查項目
 */
export interface ReviewItem {
  category: string;
  severity: Severity;
  message: string;
  line?: number;
  suggestion?: string;
}

/**
 * 審查結果
 */
export interface ReviewResult {
  taskId: string;
  workerId: string;
  status: ReviewStatus;
  score: number; // 0-100
  summary: string;
  items: ReviewItem[];
  suggestions: string[];
  timestamp: Date;
}

/**
 * 專案報告
 */
export interface ProjectReport {
  generatedAt: Date;
  totalTasks: number;
  completedTasks: number;
  approvalRate: number;
  averageScore: number;
  criticalIssues: number;
  recommendations: string[];
  nextSteps: string[];
}

// ============================================================
// 監工系統
// ============================================================

export class Orchestrator {
  private client: CopilotClient;
  private reviewerSession: CopilotSession | null = null;
  private plannerSession: CopilotSession | null = null;
  private reviewHistory: ReviewResult[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.client = new CopilotClient();
  }

  /**
   * 初始化監工系統
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn("⚠️ 監工系統已初始化");
      return;
    }

    await this.client.start();

    // 創建程式碼審查員 Session
    this.reviewerSession = await this.client.createSession({
      sessionId: `reviewer-${Date.now()}`,
      model: "gpt-5", // 使用較強的模型做審查
      systemMessage: {
        content: `
# 你的身份
你是一位資深的技術總監（Tech Lead），擁有 15 年以上的軟體開發經驗。
你負責審查團隊成員的程式碼，確保品質和一致性。

# 審查標準（權重）

## 1. 程式碼品質 (25%)
- 可讀性：命名清晰、結構合理
- 可維護性：模組化、低耦合
- 效能：無明顯效能問題

## 2. 最佳實踐 (25%)
- 設計模式：適當使用設計模式
- 架構原則：遵循 SOLID、DRY、KISS
- 程式碼風格：一致的格式和命名規範

## 3. 安全性 (20%)
- 輸入驗證
- 錯誤處理
- 敏感資料處理

## 4. 完整性 (15%)
- 需求符合度
- 邊界情況處理
- 錯誤處理完善

## 5. 文件與註解 (15%)
- 適當的註解
- 函數說明
- 使用範例

# 輸出格式（JSON）
{
  "status": "approved" | "rejected" | "revision_needed",
  "score": 0-100,
  "summary": "簡短總結",
  "items": [
    {
      "category": "品質|實踐|安全|完整|文件",
      "severity": "critical|major|minor|suggestion",
      "message": "問題描述",
      "line": 行號（可選）,
      "suggestion": "修改建議"
    }
  ],
  "suggestions": ["改善建議1", "改善建議2"]
}

# 評分標準
- 90-100: 優秀，可直接合併
- 80-89: 良好，小幅修改後可合併
- 70-79: 需要修改
- 60-69: 需要大幅修改
- 0-59: 不合格，需要重寫
        `.trim(),
      },
    });

    // 創建專案規劃師 Session
    this.plannerSession = await this.client.createSession({
      sessionId: `planner-${Date.now()}`,
      model: "gpt-4.1",
      systemMessage: {
        content: `
# 你的身份
你是一位專案經理兼技術架構師，負責：
1. 分解大型任務為可執行的小任務
2. 安排任務優先級和依賴關係
3. 評估工作量和時程
4. 識別風險和障礙

# 工作原則
- 任務應該具體且可測量
- 每個任務應該能在 2 小時內完成
- 明確標示任務之間的依賴關係
- 考慮測試和文件的時間

# 輸出格式
使用繁體中文，結構化呈現任務規劃。
        `.trim(),
      },
    });

    this.isInitialized = true;
    console.log("👔 監工系統已上線");
  }

  /**
   * 審查程式碼
   */
  async review(
    workerId: string,
    taskDescription: string,
    code: string
  ): Promise<ReviewResult> {
    this.ensureInitialized();

    if (!this.reviewerSession) {
      throw new Error("審查員 Session 未初始化");
    }

    const taskId = `review-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log(`\n🔍 監工正在審查 ${workerId} 的工作成果...`);

    const response = await this.reviewerSession.sendAndWait({
      prompt: `
請審查以下工作成果：

【任務描述】
${taskDescription}

【程式碼】
\`\`\`
${code}
\`\`\`

請根據審查標準進行評分和提供意見。回覆請使用 JSON 格式。
      `,
    });

    const content = response?.data.content || "";
    let reviewData: any;

    try {
      // 嘗試從回覆中提取 JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        reviewData = JSON.parse(jsonMatch[0]);
      } else {
        // 如果沒有 JSON，使用預設結構
        reviewData = {
          status: "revision_needed",
          score: 50,
          summary: content.substring(0, 200),
          items: [],
          suggestions: [content],
        };
      }
    } catch {
      reviewData = {
        status: "revision_needed",
        score: 50,
        summary: "無法解析審查結果",
        items: [],
        suggestions: [content],
      };
    }

    const result: ReviewResult = {
      taskId,
      workerId,
      status: reviewData.status || "revision_needed",
      score: reviewData.score || 50,
      summary: reviewData.summary || "",
      items: reviewData.items || [],
      suggestions: reviewData.suggestions || [],
      timestamp: new Date(),
    };

    this.reviewHistory.push(result);
    this.printReviewResult(result);

    return result;
  }

  /**
   * 印出審查結果
   */
  private printReviewResult(result: ReviewResult): void {
    console.log("\n" + "─".repeat(50));
    console.log("📋 審查結果");
    console.log("─".repeat(50));
    console.log(`   狀態：${this.getStatusEmoji(result.status)} ${result.status}`);
    console.log(`   分數：${this.getScoreBar(result.score)} ${result.score}/100`);
    console.log(`   摘要：${result.summary.substring(0, 80)}...`);

    if (result.items.length > 0) {
      console.log("\n   發現的問題：");
      result.items.slice(0, 3).forEach((item, i) => {
        const severityEmoji = this.getSeverityEmoji(item.severity);
        console.log(`   ${i + 1}. ${severityEmoji} [${item.category}] ${item.message}`);
      });
      if (result.items.length > 3) {
        console.log(`   ... 還有 ${result.items.length - 3} 個問題`);
      }
    }

    if (result.suggestions.length > 0) {
      console.log("\n   改善建議：");
      result.suggestions.slice(0, 2).forEach((s, i) => {
        console.log(`   ${i + 1}. ${s.substring(0, 60)}...`);
      });
    }

    console.log("─".repeat(50));
  }

  private getStatusEmoji(status: ReviewStatus): string {
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

  private getSeverityEmoji(severity: Severity): string {
    switch (severity) {
      case "critical":
        return "🔴";
      case "major":
        return "🟠";
      case "minor":
        return "🟡";
      case "suggestion":
        return "💡";
      default:
        return "⚪";
    }
  }

  private getScoreBar(score: number): string {
    const filled = Math.floor(score / 10);
    const empty = 10 - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  }

  /**
   * 規劃任務
   */
  async planTasks(
    projectDescription: string,
    requirements: string[]
  ): Promise<string> {
    this.ensureInitialized();

    if (!this.plannerSession) {
      throw new Error("規劃師 Session 未初始化");
    }

    console.log("\n📝 正在規劃任務...");

    const response = await this.plannerSession.sendAndWait({
      prompt: `
請為以下專案規劃任務：

【專案描述】
${projectDescription}

【需求列表】
${requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

請提供：
1. 任務分解（每個任務 < 2 小時）
2. 優先級排序
3. 依賴關係
4. 預估時程
5. 風險評估
6. 建議的人員配置
      `,
    });

    return response?.data.content || "";
  }

  /**
   * 生成專案報告
   */
  async generateReport(): Promise<ProjectReport> {
    this.ensureInitialized();

    if (!this.reviewerSession) {
      throw new Error("審查員 Session 未初始化");
    }

    const history = this.reviewHistory;
    const totalTasks = history.length;
    const approvedTasks = history.filter((r) => r.status === "approved").length;
    const totalScore = history.reduce((sum, r) => sum + r.score, 0);
    const criticalIssues = history.reduce(
      (sum, r) => sum + r.items.filter((i) => i.severity === "critical").length,
      0
    );

    const response = await this.reviewerSession.sendAndWait({
      prompt: `
請根據以下審查歷史生成專案總結報告：

【審查數據】
- 總任務數：${totalTasks}
- 通過數：${approvedTasks}
- 平均分數：${totalTasks > 0 ? (totalScore / totalTasks).toFixed(1) : 0}
- 嚴重問題數：${criticalIssues}

【詳細歷史】
${JSON.stringify(history.slice(-10), null, 2)}

請提供：
1. 專案健康度評估
2. 主要問題彙整
3. 改善優先級建議
4. 團隊能力分析
5. 下一步行動項目
      `,
    });

    console.log("\n📊 專案報告");
    console.log("═".repeat(50));
    console.log(response?.data.content || "無報告內容");
    console.log("═".repeat(50));

    return {
      generatedAt: new Date(),
      totalTasks,
      completedTasks: approvedTasks,
      approvalRate: totalTasks > 0 ? (approvedTasks / totalTasks) * 100 : 0,
      averageScore: totalTasks > 0 ? totalScore / totalTasks : 0,
      criticalIssues,
      recommendations: [],
      nextSteps: [],
    };
  }

  /**
   * 協調多個工人的工作
   */
  async coordinate(
    workers: Array<{ id: string; task: string; result: string }>
  ): Promise<string> {
    this.ensureInitialized();

    if (!this.plannerSession) {
      throw new Error("規劃師 Session 未初始化");
    }

    const response = await this.plannerSession.sendAndWait({
      prompt: `
請協調以下工人的工作成果，確保它們能夠整合在一起：

${workers
  .map(
    (w) => `
【工人 ${w.id}】
任務：${w.task}
結果摘要：${w.result.substring(0, 500)}...
`
  )
  .join("\n---\n")}

請提供：
1. 整合建議
2. 潛在衝突
3. 需要調整的部分
4. 整合順序
      `,
    });

    return response?.data.content || "";
  }

  /**
   * 取得審查歷史
   */
  getReviewHistory(): ReviewResult[] {
    return [...this.reviewHistory];
  }

  /**
   * 清除審查歷史
   */
  clearHistory(): void {
    this.reviewHistory = [];
    console.log("🗑️ 審查歷史已清除");
  }

  /**
   * 關閉監工系統
   */
  async shutdown(): Promise<void> {
    if (this.reviewerSession) {
      await this.reviewerSession.destroy();
    }
    if (this.plannerSession) {
      await this.plannerSession.destroy();
    }
    await this.client.stop();
    this.isInitialized = false;
    console.log("👔 監工系統已離線");
  }

  /**
   * 確保已初始化
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("監工系統尚未初始化，請先呼叫 initialize()");
    }
  }
}

export default Orchestrator;
