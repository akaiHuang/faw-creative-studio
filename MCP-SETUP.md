# MCP 安裝與設定指南

> 在 VS Code 中設定 Model Context Protocol (MCP) 服務

---

## 📦 已安裝的 MCP 套件

```bash
# 已全局安裝的套件
✅ puppeteer-mcp-server  # 瀏覽器自動化、PDF 生成
✅ github-mcp            # GitHub API 整合
✅ @modelcontextprotocol/sdk  # MCP 核心 SDK
```

---

## 🔧 VS Code MCP 設定

### 設定檔位置
- **全局設定**：`~/.vscode/mcp.json`（所有專案共用）
- **專案設定**：`.vscode/mcp.json`（僅限該專案）

### 目前的全局設定

```json
// ~/.vscode/mcp.json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "puppeteer-mcp-server"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "github-mcp"],
      "env": {
        "GITHUB_TOKEN": "你的_GitHub_Token"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/akaihuangm1"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

---

## 🚀 設定 GitHub Token

### Step 1: 建立 GitHub Personal Access Token

1. 前往 [GitHub Settings > Developer Settings > Personal Access Tokens](https://github.com/settings/tokens)
2. 點擊 **Generate new token (classic)**
3. 勾選以下權限：
   - `repo` - 完整的倉庫存取權
   - `workflow` - 更新 GitHub Actions 工作流程
   - `read:org` - 讀取組織資訊
4. 複製產生的 Token

### Step 2: 更新設定檔

```bash
# 編輯全局 MCP 設定
code ~/.vscode/mcp.json
```

將 `"GITHUB_TOKEN": "你的_GitHub_Token"` 替換為你的實際 Token。

---

## 📋 可用的 MCP 服務說明

### 1. Puppeteer MCP
```yaml
用途: 瀏覽器自動化
功能:
  - 網頁截圖
  - PDF 生成
  - 網頁爬蟲
  - 自動化測試
```

### 2. GitHub MCP
```yaml
用途: GitHub API 整合
功能:
  - 管理 Issues
  - 建立/審查 PR
  - 讀取程式碼
  - 自動化部署
需求: GitHub Token
```

### 3. Filesystem MCP
```yaml
用途: 檔案系統存取
功能:
  - 讀取/寫入檔案
  - 目錄瀏覽
  - 搜尋檔案
```

### 4. Context7 MCP
```yaml
用途: 程式碼文件查詢
功能:
  - 即時文件搜尋
  - 程式庫 API 查詢
  - 程式碼範例取得
```

---

## 🔌 新增其他 MCP 服務

### Notion MCP
```json
"notion": {
  "command": "npx",
  "args": ["-y", "@notionhq/notion-mcp-server"],
  "env": {
    "NOTION_API_KEY": "你的_Notion_API_Key"
  }
}
```

### Slack MCP（如有需要）
```json
"slack": {
  "command": "npx",
  "args": ["-y", "@anthropic/mcp-slack"],
  "env": {
    "SLACK_BOT_TOKEN": "你的_Slack_Token"
  }
}
```

---

## ✅ 驗證安裝

### 測試 Puppeteer MCP
```bash
npx puppeteer-mcp-server --help
```

### 測試 GitHub MCP
```bash
npx github-mcp --help
```

### 重新載入 VS Code
按下 `Cmd + Shift + P`，輸入 `Reload Window` 重新載入視窗以套用 MCP 設定。

---

## 🔄 更新 MCP 套件

```bash
# 更新所有全局安裝的套件
npm update -g puppeteer-mcp-server github-mcp @modelcontextprotocol/sdk
```

---

## 🛠️ 疑難排解

### MCP 無法啟動
1. 確認 Node.js 版本 >= 18
2. 檢查環境變數是否正確設定
3. 重新載入 VS Code

### GitHub Token 問題
1. 確認 Token 沒有過期
2. 確認 Token 有足夠的權限
3. 嘗試重新產生 Token

### 套件找不到
```bash
# 清除 npm 快取
npm cache clean --force

# 重新安裝
npm install -g <套件名稱>
```

---

## 📚 參考資源

- [Model Context Protocol 官方文件](https://modelcontextprotocol.io/)
- [MCP Servers GitHub](https://github.com/modelcontextprotocol/servers)
- [VS Code MCP 設定指南](https://code.visualstudio.com/docs/copilot/copilot-extensibility-overview)
