import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Component {
  id: number; type: string; label: string; purpose: string;
  raw_fields: string; page_name: string; section: string; page_id: number;
}

const TYPE_COLORS: Record<string, string> = {
  table: '#3b82f6', form: '#8b5cf6', modal: '#ec4899', button: '#f59e0b',
  card: '#10b981', tabs: '#06b6d4', sidebar: '#64748b', header: '#6366f1',
  chart: '#ef4444', filter: '#84cc16', search: '#14b8a6', other: '#94a3b8',
};

export default function ComponentLibrary() {
  const [components, setComponents] = useState<Component[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/map/components').then(r => r.json()).then(setComponents);
  }, []);

  const types = ['all', ...Array.from(new Set(components.map(c => c.type))).sort()];
  const filtered = filter === 'all' ? components : components.filter(c => c.type === filter);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Component Library</h1>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {types.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: 'none', cursor: 'pointer',
              background: filter === t ? (TYPE_COLORS[t] ?? '#3b82f6') : '#e2e8f0',
              color: filter === t ? '#fff' : '#475569',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {components.length === 0 && (
        <p style={{ color: '#64748b' }}>No components yet — browse Land Gorilla to start building the library.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {filtered.map(c => {
          const color = TYPE_COLORS[c.type] ?? '#94a3b8';
          let fields: string[] = [];
          try { fields = JSON.parse(c.raw_fields); } catch {}
          return (
            <div key={c.id} style={{ background: '#fff', borderRadius: 8, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.07)', borderTop: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{c.label}</span>
                <code style={{ fontSize: 11, color, background: `${color}15`, padding: '2px 6px', borderRadius: 4 }}>{c.type}</code>
              </div>
              <p style={{ fontSize: 13, color: '#475569', margin: '0 0 8px' }}>{c.purpose}</p>
              {fields.length > 0 && (
                <ul style={{ margin: '0 0 8px', paddingLeft: 16, fontSize: 12, color: '#64748b' }}>
                  {fields.map((f, i) => <li key={i}>{f}</li>)}
                </ul>
              )}
              <Link to={`/screens/${c.page_id}`} style={{ fontSize: 12, color: '#38bdf8', textDecoration: 'none' }}>
                {c.section} › {c.page_name}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
