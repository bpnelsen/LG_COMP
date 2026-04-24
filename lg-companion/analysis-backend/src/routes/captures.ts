import { Router, Request, Response } from 'express';
import db from '../db';
import { analyzeScreenshot } from '../services/claude';

const router = Router();

// POST /captures — receive a screenshot from the Chrome extension
router.post('/', async (req: Request, res: Response) => {
  const { url, title, trigger, screenshot, timestamp } = req.body as {
    url: string;
    title: string;
    trigger: string;
    screenshot: string;
    timestamp: string;
  };

  if (!url || !screenshot) {
    res.status(400).json({ error: 'url and screenshot are required' });
    return;
  }

  // Store the raw capture immediately
  const capture = db
    .prepare(
      `INSERT INTO captures (url, title, trigger, screenshot, created_at)
       VALUES (?, ?, ?, ?, ?)
       RETURNING id`
    )
    .get(url, title ?? '', trigger ?? 'unknown', screenshot, timestamp ?? new Date().toISOString()) as { id: number };

  res.status(202).json({ captureId: capture.id, status: 'queued' });

  // Analyse asynchronously so the extension doesn't wait
  setImmediate(async () => {
    try {
      const analysis = await analyzeScreenshot(screenshot, url, title ?? '');

      // Persist analysis
      db.prepare(
        `INSERT INTO analyses (capture_id, page_name, section, raw_json)
         VALUES (?, ?, ?, ?)`
      ).run(capture.id, analysis.page_name, analysis.section, JSON.stringify(analysis));

      // Upsert page
      const existing = db
        .prepare(`SELECT id FROM pages WHERE url_pattern = ?`)
        .get(analysis.url_pattern) as { id: number } | undefined;

      let pageId: number;
      if (existing) {
        db.prepare(
          `UPDATE pages SET page_name=?, section=?, last_seen=datetime('now'), visit_count=visit_count+1 WHERE id=?`
        ).run(analysis.page_name, analysis.section, existing.id);
        pageId = existing.id;
      } else {
        const inserted = db
          .prepare(
            `INSERT INTO pages (url_pattern, page_name, section) VALUES (?, ?, ?) RETURNING id`
          )
          .get(analysis.url_pattern, analysis.page_name, analysis.section) as { id: number };
        pageId = inserted.id;
      }

      // Insert components (replace all for this page on each new analysis)
      db.prepare(`DELETE FROM components WHERE page_id = ?`).run(pageId);
      const insertComp = db.prepare(
        `INSERT INTO components (page_id, type, label, purpose, raw_fields)
         VALUES (?, ?, ?, ?, ?)`
      );
      for (const comp of analysis.components) {
        insertComp.run(
          pageId,
          comp.type,
          comp.label,
          comp.purpose ?? '',
          JSON.stringify(comp.fields ?? [])
        );
      }

      // Record flow (previous page → this page)
      const prev = db
        .prepare(`SELECT url FROM captures WHERE id < ? ORDER BY id DESC LIMIT 1`)
        .get(capture.id) as { url: string } | undefined;

      if (prev && prev.url !== url) {
        const fromPattern = normaliseUrl(prev.url);
        const toPattern = analysis.url_pattern;
        db.prepare(
          `INSERT INTO flows (from_pattern, to_pattern, trigger, count)
           VALUES (?, ?, ?, 1)
           ON CONFLICT(from_pattern, to_pattern, trigger) DO UPDATE SET count=count+1`
        ).run(fromPattern, toPattern, trigger ?? 'unknown');
      }

      console.log(`[analysis] capture ${capture.id} → "${analysis.page_name}" (${analysis.section})`);
    } catch (err) {
      console.error(`[analysis] capture ${capture.id} failed:`, (err as Error).message);
    }
  });
});

// GET /captures — list recent captures
router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare(`SELECT id, url, title, trigger, created_at FROM captures ORDER BY id DESC LIMIT 100`)
    .all();
  res.json(rows);
});

function normaliseUrl(url: string): string {
  try {
    const u = new URL(url);
    // Replace numeric IDs and UUIDs in path segments with :id
    const pattern = u.pathname.replace(/\/[0-9a-f-]{8,}/gi, '/:id').replace(/\/\d+/g, '/:id');
    return pattern || '/';
  } catch {
    return url;
  }
}

export default router;
