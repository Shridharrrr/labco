# LabCo — Real-time Collaborative Kanban Board
## README

A real-time collaborative Kanban board (MERN + Socket.io + Zustand + dnd-kit).

---

## Quick Start

### 1. Start MongoDB & Redis
```bash
docker-compose up -d
```

### 2. Install & run server
```bash
cd server
npm install
npm run dev   # http://localhost:5000
```

### 3. Install & run client
```bash
cd client
npm install
npm run dev   # http://localhost:5173
```

---

## Environment Setup

- **`server/.env`** — copy from the template (MongoDB URI, Redis URL, JWT secrets, Cloudinary, Email)
- **`client/.env`** — `VITE_API_BASE_URL` and `VITE_SOCKET_URL` already set to localhost

---

## Architecture

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| State | Zustand (sliced) + Immer |
| DnD | @dnd-kit |
| Styling | Tailwind CSS v4 |
| Real-time | Socket.io |
| HTTP | Axios |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (access 15m + refresh 7d) |
| Presence | Redis |
| Uploads | Multer + Cloudinary |
| Email | Nodemailer |

## Features
- ✅ JWT auth with auto-refresh
- ✅ Board/Column/Card CRUD
- ✅ Role-based access (owner/editor/viewer)
- ✅ Real-time drag & drop (dnd-kit)
- ✅ Optimistic updates with rollback
- ✅ Live user presence & cursors
- ✅ Activity log
- ✅ File attachments (Cloudinary)
- ✅ Board invite emails
