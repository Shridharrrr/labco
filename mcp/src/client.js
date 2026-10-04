import { io } from 'socket.io-client';

/**
 * LabCoApiClient — Handles HTTP communication and real-time Socket.io
 * updates with the LabCo Express/MongoDB backend.
 */
export class LabCoApiClient {
  constructor(options = {}) {
    this.apiUrl = (options.apiUrl || process.env.LABCO_API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');
    this.baseUrl = this.apiUrl.replace(/\/api$/, '');
    this.token = options.token || process.env.LABCO_TOKEN || process.env.LABCO_API_KEY || null;
    this.email = options.email || process.env.LABCO_EMAIL || null;
    this.password = options.password || process.env.LABCO_PASSWORD || null;
    this.user = null;
    this.socket = null;
    this.enableRealtime = options.enableRealtime ?? true;
  }

  /**
   * Log messages to stderr only so stdio JSON-RPC (stdout) is NEVER corrupted.
   */
  log(...args) {
    console.error('[LabCo MCP]', ...args);
  }

  /**
   * Ensure user is authenticated. Acquires or refreshes token if needed.
   */
  async ensureAuthenticated() {
    if (this.token) {
      if (!this.socket && this.enableRealtime) {
        this.initSocket();
      }
      return this.token;
    }

    if (!this.email || !this.password) {
      throw new Error(
        'Authentication required. Please set LABCO_TOKEN in your MCP configuration, or set both LABCO_EMAIL and LABCO_PASSWORD.'
      );
    }

    this.log(`Authenticating as ${this.email}...`);
    const res = await fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: this.email, password: this.password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Authentication failed (${res.status}): ${data.message || res.statusText}`);
    }

    this.token = data.accessToken;
    this.user = data.user;
    this.log(`Successfully authenticated as ${data.user?.name || data.user?.email} (${data.user?._id})`);

    if (this.enableRealtime) {
      this.initSocket();
    }

    return this.token;
  }

  /**
   * Initialise optional real-time Socket.io connection for live broadcast.
   */
  initSocket() {
    if (this.socket || !this.token) return;
    try {
      this.socket = io(this.baseUrl, {
        auth: { token: this.token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        this.log(`Socket connected for real-time board updates (${this.socket.id})`);
      });

      this.socket.on('connect_error', (err) => {
        this.log(`Socket connection warning: ${err.message}`);
      });
    } catch (err) {
      this.log('Could not initialize socket client (non-critical):', err.message);
    }
  }

  /**
   * Join a board room on Socket.io so live events are broadcasted.
   */
  joinBoardRoom(boardId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('board:join', { boardId });
    }
  }

  /**
   * Generic authenticated API request with automatic 401 retry.
   */
  async request(endpoint, options = {}, isRetry = false) {
    const token = await this.ensureAuthenticated();
    const url = `${this.apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    // If 401 and we have email/password, refresh and retry once
    if (res.status === 401 && !isRetry && this.email && this.password) {
      this.log('Token expired or invalid, refreshing session...');
      this.token = null;
      return this.request(endpoint, options, true);
    }

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const body = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMessage = isJson && body.message ? body.message : `HTTP ${res.status}: ${res.statusText}`;
      throw new Error(errorMessage);
    }

    return body;
  }

  // ── BOARD METHODS ──────────────────────────────────────────────────────────

  /**
   * List all boards accessible to the authenticated user.
   */
  async getBoards() {
    return this.request('/boards');
  }

  /**
   * Get full details of a board including columns and cards.
   */
  async getBoard(boardId) {
    const data = await this.request(`/boards/${boardId}`);
    this.joinBoardRoom(boardId);
    return data;
  }

  /**
   * Fuzzy find board by ID or title (case-insensitive).
   */
  async findBoard(idOrTitle) {
    if (!idOrTitle) throw new Error('board identifier (ID or title) is required');

    // If it looks like a Mongo ObjectId (24 hex chars)
    if (/^[0-9a-fA-F]{24}$/.test(idOrTitle.trim())) {
      try {
        return await this.getBoard(idOrTitle.trim());
      } catch {
        // Fallback to searching by title if not found by ID
      }
    }

    const boards = await this.getBoards();
    const target = idOrTitle.trim().toLowerCase();
    const match = boards.find(
      (b) => b.title.toLowerCase() === target || b.title.toLowerCase().includes(target)
    );

    if (!match) {
      throw new Error(`Board matching "${idOrTitle}" not found. Available boards: ${boards.map(b => `"${b.title}"`).join(', ')}`);
    }

    return this.getBoard(match._id);
  }

  /**
   * Create a new board.
   */
  async createBoard(title, description = '', background = '') {
    if (!title?.trim()) throw new Error('title is required');
    return this.request('/boards', {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), description, background }),
    });
  }

  /**
   * Update board properties.
   */
  async updateBoard(boardId, updates) {
    return this.request(`/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Archive/delete a board (owner only).
   */
  async archiveBoard(boardId) {
    return this.request(`/boards/${boardId}`, { method: 'DELETE' });
  }

  // ── COLUMN METHODS ─────────────────────────────────────────────────────────

  /**
   * Create a new column in a board.
   */
  async createColumn(boardId, title, color = '#6366f1', columnType = 'none') {
    if (!title?.trim()) throw new Error('title is required');
    const col = await this.request(`/boards/${boardId}/columns`, {
      method: 'POST',
      body: JSON.stringify({ title: title.trim(), color, columnType }),
    });

    if (this.socket?.connected) {
      this.socket.emit('column:create', { boardId, column: col });
    }

    return col;
  }

  /**
   * Update a column.
   */
  async updateColumn(columnId, updates) {
    const col = await this.request(`/columns/${columnId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (this.socket?.connected && col.board) {
      this.socket.emit('column:update', { boardId: col.board, columnId, changes: updates });
    }

    return col;
  }

  /**
   * Delete a column.
   */
  async deleteColumn(columnId, boardId = null) {
    const res = await this.request(`/columns/${columnId}`, { method: 'DELETE' });
    if (this.socket?.connected && boardId) {
      this.socket.emit('column:delete', { boardId, columnId });
    }
    return res;
  }

  // ── CARD METHODS ───────────────────────────────────────────────────────────

  /**
   * Helper to resolve columnId from column name or ID within a board.
   */
  async resolveColumn(boardId, columnIdOrName) {
    if (/^[0-9a-fA-F]{24}$/.test(columnIdOrName.trim())) {
      return columnIdOrName.trim();
    }

    const { columns } = await this.getBoard(boardId);
    const target = columnIdOrName.trim().toLowerCase();
    const match = columns.find(
      (c) => c.title.toLowerCase() === target || c.title.toLowerCase().includes(target)
    );

    if (!match) {
      throw new Error(`Column "${columnIdOrName}" not found in board. Available columns: ${columns.map(c => `"${c.title}"`).join(', ')}`);
    }

    return match._id;
  }

  /**
   * Create a new card in a column.
   */
  async createCard(columnId, cardData) {
    if (!cardData?.title?.trim()) throw new Error('title is required');
    const card = await this.request(`/columns/${columnId}/cards`, {
      method: 'POST',
      body: JSON.stringify(cardData),
    });

    // If optional fields (checklist, dueDate, priority/labels, coverColor) were passed, update them
    const updates = {};
    if (cardData.checklist?.length) updates.checklist = cardData.checklist;
    if (cardData.dueDate) updates.dueDate = cardData.dueDate;
    if (cardData.coverColor) updates.coverColor = cardData.coverColor;
    if (cardData.labels?.length) updates.labels = cardData.labels;

    let finalCard = card;
    if (Object.keys(updates).length > 0) {
      finalCard = await this.updateCard(card._id, updates);
    }

    if (this.socket?.connected && finalCard.board) {
      this.socket.emit('card:create', {
        boardId: finalCard.board,
        columnId,
        card: finalCard,
      });
    }

    return finalCard;
  }

  /**
   * Get card details.
   */
  async getCard(cardId) {
    return this.request(`/cards/${cardId}`);
  }

  /**
   * Update a card.
   */
  async updateCard(cardId, updates) {
    const card = await this.request(`/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (this.socket?.connected && card.board) {
      this.socket.emit('card:update', {
        boardId: card.board,
        cardId,
        changes: updates,
      });
    }

    return card;
  }

  /**
   * Move a card to another column or change its order.
   */
  async moveCard(cardId, fromColumnId, toColumnId, newOrder = 0) {
    const card = await this.request(`/cards/${cardId}/move`, {
      method: 'PATCH',
      body: JSON.stringify({ fromColumnId, toColumnId, newOrder }),
    });

    if (this.socket?.connected && card.board) {
      this.socket.emit('card:move', {
        boardId: card.board,
        cardId,
        fromColumnId,
        toColumnId,
        newOrder,
      });
    }

    return card;
  }

  /**
   * Archive a card.
   */
  async archiveCard(cardId) {
    const card = await this.getCard(cardId);
    const res = await this.request(`/cards/${cardId}`, { method: 'DELETE' });

    if (this.socket?.connected && card?.board) {
      this.socket.emit('card:delete', {
        boardId: card.board,
        cardId,
        columnId: card.column?._id || card.column,
      });
    }

    return res;
  }

  // ── ACTIVITY & DISCUSSION ──────────────────────────────────────────────────

  /**
   * Get audit log / activity stream for a board.
   */
  async getBoardActivity(boardId, limit = 30) {
    return this.request(`/boards/${boardId}/activity?limit=${limit}`);
  }

  /**
   * Get discussion messages for a board.
   */
  async getDiscussionMessages(boardId, limit = 50) {
    return this.request(`/boards/${boardId}/messages?limit=${limit}`);
  }

  /**
   * Post a discussion message to a board.
   */
  async postDiscussionMessage(boardId, text) {
    if (!text?.trim()) throw new Error('text is required');
    return this.request(`/boards/${boardId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text: text.trim() }),
    });
  }
}
