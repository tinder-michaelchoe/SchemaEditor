import React, { useRef, useEffect, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { pathToString } from '@/utils/pathUtils';
import { useEditorState } from '@/store/EditorContext';
import { useDragSource } from '@/plugins/drag-drop-service';

// Style definition matching the CLADS schema
interface StyleDefinition {
  inherits?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  textColor?: string;
  textAlignment?: string;
  backgroundColor?: string;
  cornerRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  tintColor?: string;
  width?: number;
  height?: number;
  padding?: {
    top?: number;
    bottom?: number;
    leading?: number;
    trailing?: number;
    horizontal?: number;
    vertical?: number;
  };
}

interface CanvasNodeProps {
  node: Record<string, unknown>;
  path: (string | number)[];
  selectedPath: string | null;
  hoveredPath: string | null;
  editingContainerPath: string | null;
  onSelect: (path: string, e: React.MouseEvent) => void;
  onDoubleClick: (path: string, e: React.MouseEvent) => void;
  onHover: (path: string | null) => void;
  onBoundsChange: (path: string, bounds: DOMRect) => void;
  onContextMenu?: (path: string, x: number, y: number) => void;
  zoom: number;
}

// Helper to resolve style with inheritance
function resolveStyle(styleId: string | undefined, styles: Record<string, StyleDefinition>): StyleDefinition {
  if (!styleId || !styles[styleId]) return {};

  const style = styles[styleId];
  if (style.inherits && styles[style.inherits]) {
    const parentStyle = resolveStyle(style.inherits, styles);
    return { ...parentStyle, ...style };
  }

  return style;
}

// Convert style definition to CSS properties
function styleToCss(style: StyleDefinition): React.CSSProperties {
  const result: React.CSSProperties = {};

  if (style.fontSize) result.fontSize = style.fontSize;
  if (style.fontFamily) result.fontFamily = style.fontFamily;
  if (style.fontWeight) {
    const weightMap: Record<string, number> = {
      ultraLight: 100,
      thin: 200,
      light: 300,
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      heavy: 800,
      black: 900,
    };
    result.fontWeight = weightMap[style.fontWeight] || 400;
  }
  if (style.textColor) result.color = style.textColor;
  if (style.textAlignment) {
    const alignMap: Record<string, 'left' | 'center' | 'right'> = {
      leading: 'left',
      center: 'center',
      trailing: 'right',
    };
    result.textAlign = alignMap[style.textAlignment] || 'left';
  }
  if (style.backgroundColor) result.backgroundColor = style.backgroundColor;
  if (style.cornerRadius) result.borderRadius = style.cornerRadius;
  if (style.borderWidth) result.borderWidth = style.borderWidth;
  if (style.borderColor) {
    result.borderColor = style.borderColor;
    result.borderStyle = 'solid';
  }
  if (style.width) result.width = style.width;
  if (style.height) result.height = style.height;

  if (style.padding) {
    const p = style.padding;
    result.paddingTop = p.top ?? p.vertical ?? 0;
    result.paddingBottom = p.bottom ?? p.vertical ?? 0;
    result.paddingLeft = p.leading ?? p.horizontal ?? 0;
    result.paddingRight = p.trailing ?? p.horizontal ?? 0;
  }

  return result;
}

// ---- Styled Components ----

const NodeWrapper = styled.div<{ $isEditing: boolean; $isLocked: boolean; $isDragging: boolean }>`
  position: relative;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 4px;

  ${p => p.$isEditing && css`
    outline: 2px dashed color-mix(in srgb, ${p.theme.colors.accent} 50%, transparent);
  `}

  ${p => p.$isLocked && css`
    pointer-events: none;
    opacity: 0.75;
  `}

  ${p => p.$isDragging && css`
    opacity: 0.5;
  `}
`;

const LockOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(107, 114, 128, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
`;

const LockBadge = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: #f97316;
  color: white;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 4px;
`;

const VStackContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  border: 2px dashed rgba(96, 165, 250, 0.5);
  background-color: rgba(239, 246, 255, 0.1);
`;

const HStackContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  border-radius: 4px;
  border: 2px dashed rgba(74, 222, 128, 0.5);
  background-color: rgba(240, 253, 244, 0.1);
`;

const ZStackContainer = styled.div`
  position: relative;
  border-radius: 4px;
  border: 2px dashed rgba(192, 132, 252, 0.5);
  background-color: rgba(250, 245, 255, 0.1);
`;

const SectionLayoutContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  border: 2px dashed rgba(251, 146, 60, 0.5);
  background-color: rgba(255, 247, 237, 0.1);
`;

const ContainerLabel = styled.div<{ $color: string }>`
  position: absolute;
  top: -20px;
  left: 4px;
  font-size: 10px;
  font-weight: 500;
  color: ${p => p.$color};
  pointer-events: none;
`;

const EmptyMessage = styled.div<{ $color: string; $hasFlex?: boolean }>`
  ${p => p.$hasFlex !== false && css`flex: 1;`}
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.$color};
  font-size: 12px;
  line-height: 16px;
  padding: 16px 0;
`;

const LabelWrapper = styled.div`
  padding: 4px 8px;
`;

const ButtonWrapper = styled.div`
  padding: 8px 16px;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  text-align: center;
`;

const ImageContainer = styled.div`
  background-color: ${p => p.theme.colors.bgTertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px dashed ${p => p.theme.colors.border};
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
`;

const ImagePlaceholder = styled.div<{ $withColor?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  height: 100%;

  ${p => p.$withColor && css`
    color: ${p.theme.colors.textTertiary};
  `}
`;

const ImageLabel = styled.span`
  font-size: 10px;
  color: ${p => p.theme.colors.textTertiary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  padding: 0 4px;
`;

const TextFieldWrapper = styled.div`
  padding: 8px 12px;
  border-width: 1px;
  border-style: solid;
  font-size: 14px;
  line-height: 20px;
`;

const ToggleTrack = styled.div`
  width: 48px;
  height: 28px;
  border-radius: 9999px;
  transition: background-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  padding: 0 4px;
`;

const ToggleThumb = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 9999px;
  background-color: white;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const SpacerBox = styled.div`
  min-height: 20px;
  min-width: 20px;
  background-color: color-mix(in srgb, ${p => p.theme.colors.bgTertiary} 30%, transparent);
  border-radius: 4px;
  border: 1px dashed ${p => p.theme.colors.border};
`;

const DividerLine = styled.div`
  height: 1px;
  width: 100%;
  background-color: ${p => p.theme.colors.border};
`;

const DefaultBox = styled.div`
  padding: 8px 12px;
  background-color: ${p => p.theme.colors.bgTertiary};
  border-radius: 4px;
  font-size: 14px;
  line-height: 20px;
  color: ${p => p.theme.colors.textSecondary};
`;

const HorizontalScroll = styled.div`
  overflow-x: auto;
`;

const HorizontalList = styled.div`
  display: flex;
  flex-direction: row;
`;

const GridContainer = styled.div`
  display: grid;
`;

const ListContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const ListDivider = styled.div`
  height: 1px;
  background-color: ${p => p.theme.colors.border};
  margin: 0;
`;

const EmptyText = styled.div`
  color: #9ca3af;
  font-size: 12px;
  line-height: 16px;
  padding: 16px;
`;

const GridEmptyText = styled.div`
  color: #9ca3af;
  font-size: 12px;
  line-height: 16px;
  padding: 16px 0;
  grid-column: 1 / -1;
`;

const ListEmptyText = styled.div`
  color: #9ca3af;
  font-size: 12px;
  line-height: 16px;
  padding: 16px 0;
`;

const SectionHeader = styled.div`
  margin-bottom: 8px;
`;

const SectionWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

// ---- Components ----

export function CanvasNode({
  node,
  path,
  selectedPath,
  hoveredPath,
  editingContainerPath,
  onSelect,
  onDoubleClick,
  onHover,
  onBoundsChange,
  onContextMenu,
  zoom,
}: CanvasNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const pathStr = pathToString(path);
  const nodeType = (node.type as string) || 'unknown';

  // Check visibility - default to true if not set
  const isVisible = node._visible !== false;

  // Calculate selection state based on path comparison
  const isSelected = selectedPath === pathStr;
  const isHovered = hoveredPath === pathStr;
  const isEditing = editingContainerPath === pathStr;

  // Check if locked
  const isLocked = node._locked === true;

  // Enable drag for canvas nodes
  const { isDragging: isNodeDragging, dragProps } = useDragSource({
    type: 'canvas-node',
    data: {
      path: pathStr,
      type: nodeType,
      componentData: node,
    },
  });

  // Get styles from document
  const { data } = useEditorState();
  const documentStyles = (data as Record<string, unknown>)?.styles as Record<string, StyleDefinition> || {};

  // Resolve the node's style
  const styleId = node.styleId as string | undefined;
  const resolvedStyle = resolveStyle(styleId, documentStyles);
  const styleCss = styleToCss(resolvedStyle);

  // Report bounds on mount and resize
  useEffect(() => {
    if (!nodeRef.current) return;

    const updateBounds = () => {
      if (nodeRef.current) {
        onBoundsChange(pathStr, nodeRef.current.getBoundingClientRect());
      }
    };

    updateBounds();

    const observer = new ResizeObserver(updateBounds);
    observer.observe(nodeRef.current);

    return () => observer.disconnect();
  }, [pathStr, onBoundsChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(pathStr, e);
  }, [pathStr, onSelect]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(pathStr, e);
  }, [pathStr, onDoubleClick]);

  const handleMouseEnter = useCallback(() => {
    onHover(pathStr);
  }, [pathStr, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(null);
  }, [onHover]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onContextMenu && !isLocked) {
      onContextMenu(pathStr, e.clientX, e.clientY);
    }
  }, [pathStr, onContextMenu, isLocked]);

  // Render based on node type
  const renderContent = () => {
    const commonProps = {
      node,
      styleCss,
      resolvedStyle,
      documentStyles,
    };

    switch (nodeType) {
      case 'vstack':
        return <VStackRenderer {...commonProps} path={path} {...renderProps} />;
      case 'hstack':
        return <HStackRenderer {...commonProps} path={path} {...renderProps} />;
      case 'zstack':
        return <ZStackRenderer {...commonProps} path={path} {...renderProps} />;
      case 'label':
        return <LabelRenderer {...commonProps} />;
      case 'button':
        return <ButtonRenderer {...commonProps} />;
      case 'image':
        return <ImageRenderer {...commonProps} />;
      case 'spacer':
        return <SpacerRenderer {...commonProps} />;
      case 'divider':
        return <DividerRenderer {...commonProps} />;
      case 'textfield':
        return <TextFieldRenderer {...commonProps} />;
      case 'toggle':
        return <ToggleRenderer {...commonProps} />;
      case 'sectionLayout':
        return <SectionLayoutRenderer {...commonProps} path={path} {...renderProps} />;
      default:
        return <DefaultRenderer {...commonProps} />;
    }
  };

  const renderProps = {
    selectedPath,
    hoveredPath,
    editingContainerPath,
    onSelect,
    onDoubleClick,
    onHover,
    onBoundsChange,
    onContextMenu,
    zoom,
  };

  // Don't render if hidden
  if (!isVisible) {
    return null;
  }

  // Spacer needs to pass flex: 1 to its wrapper
  const wrapperStyle: React.CSSProperties = nodeType === 'spacer' ? { flex: 1 } : {};

  // Override dragProps to add stopPropagation to prevent marquee selection
  const dragPropsWithStopPropagation = isLocked ? {} : {
    ...dragProps,
    onMouseDown: (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent marquee selection from starting
      dragProps.onMouseDown(e);
    },
  };

  return (
    <NodeWrapper
      ref={nodeRef}
      $isEditing={isEditing}
      $isLocked={isLocked}
      $isDragging={isNodeDragging}
      data-path={pathStr}
      data-type={nodeType}
      onClick={isLocked ? undefined : handleClick}
      onDoubleClick={isLocked ? undefined : handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onContextMenu={isLocked ? undefined : handleContextMenu}
      {...dragPropsWithStopPropagation}
      style={{
        ...wrapperStyle,
        ...(dragProps.style || {}),
      }}
    >
      {renderContent()}
      {/* Lock indicator overlay */}
      {isLocked && (
        <LockOverlay>
          <LockBadge>
            Locked
          </LockBadge>
        </LockOverlay>
      )}
    </NodeWrapper>
  );
}

