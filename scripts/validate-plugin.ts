#!/usr/bin/env npx ts-node

/**
 * Plugin Validator CLI
 * 
 * Validates plugin manifests and code for common issues.
 * Run: npm run validate-plugin plugins/my-plugin
 */

import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  type: 'error';
  message: string;
  suggestion?: string;
  location?: string;
}

interface ValidationWarning {
  type: 'warning';
  message: string;
  suggestion?: string;
  location?: string;
}

// ============================================================================
// Manifest Schema
// ============================================================================

const VALID_CAPABILITIES = [
  'document:read',
  'document:write',
  'selection:read',
  'selection:write',
  'ui:read',
  'ui:write',
  'events:emit',
  'events:subscribe',
  'extensions:define',
  'extensions:contribute',
  'services:provide',
  'services:consume',
  'storage:local',
] as const;

const VALID_SLOTS = [
  'header:left',
  'header:center',
  'header:right',
  'sidebar:left',
  'sidebar:right',
  'main:view',
  'panel:bottom',
  'toolbar:main',
  'context-menu',
] as const;

const manifestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'ID must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(50),
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver (e.g., 1.0.0)'),
  description: z.string().optional(),
  apiVersion: z.literal('1.0'),
  activation: z.enum(['eager', 'lazy']),
  activationEvents: z.array(z.string()).optional(),
  capabilities: z.array(z.enum(VALID_CAPABILITIES)),
  slots: z.array(z.object({
    slot: z.enum(VALID_SLOTS),
    component: z.any(),
    priority: z.number().optional(),
    when: z.string().optional(),
  })).optional(),
  extensionPoints: z.array(z.object({
    id: z.string().min(1),
    schema: z.any(),
    multiple: z.boolean().optional(),
  })).optional(),
  extensions: z.array(z.object({
    point: z.string().min(1),
    contribution: z.record(z.unknown()),
  })).optional(),
  provides: z.array(z.object({
    id: z.string().min(1),
    interface: z.string().min(1),
    implementation: z.any(),
  })).optional(),
  consumes: z.array(z.string()).optional(),
  emits: z.array(z.string()).optional(),
  subscribes: z.array(z.string()).optional(),
  requires: z.array(z.object({
    id: z.string().min(1),
    version: z.string().optional(),
    optional: z.boolean().optional(),
  })).optional(),
});

// ============================================================================
// Validation Functions
// ============================================================================

async function validatePlugin(pluginPath: string): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const absolutePath = path.resolve(pluginPath);

  // Check if path exists
  if (!fs.existsSync(absolutePath)) {
    errors.push({
      type: 'error',
      message: `Plugin path does not exist: ${absolutePath}`,
      suggestion: 'Verify the plugin path is correct',
    });
    return { valid: false, errors, warnings };
  }

  // Find index file
  const indexPath = findIndexFile(absolutePath);
  if (!indexPath) {
    errors.push({
      type: 'error',
      message: 'No index.ts or index.tsx file found',
      suggestion: 'Create an index.ts file that exports the plugin definition',
      location: absolutePath,
    });
    return { valid: false, errors, warnings };
  }

  // Read and parse manifest from file
  const content = fs.readFileSync(indexPath, 'utf-8');
  
  // Check for definePlugin usage
  if (!content.includes('definePlugin')) {
    warnings.push({
      type: 'warning',
      message: 'Plugin does not use definePlugin() helper',
      suggestion: 'Use definePlugin() for type-safe plugin definitions',
      location: indexPath,
    });
  }

  // Extract manifest from code (simplified parsing)
  const manifestMatch = content.match(/manifest:\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/s);
  if (!manifestMatch) {
    errors.push({
      type: 'error',
      message: 'Could not find manifest in plugin file',
      suggestion: 'Ensure your plugin exports a manifest object',
      location: indexPath,
    });
    return { valid: false, errors, warnings };
  }

  // Validate capabilities usage
  validateCapabilityUsage(content, errors, warnings, indexPath);

  // Validate event declarations
  validateEventDeclarations(content, errors, warnings, indexPath);

  // Check for forbidden imports
  validateImports(content, errors, warnings, indexPath);

  // Check for lazy activation
  validateActivation(content, warnings, indexPath);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function findIndexFile(dir: string): string | null {
  const candidates = ['index.ts', 'index.tsx', 'index.js'];
  for (const candidate of candidates) {
    const fullPath = path.join(dir, candidate);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }
  // If dir is a file, return it directly
  if (fs.statSync(dir).isFile()) {
    return dir;
  }
  return null;
}

