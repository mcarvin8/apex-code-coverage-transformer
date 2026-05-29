import { GitHubActionsCoverageObject } from '../../utils/types.js';

export const DEFAULT_MAX_ANNOTATIONS = 50;

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

export function generateGitHubActions(
  coverageObj: GitHubActionsCoverageObject,
  maxAnnotations = DEFAULT_MAX_ANNOTATIONS,
): string {
  const { summary, uncoveredLines } = coverageObj;
  const overall = formatPercent(summary.lineRate);

  const summaryLine = `::notice title=Apex Code Coverage::Overall coverage ${escapeData(
    overall,
  )} (${summary.coveredLines}/${summary.totalLines} lines, ${summary.uncoveredLines} uncovered across ${
    summary.fileCount
  } file${summary.fileCount === 1 ? '' : 's'})`;

  const visible = uncoveredLines.slice(0, maxAnnotations);
  const truncated = uncoveredLines.length - visible.length;

  const annotations = visible.map(
    ({ filePath, lineNumber }) =>
      `::warning file=${escapeProperty(filePath)},line=${lineNumber},title=Uncovered Apex line::Line ${lineNumber} is not covered by any Apex test`,
  );

  const lines = [summaryLine, ...annotations];

  if (truncated > 0) {
    lines.push(
      `::notice title=Apex Code Coverage::${truncated} additional uncovered line${truncated === 1 ? '' : 's'} not shown. GitHub Actions limits annotations per step.`,
    );
  }

  return lines.join('\n');
}
