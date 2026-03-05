/**
 * editor.ts — CodeMirror 6 整合
 */
import { EditorView, basicSetup } from 'codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';

let currentView: EditorView | null = null;

const darkTheme = EditorView.theme({
    '&': { backgroundColor: '#0d1117' },
    '.cm-gutters': {
        backgroundColor: '#0d1117',
        borderRight: '1px solid rgba(148,163,184,0.1)'
    }
});

export function createEditor(container: HTMLElement, code: string, onChange?: (code: string) => void): EditorView {
    if (currentView) {
        currentView.destroy();
    }

    const extensions = [basicSetup, python(), oneDark, darkTheme];
    if (onChange) {
        extensions.push(EditorView.updateListener.of((update) => {
            if (update.docChanged) {
                onChange(update.state.doc.toString());
            }
        }));
    }

    currentView = new EditorView({
        doc: code,
        extensions,
        parent: container
    });

    return currentView;
}

export function getCode(): string {
    return currentView?.state.doc.toString() ?? '';
}

export function setCode(code: string): void {
    if (!currentView) return;
    currentView.dispatch({
        changes: { from: 0, to: currentView.state.doc.length, insert: code }
    });
}

export function getEditor(): EditorView | null {
    return currentView;
}
