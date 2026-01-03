/**
 * CSV 다운로드 유틸리티
 */

/**
 * 데이터를 CSV 형식으로 변환
 */
export function convertToCSV(data: any[], headers: string[]): string {
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.join(','));

  // Data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];

      // Handle arrays (tags)
      if (Array.isArray(value)) {
        return `"${value.join('; ')}"`;
      }

      // Handle strings with commas or quotes
      if (typeof value === 'string') {
        const escaped = value.replace(/"/g, '""'); // Escape quotes
        return `"${escaped}"`;
      }

      // Handle null/undefined
      if (value == null) {
        return '';
      }

      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

/**
 * CSV 파일 다운로드
 */
export function downloadCSV(csvContent: string, filename: string) {
  // Add BOM for Excel UTF-8 support
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDateForCSV(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 현재 타임스탬프를 파일명에 사용할 형식으로 반환
 */
export function getTimestampForFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
}
