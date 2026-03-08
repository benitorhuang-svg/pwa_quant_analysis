export function exportCsv(stats: any, filename: string = 'backtest_report.csv') {
    if (!stats || !stats.trades) {
        alert('沒有資料可供匯出');
        return;
    }

    const { trades, equity_curve, dates } = stats;

    let csvContent = '\uFEFF'; // BOM for Excel

    if (trades && trades.length > 0) {
        csvContent += 'Date,Type,Price,Reason\n';
        const rows = trades.map((t: any) => [
            dates[t.index],
            t.type,
            t.price.toFixed(2),
            t.reason ? t.reason.replace(/,/g, ' ') : '' // Replace commas securely
        ]);
        csvContent += rows.map((r: any[]) => r.join(',')).join('\n') + '\n\n';
    }

    if (equity_curve && dates) {
        csvContent += 'Date,Equity\n';
        const equityRows = dates.map((d: string, i: number) => [
            d,
            equity_curve[i] ? equity_curve[i].toFixed(2) : ''
        ]);
        csvContent += equityRows.map((r: string[]) => r.join(',')).join('\n') + '\n';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
