'use strict';

import { CoverageHandler } from '../utils/types.js';

/**
 * Registration information for a coverage format handler.
 */
export type HandlerRegistration = {
  /** Format identifier (e.g., 'sonar', 'cobertura') */
  name: string;
  /** Human-readable description of the format */
  description: string;
  /** File extension for this format (e.g., '.xml', '.json', '.info') */
  fileExtension: string;
  /** Factory function to create a new handler instance */
  handler: () => CoverageHandler;
  /** List of platforms/tools compatible with this format */
  compatibleWith?: string[];
};

/**
 * Registry for coverage format handlers.
 * Provides a centralized system for registering and retrieving format handlers.
 *
 * @example
 * ```typescript
 * // Register a handler
 * HandlerRegistry.register({
 *   name: 'myformat',
 *   description: 'My custom format',
 *   fileExtension: '.xml',
 *   handler: () => new MyFormatHandler(),
 * });
 *
 * // Retrieve a handler
 * const handler = HandlerRegistry.get('myformat');
 * ```
 */
export class HandlerRegistry {
  private static handlers = new Map<string, HandlerRegistration>();

  /**
   * Register a new format handler.
   *
   * @param registration - Handler registration information
   * @throws Error if a handler with the same name is already registered
   */
  public static register(registration: HandlerRegistration): void {
    if (this.handlers.has(registration.name)) {
      throw new Error(`Handler for format '${registration.name}' is already registered`);
    }
    this.handlers.set(registration.name, registration);
  }

  /**
   * Get a handler instance for the specified format.
   *
   * @param format - Format identifier
   * @returns New handler instance
   * @throws Error if format is not supported
   */
  public static get(format: string): CoverageHandler {
    const registration = this.handlers.get(format);
    if (!registration) {
      const available = this.getAvailableFormats().join(', ');
      throw new Error(`Unsupported format: ${format}. Available formats: ${available}`);
    }
    return registration.handler();
  }

  /**
   * Get list of all registered format names.
   *
   * @returns Array of format identifiers
   */
  public static getAvailableFormats(): string[] {
    return Array.from(this.handlers.keys()).sort();
  }

  /**
   * Get file extension for a format.
   *
   * @param format - Format identifier
   * @returns File extension including the dot (e.g., '.xml')
   */
  public static getExtension(format: string): string {
    const registration = this.handlers.get(format);
    return registration?.fileExtension ?? '.xml';
  }

  /**
   * Get description for a format.
   *
   * @param format - Format identifier
   * @returns Human-readable description
   */
  public static getDescription(format: string): string {
    const registration = this.handlers.get(format);
    return registration?.description ?? '';
  }

  /**
   * Get compatible platforms for a format.
   *
   * @param format - Format identifier
   * @returns Array of compatible platform names
   */
  public static getCompatiblePlatforms(format: string): string[] {
    const registration = this.handlers.get(format);
    return registration?.compatibleWith ?? [];
  }

  /**
   * Check if a format is registered.
   *
   * @param format - Format identifier
   * @returns True if format is registered
   */
  public static has(format: string): boolean {
    return this.handlers.has(format);
  }

  /**
   * Clear all registered handlers (primarily for testing).
   */
  public static clear(): void {
    this.handlers.clear();
  }
}
