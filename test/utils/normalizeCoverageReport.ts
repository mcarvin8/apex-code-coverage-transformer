export function normalizeCoverageReport(content: string, isJson = false): string {
  // For JSON formats, parse and re-stringify to normalize formatting
  if (isJson) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = JSON.parse(content);
      // Normalize SimpleCov timestamp
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (parsed.timestamp !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        parsed.timestamp = 0;
      }
      return JSON.stringify(parsed, null, 2);
    } catch {
      // If parsing fails, fall through to string normalization
    }
  }

  return (
    content
      // Normalize Cobertura timestamps: timestamp="123456789"
      .replace(/timestamp="[\d]+"/g, 'timestamp="NORMALIZED"')
      // Normalize Clover timestamps: generated="1234567890123"
      .replace(/generated="[\d]+"/g, 'generated="NORMALIZED"')
      // Normalize SimpleCov timestamps: "timestamp": 1234567890
      .replace(/"timestamp":\s*\d+/g, '"timestamp": 0')
      // Strip trailing whitespace from each line
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
  );
}
