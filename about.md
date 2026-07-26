# 🚀 Claude_bulut (VoltCloud / CloudVault) — Project Context & AI Guidelines

> **Note for AI Agents**: This file serves as the single source of truth for the `Claude_bulut` repository. Read this file to understand the architecture, database schema, environment configuration, code structure conventions, and current roadmap before making any code modifications.

---

## 1. 📌 Project Overview & Business Logic

**Claude_bulut** is a Telegram-integrated Micro-SaaS backend application built with **NestJS**, **Prisma ORM (v7)**, **PostgreSQL (Neon)**, **Cloudinary**, and **Telegraf**.

### Core Flow:
1. **User Interaction**: Telegram users send **photos, videos, or documents** (3D models, PDF, ZIP, etc.) or execute commands (`/start`, `/files`) to the bot.
2. **User Synchronization**: User profiles (`telegramId`, `firstName`, `lastName`, `username`) are automatically created/updated (`upsert`) in PostgreSQL via `UsersService`.
3. **Daily Upload Limits**: The bot enforces a maximum daily limit of **3 file uploads per user per day** (all formats combined).
4. **Cloud Storage**: Files are downloaded from Telegram API and uploaded to **Cloudinary** with the correct `resource_type` (`image`, `video`, or `raw`).
5. **URL Shortening**: A unique 6-character short code is generated using `nanoid` (e.g., `aB3x9Z`) and saved to the `Resource` table in PostgreSQL.
6. **Analytics & Redirect**: Short URLs follow the format `${BASE_URL}/${shortCode}`. When accessed in a browser, the backend increments the `clicks` counter in DB and redirects (`302`) to the original Cloudinary media URL.

---

## 2. 🛠 Tech Stack

* **Core Framework:** NestJS v11 (TypeScript v5)
* **Database & Driver:** PostgreSQL (Neon Serverless) via `@prisma/adapter-pg` & `pg` pool
* **ORM:** Prisma v7.4 (`prisma.config.mjs` configured for Prisma 7)
* **Bot Framework:** `nestjs-telegraf` v2.9 / Telegraf v4
* **Media Storage:** Cloudinary (`nestjs-cloudinary` v2.1)
* **Short Code Generator:** `nanoid` v3
* **Containerization:** Docker (`docker-compose.yml`, `Dockerfile`)

---

## 3. 📂 Directory & File Structure Conventions

All AI agents **MUST** strictly adhere to the following modular architecture:

```
Claude_bulut/
├── prisma/
│   ├── schema.prisma          # Database schema (User & Resource models)
│   └── migrations/            # SQL migration history
├── src/
│   ├── main.ts                # App entry point (default port: 3000)
│   ├── app.module.ts          # Root module (Config, Telegraf, Cloudinary, Database, Feature Modules)
│   ├── core/                  # Core shared infrastructure
│   │   └── database/          # PrismaService (PrismaClient with pg pool adapter)
│   └── modules/               # Domain feature modules
│       ├── bot/               # Telegram Bot updates handler (BotUpdate)
│       │   └── bot.controller.ts
│       ├── file-upload/       # File upload, short URL redirect & analytics
│       │   ├── file-upload.module.ts
│       │   ├── file-upload.service.ts
│       │   ├── file-upload.controller.ts
│       │   ├── redirect.controller.ts  # Root-level /:shortCode redirect
│       │   ├── dto/
│       │   └── entities/
│       └── users/             # User management and Telegram profile sync
│           ├── users.module.ts
│           ├── users.service.ts
│           ├── users.controller.ts
│           ├── dto/
│           └── entities/
├── docker-compose.yml         # Local Postgres & App container setup
├── Dockerfile                 # Docker container build script
├── prisma.config.mjs          # Prisma 7 CLI configuration (Direct URL for migrations)
├── package.json
└── about.md                   # AI Agent Context & Guidelines (This File)
```

---

## 4. 🗄 Database Schema (Prisma Models)

