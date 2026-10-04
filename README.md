# LabCo - Real-time Collaborative Kanban Board

LabCo is a full-stack, real-time Kanban board built for teams that want smooth, instant task management. Whenever someone moves a card, edits a checklist, creates a column, or sends a message, everyone currently viewing that board sees the update immediately without having to refresh the page.

The application combines a React frontend with an Express and Socket.io backend, backed by MongoDB for persistence, Redis for presence and token storage, and Zustand for snappy state management with optimistic UI updates.

---

## Table of Contents

- Overview
- Core Features
- Technology Stack
- Architecture and Concepts
  - Real-time Synchronization
  - Optimistic Updates with Rollback
  - Authentication and Security
  - Live Presence and Cursors
- Project Structure
- Prerequisites
- Getting Started
  - 1. Clone the Repository
  - 2. Start MongoDB and Redis
  - 3. Backend Setup
  - 4. Frontend Setup
- Environment Variables Reference
  - Server Environment Variables
  - Client Environment Variables
- Roles and Permissions
- Model Context Protocol (MCP) for Claude & AI Agents
- Socket.io Events
- REST API Reference
- Common Issues and Troubleshooting
- License

---

## Overview

Most task boards are either built for solo use or rely on frequent polling and manual page reloads to show what colleagues are doing. LabCo treats board collaboration as a live multi-user canvas.

When you join a board:
- You see avatars for everyone currently on the board with you.
- You can watch collaborators' cursors move in real time across cards and columns.
- Card movements, edits, and reordering feel instantaneous thanks to client-side optimistic updates.
- If a server validation error or network failure occurs, the board gracefully rolls back to its previous state and notifies you.
- You can chat directly inside the board and review a chronological audit log of all changes.

---

## Core Features

- Board Management: Create multiple boards, customize their background color or gradient, update board titles, invite collaborators via email, and archive finished boards.
- Columns and Cards: Create, edit, rename, and reorder columns. Add cards with titles, detailed markdown descriptions, color-coded priority labels, due dates, and checklist items.
- Smooth Drag and Drop: Powered by @dnd-kit, allowing you to drag cards between columns or reorder them within a column with smooth animations and keyboard accessibility.
- Live Collaboration and Presence: Real-time broadcasts powered by Socket.io. See who is currently viewing the board and follow their mouse cursors across the screen.
- File Attachments: Upload attachments (images, PDFs, documents) to individual cards with storage handled through Cloudinary.
- Comments and Discussion: Team members can comment on cards to keep discussion focused on specific tasks.
- In-Board Chat: A real-time message stream scoped to the active board so teammates can communicate without switching tabs.
- Activity Audit Trail: Every card creation, update, move, and member addition is recorded into an append-only activity feed.
- Role-based Permissions: Distinct permissions for Owners, Editors, and Viewers to ensure that sensitive operations like archiving boards or adding members remain restricted.
- Multiple Login Options: Traditional email and password signup with verification links, alongside one-click Google OAuth authentication.
- Robust Token Refresh: Secure access and refresh token rotation where access tokens live in memory/client state and refresh tokens are securely stored in httpOnly cookies and Redis.

---

## Technology Stack

### Frontend
- Framework: React 19 with Vite for fast local builds and hot module replacement.
- State Management: Zustand combined with Immer for structured, immutable slice management.
- Drag and Drop: @dnd-kit/core, @dnd-kit/sortable, and @dnd-kit/utilities.
- Styling: Tailwind CSS v4 for modern utility classes and responsive layouts.
- Routing: React Router v7 with protected and guest route wrappers.
- Real-time Client: socket.io-client for WebSocket communication.
- HTTP Client: Axios with automatic request interception and 401 token refresh handling.
- Social Authentication: @react-oauth/google for Google Identity Services.