function validateCapabilityUsage(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  location: string
): void {
  // Check for document write usage
  if (content.includes('actions.updateValue') || content.includes('setValue(')) {
    if (!content.includes("'document:write'") && !content.includes('"document:write"')) {
      errors.push({
        type: 'error',
        message: "Using document write operations but 'document:write' not in capabilities",
        suggestion: "Add 'document:write' to manifest.capabilities",
        location,
      });
    }
  }

  // Check for selection write usage
  if (content.includes('setSelectedPath') || content.includes('.select(')) {
    if (!content.includes("'selection:write'") && !content.includes('"selection:write"')) {
      errors.push({
        type: 'error',
        message: "Using selection write operations but 'selection:write' not in capabilities",
        suggestion: "Add 'selection:write' to manifest.capabilities",
        location,
      });
    }
  }

  // Check for event emit usage
  if (content.includes('.emit(') && !content.includes('emitCore')) {
    if (!content.includes("'events:emit'") && !content.includes('"events:emit"')) {
      errors.push({
        type: 'error',
        message: "Emitting events but 'events:emit' not in capabilities",
        suggestion: "Add 'events:emit' to manifest.capabilities",
        location,
      });
    }
  }

  // Check for unused capabilities
  const declaredCaps = content.match(/capabilities:\s*\[([^\]]+)\]/);
  if (declaredCaps) {
    const caps = declaredCaps[1];
    
    if (caps.includes("'events:emit'") || caps.includes('"events:emit"')) {
      if (!content.includes('.emit(')) {
        warnings.push({
          type: 'warning',
          message: "'events:emit' declared but no events emitted",
          suggestion: 'Remove unused capability or add event emission',
          location,
        });
      }
    }
  }
}

function validateEventDeclarations(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  location: string
): void {
  // Find emitted events
  const emitMatches = content.matchAll(/\.emit\s*\(\s*['"]([^'"]+)['"]/g);
  const emittedEvents = Array.from(emitMatches).map((m) => m[1]);

  // Find declared emits
  const emitsMatch = content.match(/emits:\s*\[([^\]]*)\]/);
  const declaredEmits: string[] = [];
  if (emitsMatch) {
    const matches = emitsMatch[1].matchAll(/['"]([^'"]+)['"]/g);
    declaredEmits.push(...Array.from(matches).map((m) => m[1]));
  }

  // Check for undeclared emits
  for (const event of emittedEvents) {
    if (!declaredEmits.includes(event) && !event.startsWith('document:') && !event.startsWith('selection:')) {
      warnings.push({
        type: 'warning',
        message: `Event '${event}' is emitted but not declared in manifest.emits`,
        suggestion: `Add '${event}' to manifest.emits array`,
        location,
      });
    }
  }
}

function validateImports(
  content: string,
  errors: ValidationError[],
  warnings: ValidationWarning[],
  location: string
): void {
  // Check for direct plugin imports
  const pluginImports = content.match(/from\s+['"]\.\.\/[^'"]*['"]/g);
  if (pluginImports) {
    for (const imp of pluginImports) {
      if (imp.includes('/plugins/') && !imp.includes('/core/')) {
        errors.push({
          type: 'error',
          message: `Direct import from another plugin: ${imp}`,
          suggestion: 'Use extension points or services instead of direct imports',
          location,
        });
      }
    }
  }

  // Check for global state access
  if (content.includes('window.') && !content.includes('window.localStorage') && !content.includes('window.matchMedia')) {
    warnings.push({
      type: 'warning',
      message: 'Accessing window global - may break plugin isolation',
      suggestion: 'Use plugin context or storage instead of global state',
      location,
    });
  }
}

function validateActivation(
  content: string,
  warnings: ValidationWarning[],
  location: string
): void {
  if (content.includes("activation: 'eager'") || content.includes('activation: "eager"')) {
    if (!content.includes('// eager required') && !content.includes('// core plugin')) {
      warnings.push({
        type: 'warning',
        message: "Plugin uses eager activation - consider 'lazy' for better startup performance",
        suggestion: "Change to activation: 'lazy' and add activationEvents",
        location,
      });
    }
  }
}

// ============================================================================
// Output Formatting
// ============================================================================

function printResult(result: ValidationResult, pluginPath: string): void {
  console.log(`\n📦 Validating plugin: ${pluginPath}\n`);

  if (result.errors.length === 0 && result.warnings.length === 0) {
    console.log('✅ Plugin validation passed!\n');
    return;
  }

  for (const error of result.errors) {
    console.log(`❌ Error: ${error.message}`);
    if (error.location) {
      console.log(`   Location: ${error.location}`);
    }
    if (error.suggestion) {
      console.log(`   💡 Suggested fix: ${error.suggestion}`);
    }
    console.log();
  }

  for (const warning of result.warnings) {
    console.log(`⚠️  Warning: ${warning.message}`);
    if (warning.location) {
      console.log(`   Location: ${warning.location}`);
    }
    if (warning.suggestion) {
      console.log(`   💡 Suggested fix: ${warning.suggestion}`);
    }
    console.log();
  }

  console.log(`\nSummary: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
  
  if (result.valid) {
    console.log('✅ Validation passed (with warnings)\n');
  } else {
    console.log('❌ Validation failed\n');
  }
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm run validate-plugin <plugin-path>');
    console.log('Example: npm run validate-plugin plugins/my-plugin');
    process.exit(1);
  }

  const pluginPath = args[0];
  const result = await validatePlugin(pluginPath);
  printResult(result, pluginPath);

  process.exit(result.valid ? 0 : 1);
}

main().catch(console.error);
