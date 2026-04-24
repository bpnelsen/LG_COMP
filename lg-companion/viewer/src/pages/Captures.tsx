import React, { useEffect, useState } from 'react';

interface Capture {
  id: number; url: string; title: string; trigger: string; created_at: string;
}

const TRIGGER_COLOR: Record<string, string> = {
  navigation: '#38bdf8', tab_focus: '#a78bfa', modal_open: '#fb923c',
  form_submit: '#34d399', spa_navigation: '#60a5fa', click: '#f472b6', manual: '#94a3b8',
};

export default function Captures() {
  const [captures, setCaptures] = useState<Capture[]>([]);

  useEffect(() => {
    fetch('/captures').then(r => r.json()).then(setCaptures);
    const interval = setInterval(() => {
      fetch('/captures').then(r => r.json()).then(setCaptures);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Captures</h1>
      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>Live feed — refreshes every 5 seconds. {captures.length} total.</p>

      {captures.length === 0 && (
        <p style={{ color: '#64748b' }}>No captures yet. Start browsing Land Gorilla with the extension enabled.</p>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,.07)', overflow: 'hidden' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <Th>ID</Th><Th>Trigger</Th><Th>Title</Th><Th>URL</Th><Th>Time</Th>
          </tr>
        </thead>
        <tbody>
          {captures.map(c => (
            <tr key={c.id} style={{ borderTop: '1px solid #f1f5f9' }}>
              <Td>{c.id}</Td>
              <Td>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12,
                  background: `${TRIGGER_COLOR[c.trigger] ?? '#94a3b8'}20`,
                  color: TRIGGER_COLOR[c.trigger] ?? '#94a3b8',
                }}>
                  {c.trigger}
                </span>
              </Td>
              <Td>{c.title}</Td>
              <Td><span style={{ fontSize: 12, fontFamily: 'monospace', color: '#38bdf8', wordBreak: 'break-all' }}>{c.url}</span></Td>
              <Td><span style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(c.created_at).toLocaleTimeString()}</span></Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th style={{ textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#94a3b8', padding: '10px 14px' }}>{children}</th>
);
const Td = ({ children }: { children: React.ReactNode }) => (
  <td style={{ fontSize: 13, padding: '10px 14px' }}>{children}</td>
);
