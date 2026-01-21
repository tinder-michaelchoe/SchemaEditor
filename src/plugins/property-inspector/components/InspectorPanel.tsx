import React, { useMemo } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { getValueAtPath, stringToPath } from '@/utils/pathUtils';
import { PropertySection } from './PropertySection';
import { PropertyRow } from './PropertyRow';
import { StylesPanel } from './StylesPanel';
import { TextEditor } from '../editors/TextEditor';
import { NumberEditor } from '../editors/NumberEditor';
import { BooleanEditor } from '../editors/BooleanEditor';
import { EnumEditor } from '../editors/EnumEditor';
import { ImageEditor } from '../editors/ImageEditor';
import { LayoutEditor } from '../editors/LayoutEditor';
import type { JSONSchema } from '@/types/schema';

export function InspectorPanel() {
  const {
    data,
    schema,
    schemaContext,
    selectedPath,
    updateValue,
    removeObjectProperty,
  } = useEditorStore();

  // Get the selected value and its schema
  const { selectedValue, propertySchema } = useMemo(() => {
    if (!selectedPath || !data || !schema) {
      return { selectedValue: null, propertySchema: null };
    }

    // Handle root path
    if (selectedPath === 'root') {
      return { selectedValue: data, propertySchema: schema };
    }

    const pathSegments = stringToPath(selectedPath);
    const value = getValueAtPath(data, pathSegments);

    // Walk schema to get property schema
    let currentSchema: JSONSchema | null = schema;
    for (const segment of pathSegments) {
      if (!currentSchema) break;

      if (typeof segment === 'number') {
        // Array index
        if (currentSchema.items && !Array.isArray(currentSchema.items)) {
          currentSchema = currentSchema.items;
        } else {
          currentSchema = null;
        }
      } else {
        // Object property
        if (currentSchema.properties?.[segment]) {
          currentSchema = currentSchema.properties[segment];
        } else if (
          currentSchema.additionalProperties &&
          typeof currentSchema.additionalProperties === 'object'
        ) {
          currentSchema = currentSchema.additionalProperties;
        } else {
          currentSchema = null;
        }
      }
    }

    return { selectedValue: value, propertySchema: currentSchema };
  }, [data, schema, selectedPath]);

  // Handle value changes
  const handleChange = (propertyPath: (string | number)[], newValue: unknown) => {
    if (!selectedPath) return;

    const basePath = selectedPath === 'root' ? [] : stringToPath(selectedPath);
    updateValue([...basePath, ...propertyPath], newValue);
  };

  // Render editor for a specific property
  const renderEditor = (
    key: string,
    value: unknown,
    propSchema: JSONSchema | undefined
  ) => {
    const valueType = typeof value;

    // Handle enums
    if (propSchema?.enum && Array.isArray(propSchema.enum)) {
      return (
        <EnumEditor
          value={String(value ?? '')}
          options={propSchema.enum.map((v) => ({
            value: String(v),
            label: String(v),
          }))}
          onChange={(v) => handleChange([key], v)}
          displayMode={propSchema.enum.length <= 4 ? 'buttons' : 'select'}
        />
      );
    }

    // Handle by type
    if (valueType === 'string') {
      return (
        <TextEditor
          value={value as string}
          onChange={(v) => handleChange([key], v)}
          multiline={key === 'text' || key === 'description'}
        />
      );
    }

    if (valueType === 'number') {
      return (
        <NumberEditor
          value={value as number}
          onChange={(v) => handleChange([key], v)}
          min={propSchema?.minimum}
          max={propSchema?.maximum}
          showSlider={propSchema?.minimum !== undefined && propSchema?.maximum !== undefined}
        />
      );
    }

    if (valueType === 'boolean') {
      return (
        <BooleanEditor
          value={value as boolean}
          onChange={(v) => handleChange([key], v)}
        />
      );
    }

    // For complex types, check for special editors
    if (valueType === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return (
          <span className="text-sm text-[var(--text-tertiary)]">
            [{value.length} items]
          </span>
        );
      }
      
      // Check if this is an image property (has type: asset/url/system)
      const objValue = value as Record<string, unknown>;
      if (key === 'image' && objValue.type && ['asset', 'url', 'system'].includes(String(objValue.type))) {
        return (
          <ImageEditor
            value={objValue as { type: 'asset' | 'url' | 'system'; name?: string; url?: string }}
            onChange={(v) => handleChange([key], v)}
          />
        );
      }
      
      return (
        <span className="text-sm text-[var(--text-tertiary)]">
          {'{...}'}
        </span>
      );
    }

    if (value === null) {
      return (
        <span className="text-sm text-[var(--text-tertiary)] italic">null</span>
      );
    }

    return (
      <span className="text-sm text-[var(--text-primary)]">{String(value)}</span>
    );
  };

  // Group properties by category
  const groupedProperties = useMemo(() => {
    if (!selectedValue || typeof selectedValue !== 'object' || selectedValue === null) {
      return new Map<string, string[]>();
    }

    const groups = new Map<string, string[]>();
    groups.set('General', []);
    groups.set('Layout', []);
    groups.set('Style', []);
    groups.set('Advanced', []);

    const layoutProps = ['spacing', 'padding', 'alignment', 'distribution', 'width', 'height'];
    const styleProps = ['backgroundColor', 'foregroundColor', 'style', 'styleId', 'cornerRadius', 'shadow'];
    const generalProps = ['type', 'id', 'text', 'title', 'name', 'label', 'value', 'image', 'placeholder'];

    for (const key of Object.keys(selectedValue)) {
      if (generalProps.some((p) => key.toLowerCase().includes(p))) {
        groups.get('General')!.push(key);
      } else if (layoutProps.some((p) => key.toLowerCase().includes(p))) {
        groups.get('Layout')!.push(key);
      } else if (styleProps.some((p) => key.toLowerCase().includes(p))) {
        groups.get('Style')!.push(key);
      } else {
        groups.get('Advanced')!.push(key);
      }
    }

    // Remove empty groups
    for (const [key, value] of groups.entries()) {
      if (value.length === 0) {
        groups.delete(key);
      }
    }

    return groups;
  }, [selectedValue]);

  if (!selectedPath) {
    return null;
  }

  if (!selectedValue || typeof selectedValue !== 'object') {
    return (
      <div className="h-full p-4">
        <PropertyRow label="Value">
          {renderEditor('value', selectedValue, propertySchema ?? undefined)}
        </PropertyRow>
      </div>
    );
  }

  const valueObj = selectedValue as Record<string, unknown>;

  return (
    <div className="h-full overflow-y-auto">
      {/* Header with selected path */}
      <div className="px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
        <p className="text-xs text-[var(--text-tertiary)] truncate" title={selectedPath}>
          {selectedPath}
        </p>
        {valueObj.type && (
          <p className="text-sm font-medium text-[var(--text-primary)]">
            {String(valueObj.type)}
          </p>
        )}
      </div>

      {/* Property sections */}
      {Array.from(groupedProperties.entries()).map(([group, props]) => (
        <PropertySection key={group} title={group} defaultOpen={group === 'General'}>
          {props.map((key) => {
            const propSchema = propertySchema?.properties?.[key];
            return (
              <PropertyRow
                key={key}
                label={key}
                description={propSchema?.description}
                required={propertySchema?.required?.includes(key)}
              >
                {renderEditor(key, valueObj[key], propSchema)}
              </PropertyRow>
            );
          })}
        </PropertySection>
      ))}

      {/* Layout section for image components */}
      {valueObj.type === 'image' && (
        <PropertySection title="Layout" defaultOpen={true}>
          <LayoutEditor
            width={valueObj.width as number | undefined}
            height={valueObj.height as number | undefined}
            fillWidth={(valueObj.fillWidth as boolean) || false}
            aspectRatioLocked={(valueObj._aspectRatioLocked as boolean) || false}
            pinnedEdges={(valueObj._pinnedEdges as string[]) || []}
            contentMode={(valueObj.contentMode as string) || 'aspectFill'}
            padding={valueObj.padding as { top?: number; bottom?: number; leading?: number; trailing?: number } || {}}
            onChange={(updates) => {
              const basePath = selectedPath === 'root' ? [] : stringToPath(selectedPath);
              for (const [key, value] of Object.entries(updates)) {
                if (value === undefined) {
                  // Remove the property when value is undefined
                  removeObjectProperty(basePath, key);
                } else {
                  handleChange([key], value);
                }
              }
            }}
          />
        </PropertySection>
      )}

      {/* Styles Panel */}
      <StylesPanel />
    </div>
  );
}
