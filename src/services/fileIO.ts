import * as XLSX from 'xlsx';
import { CellData, SheetData, WorkbookState, SelectionRange } from '../types/spreadsheet';
import { colIndexToName, colNameToIndex, formatCellAddress } from '../engine/evaluator';

// Type declaration for Electron / Tauri native desktop API
declare global {
  interface Window {
    desktopAPI?: {
      openFileDialog: () => Promise<{ canceled: boolean; filePath?: string; data?: ArrayBuffer }>;
      saveFileDialog: (defaultName: string, data: ArrayBuffer) => Promise<{ success: boolean; filePath?: string }>;
      writeClipboard: (text: string) => Promise<void>;
      readClipboard: () => Promise<string>;
      isElectron?: boolean;
    };
  }
}

/**
 * Parses XLSX / XLS / CSV ArrayBuffer into BioCalc sheets
 */
export function importWorkbookFromBuffer(buffer: ArrayBuffer, fileName: string): { title: string; sheets: SheetData[] } {
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true, cellStyles: true });
  const sheets: SheetData[] = [];

  for (let s = 0; s < wb.SheetNames.length; s++) {
    const sheetName = wb.SheetNames[s];
    const ws = wb.Sheets[sheetName];
    const cells: Record<string, CellData> = {};
    const colWidths: Record<number, number> = {};
    const rowHeights: Record<number, number> = {};

    let maxRow = 40;
    let maxCol = 26;

    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      maxRow = Math.max(range.e.r + 15, 40);
      maxCol = Math.max(range.e.c + 5, 26);

      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddr];
          if (cell) {
            let rawVal = '';
            if (cell.f) {
              rawVal = `=${cell.f}`;
            } else if (cell.w !== undefined) {
              rawVal = String(cell.w);
            } else if (cell.v !== undefined) {
              rawVal = String(cell.v);
            }

            const num = parseFloat(rawVal);
            const computed = !isNaN(num) && !rawVal.startsWith('0') && rawVal.trim() !== '' ? num : rawVal;

            cells[cellAddr] = {
              raw: rawVal,
              formula: cell.f ? `=${cell.f}` : undefined,
              computed: cell.f ? cell.v : computed,
              style: {}
            };
          }
        }
      }
    }

    // Preserve column widths if defined
    if (ws['!cols']) {
      ws['!cols'].forEach((col, idx) => {
        if (col && col.wpx) {
          colWidths[idx] = Math.max(col.wpx, 60);
        } else if (col && col.wch) {
          colWidths[idx] = Math.max(col.wch * 8.5, 60);
        }
      });
    }

    sheets.push({
      id: `sheet-${s + 1}-${Date.now()}`,
      name: sheetName,
      cells,
      colWidths,
      rowHeights,
      rowCount: maxRow,
      colCount: maxCol,
      frozenRows: 0,
      frozenCols: 0,
    });
  }

  return {
    title: fileName || 'Untitled.xlsx',
    sheets: sheets.length ? sheets : [createEmptySheet('Sheet1')]
  };
}

/**
 * Creates an empty default sheet
 */