// Individual renderers for each component type
interface RendererProps {
  node: Record<string, unknown>;
  styleCss: React.CSSProperties;
  resolvedStyle: StyleDefinition;
  documentStyles: Record<string, StyleDefinition>;
}

interface ContainerRendererProps extends RendererProps {
  path: (string | number)[];
  selectedPath: string | null;
  hoveredPath: string | null;
  editingContainerPath: string | null;
  onSelect: (path: string, e: React.MouseEvent) => void;
  onDoubleClick: (path: string, e: React.MouseEvent) => void;
  onHover: (path: string | null) => void;
  onBoundsChange: (path: string, bounds: DOMRect) => void;
  onContextMenu?: (path: string, x: number, y: number) => void;
  zoom: number;
}

function VStackRenderer({ node, path, styleCss, ...props }: ContainerRendererProps) {
  const children = (node.children as Record<string, unknown>[]) || [];
  const spacing = (node.spacing as number) || 8;
  const padding = node.padding as Record<string, number> | undefined;

  return (
    <VStackContainer
      style={{
        ...styleCss,
        gap: spacing,
        padding: padding
          ? `${padding.top || 0}px ${padding.trailing || 0}px ${padding.bottom || 0}px ${padding.leading || 0}px`
          : styleCss.paddingTop ? undefined : '8px',
        minHeight: 60,
        minWidth: 100,
      }}
    >
      {/* Container label */}
      <ContainerLabel $color="rgba(59, 130, 246, 0.7)">
        VStack
      </ContainerLabel>
      {children.map((child, index) => (
        <CanvasNode
          key={index}
          node={child}
          path={[...path, 'children', index]}
          {...props}
        />
      ))}
      {children.length === 0 && (
        <EmptyMessage $color="rgba(96, 165, 250, 0.6)">
          Drop components here
        </EmptyMessage>
      )}
    </VStackContainer>
  );
}

