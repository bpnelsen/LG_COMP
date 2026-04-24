import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ScreenMap from './pages/ScreenMap';
import PageDetail from './pages/PageDetail';
import ComponentLibrary from './pages/ComponentLibrary';
import Captures from './pages/Captures';

const NAV = [
  { to: '/',            label: 'Dashboard'   },
  { to: '/screens',     label: 'Screen Map'  },
  { to: '/components',  label: 'Components'  },
  { to: '/captures',    label: 'Captures'    },
];

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside style={sidebar}>
          <div style={logo}>LG Companion</div>
          <nav>
            {NAV.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} style={navStyle}>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/screens"       element={<ScreenMap />} />
            <Route path="/screens/:id"   element={<PageDetail />} />
            <Route path="/components"    element={<ComponentLibrary />} />
            <Route path="/captures"      element={<Captures />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

const sidebar: React.CSSProperties = {
  width: 200, background: '#1e293b', color: '#f1f5f9',
  display: 'flex', flexDirection: 'column', padding: '24px 16px',
};
const logo: React.CSSProperties = {
  fontWeight: 700, fontSize: 15, marginBottom: 32, color: '#38bdf8',
};
const navStyle = ({ isActive }: { isActive: boolean }): React.CSSProperties => ({
  display: 'block', padding: '8px 12px', borderRadius: 6, marginBottom: 4,
  textDecoration: 'none', fontSize: 14, fontWeight: 500,
  color: isActive ? '#38bdf8' : '#94a3b8',
  background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
});
