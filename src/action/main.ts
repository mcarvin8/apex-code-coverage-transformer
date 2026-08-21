'use strict';

import * as core from '@actions/core';
import { transformCoverageReport } from '../transformers/coverageTransformer.js';

function multilineInput(name: string): string[] {
  return core
    .getMultilineInput(name)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function numberInput(name: string): number | undefined {
  const raw = core.getInput(name);
  return raw === '' ? undefined : Number(raw);
}

export async function run(): Promise<void> {
  try {
    const coverageJson = multilineInput('coverage-json');
    const outputReport = core.getInput('output-report') || 'coverage.xml';
    const formats = multilineInput('format');
    const ignoreDirs = multilineInput('ignore-package-directory');
    const excludePatterns = multilineInput('exclude-pattern');
    const minCoverage = numberInput('min-coverage');
    const maxAnnotations = numberInput('max-annotations');

    const result = await transformCoverageReport(
      coverageJson,
      outputReport,
      formats.length > 0 ? formats : ['sonar'],
      ignoreDirs,
      { minCoverage, maxAnnotations, excludePatterns },
    );

    core.setOutput('report-paths', result.finalPaths.join('\n'));
    core.setOutput('coverage-percentage', (result.lineRate * 100).toFixed(2));
    core.setOutput('warnings', result.warnings.join('\n'));

    result.warnings.forEach((warning) => core.warning(warning));
    core.info(`The coverage report has been written to: ${result.finalPaths.join(', ')}`);

    if (!result.success) {
      core.setFailed(
        `Coverage of ${(result.lineRate * 100).toFixed(2)}% is below the required minimum of ${minCoverage}%.`,
      );
    }
  } catch (error) {
    core.setFailed(error instanceof Error ? error.message : String(error));
  }
}