export function createEmptySheet(name: string): SheetData {
  return {
    id: `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name,
    cells: {},
    colWidths: {},
    rowHeights: {},
    rowCount: 50,
    colCount: 26,
    frozenRows: 0,
    frozenCols: 0,
  };
}

/**
 * Exports all sheets to an Excel (.xlsx) file buffer and triggers download or native save
 */
export async function exportWorkbookToXLSX(workbook: { title: string; sheets: SheetData[] }): Promise<void> {
  const wb = XLSX.utils.book_new();

  for (const sheet of workbook.sheets) {
    const dataMatrix: (string | number)[][] = [];

    // Find actual bounds
    let maxR = 0;
    let maxC = 0;
    for (const [key, cell] of Object.entries(sheet.cells)) {
      if (cell && (cell.raw || cell.computed !== undefined)) {
        const match = key.match(/^([A-Z]+)([0-9]+)$/);
        if (match) {
          const c = colNameToIndex(match[1]);
          const r = parseInt(match[2], 10) - 1;
          if (r > maxR) maxR = r;
          if (c > maxC) maxC = c;
        }
      }
    }

    const boundR = Math.max(maxR + 1, 10);
    const boundC = Math.max(maxC + 1, 6);

    for (let r = 0; r < boundR; r++) {
      const rowArr: (string | number)[] = [];
      for (let c = 0; c < boundC; c++) {
        const addr = formatCellAddress(c, r);
        const cell = sheet.cells[addr];
        if (!cell) {
          rowArr.push('');
        } else if (cell.computed !== undefined && typeof cell.computed === 'number') {
          rowArr.push(cell.computed);
        } else {
          rowArr.push(cell.raw || '');
        }
      }
      dataMatrix.push(rowArr);
    }

    const ws = XLSX.utils.aoa_to_sheet(dataMatrix);

    // Apply column widths
    const cols = [];
    for (let c = 0; c < boundC; c++) {
      const w = sheet.colWidths[c] || 96;
      cols.push({ wpx: w });
    }
    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const fileName = workbook.title.endsWith('.xlsx') ? workbook.title : `${workbook.title}.xlsx`;

  // Check if running inside native Electron / Tauri desktop app
  if (window.desktopAPI?.saveFileDialog) {
    await window.desktopAPI.saveFileDialog(fileName, wbout);
    return;
  }

  // Check Modern Browser File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Excel Workbook (*.xlsx)',
          accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(wbout);
      await writable.close();
      return;
    } catch (err: any) {
      if (err.name === 'AbortError') return; // User cancelled
    }
  }

  // Fallback: standard web download
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports current sheet as CSV file
 */
export async function exportSheetToCSV(sheet: SheetData, baseTitle: string): Promise<void> {
  let maxR = 0;
  let maxC = 0;
  for (const [key, cell] of Object.entries(sheet.cells)) {
    if (cell && (cell.raw || cell.computed !== undefined)) {
      const match = key.match(/^([A-Z]+)([0-9]+)$/);
      if (match) {
        const c = colNameToIndex(match[1]);
        const r = parseInt(match[2], 10) - 1;
        if (r > maxR) maxR = r;
        if (c > maxC) maxC = c;
      }
    }
  }

  const boundR = Math.max(maxR + 1, 5);
  const boundC = Math.max(maxC + 1, 5);
  const dataMatrix: string[][] = [];

  for (let r = 0; r < boundR; r++) {
    const rowArr: string[] = [];
    for (let c = 0; c < boundC; c++) {
      const addr = formatCellAddress(c, r);
      const cell = sheet.cells[addr];
      const val = cell ? (cell.computed !== undefined ? String(cell.computed) : (cell.raw || '')) : '';
      rowArr.push(val);
    }
    dataMatrix.push(rowArr);
  }

  const ws = XLSX.utils.aoa_to_sheet(dataMatrix);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const fileName = `${baseTitle.replace(/\.xlsx$/i, '')}_${sheet.name}.csv`;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copies selected range to OS clipboard in Excel TSV format
 */
export async function copyRangeToClipboard(sheet: SheetData, range: SelectionRange): Promise<void> {
  const rows: string[] = [];
  const minR = Math.min(range.startRow, range.endRow);
  const maxR = Math.max(range.startRow, range.endRow);
  const minC = Math.min(range.startCol, range.endCol);
  const maxC = Math.max(range.startCol, range.endCol);

  for (let r = minR; r <= maxR; r++) {
    const rowVals: string[] = [];
    for (let c = minC; c <= maxC; c++) {
      const addr = formatCellAddress(c, r);
      const cell = sheet.cells[addr];
      const val = cell ? (cell.computed !== undefined ? String(cell.computed) : cell.raw) : '';
      rowVals.push(val);
    }
    rows.push(rowVals.join('\t'));
  }

  const tsv = rows.join('\n');
  try {
    await navigator.clipboard.writeText(tsv);
  } catch {
    // fallback
  }
}

/**
 * Parses OS clipboard TSV text into cells
 */
export function parseClipboardTSV(text: string): string[][] {
  if (!text) return [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop(); // remove trailing empty newline
  }
  return lines.map(line => line.split('\t'));
}
