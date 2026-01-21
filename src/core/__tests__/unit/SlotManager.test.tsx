/**
 * SlotManager Tests
 * 
 * Tests for slot rendering, priority, and error boundaries.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { SlotManager, Slot, PluginErrorBoundary, slotManager } from '../../SlotManager';
import { pluginRegistry } from '../../PluginRegistry';
import type { SlotProps } from '../../types/plugin';

// Test components
const TestComponentA: React.FC<SlotProps> = ({ pluginId }) => (
  <div data-testid={`component-${pluginId}`}>Plugin A</div>
);

const TestComponentB: React.FC<SlotProps> = ({ pluginId }) => (
  <div data-testid={`component-${pluginId}`}>Plugin B</div>
);

const CrashingComponent: React.FC<SlotProps> = () => {
  throw new Error('Component crashed!');
};

describe('SlotManager', () => {
  let manager: SlotManager;

  beforeEach(() => {
    manager = new SlotManager();
    pluginRegistry.clear();
    slotManager.clear();
  });

  describe('context', () => {
    it('should update context', () => {
      manager.updateContext({ hasDocument: true });
      expect(manager.getContext().hasDocument).toBe(true);
    });

    it('should merge context updates', () => {
      manager.updateContext({ hasDocument: true });
      manager.updateContext({ hasSelection: true });

      const ctx = manager.getContext();
      expect(ctx.hasDocument).toBe(true);
      expect(ctx.hasSelection).toBe(true);
    });

    it('should set custom context', () => {
      manager.setCustomContext('myKey', 'myValue');
      expect(manager.getContext().custom.myKey).toBe('myValue');
    });
  });

  describe('slot change notifications', () => {
    it('should notify listeners on context change', () => {
      const listener = vi.fn();
      manager.onSlotChange(listener);

      manager.updateContext({ hasDocument: true });

      expect(listener).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const listener = vi.fn();
      const unsubscribe = manager.onSlotChange(listener);
      unsubscribe();

      manager.updateContext({ hasDocument: true });

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('PluginErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <PluginErrorBoundary pluginId="test-plugin">
        <div data-testid="child">Child Content</div>
      </PluginErrorBoundary>
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('should catch plugin render errors', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <PluginErrorBoundary pluginId="crashing-plugin">
        <CrashingComponent pluginId="crashing-plugin" />
      </PluginErrorBoundary>
    );

    expect(screen.getByText(/Plugin Error/)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('should show fallback UI on error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <PluginErrorBoundary pluginId="crashing-plugin">
        <CrashingComponent pluginId="crashing-plugin" />
      </PluginErrorBoundary>
    );

    expect(screen.getByText('crashing-plugin')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('should call onError callback', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();

    render(
      <PluginErrorBoundary pluginId="crashing-plugin" onError={onError}>
        <CrashingComponent pluginId="crashing-plugin" />
      </PluginErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][1]).toBe('crashing-plugin');
    consoleSpy.mockRestore();
  });

  it('should show custom fallback', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <PluginErrorBoundary
        pluginId="crashing-plugin"
        fallback={<div data-testid="custom-fallback">Custom Fallback</div>}
      >
        <CrashingComponent pluginId="crashing-plugin" />
      </PluginErrorBoundary>
    );

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('should not crash other components', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <div>
        <PluginErrorBoundary pluginId="good-plugin">
          <div data-testid="good">Good Plugin</div>
        </PluginErrorBoundary>
        <PluginErrorBoundary pluginId="bad-plugin">
          <CrashingComponent pluginId="bad-plugin" />
        </PluginErrorBoundary>
      </div>
    );

    expect(screen.getByTestId('good')).toBeInTheDocument();
    expect(screen.getByText(/Plugin Error/)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });
});

describe('Slot component', () => {
  beforeEach(() => {
    pluginRegistry.clear();
    slotManager.clear();
  });

  it('should render nothing for empty slot', () => {
    const { container } = render(<Slot name="sidebar:left" />);
    expect(container.firstChild).toBeNull();
  });

  it('should render fallback for empty slot', () => {
    render(
      <Slot name="sidebar:left" fallback={<div data-testid="fallback">No plugins</div>} />
    );
    expect(screen.getByTestId('fallback')).toBeInTheDocument();
  });

  it('should render plugins registered for slot', () => {
    pluginRegistry.register({
      manifest: {
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
        slots: [{ slot: 'sidebar:left', component: TestComponentA, priority: 100 }],
      },
    });

    render(<Slot name="sidebar:left" />);

    expect(screen.getByTestId('component-test-plugin')).toBeInTheDocument();
  });

  it('should order by priority (higher first)', () => {
    pluginRegistry.register({
      manifest: {
        id: 'low-priority',
        name: 'Low',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
        slots: [{ slot: 'sidebar:left', component: TestComponentA, priority: 10 }],
      },
    });

    pluginRegistry.register({
      manifest: {
        id: 'high-priority',
        name: 'High',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
        slots: [{ slot: 'sidebar:left', component: TestComponentB, priority: 100 }],
      },
    });

    render(<Slot name="sidebar:left" wrap={false} />);

    const components = screen.getAllByTestId(/^component-/);
    expect(components[0]).toHaveAttribute('data-testid', 'component-high-priority');
    expect(components[1]).toHaveAttribute('data-testid', 'component-low-priority');
  });

  it('should render multiple plugins in same slot', () => {
    pluginRegistry.register({
      manifest: {
        id: 'plugin-a',
        name: 'A',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
        slots: [{ slot: 'sidebar:left', component: TestComponentA, priority: 100 }],
      },
    });

    pluginRegistry.register({
      manifest: {
        id: 'plugin-b',
        name: 'B',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
        slots: [{ slot: 'sidebar:left', component: TestComponentB, priority: 50 }],
      },
    });

    render(<Slot name="sidebar:left" wrap={false} />);

    expect(screen.getByTestId('component-plugin-a')).toBeInTheDocument();
    expect(screen.getByTestId('component-plugin-b')).toBeInTheDocument();
  });

  it('should wrap content by default', () => {
    pluginRegistry.register({
      manifest: {
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
        slots: [{ slot: 'sidebar:left', component: TestComponentA }],
      },
    });

    const { container } = render(<Slot name="sidebar:left" />);
    
    expect(container.querySelector('.slot-sidebar-left')).toBeInTheDocument();
  });

  it('should not wrap when wrap=false', () => {
    pluginRegistry.register({
      manifest: {
        id: 'test-plugin',
        name: 'Test',
        version: '1.0.0',
        apiVersion: '1.0',
        activation: 'eager',
        capabilities: [],
        slots: [{ slot: 'sidebar:left', component: TestComponentA }],
      },
    });

    const { container } = render(<Slot name="sidebar:left" wrap={false} />);
    
    expect(container.querySelector('.slot-sidebar-left')).not.toBeInTheDocument();
  });
});
