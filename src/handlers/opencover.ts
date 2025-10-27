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
 * Compatible with:
 * - Azure DevOps
 * - Visual Studio
 * - Codecov
 * - JetBrains tools (ReSharper, Rider)
 *
 * @see https://github.com/OpenCover/opencover
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
    const sequencePoints: OpenCoverSequencePoint[] = [];
    for (const [lineNumber, hits] of Object.entries(lines)) {
      sequencePoints.push({
        '@vc': hits, // visit count
        '@sl': Number(lineNumber), // start line
        '@sc': 0, // start column (not available)
        '@el': Number(lineNumber), // end line
        '@ec': 0, // end column (not available)
      });
    }

    // Create a method for this file (Apex classes are treated as methods)
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

    // Update summary
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

    // Branch coverage defaults to 0 for Apex (no branch data)
    summary['@branchCoverage'] = 0;

    // Sort classes by name
    this.module.Classes.Class.sort((a, b) => a['@fullName'].localeCompare(b['@fullName']));

    // Sort files by path
    this.module.Files.File.sort((a, b) => a['@fullPath'].localeCompare(b['@fullPath']));

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