function HStackRenderer({ node, path, styleCss, ...props }: ContainerRendererProps) {
  const children = (node.children as Record<string, unknown>[]) || [];
  const spacing = (node.spacing as number) || 8;
  const padding = node.padding as Record<string, number> | undefined;
  const alignment = (node.alignment as string) || 'center';

  // Map alignment to CSS
  const alignmentMap: Record<string, string> = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
    firstTextBaseline: 'baseline',
    lastTextBaseline: 'baseline',
  };

  return (
    <HStackContainer
      style={{
        ...styleCss,
        gap: spacing,
        alignItems: alignmentMap[alignment] || 'center',
        padding: padding
          ? `${padding.top || 0}px ${padding.trailing || 0}px ${padding.bottom || 0}px ${padding.leading || 0}px`
          : styleCss.paddingTop ? undefined : '8px',
        minHeight: 60,
        minWidth: 100,
      }}
    >
      {/* Container label */}
      <ContainerLabel $color="rgba(34, 197, 94, 0.7)">
        HStack
      </ContainerLabel>
      {children.map((child, index) => (
        <CanvasNode
          key={index}
          node={child}
          path={[...path, 'children', index]}
          {...props}
        />
      ))}
      {children.length === 0 && (
        <EmptyMessage $color="rgba(74, 222, 128, 0.6)">
          Drop components here
        </EmptyMessage>
      )}
    </HStackContainer>
  );
}

