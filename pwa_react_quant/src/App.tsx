import { useEffect, useState, useMemo, useCallback } from 'react';
import { initPyodide } from './engine/pyodide-runner';
import { UNIT_LOADERS, UNIT_METADATA, UNIT_EXPORT_MAP } from './units-registry';
import type { UnitDef } from './units/types';
import Home from './components/Home';
import UnitContent from './components/UnitContent';

console.log('[App] 載入啟動塊');

export default function App() {
  // Group metadata for the dropdowns
  const moduleGroups = useMemo(() => {
    const groups: Record<string, { id: string, title: string }[]> = {};
    Object.entries(UNIT_METADATA).forEach(([id, meta]) => {
      const modName = meta.module;
      if (!groups[modName]) groups[modName] = [];
      groups[modName].push({ id, title: meta.title });
    });
    return groups;
  }, []);

  const modules = useMemo(() => Object.keys(moduleGroups), [moduleGroups]);

  const getHashInfo = useCallback(() => {
    const hash = window.location.hash.slice(1) || 'home';
    if (hash.startsWith('unit/')) {
      const id = hash.replace('unit/', '');
      const meta = UNIT_METADATA[id];
      return { id, module: meta?.module || '' };
    }
    return { id: null, module: modules.length > 0 ? modules[0] : '' };
  }, [modules]);

  const [currentUnitId, setCurrentUnitId] = useState<string | null>(() => getHashInfo().id);
  const [selectedModule, setSelectedModule] = useState<string>(() => getHashInfo().module);

  const [currentUnit, setCurrentUnit] = useState<UnitDef | null>(null);
  const [loadingUnit, setLoadingUnit] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [statusText, setStatusText] = useState('初始化中');
  const [darkMode, setDarkMode] = useState(true);

  const handleHashChange = useCallback(() => {
    const { id, module } = getHashInfo();
    console.log('[App] Hash 變更:', id);
    setCurrentUnitId(id);
    if (id) {
      setLoadingUnit(true);
      if (module) setSelectedModule(module);
    } else {
      setCurrentUnit(null);
      setLoadingUnit(false);
    }
  }, [getHashInfo]);

  useEffect(() => {
    console.log('[App] 組件掛載');
    window.addEventListener('hashchange', handleHashChange);

    // Python Initialization
    initPyodide(msg => {
      setStatusText(msg);
    }).then(() => {
      console.log('[App] Pyodide Ready');
      setPyodideReady(true);
      setStatusText('系統就緒');
    }).catch(err => {
      console.error('[App] Pyodide Error:', err);
      setStatusText('核心載入失敗');
    });

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [handleHashChange]);

  useEffect(() => {
    if (currentUnitId && UNIT_LOADERS[currentUnitId]) {
      console.log('[App] 正在載入單元定義:', currentUnitId);
      // setLoadingUnit(true) is now handled in handleHashChange
      const loader = UNIT_LOADERS[currentUnitId];
      const exportKey = UNIT_EXPORT_MAP[currentUnitId];

      loader().then(module => {
        console.log('[App] 單元載入成功:', currentUnitId);
        setCurrentUnit(module[exportKey]);
        setLoadingUnit(false);
      }).catch(err => {
        console.error('[App] 單元載入出錯:', err);
        setLoadingUnit(false);
      });
    }
  }, [currentUnitId]);

  return (
    <>
      {/* 啟動遮罩 - 僅在核心未準備好時顯示 */}
      {!pyodideReady && (
        <div className="loading-overlay" style={{ background: '#0a0e1a', zIndex: 9999, position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner"></div>
          <div style={{ marginTop: 24, fontSize: '0.95rem', color: '#22d3ee', letterSpacing: '0.1em' }}>
            {statusText}...
          </div>
        </div>
      )}

      <div className={`app-container ${darkMode ? 'dark' : 'light'}`}>
        <nav className="top-nav">
          <div className="nav-brand" onClick={() => (window.location.hash = 'home')} style={{ cursor: 'pointer' }}>
            <span className="brand-icon">📈</span> Quant_Book (實戰)
          </div>

          <div className="nav-dropdowns">
            <div className="nav-dropdown">
              <span className="nav-dropdown-icon">📂</span>
              <select className="nav-select" value={selectedModule} onChange={e => setSelectedModule(e.target.value)}>
                {modules.map(mod => (<option value={mod} key={mod}>{mod.split(' · ')[1] || mod}</option>))}
              </select>
              <span className="nav-arrow">▼</span>
            </div>

            <div className="nav-dropdown">
              <span className="nav-dropdown-icon">💡</span>
              <select className="nav-select" value={currentUnitId || ''} onChange={e => (window.location.hash = `unit/${e.target.value}`)}>
                <option value="">選擇章節單元...</option>
                {moduleGroups[selectedModule]?.map(u => (<option value={u.id} key={u.id}>{u.title}</option>))}
              </select>
              <span className="nav-arrow">▼</span>
            </div>

            <div className="nav-dropdown">
              <span className="nav-dropdown-icon">💻</span>
              <select className="nav-select" disabled>
                <option>{currentUnitId ? `strategy_${currentUnitId.replace('-', '_')}.py` : '腳本選擇...'}</option>
              </select>
              <span className="nav-arrow">▼</span>
            </div>
          </div>

          <div className="header-actions">
            <div className={`pyodide-status ${pyodideReady ? 'ready' : ''}`}>
              <span className="status-dot"></span>
              <span>{pyodideReady ? '引擎就緒' : statusText}</span>
            </div>
            <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title="切換主題">
              {darkMode ? '🌙' : '☀️'}
            </button>
          </div>
        </nav>

        <main className="main-content">
          {currentUnitId ? (
            loadingUnit ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: '#05070a' }}>
                <div className="spinner"></div>
              </div>
            ) : currentUnit ? (
              <UnitContent key={currentUnitId} unitId={currentUnitId} unit={currentUnit} pyodideReady={pyodideReady} />
            ) : <div style={{ padding: 40, color: '#fff' }}>單元載入錯誤</div>
          ) : (
            <Home />
          )}
        </main>
      </div>
    </>
  );
}
