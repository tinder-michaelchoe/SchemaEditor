import React, { useRef, useEffect, useCallback } from 'react';
import { pathToString } from '@/utils/pathUtils';
import { useEditorStore } from '@/store/editorStore';

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
  const css: React.CSSProperties = {};
  
  if (style.fontSize) css.fontSize = style.fontSize;
  if (style.fontFamily) css.fontFamily = style.fontFamily;
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
    css.fontWeight = weightMap[style.fontWeight] || 400;
  }
  if (style.textColor) css.color = style.textColor;
  if (style.textAlignment) {
    const alignMap: Record<string, 'left' | 'center' | 'right'> = {
      leading: 'left',
      center: 'center',
      trailing: 'right',
    };
    css.textAlign = alignMap[style.textAlignment] || 'left';
  }
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor;
  if (style.cornerRadius) css.borderRadius = style.cornerRadius;
  if (style.borderWidth) css.borderWidth = style.borderWidth;
  if (style.borderColor) {
    css.borderColor = style.borderColor;
    css.borderStyle = 'solid';
  }
  if (style.width) css.width = style.width;
  if (style.height) css.height = style.height;
  
  if (style.padding) {
    const p = style.padding;
    css.paddingTop = p.top ?? p.vertical ?? 0;
    css.paddingBottom = p.bottom ?? p.vertical ?? 0;
    css.paddingLeft = p.leading ?? p.horizontal ?? 0;
    css.paddingRight = p.trailing ?? p.horizontal ?? 0;
  }
  
  return css;
}

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
  
  // Get styles from document
  const data = useEditorStore((state) => state.data);
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
    zoom,
  };

  // Don't render if hidden
  if (!isVisible) {
    return null;
  }

  // Spacer needs to pass flex: 1 to its wrapper
  const wrapperStyle: React.CSSProperties = nodeType === 'spacer' ? { flex: 1 } : {};

  return (
    <div
      ref={nodeRef}
      data-path={pathStr}
      data-type={nodeType}
      onClick={isLocked ? undefined : handleClick}
      onDoubleClick={isLocked ? undefined : handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={wrapperStyle}
      className={`
        relative transition-all duration-150 rounded
        ${isEditing ? 'outline outline-2 outline-dashed outline-[var(--accent-color)]/50' : ''}
        ${isLocked ? 'pointer-events-none opacity-75' : ''}
      `}
    >
      {renderContent()}
      {/* Lock indicator overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-gray-500/10 flex items-center justify-center pointer-events-none">
          <div className="absolute top-1 right-1 bg-orange-500 text-white text-[10px] px-1 rounded">
            Locked
          </div>
        </div>
      )}
    </div>
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
  zoom: number;
}

function VStackRenderer({ node, path, styleCss, ...props }: ContainerRendererProps) {
  const children = (node.children as Record<string, unknown>[]) || [];
  const spacing = (node.spacing as number) || 8;
  const padding = node.padding as Record<string, number> | undefined;

  return (
    <div
      className="relative flex flex-col rounded border-2 border-dashed border-blue-400/50 bg-blue-50/10"
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
      <div className="absolute -top-5 left-1 text-[10px] font-medium text-blue-500/70 pointer-events-none">
        VStack
      </div>
      {children.map((child, index) => (
        <CanvasNode
          key={index}
          node={child}
          path={[...path, 'children', index]}
          {...props}
        />
      ))}
      {children.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-blue-400/60 text-xs py-4">
          Drop components here
        </div>
      )}
    </div>
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
    <div
      className="relative flex flex-row rounded border-2 border-dashed border-green-400/50 bg-green-50/10"
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
      <div className="absolute -top-5 left-1 text-[10px] font-medium text-green-500/70 pointer-events-none">
        HStack
      </div>
      {children.map((child, index) => (
        <CanvasNode
          key={index}
          node={child}
          path={[...path, 'children', index]}
          {...props}
        />
      ))}
      {children.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-green-400/60 text-xs py-4">
          Drop components here
        </div>
      )}
    </div>
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
    <div
      className="relative rounded border-2 border-dashed border-purple-400/50 bg-purple-50/10"
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
      <div className="absolute -top-5 left-1 text-[10px] font-medium text-purple-500/70 pointer-events-none z-10">
        ZStack
      </div>
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
        <div className="flex items-center justify-center text-purple-400/60 text-xs py-4">
          Drop components here
        </div>
      )}
    </div>
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
          <div
            className="overflow-x-auto"
            style={{
              paddingLeft: contentInsets.leading ?? contentInsets.horizontal ?? 0,
              paddingRight: contentInsets.trailing ?? contentInsets.horizontal ?? 0,
              scrollbarWidth: layout.showsIndicators === false ? 'none' : 'auto',
            }}
          >
            <div
              className="flex flex-row"
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
                <div className="text-gray-400 text-xs py-4 px-4">
                  Horizontal scroll items here
                </div>
              )}
            </div>
          </div>
        );

      case 'grid':
        const columns = layout.columns || 2;
        return (
          <div
            className="grid"
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
              <div className="text-gray-400 text-xs py-4 col-span-full">
                Grid items here
              </div>
            )}
          </div>
        );

      case 'list':
      default:
        return (
          <div
            className="flex flex-col"
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
                  <div className="h-px bg-[var(--border-color)] my-0" />
                )}
              </React.Fragment>
            ))}
            {children.length === 0 && (
              <div className="text-gray-400 text-xs py-4">
                List items here
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className="relative flex flex-col rounded border-2 border-dashed border-orange-400/50 bg-orange-50/10"
      style={{
        ...styleCss,
        gap: sectionSpacing,
        padding: styleCss.paddingTop ? undefined : '8px',
        minHeight: 100,
      }}
    >
      {/* Container label */}
      <div className="absolute -top-5 left-1 text-[10px] font-medium text-orange-500/70 pointer-events-none">
        SectionLayout
      </div>

      {sections.map((section, sectionIndex) => (
        <div key={section.id || sectionIndex} className="flex flex-col">
          {/* Render section header if present */}
          {section.header && (
            <div className="mb-2">
              <CanvasNode
                node={section.header}
                path={[...path, 'sections', sectionIndex, 'header']}
                {...props}
              />
            </div>
          )}

          {/* Render section content based on layout type */}
          {renderSectionContent(section, sectionIndex)}
        </div>
      ))}

      {sections.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-orange-400/60 text-xs py-4">
          Add sections here
        </div>
      )}
    </div>
  );
}