function ZStackRenderer({ node, path, styleCss, ...props }: ContainerRendererProps) {
  const children = (node.children as Record<string, unknown>[]) || [];
  const alignment = (node.alignment as string) || 'center';

  // Map alignment to CSS grid properties
  const alignmentStyles: Record<string, { justifyItems: string; alignItems: string }> = {
    topLeading: { justifyItems: 'start', alignItems: 'start' },
    top: { justifyItems: 'center', alignItems: 'start' },
    topTrailing: { justifyItems: 'end', alignItems: 'start' },
    leading: { justifyItems: 'start', alignItems: 'center' },
    center: { justifyItems: 'center', alignItems: 'center' },
    trailing: { justifyItems: 'end', alignItems: 'center' },
    bottomLeading: { justifyItems: 'start', alignItems: 'end' },
    bottom: { justifyItems: 'center', alignItems: 'end' },
    bottomTrailing: { justifyItems: 'end', alignItems: 'end' },
  };

  const gridAlignment = alignmentStyles[alignment] || alignmentStyles.center;

  return (
    <ZStackContainer
      style={{
        ...styleCss,
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr',
        justifyItems: gridAlignment.justifyItems,
        alignItems: gridAlignment.alignItems,
        minHeight: children.length === 0 ? 60 : undefined,
        minWidth: children.length === 0 ? 100 : undefined,
        padding: styleCss.paddingTop ? undefined : '8px',
      }}
    >
      {/* Container label */}
      <ContainerLabel $color="rgba(168, 85, 247, 0.7)" style={{ zIndex: 10 }}>
        ZStack
      </ContainerLabel>
      {/* All children stack in the same grid cell */}
      {children.map((child, index) => (
        <div
          key={index}
          style={{
            gridColumn: 1,
            gridRow: 1,
            zIndex: index + 1, // Later children appear on top
          }}
        >
          <CanvasNode
            node={child}
            path={[...path, 'children', index]}
            {...props}
          />
        </div>
      ))}
      {children.length === 0 && (
        <EmptyMessage $color="rgba(192, 132, 252, 0.6)" $hasFlex={false}>
          Drop components here
        </EmptyMessage>
      )}
    </ZStackContainer>
  );
}

