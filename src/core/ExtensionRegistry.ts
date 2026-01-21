/**
 * Extension Point Registry
 * 
 * Manages extension points for plugin-to-plugin extensibility.
 * Plugins can define extension points (contracts) that other plugins
 * can contribute to.
 */

import type {
  ExtensionPointDeclaration,
  ExtensionContribution,
} from './types/plugin';
import type {
  RegisteredExtensionPoint,
  RegisteredContribution,
  ExtensionValidationResult,
} from './types/extensions';
import { validateContribution } from './types/extensions';

// ============================================================================
// Extension Registry Class
// ============================================================================

export class ExtensionRegistry {
  private extensionPoints = new Map<string, RegisteredExtensionPoint>();
  private pendingContributions = new Map<string, Array<{
    pluginId: string;
    contribution: ExtensionContribution;
  }>>();

  /**
   * Define a new extension point
   * @param pluginId - The plugin defining this extension point
   * @param declaration - The extension point declaration
   */
  defineExtensionPoint(
    pluginId: string,
    declaration: ExtensionPointDeclaration
  ): void {
    // Create full ID
    const fullId = `${pluginId}.${declaration.id}`;

    // Check for duplicates
    if (this.extensionPoints.has(fullId)) {
      throw new Error(`Extension point ${fullId} is already defined`);
    }

    // Register the extension point
    const registered: RegisteredExtensionPoint = {
      id: fullId,
      pluginId,
      declaration,
      contributions: [],
    };

    this.extensionPoints.set(fullId, registered);

    // Process any pending contributions
    const pending = this.pendingContributions.get(fullId);
    if (pending) {
      for (const { pluginId: contributorId, contribution } of pending) {
        this.contributeExtension(contributorId, contribution);
      }
      this.pendingContributions.delete(fullId);
    }
  }

  /**
   * Contribute to an extension point
   * @param pluginId - The plugin making this contribution
   * @param contribution - The contribution
   */
  contributeExtension(
    pluginId: string,
    contribution: ExtensionContribution
  ): ExtensionValidationResult {
    const point = this.extensionPoints.get(contribution.point);

    // If extension point doesn't exist yet, queue the contribution
    if (!point) {
      let pending = this.pendingContributions.get(contribution.point);
      if (!pending) {
        pending = [];
        this.pendingContributions.set(contribution.point, pending);
      }
      pending.push({ pluginId, contribution });
      return { valid: true, errors: [] }; // Will be validated when point is defined
    }

    // Validate the contribution
    const validationResult = validateContribution(
      contribution.contribution,
      point.declaration.schema
    );

    if (!validationResult.valid) {
      console.error(
        `Invalid contribution to ${contribution.point} from ${pluginId}:`,
        validationResult.errors
      );
      return validationResult;
    }

    // Add the contribution
    const priority = (contribution.contribution.priority as number) ?? 0;
    const registered: RegisteredContribution = {
      pluginId,
      contribution: contribution.contribution,
      priority,
    };

    point.contributions.push(registered);

    // Sort by priority (higher first)
    point.contributions.sort((a, b) => b.priority - a.priority);

    return validationResult;
  }

  /**
   * Get all contributions to an extension point
   * @param pointId - The full extension point ID (e.g., "tree-view.nodeRenderer")
   */
  getExtensions<T = Record<string, unknown>>(pointId: string): T[] {
    const point = this.extensionPoints.get(pointId);
    if (!point) {
      return [];
    }

    return point.contributions.map((c) => c.contribution as T);
  }

  /**
   * Get contributions with metadata
   */
  getExtensionsWithMetadata(pointId: string): RegisteredContribution[] {
    return this.extensionPoints.get(pointId)?.contributions ?? [];
  }

  /**
   * Check if an extension point exists
   */
  hasExtensionPoint(pointId: string): boolean {
    return this.extensionPoints.has(pointId);
  }

  /**
   * Get an extension point declaration
   */
  getExtensionPoint(pointId: string): RegisteredExtensionPoint | undefined {
    return this.extensionPoints.get(pointId);
  }

  /**
   * Get all extension point IDs
   */
  getAllExtensionPointIds(): string[] {
    return Array.from(this.extensionPoints.keys());
  }

  /**
   * Get extension points defined by a specific plugin
   */
  getExtensionPointsByPlugin(pluginId: string): RegisteredExtensionPoint[] {
    return Array.from(this.extensionPoints.values()).filter(
      (ep) => ep.pluginId === pluginId
    );
  }

  /**
   * Remove all extension points defined by a plugin
   */
  removePluginExtensionPoints(pluginId: string): void {
    for (const [id, point] of this.extensionPoints) {
      if (point.pluginId === pluginId) {
        this.extensionPoints.delete(id);
      }
    }
  }

  /**
   * Remove all contributions from a plugin
   */
  removePluginContributions(pluginId: string): void {
    for (const point of this.extensionPoints.values()) {
      point.contributions = point.contributions.filter(
        (c) => c.pluginId !== pluginId
      );
    }
  }

  /**
   * Clear all extension points and contributions (useful for testing)
   */
  clear(): void {
    this.extensionPoints.clear();
    this.pendingContributions.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global extension registry instance
 */
export const extensionRegistry = new ExtensionRegistry();
