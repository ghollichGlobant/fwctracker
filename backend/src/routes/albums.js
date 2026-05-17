import { Router } from "express";
import db from "../firebase.js";
import { SPECIAL_STICKERS, GROUPS } from "../albumData.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();
const albumsCol = () => db.collection("albums");

// ─── helpers ────────────────────────────────────────────────

/** Build the full 980-sticker map with default state. */
function buildDefaultStickers() {
  const stickers = {};

  SPECIAL_STICKERS.forEach((s) => {
    stickers[s.code] = {
      code: s.code,
      label: s.label,
      team: "FWC",
      group: "Special",
      foil: true,
      status: "missing",
      repeats: 0,
    };
  });

  GROUPS.forEach((g) => {
    g.teams.forEach((t) => {
      for (let i = 1; i <= 20; i++) {
        const code = `${t.code} ${i}`;
        let label;
        if (i === 1) label = "Team Badge";
        else if (i === 13) label = "Team Photo";
        else label = t.players[i - 2] || `Player ${i}`;

        stickers[code] = {
          code,
          label,
          team: t.code,
          teamName: t.name,
          flag: t.flag,
          group: g.name,
          foil: i === 1,
          status: "missing",
          repeats: 0,
        };
      }
    });
  });

  return stickers;
}

// ─── POST /api/albums — create (seed) a new album ──────────

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, owner } = req.body;
    if (!name) {
      const err = new Error("'name' is required"); err.status = 400; throw err;
    }

    const stickers = buildDefaultStickers();
    const now = new Date().toISOString();

    const docRef = await albumsCol().add({
      name,
      owner: owner || "Anonymous",
      totalStickers: Object.keys(stickers).length,
      createdAt: now,
      updatedAt: now,
    });

    // Store stickers in a subcollection — Firestore limits batches to 500,
    // so we split the 980 stickers into chunks.
    const stickerEntries = Object.entries(stickers);
    const BATCH_SIZE = 450;
    const stickersColRef = albumsCol().doc(docRef.id).collection("stickers");

    for (let i = 0; i < stickerEntries.length; i += BATCH_SIZE) {
      const batch = db.batch();
      const chunk = stickerEntries.slice(i, i + BATCH_SIZE);
      chunk.forEach(([code, sticker]) => {
        const docId = code.replace(/ /g, "_");
        batch.set(stickersColRef.doc(docId), { ...sticker, updatedAt: now });
      });
      await batch.commit();
    }

    res.status(201).json({
      id: docRef.id,
      name,
      owner: owner || "Anonymous",
      totalStickers: Object.keys(stickers).length,
      createdAt: now,
    });
  })
);

// ─── GET /api/albums/:albumId — album metadata + live stats ─

router.get(
  "/:albumId",
  asyncHandler(async (req, res) => {
    const doc = await albumsCol().doc(req.params.albumId).get();
    if (!doc.exists) {
      const err = new Error("Album not found"); err.status = 404; throw err;
    }

    // Compute stats from stickers subcollection
    const stickersSnap = await albumsCol()
      .doc(req.params.albumId)
      .collection("stickers")
      .get();

    let complete = 0;
    let missing = 0;
    let repeated = 0;
    let totalRepeats = 0;

    stickersSnap.forEach((s) => {
      const data = s.data();
      if (data.status === "complete") complete++;
      else if (data.status === "repeated") { repeated++; totalRepeats += data.repeats || 0; }
      else missing++;
    });

    const total = stickersSnap.size;

    res.json({
      id: doc.id,
      ...doc.data(),
      stats: {
        total,
        complete,
        missing,
        repeated,
        totalRepeats,
        progress: total > 0 ? Math.round((complete / total) * 10000) / 100 : 0,
      },
    });
  })
);

// ─── GET /api/albums — list all albums ──────────────────────

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const snap = await albumsCol().orderBy("createdAt", "desc").get();
    const albums = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(albums);
  })
);

export default router;
