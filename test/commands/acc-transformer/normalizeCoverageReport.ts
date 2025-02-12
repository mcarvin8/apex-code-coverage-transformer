export function normalizeCoverageReport(content: string): string {
  return content
    // Normalize Cobertura timestamps: timestamp="123456789"
    .replace(/timestamp="[\d]+"/g, 'timestamp="NORMALIZED"')
    // Normalize Clover timestamps: generated="1234567890123"
    .replace(/generated="[\d]+"/g, 'generated="NORMALIZED"');
}