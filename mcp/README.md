# LabCo MCP Server 🚀

> Model Context Protocol (MCP) server that connects **Claude** (Claude Desktop, Claude Code, Cursor, Zed) directly to your **LabCo Kanban Board**.

With this MCP server, Claude acts as an autonomous co-worker, scrum master, and project assistant that can view boards, create tasks with checklists, move cards across workflow columns, triage backlogs, post discussion summaries, and synchronize updates in real-time.

---

## ✨ Features

- **Multi-Board Management**: List, inspect, and create Kanban boards.
- **Card & Task Operations**: Create, update, move, and archive tasks with due dates, priority labels, checklists, and descriptions.
- **Checklist Automation**: Add subtasks and check off items autonomously.
- **Full Text Search**: Search cards and subtasks across all boards.
- **Real-Time WebSockets**: Any mutation made by Claude is broadcast over Socket.io so open browser windows update live on screen without refreshing!
- **Discussions & Activity Logs**: Read team discussions, post standup updates, and inspect audit histories.

---

## 🛠️ Available MCP Tools

| Tool | Description |
|---|---|
| `labco_list_boards` | Lists all Kanban boards accessible to the user. |
| `labco_get_board` | Retrieves full board data with columns, cards, checklists, and assignees. |
| `labco_create_board` | Creates a new board with optional default columns. |
| `labco_create_column` | Adds a new column (e.g. "In Review", "Blocked") to a board. |
| `labco_create_card` | Creates a task card with subtasks, due date, description, and cover color. |
| `labco_update_card` | Updates card title, description, due date, or cover color. |
| `labco_move_card` | Moves a card between columns or changes its priority order. |
| `labco_archive_card` | Archives / removes a card from a board. |
| `labco_manage_checklist` | Adds items to a card's checklist or marks subtasks as completed. |
| `labco_search_cards` | Searches cards across all boards by keyword, label, or subtask. |
| `labco_get_activity` | Retrieves the audit trail and activity history for a board. |
| `labco_get_discussions` | Reads recent chat messages in the board's `#discussion` room. |
| `labco_post_discussion` | Posts a message or summary to the `#discussion` room. |

---

## 🚀 Quick Setup (Claude Desktop)

### Step 1: Install Dependencies
Open a terminal in the `mcp/` directory:
```bash
cd mcp
npm install
```

### Step 2: Generate a 1-Year Token
Run the token generator script:
```bash
npm run generate-token -- your_email@example.com
```

This will print a ready-to-use configuration block.

### Step 3: Configure Claude Desktop
Open your Claude Desktop configuration file:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the `labco` server under `mcpServers`:

```json
{
  "mcpServers": {
    "labco": {
      "command": "node",
      "args": [
        "c:/Users/shrid/OneDrive/Documents/NextJS/nextjs-projects/labco/mcp/src/index.js"
      ],
      "env": {
        "LABCO_API_URL": "http://localhost:5000/api",
        "LABCO_TOKEN": "YOUR_GENERATED_JWT_TOKEN"
      }
    }
  }
}
```

> **Alternative (Email & Password)**:  
> If you prefer not to generate a token, you can pass credentials instead:
> ```json
> "env": {
>   "LABCO_API_URL": "http://localhost:5000/api",
>   "LABCO_EMAIL": "your_email@example.com",
>   "LABCO_PASSWORD": "your_password"
> }
> ```

### Step 4: Restart Claude Desktop
Completely quit and restart Claude Desktop. You will see a 🔨 hammer icon in Claude indicating that the 13 LabCo tools are active!

---

## 💻 Configuration for Cursor / Claude Code

### Cursor (`.cursor/mcp.json`)
Create or edit `.cursor/mcp.json` in your workspace:
```json
{
  "mcpServers": {
    "labco": {
      "command": "node",
      "args": ["mcp/src/index.js"],
      "env": {
        "LABCO_API_URL": "http://localhost:5000/api",
        "LABCO_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

---

## 💬 Example Prompts to Try with Claude

Here are real scenarios you can ask Claude once connected:

1. **Board Status & Inspection**:
   > *"Claude, what tasks are currently on my Sprint 42 board?"*
   >
   > *"Give me a breakdown of all tasks in the In Progress column."*

2. **Sprint Planning**:
   > *"We are adding user notification settings. Plan this feature on my board 'Platform Engine'. Create the cards with descriptions and checklists in the Backlog."*

3. **Task Progression & Movement**:
   > *"Move the 'Dual-token rotation' card from In Progress to Done."*
   >
   > *"Mark the checklist item 'Redis connection test' as completed on task LAB-102."*

4. **Daily Standup**:
   > *"Prepare a daily standup report for my board 'Platform Engine' and post the summary to the board's #discussion room."*

5. **Search**:
   > *"Find all cards related to 'OAuth' or 'Token' across my boards."*

---

## 🔒 Security & Best Practices

- All stdio communication adheres strictly to the MCP specification (`stdout` is reserved solely for JSON-RPC 2.0 messages; internal logs route safely to `stderr`).
- Respects LabCo board permissions (`owner`, `editor`, `viewer`).
- Socket.io connections are authenticated using the same cryptographic tokens as the REST API.
