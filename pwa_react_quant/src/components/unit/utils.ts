/**
 * utils.ts — Shared utilities for unit sub-components
 */

/** Format a numeric value to 4 decimal places, returns '-' for non-numeric */
export function formatNum(val: unknown): string {
    if (val === undefined || val === null || val === '-') return '-';
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return String(val);
    return num.toFixed(4);
}

/** Get Stat card CSS class based on value and metric type */
export function getStatClass(val: number | string, type: 'sharpe' | 'calmar' | 'pf'): string {
    const num = typeof val === 'number' ? val : parseFloat(String(val));
    if (isNaN(num)) return 'neutral';
    if (type === 'sharpe') {
        if (num > 1.5) return 'up';
        if (num > 0.8) return 'accent';
        return num < 0 ? 'down' : 'neutral';
    }
    if (type === 'pf') return num > 1.5 ? 'up' : num < 1 ? 'down' : 'neutral';
    return num > 0 ? 'up' : 'down';
}

/** Download a canvas chart as PNG */
export function downloadChart(canvasId: string, filenamePrefix: string, unitId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (canvas) {
        const link = document.createElement('a');
        link.download = `${filenamePrefix}_${unitId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

/** Escape special regex characters in a string */
export function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
