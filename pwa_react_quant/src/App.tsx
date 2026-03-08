import { useEffect, useState, useCallback, useRef } from 'react';
import { initPyodide } from './engine/pyodide-runner';
import { UNITS } from './units-registry';
import type { UnitDef } from './units/types';
import Home from './components/Home';
import UnitContent from './components/UnitContent';
import UnitSidebar from './components/UnitSidebar';
import Playground from './components/Playground';

export default function App() {
  const getHashUnitId = useCallback(() => {
    const rawHash = window.location.hash.replace('#', '');
    const hash = rawHash || 'home';
    console.log('[Routing] Hash:', hash);

    if (hash.includes('playground')) {
      return 'playground';
    }
    if (hash.startsWith('unit/')) {
      return hash.replace('unit/', '');
    }
    return null;
  }, []);

  const [currentUnitId, setCurrentUnitId] = useState<string | null>(() => getHashUnitId());
  const [currentUnit, setCurrentUnit] = useState<UnitDef | null>(null);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [statusText, setStatusText] = useState('Booting Engine');
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const loadingProgressRef = useRef(10);

  const handleHashChange = useCallback(() => {
    const id = getHashUnitId();
    setCurrentUnitId(id);
    if (id && id !== 'playground') {
      setLoadingUnit(true);
    } else {
      setCurrentUnit(null);
      setLoadingUnit(false);
    }
  }, [getHashUnitId]);

  useEffect(() => {
    window.addEventListener('hashchange', handleHashChange);
    initPyodide(msg => {
      setStatusText(msg);
      // Smoothly increment progress based on actual stages
      loadingProgressRef.current = Math.min(loadingProgressRef.current + 15, 90);
    }).then(() => setPyodideReady(true));
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  useEffect(() => {
    document.body.className = darkMode ? 'dark' : 'light';
  }, [darkMode]);

  useEffect(() => {
    if (currentUnitId && UNITS[currentUnitId]) {
      const { loader, exportKey } = UNITS[currentUnitId];
      loader().then(module => {
        setCurrentUnit(module[exportKey]);
        setLoadingUnit(false);
      });
    }
  }, [currentUnitId]);

  const loadingProgress = pyodideReady ? 100 : loadingProgressRef.current;

  return (
    <>
      {!pyodideReady && (
        <div className="loading-overlay">
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div className="spinner" style={{ width: 56, height: 56 }} />
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.7rem', fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
              color: 'var(--brand-primary)'
            }}>
              {loadingProgress}%
            </div>
          </div>
          <div style={{
            fontSize: '0.72rem',
            color: 'var(--brand-primary)',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontWeight: 600,
            opacity: 0.7
          }}>
            {statusText}...
          </div>
          <div style={{
            marginTop: 16,
            width: 200,
            height: 2,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: '100%',
              background: 'var(--gradient-primary, var(--brand-primary))',
              borderRadius: 2,
              transition: 'width 0.5s ease'
            }} />
          </div>
        </div>
      )}

      <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
        {/* ── Main Layout: Sidebar + Content ── */}
        <div className={`app-body ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <UnitSidebar
            activeId={currentUnitId}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            darkMode={darkMode}
            onToggleTheme={() => setDarkMode(!darkMode)}
          />

          <main className="main-content">
            {currentUnitId ? (
              loadingUnit ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: '100%', background: 'var(--bg-app)'
                }}>
                  <div className="spinner" />
                </div>
              ) : currentUnitId === 'playground' ? (
                <Playground pyodideReady={pyodideReady} onRunStart={() => setSidebarCollapsed(true)} />
              ) : currentUnit ? (
                <UnitContent
                  key={currentUnitId}
                  unitId={currentUnitId}
                  unit={currentUnit}
                  pyodideReady={pyodideReady}
                  onRunStart={() => setSidebarCollapsed(true)}
                />
              ) : null
            ) : (
              <Home />
            )}
          </main>
        </div>
      </div>
    </>
  );
}
