#!/usr/bin/env node
/**
 * Plugin Static Analysis Tool
 * 
 * Performs static analysis on plugin code to detect common mistakes
 * and anti-patterns that could cause issues at runtime.
 * 
 * Usage:
 *   npx ts-node scripts/analyze-plugin.ts <plugin-path>
 * 
 * Examples:
 *   npx ts-node scripts/analyze-plugin.ts src/plugins/my-plugin
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TYPES
// ============================================================================

interface AnalysisResult {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  rule: string;
  message: string;
  suggestion?: string;
}

interface AnalysisReport {
  pluginPath: string;
  results: AnalysisResult[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

// ============================================================================
// ANALYSIS RULES
// ============================================================================

const rules: Array<{
  id: string;
  name: string;
  severity: 'error' | 'warning' | 'info';
  pattern: RegExp;
  message: string;
  suggestion?: string;
  fileFilter?: (filename: string) => boolean;
}> = [
  // Direct store imports (should use plugin API)
  {
    id: 'no-direct-store-import',
    name: 'Direct Store Import',
    severity: 'warning',
    pattern: /import\s+.*from\s+['"].*\/store\/editorStore['"]/,
    message: 'Direct store imports bypass the plugin system. Use plugin API hooks instead.',
    suggestion: 'Replace with usePluginAPI() or usePluginContext() hooks',
  },
  
  // Global state mutations
  {
    id: 'no-global-state',
    name: 'Global State Mutation',
    severity: 'error',
    pattern: /\b(window|globalThis)\s*\.\s*\w+\s*=/,
    message: 'Global state mutations can cause conflicts between plugins.',
    suggestion: 'Use the plugin context or service registry for shared state',
  },
  
  // Direct plugin imports
  {
    id: 'no-cross-plugin-import',
    name: 'Cross-Plugin Import',
    severity: 'error',
    pattern: /import\s+.*from\s+['"]\.\.\/(?!core|components|types|utils)[^'"]+['"]/,
    message: 'Direct imports between plugins create tight coupling.',
    suggestion: 'Use extension points or services for plugin communication',
    fileFilter: (f) => f.includes('/plugins/'),
  },
  
  // Missing capability check
  {
    id: 'check-capability-before-use',
    name: 'Unchecked Capability Use',
    severity: 'warning',
    pattern: /ctx\.(actions|events|extensions|services)\?\./,
    message: 'Using optional chaining without capability check may silently fail.',
    suggestion: 'Add explicit hasCapability() check with user feedback',
  },
  
  // Undeclared event emission
  {
    id: 'declare-emitted-events',
    name: 'Event Emission Check',
    severity: 'info',
    pattern: /\.emit\?\?\s*\(['"]([^'"]+)['"]/,
    message: 'Ensure this event is declared in manifest.emits',
    suggestion: 'Add event type to manifest emits array',
  },
  
  // Console.log usage (should use context.log)
  {
    id: 'use-context-logger',
    name: 'Console Log Usage',
    severity: 'info',
    pattern: /console\.(log|debug|info|warn|error)\s*\(/,
    message: 'Console methods bypass plugin attribution.',
    suggestion: 'Use context.log or api.log for attributed logging',
  },
  
  // Missing cleanup in useEffect
  {
    id: 'cleanup-subscriptions',
    name: 'Missing Cleanup',
    severity: 'warning',
    pattern: /useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*\.subscribe\s*\([^)]*\)[^}]*\}\s*,/,
    message: 'Event subscription in useEffect may not be cleaned up.',
    suggestion: 'Return unsubscribe function from useEffect',
  },
  
  // Hardcoded slot names
  {
    id: 'typed-slot-names',
    name: 'Hardcoded Slot Name',
    severity: 'info',
    pattern: /slot:\s*['"][^'"]+['"]/,
    message: 'Hardcoded slot names reduce type safety.',
    suggestion: 'Consider using UISlot type constants',
    fileFilter: (f) => f.includes('manifest'),
  },
  
  // Missing error boundary in components
  {
    id: 'component-error-handling',
    name: 'Missing Error Handling',
    severity: 'info',
    pattern: /export\s+(function|const)\s+\w+Panel/,
    message: 'Panel components should handle errors gracefully.',
    suggestion: 'Add try-catch or error boundary around rendering logic',
    fileFilter: (f) => f.endsWith('.tsx'),
  },
  
  // Sync operations that could be async
  {
    id: 'prefer-async-operations',
    name: 'Blocking Operation',
    severity: 'warning',
    pattern: /JSON\.parse\s*\(\s*\w+\s*\)/,
    message: 'Large JSON parsing may block the main thread.',
    suggestion: 'Consider using async parsing for large documents',
  },
  
  // Missing TypeScript types
  {
    id: 'explicit-types',
    name: 'Implicit Any',
    severity: 'info',
    pattern: /:\s*any\b/,
    message: 'Explicit any type reduces type safety.',
    suggestion: 'Define proper TypeScript interfaces',
  },
  
  // Duplicate capability declarations
  {
    id: 'unique-capabilities',
    name: 'Duplicate Capability',
    severity: 'warning',
    pattern: /capabilities:\s*\[[^\]]*(['"][^'"]+['"])[^\]]*\1/,
    message: 'Duplicate capability declaration.',
    suggestion: 'Remove duplicate capability from array',
    fileFilter: (f) => f.includes('manifest'),
  },
];

// ============================================================================
// ANALYSIS ENGINE
// ============================================================================

function analyzeFile(filePath: string, content: string): AnalysisResult[] {
  const results: AnalysisResult[] = [];
  const lines = content.split('\n');
  const filename = path.basename(filePath);
  
  for (const rule of rules) {
    // Check if rule applies to this file
    if (rule.fileFilter && !rule.fileFilter(filePath)) {
      continue;
    }
    
    // Check each line
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      const match = line.match(rule.pattern);
      
      if (match) {
        results.push({
          file: filePath,
          line: lineNum + 1,
          column: (match.index || 0) + 1,
          severity: rule.severity,
          rule: rule.id,
          message: rule.message,
          suggestion: rule.suggestion,
        });
      }
    }
    
    // Also check multi-line patterns on full content
    const fullMatch = content.match(rule.pattern);
    if (fullMatch && !results.some(r => r.rule === rule.id && r.file === filePath)) {
      // Find line number for full content match
      const matchIndex = fullMatch.index || 0;
      const beforeMatch = content.substring(0, matchIndex);
      const lineNum = beforeMatch.split('\n').length;
      
      results.push({
        file: filePath,
        line: lineNum,
        column: 1,
        severity: rule.severity,
        rule: rule.id,
        message: rule.message,
        suggestion: rule.suggestion,
      });
    }
  }
  
  return results;
}

function analyzePlugin(pluginPath: string): AnalysisReport {
  const results: AnalysisResult[] = [];
  
  // Recursively find all TypeScript files
  function findFiles(dir: string): string[] {
    const files: string[] = [];
    
    if (!fs.existsSync(dir)) {
      return files;
    }
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        files.push(...findFiles(fullPath));
      } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  const files = findFiles(pluginPath);
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const fileResults = analyzeFile(file, content);
      results.push(...fileResults);
    } catch (error) {
      console.error(`Error reading file ${file}:`, error);
    }
  }
  
  // Calculate summary
  const summary = {
    errors: results.filter(r => r.severity === 'error').length,
    warnings: results.filter(r => r.severity === 'warning').length,
    info: results.filter(r => r.severity === 'info').length,
  };
  
  return {
    pluginPath,
    results,
    summary,
  };
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

function formatResult(result: AnalysisResult, cwd: string): string {
  const relPath = path.relative(cwd, result.file);
  const icon = result.severity === 'error' ? '❌' : result.severity === 'warning' ? '⚠️' : 'ℹ️';
  
  let output = `${icon} ${relPath}:${result.line}:${result.column}\n`;
  output += `   ${result.message}\n`;
  output += `   Rule: ${result.rule}\n`;
  
  if (result.suggestion) {
    output += `   💡 ${result.suggestion}\n`;
  }
  
  return output;
}

function formatReport(report: AnalysisReport): string {
  const cwd = process.cwd();
  let output = '';
  
  output += `\n📊 Static Analysis Report\n`;
  output += `${'─'.repeat(50)}\n`;
  output += `Plugin: ${report.pluginPath}\n\n`;
  
  if (report.results.length === 0) {
    output += '✅ No issues found!\n';
  } else {
    // Group by severity
    const errors = report.results.filter(r => r.severity === 'error');
    const warnings = report.results.filter(r => r.severity === 'warning');
    const info = report.results.filter(r => r.severity === 'info');
    
    if (errors.length > 0) {
      output += `\n🔴 Errors (${errors.length})\n`;
      output += `${'─'.repeat(30)}\n`;
      errors.forEach(r => { output += formatResult(r, cwd) + '\n'; });
    }
    
    if (warnings.length > 0) {
      output += `\n🟡 Warnings (${warnings.length})\n`;
      output += `${'─'.repeat(30)}\n`;
      warnings.forEach(r => { output += formatResult(r, cwd) + '\n'; });
    }
    
    if (info.length > 0) {
      output += `\n🔵 Info (${info.length})\n`;
      output += `${'─'.repeat(30)}\n`;
      info.forEach(r => { output += formatResult(r, cwd) + '\n'; });
    }
  }
  
  output += `\n${'─'.repeat(50)}\n`;
  output += `Summary: ${report.summary.errors} errors, ${report.summary.warnings} warnings, ${report.summary.info} info\n`;
  
  return output;
}

// ============================================================================
// CLI
// ============================================================================

function main(): void {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Plugin Static Analysis Tool

Usage:
  npx ts-node scripts/analyze-plugin.ts <plugin-path>

Options:
  --help, -h      Show this help message
  --json          Output results as JSON
  --strict        Fail on any warnings (not just errors)

Examples:
  npx ts-node scripts/analyze-plugin.ts src/plugins/my-plugin
  npx ts-node scripts/analyze-plugin.ts src/plugins/tree-view --strict
`);
    process.exit(0);
  }
  
  const pluginPath = path.resolve(process.cwd(), args[0]);
  const jsonOutput = args.includes('--json');
  const strict = args.includes('--strict');
  
  if (!fs.existsSync(pluginPath)) {
    console.error(`Error: Plugin path not found: ${pluginPath}`);
    process.exit(1);
  }
  
  console.log('🔍 Analyzing plugin...\n');
  
  const report = analyzePlugin(pluginPath);
  
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report));
  }
  
  // Exit with error code if issues found
  if (report.summary.errors > 0) {
    process.exit(1);
  }
  
  if (strict && report.summary.warnings > 0) {
    console.log('\n⚠️ Failing due to --strict mode');
    process.exit(1);
  }
  
  process.exit(0);
}

main();
