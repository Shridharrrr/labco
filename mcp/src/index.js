#!/usr/bin/env node

/**
 * LabCo Model Context Protocol (MCP) Server
 * Connects Claude Desktop, Claude Code, Cursor, and other MCP clients
 * to the LabCo Real-Time Collaborative Kanban Board.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { LabCoApiClient } from './client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Attempt to load .env from server directory if not already set in environment
const serverEnvPath = path.resolve(__dirname, '../../server/.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config();
}

// Initialise LabCo API client
const client = new LabCoApiClient();

// Helper to format responses
const textResponse = (text) => ({
  content: [{ type: 'text', text: String(text) }],
});

const errorResponse = (err) => ({
  isError: true,
  content: [{ type: 'text', text: `Error: ${err.message || err}` }],
});

// Format card into a readable markdown snippet
const formatCardMd = (c) => {
  const parts = [];
  parts.push(`- **${c.title}** (ID: \`${c._id}\`)`);
  if (c.description) parts.push(`  Description: ${c.description}`);
  if (c.status && c.status !== 'none') parts.push(`  Status: ${c.status}`);
  if (c.dueDate) parts.push(`  Due Date: ${new Date(c.dueDate).toLocaleDateString()}`);
  if (c.checklist?.length) {
    const done = c.checklist.filter((i) => i.completed).length;
    parts.push(`  Checklist (${done}/${c.checklist.length}):`);
    c.checklist.forEach((item, idx) => {
      parts.push(`    [${item.completed ? 'x' : ' '}] ${idx}: ${item.text}`);
    });
  }
  if (c.assignees?.length) {
    const names = c.assignees.map((a) => a.name || a.email).join(', ');
    parts.push(`  Assignees: ${names}`);
  }
  return parts.join('\n');
};

// Initialise MCP Server
const server = new McpServer({
  name: 'labco-mcp-server',
  version: '1.0.0',
});

// ============================================================================
// TOOLS
// ============================================================================

/**
 * 1. labco_list_boards
 */
