/**
 * Phase 3 Implementation Tests
 *
 * Tests for Canvas Drop Zones: Registry validation and drop zone logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { initSchemaParser } from '../../../services/schemaParser';
import { initDragDropRegistry, getDragDropRegistry } from '../../drag-drop-service';
import type { DragSource } from '../../drag-drop-service';

describe('Phase 3: Canvas Drop Zones', () => {
  beforeEach(() => {
    // Initialize schema parser and registry
    const testSchema = {
      $defs: {
        vstack: {
          properties: {
            type: { const: 'vstack' },
            children: {
              type: 'array',
              items: { $ref: '#/$defs/layoutNode' },
            },
          },
        },
        hstack: {
          properties: {
            type: { const: 'hstack' },
            children: {
              type: 'array',
              items: { $ref: '#/$defs/layoutNode' },
            },
          },
        },
        zstack: {
          properties: {
            type: { const: 'zstack' },
            children: {
              type: 'array',
              items: { $ref: '#/$defs/layoutNode' },
            },
          },
        },
        label: {
          properties: {
            type: { const: 'label' },
            text: { type: 'string' },
          },
        },
        button: {
          properties: {
            type: { const: 'button' },
          },
        },
        layoutNode: {
          oneOf: [
            { $ref: '#/$defs/layout' },
            { $ref: '#/$defs/component' },
          ],
        },
        layout: {
          properties: {
            type: {
              enum: ['vstack', 'hstack', 'zstack'],
            },
          },
        },
        component: {
          properties: {
            type: {
              not: { enum: ['vstack', 'hstack', 'zstack'] },
              examples: ['label', 'button', 'textfield'],
            },
          },
        },
      },
    };

    const parser = initSchemaParser(testSchema);
    initDragDropRegistry(parser);
  });

  describe('DragDropRegistry - Container Validation', () => {
    it('should accept label drops on vstack', () => {
      const registry = getDragDropRegistry();

      const paletteSource: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
      };

      expect(registry.canDrop(paletteSource, 'vstack')).toBe(true);
    });

    it('should accept button drops on vstack', () => {
      const registry = getDragDropRegistry();

      const paletteSource: DragSource = {
        type: 'palette-component',
        data: { type: 'button' },
      };

      expect(registry.canDrop(paletteSource, 'vstack')).toBe(true);
    });

    it('should accept label drops on hstack', () => {
      const registry = getDragDropRegistry();

      const paletteSource: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
      };

      expect(registry.canDrop(paletteSource, 'hstack')).toBe(true);
    });

    it('should accept label drops on zstack', () => {
      const registry = getDragDropRegistry();

      const paletteSource: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
      };

      expect(registry.canDrop(paletteSource, 'zstack')).toBe(true);
    });

    it('should reject drops on leaf components', () => {
      const registry = getDragDropRegistry();

      const paletteSource: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
      };

      expect(registry.canDrop(paletteSource, 'label')).toBe(false);
      expect(registry.canDrop(paletteSource, 'button')).toBe(false);
    });
  });

  describe('DragDropRegistry - Container Registration', () => {
    it('should have vstack registered', () => {
      const registry = getDragDropRegistry();
      expect(registry.isRegistered('vstack')).toBe(true);
    });

    it('should have hstack registered', () => {
      const registry = getDragDropRegistry();
      expect(registry.isRegistered('hstack')).toBe(true);
    });

    it('should have zstack registered', () => {
      const registry = getDragDropRegistry();
      expect(registry.isRegistered('zstack')).toBe(true);
    });

    it('should have leaf components registered', () => {
      const registry = getDragDropRegistry();
      expect(registry.isRegistered('label')).toBe(true);
      expect(registry.isRegistered('button')).toBe(true);
    });
  });

  describe('DragDropRegistry - Drop Zone Generation', () => {
    it('should generate drop zones for empty vstack', () => {
      const registry = getDragDropRegistry();

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = () => ({
        x: 100,
        y: 100,
        width: 200,
        height: 300,
        top: 100,
        left: 100,
        bottom: 400,
        right: 300,
        toJSON: () => ({}),
      });

      const componentData = {
        type: 'vstack',
        path: 'root',
        children: [],
      };

      const zones = registry.getDropZones(
        'vstack',
        mockElement,
        'palette-component',
        componentData
      );

      expect(zones.length).toBeGreaterThan(0);
      expect(zones[0].indicator).toBe('highlight');
      expect(zones[0].position).toBe('inside');
    });

    it('should generate line zones for vstack with children', () => {
      const registry = getDragDropRegistry();

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = () => ({
        x: 100,
        y: 100,
        width: 200,
        height: 300,
        top: 100,
        left: 100,
        bottom: 400,
        right: 300,
        toJSON: () => ({}),
      });

      const componentData = {
        type: 'vstack',
        path: 'root',
        children: [
          { type: 'label', text: 'First' },
          { type: 'label', text: 'Second' },
        ],
      };

      const zones = registry.getDropZones(
        'vstack',
        mockElement,
        'palette-component',
        componentData
      );

      expect(zones.length).toBeGreaterThan(0);
      const lineZones = zones.filter((z) => z.indicator === 'line');
      expect(lineZones.length).toBeGreaterThan(0);
    });

    it('should generate drop zones for empty hstack', () => {
      const registry = getDragDropRegistry();

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = () => ({
        x: 100,
        y: 100,
        width: 300,
        height: 100,
        top: 100,
        left: 100,
        bottom: 200,
        right: 400,
        toJSON: () => ({}),
      });

      const componentData = {
        type: 'hstack',
        path: 'root',
        children: [],
      };

      const zones = registry.getDropZones(
        'hstack',
        mockElement,
        'palette-component',
        componentData
      );

      expect(zones.length).toBeGreaterThan(0);
      expect(zones[0].indicator).toBe('highlight');
    });

    it('should not generate zones for leaf components', () => {
      const registry = getDragDropRegistry();

      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = () => ({
        x: 100,
        y: 100,
        width: 200,
        height: 30,
        top: 100,
        left: 100,
        bottom: 130,
        right: 300,
        toJSON: () => ({}),
      });

      const componentData = {
        type: 'label',
        path: 'root',
        text: 'A label',
      };

      const zones = registry.getDropZones(
        'label',
        mockElement,
        'palette-component',
        componentData
      );

      expect(zones.length).toBe(0);
    });
  });

  describe('DragDropRegistry - Acceptance Rules', () => {
    it('should accept child components in containers', () => {
      const registry = getDragDropRegistry();

      expect(registry.canAcceptDrop('vstack', 'label')).toBe(true);
      expect(registry.canAcceptDrop('vstack', 'button')).toBe(true);
      expect(registry.canAcceptDrop('hstack', 'label')).toBe(true);
      expect(registry.canAcceptDrop('zstack', 'label')).toBe(true);
    });

    it('should reject drops on leaf components', () => {
      const registry = getDragDropRegistry();

      expect(registry.canAcceptDrop('label', 'vstack')).toBe(false);
      expect(registry.canAcceptDrop('label', 'button')).toBe(false);
      expect(registry.canAcceptDrop('button', 'label')).toBe(false);
    });

    it('should accept nested containers', () => {
      const registry = getDragDropRegistry();

      expect(registry.canAcceptDrop('vstack', 'vstack')).toBe(true);
      expect(registry.canAcceptDrop('vstack', 'hstack')).toBe(true);
      expect(registry.canAcceptDrop('hstack', 'vstack')).toBe(true);
    });
  });

  describe('DragDropRegistry - Component Types', () => {
    it('should return all registered component types', () => {
      const registry = getDragDropRegistry();

      const types = registry.getRegisteredTypes();
      expect(types).toContain('vstack');
      expect(types).toContain('hstack');
      expect(types).toContain('zstack');
      expect(types).toContain('label');
      expect(types).toContain('button');
    });
  });

  describe('Canvas Drop Zone Integration', () => {
    it('should validate palette component drops on canvas', () => {
      const registry = getDragDropRegistry();

      const labelSource: DragSource = {
        type: 'palette-component',
        data: { type: 'label', name: 'Text Label' },
      };

      const buttonSource: DragSource = {
        type: 'palette-component',
        data: { type: 'button', name: 'Action Button' },
      };

      // Should be able to drop on containers
      expect(registry.canDrop(labelSource, 'vstack')).toBe(true);
      expect(registry.canDrop(buttonSource, 'hstack')).toBe(true);

      // Should not be able to drop on leaf components
      expect(registry.canDrop(labelSource, 'label')).toBe(false);
      expect(registry.canDrop(buttonSource, 'button')).toBe(false);
    });

    it('should validate canvas node moves', () => {
      const registry = getDragDropRegistry();

      const canvasNodeSource: DragSource = {
        type: 'canvas-node',
        data: { type: 'label', path: 'root.children[0]' },
      };

      // Should be able to move to different containers
      expect(registry.canDrop(canvasNodeSource, 'vstack')).toBe(true);
      expect(registry.canDrop(canvasNodeSource, 'hstack')).toBe(true);

      // Should not be able to drop on leaf components
      expect(registry.canDrop(canvasNodeSource, 'label')).toBe(false);
    });

    it('should validate layer node moves', () => {
      const registry = getDragDropRegistry();

      const layerNodeSource: DragSource = {
        type: 'layer-node',
        data: { type: 'button', path: 'root.children[1]' },
      };

      // Should be able to move to containers
      expect(registry.canDrop(layerNodeSource, 'vstack')).toBe(true);
      expect(registry.canDrop(layerNodeSource, 'zstack')).toBe(true);

      // Should not be able to drop on leaf components
      expect(registry.canDrop(layerNodeSource, 'button')).toBe(false);
    });
  });
});