function SectionLayoutRenderer({ node, path, styleCss, ...props }: ContainerRendererProps) {
  const sections = (node.sections as Array<{
    id?: string;
    layout: {
      type: string;
      columns?: number;
      itemSpacing?: number;
      lineSpacing?: number;
      contentInsets?: { leading?: number; trailing?: number; horizontal?: number };
      showsIndicators?: boolean;
      showsDividers?: boolean;
    };
    header?: Record<string, unknown>;
    children?: Record<string, unknown>[];
  }>) || [];

  const sectionSpacing = (node.sectionSpacing as number) || 24;

  const renderSectionContent = (
    section: typeof sections[0],
    sectionIndex: number
  ) => {
    const children = section.children || [];
    const layout = section.layout || { type: 'list' };
    const itemSpacing = layout.itemSpacing ?? 12;
    const lineSpacing = layout.lineSpacing ?? 12;
    const contentInsets = layout.contentInsets || {};
    const horizontalInset = contentInsets.leading ?? contentInsets.trailing ?? contentInsets.horizontal ?? 0;

    switch (layout.type) {
      case 'horizontal':
        return (
          <HorizontalScroll
            style={{
              paddingLeft: contentInsets.leading ?? contentInsets.horizontal ?? 0,
              paddingRight: contentInsets.trailing ?? contentInsets.horizontal ?? 0,
              scrollbarWidth: layout.showsIndicators === false ? 'none' : 'auto',
            }}
          >
            <HorizontalList
              style={{ gap: itemSpacing }}
            >
              {children.map((child, childIndex) => (
                <CanvasNode
                  key={childIndex}
                  node={child}
                  path={[...path, 'sections', sectionIndex, 'children', childIndex]}
                  {...props}
                />
              ))}
              {children.length === 0 && (
                <EmptyText>
                  Horizontal scroll items here
                </EmptyText>
              )}
            </HorizontalList>
          </HorizontalScroll>
        );

      case 'grid':
        const columns = layout.columns || 2;
        return (
          <GridContainer
            style={{
              gridTemplateColumns: `repeat(${columns}, 1fr)`,
              gap: `${lineSpacing}px ${itemSpacing}px`,
              paddingLeft: contentInsets.leading ?? contentInsets.horizontal ?? 0,
              paddingRight: contentInsets.trailing ?? contentInsets.horizontal ?? 0,
            }}
          >
            {children.map((child, childIndex) => (
              <CanvasNode
                key={childIndex}
                node={child}
                path={[...path, 'sections', sectionIndex, 'children', childIndex]}
                {...props}
              />
            ))}
            {children.length === 0 && (
              <GridEmptyText>
                Grid items here
              </GridEmptyText>
            )}
          </GridContainer>
        );

      case 'list':
      default:
        return (
          <ListContainer
            style={{
              paddingLeft: contentInsets.leading ?? contentInsets.horizontal ?? 0,
              paddingRight: contentInsets.trailing ?? contentInsets.horizontal ?? 0,
            }}
          >
            {children.map((child, childIndex) => (
              <React.Fragment key={childIndex}>
                <CanvasNode
                  node={child}
                  path={[...path, 'sections', sectionIndex, 'children', childIndex]}
                  {...props}
                />
                {layout.showsDividers && childIndex < children.length - 1 && (
                  <ListDivider />
                )}
              </React.Fragment>
            ))}
            {children.length === 0 && (
              <ListEmptyText>
                List items here
              </ListEmptyText>
            )}
          </ListContainer>
        );
    }
  };

  return (
    <SectionLayoutContainer
      style={{
        ...styleCss,
        gap: sectionSpacing,
        padding: styleCss.paddingTop ? undefined : '8px',
        minHeight: 100,
      }}
    >
      {/* Container label */}
      <ContainerLabel $color="rgba(249, 115, 22, 0.7)">
        SectionLayout
      </ContainerLabel>

      {sections.map((section, sectionIndex) => (
        <SectionWrapper key={section.id || sectionIndex}>
          {/* Render section header if present */}
          {section.header && (
            <SectionHeader>
              <CanvasNode
                node={section.header}
                path={[...path, 'sections', sectionIndex, 'header']}
                {...props}
              />
            </SectionHeader>
          )}

          {/* Render section content based on layout type */}
          {renderSectionContent(section, sectionIndex)}
        </SectionWrapper>
      ))}

      {sections.length === 0 && (
        <EmptyMessage $color="rgba(251, 146, 60, 0.6)">
          Add sections here
        </EmptyMessage>
      )}
    </SectionLayoutContainer>
  );
}

