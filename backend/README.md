# ⚽ FWC2026 Backend — Sticker Album API

Minimal Express.js + Firebase Firestore backend for Facundo's FIFA World Cup 2026 Sticker Album Tracker. Manages album and sticker state for multi-user access over the same album.

## Architecture

```
Frontend (index.html)  ──HTTP──▶  Express.js API  ──SDK──▶  Firebase Firestore
                                   (this service)            (cloud database)
```

### Data Model (Firestore)

```
albums/                          ← collection
  {albumId}/                     ← document (metadata)
    ├── name: "Facundo's Album"
    ├── owner: "Facundo"
    ├── totalStickers: 980
    ├── createdAt, updatedAt
    └── stickers/                ← subcollection (980 docs)
          FWC_1  → { code, label, team, group, foil, status, repeats, updatedAt }
          ARG_1  → { code, label, team, teamName, flag, group, foil, status, repeats, updatedAt }
          ...
```

## Setup

### 1. Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) → Create a project
2. Enable **Firestore Database** (start in test mode for development)
3. Go to **Project Settings → Service accounts → Generate new private key**
4. Save the JSON file as `serviceAccountKey.json` in this folder

### 2. Install & Run

```bash
cd backend
cp .env.example .env
# Edit .env → set GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
npm install
npm run dev      # dev mode with auto-restart
# or
npm start        # production
```

Server starts on `http://localhost:3000`.

## API Reference

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |

### Albums

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/albums` | Create & seed a new album (980 stickers) |
| `GET` | `/api/albums` | List all albums |
| `GET` | `/api/albums/:id` | Get album metadata + live stats |

#### Create Album

```bash
curl -X POST http://localhost:3000/api/albums \
  -H "Content-Type: application/json" \
  -d '{"name": "Facundo FWC 2026", "owner": "Facundo"}'
```

Response:
```json
{
  "id": "abc123",
  "name": "Facundo FWC 2026",
  "owner": "Facundo",
  "totalStickers": 980,
  "createdAt": "2026-05-17T..."
}
```

#### Get Album (with stats)

```bash
curl http://localhost:3000/api/albums/abc123
```

Response:
```json
{
  "id": "abc123",
  "name": "Facundo FWC 2026",
  "owner": "Facundo",
  "stats": {
    "total": 980,
    "complete": 245,
    "missing": 700,
    "repeated": 35,
    "totalRepeats": 52,
    "progress": 25.0
  }
}
```

### Stickers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/albums/:id/stickers` | List stickers (filterable) |
| `GET` | `/api/albums/:id/stickers/:code` | Get single sticker |
| `PATCH` | `/api/albums/:id/stickers/:code` | Update single sticker |
| `PATCH` | `/api/albums/:id/stickers` | Bulk update (max 100) |

#### List Stickers with Filters

```bash
# All Argentina stickers
curl "http://localhost:3000/api/albums/abc123/stickers?team=ARG"

# All missing stickers in Group J
curl "http://localhost:3000/api/albums/abc123/stickers?status=missing&group=Group+J"
```

#### Update Single Sticker

```bash
# Mark ARG 16 (Messi!) as complete
curl -X PATCH http://localhost:3000/api/albums/abc123/stickers/ARG%2016 \
  -H "Content-Type: application/json" \
  -d '{"status": "complete"}'

# Mark FWC 3 as repeated with 3 copies
curl -X PATCH http://localhost:3000/api/albums/abc123/stickers/FWC%203 \
  -H "Content-Type: application/json" \
  -d '{"status": "repeated", "repeats": 3}'
```

#### Bulk Update Stickers

```bash
curl -X PATCH http://localhost:3000/api/albums/abc123/stickers \
  -H "Content-Type: application/json" \
  -d '{
    "stickers": [
      {"code": "ARG 1", "status": "complete"},
      {"code": "ARG 2", "status": "complete"},
      {"code": "ARG 16", "status": "repeated", "repeats": 2},
      {"code": "FWC 5", "status": "missing"}
    ]
  }'
```

### Stats

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/albums/:id/stats` | Detailed progress stats |

```bash
curl http://localhost:3000/api/albums/abc123/stats
```

Response:
```json
{
  "total": 980,
  "complete": 245,
  "missing": 700,
  "repeated": 35,
  "totalRepeats": 52,
  "progress": 25.0,
  "byTeam": {
    "ARG": { "name": "Argentina", "total": 20, "complete": 15, "missing": 3, "repeated": 2 },
    "BRA": { "name": "Brazil", "total": 20, "complete": 8, "missing": 12, "repeated": 0 }
  },
  "byGroup": {
    "Group J": { "total": 80, "complete": 40, "missing": 30, "repeated": 10 }
  }
}
```

### Sticker Status Values

| Status | Meaning |
|--------|---------|
| `missing` | Not yet obtained (default) |
| `complete` | Obtained and pasted in album |
| `repeated` | Have extra copies (use `repeats` field for count) |

## Deployment

The service runs on any Node.js hosting. Recommended free tiers:

| Platform | Notes |
|----------|-------|
| **Google Cloud Run** | Native Firebase integration |
| **Render** | Free web service tier |
| **Railway** | Simple deploy from GitHub |
| **Fly.io** | Edge deployment |

Set `FIREBASE_SERVICE_ACCOUNT` env var with the JSON content (not the file path) for cloud deploys.

## File Structure

```
backend/
├── package.json
├── .env.example
├── .gitignore
├── README.md
└── src/
    ├── index.js              ← Express server + route mounting
    ├── firebase.js           ← Firebase Admin SDK init
    ├── albumData.js          ← 980 sticker definitions (seed data)
    ├── routes/
    │   ├── albums.js         ← POST/GET albums, seed stickers
    │   ├── stickers.js       ← GET/PATCH stickers (single + bulk)
    │   └── stats.js          ← GET progress stats (by team/group)
    └── middleware/
        └── errorHandler.js   ← Central error handling + async wrapper
```
IMPORTANT: live backend CLOUD deployed on https://fwctracker.onrender.com/api/