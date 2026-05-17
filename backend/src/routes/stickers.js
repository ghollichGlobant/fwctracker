import { Router } from "express";
import db from "../firebase.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router({ mergeParams: true }); // access :albumId from parent
const stickersCol = (albumId) =>
  db.collection("albums").doc(albumId).collection("stickers");

const VALID_STATUSES = ["missing", "complete", "repeated"];

// ─── helpers ────────────────────────────────────────────────

/** Verify album exists — reusable guard. */
async function assertAlbumExists(albumId) {
  const album = await db.collection("albums").doc(albumId).get();
  if (!album.exists) {
    const err = new Error("Album not found"); err.status = 404; throw err;
  }
  return album;
}

/** Convert sticker code to Firestore doc ID. */
function codeToDocId(code) {
  return code.replace(/ /g, "_");
}

// ─── GET /api/albums/:albumId/stickers ──────────────────────
// Query params: ?team=ARG  &status=missing  &group=Group+A

router.get(
  "/",
  asyncHandler(async (req, res) => {
    await assertAlbumExists(req.params.albumId);

    let query = stickersCol(req.params.albumId).orderBy("code");

    if (req.query.team) {
      query = query.where("team", "==", req.query.team.toUpperCase());
    }
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) {
      query = query.where("status", "==", req.query.status);
    }
    if (req.query.group) {
      query = query.where("group", "==", req.query.group);
    }

    const snap = await query.get();
    const stickers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    res.json({ count: stickers.length, stickers });
  })
);

// ─── GET /api/albums/:albumId/stickers/:code ────────────────

router.get(
  "/:code",
  asyncHandler(async (req, res) => {
    await assertAlbumExists(req.params.albumId);

    const docId = codeToDocId(req.params.code);
    const doc = await stickersCol(req.params.albumId).doc(docId).get();

    if (!doc.exists) {
      const err = new Error(`Sticker '${req.params.code}' not found`);
      err.status = 404;
      throw err;
    }

    res.json({ id: doc.id, ...doc.data() });
  })
);

// ─── PATCH /api/albums/:albumId/stickers/:code ──────────────
// Body: { "status": "complete" } or { "status": "repeated", "repeats": 3 }

router.patch(
  "/:code",
  asyncHandler(async (req, res) => {
    await assertAlbumExists(req.params.albumId);

    const { status, repeats } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      const err = new Error(`'status' must be one of: ${VALID_STATUSES.join(", ")}`);
      err.status = 400;
      throw err;
    }

    const docId = codeToDocId(req.params.code);
    const docRef = stickersCol(req.params.albumId).doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) {
      const err = new Error(`Sticker '${req.params.code}' not found`);
      err.status = 404;
      throw err;
    }

    const update = {
      status,
      repeats: status === "repeated" ? Math.max(1, repeats || 1) : 0,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(update);

    // Bump album updatedAt
    await db.collection("albums").doc(req.params.albumId).update({
      updatedAt: update.updatedAt,
    });

    res.json({ id: docId, ...doc.data(), ...update });
  })
);

// ─── PATCH /api/albums/:albumId/stickers (bulk) ─────────────
// Body: { "stickers": [ { "code": "ARG 1", "status": "complete" }, ... ] }

router.patch(
  "/",
  asyncHandler(async (req, res) => {
    await assertAlbumExists(req.params.albumId);

    const { stickers } = req.body;
    if (!Array.isArray(stickers) || stickers.length === 0) {
      const err = new Error("'stickers' array is required");
      err.status = 400;
      throw err;
    }
    if (stickers.length > 100) {
      const err = new Error("Bulk update limited to 100 stickers per request");
      err.status = 400;
      throw err;
    }

    const batch = db.batch();
    const now = new Date().toISOString();
    const results = [];

    for (const item of stickers) {
      if (!item.code || !item.status || !VALID_STATUSES.includes(item.status)) {
        const err = new Error(
          `Invalid entry: each sticker needs 'code' and valid 'status' (${VALID_STATUSES.join(", ")})`
        );
        err.status = 400;
        throw err;
      }

      const docId = codeToDocId(item.code);
      const docRef = stickersCol(req.params.albumId).doc(docId);

      const update = {
        status: item.status,
        repeats: item.status === "repeated" ? Math.max(1, item.repeats || 1) : 0,
        updatedAt: now,
      };

      batch.update(docRef, update);
      results.push({ code: item.code, ...update });
    }

    // Bump album updatedAt
    batch.update(db.collection("albums").doc(req.params.albumId), { updatedAt: now });

    await batch.commit();

    res.json({ updated: results.length, stickers: results });
  })
);

export default router;
