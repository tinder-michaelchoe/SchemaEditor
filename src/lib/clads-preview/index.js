import React, { useState, useEffect } from 'react';

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
// MARK: - Module State
let wasmInstance = null;
let wasmExports = null;
let isInitialized = false;
// MARK: - Public API
/**
 * Initialize the CLADS WebAssembly module.
 * Must be called before rendering any documents.
 *
 * @param wasmPath - Optional path to the .wasm file. Defaults to same directory.
 * @throws Error if initialization fails
 */
async function initClads(wasmPath) {
    if (isInitialized) {
        return;
    }
    const path = wasmPath ?? new URL('./clads-preview.wasm', import.meta.url).href;
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
        }
        const wasmBuffer = await response.arrayBuffer();
        console.log('[CLADS] WASM buffer loaded, size:', wasmBuffer.byteLength, 'bytes');
        console.log('[CLADS] Creating memory reference container...');
        const memoryRef = {};
        console.log('[CLADS] Instantiating WASM module...');
        const { instance } = await WebAssembly.instantiate(wasmBuffer, {
            wasi_snapshot_preview1: createWasiShim(memoryRef)
        });
        console.log('[CLADS] WASM instantiated successfully');
        wasmInstance = instance;
        wasmExports = instance.exports;
        // Set the memory reference after instantiation
        memoryRef.memory = wasmExports.memory;
        console.log('[CLADS] Memory reference set, memory size:', wasmExports.memory.buffer.byteLength, 'bytes');
        console.log('[CLADS] Exports available:', Object.keys(wasmExports).slice(0, 10), '...');
        // Call _start to initialize Swift runtime (if available)
        if (wasmExports._start) {
            console.log('[CLADS] Calling _start to initialize Swift runtime...');
            try {
                wasmExports._start();
                console.log('[CLADS] _start completed successfully');
            }
            catch (startError) {
                console.warn('[CLADS] _start failed (might be expected):', startError);
                // Continue anyway, some modules don't need _start
            }
        }
        console.log('[CLADS] Calling clads_init()...');
        // Initialize CLADS resolvers
        try {
            wasmExports.clads_init();
            console.log('[CLADS] clads_init() completed successfully');
        }
        catch (initError) {
            console.error('[CLADS] Error during clads_init():', initError);
            console.error('[CLADS] Error stack:', initError.stack);
            throw initError;
        }
        isInitialized = true;
    }
    catch (error) {
        throw new Error(`CLADS initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}
/**
 * Render a CLADS JSON document to HTML.
 *
 * @param json - CLADS document as JSON string or object
 * @returns Complete HTML document string
 * @throws Error if not initialized or rendering fails
 */
function renderCladsDocument(json) {
    if (!wasmExports) {
        throw new Error('CLADS not initialized. Call initClads() first.');
    }
    const jsonString = typeof json === 'string' ? json : JSON.stringify(json);
    const encoder = new TextEncoder();
    const jsonBytes = encoder.encode(jsonString);
    // Allocate memory for JSON input
    const inputPtr = wasmExports.clads_alloc(jsonBytes.length);
    if (!inputPtr) {
        throw new Error('Failed to allocate memory for input');
    }
    try {
        // Copy JSON to WASM memory
        const memory = new Uint8Array(wasmExports.memory.buffer);
        memory.set(jsonBytes, inputPtr);
        // Call render
        const resultPtr = wasmExports.clads_render(inputPtr, jsonBytes.length);
        if (!resultPtr) {
            throw new Error('Render returned null pointer');
        }
        // Read result string
        const result = readCString(wasmExports.memory, resultPtr);
        // Free result memory
        wasmExports.clads_free(resultPtr);
        // Check for error response
        if (result.startsWith('{"error":')) {
            const errorObj = JSON.parse(result);
            throw new Error(`CLADS render failed: ${errorObj.error}`);
        }
        return result;
    }
    finally {
        // Free input memory
        wasmExports.clads_free(inputPtr);
    }
}
/**
 * Check if CLADS has been initialized.
 */
function isCladsInitialized() {
    return isInitialized;
}
/**
 * Reset the CLADS module (mainly for testing).
 */
function resetClads() {
    wasmInstance = null;
    wasmExports = null;
    isInitialized = false;
}
// MARK: - Memory Helpers
/**
 * Read a null-terminated C string from WASM memory.
 */
function readCString(memory, ptr) {
    const bytes = new Uint8Array(memory.buffer);
    let end = ptr;
    // Find null terminator
    while (bytes[end] !== 0) {
        end++;
        // Safety limit to prevent infinite loop
        if (end - ptr > 10000000) {
            throw new Error('String too long or missing null terminator');
        }
    }
    const stringBytes = bytes.slice(ptr, end);
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(stringBytes);
}
// MARK: - WASI Shim
/**
 * Create a minimal WASI shim for the WebAssembly module.
 * SwiftWasm requires WASI for basic I/O operations.
 */
function createWasiShim(memoryRef) {
    return {
        // File descriptor operations
        fd_close: () => 0,
        fd_seek: () => 0,
        fd_tell: () => 0,
        fd_pread: () => 8, // EBADF
        fd_write: (fd, iovs, iovsLen, nwritten) => {
            try {
                if (memoryRef.memory) {
                    const memory = new Uint8Array(memoryRef.memory.buffer);
                    const view = new DataView(memoryRef.memory.buffer);
                    let totalWritten = 0;
                    for (let i = 0; i < iovsLen; i++) {
                        const ptr = view.getUint32(iovs + i * 8, true);
                        const len = view.getUint32(iovs + i * 8 + 4, true);
                        const buffer = memory.slice(ptr, ptr + len);
                        const text = new TextDecoder().decode(buffer);
                        console.log(`[Swift stdout]`, text);
                        totalWritten += len;
                    }
                    if (nwritten !== 0) {
                        view.setUint32(nwritten, totalWritten, true);
                    }
                }
                return 0;
            }
            catch (e) {
                console.error('[WASI] fd_write error:', e);
                return 5; // EIO
            }
        },
        fd_read: () => 0,
        fd_fdstat_get: () => 0,
        fd_fdstat_set_flags: () => 0,
        fd_filestat_get: () => 8, // EBADF
        fd_filestat_set_size: () => 8,
        fd_prestat_get: () => 8, // EBADF - no preopens
        fd_prestat_dir_name: () => 8,
        fd_readdir: () => 8,
        fd_sync: () => 0,
        // Path operations (stubbed)
        path_open: () => 44, // ENOENT
        path_filestat_get: () => 44,
        path_filestat_set_times: () => 44,
        path_create_directory: () => 44,
        path_remove_directory: () => 44,
        path_rename: () => 44,
        path_unlink_file: () => 44,
        path_link: () => 44,
        path_symlink: () => 44,
        path_readlink: () => 44,
        // Environment
        environ_get: () => 0,
        environ_sizes_get: (countPtr, sizePtr) => {
            if (memoryRef.memory) {
                const view = new DataView(memoryRef.memory.buffer);
                view.setUint32(countPtr, 0, true);
                view.setUint32(sizePtr, 0, true);
            }
            return 0;
        },
        // Arguments
        args_get: () => 0,
        args_sizes_get: (countPtr, sizePtr) => {
            if (memoryRef.memory) {
                const view = new DataView(memoryRef.memory.buffer);
                view.setUint32(countPtr, 0, true);
                view.setUint32(sizePtr, 0, true);
            }
            return 0;
        },
        // Clock
        clock_res_get: (clockId, resPtr) => {
            if (memoryRef.memory) {
                const view = new DataView(memoryRef.memory.buffer);
                view.setBigUint64(resPtr, BigInt(1000000), true);
            }
            return 0;
        },
        clock_time_get: (clockId, precision, timePtr) => {
            if (memoryRef.memory) {
                const view = new DataView(memoryRef.memory.buffer);
                const now = BigInt(Date.now()) * BigInt(1000000);
                view.setBigUint64(timePtr, now, true);
            }
            return 0;
        },
        // Random
        random_get: (bufPtr, bufLen) => {
            if (memoryRef.memory && bufLen > 0) {
                const bytes = new Uint8Array(memoryRef.memory.buffer, bufPtr, bufLen);
                crypto.getRandomValues(bytes);
            }
            return 0;
        },
        // Process
        proc_exit: (code) => {
            console.warn(`[WASI] proc_exit called with code ${code}`);
            throw new Error(`Process exited with code ${code}`);
        },
        // Sockets (stubbed)
        sock_accept: () => 58, // ENOTSOCK
        sock_recv: () => 58,
        sock_send: () => 58,
        sock_shutdown: () => 58,
        // Poll
        poll_oneoff: () => 0,
    };
}

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
function CladsPreview({ document, wasmPath, onError }) {
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

export { CladsPreview, initClads, isCladsInitialized, renderCladsDocument, resetClads };