### Backend
- Runtime: Node.js with Express.js for the HTTP REST API.
- Real-time Server: Socket.io for handling WebSocket rooms and event broadcasting.
- Database: MongoDB with Mongoose for schema modeling and relationship handling.
- Cache and Presence: Redis (via ioredis) for fast active user presence tracking and refresh token blacklisting.
- Authentication: JSON Web Tokens (jsonwebtoken) and bcryptjs for password hashing.
- File Uploads: Multer (memory storage) streaming directly to Cloudinary.
- Email Service: Nodemailer for sending transactional verification and invite emails.
- OAuth Verification: google-auth-library for validating Google ID tokens on the server.

### Infrastructure
- Docker Compose: Pre-configured local containers for MongoDB and Redis.

---

## Architecture and Concepts

### Real-time Synchronization

Socket.io rooms are partitioned by board ID (`board:<boardId>`). When a user navigates to a board page:
1. The client joins the room via the `board:join` event.
2. The server verifies that the user is an active member or owner of the board.
3. Once verified, the server subscribes the socket to that board room.
4. When a mutation occurs (such as moving a card or adding a column), the initiator sends the change to the server.
5. The server persists the change to MongoDB, adds an entry to the activity log, and broadcasts the event to all other clients in the room using `socket.to(boardId).emit(...)`.
6. Other connected clients receive the event and apply it to their local Zustand store through `applyRemoteUpdate()`.

Because broadcasts exclude the original sender, the client that initiated the action never receives an echo of its own changes.

### Optimistic Updates with Rollback

To give the board a zero-latency feel, state changes are applied to the local Zustand store immediately before the server responds:
1. The UI snapshots the current state.
2. The user's action immediately updates the store and the interface reflects the new position or text.
3. The client sends the mutation to both the REST API (for database persistence) and Socket.io (for immediate peer notification).
4. If the server request succeeds, the action is complete.
5. If the request fails (due to network timeout, permission rejection, or server error), the store reverts to the saved snapshot and displays an error toast.

### Authentication and Security

LabCo uses a dual-token strategy designed to balance security with a seamless user experience:
- Access Token: A short-lived JSON Web Token (15 minutes by default) passed via the `Authorization: Bearer <token>` header and included during Socket.io handshake authentication.
- Refresh Token: A longer-lived token (7 days by default) saved inside an `httpOnly`, `SameSite` cookie and tracked in Redis.
- Automatic Renewal: When an API request returns a 401 Unauthorized status, the Axios response interceptor catches the failure, calls `/api/auth/refresh` behind the scenes, stores the fresh access token, and retries the original request.
- Instant Revocation: When a user logs out, the refresh token is cleared from the cookie and deleted from Redis, invalidating any further refresh attempts immediately.

### Live Presence and Cursors

- Active Members: When a user connects to a board room, their user ID is stored in a Redis Set keyed `presence:<boardId>`. The list of online users is broadcast to everyone in the room. When the socket disconnects, the user ID is removed from the set.
- Mouse Cursors: Cursor coordinates are throttled on the client (50ms interval) before being emitted to the room. The server relays these positions to other room members without writing to Redis or MongoDB, ensuring low server overhead.

---

## Project Structure

