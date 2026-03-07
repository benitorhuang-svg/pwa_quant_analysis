/**
 * useOptimizer.ts — Encapsulates parameter optimization scanning logic
 */
import { useState, useCallback } from 'react';
import type { UnitDef } from '../units/types';
import type { ScanResult, ScanParamConfig } from '../types/backtest';
import { getCode } from '../engine/editor';
import { runAndGetResult } from '../engine/pyodide-runner';

function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface UseOptimizerOptions {
    unit: UnitDef;
    pyodideReady: boolean;
    params: Record<string, number>;
    onRunStart?: () => void;
}

export function useOptimizer({ unit, pyodideReady, params, onRunStart }: UseOptimizerOptions) {
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [optimizeProgress, setOptimizeProgress] = useState({ current: 0, total: 0 });
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [scanParams, setScanParams] = useState<Record<string, ScanParamConfig>>(() => {
        const init: Record<string, ScanParamConfig> = {};
        unit.params?.forEach(p => {
            init[p.id] = { start: p.min, end: p.max, step: p.step * 5, active: false };
        });
        return init;
    });

    const handleOptimize = useCallback(async () => {
        if (!pyodideReady) return;
        onRunStart?.();
        setIsOptimizing(true);
        setScanResults([]);

        const activeParams = Object.entries(scanParams).filter(([_, v]) => v.active);
        if (activeParams.length === 0) {
            setIsOptimizing(false);
            return alert("請至少選擇一個參數進行優化");
        }

        const originalCode = getCode();
        const combinations: Record<string, number>[] = [{}];

        activeParams.forEach(([id, cfg]) => {
            const currentCombos = [...combinations];
            combinations.length = 0;
            for (let v = cfg.start; v <= cfg.end; v += cfg.step) {
                currentCombos.forEach(c => combinations.push({ ...c, [id]: v }));
            }
        });

        if (combinations.length > 50) {
            if (!confirm(`將執行 ${combinations.length} 次回測，可能需要一點時間。確定繼續？`)) {
                setIsOptimizing(false);
                return;
            }
        }

        const results: ScanResult[] = [];
        setOptimizeProgress({ current: 0, total: combinations.length });

        for (let i = 0; i < combinations.length; i++) {
            const combo = combinations[i];
            setOptimizeProgress(prev => ({ ...prev, current: i + 1 }));

            // Allow UI to breathe
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 0));

            let trialCode = originalCode;
            Object.entries(combo).forEach(([id, val]) => {
                trialCode = trialCode.replace(
                    new RegExp(`^(${escapeRegex(id)}\\s*=\\s*)([\\d.]+)`, 'm'),
                    `$1${val}`
                );
            });

            const res = await runAndGetResult(trialCode, unit.resultVar);
            if (res.success && res.data) {
                results.push({
                    params: combo,
                    return: (res.data as any).total_return,
                    drawdown: (res.data as any).max_drawdown,
                    winRate: (res.data as any).win_rate,
                    score: (res.data as any).total_return / ((res.data as any).max_drawdown || 1)
                });
            }
        }

        results.sort((a, b) => b.return - a.return);
        setScanResults(results);
        setIsOptimizing(false);
    }, [pyodideReady, scanParams, unit, onRunStart]);

    return {
        isOptimizing,
        optimizeProgress,
        scanResults, setScanResults,
        scanParams, setScanParams,
        handleOptimize
    };
}
