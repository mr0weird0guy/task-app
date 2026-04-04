# Task app Backend

**Node.js · TypeScript · Prisma · JWT**

A minimal, production-ready backend built in a **single file**, featuring authentication, task management, and secure token handling.

---

## Tech Stack

- **Runtime:** Node.js (>= 18)
- **Language:** TypeScript
- **Framework:** Express 4
- **ORM:** Prisma _(SQLite by default — easily switch to Postgres/MySQL)_
- **Authentication:** JWT (Access + Refresh Tokens with rotation & revocation)
- **Security:** bcrypt password hashing (cost factor: 12)

---

## Features

- 🔐 Secure authentication (JWT + refresh token rotation)
- 🔁 Token reuse detection & server-side revocation
- 👤 User registration & login
- ✅ Task CRUD with ownership validation
- 🔎 Filtering, pagination, and search
- ⚡ Single-file architecture for simplicity

---

## Quick Start

### 1. Initialize project

```bash
npm init -y
```

### 2. Install dependencies

```bash
npm install express @prisma/client cors bcryptjs jsonwebtoken ts-node-dev zod better-sqlite3 @prisma/adapter-better-sqlite3
```

### 3. Install dev dependencies

```bash
npm install -D typescript ts-node @types/node @types/express @types/bcryptjs @types/jsonwebtoken prisma
```

### 4. Setup Prisma

```bash
npx prisma init --datasource-provider sqlite
```

Replace `prisma/schema.prisma` with your schema.

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Run migrations

```bash
npx prisma migrate dev --name init
```

### 7. Start server

```bash
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"

JWT_ACCESS_SECRET="change-me-access"
JWT_REFRESH_SECRET="change-me-refresh"

ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="7d"

PORT=3000
```

---

## 📡 API Endpoints

### 🔑 Auth Routes (`/auth`)

| Method | Endpoint         | Description                              |
| ------ | ---------------- | ---------------------------------------- |
| POST   | `/auth/register` | Create user, hash password, issue tokens |
| POST   | `/auth/login`    | Secure login (constant-time comparison)  |
| POST   | `/auth/refresh`  | Rotate refresh token & issue new tokens  |
| POST   | `/auth/logout`   | Revoke refresh token (server-side)       |

---

### 📝 Task Routes (`/tasks`)

> Requires: `Authorization: Bearer <accessToken>`

| Method | Endpoint            | Description                                 |
| ------ | ------------------- | ------------------------------------------- |
| GET    | `/tasks`            | List tasks (pagination, filter, search)     |
| POST   | `/tasks`            | Create a new task                           |
| GET    | `/tasks/:id`        | Get task (403 if not owner)                 |
| PATCH  | `/tasks/:id`        | Update specific fields                      |
| DELETE | `/tasks/:id`        | Delete task (204 response)                  |
| POST   | `/tasks/:id/toggle` | Cycle status (PENDING → IN_PROGRESS → DONE) |

---

## 🔄 Task Status Flow

```
PENDING → IN_PROGRESS → DONE → PENDING
```

---

## 🔐 Security Notes

- Passwords hashed using **bcrypt (cost factor 12)**
- Refresh tokens stored and **revoked server-side**
- **Token rotation** implemented to prevent replay attacks
- **Reuse detection** invalidates compromised sessions
- Constant-time comparisons to prevent timing attacks
