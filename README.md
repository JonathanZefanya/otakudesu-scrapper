<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:6a11cb,100:2575fc&height=200&section=header&text=superanime%20API&fontSize=60&fontColor=fff&animation=fadeIn">
  <img alt="superanime API banner" src="https://capsule-render.vercel.app/api?type=waving&color=0:6a11cb,100:2575fc&height=200&section=header&text=superanime%20API&fontSize=60&animation=fadeIn">
</picture>

<p align="center">
  <strong>Indonesian Anime Subtitle Scraper API</strong><br>
  Otakudesu · Kuramanime · Oploverz · Nimegami
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-endpoints">API</a> •
  <a href="#-database">Database</a> •
  <a href="#-deployment">Deploy</a> •
  <a href="#-project-structure">Structure</a>
</p>

---

**superanime** adalah REST API cepat untuk scraping data anime subtitle Indonesia dari 4 sumber terpercaya. Dibangun dengan **Bun + Express 5 + TypeScript**, mendukung **cache**, **Supabase sync**, dan siap **deploy ke Vercel**.

---

## ✨ Features

| Feature | Description |
|---|---|
| ⚡ **Blazing Fast** | Bun runtime, LRU cache, client cache headers |
| 🔌 **4 Sources** | Otakudesu, Kuramanime, Oploverz, Nimegami |
| 🗄️ **Supabase Sync** | Auto-save data ke PostgreSQL, query via API |
| 🔄 **Auto-sync** | Middleware menyimpan data otomatis tiap request |
| 📦 **Typed** | TypeScript strict — zero `any` |
| 🧪 **Validated** | Valibot schema validation di semua endpoint |
| 🚀 **Serverless Ready** | Deploy ke Vercel tanpa perubahan kode |
| 📊 **Cached** | 2-layer cache (client + server LRU) |

---