server.tool(
  'labco_list_boards',
  {},
  async () => {
    try {
      const boards = await client.getBoards();
      if (!boards || boards.length === 0) {
        return textResponse('No boards found. Use `labco_create_board` to create your first board.');
      }

      let md = `# LabCo Boards (${boards.length})\n\n`;
      md += '| Board Title | Board ID | Members | Owner | Description |\n';
      md += '|---|---|---|---|---|\n';

      boards.forEach((b) => {
        const owner = b.owner?.name || b.owner?.email || 'Unknown';
        const membersCount = b.members?.length || 1;
        const desc = b.description ? b.description.replace(/\n/g, ' ') : '-';
        md += `| **${b.title}** | \`${b._id}\` | ${membersCount} | ${owner} | ${desc} |\n`;
      });

      return textResponse(md);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 2. labco_get_board
 */
server.tool(
  'labco_get_board',
  {
    board: z
      .string()
      .describe("Board ID (24-hex characters) or board title (e.g. 'Platform Engine' or 'Sprint 42')"),
  },
  async ({ board }) => {
    try {
      const data = await client.findBoard(board);
      const { board: b, columns = [], cards = [] } = data;

      // Group cards by column ID
      const cardsByCol = {};
      columns.forEach((col) => {
        cardsByCol[col._id.toString()] = [];
      });
      cards.forEach((c) => {
        const colId = (c.column?._id || c.column || '').toString();
        if (!cardsByCol[colId]) cardsByCol[colId] = [];
        cardsByCol[colId].push(c);
      });

      let md = `# 📋 Board: ${b.title}\n`;
      md += `**Board ID**: \`${b._id}\`\n`;
      if (b.description) md += `**Description**: ${b.description}\n`;
      md += `**Columns**: ${columns.length} | **Total Active Tasks**: ${cards.length}\n\n`;

      if (columns.length === 0) {
        md += '_This board has no columns yet. Use `labco_create_column` to add columns._\n';
      } else {
        columns.forEach((col) => {
          const colCards = cardsByCol[col._id.toString()] || [];
          const colTypeStr = col.columnType !== 'none' ? ` (${col.columnType})` : '';
          md += `\n### ── ${col.title}${colTypeStr} [ID: \`${col._id}\`] (${colCards.length} cards)\n`;

          if (colCards.length === 0) {
            md += '  _(No cards in this column)_\n';
          } else {
            colCards.forEach((c) => {
              md += formatCardMd(c) + '\n';
            });
          }
        });
      }

      return textResponse(md);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 3. labco_create_board
 */
server.tool(
  'labco_create_board',
  {
    title: z.string().describe('Title of the new board'),
    description: z.string().optional().describe('Optional description for the board'),
    initialColumns: z
      .array(z.string())
      .optional()
      .describe("Optional initial column names to create (default: ['Backlog', 'In Progress', 'Done'])"),
  },
  async ({ title, description = '', initialColumns = ['Backlog', 'In Progress', 'Done'] }) => {
    try {
      const board = await client.createBoard(title, description);

      const createdColumns = [];
      for (let i = 0; i < initialColumns.length; i++) {
        const colTitle = initialColumns[i];
        let colType = 'none';
        if (i === 0) colType = 'initial';
        if (i === initialColumns.length - 1) colType = 'final';

        const col = await client.createColumn(board._id, colTitle, undefined, colType);
        createdColumns.push(col);
      }

      let res = `Board **"${board.title}"** successfully created!\n`;
      res += `- Board ID: \`${board._id}\`\n`;
      if (createdColumns.length > 0) {
        res += `- Initialized Columns: ${createdColumns.map((c) => `"${c.title}" (\`${c._id}\`)`).join(', ')}\n`;
      }
      return textResponse(res);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 4. labco_create_column
 */
server.tool(
  'labco_create_column',
  {
    board: z.string().describe('Board ID or title'),
    title: z.string().describe("Column name, e.g. 'In Review' or 'Blocked'"),
    color: z.string().optional().describe("Hex color code for column dot, e.g. '#6366f1'"),
    columnType: z
      .enum(['initial', 'final', 'none'])
      .optional()
      .describe("Column type: 'initial' (starts card), 'final' (completes card), or 'none'"),
  },
  async ({ board, title, color, columnType = 'none' }) => {
    try {
      const boardData = await client.findBoard(board);
      const col = await client.createColumn(boardData.board._id, title, color, columnType);
      return textResponse(
        `Column **"${col.title}"** created successfully on board "${boardData.board.title}".\nColumn ID: \`${col._id}\``
      );
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 5. labco_create_card
 */
server.tool(
  'labco_create_card',
  {
    board: z.string().describe('Board ID or title'),
    column: z.string().describe("Column ID or column title where the card should be placed (e.g. 'Backlog')"),
    title: z.string().describe('Title of the task card'),
    description: z.string().optional().describe('Detailed description or markdown content'),
    dueDate: z.string().optional().describe("Optional ISO date string, e.g. '2026-10-20'"),
    checklist: z.array(z.string()).optional().describe('Optional list of checklist subtask titles to add'),
    coverColor: z.string().optional().describe("Optional hex color code for cover banner, e.g. '#ef4444'"),
  },
  async ({ board, column, title, description, dueDate, checklist, coverColor }) => {
    try {
      const boardData = await client.findBoard(board);
      const columnId = await client.resolveColumn(boardData.board._id, column);

      const checklistObjects = checklist?.map((text) => ({ text, completed: false }));

      const card = await client.createCard(columnId, {
        title,
        description,
        dueDate,
        checklist: checklistObjects,
        coverColor,
      });

      let res = `Card **"${card.title}"** created successfully in column!\n`;
      res += `- Card ID: \`${card._id}\`\n`;
      res += `- Column ID: \`${columnId}\`\n`;
      if (card.description) res += `- Description: ${card.description}\n`;
      if (card.dueDate) res += `- Due Date: ${new Date(card.dueDate).toLocaleDateString()}\n`;
      if (checklistObjects?.length) res += `- Subtasks: ${checklistObjects.length} checklist items added\n`;

      return textResponse(res);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 6. labco_update_card
 */
server.tool(
  'labco_update_card',
  {
    cardId: z.string().describe('ID of the card to update'),
    title: z.string().optional().describe('New title for the card'),
    description: z.string().optional().describe('New description for the card'),
    dueDate: z.string().optional().describe("New due date in ISO format, e.g. '2026-10-30'"),
    coverColor: z.string().optional().describe("Hex color code for cover stripe, e.g. '#10b981'"),
  },
  async ({ cardId, title, description, dueDate, coverColor }) => {
    try {
      const updates = {};
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (dueDate !== undefined) updates.dueDate = dueDate;
      if (coverColor !== undefined) updates.coverColor = coverColor;

      const card = await client.updateCard(cardId, updates);
      return textResponse(`Card \`${cardId}\` successfully updated:\n${formatCardMd(card)}`);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 7. labco_move_card
 */
server.tool(
  'labco_move_card',
  {
    cardId: z.string().describe('ID of the card to move'),
    toColumn: z.string().describe("Target Column ID or column title (e.g. 'Done' or 'In Progress')"),
    newOrder: z.number().optional().default(0).describe('Position index in the target column (default: 0 = top)'),
  },
  async ({ cardId, toColumn, newOrder = 0 }) => {
    try {
      const card = await client.getCard(cardId);
      const fromColumnId = (card.column?._id || card.column).toString();
      const boardId = card.board.toString();

      const toColumnId = await client.resolveColumn(boardId, toColumn);

      const moved = await client.moveCard(cardId, fromColumnId, toColumnId, newOrder);
      return textResponse(
        `Card **"${moved.title}"** (\`${cardId}\`) moved to column \`${toColumnId}\` at position ${newOrder}.`
      );
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 8. labco_archive_card
 */
server.tool(
  'labco_archive_card',
  {
    cardId: z.string().describe('ID of the card to archive/delete'),
  },
  async ({ cardId }) => {
    try {
      await client.archiveCard(cardId);
      return textResponse(`Card \`${cardId}\` was successfully archived.`);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 9. labco_manage_checklist
 */
server.tool(
  'labco_manage_checklist',
  {
    cardId: z.string().describe('ID of the card'),
    action: z
      .enum(['add', 'toggle', 'remove'])
      .describe("'add' to add a subtask, 'toggle' to check/uncheck, 'remove' to delete a subtask"),
    text: z.string().optional().describe("Text of the checklist item (required when action is 'add')"),
    itemIndex: z
      .number()
      .optional()
      .describe("0-based index of the checklist item to toggle or remove (when action is 'toggle' or 'remove')"),
  },
  async ({ cardId, action, text, itemIndex }) => {
    try {
      const card = await client.getCard(cardId);
      const checklist = [...(card.checklist || [])];

      if (action === 'add') {
        if (!text?.trim()) throw new Error("text is required when action is 'add'");
        checklist.push({ text: text.trim(), completed: false });
      } else if (action === 'toggle') {
        if (itemIndex === undefined || itemIndex < 0 || itemIndex >= checklist.length) {
          throw new Error(`Invalid itemIndex: ${itemIndex}. Checklist has ${checklist.length} items.`);
        }
        checklist[itemIndex].completed = !checklist[itemIndex].completed;
      } else if (action === 'remove') {
        if (itemIndex === undefined || itemIndex < 0 || itemIndex >= checklist.length) {
          throw new Error(`Invalid itemIndex: ${itemIndex}. Checklist has ${checklist.length} items.`);
        }
        checklist.splice(itemIndex, 1);
      }

      const updated = await client.updateCard(cardId, { checklist });
      return textResponse(`Checklist updated for card "${updated.title}":\n${formatCardMd(updated)}`);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 10. labco_search_cards
 */
server.tool(
  'labco_search_cards',
  {
    query: z.string().describe('Search query matching title, description, or labels'),
    board: z.string().optional().describe('Optional board ID or title to restrict search to'),
  },
  async ({ query, board }) => {
    try {
      const boardsToSearch = [];
      if (board) {
        const boardData = await client.findBoard(board);
        boardsToSearch.push(boardData);
      } else {
        const boards = await client.getBoards();
        for (const b of boards) {
          try {
            const data = await client.getBoard(b._id);
            boardsToSearch.push(data);
          } catch {
            // Skip board if permission error
          }
        }
      }

      const q = query.toLowerCase();
      const matches = [];

      boardsToSearch.forEach(({ board: b, cards = [], columns = [] }) => {
        const colMap = {};
        columns.forEach((c) => {
          colMap[c._id.toString()] = c.title;
        });

        cards.forEach((c) => {
          const titleMatch = c.title?.toLowerCase().includes(q);
          const descMatch = c.description?.toLowerCase().includes(q);
          const checklistMatch = c.checklist?.some((i) => i.text?.toLowerCase().includes(q));

          if (titleMatch || descMatch || checklistMatch) {
            matches.push({
              card: c,
              boardTitle: b.title,
              boardId: b._id,
              columnTitle: colMap[(c.column?._id || c.column).toString()] || 'Unknown',
            });
          }
        });
      });

      if (matches.length === 0) {
        return textResponse(`No cards matching "${query}" were found.`);
      }

      let res = `Found ${matches.length} cards matching "${query}":\n\n`;
      matches.forEach(({ card, boardTitle, columnTitle }) => {
        res += `### [${boardTitle} > ${columnTitle}] ${card.title} (\`${card._id}\`)\n`;
        if (card.description) res += `  ${card.description}\n`;
        if (card.checklist?.length) {
          const done = card.checklist.filter((i) => i.completed).length;
          res += `  Checklist: ${done}/${card.checklist.length} completed\n`;
        }
        res += '\n';
      });

      return textResponse(res);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 11. labco_get_activity
 */
server.tool(
  'labco_get_activity',
  {
    board: z.string().describe('Board ID or title'),
    limit: z.number().optional().default(25).describe('Maximum activity logs to return'),
  },
  async ({ board, limit = 25 }) => {
    try {
      const boardData = await client.findBoard(board);
      const activity = await client.getBoardActivity(boardData.board._id, limit);

      if (!activity || activity.length === 0) {
        return textResponse(`No recent activity found on board "${boardData.board.title}".`);
      }

      let res = `# Recent Activity for "${boardData.board.title}" (${activity.length})\n\n`;
      activity.forEach((act) => {
        const user = act.user?.name || act.user?.email || 'System';
        const date = new Date(act.createdAt).toLocaleString();
        res += `- **${date}** · ${user}: \`${act.type}\`\n`;
      });

      return textResponse(res);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 12. labco_get_discussions
 */
server.tool(
  'labco_get_discussions',
  {
    board: z.string().describe('Board ID or title'),
    limit: z.number().optional().default(30).describe('Maximum messages to return'),
  },
  async ({ board, limit = 30 }) => {
    try {
      const boardData = await client.findBoard(board);
      const messages = await client.getDiscussionMessages(boardData.board._id, limit);

      if (!messages || messages.length === 0) {
        return textResponse(`No messages in #discussion for board "${boardData.board.title}".`);
      }

      let res = `# #discussion on "${boardData.board.title}"\n\n`;
      messages.forEach((m) => {
        const author = m.user?.name || m.user?.email?.split('@')[0] || 'Unknown';
        const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        res += `**${author}** [${time}]: ${m.text || ''}\n`;
        if (m.attachments?.length) {
          res += `  _Attachments: ${m.attachments.map((a) => a.filename).join(', ')}_\n`;
        }
      });

      return textResponse(res);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

/**
 * 13. labco_post_discussion
 */
server.tool(
  'labco_post_discussion',
  {
    board: z.string().describe('Board ID or title'),
    message: z.string().describe('Text of the message to post in the board discussion room'),
  },
  async ({ board, message }) => {
    try {
      const boardData = await client.findBoard(board);
      const msg = await client.postDiscussionMessage(boardData.board._id, message);
      return textResponse(`Message posted to #${boardData.board.title} discussion: "${msg.text}"`);
    } catch (err) {
      return errorResponse(err);
    }
  }
);

// ============================================================================
// RESOURCES
// ============================================================================

server.resource(
  'boards',
  'labco://boards',
  async () => {
    try {
      const boards = await client.getBoards();
      return {
        contents: [
          {
            uri: 'labco://boards',
            mimeType: 'application/json',
            text: JSON.stringify(boards, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        contents: [
          {
            uri: 'labco://boards',
            mimeType: 'text/plain',
            text: `Error loading boards: ${err.message}`,
          },
        ],
      };
    }
  }
);

server.resource(
  'board-details',
  new ResourceTemplate('labco://boards/{boardId}', { list: undefined }),
  async (uri, { boardId }) => {
    try {
      const data = await client.getBoard(boardId);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'application/json',
            text: JSON.stringify(data, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/plain',
            text: `Error loading board ${boardId}: ${err.message}`,
          },
        ],
      };
    }
  }
);

// ============================================================================
// PROMPTS
// ============================================================================

server.prompt(
  'daily_standup',
  { board: z.string().describe('Board ID or title') },
  ({ board }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Please inspect the LabCo Kanban board "${board}" using the \`labco_get_board\` tool and prepare a structured daily standup report:
1. Completed Tasks (Done column)
2. Currently In Progress (Active development)
3. Blockers, Overdue items, or tasks with low checklist progress
4. Recommended next actions for the team`,
        },
      },
    ],
  })
);

server.prompt(
  'sprint_planning',
  {
    board: z.string().describe('Board ID or title'),
    featureDescription: z.string().describe('Description of the feature, epic, or sprint goal to break down'),
  },
  ({ board, featureDescription }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `We need to plan and implement the following feature on our LabCo board "${board}":
"${featureDescription}"

Please:
1. Check the existing columns and cards on "${board}" using \`labco_get_board\`.
2. Propose a breakdown into clear, actionable cards with descriptions and subtask checklists.
3. Ask for confirmation before creating them, or create them directly in the Backlog/In Progress columns using \`labco_create_card\`.`,
        },
      },
    ],
  })
);

// ============================================================================
// SERVER INITIALIZATION (STDIO TRANSPORT)
// ============================================================================

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 LabCo MCP Server running on stdio');
}

run().catch((err) => {
  console.error('Fatal error running LabCo MCP Server:', err);
  process.exit(1);
});