```prisma
model User {
  id         String     @id @default(uuid())
  telegramId String     @unique
  firstName  String?
  lastName   String?
  username   String?
  resources  Resource[]
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
}

model Resource {
  id          String   @id @default(uuid())
  originalUrl String   @db.Text
  shortCode   String   @unique 
  ownerId     String?
  publicId    String?  
  clicks      Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  owner       User?    @relation(fields: [ownerId], references: [telegramId], onDelete: SetNull)
}
```

---

## 5. 🌐 API Routes & Telegram Commands

### HTTP API Endpoints:
| Method | Route | Controller | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/:shortCode` | `RedirectController` | Root-level redirect — increments `clicks` and redirects to Cloudinary URL |
| `GET` | `/file-upload/:shortCode` | `FileUploadController` | Legacy redirect (same logic as above) |
| `GET` | `/file-upload/stats/:shortCode` | `FileUploadController` | Returns JSON stats: `{ link, count }` |
| `DELETE` | `/file-upload/:id` | `FileUploadController` | Deletes resource from DB and removes file from Cloudinary |
| `GET` | `/users` | `UsersController` | Lists all registered Telegram users with total uploaded count |
| `GET` | `/users/:telegramId` | `UsersController` | Gets specific user details with their uploaded resources |

### Telegram Bot Commands & Handlers:
* `/start` — Welcomes user, syncs profile to DB, displays inline keyboard.
* `/files` — Returns list of user's uploaded short links and view stats.
* `photo` event — Validates daily limit, uploads photo to Cloudinary (`resource_type: image`), returns short link.
* `video` event — Validates daily limit, uploads video to Cloudinary (`resource_type: video`), returns short link.
* `document` event — Validates daily limit, auto-detects MIME type (`image/*` → image, `video/*` → video, else → raw for 3D/PDF/ZIP), uploads to Cloudinary, returns short link.

---

## 6. 🔑 Environment Variables (`.env`)

```env
DATABASE_URL=postgresql://<user>:<pass>@<host-pooler>/neondb?sslmode=require
DIRECT_URL=postgresql://<user>:<pass>@<host-direct>/neondb?sslmode=require
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
BOT_TOKEN=
BASE_URL=
```

---

## 7. 📏 Rules & Standards for AI Agents

1. **Prisma 7 Compatibility**:
   - **DO NOT** add `url = env("DATABASE_URL")` inside `schema.prisma` under `datasource db`. Prisma 7 deprecates datasource URLs in schema files. Connection URLs are managed via `prisma.config.mjs` and `PrismaService` `@prisma/adapter-pg`.
2. **Short URL Format**:
   - Short URLs use **root-level** paths: `${process.env.BASE_URL}/${shortCode}`. The `RedirectController` handles `/:shortCode` at the root level. Legacy `/file-upload/:shortCode` also works.
3. **User Profile Sync**:
   - Any new bot trigger or handler must invoke `this.usersService.upsertTelegramUser(...)` before executing action logic.
4. **Code Cleanliness**:
   - Maintain strict TypeScript types. Do NOT leave commented-out unused code blocks or dummy template functions.
5. **Database Schema Changes**:
   - After updating `schema.prisma`, run `npx prisma generate` followed by `npx prisma db push` to synchronize changes with Neon PostgreSQL.

---

## 8. 🏁 Current Project Status & Future Roadmap

### Current Status:
- ✅ **Fully Functional MVP**: Telegram Bot ➔ Cloudinary ➔ PostgreSQL ➔ Short URL Redirect ➔ Analytics.
- ✅ **User Synchronization**: Integrated `User` table and relational mapping with `Resource`.
- ✅ **Multi-format Upload**: Photos (`image`), Videos (`video`), Documents & 3D models (`raw`) — all supported via Cloudinary `resource_type`.
- ✅ **Prisma 7 Ready**: Database adapter configured with PostgreSQL connection pooling.
- ✅ **Clean Build**: Verified clean compilation via `npm run build`.

### Future Roadmap / Next Features:
1. **Telegram Mini App (TWA)**: Develop frontend UI for users to manage uploaded files visually.
2. **Link Expiration (TTL)**: Option to auto-delete links after X days/hours.
3. **Password-Protected Links**: Add optional password protection to short links.
