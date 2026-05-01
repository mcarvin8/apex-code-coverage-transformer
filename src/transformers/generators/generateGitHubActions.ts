import { GitHubActionsCoverageObject } from '../../utils/types.js';

export function isGitHubActionsCoverageObject(obj: unknown): obj is GitHubActionsCoverageObject {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'summary' in obj &&
    'uncoveredLines' in obj &&
    Array.isArray((obj as GitHubActionsCoverageObject).uncoveredLines)
  );
}

function formatPercent(lineRate: number): string {
  return `${(lineRate * 100).toFixed(2)}%`;
}

/**
 * Escape a string for use as a GitHub Actions workflow command property value.
 *
 * @see https://docs.github.com/en/actions/reference/workflow-commands-for-github-actions#example-setting-a-warning-message
 */
function escapeProperty(value: string): string {
  return value
    .replace(/%/g, '%25')
    .replace(/\r/g, '%0D')
    .replace(/\n/g, '%0A')
    .replace(/:/g, '%3A')
    .replace(/,/g, '%2C');
}

function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

export function generateGitHubActions(coverageObj: GitHubActionsCoverageObject): string {
  const { summary, uncoveredLines } = coverageObj;
  const overall = formatPercent(summary.lineRate);

  const summaryLine = `::notice title=Apex Code Coverage::Overall coverage ${escapeData(
    overall,
  )} (${summary.coveredLines}/${summary.totalLines} lines, ${summary.uncoveredLines} uncovered across ${
    summary.fileCount
  } file${summary.fileCount === 1 ? '' : 's'})`;

  const annotations = uncoveredLines.map(
    ({ filePath, lineNumber }) =>
      `::warning file=${escapeProperty(filePath)},line=${lineNumber},title=Uncovered Apex line::Line ${lineNumber} is not covered by any Apex test`,
  );

  return [summaryLine, ...annotations].join('\n');
}
