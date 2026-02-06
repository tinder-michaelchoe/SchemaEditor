/**
 * Phase 1 Implementation Tests
 *
 * Tests for the enhanced DragDropManager, SchemaParser, and DragDropRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createDragDropManager, type DragSource, type DropTarget } from '../DragDropManager';
import { SchemaParser } from '../../../services/schemaParser';
import { DragDropRegistry } from '../DragDropRegistry';

describe('Phase 1: Enhanced Drag Drop System', () => {
  describe('DragDropManager - New Source Types', () => {
    it('should support new drag source types', () => {
      const manager = createDragDropManager();

      const paletteSource: DragSource = {
        type: 'palette-component',
        data: { type: 'label', name: 'Text Label' },
      };

      expect(() => manager.startDrag(paletteSource, { x: 100, y: 100 })).not.toThrow();
      expect(manager.isDragging()).toBe(true);

      const dragData = manager.getDragData();
      expect(dragData?.source.type).toBe('palette-component');
    });

    it('should support layer-node drag type', () => {
      const manager = createDragDropManager();

      const layerSource: DragSource = {
        type: 'layer-node',
        data: { path: 'root.children[0]', type: 'vstack' },
      };

      manager.startDrag(layerSource, { x: 100, y: 100 });
      expect(manager.isDragging()).toBe(true);
    });

    it('should support canvas-node drag type', () => {
      const manager = createDragDropManager();

      const canvasSource: DragSource = {
        type: 'canvas-node',
        data: { type: 'button', path: 'root.children[1]' },
      };

      manager.startDrag(canvasSource, { x: 100, y: 100 });
      expect(manager.isDragging()).toBe(true);
    });

    it('should call onDragEnd callback with success=true on drop', () => {
      const manager = createDragDropManager();
      let callbackResult: boolean | null = null;

      const source: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
        onDragEnd: (success) => {
          callbackResult = success;
        },
      };

      manager.startDrag(source, { x: 100, y: 100 });

      const target: DropTarget = {
        path: 'root.children',
        position: 'inside',
        accepts: ['palette-component'],
      };

      manager.handleDrop(target);

      expect(callbackResult).toBe(true);
    });

    it('should call onDragEnd callback with success=false on cancel', () => {
      const manager = createDragDropManager();
      let callbackResult: boolean | null = null;

      const source: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
        onDragEnd: (success) => {
          callbackResult = success;
        },
      };

      manager.startDrag(source, { x: 100, y: 100 });
      manager.endDrag();

      expect(callbackResult).toBe(false);
    });
  });

  describe('DragDropManager - Custom Validators', () => {
    it('should respect custom validator function', () => {
      const manager = createDragDropManager();

      const source: DragSource = {
        type: 'palette-component',
        data: { type: 'label', size: 10 },
      };

      manager.startDrag(source, { x: 100, y: 100 });

      const targetWithValidator: DropTarget = {
        path: 'root.children',
        position: 'inside',
        accepts: ['palette-component'],
        validator: (src) => {
          const data = src.data as { size?: number };
          return (data.size || 0) > 5;
        },
      };

      expect(manager.canDrop(targetWithValidator)).toBe(true);

      const targetWithFailingValidator: DropTarget = {
        path: 'root.children',
        position: 'inside',
        accepts: ['palette-component'],
        validator: (src) => {
          const data = src.data as { size?: number };
          return (data.size || 0) > 20;
        },
      };

      expect(manager.canDrop(targetWithFailingValidator)).toBe(false);
    });

    it('should prevent dropping node into itself', () => {
      const manager = createDragDropManager();

      const source: DragSource = {
        type: 'layer-node',
        data: { path: 'root.children[0]' },
      };

      manager.startDrag(source, { x: 100, y: 100 });

      const targetInsideSelf: DropTarget = {
        path: 'root.children[0].children',
        position: 'inside',
        accepts: ['layer-node'],
      };

      expect(manager.canDrop(targetInsideSelf)).toBe(false);
    });
  });

  describe('SchemaParser', () => {
    let parser: SchemaParser;

    beforeEach(() => {
      // Create a minimal schema for testing
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
          label: {
            properties: {
              type: { const: 'label' },
              text: { type: 'string' },
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

      parser = new SchemaParser(testSchema);
    });

    it('should identify components that can have children', () => {
      expect(parser.canHaveChildren('vstack')).toBe(true);
      expect(parser.canHaveChildren('label')).toBe(false);
    });

    it('should validate parent-child relationships', () => {
      expect(parser.canAcceptChild('vstack', 'label')).toBe(true);
      expect(parser.canAcceptChild('label', 'vstack')).toBe(false);
    });

    it('should return component information', () => {
      const vstackInfo = parser.getComponentInfo('vstack');
      expect(vstackInfo).not.toBeNull();
      expect(vstackInfo?.hasChildren).toBe(true);
      expect(vstackInfo?.childrenProperty).toBe('children');

      const labelInfo = parser.getComponentInfo('label');
      expect(labelInfo).not.toBeNull();
      expect(labelInfo?.hasChildren).toBe(false);
    });
  });

  describe('DragDropRegistry', () => {
    let registry: DragDropRegistry;

    beforeEach(() => {
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
          label: {
            properties: {
              type: { const: 'label' },
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
                examples: ['label', 'button'],
              },
            },
          },
        },
      };

      const parser = new SchemaParser(testSchema);
      registry = new DragDropRegistry(parser);
    });

    it('should register layout containers', () => {
      expect(registry.isRegistered('vstack')).toBe(true);
      expect(registry.isRegistered('hstack')).toBe(true);
      expect(registry.isRegistered('zstack')).toBe(true);
    });

    it('should register leaf components', () => {
      expect(registry.isRegistered('label')).toBe(true);
      expect(registry.isRegistered('button')).toBe(true);
    });

    it('should validate drops based on component type', () => {
      const paletteSource: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
      };

      expect(registry.canDrop(paletteSource, 'vstack')).toBe(true);
      expect(registry.canDrop(paletteSource, 'label')).toBe(false);
    });

    it('should provide acceptance rules', () => {
      expect(registry.canAcceptDrop('vstack', 'label')).toBe(true);
      expect(registry.canAcceptDrop('label', 'vstack')).toBe(false);
    });

    it('should generate drop zones for empty containers', () => {
      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
        toJSON: () => ({}),
      });

      const componentData = {
        type: 'vstack',
        path: 'root.children[0]',
        children: [],
      };

      const zones = registry.getDropZones('vstack', mockElement, 'palette-component', componentData);

      expect(zones.length).toBeGreaterThan(0);
      expect(zones[0].indicator).toBe('highlight');
      expect(zones[0].position).toBe('inside');
    });

    it('should generate drop zones with lines for containers with children', () => {
      const mockElement = document.createElement('div');
      mockElement.getBoundingClientRect = () => ({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        top: 0,
        left: 0,
        bottom: 100,
        right: 100,
        toJSON: () => ({}),
      });

      const componentData = {
        type: 'vstack',
        path: 'root.children[0]',
        children: [{ type: 'label' }, { type: 'button' }],
      };

      const zones = registry.getDropZones('vstack', mockElement, 'palette-component', componentData);

      expect(zones.length).toBeGreaterThan(0);
      // Should have lines (before/after positions)
      const hasLines = zones.some(zone => zone.indicator === 'line');
      expect(hasLines).toBe(true);
    });
  });

  describe('DragDropManager - Priority and SourceId', () => {
    it('should support priority field in drop targets', () => {
      const manager = createDragDropManager();

      const source: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
      };

      manager.startDrag(source, { x: 100, y: 100 });

      const highPriorityTarget: DropTarget = {
        path: 'root.children',
        position: 'inside',
        accepts: ['palette-component'],
        priority: 10,
      };

      const lowPriorityTarget: DropTarget = {
        path: 'root.children',
        position: 'inside',
        accepts: ['palette-component'],
        priority: 1,
      };

      // Both should be valid
      expect(manager.canDrop(highPriorityTarget)).toBe(true);
      expect(manager.canDrop(lowPriorityTarget)).toBe(true);
    });

    it('should support sourceId field in drag sources', () => {
      const manager = createDragDropManager();

      const source: DragSource = {
        type: 'palette-component',
        data: { type: 'label' },
        sourceId: 'unique-source-123',
      };

      manager.startDrag(source, { x: 100, y: 100 });

      const dragData = manager.getDragData();
      expect(dragData?.source.sourceId).toBe('unique-source-123');
    });
  });

  describe('SchemaParser - Additional Methods', () => {
    let parser: SchemaParser;

    beforeEach(() => {
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
          label: {
            properties: {
              type: { const: 'label' },
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

      parser = new SchemaParser(testSchema);
    });

    it('should return all component types', () => {
      const types = parser.getAllComponentTypes();
      expect(types).toContain('vstack');
      expect(types).toContain('hstack');
      expect(types).toContain('label');
      expect(types).toContain('button');
    });

    it('should return valid child types for a parent', () => {
      const validChildren = parser.getValidChildTypes('vstack');
      expect(validChildren.length).toBeGreaterThan(0);
      expect(validChildren).toContain('vstack');
      expect(validChildren).toContain('label');
    });

    it('should return empty array for components that cannot have children', () => {
      const validChildren = parser.getValidChildTypes('label');
      expect(validChildren).toEqual([]);
    });
  });

  describe('DragDropManager - File Drag Type', () => {
    it('should support file drag type', () => {
      const manager = createDragDropManager();

      const fileSource: DragSource = {
        type: 'file',
        data: { name: 'image.png', type: 'image/png' },
      };

      manager.startDrag(fileSource, { x: 100, y: 100 });
      expect(manager.isDragging()).toBe(true);

      const dragData = manager.getDragData();
      expect(dragData?.source.type).toBe('file');
    });

    it('should validate file drops with accepts list', () => {
      const manager = createDragDropManager();

      const fileSource: DragSource = {
        type: 'file',
        data: { name: 'image.png' },
      };

      manager.startDrag(fileSource, { x: 100, y: 100 });

      const targetAcceptingFiles: DropTarget = {
        path: 'root',
        position: 'inside',
        accepts: ['file'],
      };

      expect(manager.canDrop(targetAcceptingFiles)).toBe(true);

      const targetNotAcceptingFiles: DropTarget = {
        path: 'root',
        position: 'inside',
        accepts: ['palette-component'],
      };

      expect(manager.canDrop(targetNotAcceptingFiles)).toBe(false);
    });
  });

  describe('DragDropRegistry - Custom Component Registration', () => {
    it('should allow registering custom components', () => {
      const registry = new DragDropRegistry();

      registry.registerComponent({
        componentType: 'custom-widget',
        canAccept: (childType) => childType === 'label',
        getDropZones: () => [],
      });

      expect(registry.isRegistered('custom-widget')).toBe(true);
      expect(registry.canAcceptDrop('custom-widget', 'label')).toBe(true);
      expect(registry.canAcceptDrop('custom-widget', 'button')).toBe(false);
    });
  });

  describe('DragDropManager - Backwards Compatibility', () => {
    it('should still support legacy "component" type', () => {
      const manager = createDragDropManager();

      const legacySource: DragSource = {
        type: 'component',
        data: { type: 'label' },
      };

      manager.startDrag(legacySource, { x: 100, y: 100 });
      expect(manager.isDragging()).toBe(true);
    });

    it('should still support legacy "node" type', () => {
      const manager = createDragDropManager();

      const legacySource: DragSource = {
        type: 'node',
        data: { path: 'root.children[0]' },
      };

      manager.startDrag(legacySource, { x: 100, y: 100 });
      expect(manager.isDragging()).toBe(true);
    });

    it('should still support legacy "template" type', () => {
      const manager = createDragDropManager();

      const legacySource: DragSource = {
        type: 'template',
        data: { name: 'Card Template' },
      };

      manager.startDrag(legacySource, { x: 100, y: 100 });
      expect(manager.isDragging()).toBe(true);
    });
  });
});
