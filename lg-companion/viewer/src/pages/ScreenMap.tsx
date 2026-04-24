import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Page {
  id: number;
  url_pattern: string;
  page_name: string;
  section: string;
  visit_count: number;
  last_seen: string;
  component_count: number;
}

export default function ScreenMap() {
  const [pages, setPages] = useState<Page[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/map/pages').then(r => r.json()).then(setPages);
  }, []);

  const filtered = pages.filter(p =>
    p.page_name.toLowerCase().includes(search.toLowerCase()) ||
    p.section.toLowerCase().includes(search.toLowerCase()) ||
    p.url_pattern.toLowerCase().includes(search.toLowerCase())
  );

  // Group by section
  const sections = Array.from(new Set(filtered.map(p => p.section || '(unclassified)')));

  return (
    <div>
      <h1 style={h1}>Screen Map</h1>
      <input
        style={searchBox}
        placeholder="Search screens…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {pages.length === 0 && (
        <p style={{ color: '#64748b' }}>No screens yet — start browsing Land Gorilla with the extension enabled.</p>
      )}
      {sections.map(section => (
        <div key={section} style={{ marginBottom: 32 }}>
          <h2 style={sectionHead}>{section}</h2>
          <div style={cardGrid}>
            {filtered.filter(p => (p.section || '(unclassified)') === section).map(p => (
              <Link key={p.id} to={`/screens/${p.id}`} style={card}>
                <div style={cardTitle}>{p.page_name}</div>
                <div style={cardUrl}>{p.url_pattern}</div>
                <div style={cardMeta}>
                  {p.component_count} components · {p.visit_count} visits
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const h1: React.CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 20 };
const searchBox: React.CSSProperties = {
  width: '100%', maxWidth: 400, padding: '8px 12px',
  border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 14, marginBottom: 28,
};
const sectionHead: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 };
const cardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 };
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 8, padding: '16px',
  boxShadow: '0 1px 3px rgba(0,0,0,.07)', textDecoration: 'none', color: 'inherit',
  transition: 'box-shadow .15s',
};
const cardTitle: React.CSSProperties = { fontWeight: 600, fontSize: 14, marginBottom: 4 };
const cardUrl: React.CSSProperties = { fontSize: 12, color: '#38bdf8', fontFamily: 'monospace', marginBottom: 8, wordBreak: 'break-all' };
const cardMeta: React.CSSProperties = { fontSize: 12, color: '#94a3b8' };
