# 🔐 Facundo's FWC 2026 Album Tracker — Security & Persistence Guide

> **Date:** May 16, 2026  
> **App:** `index.html` (single-file client-side sticker album tracker)  
> **Stickers:** 980 total (20 FWC specials + 48 teams × 20 players)

---

## ✅ Security Layer — Already Implemented

The following security features are **live** in `index.html`:

### Authentication & Encryption
| Feature | Detail |
|---|---|
| **Password gate** | Login screen blocks access until password is entered |
| **AES-256-GCM** | All album data encrypted at rest in localStorage |
| **PBKDF2 key derivation** | 600,000 iterations with SHA-256 — resistant to brute force |
| **Random salt** | 16-byte cryptographic salt per password, stored in localStorage |
| **Random IV** | 12-byte IV per encryption operation — no IV reuse |
| **Web Crypto API** | Native browser cryptography (no external libraries) |

### Session Management
| Feature | Detail |
|---|---|
| **Auto-lock** | 15-minute inactivity timeout with live countdown |
| **Activity detection** | Timer resets on click, keydown, mousemove, touchstart |
| **Manual lock** | "🔒 Lock Now" button always visible in session bar |
| **Password change** | Re-derives key and re-encrypts all data with new salt |

### Brute Force Protection
| Feature | Detail |
|---|---|
| **Max attempts** | 5 wrong passwords allowed |
| **Lockout** | 60-second cooldown after 5 failures |
| **Counter reset** | Resets after successful login or lockout expiry |

