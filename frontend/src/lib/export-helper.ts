/**
 * export-helper.ts
 *
 * Utilitas untuk mengunduh data terstruktur ke format CSV secara aman,
 * mencegah memory leaks dengan merevoke URL object, dan menyematkan BOM UTF-8.
 */

export function exportToCsv(filename: string, header: string[], rows: string[][]): void {
  const csvContent = [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) to make Excel detect UTF-8 characters correctly
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}