function LabelRenderer({ node, styleCss, resolvedStyle }: RendererProps) {
  const text = (node.text as string) || 'Label';
  // Direct properties on the node override style
  const fontSize = (node.fontSize as number) || resolvedStyle.fontSize || 14;
  const textColor = (node.textColor as string) || resolvedStyle.textColor;
  const backgroundColor = (node.backgroundColor as string) || resolvedStyle.backgroundColor;

  return (
    <LabelWrapper
      style={{
        ...styleCss,
        fontSize,
        color: textColor || 'inherit',
        backgroundColor: backgroundColor || 'transparent',
      }}
    >
      {text}
    </LabelWrapper>
  );
}

function ButtonRenderer({ node, styleCss, resolvedStyle }: RendererProps) {
  const text = (node.text as string) || 'Button';
  const backgroundColor = (node.backgroundColor as string) || resolvedStyle.backgroundColor;
  const textColor = (node.textColor as string) || resolvedStyle.textColor;
  const cornerRadius = (node.cornerRadius as number) || resolvedStyle.cornerRadius;

  return (
    <ButtonWrapper
      style={{
        ...styleCss,
        backgroundColor: backgroundColor || 'transparent',
        color: textColor || 'var(--accent-color)',
        borderRadius: cornerRadius ?? 6,
      }}
    >
      {text}
    </ButtonWrapper>
  );
}

