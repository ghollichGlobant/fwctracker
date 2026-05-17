# ⚽ FWC Tracker — Facundo's FIFA World Cup 2026 Sticker Album Tracker

> A **single-file frontend + optional Express/Firestore backend** to track your Panini FIFA World Cup 2026™ sticker collection.  
> **980 stickers · 48 teams · 12 groups · AES-256-GCM encryption**


---

## 📸 Features

- ✅ Track **980 stickers** across 12 groups and 48 teams
- 🔄 Mark stickers as **Missing / Complete / Repeated** (with duplicate count)
- 🔍 **Search** by sticker code, team, or player name
- 📊 **Real-time progress bar** and per-group/team stats
- 📤 **Export** your collection as a `.json` backup
- 📥 **Import** a `.json` backup to restore your collection
- 🔒 **AES-256-GCM encryption** — data stored encrypted in `localStorage`
- ⏱️ **Auto-lock** after 15 minutes of inactivity
- 📱 **Responsive** — works on desktop, tablet, and mobile
- 🌐 **REST API** — optional Express backend for multi-device cloud sync

---

## 🏗️ Project Structure

```
FWC2026/
├── index.html                  # Frontend — entire app, single self-contained file
├── README.md
└── backend/
    ├── package.json
    ├── .env.example
    ├── .gitignore
    └── src/
        ├── index.js            # Express server entry point
        ├── firebase.js         # Firebase Admin SDK initialisation
        ├── albumData.js        # Shared sticker/group data
        ├── routes/
        │   ├── albums.js       # POST/GET /api/albums
        │   ├── stickers.js     # GET/PATCH /api/albums/:id/stickers
        │   └── stats.js        # GET /api/albums/:id/stats
        └── middleware/
            └── errorHandler.js
```

---

## 🖥️ Frontend

### Stack

| Technology | Details |
|---|---|
| **HTML5** | Single-file app, no framework |
| **CSS3** | Custom properties, CSS Grid, Flexbox, responsive |
| **Vanilla JavaScript (ES2020+)** | No libraries, no bundler |
| **Web Crypto API** | Native AES-256-GCM + PBKDF2 encryption |
| **Google Fonts CDN** | `Russo One` + `Inter` |
| **localStorage** | Encrypted data persistence (per-browser) |

### No npm / No build step

There are **zero dependencies** to install. Just open `index.html` in a browser.

### Security

| Feature | Detail |
|---|---|
| **Encryption** | AES-256-GCM |
| **Key derivation** | PBKDF2 · 600,000 iterations · SHA-256 |
| **Salt** | 16-byte cryptographic random salt per password |
| **IV** | 12-byte random IV per encrypt operation |
| **Brute force** | 5 attempts → 60s lockout |
| **Auto-lock** | 15-minute inactivity timeout |
| **CSP headers** | `default-src 'self'` + restricted directives |

---

## 🛠️ Backend

An **optional** Express.js REST API that stores album data in **Firebase Firestore**.  
Use it if you want multi-device sync or a permanent cloud store.

### Stack

| Technology | Details |
|---|---|
| **Node.js** | v18+ (ES Modules) |
| **Express 4** | REST API framework |
| **cors** | Cross-origin request support |
| **firebase-admin 13** | Firestore database |
| **Firebase Firestore** | NoSQL cloud database (free Spark tier) |

### Dependencies

```json
"dependencies": {
  "cors": "^2.8.5",
  "express": "^4.21.2",
  "firebase-admin": "^13.4.0"
}
```

### API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/albums` | Create & seed a new album (all 980 stickers) |
| `GET` | `/api/albums` | List all albums |
| `GET` | `/api/albums/:id` | Get album metadata + live stats |
| `GET` | `/api/albums/:id/stickers` | List stickers (filter by `?team=ARG&status=missing&group=Group+A`) |
| `GET` | `/api/albums/:id/stickers/:code` | Get a single sticker |
| `PATCH` | `/api/albums/:id/stickers/:code` | Update one sticker status |
| `PATCH` | `/api/albums/:id/stickers` | Bulk update up to 100 stickers |
| `GET` | `/api/albums/:id/stats` | Full stats breakdown by team and group |

### PATCH body examples

Single sticker:
```json
{ "status": "complete" }
{ "status": "repeated", "repeats": 3 }
```

Bulk update:
```json
{
  "stickers": [
    { "code": "ARG 16", "status": "complete" },
    { "code": "BRA 9",  "status": "repeated", "repeats": 2 }
  ]
}
```

---

## 🚀 Deployment

### Frontend — GitHub Pages (Free · Recommended)

```zsh
cd /path/to/FWC2026
git add index.html README.md
git commit -m "Deploy FWC Tracker"
git push origin main
```

