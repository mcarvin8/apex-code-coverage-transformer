import { MarkdownCoverageObject } from '../../utils/types.js';

function formatPercent(lineRate: number): string {
  return `${(lineRate * 100).toFixed(2)}%`;
}

function escapePipes(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function buildPackageTable(packages: MarkdownCoverageObject['packages']): string {
  if (packages.length === 0) return '';
  const header = [
    '| Directory | Files | Lines | Covered | Uncovered | Coverage |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ].join('\n');
  const rows = packages
    .map(
      (pkg) =>
        `| ${escapePipes(pkg.directory)} | ${pkg.fileCount} | ${pkg.totalLines} | ${pkg.coveredLines} | ${
          pkg.uncoveredLines
        } | ${formatPercent(pkg.lineRate)} |`,
    )
    .join('\n');
  return `## Package directory coverage\n\n${header}\n${rows}`;
}

function buildFileTable(files: MarkdownCoverageObject['files']): string {
  if (files.length === 0) return '';
  const header = ['| File | Lines | Covered | Uncovered | Coverage |', '| --- | ---: | ---: | ---: | ---: |'].join(
    '\n',
  );
  const rows = files
    .map(
      (file) =>
        `| ${escapePipes(file.filePath)} | ${file.totalLines} | ${file.coveredLines} | ${
          file.uncoveredLines
        } | ${formatPercent(file.lineRate)} |`,
    )
    .join('\n');
  return `## File coverage\n\nFiles are sorted with the lowest coverage first.\n\n${header}\n${rows}`;
}

export function generateMarkdown(coverageObj: MarkdownCoverageObject): string {
  const { summary, packages, files } = coverageObj;
  const overall = formatPercent(summary.lineRate);
  const summaryBlock = [
    '# Apex Code Coverage Report',
    '',
    `**Overall coverage:** ${overall} (${summary.coveredLines} / ${summary.totalLines} lines across ${summary.fileCount} file${
      summary.fileCount === 1 ? '' : 's'
    })`,
  ].join('\n');

  const sections = [summaryBlock, buildPackageTable(packages), buildFileTable(files)].filter(Boolean);
  return sections.join('\n\n');
}
