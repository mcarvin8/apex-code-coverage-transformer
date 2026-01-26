import { writeFile } from 'node:fs/promises';
import { extname, basename, dirname, join } from 'node:path';
import { create } from 'xmlbuilder2';

import {
  SonarCoverageObject,
  CoberturaCoverageObject,
  CloverCoverageObject,
  LcovCoverageObject,
  JaCoCoCoverageObject,
  IstanbulCoverageObject,
  JsonSummaryCoverageObject,
  SimpleCovCoverageObject,
  OpenCoverCoverageObject,
  HtmlCoverageObject,
} from '../utils/types.js';
import { HandlerRegistry } from '../handlers/HandlerRegistry.js';

export async function generateAndWriteReport(
  outputPath: string,
  coverageObj:
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject
    | IstanbulCoverageObject
    | JsonSummaryCoverageObject
    | SimpleCovCoverageObject
    | OpenCoverCoverageObject
    | HtmlCoverageObject,
  format: string,
  formatAmount: number
): Promise<string> {
  const content = generateReportContent(coverageObj, format);
  const extension = HandlerRegistry.getExtension(format);

  const base = basename(outputPath, extname(outputPath)); // e.g., 'coverage'
  const dir = dirname(outputPath);

  const suffix = formatAmount > 1 ? `-${format}` : '';
  const filePath = join(dir, `${base}${suffix}${extension}`);

  await writeFile(filePath, content, 'utf-8');
  return filePath;
}

function generateReportContent(
  coverageObj:
    | SonarCoverageObject
    | CoberturaCoverageObject
    | CloverCoverageObject
    | LcovCoverageObject
    | JaCoCoCoverageObject
    | IstanbulCoverageObject
    | JsonSummaryCoverageObject
    | SimpleCovCoverageObject
    | OpenCoverCoverageObject
    | HtmlCoverageObject,
  format: string
): string {
  if (format === 'lcovonly' && isLcovCoverageObject(coverageObj)) {
    return generateLcov(coverageObj);
  }

  if (format === 'html' && isHtmlCoverageObject(coverageObj)) {
    return generateHtml(coverageObj);
  }

  if (format === 'json' || format === 'json-summary' || format === 'simplecov') {
    return JSON.stringify(coverageObj, null, 2);
  }

  const isHeadless = ['cobertura', 'clover', 'jacoco', 'opencover'].includes(format);
  const xml = create(coverageObj).end({ prettyPrint: true, indent: '  ', headless: isHeadless });

  return prependXmlHeader(xml, format);
}

function generateLcov(coverageObj: LcovCoverageObject): string {
  return coverageObj.files
    .map((file) => {
      const lineData = file.lines.map((line) => `DA:${line.lineNumber},${line.hitCount}`).join('\n');
      return [
        'TN:',
        `SF:${file.sourceFile}`,
        'FNF:0',
        'FNH:0',
        lineData,
        `LF:${file.totalLines}`,
        `LH:${file.coveredLines}`,
        'BRF:0',
        'BRH:0',
        'end_of_record',
      ].join('\n');
    })
    .join('\n');
}

function prependXmlHeader(xml: string, format: string): string {
  switch (format) {
    case 'cobertura':
      return `<?xml version="1.0" ?>\n<!DOCTYPE coverage SYSTEM "http://cobertura.sourceforge.net/xml/coverage-04.dtd">\n${xml}`;
    case 'clover':
      return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
    case 'jacoco':
      return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<!DOCTYPE report PUBLIC "-//JACOCO//DTD Report 1.0//EN" "report.dtd">\n${xml}`;
    case 'opencover':
      return `<?xml version="1.0" encoding="utf-8"?>\n${xml}`;
    default:
      return xml;
  }
}

export function getExtensionForFormat(format: string): string {
  return HandlerRegistry.getExtension(format);
}

function isLcovCoverageObject(obj: unknown): obj is LcovCoverageObject {
  return typeof obj === 'object' && obj !== null && 'files' in obj;
}

function isHtmlCoverageObject(obj: unknown): obj is HtmlCoverageObject {
  return typeof obj === 'object' && obj !== null && 'summary' in obj && 'files' in obj;
}

function generateHtml(coverageObj: HtmlCoverageObject): string {
  const { summary, files } = coverageObj;
  const coveragePercent = (summary.lineRate * 100).toFixed(2);
  const coverageColor = summary.lineRate >= 0.8 ? '#4caf50' : summary.lineRate >= 0.6 ? '#ff9800' : '#f44336';

  const fileRows = files
    .map((file) => {
      const filePercent = (file.lineRate * 100).toFixed(2);
      const fileColor = file.lineRate >= 0.8 ? '#4caf50' : file.lineRate >= 0.6 ? '#ff9800' : '#f44336';

      const lineDetails = file.lines
        .map((line) => {
          const lineClass = line.covered ? 'covered' : 'uncovered';
          const lineColor = line.covered ? '#c8e6c9' : '#ffcdd2';
          return `<tr class="${lineClass}" style="background-color: ${lineColor}">
            <td class="line-number">${line.lineNumber}</td>
            <td class="hit-count">${line.hitCount}</td>
            <td class="line-content"></td>
          </tr>`;
        })
        .join('\n');

      return `
        <div class="file-section">
          <h3 class="file-header" onclick="toggleFile('${file.filePath.replace(/'/g, "\\'")}')">
            <span class="file-name">${escapeHtml(file.filePath)}</span>
            <span class="file-stats">
              ${file.coveredLines}/${file.totalLines} lines (${filePercent}%)
              <span class="coverage-bar" style="background-color: ${fileColor}; width: ${filePercent}%"></span>
            </span>
          </h3>
          <div id="file-${file.filePath.replace(/[^a-zA-Z0-9]/g, '-')}" class="file-details" style="display: none;">
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
    })
    .join('\n');

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
    }
    .covered {
      background-color: #c8e6c9 !important;
    }
    .uncovered {
      background-color: #ffcdd2 !important;
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