function ImageRenderer({ node, styleCss, resolvedStyle }: RendererProps) {
  // Check if width/height are explicitly set (not undefined)
  const hasExplicitWidth = node.width !== undefined;
  const hasExplicitHeight = node.height !== undefined;
  const baseWidth = (node.width as number) ?? resolvedStyle.width ?? 100;
  const baseHeight = (node.height as number) ?? resolvedStyle.height ?? 100;
  const cornerRadius = (node.cornerRadius as number) || resolvedStyle.cornerRadius;
  const image = node.image as { type?: string; name?: string; url?: string; _previewUrl?: string } | undefined;
  const padding = node.padding as { top?: number; bottom?: number; leading?: number; trailing?: number } | undefined;

  // Layout properties
  const fillWidth = (node.fillWidth as boolean) || false;
  const pinnedEdges = (node._pinnedEdges as string[]) || [];
  const aspectRatioLocked = (node._aspectRatioLocked as boolean) || false;
  const contentMode = (node.contentMode as string) || 'aspectFill';

  const imageType = image?.type || 'asset';
  const imageName = image?.name || '';
  const imageUrl = image?.url || '';
  const previewUrl = image?._previewUrl || ''; // Local preview takes precedence

  // Check pinning state
  const isPinnedLeft = pinnedEdges.includes('left');
  const isPinnedRight = pinnedEdges.includes('right');
  const isPinnedTop = pinnedEdges.includes('top');
  const isPinnedBottom = pinnedEdges.includes('bottom');
  const isHorizontalPinned = isPinnedLeft && isPinnedRight;
  const isVerticalPinned = isPinnedTop && isPinnedBottom;

  // Calculate dimensions - when pinned, stretch to fill
  let width: number | string;
  let height: number | string;

  // Horizontal dimension
  if (isHorizontalPinned || fillWidth || !hasExplicitWidth) {
    // When horizontally pinned or no explicit width, stretch to fill
    if (isHorizontalPinned || fillWidth) {
      const leftPadding = padding?.leading ?? 0;
      const rightPadding = padding?.trailing ?? 0;
      width = leftPadding || rightPadding
        ? `calc(100% - ${leftPadding + rightPadding}px)`
        : '100%';
    } else {
      width = baseWidth; // Fallback to default
    }
  } else {
    width = baseWidth;
  }

  // Vertical dimension
  if (isVerticalPinned || !hasExplicitHeight) {
    // When vertically pinned or no explicit height, stretch to fill
    if (isVerticalPinned) {
      const topPadding = padding?.top ?? 0;
      const bottomPadding = padding?.bottom ?? 0;
      height = topPadding || bottomPadding
        ? `calc(100% - ${topPadding + bottomPadding}px)`
        : '100%';
    } else {
      height = baseHeight; // Fallback to default
    }
  } else {
    height = baseHeight;
  }

  // Calculate alignment based on pinned edges
  let alignSelf: string | undefined;
  let marginLeft: string | number | undefined;
  let marginRight: string | number | undefined;
  let marginTop: string | number | undefined;
  let marginBottom: string | number | undefined;

  // Horizontal alignment for single-edge pinning
  if (isPinnedLeft && !isPinnedRight) {
    alignSelf = 'flex-start';
    marginLeft = padding?.leading ?? 0;
  } else if (isPinnedRight && !isPinnedLeft) {
    alignSelf = 'flex-end';
    marginRight = padding?.trailing ?? 0;
  } else if (isHorizontalPinned) {
    // When both pinned, use margins for padding from edges
    marginLeft = padding?.leading ?? 0;
    marginRight = padding?.trailing ?? 0;
  }

  // Vertical margins when pinned
  if (isPinnedTop && !isPinnedBottom) {
    marginTop = padding?.top ?? 0;
  } else if (isPinnedBottom && !isPinnedTop) {
    marginBottom = padding?.bottom ?? 0;
  } else if (isVerticalPinned) {
    marginTop = padding?.top ?? 0;
    marginBottom = padding?.bottom ?? 0;
  }

  // Map contentMode to CSS object-fit
  const objectFitMap: Record<string, string> = {
    aspectFit: 'contain',
    aspectFill: 'cover',
    stretch: 'fill',
    center: 'none',
  };
  const objectFit = objectFitMap[contentMode] || 'cover';

  const renderContent = () => {
    // Use preview URL if available (local file for visualization)
    const displayUrl = previewUrl || imageUrl;

    if (imageType === 'url' && displayUrl) {
      return (
        <StyledImage
          src={displayUrl}
          alt={imageName || 'Image'}
          style={{ objectFit: objectFit as 'contain' | 'cover' | 'fill' | 'none' }}
          onError={(e) => {
            // Show placeholder on error
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      );
    }

    if (imageType === 'system' && imageName) {
      // Show SF Symbol name with icon placeholder
      return (
        <ImagePlaceholder>
          <span style={{ fontSize: '1.5rem' }}>&#x1F537;</span>
          <ImageLabel>
            {imageName}
          </ImageLabel>
        </ImagePlaceholder>
      );
    }

    if (imageType === 'asset' && imageName) {
      // Show asset name
      return (
        <ImagePlaceholder>
          <span style={{ fontSize: '1.5rem' }}>&#x1F5BC;&#xFE0F;</span>
          <ImageLabel>
            {imageName}
          </ImageLabel>
        </ImagePlaceholder>
      );
    }

    // Default placeholder
    return (
      <ImagePlaceholder $withColor>
        <span style={{ fontSize: '1.5rem' }}>&#x1F5BC;&#xFE0F;</span>
        <span style={{ fontSize: 10 }}>Image</span>
      </ImagePlaceholder>
    );
  };

  // Calculate aspect ratio for CSS
  const aspectRatio = aspectRatioLocked && baseWidth > 0 && baseHeight > 0
    ? baseWidth / baseHeight
    : undefined;

  return (
    <ImageContainer
      style={{
        ...styleCss,
        width,
        height: (isHorizontalPinned || fillWidth) && aspectRatio ? 'auto' : height,
        aspectRatio: (isHorizontalPinned || fillWidth) && aspectRatio ? `${aspectRatio}` : undefined,
        borderRadius: cornerRadius ?? 4,
        alignSelf,
        marginLeft,
        marginRight,
        marginTop,
        marginBottom,
      }}
    >
      {renderContent()}
    </ImageContainer>
  );
}

function TextFieldRenderer({ node, styleCss, resolvedStyle }: RendererProps) {
  const placeholder = (node.placeholder as string) || 'Enter text...';
  const backgroundColor = (node.backgroundColor as string) || resolvedStyle.backgroundColor;
  const cornerRadius = (node.cornerRadius as number) || resolvedStyle.cornerRadius;

  return (
    <TextFieldWrapper
      style={{
        ...styleCss,
        backgroundColor: backgroundColor || 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
        borderRadius: cornerRadius ?? 6,
        color: 'var(--text-tertiary)',
      }}
    >
      {placeholder}
    </TextFieldWrapper>
  );
}

function ToggleRenderer({ node, styleCss }: RendererProps) {
  const isOn = (node.value as boolean) || false;

  return (
    <ToggleTrack
      style={{
        ...styleCss,
        backgroundColor: isOn ? 'var(--accent-color)' : 'var(--bg-tertiary)',
      }}
    >
      <ToggleThumb
        style={{ transform: isOn ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </ToggleTrack>
  );
}

function SpacerRenderer({ node, styleCss }: RendererProps) {
  return (
    <SpacerBox
      style={{ ...styleCss, flex: 1 }}
    />
  );
}

function DividerRenderer({ node, styleCss }: RendererProps) {
  return (
    <DividerLine
      style={styleCss}
    />
  );
}

function DefaultRenderer({ node, styleCss }: RendererProps) {
  const nodeType = (node.type as string) || 'unknown';

  return (
    <DefaultBox
      style={styleCss}
    >
      {nodeType}
    </DefaultBox>
  );
}
