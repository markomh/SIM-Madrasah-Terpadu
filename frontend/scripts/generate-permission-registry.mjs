import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('../doc/QA/contract_matrix.csv');
const outPath = path.resolve('./src/lib/permission-registry.ts');

function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    // Basic CSV parser that handles quotes
    let row = [];
    let inQuote = false;
    let curr = '';
    for (let c = 0; c < lines[i].length; c++) {
      let char = lines[i][c];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(curr);
        curr = '';
      } else {
        curr += char;
      }
    }
    row.push(curr);
    
    let obj = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] ? row[idx].trim() : '';
    });
    rows.push(obj);
  }
  return { headers, rows };
}

// 1. Check and add new columns if not exist
let csvContent = fs.readFileSync(csvPath, 'utf8');
let { headers, rows } = parseCSV(csvContent);

const requiredCols = ['ui_class', 'maker_checker_role', 'notification_channel', 'component_id'];
let missingCols = requiredCols.filter(c => !headers.includes(c));

if (missingCols.length > 0) {
  // Add missing columns to CSV
  const newHeaders = [...headers, ...missingCols];
  const newCsvLines = [newHeaders.join(',')];
  
  rows.forEach(row => {
    let newRow = [];
    headers.forEach(h => newRow.push(row[h].includes(',') ? `"${row[h]}"` : row[h]));
    missingCols.forEach(col => {
      let val = 'shared';
      if (col === 'maker_checker_role' || col === 'notification_channel') val = 'none';
      if (col === 'component_id') val = '';
      
      const id = row['id'];
      if (['M02', 'M03', 'M08', 'M10'].includes(id)) {
        if (col === 'ui_class') val = 'executive';
        if (col === 'maker_checker_role') val = 'approver';
        if (col === 'notification_channel') val = 'actionable';
        if (col === 'component_id') val = 'app/persetujuan/page.tsx';
      } else if (['M07', 'M09'].includes(id)) {
        if (col === 'ui_class') val = 'operational';
        if (col === 'maker_checker_role') val = 'maker';
        if (col === 'notification_channel') val = 'informational';
        if (col === 'component_id') val = id === 'M07' ? 'app/kesiswaan/pindah-rombel/page.tsx' : 'app/kesiswaan/mutasi/page.tsx';
      } else if (['M18'].includes(id)) {
        if (col === 'ui_class') val = 'scoped_contributor';
      }
      
      newRow.push(val);
      row[col] = val; // update in memory for next step
    });
    newCsvLines.push(newRow.join(','));
  });
  
  fs.writeFileSync(csvPath, newCsvLines.join('\n'));
  console.log(`Added columns ${missingCols.join(', ')} to contract_matrix.csv`);
  headers = newHeaders;
}

// 2. Generate permission-registry.ts
let registryEntries = [];
let keys = [];

rows.forEach(row => {
  if (row.id === 'M26' || !row.id) return; // Skip portal ortu and empty
  
  // Create a key based on frontend route and action
  let routeParts = row.frontend_route.split('/').filter(x => x && !x.includes('{'));
  let routePrefix = routeParts.length > 0 ? routeParts[0] : 'core';
  let actionSlug = row.action.replace(/[^a-zA-Z0-9_]/g, '_').replace(/_+/g, '_').toLowerCase();
  let key = `${routePrefix}.${actionSlug}`;
  
  let roles = row.layout_guard_roles.split(',').map(r => r.trim()).filter(r => r && r !== 'none');
  if (roles.includes('ALL_AUTHENTICATED')) {
    roles = ['Admin', 'Kamad', 'Operator', 'Guru BK', 'Wali Kelas', 'is_pengajar_aktif'];
  }
  
  keys.push(`"${key}"`);
  
  let uiClass = row.ui_class || 'shared';
  let makerChecker = row.maker_checker_role === 'none' ? 'null' : `"${row.maker_checker_role}"`;
  
  registryEntries.push(`  "${key}": {
    roles: ${JSON.stringify(roles)},
    makerChecker: ${makerChecker},
    uiClass: "${uiClass}",
  },`);
});

const fileContent = `// AUTO-GENERATED dari contract_matrix.csv — JANGAN edit manual.
// Regenerate: \`node scripts/generate-permission-registry.mjs\`

export type PermissionKey =
  | ${keys.join('\n  | ')};

export const PERMISSION_REGISTRY: Record<PermissionKey, {
  roles: string[];
  makerChecker?: "maker" | "checker" | "approver" | null;
  uiClass: "executive" | "operational" | "scoped_contributor" | "shared";
}> = {
${registryEntries.join('\n')}
};
`;

fs.writeFileSync(outPath, fileContent);
console.log('permission-registry.ts generated successfully.');
