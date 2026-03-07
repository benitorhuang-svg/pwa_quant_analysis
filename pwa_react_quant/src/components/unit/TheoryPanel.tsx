/**
 * TheoryPanel.tsx — 理論說明面板
 */
import { useEffect, useRef } from 'react';
import type { UnitDef } from '../../units/types';
import katex from 'katex';
import { BookOpen } from 'lucide-react';
import { UNITS } from '../../units-registry';

interface Props {
    unit: UnitDef;
    unitId: string;
}

export default function TheoryPanel({ unit, unitId }: Props) {
    const theoryRef = useRef<HTMLDivElement>(null);

    const sortedIds = Object.keys(UNITS).sort((a, b) => {
        const [aMod, aUnit] = a.split('-').map(Number);
        const [bMod, bUnit] = b.split('-').map(Number);
        if (aMod !== bMod) return aMod - bMod;
        return aUnit - bUnit;
    });

    const currIndex = sortedIds.indexOf(unitId);
    const prevId = currIndex > 0 ? sortedIds[currIndex - 1] : null;
    const nextId = currIndex !== -1 && currIndex < sortedIds.length - 1 ? sortedIds[currIndex + 1] : null;

    useEffect(() => {
        if (theoryRef.current) {
            theoryRef.current.querySelectorAll('.formula-box').forEach(el => {
                if (el.id === 'kelly-formula')
                    katex.render('f^* = \\frac{bp - q}{b}', el as HTMLElement, { displayMode: true, throwOnError: false });
                if (el.id === 'ma-formula')
                    katex.render('MA(n) = \\frac{1}{n} \\sum_{i=1}^{n} C_i', el as HTMLElement, { displayMode: true, throwOnError: false });
            });
        }
    }, [unit]);

    return (
        <>
            <div className="unit-header-area">
                <div className="unit-header-badges" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div className="badges-left">
                        <span className="badge-module">{unit.module}</span>
                    </div>
                    <div className="badges-right" style={{ display: 'flex', gap: '8px' }}>
                        {prevId && (
                            <a href={`#unit/${prevId}`} className="badge-nav" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                « 上一單元
                            </a>
                        )}
                        {nextId && (
                            <a href={`#unit/${nextId}`} className="badge-nav" style={{ textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s' }}>
                                下一單元 »
                            </a>
                        )}
                    </div>
                </div>
                <h1 className="unit-title">{unit.title}</h1>
                <div className="unit-description">
                    <p>{unit.description}</p>
                </div>
            </div>

            <div className="section-card">
                <h2 className="section-title"><BookOpen size={14} /> 核心理論</h2>
                <div className="theory-text" ref={theoryRef} dangerouslySetInnerHTML={{ __html: unit.theory }} />
            </div>

            {unit.exercises && (
                <div className="section-card" style={{ marginTop: '16px' }}>
                    <h2 className="section-title" style={{ color: 'var(--brand-amber)' }}>💡 實戰練習</h2>
                    <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.8 }}>
                        {unit.exercises.map((e, i) => (
                            <li key={i} style={{ marginBottom: '6px' }}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
