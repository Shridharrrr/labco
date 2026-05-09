# AGENT.md — Real-time Collaborative Task Board

> This file describes the complete architecture, folder structure, data models, API contracts, socket events, and Zustand slice design for the project. Read this before writing any code.

---

## Project Overview

A real-time collaborative Kanban board where multiple users can manage shared tasks simultaneously. Built with the MERN stack (MongoDB, Express, React, Node.js), Zustand for client state management, and Socket.io for real-time sync.

**Core value:** Multiple users on the same board always see the same state — live, without refreshing. Cards can be created, moved, and deleted by any collaborator and every connected client updates instantly.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| State management | Zustand (sliced architecture) |
| Drag and drop | @dnd-kit/core + @dnd-kit/sortable |
| Styling | Tailwind CSS |
| Real-time client | socket.io-client |
| HTTP client | Axios |
| Backend runtime | Node.js + Express.js |
| Real-time server | Socket.io |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens) + bcrypt |
| Session/Presence | Redis |
| File uploads | Multer + Cloudinary |
| Email | Nodemailer |

---

## Folder Structure

```
/
├── client/                        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── board/
│   │   │   │   ├── Board.jsx              # Main kanban view
│   │   │   │   ├── Column.jsx             # Single column (droppable)
│   │   │   │   ├── Card.jsx               # Single card (draggable)
│   │   │   │   ├── CardModal.jsx          # Card detail modal
│   │   │   │   ├── AddCardForm.jsx        # Inline card creation
│   │   │   │   └── AddColumnForm.jsx      # Inline column creation
│   │   │   ├── presence/
│   │   │   │   ├── OnlineAvatars.jsx      # Live user avatars at top
│   │   │   │   └── LiveCursor.jsx         # Other users' cursors
│   │   │   ├── activity/
│   │   │   │   └── ActivityDrawer.jsx     # Right-side activity log
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   └── RegisterForm.jsx
│   │   │   └── ui/
│   │   │       ├── Toast.jsx
│   │   │       ├── Modal.jsx
│   │   │       ├── Avatar.jsx
│   │   │       ├── Badge.jsx
│   │   │       └── Spinner.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js               # Socket connection + event binding
│   │   │   ├── useBoardSync.js            # Binds socket events to board slice
│   │   │   ├── useDragHandlers.js         # dnd-kit drag logic
│   │   │   └── useOptimistic.js           # Optimistic update + rollback helper
│   │   ├── store/
│   │   │   ├── index.js                   # Combine all slices
│   │   │   ├── boardSlice.js              # Columns, cards, drag, undo/redo
│   │   │   ├── authSlice.js               # User, JWT, persist middleware
│   │   │   ├── uiSlice.js                 # Modals, toasts, sidebars
│   │   │   └── presenceSlice.js           # Online users, cursors
│   │   ├── services/
│   │   │   ├── api.js                     # Axios instance + interceptors
│   │   │   ├── boardService.js            # Board REST calls
│   │   │   ├── cardService.js             # Card REST calls
│   │   │   └── authService.js             # Auth REST calls
│   │   ├── pages/
│   │   │   ├── Home.jsx                   # My boards dashboard
│   │   │   ├── BoardPage.jsx              # Single board view
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   ├── dnd.js                     # dnd-kit helpers
│   │   │   └── date.js                    # Date formatting helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                        # Express backend
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                      # MongoDB connection
│   │   │   ├── redis.js                   # Redis client
│   │   │   └── cloudinary.js              # Cloudinary config
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Board.js
│   │   │   ├── Column.js
│   │   │   ├── Card.js
│   │   │   └── Activity.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── board.routes.js
│   │   │   ├── column.routes.js
│   │   │   ├── card.routes.js
│   │   │   └── activity.routes.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── board.controller.js
│   │   │   ├── column.controller.js
│   │   │   ├── card.controller.js
│   │   │   └── activity.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         # JWT verify
│   │   │   ├── boardAccess.middleware.js  # Role check (owner/editor/viewer)
│   │   │   └── errorHandler.js
│   │   ├── socket/
│   │   │   ├── index.js                   # Socket.io server init
│   │   │   ├── boardHandlers.js           # card:move, card:create, etc.
│   │   │   └── presenceHandlers.js        # user:join, user:cursor
│   │   ├── services/
│   │   │   ├── activity.service.js        # Write activity log entries
│   │   │   ├── presence.service.js        # Redis online user tracking
│   │   │   └── email.service.js           # Nodemailer notifications
│   │   └── app.js                         # Express app setup
│   ├── server.js                          # Entry point, HTTP + Socket server
│   └── .env
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## MongoDB Schemas

### User
```js
{
  _id: ObjectId,
  name: String,                          // display name
  email: String,                         // unique, indexed
  passwordHash: String,
  avatar: String,                        // cloudinary URL or initials fallback
  refreshToken: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Board
```js
{
  _id: ObjectId,
  title: String,
  description: String,
  owner: ObjectId,                       // ref: User
  members: [
    {
      user: ObjectId,                    // ref: User
      role: String                       // "owner" | "editor" | "viewer"
    }
  ],
  columns: [ObjectId],                   // ordered ref: Column
  background: String,                    // hex or gradient string
  isArchived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Column
```js
{
  _id: ObjectId,
  title: String,
  board: ObjectId,                       // ref: Board
  cards: [ObjectId],                     // ordered ref: Card
  order: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Card
```js
{
  _id: ObjectId,
  title: String,
  description: String,                   // markdown supported
  column: ObjectId,                      // ref: Column
  board: ObjectId,                       // ref: Board (for fast queries)
  order: Number,
  assignees: [ObjectId],                 // ref: User
  labels: [{ text: String, color: String }],
  dueDate: Date,
  checklist: [
    { text: String, completed: Boolean }
  ],
  attachments: [
    { url: String, filename: String, uploadedAt: Date }
  ],
  comments: [
    {
      author: ObjectId,                  // ref: User
      text: String,
      createdAt: Date
    }
  ],
  coverColor: String,
  isArchived: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Activity
```js
{
  _id: ObjectId,
  board: ObjectId,                       // ref: Board
  user: ObjectId,                        // ref: User
  type: String,                          // "card.moved" | "card.created" | "card.deleted" | "member.added" | etc.
  payload: Object,                       // { cardId, fromColumn, toColumn, ... }
  createdAt: Date
}
```

---

## REST API Endpoints

All routes prefixed with `/api`. Protected routes require `Authorization: Bearer <accessToken>` header.

### Auth
```
POST   /api/auth/register          — Create account
POST   /api/auth/login             — Returns accessToken + sets refreshToken cookie
POST   /api/auth/refresh           — Rotate access token using refresh cookie
POST   /api/auth/logout            — Invalidate refresh token
GET    /api/auth/me                — Get current user profile [protected]
```

### Boards
```
GET    /api/boards                 — Get all boards for current user [protected]
POST   /api/boards                 — Create new board [protected]
GET    /api/boards/:boardId        — Get full board with columns + cards [protected]
PATCH  /api/boards/:boardId        — Update title, description, background [protected]
DELETE /api/boards/:boardId        — Archive board (soft delete) [owner only]
POST   /api/boards/:boardId/members         — Invite member [owner only]
PATCH  /api/boards/:boardId/members/:userId — Change member role [owner only]
DELETE /api/boards/:boardId/members/:userId — Remove member [owner only]
```

### Columns
```
POST   /api/boards/:boardId/columns         — Create column [editor+]
PATCH  /api/columns/:columnId              — Rename column [editor+]
DELETE /api/columns/:columnId              — Delete column + its cards [editor+]
PATCH  /api/boards/:boardId/columns/reorder — Reorder columns array [editor+]
```

### Cards
```
POST   /api/columns/:columnId/cards        — Create card [editor+]
GET    /api/cards/:cardId                  — Get single card detail [protected]
PATCH  /api/cards/:cardId                  — Update any card field [editor+]
DELETE /api/cards/:cardId                  — Archive card [editor+]
PATCH  /api/cards/:cardId/move             — Move card (column + order) [editor+]
POST   /api/cards/:cardId/attachments      — Upload file (Multer) [editor+]
DELETE /api/cards/:cardId/attachments/:id  — Remove attachment [editor+]
```

### Activity
```
GET    /api/boards/:boardId/activity       — Paginated activity log [protected]
```

---

## Socket.io Event Contract

The server creates one Socket.io **room per boardId**. Clients join on board mount and leave on unmount.

### Client → Server (emit)

```
board:join          { boardId }
board:leave         { boardId }

card:create         { boardId, columnId, card }
card:update         { boardId, cardId, changes }
card:move           { boardId, cardId, fromColumnId, toColumnId, newOrder }
card:delete         { boardId, cardId, columnId }

column:create       { boardId, column }
column:update       { boardId, columnId, changes }
column:delete       { boardId, columnId }
column:reorder      { boardId, orderedColumnIds }

cursor:move         { boardId, x, y }           // throttled 50ms
```

### Server → Client (broadcast to room, excluding sender)

```
card:created        { card, columnId }
card:updated        { cardId, changes }
card:moved          { cardId, fromColumnId, toColumnId, newOrder }
card:deleted        { cardId, columnId }

column:created      { column }
column:updated      { columnId, changes }
column:deleted      { columnId }
column:reordered    { orderedColumnIds }

user:joined         { user }                    // member came online
user:left           { userId }                  // member went offline
cursor:moved        { userId, x, y }
```

### Error event
```
error               { message, code }           // emitted back to sender on failure
```

---

## Zustand Store Architecture

The store is split into four slices and combined using Zustand's `create` with `immer` middleware.

### boardSlice.js
```js
{
  // State
  board: null,                  // full board object
  columns: {},                  // { [columnId]: Column }
  cards: {},                    // { [cardId]: Card }
  columnOrder: [],              // ordered array of columnIds
  dragState: {
    activeId: null,
    overId: null,
    activeType: null            // "card" | "column"
  },
  undoStack: [],                // array of Immer patches
  redoStack: [],

  // Actions
  setBoard(board),
  addColumn(column),
  updateColumn(columnId, changes),
  deleteColumn(columnId),
  reorderColumns(orderedIds),
  addCard(card),
  updateCard(cardId, changes),
  deleteCard(cardId),
  moveCard({ cardId, fromColumnId, toColumnId, newOrder }),
  setDragState(state),
  clearDragState(),
  applyRemoteUpdate(event, payload),  // called by socket handlers
  undo(),
  redo()
}
```

### authSlice.js
```js
{
  // State (persisted to localStorage via persist middleware)
  user: null,
  accessToken: null,
  isAuthenticated: false,

  // Actions
  setAuth({ user, accessToken }),
  clearAuth(),
  updateUser(changes)
}
```

### uiSlice.js
```js
{
  // State
  activeCardId: null,           // card open in modal
  isActivityOpen: false,
  toasts: [],                   // [{ id, message, type }]
  isAddingCard: {},             // { [columnId]: boolean }
  isAddingColumn: false,

  // Actions
  openCard(cardId),
  closeCard(),
  toggleActivity(),
  addToast({ message, type }),
  removeToast(id),
  setAddingCard(columnId, bool),
  setAddingColumn(bool)
}
```

### presenceSlice.js
```js
{
  // State
  onlineUsers: [],              // [{ userId, name, avatar, color }]
  cursors: {},                  // { [userId]: { x, y } }

  // Actions
  userJoined(user),
  userLeft(userId),
  updateCursor(userId, { x, y }),
  clearPresence()
}
```

---

## Optimistic Update Pattern

Every write operation follows this pattern to keep the UI snappy:

```
1. Snapshot current Zustand state (for rollback)
2. Apply change to Zustand immediately (user sees update at 0ms)
3. Emit socket event to server
4. Also fire REST API call (source of truth write)
5a. On success: server broadcasts to other clients — they apply via applyRemoteUpdate()
5b. On error: rollback Zustand to snapshot, show toast error
```

The sender does NOT apply the server's broadcast back (socket skips sender by design with `socket.to(room).emit`), so there is no double-update.

---

## Authentication Flow

```
Register/Login
  → Server returns accessToken (15min JWT) in response body
  → Server sets refreshToken (7day JWT) as httpOnly cookie
  → Client stores accessToken in authSlice (Zustand + localStorage via persist)

Every API request
  → Axios interceptor attaches Authorization: Bearer <accessToken>
  → On 401 response: interceptor calls POST /api/auth/refresh automatically
  → New accessToken stored, original request retried

Socket auth
  → Client sends accessToken in socket handshake: { auth: { token } }
  → Server middleware verifies token before allowing room join

Logout
  → POST /api/auth/logout (invalidates refresh token in DB)
  → clearAuth() on authSlice
  → Socket disconnects
```

---

## Board Permissions

Three roles enforced in `boardAccess.middleware.js`:

| Action | Viewer | Editor | Owner |
|---|---|---|---|
| View board | ✅ | ✅ | ✅ |
| Create/move/edit cards | ❌ | ✅ | ✅ |
| Create/rename columns | ❌ | ✅ | ✅ |
| Invite members | ❌ | ❌ | ✅ |
| Delete board | ❌ | ❌ | ✅ |

---

## Redis Usage

Redis is used for two purposes only:

1. **Presence tracking** — When a user joins a board room, their userId is added to a Redis Set keyed `presence:${boardId}`. On disconnect, removed. The server queries this set to return the current online users list on `board:join`.

2. **Refresh token store** — Refresh tokens are stored in Redis with TTL=7days as a fast invalidation layer (so logout works instantly without a DB query on every refresh).

---

## Environment Variables

### Server (`server/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kanban
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
CLIENT_URL=http://localhost:5173
```

### Client (`client/.env`)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Key Implementation Notes for the Agent

- **Never mutate Zustand state directly.** Always use `set()` or Immer's `produce` inside slice actions.
- **Socket event handlers live in `useBoardSync.js`**, not in components. This hook subscribes to socket events and calls the corresponding boardSlice or presenceSlice actions.
- **`applyRemoteUpdate()`** in boardSlice is the single entry point for all incoming socket events. It receives an event name and payload and routes to the correct slice action. This prevents duplicated logic.
- **Drag and drop uses `@dnd-kit`**, not `react-beautiful-dnd` (which is unmaintained). The drag handlers update `columnOrder` or the card order inside a column optimistically, then emit `card:move` or `column:reorder`.
- **Column order and card order** are stored as ordered arrays of IDs (not a numeric `order` field) on the client. On the server, the `order` field is a number for simple sorting. Reconcile on `board:join` fetch.
- **Activity log** is append-only. Never update or delete activity documents. Write an activity entry in every controller action that mutates board data.
- **File uploads** go through Multer (memory storage) → Cloudinary upload stream → URL saved to card's attachments array. Never store files in MongoDB.
- **Cursor relay** must be throttled on the client (50ms) and on the server. Do not broadcast cursor events to Redis or MongoDB — they are ephemeral and only go through Socket.io.
- **All socket handlers on the server must verify board membership** before broadcasting. Do not trust the client's claimed boardId — look up the socket's authenticated userId and confirm they are a member of that board.

---

## Development Setup

```bash
# 1. Start MongoDB and Redis (Docker recommended)
docker-compose up -d

# 2. Install and run server
cd server
npm install
npm run dev        # nodemon server.js on port 5000

# 3. Install and run client
cd client
npm install
npm run dev        # Vite on port 5173
```

`docker-compose.yml` should define services for `mongo` (port 27017) and `redis` (port 6379) with named volumes for persistence.
