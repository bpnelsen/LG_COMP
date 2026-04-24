import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

interface Component {
  id: number; type: string; label: string; purpose: string; raw_fields: string;
}
interface PageData {
  id: number; url_pattern: string; page_name: string; section: string;
  visit_count: number; first_seen: string; last_seen: string;
  components: Component[];
  recent_analyses: { raw_json: string; created_at: string; url: string; trigger: string }[];
}

export default function PageDetail() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<PageData | null>(null);

  useEffect(() => {
    fetch(`/map/pages/${id}`).then(r => r.json()).then(setPage);
  }, [id]);

  if (!page) return <p>Loading…</p>;

  const fields = (raw: string): string[] => { try { return JSON.parse(raw); } catch { return []; } };

  return (
    <div>
      <Link to="/screens" style={{ fontSize: 13, color: '#38bdf8', textDecoration: 'none' }}>← Screen Map</Link>
      <h1 style={h1}>{page.page_name}</h1>
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <Badge color="#38bdf8">{page.section || 'unclassified'}</Badge>
        <Badge color="#a78bfa">{page.visit_count} visits</Badge>
        <Badge color="#34d399">{page.components.length} components</Badge>
        <code style={{ fontSize: 12, color: '#64748b', alignSelf: 'center' }}>{page.url_pattern}</code>
      </div>

      <h2 style={sectionH}>Components</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 32 }}>
        {page.components.map(c => (
          <div key={c.id} style={compCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</span>
              <code style={{ fontSize: 11, color: '#38bdf8', background: '#f0f9ff', padding: '2px 6px', borderRadius: 4 }}>{c.type}</code>
            </div>
            <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px' }}>{c.purpose}</p>
            {fields(c.raw_fields).length > 0 && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 4 }}>FIELDS</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#64748b' }}>
                  {fields(c.raw_fields).map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>

      {page.recent_analyses.length > 0 && (
        <>
          <h2 style={sectionH}>Recent Analyses</h2>
          {page.recent_analyses.map((a, i) => {
            let parsed: Record<string, unknown> = {};
            try { parsed = JSON.parse(a.raw_json); } catch {}
            return (
              <details key={i} style={{ marginBottom: 8, background: '#fff', borderRadius: 8, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                  {a.created_at} · {a.trigger} · <span style={{ color: '#64748b', fontWeight: 400 }}>{a.url}</span>
                </summary>
                <pre style={{ fontSize: 12, marginTop: 12, overflow: 'auto', color: '#334155' }}>{JSON.stringify(parsed, null, 2)}</pre>
              </details>
            );
          })}
        </>
      )}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span style={{ background: `${color}20`, color, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600 }}>
      {children}
    </span>
  );
}

const h1: React.CSSProperties = { fontSize: 22, fontWeight: 700, margin: '12px 0 16px' };
const sectionH: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 };
const compCard: React.CSSProperties = { background: '#fff', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' };
