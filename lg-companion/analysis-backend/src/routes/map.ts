import { Router, Request, Response } from 'express';
import db from '../db';

const router = Router();

// GET /map/pages — all unique pages seen
router.get('/pages', (_req: Request, res: Response) => {
  const pages = db
    .prepare(
      `SELECT p.*, COUNT(c.id) as component_count
       FROM pages p
       LEFT JOIN components c ON c.page_id = p.id
       GROUP BY p.id
       ORDER BY p.visit_count DESC`
    )
    .all();
  res.json(pages);
});

// GET /map/pages/:id — page detail with all components
router.get('/pages/:id', (req: Request, res: Response) => {
  const page = db.prepare(`SELECT * FROM pages WHERE id = ?`).get(req.params.id);
  if (!page) { res.status(404).json({ error: 'Not found' }); return; }

  const components = db
    .prepare(`SELECT * FROM components WHERE page_id = ? ORDER BY id`)
    .all(req.params.id);

  const analyses = db
    .prepare(
      `SELECT a.raw_json, a.created_at, c.url, c.trigger
       FROM analyses a JOIN captures c ON c.id = a.capture_id
       JOIN pages p ON p.url_pattern = ?
       ORDER BY a.id DESC LIMIT 5`
    )
    .all((page as { url_pattern: string }).url_pattern);

  res.json({ ...page as object, components, recent_analyses: analyses });
});

// GET /map/flows — navigation flows between pages
router.get('/flows', (_req: Request, res: Response) => {
  const flows = db
    .prepare(`SELECT * FROM flows ORDER BY count DESC`)
    .all();
  res.json(flows);
});

// GET /map/components — all components across all pages
router.get('/components', (_req: Request, res: Response) => {
  const components = db
    .prepare(
      `SELECT c.*, p.page_name, p.section
       FROM components c
       JOIN pages p ON p.id = c.page_id
       ORDER BY p.section, p.page_name, c.type`
    )
    .all();
  res.json(components);
});

// GET /map/summary — high-level counts
router.get('/summary', (_req: Request, res: Response) => {
  const pageCount = (db.prepare(`SELECT COUNT(*) as n FROM pages`).get() as { n: number }).n;
  const componentCount = (db.prepare(`SELECT COUNT(*) as n FROM components`).get() as { n: number }).n;
  const captureCount = (db.prepare(`SELECT COUNT(*) as n FROM captures`).get() as { n: number }).n;
  const flowCount = (db.prepare(`SELECT COUNT(*) as n FROM flows`).get() as { n: number }).n;

  const sections = db
    .prepare(`SELECT section, COUNT(*) as page_count FROM pages GROUP BY section ORDER BY page_count DESC`)
    .all();

  const componentTypes = db
    .prepare(`SELECT type, COUNT(*) as count FROM components GROUP BY type ORDER BY count DESC`)
    .all();

  res.json({ pageCount, componentCount, captureCount, flowCount, sections, componentTypes });
});

export default router;
