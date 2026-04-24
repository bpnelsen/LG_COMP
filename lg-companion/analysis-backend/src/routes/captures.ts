import { Router, Request, Response } from 'express';
import db from '../db';
import { analyzeScreenshot } from '../services/claude';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { url, title, trigger, screenshot, timestamp } = req.body as {
    url: string; title: string; trigger: string; screenshot: string; timestamp: string;
  };

  if (!url || !screenshot) {
    res.status(400).json({ error: 'url and screenshot are required' });
    return;
  }

  const { lastInsertRowid } = db
    .prepare(
      `INSERT INTO captures (url, title, trigger, screenshot, created_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(url, title ?? '', trigger ?? 'unknown', screenshot, timestamp ?? new Date().toISOString());

  const captureId = Number(lastInsertRowid);
  res.status(202).json({ captureId, status: 'queued' });

  setImmediate(async () => {
    try {
      const analysis = await analyzeScreenshot(screenshot, url, title ?? '');

      db.prepare(
        `INSERT INTO analyses (capture_id, page_name, section, raw_json) VALUES (?, ?, ?, ?)`
      ).run(captureId, analysis.page_name, analysis.section, JSON.stringify(analysis));

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
        const { lastInsertRowid: pid } = db
          .prepare(`INSERT INTO pages (url_pattern, page_name, section) VALUES (?, ?, ?)`)
          .run(analysis.url_pattern, analysis.page_name, analysis.section);
        pageId = Number(pid);
      }

      db.prepare(`DELETE FROM components WHERE page_id = ?`).run(pageId);
      const insertComp = db.prepare(
        `INSERT INTO components (page_id, type, label, purpose, raw_fields) VALUES (?, ?, ?, ?, ?)`
      );
      for (const comp of analysis.components) {
        insertComp.run(pageId, comp.type, comp.label, comp.purpose ?? '', JSON.stringify(comp.fields ?? []));
      }

      // Record navigation flow
      const prev = db
        .prepare(`SELECT url FROM captures WHERE id < ? ORDER BY id DESC LIMIT 1`)
        .get(captureId) as { url: string } | undefined;

      if (prev && prev.url !== url) {
        db.prepare(
          `INSERT INTO flows (from_pattern, to_pattern, trigger, count) VALUES (?, ?, ?, 1)
           ON CONFLICT(from_pattern, to_pattern, trigger) DO UPDATE SET count=count+1`
        ).run(normaliseUrl(prev.url), analysis.url_pattern, trigger ?? 'unknown');
      }

      console.log(`[analysis] capture ${captureId} → "${analysis.page_name}" (${analysis.section})`);
    } catch (err) {
      console.error(`[analysis] capture ${captureId} failed:`, (err as Error).message);
    }
  });
});

router.get('/', (_req: Request, res: Response) => {
  const rows = db
    .prepare(`SELECT id, url, title, trigger, created_at FROM captures ORDER BY id DESC LIMIT 100`)
    .all();
  res.json(rows);
});

function normaliseUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.pathname.replace(/\/[0-9a-f-]{8,}/gi, '/:id').replace(/\/\d+/g, '/:id') || '/';
  } catch {
    return url;
  }
}

export default router;
