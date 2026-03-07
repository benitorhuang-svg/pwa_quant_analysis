/**
 * TheoryPanel.tsx — 理論說明面板
 */
import { useEffect, useRef } from 'react';
import type { UnitDef } from '../../units/types';
import katex from 'katex';
import { BookOpen } from 'lucide-react';

interface Props {
    unit: UnitDef;
}

export default function TheoryPanel({ unit }: Props) {
    const theoryRef = useRef<HTMLDivElement>(null);

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
                <div className="unit-header-badges">
                    <span className="badge-module">{unit.module}</span>
                    {unit.difficulty && <span className="badge-difficulty">{unit.difficulty}</span>}
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
