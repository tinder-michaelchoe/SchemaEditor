import React, { useEffect, useState } from 'react';
import { initClads, renderCladsDocument } from './clads-preview.js';
/**
 * React component for rendering CLADS documents using WebAssembly.
 *
 * @example
 * ```tsx
 * <CladsPreview
 *   document={cladsJson}
 *   onError={(err) => console.error(err)}
 * />
 * ```
 */
export function CladsPreview({ document, wasmPath, onError }) {
    const [html, setHtml] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        let mounted = true;
        async function render() {
            try {
                setIsLoading(true);
                setError(null);
                // Initialize CLADS WASM module
                await initClads(wasmPath);
                if (!mounted)
                    return;
                // Render document
                const renderedHtml = renderCladsDocument(document);
                if (!mounted)
                    return;
                setHtml(renderedHtml);
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                if (mounted) {
                    setError(error);
                    onError?.(error);
                }
            }
            finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        }
        render();
        return () => {
            mounted = false;
        };
    }, [document, wasmPath, onError]);
    if (isLoading) {
        return React.createElement("div", null, "Loading CLADS renderer...");
    }
    if (error) {
        return (React.createElement("div", { style: { color: 'red', padding: '1rem', border: '1px solid red' } },
            React.createElement("strong", null, "Error rendering CLADS document:"),
            React.createElement("pre", null, error.message)));
    }
    return React.createElement("div", { dangerouslySetInnerHTML: { __html: html } });
}