```
labco/
├── docker-compose.yml          # Local MongoDB and Redis services
├── README.md                   # Project documentation
├── AGENT.md                    # Technical specification and architecture notes
│
├── client/                     # Frontend React application
│   ├── index.html              # HTML entry template
│   ├── package.json            # Client dependencies and scripts
│   ├── vite.config.js          # Vite configuration
│   └── src/
│       ├── main.jsx            # React root mount point
│       ├── App.jsx             # Top-level routing and route guards
│       ├── components/
│       │   ├── auth/           # Login, registration, and invite acceptance forms
│       │   ├── board/          # Board canvas, columns, cards, and modal dialogs
│       │   ├── activity/       # Activity drawer and audit logs
│       │   ├── presence/       # Live user avatar list and collaborator cursors
│       │   ├── layout/         # Navigation bar and application shell
│       │   └── ui/             # Reusable UI primitives (buttons, modals, toasts)
│       ├── hooks/              # Custom hooks for sockets, drag-and-drop, and sync
│       ├── store/              # Sliced Zustand stores (auth, board, ui, presence)
│       ├── services/           # Axios instance and API call modules
│       ├── pages/              # Page views (Home, BoardPage, LandingPage)
│       └── utils/              # Helper utilities for dates, colors, and dnd logic
│
└── server/                     # Backend Node.js and Express application
    ├── server.js               # Server entry point (HTTP + Socket.io listener)
    ├── package.json            # Server dependencies and scripts
    └── src/
        ├── app.js              # Express app configuration and middleware
        ├── config/             # Database (MongoDB), Redis, and Cloudinary setup
        ├── controllers/        # Request handlers for auth, boards, columns, cards
        ├── middleware/         # Auth verification, role checks, and error handling
        ├── models/             # Mongoose schemas (User, Board, Column, Card, etc.)
        ├── routes/             # REST route declarations
        ├── services/           # Email sender, Redis presence, and activity logging
        └── socket/             # Socket.io connection handlers and room events
```

---

## Prerequisites

Before setting up LabCo locally, ensure you have the following installed:

- Node.js: v18.0.0 or higher (v20+ recommended)
- npm: v9.0.0 or higher (comes with Node.js)
- Docker and Docker Compose: Recommended for starting MongoDB and Redis locally with zero manual setup. If you prefer not to use Docker, you can install and run MongoDB and Redis natively.
- Git: For version control.

Optional services for full functionality:
- Cloudinary account: For uploading task attachments and profile pictures.
- SMTP email account: For sending board invitations and account verification emails (Gmail App Password, Mailtrap, or SendGrid).
- Google Cloud Console client ID: For Google OAuth login.

---

## Getting Started

Follow these steps to run the complete stack locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Shridharrrr/labco.git
cd labco
```

### 2. Start MongoDB and Redis

The project includes a `docker-compose.yml` file that provisions both MongoDB and Redis with persistent volumes.

Run the following command from the project root:

```bash
docker-compose up -d
```

To verify both containers are running properly:

```bash
docker-compose ps
```

You should see `labco-mongodb` on port 27017 and `labco-redis` on port 6379 in the running state.

### 3. Backend Setup

Open a terminal and navigate to the `server` directory:

```bash
cd server
npm install
```

Create an environment configuration file named `.env` inside the `server` directory:

```bash
cp .env.example .env
```

If `.env.example` does not exist yet, create `server/.env` manually and populate it with the following baseline values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database & Cache
MONGODB_URI=mongodb://localhost:27017/kanban
REDIS_URL=redis://localhost:6379

# JWT Secrets (replace with long, random strings in production)
JWT_ACCESS_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# File Uploads (Optional: Cloudinary credentials)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email Notifications (Optional: SMTP credentials for invites)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="LabCo" <noreply@labco.com>

# Google Authentication (Optional: matches client ID)
GOOGLE_CLIENT_ID=
```

Start the backend server in development mode:

```bash
npm run dev
```

The server will connect to MongoDB, attach Socket.io, and start listening on `http://localhost:5000`. You should see:
```
Server running on http://localhost:5000
MongoDB connected
```

### 4. Frontend Setup

Open a second terminal window and navigate to the `client` directory:

```bash
cd client
npm install
```

Create a client environment file named `.env` inside the `client` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your-google-client-id-if-configured
```

Start the Vite development server:

```bash
npm run dev
```

The client will be available at `http://localhost:5173`. Open your browser and navigate to that URL.

---

## Environment Variables Reference

