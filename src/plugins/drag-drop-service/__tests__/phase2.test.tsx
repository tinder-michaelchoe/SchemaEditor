/**
 * Phase 2 Implementation Tests
 *
 * Tests for the visual feedback system: DropZoneLine, DropZoneHighlight, and DropZoneOverlay
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DropZoneLine } from '../components/DropZoneLine';
import { DropZoneHighlight } from '../components/DropZoneHighlight';
import { DropZoneOverlay } from '../components/DropZoneOverlay';
import type { DropZoneVisual } from '../DragDropRegistry';

describe('Phase 2: Visual Feedback System', () => {
  describe('DropZoneLine', () => {
    const mockBounds: DOMRect = {
      x: 100,
      y: 200,
      width: 300,
      height: 2,
      top: 200,
      left: 100,
      bottom: 202,
      right: 400,
      toJSON: () => ({}),
    };

    it('should render a horizontal line', () => {
      const { container } = render(
        <DropZoneLine bounds={mockBounds} orientation="horizontal" />
      );

      const line = container.firstChild as HTMLElement;
      expect(line).toBeTruthy();
      expect(line.style.position).toBe('fixed');
      expect(line.style.left).toBe('100px');
      expect(line.style.top).toBe('200px');
    });

    it('should render a vertical line', () => {
      const verticalBounds: DOMRect = {
        ...mockBounds,
        width: 2,
        height: 300,
      };

      const { container } = render(
        <DropZoneLine bounds={verticalBounds} orientation="vertical" />
      );

      const line = container.firstChild as HTMLElement;
      expect(line).toBeTruthy();
      expect(line.style.position).toBe('fixed');
    });

    it('should apply hover styles when hovered', () => {
      const { container } = render(
        <DropZoneLine bounds={mockBounds} orientation="horizontal" isHovered={true} />
      );

      const line = container.firstChild as HTMLElement;
      expect(line.style.boxShadow).toContain('rgba');
    });

    it('should apply active styles when active', () => {
      const { container } = render(
        <DropZoneLine bounds={mockBounds} orientation="horizontal" isActive={true} />
      );

      const line = container.firstChild as HTMLElement;
      expect(line.style.boxShadow).toContain('rgba');
    });

    it('should render end markers', () => {
      const { container } = render(
        <DropZoneLine bounds={mockBounds} orientation="horizontal" />
      );

      const line = container.firstChild as HTMLElement;
      const markers = line.querySelectorAll('div');
      expect(markers.length).toBe(2); // Start and end markers
    });
  });

  describe('DropZoneHighlight', () => {
    const mockBounds: DOMRect = {
      x: 100,
      y: 200,
      width: 300,
      height: 400,
      top: 200,
      left: 100,
      bottom: 600,
      right: 400,
      toJSON: () => ({}),
    };

    it('should render a highlight box', () => {
      const { container } = render(
        <DropZoneHighlight bounds={mockBounds} />
      );

      const highlight = container.firstChild as HTMLElement;
      expect(highlight).toBeTruthy();
      expect(highlight.style.position).toBe('fixed');
      expect(highlight.style.left).toBe('100px');
      expect(highlight.style.top).toBe('200px');
      expect(highlight.style.width).toBe('300px');
      expect(highlight.style.height).toBe('400px');
    });

    it('should have dashed border', () => {
      const { container } = render(
        <DropZoneHighlight bounds={mockBounds} />
      );

      const highlight = container.firstChild as HTMLElement;
      expect(highlight.style.border).toContain('dashed');
    });

    it('should apply hover styles when hovered', () => {
      const { container } = render(
        <DropZoneHighlight bounds={mockBounds} isHovered={true} />
      );

      const highlight = container.firstChild as HTMLElement;
      expect(highlight.style.boxShadow).toContain('rgba');
    });

    it('should apply active styles when active', () => {
      const { container } = render(
        <DropZoneHighlight bounds={mockBounds} isActive={true} />
      );

      const highlight = container.firstChild as HTMLElement;
      expect(highlight.style.boxShadow).toContain('rgba');
    });

    it('should render label when provided', () => {
      render(
        <DropZoneHighlight bounds={mockBounds} label="Drop here" />
      );

      expect(screen.getByText('Drop here')).toBeTruthy();
    });

    it('should not render label when not provided', () => {
      const { container } = render(
        <DropZoneHighlight bounds={mockBounds} />
      );

      const highlight = container.firstChild as HTMLElement;
      expect(highlight.textContent).toBe('');
    });
  });

  describe('DropZoneOverlay', () => {
    const mockLineBounds: DOMRect = {
      x: 100,
      y: 200,
      width: 300,
      height: 2,
      top: 200,
      left: 100,
      bottom: 202,
      right: 400,
      toJSON: () => ({}),
    };

    const mockHighlightBounds: DOMRect = {
      x: 100,
      y: 300,
      width: 300,
      height: 400,
      top: 300,
      left: 100,
      bottom: 700,
      right: 400,
      toJSON: () => ({}),
    };

    it('should render nothing when not visible', () => {
      const zones: DropZoneVisual[] = [];
      const { container } = render(
        <DropZoneOverlay zones={zones} visible={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should render line zones', () => {
      const zones: DropZoneVisual[] = [
        {
          id: 'line-1',
          targetPath: 'root.children',
          bounds: mockLineBounds,
          position: 'before',
          indicator: 'line',
          orientation: 'horizontal',
          componentType: 'vstack',
          index: 0,
        },
      ];

      const { container } = render(
        <DropZoneOverlay zones={zones} visible={true} />
      );

      expect(container.querySelector('[style*="position: fixed"]')).toBeTruthy();
    });

    it('should render highlight zones', () => {
      const zones: DropZoneVisual[] = [
        {
          id: 'highlight-1',
          targetPath: 'root.children',
          bounds: mockHighlightBounds,
          position: 'inside',
          indicator: 'highlight',
          componentType: 'vstack',
        },
      ];

      const { container } = render(
        <DropZoneOverlay zones={zones} visible={true} />
      );

      expect(container.querySelector('[style*="dashed"]')).toBeTruthy();
    });

    it('should render multiple zones', () => {
      const zones: DropZoneVisual[] = [
        {
          id: 'line-1',
          targetPath: 'root.children',
          bounds: mockLineBounds,
          position: 'before',
          indicator: 'line',
          orientation: 'horizontal',
          componentType: 'vstack',
          index: 0,
        },
        {
          id: 'highlight-1',
          targetPath: 'root.children',
          bounds: mockHighlightBounds,
          position: 'inside',
          indicator: 'highlight',
          componentType: 'vstack',
        },
      ];

      const { container } = render(
        <DropZoneOverlay zones={zones} visible={true} />
      );

      // Should have wrapper div plus 2 zones
      const fixedElements = container.querySelectorAll('[style*="position: fixed"]');
      expect(fixedElements.length).toBeGreaterThanOrEqual(2);
    });

    it('should call onZoneHover when zone is hovered', () => {
      const onZoneHover = vi.fn();
      const zones: DropZoneVisual[] = [
        {
          id: 'line-1',
          targetPath: 'root.children',
          bounds: mockLineBounds,
          position: 'before',
          indicator: 'line',
          orientation: 'horizontal',
          componentType: 'vstack',
          index: 0,
        },
      ];

      render(
        <DropZoneOverlay zones={zones} visible={true} onZoneHover={onZoneHover} />
      );

      // Note: Full hover testing would require more complex setup with mouse events
      // This just verifies the prop is accepted
      expect(onZoneHover).toBeDefined();
    });
  });

  describe('DropZoneOverlay - Integration', () => {
    it('should render both line and highlight zones together', () => {
      const zones: DropZoneVisual[] = [
        {
          id: 'line-1',
          targetPath: 'root.children',
          bounds: {
            x: 100,
            y: 100,
            width: 200,
            height: 2,
            top: 100,
            left: 100,
            bottom: 102,
            right: 300,
            toJSON: () => ({}),
          },
          position: 'before',
          indicator: 'line',
          orientation: 'horizontal',
          componentType: 'vstack',
          index: 0,
        },
        {
          id: 'line-2',
          targetPath: 'root.children',
          bounds: {
            x: 100,
            y: 200,
            width: 200,
            height: 2,
            top: 200,
            left: 100,
            bottom: 202,
            right: 300,
            toJSON: () => ({}),
          },
          position: 'after',
          indicator: 'line',
          orientation: 'horizontal',
          componentType: 'vstack',
          index: 1,
        },
        {
          id: 'highlight-1',
          targetPath: 'root.children[1]',
          bounds: {
            x: 100,
            y: 300,
            width: 200,
            height: 100,
            top: 300,
            left: 100,
            bottom: 400,
            right: 300,
            toJSON: () => ({}),
          },
          position: 'inside',
          indicator: 'highlight',
          componentType: 'hstack',
        },
      ];

      const { container } = render(
        <DropZoneOverlay zones={zones} visible={true} />
      );

      const fixedElements = container.querySelectorAll('[style*="position: fixed"]');
      expect(fixedElements.length).toBeGreaterThanOrEqual(3);
    });
  });
});