function LabelRenderer({ node, styleCss, resolvedStyle }: RendererProps) {
  const text = (node.text as string) || 'Label';
  // Direct properties on the node override style
  const fontSize = (node.fontSize as number) || resolvedStyle.fontSize || 14;
  const textColor = (node.textColor as string) || resolvedStyle.textColor;
  const backgroundColor = (node.backgroundColor as string) || resolvedStyle.backgroundColor;

  return (
    <div
      className="px-2 py-1"
      style={{ 
        ...styleCss,
        fontSize,
        color: textColor || 'inherit',
        backgroundColor: backgroundColor || 'transparent',
      }}
    >
      {text}
    </div>
  );
}

function ButtonRenderer({ node, styleCss, resolvedStyle }: RendererProps) {
  const text = (node.text as string) || 'Button';
  const backgroundColor = (node.backgroundColor as string) || resolvedStyle.backgroundColor;
  const textColor = (node.textColor as string) || resolvedStyle.textColor;
  const cornerRadius = (node.cornerRadius as number) || resolvedStyle.cornerRadius;

  return (
    <div
      className="px-4 py-2 text-sm font-medium text-center"
      style={{
        ...styleCss,
        backgroundColor: backgroundColor || 'transparent',
        color: textColor || 'var(--accent-color)',
        borderRadius: cornerRadius ?? 6,
      }}
    >
      {text}
    </div>
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
        <img 
          src={displayUrl} 
          alt={imageName || 'Image'} 
          className="w-full h-full"
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
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
          <span className="text-2xl">🔷</span>
          <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-full px-1">
            {imageName}
          </span>
        </div>
      );
    }
    
    if (imageType === 'asset' && imageName) {
      // Show asset name
      return (
        <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
          <span className="text-2xl">🖼️</span>
          <span className="text-[10px] text-[var(--text-tertiary)] truncate max-w-full px-1">
            {imageName}
          </span>
        </div>
      );
    }
    
    // Default placeholder
    return (
      <div className="flex flex-col items-center justify-center gap-1 w-full h-full text-[var(--text-tertiary)]">
        <span className="text-2xl">🖼️</span>
        <span className="text-[10px]">Image</span>
      </div>
    );
  };

  // Calculate aspect ratio for CSS
  const aspectRatio = aspectRatioLocked && baseWidth > 0 && baseHeight > 0
    ? baseWidth / baseHeight
    : undefined;

  return (
    <div
      className="bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden border border-dashed border-[var(--border-color)]"
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
    </div>
  );
}

function TextFieldRenderer({ node, styleCss, resolvedStyle }: RendererProps) {
  const placeholder = (node.placeholder as string) || 'Enter text...';
  const backgroundColor = (node.backgroundColor as string) || resolvedStyle.backgroundColor;
  const cornerRadius = (node.cornerRadius as number) || resolvedStyle.cornerRadius;

  return (
    <div
      className="px-3 py-2 border text-sm"
      style={{
        ...styleCss,
        backgroundColor: backgroundColor || 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
        borderRadius: cornerRadius ?? 6,
        color: 'var(--text-tertiary)',
      }}
    >
      {placeholder}
    </div>
  );
}

function ToggleRenderer({ node, styleCss }: RendererProps) {
  const isOn = (node.value as boolean) || false;

  return (
    <div 
      className="w-12 h-7 rounded-full transition-colors flex items-center px-1"
      style={{
        ...styleCss,
        backgroundColor: isOn ? 'var(--accent-color)' : 'var(--bg-tertiary)',
      }}
    >
      <div 
        className="w-5 h-5 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: isOn ? 'translateX(20px)' : 'translateX(0)' }}
      />
    </div>
  );
}

function SpacerRenderer({ node, styleCss }: RendererProps) {
  return (
    <div
      className="min-h-[20px] min-w-[20px] bg-[var(--bg-tertiary)]/30 rounded border border-dashed border-[var(--border-color)]"
      style={{ ...styleCss, flex: 1 }}
    />
  );
}

function DividerRenderer({ node, styleCss }: RendererProps) {
  return (
    <div 
      className="h-px w-full bg-[var(--border-color)]" 
      style={styleCss}
    />
  );
}

function DefaultRenderer({ node, styleCss }: RendererProps) {
  const nodeType = (node.type as string) || 'unknown';

  return (
    <div 
      className="px-3 py-2 bg-[var(--bg-tertiary)] rounded text-sm text-[var(--text-secondary)]"
      style={styleCss}
    >
      {nodeType}
    </div>
  );
}