### Server Environment Variables (`server/.env`)

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| PORT | Port number the Express and Socket.io server listens on | 5000 | No |
| NODE_ENV | Runtime environment (`development` or `production`) | development | No |
| CLIENT_URL | Frontend application origin used for CORS and email links | http://localhost:5173 | Yes |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/kanban | Yes |
| REDIS_URL | Redis connection string used for presence and tokens | redis://localhost:6379 | Yes |
| JWT_ACCESS_SECRET | Secret key used to sign access tokens | Random 32+ character string | Yes |
| JWT_REFRESH_SECRET | Secret key used to sign refresh tokens | Random 32+ character string | Yes |
| JWT_ACCESS_EXPIRES | Expiration time for access tokens | 15m | No |
| JWT_REFRESH_EXPIRES | Expiration time for refresh tokens | 7d | No |
| CLOUDINARY_CLOUD_NAME | Cloudinary account cloud name | (your cloud name) | Optional |
| CLOUDINARY_API_KEY | Cloudinary account API key | (your api key) | Optional |
| CLOUDINARY_API_SECRET | Cloudinary account API secret | (your api secret) | Optional |
| SMTP_HOST | Outgoing SMTP mail server | smtp.gmail.com | Optional |
| SMTP_PORT | Outgoing SMTP port (587 for STARTTLS, 465 for SSL) | 587 | Optional |
| SMTP_SECURE | Whether to use SSL for SMTP (`true` or `false`) | false | Optional |
| SMTP_USER | SMTP username or email address | (your email) | Optional |
| SMTP_PASS | SMTP application password | (your app password) | Optional |
| SMTP_FROM | Name and sender email address on outgoing messages | "LabCo" <noreply@labco.com> | Optional |
| GOOGLE_CLIENT_ID | Google OAuth client ID for token verification | (your google client id) | Optional |

### Client Environment Variables (`client/.env`)

| Variable | Description | Default / Example | Required |
|---|---|---|---|
| VITE_API_BASE_URL | Base URL for REST API calls | http://localhost:5000/api | Yes |
| VITE_SOCKET_URL | WebSocket host URL for Socket.io | http://localhost:5000 | Yes |
| VITE_GOOGLE_CLIENT_ID | Public Google OAuth client ID for web sign-in | (your google client id) | Optional |

---

## Roles and Permissions

LabCo supports three membership roles on each board. Permissions are enforced by the backend on both REST endpoints and incoming Socket.io messages:

| Permission | Viewer | Editor | Owner |
|---|---|---|---|
| View board, columns, and cards | Allowed | Allowed | Allowed |
| Read board chat and activity log | Allowed | Allowed | Allowed |
| Send in-board chat messages | Allowed | Allowed | Allowed |
| Create, update, and reorder cards | Restricted | Allowed | Allowed |
| Create, rename, and reorder columns | Restricted | Allowed | Allowed |
| Upload attachments and add comments | Restricted | Allowed | Allowed |
| Delete cards or columns | Restricted | Allowed | Allowed |
| Invite new members via email | Restricted | Restricted | Allowed |
| Change member roles or remove members | Restricted | Restricted | Allowed |
| Archive or delete the board | Restricted | Restricted | Allowed |

---

## Model Context Protocol (MCP) for Claude & AI Agents

LabCo includes a first-class **Model Context Protocol (MCP)** server under [`mcp/`](./mcp). This allows **Claude Desktop**, **Claude Code**, **Cursor**, **Zed**, and other MCP-compatible AI clients to connect directly to your boards.

Claude can:
- List and inspect boards, columns, and cards with subtasks and due dates
- Create, update, and move cards across columns autonomously
- Check off subtasks and update checklists
- Search cards across boards
- Post daily standup updates and read discussions
- **Live Sync**: Any card or column created/moved by Claude triggers real-time Socket.io broadcasts, updating open browser windows instantly without refreshing!

### Quick Start for Claude Desktop

1. Navigate to the `mcp` directory and install dependencies:
   ```bash
   cd mcp
   npm install
   ```

2. Generate a 1-year authentication token:
   ```bash
   npm run generate-token -- your_email@example.com
   ```

