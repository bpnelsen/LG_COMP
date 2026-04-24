import React, { useEffect, useState } from 'react';

interface Summary {
  pageCount: number;
  componentCount: number;
  captureCount: number;
  flowCount: number;
  sections: { section: string; page_count: number }[];
  componentTypes: { type: string; count: number }[];
}

export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null);

  useEffect(() => {
    fetch('/map/summary').then(r => r.json()).then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <p style={{ color: '#64748b' }}>Loading — make sure the backend is running on port 3001.</p>;

  return (
    <div>
      <h1 style={h1}>Reference Map Dashboard</h1>
      <div style={grid}>
        <StatCard label="Screens discovered" value={data.pageCount} color="#38bdf8" />
        <StatCard label="UI components"       value={data.componentCount} color="#a78bfa" />
        <StatCard label="Captures taken"      value={data.captureCount} color="#34d399" />
        <StatCard label="Navigation flows"    value={data.flowCount} color="#fb923c" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32 }}>
        <Section title="Sections">
          <table style={table}>
            <thead><tr><Th>Section</Th><Th>Pages</Th></tr></thead>
            <tbody>
              {data.sections.map(s => (
                <tr key={s.section}>
                  <Td>{s.section || '(unclassified)'}</Td>
                  <Td>{s.page_count}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section title="Component types">
          <table style={table}>
            <thead><tr><Th>Type</Th><Th>Count</Th></tr></thead>
            <tbody>
              {data.componentTypes.map(c => (
                <tr key={c.type}>
                  <Td><code style={{ fontSize: 12 }}>{c.type}</code></Td>
                  <Td>{c.count}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,.07)' }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{title}</h2>
      {children}
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th style={{ textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#94a3b8', paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={{ fontSize: 13, padding: '6px 0', borderBottom: '1px solid #f8fafc', paddingRight: 16 }}>{children}</td>
);

const h1: React.CSSProperties = { fontSize: 22, fontWeight: 700, marginBottom: 24 };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 };
const table: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
