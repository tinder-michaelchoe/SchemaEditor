/**
 * CladsPreview - React component for rendering CLADS documents.
 */
export interface CladsPreviewProps {
    /** CLADS document as JSON string or object */
    document: string | object;
    /** Optional CSS class name */
    className?: string;
    /** Optional inline styles */
    style?: React.CSSProperties;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
    /** Callback when rendering completes successfully */
    onRender?: (html: string) => void;
    /** Custom loading component */
    loadingComponent?: React.ReactNode;
    /** Custom error component */
    errorComponent?: (error: Error) => React.ReactNode;
    /** Optional path to the WASM file */
    wasmPath?: string;
}
/**
 * React component that renders a CLADS document to HTML.
 *
 * Usage:
 * ```tsx
 * <CladsPreview
 *   document={cladsJson}
 *   onError={(err) => console.error(err)}
 * />
 * ```
 */
export declare function CladsPreview({ document, className, style, onError, onRender, loadingComponent, errorComponent, wasmPath, }: CladsPreviewProps): JSX.Element;
/**
 * Hook for programmatic CLADS rendering.
 *
 * Usage:
 * ```tsx
 * const { render, isReady, error } = useCladsRenderer();
 *
 * useEffect(() => {
 *   if (isReady) {
 *     const html = render(document);
 *     setHtml(html);
 *   }
 * }, [isReady, document]);
 * ```
 */
export declare function useCladsRenderer(wasmPath?: string): {
    render: (document: string | object) => string;
    isReady: boolean;
    error: Error | null;
};
//# sourceMappingURL=CladsPreview.d.ts.map