3. Add the generated configuration block to `%APPDATA%\Claude\claude_desktop_config.json` (or `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):
   ```json
   {
     "mcpServers": {
       "labco": {
         "command": "node",
         "args": ["c:/Users/shrid/OneDrive/Documents/NextJS/nextjs-projects/labco/mcp/src/index.js"],
         "env": {
           "LABCO_API_URL": "http://localhost:5000/api",
           "LABCO_TOKEN": "YOUR_GENERATED_JWT_TOKEN"
         }
       }
     }
   }
   ```

4. Restart Claude Desktop. You will see the 13 LabCo tools available under the hammer icon. For detailed tool documentation and prompt examples, see [`mcp/README.md`](./mcp/README.md).

---

## Socket.io Events

All real-time board events occur inside the room identified by `boardId`.

### Client to Server Events

- `board:join`: Join the specified board room. Payload: `{ boardId }`.
- `board:leave`: Leave the specified board room. Payload: `{ boardId }`.
- `card:create`: Broadcast a newly created card. Payload: `{ boardId, columnId, card }`.
- `card:update`: Broadcast updates to a card. Payload: `{ boardId, cardId, changes }`.
- `card:move`: Broadcast card reordering or column transfer. Payload: `{ boardId, cardId, fromColumnId, toColumnId, newOrder }`.
- `card:delete`: Broadcast a card deletion. Payload: `{ boardId, cardId, columnId }`.
- `column:create`: Broadcast a newly created column. Payload: `{ boardId, column }`.
- `column:update`: Broadcast column renaming or modifications. Payload: `{ boardId, columnId, changes }`.
- `column:delete`: Broadcast a column removal. Payload: `{ boardId, columnId }`.
- `column:reorder`: Broadcast a new column ordering array. Payload: `{ boardId, orderedColumnIds }`.
- `cursor:move`: Send the current user cursor position. Throttled to 50ms. Payload: `{ boardId, x, y }`.

### Server to Client Broadcasts

These events are broadcast to all other clients connected to the same board room:

- `card:created`: Sent when a collaborator adds a card. Payload: `{ card, columnId }`.
- `card:updated`: Sent when a collaborator updates a card. Payload: `{ cardId, changes }`.
- `card:moved`: Sent when a collaborator drags or reorders a card. Payload: `{ cardId, fromColumnId, toColumnId, newOrder }`.
- `card:deleted`: Sent when a collaborator deletes a card. Payload: `{ cardId, columnId }`.
- `column:created`: Sent when a collaborator adds a column. Payload: `{ column }`.
- `column:updated`: Sent when a collaborator renames a column. Payload: `{ columnId, changes }`.
- `column:deleted`: Sent when a collaborator deletes a column. Payload: `{ columnId }`.
- `column:reordered`: Sent when a collaborator reorders columns. Payload: `{ orderedColumnIds }`.
- `user:joined`: Sent when a collaborator opens the board. Payload: `{ user }`.
- `user:left`: Sent when a collaborator leaves the board. Payload: `{ userId }`.
- `cursor:moved`: Relayed cursor coordinates of a collaborator. Payload: `{ userId, x, y }`.
- `error`: Sent back to the initiating client if an operation fails validation. Payload: `{ message, code }`.

---

## REST API Reference

All REST endpoints are prefixed with `/api`. Routes marked as Protected require an `Authorization: Bearer <accessToken>` header.

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Create a new user account with email, name, and password.
- `POST /api/auth/login` - Authenticate with email and password. Returns access token in body and sets refresh token in an httpOnly cookie.
- `POST /api/auth/google` - Authenticate using a Google OAuth credential token.
- `POST /api/auth/refresh` - Issue a new access token using the valid refresh cookie.
- `POST /api/auth/logout` - Invalidate the active refresh token and clear the cookie.
- `GET /api/auth/me` - (Protected) Fetch the currently authenticated user profile.
- `GET /api/auth/verify-email` - Verify email address using the token received via email.

### Boards (`/api/boards`)

- `GET /api/boards` - (Protected) List all boards the authenticated user owns or participates in.
- `POST /api/boards` - (Protected) Create a new board with a title and optional background styling.
- `GET /api/boards/:boardId` - (Protected) Fetch a complete board including its ordered columns and cards.
- `PATCH /api/boards/:boardId` - (Protected) Update board title, description, or background color.
- `DELETE /api/boards/:boardId` - (Protected, Owner only) Archive or remove a board.
- `POST /api/boards/:boardId/members` - (Protected, Owner only) Send an email invitation to a new board collaborator.
- `PATCH /api/boards/:boardId/members/:userId` - (Protected, Owner only) Update a collaborator role (editor, viewer).
- `DELETE /api/boards/:boardId/members/:userId` - (Protected, Owner only) Remove a collaborator from the board.

### Columns (`/api/columns`)

- `POST /api/boards/:boardId/columns` - (Protected, Editor+) Create a new column on the board.
- `PATCH /api/columns/:columnId` - (Protected, Editor+) Rename or update column settings.
- `DELETE /api/columns/:columnId` - (Protected, Editor+) Delete a column and its associated cards.
- `PATCH /api/boards/:boardId/columns/reorder` - (Protected, Editor+) Save a new order for columns on the board.

### Cards (`/api/cards`)

- `POST /api/columns/:columnId/cards` - (Protected, Editor+) Create a new card inside a column.
- `GET /api/cards/:cardId` - (Protected) Retrieve the full details of a specific card.
- `PATCH /api/cards/:cardId` - (Protected, Editor+) Update card title, description, labels, due date, checklist, or assignees.
- `PATCH /api/cards/:cardId/move` - (Protected, Editor+) Move a card to a different column or new position.
- `DELETE /api/cards/:cardId` - (Protected, Editor+) Archive or remove a card.
- `POST /api/cards/:cardId/attachments` - (Protected, Editor+) Upload a file attachment to the card via multipart form data.
- `DELETE /api/cards/:cardId/attachments/:id` - (Protected, Editor+) Remove an attachment from the card.
- `POST /api/cards/:cardId/comments` - (Protected) Add a new comment to a card.

### Activity and Messages

- `GET /api/boards/:boardId/activity` - (Protected) Retrieve paginated activity entries for the board.
- `GET /api/boards/:boardId/messages` - (Protected) Fetch recent chat messages sent inside the board.
- `POST /api/boards/:boardId/messages` - (Protected) Post a new chat message to the board stream.

---

## Common Issues and Troubleshooting

### 1. Redis Connection Errors
If you see an error such as `ECONNREFUSED 127.0.0.1:6379`:
- Ensure that the Redis container is running: `docker-compose ps`.
- If running Redis locally without Docker, verify the Redis service is active: `redis-cli ping` (should return `PONG`).
- Check that the `REDIS_URL` in `server/.env` matches your Redis port (default is `redis://localhost:6379`).

### 2. MongoDB Connection Refused
If the server fails to connect to MongoDB:
- Ensure the Docker container is up: `docker-compose up -d mongodb`.
- Verify the connection string in `server/.env` is set to `mongodb://localhost:27017/kanban`.
- If using MongoDB Atlas (cloud), ensure your IP address is whitelisted in your Atlas security settings.

### 3. File Uploads Failing
If uploading card attachments returns an error:
- Confirm that your Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are filled in inside `server/.env`.
- If you do not plan to configure Cloudinary immediately during local testing, cards can still be created and manipulated normally without uploading files.

### 4. Emails Not Sending
If board invite links or verification emails are not delivered:
- If using Gmail as your SMTP provider, remember that standard passwords will not work; you must generate and use an App Password from your Google Account settings.
- Alternatively, for local email testing without sending real emails, you can use a sandbox provider like Mailtrap or Ethereal Email.

### 5. CORS or Socket Connection Failures
If the client console shows CORS warnings or the socket fails to connect:
- Ensure `CLIENT_URL` in `server/.env` is set to the exact frontend origin, typically `http://localhost:5173`.
- Verify that `VITE_API_BASE_URL` in `client/.env` points to `http://localhost:5000/api` and `VITE_SOCKET_URL` points to `http://localhost:5000`.

---

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it in your own projects.
