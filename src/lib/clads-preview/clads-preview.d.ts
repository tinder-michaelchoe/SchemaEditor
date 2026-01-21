/**
 * CLADS Preview - WebAssembly wrapper for rendering CLADS documents to HTML.
 *
 * Usage:
 * ```typescript
 * import { initClads, renderCladsDocument } from '@clads/preview';
 *
 * await initClads();
 * const html = renderCladsDocument(jsonDocument);
 * ```
 */
export interface CladsError {
    error: string;
}
export interface WasmExports {
    memory: WebAssembly.Memory;
    clads_init: () => void;
    clads_render: (jsonPtr: number, jsonLen: number) => number;
    clads_free: (ptr: number) => void;
    clads_alloc: (size: number) => number;
}
/**
 * Initialize the CLADS WebAssembly module.
 * Must be called before rendering any documents.
 *
 * @param wasmPath - Optional path to the .wasm file. Defaults to same directory.
 * @throws Error if initialization fails
 */
export declare function initClads(wasmPath?: string): Promise<void>;
/**
 * Render a CLADS JSON document to HTML.
 *
 * @param json - CLADS document as JSON string or object
 * @returns Complete HTML document string
 * @throws Error if not initialized or rendering fails
 */
export declare function renderCladsDocument(json: string | object): string;
/**
 * Check if CLADS has been initialized.
 */
export declare function isCladsInitialized(): boolean;
/**
 * Reset the CLADS module (mainly for testing).
 */
export declare function resetClads(): void;
//# sourceMappingURL=clads-preview.d.ts.map