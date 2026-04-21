import { HtmlCoverageObject } from '../../utils/types.js';

export function isHtmlCoverageObject(obj: unknown): obj is HtmlCoverageObject {
  return typeof obj === 'object' && obj !== null && 'summary' in obj && 'files' in obj;
}

function getCoverageColor(lineRate: number): string {
  if (lineRate >= 0.8) return '#4caf50';
  if (lineRate >= 0.6) return '#ff9800';
  return '#f44336';
}

function formatPercent(lineRate: number): string {
  return (lineRate * 100).toFixed(2);
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function buildPackageSummaryRows(packageSummaries: HtmlCoverageObject['packageSummaries']): string {
  if (packageSummaries.length === 0) return '';
  return packageSummaries
    .map((pkg) => {
      const pkgPercent = formatPercent(pkg.lineRate);
      const pkgColor = getCoverageColor(pkg.lineRate);
      return `<tr>
              <td class="package-dir">${escapeHtml(pkg.directory)}</td>
              <td class="package-stat">${pkg.fileCount}</td>
              <td class="package-stat">${pkg.totalLines}</td>
              <td class="package-stat">${pkg.coveredLines}</td>
              <td class="package-stat">${pkg.uncoveredLines}</td>
              <td class="package-pct" style="color: ${pkgColor}">${pkgPercent}%</td>
              <td><span class="coverage-bar" style="background-color: ${pkgColor}; width: ${pkgPercent}%"></span></td>
            </tr>`;
    })
    .join('\n');
}

function groupFilesByDir(files: HtmlCoverageObject['files']): Map<string, HtmlCoverageObject['files']> {
  const filesByDir = new Map<string, HtmlCoverageObject['files']>();
  for (const file of files) {
    const dir = file.filePath.split('/')[0];
    const list = filesByDir.get(dir) ?? [];
    list.push(file);
    filesByDir.set(dir, list);
  }
  return filesByDir;
}

function buildLineRow(line: { lineNumber: number; hitCount: number; covered: boolean; content?: string }): string {
  const lineClass = line.covered ? 'covered' : 'uncovered';
  const lineColor = line.covered ? '#c8e6c9' : '#ffcdd2';
  const codeContent = line.content !== undefined ? escapeHtml(line.content) : '';
  return `<tr class="${lineClass}" style="background-color: ${lineColor}">
            <td class="line-number">${line.lineNumber}</td>
            <td class="hit-count">${line.hitCount}</td>
            <td class="line-content">${codeContent}</td>
          </tr>`;
}

function buildFileSection(file: HtmlCoverageObject['files'][number]): string {
  const filePercent = formatPercent(file.lineRate);
  const fileColor = getCoverageColor(file.lineRate);
  const lineDetails = file.lines.map(buildLineRow).join('\n');
  const fileId = file.filePath.replace(/[^a-zA-Z0-9]/g, '-');
  const escapedPath = file.filePath.replace(/'/g, "\\'");

  return `
        <div class="file-section">
          <h3 class="file-header" onclick="toggleFile('${escapedPath}')">
            <span class="file-name">${escapeHtml(file.filePath)}</span>
            <span class="file-stats">
              ${file.coveredLines}/${file.totalLines} lines (${filePercent}%)
              <span class="coverage-bar" style="background-color: ${fileColor}; width: ${filePercent}%"></span>
            </span>
          </h3>
          <div id="file-${fileId}" class="file-details" style="display: none;">
            <table class="line-coverage">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Hits</th>
                  <th>Code</th>
                </tr>
              </thead>
              <tbody>
                ${lineDetails}
              </tbody>
            </table>
          </div>
        </div>
      `;
}

function buildFileRows(files: HtmlCoverageObject['files']): string {
  const filesByDir = groupFilesByDir(files);
  const sortedDirs = [...filesByDir.keys()].sort((a, b) => a.localeCompare(b));

  return sortedDirs
    .map((dir) => {
      const dirFiles = filesByDir.get(dir)!;
      const dirFileSections = dirFiles.map(buildFileSection).join('\n');
      return `
    <div class="package-files-group">
      <h3 class="package-dir-header">${escapeHtml(dir)}/</h3>
      ${dirFileSections}
    </div>
      `;
    })
    .join('\n');
}

export function generateHtml(coverageObj: HtmlCoverageObject): string {
  const { summary, packageSummaries, files } = coverageObj;
  const coveragePercent = formatPercent(summary.lineRate);
  const coverageColor = getCoverageColor(summary.lineRate);
  const packageSummaryRows = buildPackageSummaryRows(packageSummaries);
  const fileRows = buildFileRows(files);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Code Coverage Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 30px;
    }
    h1 {
      color: #2c3e50;
      margin-bottom: 30px;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    .summary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 25px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary h2 {
      margin-bottom: 15px;
      font-size: 1.5em;
    }
    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    .stat-item {
      background: rgba(255, 255, 255, 0.2);
      padding: 15px;
      border-radius: 6px;
    }
    .stat-label {
      font-size: 0.9em;
      opacity: 0.9;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 1.8em;
      font-weight: bold;
    }
    .coverage-percent {
      font-size: 3em;
      font-weight: bold;
      margin: 10px 0;
    }
    .package-files-group {
      margin-bottom: 28px;
    }
    .package-dir-header {
      font-size: 1.1em;
      color: #2c3e50;
      margin-bottom: 12px;
      padding-bottom: 6px;
      border-bottom: 2px solid #3498db;
      font-weight: 600;
    }
    .file-section {
      margin-bottom: 20px;
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
    }
    .file-header {
      background: #f8f9fa;
      padding: 15px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background-color 0.2s;
    }
    .file-header:hover {
      background: #e9ecef;
    }
    .file-name {
      font-weight: 600;
      color: #2c3e50;
    }
    .file-stats {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .coverage-bar {
      height: 20px;
      min-width: 100px;
      border-radius: 4px;
      display: inline-block;
    }
    .file-details {
      padding: 0;
    }
    .line-coverage {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }
    .line-coverage thead {
      background: #34495e;
      color: white;
    }
    .line-coverage th {
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }
    .line-coverage td {
      padding: 5px 10px;
      border-bottom: 1px solid #eee;
    }
    .line-number {
      text-align: right;
      width: 80px;
      color: #666;
      font-weight: 600;
    }
    .hit-count {
      text-align: right;
      width: 80px;
      color: #666;
    }
    .line-content {
      width: auto;
      white-space: pre;
    }
    .covered {
      background-color: #c8e6c9 !important;
    }
    .uncovered {
      background-color: #ffcdd2 !important;
    }
    .package-summary {
      margin-bottom: 30px;
    }
    .package-summary h2 {
      margin-bottom: 15px;
      color: #2c3e50;
      font-size: 1.25em;
    }
    .package-summary table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #ddd;
      border-radius: 6px;
      overflow: hidden;
    }
    .package-summary th {
      background: #34495e;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: 600;
    }
    .package-summary td {
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
    }
    .package-summary tr:last-child td {
      border-bottom: none;
    }
    .package-summary tr:hover {
      background: #f8f9fa;
    }
    .package-dir {
      font-weight: 600;
      color: #2c3e50;
    }
    .package-stat {
      text-align: right;
    }
    .package-pct {
      font-weight: 600;
      text-align: right;
    }
    .package-summary .coverage-bar {
      display: block;
      min-width: 60px;
      height: 14px;
      border-radius: 4px;
    }
    @media (max-width: 768px) {
      .file-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .summary-stats {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Code Coverage Report</h1>
    
    <div class="summary">
      <h2>Summary</h2>
      <div class="coverage-percent" style="color: ${coverageColor}">${coveragePercent}%</div>
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-label">Total Lines</div>
          <div class="stat-value">${summary.totalLines}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Covered Lines</div>
          <div class="stat-value">${summary.coveredLines}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Uncovered Lines</div>
          <div class="stat-value">${summary.uncoveredLines}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Files</div>
          <div class="stat-value">${files.length}</div>
        </div>
      </div>
    </div>

    ${
      packageSummaryRows
        ? `
    <div class="package-summary">
      <h2>Package directory coverage</h2>
      <table>
        <thead>
          <tr>
            <th>Directory</th>
            <th>Files</th>
            <th>Total lines</th>
            <th>Covered</th>
            <th>Uncovered</th>
            <th>Coverage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${packageSummaryRows}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <h2 style="margin: 30px 0 20px 0; color: #2c3e50;">File Coverage Details</h2>
    
    ${fileRows}
  </div>

  <script>
    function toggleFile(filePath) {
      const id = 'file-' + filePath.replace(/[^a-zA-Z0-9]/g, '-');
      const element = document.getElementById(id);
      if (element) {
        element.style.display = element.style.display === 'none' ? 'block' : 'none';
      }
    }
  </script>
</body>
</html>`;
}
