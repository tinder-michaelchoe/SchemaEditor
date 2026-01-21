/**
 * React Testing Utilities for Plugin Components
 * 
 * Provides utilities for rendering plugin components with mock contexts
 * in a testing environment.
 */

import React from 'react';
import type { PluginContext, PluginCapability } from '../types';
import { createMockContext, type MockContextOptions, type MockPluginContext } from './createMockContext';

// Create React contexts for plugin system
const PluginContextReact = React.createContext<PluginContext | null>(null);

/**
 * Props for the PluginContextProvider
 */
interface PluginContextProviderProps {
  context: PluginContext;
  children: React.ReactNode;
}

/**
 * Provider component for plugin context
 */
export function PluginContextProvider({ context, children }: PluginContextProviderProps): React.ReactElement {
  return (
    <PluginContextReact.Provider value={context}>
      {children}
    </PluginContextReact.Provider>
  );
}

/**
 * Options for rendering with plugin context
 */
export interface RenderWithPluginContextOptions extends MockContextOptions {
  /** Additional providers to wrap the component with */
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Result of rendering with plugin context
 */
export interface RenderWithPluginContextResult {
  /** The mock context */
  context: MockPluginContext;
  
  /** Container element (for manual DOM queries) */
  container: HTMLElement;
  
  /** Rerender with new props */
  rerender(element: React.ReactElement): void;
  
  /** Unmount the component */
  unmount(): void;
}

/**
 * Renders a component with a mock plugin context
 * 
 * This function creates a mock context and wraps the component with the
 * appropriate provider. It's designed to work with any React testing library.
 * 
 * @example
 * ```typescript
 * import { renderWithPluginContext } from '@/core/testing';
 * 
 * test('MyComponent renders correctly', () => {
 *   const { context, container } = renderWithPluginContext(
 *     <MyComponent />,
 *     {
 *       capabilities: ['document:read', 'document:write'],
 *       documentData: { name: 'Test' },
 *     }
 *   );
 *   
 *   // Assert on rendered output
 *   expect(container.textContent).toContain('Test');
 *   
 *   // Check interactions
 *   expect(context.__interactions.emittedEvents).toHaveLength(0);
 * });
 * ```
 */
export function renderWithPluginContext(
  element: React.ReactElement,
  options: RenderWithPluginContextOptions = {}
): RenderWithPluginContextResult {
  const { wrapper: Wrapper, ...contextOptions } = options;
  const context = createMockContext(contextOptions);
  
  // Create container
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  // Track if component is mounted
  let isMounted = true;
  let currentRoot: { render: (element: React.ReactElement) => void; unmount: () => void } | null = null;
  
  // Wrap element with providers
  const wrapElement = (el: React.ReactElement): React.ReactElement => {
    let wrapped = (
      <PluginContextProvider context={context}>
        {el}
      </PluginContextProvider>
    );
    
    if (Wrapper) {
      wrapped = <Wrapper>{wrapped}</Wrapper>;
    }
    
    return wrapped;
  };
  
  // Note: This is a simplified version. In practice, you'd use @testing-library/react
  // This provides the structure for integration with testing libraries
  const render = (el: React.ReactElement) => {
    const wrappedElement = wrapElement(el);
    
    // For actual rendering, you would use ReactDOM or a testing library
    // This is a placeholder that shows the expected structure
    if (typeof (React as { version?: string }).version === 'string') {
      // React 18+ with createRoot
      if (!currentRoot) {
        // @ts-expect-error - Dynamic import for React 18
        const { createRoot } = require('react-dom/client');
        currentRoot = createRoot(container);
      }
      currentRoot.render(wrappedElement);
    }
  };
  
  // Initial render
  render(element);
  
  return {
    context,
    container,
    
    rerender(newElement: React.ReactElement): void {
      if (!isMounted) {
        throw new Error('Cannot rerender after unmount');
      }
      render(newElement);
    },
    
    unmount(): void {
      if (!isMounted) return;
      
      if (currentRoot) {
        currentRoot.unmount();
      }
      
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
      
      isMounted = false;
    },
  };
}

/**
 * Creates a higher-order component that wraps a component with plugin context
 */
export function withMockPluginContext<P extends object>(
  Component: React.ComponentType<P>,
  contextOptions: MockContextOptions = {}
): React.ComponentType<P> & { mockContext: MockPluginContext } {
  const mockContext = createMockContext(contextOptions);
  
  const WrappedComponent = (props: P) => (
    <PluginContextProvider context={mockContext}>
      <Component {...props} />
    </PluginContextProvider>
  );
  
  // Attach mock context for testing access
  (WrappedComponent as unknown as { mockContext: MockPluginContext }).mockContext = mockContext;
  
  return WrappedComponent as React.ComponentType<P> & { mockContext: MockPluginContext };
}

/**
 * Hook for accessing plugin context in tests
 * 
 * This is useful when you need to access the context in a component
 * that's rendered with the testing utilities.
 */
export function useTestPluginContext(): PluginContext {
  const context = React.useContext(PluginContextReact);
  if (!context) {
    throw new Error(
      'useTestPluginContext must be used within a PluginContextProvider. ' +
      'Make sure your component is rendered with renderWithPluginContext().'
    );
  }
  return context;
}

export { PluginContextReact };
