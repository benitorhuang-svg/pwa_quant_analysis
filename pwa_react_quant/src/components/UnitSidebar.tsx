import { useState } from 'react';
import { UNIT_METADATA } from '../units-registry';
import { BookOpen, ChevronDown, ChevronRight, Layers, Moon, Sun } from 'lucide-react';

interface Props {
    activeId: string | null;
    collapsed: boolean;
    onToggle: () => void;
    darkMode?: boolean;
    onToggleTheme?: () => void;
}

export default function UnitSidebar({ activeId, collapsed, onToggle, darkMode, onToggleTheme }: Props) {
    // Group units by module, keyed by numeric prefix for correct ordering
    const moduleGroups: Record<string, { id: string; title: string; moduleName: string }[]> = {};
    Object.entries(UNIT_METADATA).forEach(([id, meta]) => {
        const modName = meta.module;
        if (!moduleGroups[modName]) moduleGroups[modName] = [];
        moduleGroups[modName].push({ id, title: meta.title, moduleName: modName });
    });

    // Sort by the numeric prefix of the first unit ID in each module (e.g. "1-1" → 1)
    const moduleKeys = Object.keys(moduleGroups).sort((a, b) => {
        const aNum = parseInt(moduleGroups[a][0].id.split('-')[0], 10);
        const bNum = parseInt(moduleGroups[b][0].id.split('-')[0], 10);
        return aNum - bNum;
    });

    // Track which modules are expanded
    const activeModule = activeId ? UNIT_METADATA[activeId]?.module : null;
    const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
        const init: Record<string, boolean> = {};
        moduleKeys.forEach(k => {
            init[k] = k === activeModule;
        });
        return init;
    });

    const toggleModule = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    if (collapsed) {
        return (
            <aside className="unit-sidebar collapsed">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '16px', marginTop: '4px' }}>
                    <button className="theme-toggle" onClick={onToggleTheme} style={{ width: 26, height: 26, background: 'var(--gradient-primary)', border: 'none', color: '#fff' }}>
                        {darkMode ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                    <button className="sidebar-toggle" onClick={onToggle} title="展開導航" style={{ width: 26, height: 26 }}>
                        <BookOpen size={14} />
                    </button>
                </div>
                <div className="sidebar-collapsed-icons">
                    {moduleKeys.map((key, i) => (
                        <div
                            key={key}
                            className={`sidebar-icon-item ${key === activeModule ? 'active' : ''}`}
                            title={key}
                            onClick={() => {
                                const firstUnit = moduleGroups[key][0];
                                if (firstUnit) window.location.hash = `unit/${firstUnit.id}`;
                            }}
                        >
                            <span style={{
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                fontFamily: "'JetBrains Mono', monospace"
                            }}>
                                {String(i + 1).padStart(2, '0')}
                            </span>
                        </div>
                    ))}
                </div>
            </aside>
        );
    }

    return (
        <aside className="unit-sidebar">
            <div className="sidebar-brand-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
                <div className="nav-brand" onClick={() => (window.location.hash = 'home')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <button className="theme-toggle" onClick={(e) => { e.stopPropagation(); onToggleTheme?.(); }} style={{ width: 24, height: 24, flexShrink: 0, background: 'var(--gradient-primary)', border: 'none', color: '#fff', boxShadow: '0 0 12px var(--brand-glow)' }}>
                        {darkMode ? <Sun size={13} /> : <Moon size={13} />}
                    </button>
                    <span className="brand-text" style={{ fontWeight: 800, fontSize: '0.92rem' }}>Quant_Lab</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="sidebar-toggle" onClick={onToggle} title="收合導航" style={{ width: 26, height: 26 }}>
                        <ChevronDown size={14} style={{ transform: 'rotate(90deg)' }} />
                    </button>
                </div>
            </div>

            <div className="sidebar-header-row" style={{ borderBottom: 'none', background: 'transparent', height: '34px' }}>
                <div className="sidebar-title">
                    <Layers size={13} />
                    <span>Theory/Content</span>
                </div>
            </div>

            <nav className="sidebar-tree">
                {moduleKeys.map((modName) => {
                    const units = moduleGroups[modName];
                    const isExpanded = expanded[modName];
                    const shortName = modName.split(' · ')[1] || modName;
                    const modNum = modName.match(/模組(\S+)/)?.[1] || '';

                    return (
                        <div key={modName} className="tree-module">
                            <button
                                className={`tree-module-header ${isExpanded ? 'expanded' : ''}`}
                                onClick={() => toggleModule(modName)}
                            >
                                {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                <span className="tree-module-label">
                                    {modNum && <span className="tree-mod-num">{modNum}</span>}
                                    {shortName}
                                </span>
                            </button>

                            {isExpanded && (
                                <div className="tree-unit-list">
                                    {units.map(u => (
                                        <a
                                            key={u.id}
                                            className={`tree-unit-item ${activeId === u.id ? 'active' : ''}`}
                                            href={`#unit/${u.id}`}
                                        >
                                            <span className="tree-unit-dot" />
                                            <span className="tree-unit-name">{u.title}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>
        </aside>
    );
}
