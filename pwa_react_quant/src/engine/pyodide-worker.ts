/**
 * pyodide-worker.ts
 * Python 環境在後台線程執行，避免阻塞 UI
 */

let pyodide: any = null;

async function init(baseUrl: string) {
    try {
        // 使用動態 import 避免 Vite 對 CDN URL 進行錯誤的靜態解析
        // @ts-ignore
        const { loadPyodide } = await import('https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.mjs');

        pyodide = await loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/'
        });

        await pyodide.loadPackage('numpy');

        // Load custom modules
        // 注意：在 Worker 中 fetch path 需要完整 URL 或正確的相對路徑
        const [engineCode, indCode] = await Promise.all([
            fetch(`${baseUrl}py/backtest_engine.py`).then(r => r.text()),
            fetch(`${baseUrl}py/indicators.py`).then(r => r.text())
        ]);

        pyodide.FS.writeFile('/home/pyodide/backtest_engine.py', engineCode);
        pyodide.FS.writeFile('/home/pyodide/indicators.py', indCode);

        await pyodide.runPythonAsync(`
import sys
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')
import backtest_engine
import indicators
`);

        self.postMessage({ type: 'READY' });
    } catch (err: any) {
        self.postMessage({ type: 'ERROR', error: err.message });
    }
}

async function run(code: string, resultVar: string | null) {
    if (!pyodide) return;

    pyodide.setStdout({ batched: (text: string) => { self.postMessage({ type: 'STDOUT', text }); } });
    pyodide.setStderr({ batched: (text: string) => { self.postMessage({ type: 'STDERR', text }); } });

    try {
        await pyodide.runPythonAsync(code);

        let data = null;
        if (resultVar) {
            await pyodide.runPythonAsync(`
import json as _json
_result_json = _json.dumps(${resultVar})
            `);
            const jsonStr = pyodide.globals.get('_result_json');
            data = JSON.parse(jsonStr);
        }

        self.postMessage({ type: 'RESULT', success: true, data });
    } catch (err: any) {
        self.postMessage({ type: 'RESULT', success: false, error: err.message });
    }
}

self.onmessage = async (e) => {
    const { type, ...payload } = e.data;
    if (type === 'INIT') {
        await init(payload.baseUrl);
    } else if (type === 'RUN') {
        await run(payload.code, payload.resultVar);
    } else if (type === 'SET_GLOBAL') {
        if (pyodide) {
            pyodide.globals.set(payload.name, pyodide.toPy(payload.value));
        }
    }
};