Then on GitHub → **Settings** → **Pages** → Source: `main` / `/ (root)` → **Save**.

Live at: `https://<username>.github.io/<repo>/`

> No GitHub account needed to **visit** the deployed site.

Other free static hosts: **Netlify** (drag & drop), **Vercel** (`vercel` CLI), **Cloudflare Pages**.

---

### Backend — Local Development

**1. Prerequisites**

- Node.js v18+
- A Firebase project with Firestore enabled ([console.firebase.google.com](https://console.firebase.google.com))
- A Service Account JSON key: **Project Settings → Service accounts → Generate new private key**

**2. Install dependencies**

```zsh
cd backend
npm install
```

**3. Configure environment**

```zsh
cp .env.example .env
```

Edit `.env`:

```dotenv
# Point to your downloaded service account key file
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json

# Server port (default: 3000)
PORT=3000
```

> Place your `serviceAccountKey.json` inside the `backend/` folder.  
> ⚠️ Never commit this file — it's already in `.gitignore`.

**4. Run the server**

```zsh
# Development (auto-restarts on file changes)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:3000`. You should see:

```
⚽ FWC2026 Backend running on http://localhost:3000
   Health:    GET  /health
   Albums:    POST /api/albums
   ...
```

---

### Backend — Cloud Deployment (Free Tiers)

For cloud deploys, use the inline JSON environment variable instead of a file:

```dotenv
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
PORT=3000
```

#### ⭐ Render (Recommended — Free)

A `render.yaml` is already included in `backend/` for one-click deploy.

**Steps:**

1. Push your project to GitHub (make sure `backend/` is included)
2. Go to [render.com](https://render.com) → **New** → **Web Service**
3. Connect your GitHub repo and select it
4. Render auto-detects `render.yaml` — confirm settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. In **Environment Variables**, add:
   - `FIREBASE_SERVICE_ACCOUNT` → paste the full contents of your `serviceAccountKey.json`
6. Click **Deploy**

Your API will be live at:
```
https://fwc2026-backend.onrender.com
```

> ⚠️ Free Render services **spin down after 15 min of inactivity** and take ~30s to wake up on first request. This is fine for personal use.

**Test it:**
```zsh
curl https://fwc2026-backend.onrender.com/health
```

#### Railway

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo → set **Root Directory** to `backend`
3. Add environment variable: `FIREBASE_SERVICE_ACCOUNT` (inline JSON)
4. Railway auto-detects Node.js and runs `npm start`

Free tier: **$5 credit/month** (enough for personal use).

#### Fly.io

```zsh
cd backend
npm install -g flyctl
fly launch        # follow prompts, choose free tier
fly secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
fly deploy
```

---

### Connecting the Frontend to the Backend

Once your backend is deployed, open the app in your browser:

1. Log in with your password
2. Click **☁️ Cloud Sync** in the bottom session bar
3. Enter your **Backend URL** (e.g. `https://fwc2026-backend.onrender.com`)
4. Click **➕ Create New Album on Server** (first time only — seeds all 980 stickers)
5. Copy the returned **Album ID** — it's auto-filled
6. Click **⬆️ Push to Server** to upload your current local data
7. Enable **Auto-sync** to push every sticker change automatically

From any other device: enter the same URL + Album ID → **⬇️ Pull from Server**.

---

### Quick API test (once server is running)

```zsh
# Create an album
curl -X POST http://localhost:3000/api/albums \
  -H "Content-Type: application/json" \
  -d '{"name": "Facundo Album", "owner": "Facundo"}'

# Copy the returned id, then get stats
curl http://localhost:3000/api/albums/<id>/stats

# Mark a sticker as complete
curl -X PATCH http://localhost:3000/api/albums/<id>/stickers/ARG_16 \
  -H "Content-Type: application/json" \
  -d '{"status": "complete"}'
```

---

## 📦 Data Persistence

| Mode | Storage | Devices |
|---|---|---|
| Frontend only | Encrypted `localStorage` in your browser | Single browser |
| Frontend + Backend | Firestore (cloud) | Any device |

To move data between devices without the backend: use **Export** (device A) → **Import** (device B).

---

## 🌐 Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full |
| Firefox 90+ | ✅ Full |
| Safari 15+ | ✅ Full |
| Edge 90+ | ✅ Full |
| IE / Legacy | ❌ Web Crypto API not supported |

> Web Crypto requires **HTTPS or localhost**. Use `python3 -m http.server 8080` for local testing if opening via `file://` causes issues.

---

## 📋 Sticker Breakdown

| Section | Count |
|---|---|
| FWC Special Stickers (foil) | 20 |
| Teams (48 × 20) | 960 |
| **Total** | **980** |

---


*Built with ❤️ for Facundo's collection · May 2026*
