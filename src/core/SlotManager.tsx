/**
 * Slot Manager
 * 
 * Manages UI slot rendering with error boundaries.
 * Each plugin renders in isolation, so a crashing plugin
 * won't take down the entire app.
 */

import React, { Component, useMemo, type ReactNode, type ErrorInfo } from 'react';
import styled from 'styled-components';
import type { UISlot, SlotProps, SlotRegistration } from './types/plugin';
import type { RegisteredSlotComponent, SlotComponentProps, WhenContext } from './types/slots';
import { evaluateWhenCondition, SLOT_CONFIG } from './types/slots';
import { pluginRegistry } from './PluginRegistry';

// Styled components for PluginCrashedUI
const CrashedWrapper = styled.div`
  padding: 1rem;
  background: ${p => p.theme.colors.error}1a;
  border: 1px solid ${p => p.theme.colors.error};
  border-radius: ${p => p.theme.radii.lg};
`;

const CrashedHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${p => p.theme.colors.error};
  margin-bottom: 0.5rem;
`;

const CrashedTitle = styled.span`
  font-weight: 500;
`;

const CrashedMessage = styled.p`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.error};
  margin-bottom: 0.5rem;
`;

const CrashedCode = styled.code`
  background: ${p => p.theme.colors.error}1a;
  padding: 0 0.25rem;
  border-radius: ${p => p.theme.radii.sm};
`;

const CrashedPre = styled.pre`
  font-size: 0.75rem;
  background: ${p => p.theme.colors.error}1a;
  padding: 0.5rem;
  border-radius: ${p => p.theme.radii.sm};
  overflow: auto;
  margin-bottom: 0.5rem;
  max-height: 8rem;
`;

const RetryButton = styled.button`
  font-size: 0.875rem;
  color: ${p => p.theme.colors.error};
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

// ============================================================================
// Error Boundary Component
// ============================================================================

interface ErrorBoundaryProps {
  pluginId: string;
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, pluginId: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches render errors in plugin components
 */
export class PluginErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `Plugin ${this.props.pluginId} crashed:`,
      error,
      errorInfo.componentStack
    );
    this.props.onError?.(error, this.props.pluginId);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <PluginCrashedUI
            pluginId={this.props.pluginId}
            error={this.state.error}
            onRetry={() => this.setState({ hasError: false, error: null })}
          />
        )
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// Plugin Crashed UI
// ============================================================================

interface PluginCrashedUIProps {
  pluginId: string;
  error: Error | null;
  onRetry: () => void;
}

/**
 * Fallback UI when a plugin crashes
 */
function PluginCrashedUI({ pluginId, error, onRetry }: PluginCrashedUIProps) {
  return (
    <CrashedWrapper>
      <CrashedHeader>
        <svg
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <CrashedTitle>Plugin Error</CrashedTitle>
      </CrashedHeader>
      <CrashedMessage>
        Plugin <CrashedCode>{pluginId}</CrashedCode> encountered an error.
      </CrashedMessage>
      {error && (
        <CrashedPre>
          {error.message}
        </CrashedPre>
      )}
      <RetryButton onClick={onRetry}>
        Try again
      </RetryButton>
    </CrashedWrapper>
  );
}

// ============================================================================
// Slot Manager Class
// ============================================================================

type SlotChangeListener = (slot: UISlot) => void;

export class SlotManager {
  private whenContext: WhenContext = {
    hasDocument: false,
    hasSelection: false,
    viewMode: 'tree',
    isDarkMode: false,
    selectedPath: null,
    hasErrors: false,
    custom: {},
  };
  private changeListeners = new Set<SlotChangeListener>();

  /**
   * Update the when context
   */
  updateContext(context: Partial<WhenContext>): void {
    this.whenContext = { ...this.whenContext, ...context };
    this.notifyChange();
  }

  /**
   * Set a custom context value
   */
  setCustomContext(key: string, value: unknown): void {
    this.whenContext.custom[key] = value;
    this.notifyChange();
  }

  /**
   * Get the current when context
   */
  getContext(): WhenContext {
    return { ...this.whenContext };
  }

  /**
   * Get slot registrations for a specific slot
   */
  getSlotRegistrations(slot: UISlot): RegisteredSlotComponent[] {
    const plugins = pluginRegistry.getPluginsForSlot(slot);
    const registrations: RegisteredSlotComponent[] = [];

    for (const plugin of plugins) {
      const slotRegs = plugin.definition.manifest.slots?.filter(
        (s) => s.slot === slot
      );

      if (slotRegs) {
        for (const reg of slotRegs) {
          const visible = evaluateWhenCondition(reg.when, this.whenContext);
          registrations.push({
            pluginId: plugin.definition.manifest.id,
            registration: reg,
            visible,
          });
        }
      }
    }

    // Sort by priority (higher first)
    registrations.sort(
      (a, b) => (b.registration.priority ?? 0) - (a.registration.priority ?? 0)
    );

    return registrations;
  }

  /**
   * Subscribe to slot changes
   */
  onSlotChange(listener: SlotChangeListener): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  /**
   * Notify listeners of slot changes
   */
  private notifyChange(): void {
    for (const listener of this.changeListeners) {
      try {
        // Notify all slots
        for (const slot of Object.keys(SLOT_CONFIG) as UISlot[]) {
          listener(slot);
        }
      } catch (error) {
        console.error('Error in slot change listener:', error);
      }
    }
  }

  /**
   * Clear all state (useful for testing)
   */
  clear(): void {
    this.changeListeners.clear();
    this.whenContext = {
      hasDocument: false,
      hasSelection: false,
      viewMode: 'tree',
      isDarkMode: false,
      selectedPath: null,
      hasErrors: false,
      custom: {},
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global slot manager instance
 */
export const slotManager = new SlotManager();

// ============================================================================
// Slot Component
// ============================================================================

/**
 * Render a UI slot
 */
export function Slot({
  name,
  className,
  fallback,
  wrap = true,
}: SlotComponentProps) {
  const registrations = useMemo(
    () => slotManager.getSlotRegistrations(name),
    [name]
  );

  const visibleRegistrations = registrations.filter((r) => r.visible);

  if (visibleRegistrations.length === 0) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  const content = visibleRegistrations.map((reg, index) => {
    const Component = reg.registration.component;
    const props: SlotProps = {
      pluginId: reg.pluginId,
    };

    return (
      <PluginErrorBoundary
        key={`${reg.pluginId}-${index}`}
        pluginId={reg.pluginId}
        onError={(error, pluginId) => {
          console.error(`Plugin ${pluginId} error in slot ${name}:`, error);
        }}
      >
        <Component {...props} />
      </PluginErrorBoundary>
    );
  });

  if (wrap) {
    const config = SLOT_CONFIG[name];
    return (
      <div className={`${config.className ?? ''} ${className ?? ''}`}>
        {content}
      </div>
    );
  }

  return <>{content}</>;
}

// ============================================================================
// Hook for Slot Access
// ============================================================================

/**
 * Hook to get slot registrations (for custom rendering)
 */
export function useSlot(slot: UISlot): RegisteredSlotComponent[] {
  const [registrations, setRegistrations] = React.useState(() =>
    slotManager.getSlotRegistrations(slot)
  );

  React.useEffect(() => {
    const unsubscribe = slotManager.onSlotChange((changedSlot) => {
      if (changedSlot === slot) {
        setRegistrations(slotManager.getSlotRegistrations(slot));
      }
    });
    return unsubscribe;
  }, [slot]);

  return registrations;
}
