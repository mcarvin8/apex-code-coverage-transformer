'use strict';

import {
  OpenCoverCoverageObject,
  OpenCoverModule,
  OpenCoverFile,
  OpenCoverClass,
  OpenCoverMethod,
  OpenCoverSequencePoint,
} from '../utils/types.js';
import { BaseHandler } from './BaseHandler.js';
import { HandlerRegistry } from './HandlerRegistry.js';

/**
 * Handler for generating OpenCover XML coverage reports.
 *
 * OpenCover is a code coverage tool for .NET, but its XML format
 * is also accepted by Azure DevOps, Visual Studio, and other tools.
 *
 * **Format Origin**: OpenCover (.NET coverage tool)
 *
 * @see https://github.com/OpenCover/opencover
 * @see https://github.com/OpenCover/opencover/wiki/Reports
 *
 * **Apex-Specific Adaptations**:
 * - Salesforce Apex only provides line-level coverage data
 * - Each Apex class is represented as an OpenCover "Module"
 * - Line coverage is mapped to "SequencePoints" (executable code locations)
 * - Branch coverage is always 0 (Apex doesn't provide branch/decision coverage)
 * - Column information (`@sc`, `@ec`) defaults to 0 (not available in Apex)
 *
 * **Limitations**:
 * - No branch/decision coverage - OpenCover supports this, Apex does not
 * - No method-level coverage granularity - treating entire class as one method
 * - No cyclomatic complexity metrics
 * - No column-level positioning data
 *
 * **Structure Mapping**:
 * - Apex Class → OpenCover Module/Class
 * - Apex Class → OpenCover Method (single method per class)
 * - Apex Lines → OpenCover SequencePoints
 *
 * Compatible with:
 * - Azure DevOps
 * - Visual Studio
 * - Codecov
 * - JetBrains tools (ReSharper, Rider)
 *
 * @example
 * ```xml
 * <CoverageSession>
 *   <Summary numSequencePoints="100" visitedSequencePoints="75" />
 *   <Modules>
 *     <Module>
 *       <Files>
 *         <File uid="1" fullPath="path/to/file.cls" />
 *       </Files>
 *       <Classes>
 *         <Class fullName="ClassName">
 *           <Methods>
 *             <Method name="MethodName">
 *               <SequencePoints>
 *                 <SequencePoint vc="1" sl="1" />
 *               </SequencePoints>
 *             </Method>
 *           </Methods>
 *         </Class>
 *       </Classes>
 *     </Module>
 *   </Modules>
 * </CoverageSession>
 * ```
 */
export class OpenCoverCoverageHandler extends BaseHandler {
  private readonly coverageObj: OpenCoverCoverageObject;
  private readonly module: OpenCoverModule;
  private fileIdCounter = 1;
  private filePathToId: Map<string, number> = new Map();

  public constructor() {
    super();
    this.module = {
      '@hash': 'apex-module',
      Files: { File: [] },
      Classes: { Class: [] },
    };
    this.coverageObj = {
      CoverageSession: {
        Summary: {
          '@numSequencePoints': 0,
          '@visitedSequencePoints': 0,
          '@numBranchPoints': 0,
          '@visitedBranchPoints': 0,
          '@sequenceCoverage': 0,
          '@branchCoverage': 0,
        },
        Modules: {
          Module: [this.module],
        },
      },
    };
  }

  public processFile(filePath: string, fileName: string, lines: Record<string, number>): void {
    // Register file if not already registered
    if (!this.filePathToId.has(filePath)) {
      const fileId = this.fileIdCounter++;
      this.filePathToId.set(filePath, fileId);

      const fileObj: OpenCoverFile = {
        '@uid': fileId,
        '@fullPath': filePath,
      };
      this.module.Files.File.push(fileObj);
    }

    const { totalLines, coveredLines } = this.calculateCoverage(lines);

    // Create sequence points for each line
    // In OpenCover, a SequencePoint represents an executable statement location
    // We map each Apex line to a SequencePoint
    const sequencePoints: OpenCoverSequencePoint[] = [];
    for (const [lineNumber, hits] of Object.entries(lines)) {
      sequencePoints.push({
        '@vc': hits, // visit count (number of times this line was executed)
        '@sl': Number(lineNumber), // start line
        '@sc': 0, // start column (not available in Apex coverage data)
        '@el': Number(lineNumber), // end line (same as start for line-level coverage)
        '@ec': 0, // end column (not available in Apex coverage data)
      });
    }

    // Create a method for this file
    // NOTE: Apex classes are treated as a single method since we don't have
    // method-level coverage granularity from Salesforce
    const method: OpenCoverMethod = {
      '@name': fileName,
      '@isConstructor': false,
      '@isStatic': false,
      SequencePoints: {
        SequencePoint: sequencePoints,
      },
    };

    // Create a class for this file
    const classObj: OpenCoverClass = {
      '@fullName': fileName,
      Methods: {
        Method: [method],
      },
    };

    this.module.Classes.Class.push(classObj);

    // Update summary statistics
    this.coverageObj.CoverageSession.Summary['@numSequencePoints'] += totalLines;
    this.coverageObj.CoverageSession.Summary['@visitedSequencePoints'] += coveredLines;
  }

  public finalize(): OpenCoverCoverageObject {
    const summary = this.coverageObj.CoverageSession.Summary;

    // Calculate sequence coverage percentage
    if (summary['@numSequencePoints'] > 0) {
      const coverage = (summary['@visitedSequencePoints'] / summary['@numSequencePoints']) * 100;
      summary['@sequenceCoverage'] = Number(coverage.toFixed(2));
    }

    // Branch coverage is always 0 for Apex (no branch/decision coverage data available)
    // In .NET environments, this would track if/else branches, switch cases, etc.
    summary['@branchCoverage'] = 0;

    // Sort classes by name for consistent output
    this.module.Classes.Class.sort((a, b) => a['@fullName'].localeCompare(b['@fullName']));

    // Sort files by path and reassign UIDs sequentially for deterministic output
    this.module.Files.File.sort((a, b) => a['@fullPath'].localeCompare(b['@fullPath']));

    // Reassign UIDs based on sorted order
    for (let i = 0; i < this.module.Files.File.length; i++) {
      this.module.Files.File[i]['@uid'] = i + 1;
    }

    return this.coverageObj;
  }
}

// Self-register this handler
HandlerRegistry.register({
  name: 'opencover',
  description: 'OpenCover XML format for .NET and Azure DevOps',
  fileExtension: '.xml',
  handler: () => new OpenCoverCoverageHandler(),
  compatibleWith: ['Azure DevOps', 'Visual Studio', 'Codecov', 'JetBrains Tools'],
});