## 🚀 Quick Start

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.3
- [Supabase](https://supabase.com) account (opsional — untuk sync database)

### Installation

```bash
# Clone
git clone https://github.com/superdevids/superanime.git
cd superanime

# Install dependencies
bun install

# (Opsional) Setup Supabase — lihat section Database
cp .env.example .env
# Edit .env dengan credentials Supabase kamu

# Jalankan development
bun dev
```

Server berjalan di `http://localhost:3001` (atau `$PORT` jika diset).

### Scripts

```bash
bun dev       # Development dengan hot reload
bun start     # Production
bun typecheck # TypeScript type check
```

---

## 📡 API Endpoints

### Root

```http
GET /
```

Returns available sources and database status.

### Otakudesu

Base: `http://localhost:3001/otakudesu`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/home` | Ongoing + completed anime |
| `GET` | `/schedule` | Release schedule by day |
| `GET` | `/anime` | A-Z anime list |
| `GET` | `/genre` | All genres |
| `GET` | `/ongoing` | Ongoing anime (query: `?page=N`) |
| `GET` | `/completed` | Completed anime (query: `?page=N`) |
| `GET` | `/search?q=` | Search anime |
| `GET` | `/genre/:genreId` | Anime by genre |
| `GET` | `/batch/:batchId` | Batch download details |
| `GET` | `/anime/:animeId` | Anime detail |
| `GET` | `/episode/:episodeId` | Episode detail |
| `GET` | `/server/:serverId` | Stream server URL |

### Kuramanime

Base: `http://localhost:3001/kuramanime`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/home` | Home — ongoing, completed, movie |
| `GET` | `/anime` | Anime list (`?search=`, `?status=`, `?sort=`) |
| `GET` | `/schedule?scheduled_day=` | Release schedule by day |
| `GET` | `/properties/:type` | List properties (genre, season, studio, etc.) |
| `GET` | `/properties/:type/:id` | Anime filtered by property |
| `GET` | `/anime/:id/:slug` | Anime detail |
| `GET` | `/episode/:id/:slug/:ep` | Episode detail |
| `GET` | `/batch/:id/:slug/:batch` | Batch download |

### Oploverz

Base: `http://localhost:3001/oploverz`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/home` | Popular, latest, recommended |
| `GET` | `/schedule` | Release schedule |
| `GET` | `/anime` | Anime list |
| `GET` | `/genre` | Genre list (64 genres) |
| `GET` | `/ongoing` | Ongoing anime |
| `GET` | `/completed` | Completed anime |
| `GET` | `/search?q=` | Search anime |
| `GET` | `/genres/:genreId` | Anime by genre |
| `GET` | `/anime/:slug` | Anime detail |
| `GET` | `/episode/:slug` | Episode detail + download links |

### Nimegami

Base: `http://localhost:3001/nimegami`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/home` | Latest + recommended |
| `GET` | `/schedule` | Ongoing schedule |
| `GET` | `/anime` | Anime list |
| `GET` | `/genre` | Genre list (102 genres) |
| `GET` | `/ongoing` | Ongoing anime |
| `GET` | `/search?q=` | Search anime |
| `GET` | `/genre/:genreId` | Anime by genre |
| `GET` | `/anime/:slug` | Anime detail |

---

## 🗄️ Database (Supabase)

Penyimpanan data ke Supabase bersifat **opsional**. API tetap berfungsi penuh tanpa database.

### Setup

```bash
# 1. Set environment variables
cp .env.example .env
# Isi SUPABASE_URL dan SUPABASE_ANON_KEY

# 2. Jalankan SQL schema
# Buka supabase-schema.sql → copy-paste ke Supabase SQL Editor → Run
```

### Tables

| Table | Description |
|---|---|
| `anime` | Anime entries (upsert by source + slug) |
| `episodes` | Episode data per anime |
| `genres` | Genre list per source |
| `anime_genres` | Many-to-many relation |
| `home_cache` | Home page snapshots |
| `sync_log` | Sync history & status |

### Sync Endpoints

```http
# Manual sync — scrape + save to database
POST /sync/:source/:type

# View sync history
GET  /sync/status

# Query anime from database
GET  /db/anime?source_id=otakudesu&search=naruto&page=1
```

#### Parameters

| Parameter | Values |
|-----------|--------|
| `:source` | `otakudesu`, `kuramanime`, `oploverz`, `nimegami`, `all` |
| `:type` | `home`, `anime`, `schedule`, `genres`, `full` |

#### Auto-sync

Setiap kali data di-scrape melalui endpoint API, **auto-sync middleware** secara otomatis menyimpan data ke Supabase tanpa blocking response.

---

## 🏗️ Project Structure

```
src/
├── index.ts              # Entry point
├── app.ts                # Express app + middleware
├── config/index.ts       # App config + source configs
├── types/index.ts        # All TypeScript types
│
├── routes/               # Route definitions
│   ├── index.ts          # Route aggregator
│   ├── otakudesu.ts
│   ├── kuramanime.ts
│   ├── oploverz.ts
│   ├── nimegami.ts
│   ├── sync.ts           # Sync routes
│   └── db.ts             # Database query routes
│
├── controllers/          # Request handlers
│   ├── otakudesu.ts
│   ├── kuramanime.ts
│   ├── oploverz.ts
│   ├── nimegami.ts
│   └── sync.ts
│
├── parsers/              # HTML → JSON parsers
│   ├── utils.ts          # Shared parser utilities
│   ├── otakudesu.ts
│   ├── kuramanime.ts
│   ├── oploverz.ts
│   └── nimegami.ts
│
├── scrapers/             # HTTP fetch + DOM
│   ├── otakudesu.ts
│   ├── kuramanime.ts
│   ├── oploverz.ts
│   └── nimegami.ts
│
├── schemas/              # Valibot validation
│
├── lib/                  # Core libraries
│   ├── fetcher.ts        # HTTP client
│   ├── cache.ts          # LRU + client cache
│   ├── errors.ts         # Typed error classes
│   ├── response.ts       # Response formatter
│   ├── supabase.ts       # Supabase client
│   └── sync-service.ts   # Sync engine
│
├── middlewares/
│   ├── errorHandler.ts   # Global error handler
│   └── autoSync.ts       # Auto-sync middleware
│
└─── components/          # Static HTML pages
```

---

## 📦 Tech Stack

| Tech | Purpose |
|------|---------|
| [Bun](https://bun.sh) | Runtime, package manager, dev server |
| [Express 5](https://expressjs.com) | HTTP framework |
| [TypeScript](https://typescriptlang.org) | Type safety |
| [node-html-parser](https://github.com/taoqf/node-html-parser) | HTML parsing |
| [lru-cache](https://github.com/isaacs/node-lru-cache) | Server cache |
| [Valibot](https://valibot.dev) | Input validation |
| [sanitize-html](https://github.com/apostrophecms/sanitize-html) | HTML sanitization |
| [Supabase](https://supabase.com) | PostgreSQL database |

---

## ☁️ Deployment

### Vercel (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/superdevids/superanime)

```bash
npm i -g vercel
vercel --prod
```

### Docker

```bash
docker build -t superanime .
docker run -p 3001:3001 superanime
```

---

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3001` | Server port |
| `SUPABASE_URL` | For DB sync | — | Supabase project URL |
| `SUPABASE_ANON_KEY` | For DB sync | — | Supabase anon key |

---

## 📝 Response Format

Semua endpoint mengembalikan format JSON konsisten:

```json
{
  "statusCode": 200,
  "statusMessage": "OK",
  "message": "",
  "data": { ... },
  "pagination": {
    "currentPage": 1,
    "prevPage": null,
    "nextPage": 2,
    "totalPages": 10,
    "hasPrevPage": false,
    "hasNextPage": true
  }
}
```

---

## 🤝 Contributing

1. Fork repository
2. Buat branch fitur: `git checkout -b feat/feature-name`
3. Commit: `git commit -m 'feat: add feature'`
4. Push: `git push origin feat/feature-name`
5. Buka Pull Request

---

## 📄 License

MIT © [superdevids](https://github.com/superdevids)

---

<p align="center">
  <sub>Built with ❤️ for the Indonesian anime community</sub>
</p>
