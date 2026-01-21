import { 
  Layers, 
  AlignHorizontalJustifyCenter, 
  AlignVerticalJustifyCenter,
  Layers2,
  Type, 
  Image, 
  Paintbrush,
  Minus,
  MousePointer,
  TextCursorInput,
  ToggleLeft,
  SlidersHorizontal,
  Repeat,
  Space,
} from 'lucide-react';
import React from 'react';

export interface ComponentDefinition {
  type: string;
  name: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultProps: Record<string, unknown>;
}

export const COMPONENT_CATEGORIES = [
  { id: 'layout', name: 'Layout', description: 'Container components for arranging children' },
  { id: 'content', name: 'Content', description: 'Display text, images, and visual elements' },
  { id: 'input', name: 'Input', description: 'Interactive input components' },
  { id: 'control', name: 'Control', description: 'Control flow and spacing' },
] as const;

export type CategoryId = typeof COMPONENT_CATEGORIES[number]['id'];

/**
 * Built-in CLADS component definitions
 * These are derived from the CLADS schema
 */
export const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Layout components
  {
    type: 'vstack',
    name: 'VStack',
    category: 'layout',
    description: 'Vertical stack - arranges children vertically',
    icon: AlignVerticalJustifyCenter,
    defaultProps: {
      type: 'vstack',
      spacing: 8,
      children: [],
    },
  },
  {
    type: 'hstack',
    name: 'HStack',
    category: 'layout',
    description: 'Horizontal stack - arranges children horizontally',
    icon: AlignHorizontalJustifyCenter,
    defaultProps: {
      type: 'hstack',
      spacing: 8,
      children: [],
    },
  },
  {
    type: 'zstack',
    name: 'ZStack',
    category: 'layout',
    description: 'Z-axis stack - overlays children',
    icon: Layers2,
    defaultProps: {
      type: 'zstack',
      children: [],
    },
  },
  {
    type: 'sectionLayout',
    name: 'Section Layout',
    category: 'layout',
    description: 'Layout with collapsible sections',
    icon: Layers,
    defaultProps: {
      type: 'sectionLayout',
      sections: [],
    },
  },
  
  // Content components
  {
    type: 'label',
    name: 'Label',
    category: 'content',
    description: 'Text label component',
    icon: Type,
    defaultProps: {
      type: 'label',
      text: 'Label text',
    },
  },
  {
    type: 'image',
    name: 'Image',
    category: 'content',
    description: 'Display an image',
    icon: Image,
    defaultProps: {
      type: 'image',
      image: {
        type: 'asset',
        name: 'placeholder',
      },
    },
  },
  {
    type: 'gradient',
    name: 'Gradient',
    category: 'content',
    description: 'Gradient background element',
    icon: Paintbrush,
    defaultProps: {
      type: 'gradient',
      gradientColors: [
        { color: '#3B82F6', location: 0 },
        { color: '#8B5CF6', location: 1 },
      ],
      gradientStart: 'topLeading',
      gradientEnd: 'bottomTrailing',
    },
  },
  {
    type: 'divider',
    name: 'Divider',
    category: 'content',
    description: 'Horizontal or vertical divider line',
    icon: Minus,
    defaultProps: {
      type: 'divider',
    },
  },
  
  // Input components
  {
    type: 'button',
    name: 'Button',
    category: 'input',
    description: 'Clickable button',
    icon: MousePointer,
    defaultProps: {
      type: 'button',
      text: 'Button',
    },
  },
  {
    type: 'textfield',
    name: 'Text Field',
    category: 'input',
    description: 'Text input field',
    icon: TextCursorInput,
    defaultProps: {
      type: 'textfield',
      placeholder: 'Enter text...',
    },
  },
  {
    type: 'toggle',
    name: 'Toggle',
    category: 'input',
    description: 'On/off toggle switch',
    icon: ToggleLeft,
    defaultProps: {
      type: 'toggle',
    },
  },
  {
    type: 'slider',
    name: 'Slider',
    category: 'input',
    description: 'Value slider',
    icon: SlidersHorizontal,
    defaultProps: {
      type: 'slider',
      minValue: 0,
      maxValue: 100,
    },
  },
  
  // Control components
  {
    type: 'forEach',
    name: 'For Each',
    category: 'control',
    description: 'Iterate over an array',
    icon: Repeat,
    defaultProps: {
      type: 'forEach',
      items: '',
      template: {
        type: 'label',
        text: '${item}',
      },
    },
  },
  {
    type: 'spacer',
    name: 'Spacer',
    category: 'control',
    description: 'Flexible space element',
    icon: Space,
    defaultProps: {
      type: 'spacer',
    },
  },
];

/**
 * Get components grouped by category
 */
export function getComponentsByCategory(): Map<string, ComponentDefinition[]> {
  const map = new Map<string, ComponentDefinition[]>();
  
  for (const category of COMPONENT_CATEGORIES) {
    map.set(category.id, []);
  }
  
  for (const component of COMPONENT_DEFINITIONS) {
    const list = map.get(component.category);
    if (list) {
      list.push(component);
    }
  }
  
  return map;
}

/**
 * Get component definition by type
 */
export function getComponentByType(type: string): ComponentDefinition | undefined {
  return COMPONENT_DEFINITIONS.find(c => c.type === type);
}
