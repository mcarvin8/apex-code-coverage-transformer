'use strict';

import {
  CoverageHandler,
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  LcovCoverageObject,
  JaCoCoCoverageObject,
  IstanbulCoverageObject,
  JsonSummaryCoverageObject,
  SimpleCovCoverageObject,
  OpenCoverCoverageObject,
} from '../utils/types.js';

/**
 * Abstract base class for coverage handlers providing common utilities.
 * Reduces code duplication across different format handlers.
 */
export abstract class BaseHandler implements CoverageHandler {
  /**
   * Calculate line coverage metrics from a lines record.
   *
   * @param lines - Record of line numbers to hit counts
   * @returns Coverage metrics including totals and rates
   */
  // eslint-disable-next-line class-methods-use-this
  protected calculateCoverage(lines: Record<string, number>): {
    totalLines: number;
    coveredLines: number;
    uncoveredLines: number;
    lineRate: number;
  } {
    const uncoveredLines = Object.values(lines).filter((hits) => hits === 0).length;
    const coveredLines = Object.values(lines).filter((hits) => hits > 0).length;
    const totalLines = uncoveredLines + coveredLines;
    const lineRate = totalLines > 0 ? coveredLines / totalLines : 0;

    return { totalLines, coveredLines, uncoveredLines, lineRate };
  }

  /**
   * Extract line numbers by coverage status.
   *
   * @param lines - Record of line numbers to hit counts
   * @param covered - True to get covered lines, false for uncovered
   * @returns Sorted array of line numbers
   */
  // eslint-disable-next-line class-methods-use-this
  protected extractLinesByStatus(lines: Record<string, number>, covered: boolean): number[] {
    return Object.entries(lines)
      .filter(([, hits]) => (covered ? hits > 0 : hits === 0))
      .map(([line]) => Number(line))
      .sort((a, b) => a - b);
  }

  /**
   * Get covered and uncovered line numbers from a lines record.
   *
   * @param lines - Record of line numbers to hit counts
   * @returns Object with covered and uncovered line arrays
   */
  protected getCoveredAndUncovered(lines: Record<string, number>): {
    covered: number[];
    uncovered: number[];
  } {
    return {
      covered: this.extractLinesByStatus(lines, true),
      uncovered: this.extractLinesByStatus(lines, false),
    };
  }

  /**
   * Sort array of objects by their path property.
   * Handles various path property names (@path, @filename, @name).
   *
   * @param items - Array of objects to sort
   * @returns Sorted array
   */
  // eslint-disable-next-line class-methods-use-this
  protected sortByPath<T extends { '@path'?: string; '@filename'?: string; '@name'?: string }>(items: T[]): T[] {
    return items.sort((a, b) => {
      const pathA = a['@path'] ?? a['@filename'] ?? a['@name'] ?? '';
      const pathB = b['@path'] ?? b['@filename'] ?? b['@name'] ?? '';
      return pathA.localeCompare(pathB);
    });
  }

  public abstract processFile(filePath: string, fileName: string, lines: Record<string, number>): void;

  public abstract finalize():
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject
    | IstanbulCoverageObject
    | JsonSummaryCoverageObject
    | SimpleCovCoverageObject
    | OpenCoverCoverageObject;
}
