/* eslint-disable no-await-in-loop */
'use strict';
import { describe, it, expect } from '@jest/globals';

import { HandlerRegistry } from '../../src/handlers/HandlerRegistry.js';
import { SonarCoverageHandler } from '../../src/handlers/sonar.js';
// Import all handlers to ensure they are registered
import '../../src/handlers/cobertura.js';
import '../../src/handlers/clover.js';
import '../../src/handlers/lcov.js';
import '../../src/handlers/jacoco.js';
import '../../src/handlers/istanbulJson.js';
import '../../src/handlers/jsonSummary.js';
import '../../src/handlers/simplecov.js';
import '../../src/handlers/opencover.js';
import '../../src/handlers/html.js';

describe('HandlerRegistry unit tests', () => {
  it('should retrieve an existing handler', () => {
    const handler = HandlerRegistry.get('sonar');
    expect(handler).toBeInstanceOf(SonarCoverageHandler);
  });

  it('should throw error for unsupported format', () => {
    expect(() => {
      HandlerRegistry.get('unsupported-format');
    }).toThrow('Unsupported format: unsupported-format');
  });

  it('should return list of available formats', () => {
    const formats = HandlerRegistry.getAvailableFormats();
    expect(formats).toContain('sonar');
    expect(formats).toContain('cobertura');
    expect(formats).toContain('jacoco');
    expect(formats).toContain('json-summary');
    expect(formats).toContain('simplecov');
    expect(formats).toContain('opencover');
    expect(formats).toContain('html');
    expect(formats.length).toBeGreaterThanOrEqual(10);
  });

  it('should return correct file extension for format', () => {
    expect(HandlerRegistry.getExtension('sonar')).toBe('.xml');
    expect(HandlerRegistry.getExtension('json')).toBe('.json');
    expect(HandlerRegistry.getExtension('lcovonly')).toBe('.info');
    expect(HandlerRegistry.getExtension('json-summary')).toBe('.json');
    expect(HandlerRegistry.getExtension('simplecov')).toBe('.json');
    expect(HandlerRegistry.getExtension('opencover')).toBe('.xml');
    expect(HandlerRegistry.getExtension('html')).toBe('.html');
  });

  it('should return default extension for unknown format', () => {
    // Test the fallback when format is not registered
    expect(HandlerRegistry.getExtension('unknown-format')).toBe('.xml');
  });

  it('should return description for format', () => {
    const description = HandlerRegistry.getDescription('sonar');
    expect(description).toContain('SonarQube');
  });

  it('should return empty string for unknown format description', () => {
    // Test the fallback when format is not registered
    expect(HandlerRegistry.getDescription('unknown-format')).toBe('');
  });

  it('should return compatible platforms for format', () => {
    const platforms = HandlerRegistry.getCompatiblePlatforms('cobertura');
    expect(platforms).toContain('Codecov');
    expect(platforms.length).toBeGreaterThan(0);
  });

  it('should return empty array for unknown format platforms', () => {
    // Test the fallback when format is not registered
    const platforms = HandlerRegistry.getCompatiblePlatforms('unknown-format');
    expect(platforms).toEqual([]);
  });

  it('should check if format exists', () => {
    expect(HandlerRegistry.has('sonar')).toBe(true);
    expect(HandlerRegistry.has('nonexistent')).toBe(false);
  });

  it('should throw error when registering duplicate format', () => {
    // Try to register a handler with the same name
    expect(() => {
      HandlerRegistry.register({
        name: 'sonar', // Already registered
        description: 'Test duplicate',
        fileExtension: '.xml',
        handler: () => new SonarCoverageHandler(),
      });
    }).toThrow("Handler for format 'sonar' is already registered");
  });

  it('should clear all handlers', () => {
    // Store current formats count
    const formatsBefore = HandlerRegistry.getAvailableFormats().length;
    expect(formatsBefore).toBeGreaterThan(0);

    // Clear all handlers
    HandlerRegistry.clear();

    // Verify handlers are cleared
    const formatsAfter = HandlerRegistry.getAvailableFormats();
    expect(formatsAfter.length).toBe(0);

    // Re-import handlers to restore them for other tests
    // This is important so other tests don't fail
    import('../../src/handlers/sonar.js');
    import('../../src/handlers/cobertura.js');
    import('../../src/handlers/clover.js');
    import('../../src/handlers/lcov.js');
    import('../../src/handlers/jacoco.js');
    import('../../src/handlers/istanbulJson.js');
    import('../../src/handlers/jsonSummary.js');
    import('../../src/handlers/simplecov.js');
    import('../../src/handlers/opencover.js');
    import('../../src/handlers/html.js');
  });
});
