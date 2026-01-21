#!/usr/bin/env node
/**
 * Plugin Documentation Auto-Generator
 * 
 * Generates documentation for plugins based on their manifests and code.
 * 
 * Usage:
 *   npx ts-node scripts/generate-plugin-docs.ts [plugin-path] [--output=<dir>]
 * 
 * Examples:
 *   npx ts-node scripts/generate-plugin-docs.ts                    # All plugins
 *   npx ts-node scripts/generate-plugin-docs.ts src/plugins/preview
 *   npx ts-node scripts/generate-plugin-docs.ts --output=docs/plugins
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface ManifestInfo {
  id: string;
  version: string;
  name: string;
  description: string;
  capabilities: string[];
  activationEvents: string[];
  slots?: Array<{ slot: string; component: string; priority?: number }>;
  extensionPoints?: Array<{ id: string; description: string; schema: unknown }>;
  extensions?: Array<{ point: string; id: string; contribution: unknown }>;
  provides?: Array<{ id: string; description: string }>;
  consumes?: string[];
  emits?: string[];
  dependencies?: Array<{ id: string; version?: string; optional?: boolean }>;
}

interface PluginDoc {
  manifest: ManifestInfo;
  sourcePath: string;
  components: string[];
  hasTests: boolean;
  readme?: string;
}

// ============================================================================
// MANIFEST EXTRACTION
// ============================================================================

function extractManifestFromFile(filePath: string): ManifestInfo | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Simple extraction - looks for manifest object
    const manifestMatch = content.match(/export\s+const\s+manifest\s*:\s*PluginManifest\s*=\s*(\{[\s\S]*?\});/);
    if (!manifestMatch) return null;
    
    // Parse the manifest (simplified - in production use AST)
    const manifestStr = manifestMatch[1];
    
    // Extract fields with regex (simplified approach)
    const extractField = (name: string): string | undefined => {
      const match = manifestStr.match(new RegExp(`${name}:\\s*['"]([^'"]+)['"]`));
      return match?.[1];
    };
    
    const extractArray = (name: string): string[] => {
      const match = manifestStr.match(new RegExp(`${name}:\\s*\\[([^\\]]+)\\]`));
      if (!match) return [];
      return match[1].split(',')
        .map(s => s.trim().replace(/['"]/g, ''))
        .filter(Boolean);
    };
    
    return {
      id: extractField('id') || 'unknown',
      version: extractField('version') || '0.0.0',
      name: extractField('name') || 'Unknown Plugin',
      description: extractField('description') || '',
      capabilities: extractArray('capabilities'),
      activationEvents: extractArray('activationEvents'),
      emits: extractArray('emits'),
      consumes: extractArray('consumes'),
    };
  } catch (error) {
    console.error(`Error reading manifest from ${filePath}:`, error);
    return null;
  }
}

function findPlugins(baseDir: string): PluginDoc[] {
  const plugins: PluginDoc[] = [];
  const pluginsDir = path.join(baseDir, 'src', 'plugins');
  
  if (!fs.existsSync(pluginsDir)) {
    return plugins;
  }
  
  const entries = fs.readdirSync(pluginsDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'templates') continue; // Skip templates
    
    const pluginDir = path.join(pluginsDir, entry.name);
    const manifestPath = path.join(pluginDir, 'manifest.ts');
    
    if (!fs.existsSync(manifestPath)) continue;
    
    const manifest = extractManifestFromFile(manifestPath);
    if (!manifest) continue;
    
    // Find components
    const componentsDir = path.join(pluginDir, 'components');
    let components: string[] = [];
    if (fs.existsSync(componentsDir)) {
      components = fs.readdirSync(componentsDir)
        .filter(f => f.endsWith('.tsx'))
        .map(f => f.replace('.tsx', ''));
    }
    
    // Check for tests
    const hasTests = fs.existsSync(path.join(pluginDir, '__tests__')) ||
                     fs.existsSync(path.join(pluginDir, 'tests'));
    
    // Check for README
    const readmePath = path.join(pluginDir, 'README.md');
    const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf-8') : undefined;
    
    plugins.push({
      manifest,
      sourcePath: pluginDir,
      components,
      hasTests,
      readme,
    });
  }
  
  return plugins;
}

// ============================================================================
// DOCUMENTATION GENERATION
// ============================================================================

function generatePluginDoc(plugin: PluginDoc): string {
  const { manifest } = plugin;
  
  let doc = `# ${manifest.name}\n\n`;
  doc += `> ${manifest.description}\n\n`;
  
  // Metadata table
  doc += `## Overview\n\n`;
  doc += `| Property | Value |\n`;
  doc += `|----------|-------|\n`;
  doc += `| ID | \`${manifest.id}\` |\n`;
  doc += `| Version | ${manifest.version} |\n`;
  doc += `| Activation | ${manifest.activationEvents.map(e => `\`${e}\``).join(', ') || 'None'} |\n`;
  doc += `\n`;
  
  // Capabilities
  if (manifest.capabilities.length > 0) {
    doc += `## Capabilities\n\n`;
    doc += `This plugin requires the following capabilities:\n\n`;
    manifest.capabilities.forEach(cap => {
      doc += `- \`${cap}\`\n`;
    });
    doc += `\n`;
  }
  
  // UI Slots
  if (manifest.slots && manifest.slots.length > 0) {
    doc += `## UI Slots\n\n`;
    doc += `| Slot | Component | Priority |\n`;
    doc += `|------|-----------|----------|\n`;
    manifest.slots.forEach(slot => {
      doc += `| \`${slot.slot}\` | ${slot.component} | ${slot.priority ?? 0} |\n`;
    });
    doc += `\n`;
  }
  
  // Extension Points
  if (manifest.extensionPoints && manifest.extensionPoints.length > 0) {
    doc += `## Extension Points\n\n`;
    doc += `This plugin defines the following extension points:\n\n`;
    manifest.extensionPoints.forEach(ep => {
      doc += `### \`${ep.id}\`\n\n`;
      doc += `${ep.description}\n\n`;
      if (ep.schema) {
        doc += `**Schema:**\n`;
        doc += `\`\`\`json\n${JSON.stringify(ep.schema, null, 2)}\n\`\`\`\n\n`;
      }
    });
  }
  
  // Extensions
  if (manifest.extensions && manifest.extensions.length > 0) {
    doc += `## Extensions\n\n`;
    doc += `This plugin contributes to the following extension points:\n\n`;
    manifest.extensions.forEach(ext => {
      doc += `- \`${ext.point}\` → \`${ext.id}\`\n`;
    });
    doc += `\n`;
  }
  
  // Services Provided
  if (manifest.provides && manifest.provides.length > 0) {
    doc += `## Services Provided\n\n`;
    manifest.provides.forEach(svc => {
      doc += `### \`${svc.id}\`\n\n`;
      doc += `${svc.description}\n\n`;
    });
  }
  
  // Services Consumed
  if (manifest.consumes && manifest.consumes.length > 0) {
    doc += `## Services Consumed\n\n`;
    manifest.consumes.forEach(svc => {
      doc += `- \`${svc}\`\n`;
    });
    doc += `\n`;
  }
  
  // Events
  if (manifest.emits && manifest.emits.length > 0) {
    doc += `## Events Emitted\n\n`;
    manifest.emits.forEach(evt => {
      doc += `- \`${evt}\`\n`;
    });
    doc += `\n`;
  }
  
  // Components
  if (plugin.components.length > 0) {
    doc += `## Components\n\n`;
    plugin.components.forEach(comp => {
      doc += `- \`${comp}\`\n`;
    });
    doc += `\n`;
  }
  
  // Source
  doc += `## Source\n\n`;
  doc += `- Path: \`${path.relative(process.cwd(), plugin.sourcePath)}\`\n`;
  doc += `- Tests: ${plugin.hasTests ? '✅ Yes' : '❌ No'}\n`;
  doc += `\n`;
  
  return doc;
}

function generateIndex(plugins: PluginDoc[]): string {
  let doc = `# Plugin Documentation\n\n`;
  doc += `Auto-generated documentation for all plugins.\n\n`;
  
  doc += `## Available Plugins\n\n`;
  doc += `| Plugin | Description | Capabilities |\n`;
  doc += `|--------|-------------|---------------|\n`;
  
  plugins.forEach(plugin => {
    const caps = plugin.manifest.capabilities.slice(0, 3).map(c => `\`${c}\``).join(', ');
    const more = plugin.manifest.capabilities.length > 3 ? ` +${plugin.manifest.capabilities.length - 3}` : '';
    doc += `| [${plugin.manifest.name}](./${plugin.manifest.id}.md) | ${plugin.manifest.description} | ${caps}${more} |\n`;
  });
  
  doc += `\n## Quick Links\n\n`;
  plugins.forEach(plugin => {
    doc += `- [${plugin.manifest.name}](./${plugin.manifest.id}.md)\n`;
  });
  
  doc += `\n---\n\n`;
  doc += `*Generated on ${new Date().toISOString()}*\n`;
  
  return doc;
}

// ============================================================================
// CLI
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Plugin Documentation Generator

Usage:
  npx ts-node scripts/generate-plugin-docs.ts [plugin-path] [--output=<dir>]

Options:
  --output=<dir>  Output directory (default: docs/plugins)
  --help, -h      Show this help

Examples:
  npx ts-node scripts/generate-plugin-docs.ts
  npx ts-node scripts/generate-plugin-docs.ts src/plugins/preview
  npx ts-node scripts/generate-plugin-docs.ts --output=docs/plugins
`);
    process.exit(0);
  }
  
  const cwd = process.cwd();
  let outputDir = path.join(cwd, 'docs', 'plugins');
  let specificPlugin: string | null = null;
  
  // Parse args
  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      outputDir = path.resolve(cwd, arg.split('=')[1]);
    } else if (!arg.startsWith('--')) {
      specificPlugin = path.resolve(cwd, arg);
    }
  }
  
  console.log('📚 Plugin Documentation Generator\n');
  
  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true });
  
  // Find plugins
  const plugins = findPlugins(cwd);
  
  if (plugins.length === 0) {
    console.log('No plugins found.');
    process.exit(0);
  }
  
  // Filter if specific plugin requested
  let targetPlugins = plugins;
  if (specificPlugin) {
    targetPlugins = plugins.filter(p => p.sourcePath.includes(specificPlugin));
    if (targetPlugins.length === 0) {
      console.error(`Plugin not found: ${specificPlugin}`);
      process.exit(1);
    }
  }
  
  // Generate docs
  for (const plugin of targetPlugins) {
    const doc = generatePluginDoc(plugin);
    const outputPath = path.join(outputDir, `${plugin.manifest.id}.md`);
    fs.writeFileSync(outputPath, doc, 'utf-8');
    console.log(`  ✅ Generated: ${plugin.manifest.id}.md`);
  }
  
  // Generate index
  const index = generateIndex(plugins);
  const indexPath = path.join(outputDir, 'README.md');
  fs.writeFileSync(indexPath, index, 'utf-8');
  console.log(`  ✅ Generated: README.md`);
  
  console.log(`\n📁 Output: ${outputDir}`);
  console.log(`📄 Generated ${targetPlugins.length} plugin docs + index`);
}

main();