### HTTP Security Headers (meta tags)
| Header | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data:` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |

### Data Migration
- On first password setup, existing unencrypted localStorage data is automatically encrypted
- Unencrypted keys are removed after migration

### UI Features
- Password strength meter (length, uppercase, numbers, symbols)
- Password visibility toggle (👁️)
- Confirmation field for new password creation
- Error messages for validation failures
- Toast notifications for lock/unlock/password change events

---

## 📦 Data Persistence — Strategies for Future Implementation

Currently the app persists data **only in the browser's localStorage** (encrypted). Below are strategies to improve durability and portability, ordered by implementation complexity.

---

### Strategy 1: Enhanced Encrypted File Export/Import
**Complexity:** 🟢 Low | **Infrastructure:** None

Enhance the existing JSON export to save/load an encrypted `.fwc` backup file.

**What to do:**
- Export button saves the encrypted blob (not plaintext) as a downloadable `.fwc` file
- Import button reads the `.fwc` file, decrypts with user's password, and restores state
- Add auto-download reminder after N changes

**Pros:**
- Zero infrastructure, fully offline
- Portable across devices via file transfer

**Cons:**
- Manual process, user must remember to export
- No automatic sync

---

### Strategy 2: IndexedDB (upgrade from localStorage)
**Complexity:** 🟢 Low | **Infrastructure:** None

Replace `localStorage` with IndexedDB for larger storage capacity.

**What to do:**
- Use `idb` wrapper or raw IndexedDB API
- Store encrypted blob in an IndexedDB object store
- Keep same encryption/decryption logic

**Pros:**
- ~hundreds of MB storage (vs 5-10 MB localStorage)
- Better resilience to browser cleanup
- Structured storage for future features (e.g., change history)

**Cons:**
- Still single-device, same browser-clearing risk
- Slightly more complex API

---

### Strategy 3: Firebase Realtime Database / Firestore ⭐ Recommended
**Complexity:** 🟡 Medium | **Infrastructure:** Firebase free tier

Store the already-encrypted blob in Firebase. The server **never sees plaintext**.

**What to do:**
1. Create Firebase project → enable Realtime Database or Firestore
2. Add Firebase SDK via CDN `<script>` tag (stays single-file)
3. Use Anonymous Auth or Google Sign-In
4. On every `saveState()`, push encrypted blob to Firebase
5. On login, pull encrypted blob from Firebase → decrypt client-side

**Firebase free tier limits (Spark plan):**
- 1 GB stored, 10 GB/month download — more than enough for a personal tracker

**Pros:**
- Multi-device sync (phone, tablet, PC)
- Automatic cloud backup
- No backend code needed
- Data stays encrypted — Firebase only stores ciphertext

**Cons:**
- Requires Google account for Firebase project setup
- Adds ~50 KB CDN dependency
- Needs internet for sync (offline fallback to localStorage)

---

### Strategy 4: GitHub Gist as Storage
**Complexity:** 🟡 Medium | **Infrastructure:** GitHub account + Personal Access Token

Save encrypted JSON as a GitHub Gist.

**What to do:**
1. User creates a Personal Access Token with `gist` scope
2. App creates/updates a private Gist via GitHub API
3. Encrypted blob stored as Gist file content
4. On load, fetch Gist → decrypt → restore

**Pros:**
- Free, version history built-in (Gist revisions)
- Accessible from anywhere

**Cons:**
- Requires storing GitHub token in the app (security concern)
- API rate limits (60 req/hour unauthenticated, 5000 authenticated)
- Not ideal for frequent saves

---

### Strategy 5: Google Drive / Dropbox API
**Complexity:** 🔴 High | **Infrastructure:** OAuth app registration

Save encrypted file to user's own cloud drive.

**What to do:**
1. Register OAuth app with Google/Dropbox
2. Implement OAuth2 flow in the client
3. Save encrypted `.fwc` file to user's Drive/Dropbox
4. On load, fetch file → decrypt → restore

**Pros:**
- User fully owns the data in their cloud storage
- Accessible from any device

**Cons:**
- Complex OAuth flow for a single-file app
- API quotas and consent screens
- Maintenance burden for OAuth credentials

---

### Strategy 6: Progressive Web App (PWA)
**Complexity:** 🟡 Medium | **Infrastructure:** HTTPS hosting

Convert the app to an installable PWA with offline support.

**What to do:**
1. Add a `manifest.json` with app name, icons, theme colors
2. Create a Service Worker that caches `index.html` and assets
3. Use Cache API for the app shell, localStorage/IndexedDB for data
4. Add install prompt and offline indicator

**Pros:**
- Installable on home screen (mobile & desktop)
- Works fully offline after first load
- Resilient to network issues

**Cons:**
- Requires HTTPS hosting (GitHub Pages works)
- Doesn't solve multi-device sync alone (combine with Strategy 3)
- Needs separate `sw.js` and `manifest.json` files

---

### Strategy 7: Simple Backend (Node.js + SQLite)
**Complexity:** 🔴 High | **Infrastructure:** Server hosting

Minimal REST API that stores encrypted blobs per user.

**What to do:**
1. Express.js server with 2 endpoints: `GET /data` and `PUT /data`
2. SQLite database with `users` table (id, encrypted_blob, updated_at)
3. Token-based auth (JWT or simple API key)
4. Deploy to free tier: Vercel, Render, Railway, or Fly.io

**Pros:**
- Full control over data and infrastructure
- Works with any device and browser
- Can add features like sharing, admin panel, etc.

**Cons:**
- Requires hosting and maintenance
- No longer a single-file app
- Overkill for a personal tracker

---

## 🎯 Recommendation Summary

| Goal | Best Strategy | Effort |
|---|---|---|
| **Don't lose data** | #1 Enhanced file export | 🟢 1-2 hours |
| **Sync across devices** | #3 Firebase | 🟡 Half day |
| **Offline + installable** | #6 PWA + #1 backup | 🟡 Half day |
| **Bulletproof** | #3 Firebase + #6 PWA | 🟡 1 day |
| **Full control** | #7 Backend on free tier | 🔴 1-2 days |

**Best bang for the buck:** Start with **#1** (enhanced export) for immediate safety, then add **#3** (Firebase) when ready for cloud sync.

---

*Generated for Facundo's FIFA World Cup 2026™ Sticker Album Tracker*
