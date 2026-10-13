import { CellData, SheetData } from '../types/spreadsheet';
import {
  calculateGCContent,
  reverseComplement,
  translateDNA,
  calculateMolecularWeight,
  BIO_KNOWLEDGE_BASE
} from './bioFormulas';

export function colIndexToName(index: number): string {
  let colName = '';
  let dividend = index + 1;
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    colName = String.fromCharCode(65 + modulo) + colName;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return colName;
}

export function colNameToIndex(name: string): number {
  let index = 0;
  const upper = name.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function parseCellAddress(addr: string): { col: number; row: number } | null {
  const match = addr.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  return {
    col: colNameToIndex(match[1]),
    row: parseInt(match[2], 10) - 1, // 0-based
  };
}

export function formatCellAddress(col: number, row: number): string {
  return `${colIndexToName(col)}${row + 1}`;
}

export function parseRange(rangeStr: string): { startCol: number; startRow: number; endCol: number; endRow: number } | null {
  const parts = rangeStr.split(':');
  if (parts.length === 1) {
    const p = parseCellAddress(parts[0]);
    if (!p) return null;
    return { startCol: p.col, startRow: p.row, endCol: p.col, endRow: p.row };
  }
  if (parts.length === 2) {
    const p1 = parseCellAddress(parts[0]);
    const p2 = parseCellAddress(parts[1]);
    if (!p1 || !p2) return null;
    return {
      startCol: Math.min(p1.col, p2.col),
      startRow: Math.min(p1.row, p2.row),
      endCol: Math.max(p1.col, p2.col),
      endRow: Math.max(p1.row, p2.row),
    };
  }
  return null;
}

export class SpreadsheetEvaluator {
  private cells: Record<string, CellData>;
  private evaluatingStack: Set<string> = new Set();

  constructor(sheet: SheetData) {
    this.cells = sheet.cells || {};
  }

  public getCellValue(address: string): any {
    const key = address.trim().toUpperCase();
    const cell = this.cells[key];
    if (!cell) return 0;
    if (cell.computed !== undefined && cell.computed !== null) {
      return cell.computed;
    }
    if (cell.raw.startsWith('=')) {
      return this.evaluateFormula(cell.raw, key);
    }
    const num = parseFloat(cell.raw);
    return isNaN(num) ? cell.raw : num;
  }

  public getRangeValues(rangeStr: string): any[] {
    const range = parseRange(rangeStr);
    if (!range) return [];
    const vals: any[] = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
      for (let c = range.startCol; c <= range.endCol; c++) {
        const addr = formatCellAddress(c, r);
        const cell = this.cells[addr];
        if (cell) {
          const val = cell.computed !== undefined ? cell.computed : (cell.raw.startsWith('=') ? this.evaluateFormula(cell.raw, addr) : cell.raw);
          vals.push(val);
        } else {
          vals.push(0);
        }
      }
    }
    return vals;
  }

  public getRange2D(rangeStr: string): any[][] {
    const range = parseRange(rangeStr);
    if (!range) return [];
    const matrix: any[][] = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
      const rowVals: any[] = [];
      for (let c = range.startCol; c <= range.endCol; c++) {
        const addr = formatCellAddress(c, r);
        const cell = this.cells[addr];
        if (cell) {
          const val = cell.computed !== undefined ? cell.computed : (cell.raw.startsWith('=') ? this.evaluateFormula(cell.raw, addr) : cell.raw);
          rowVals.push(val);
        } else {
          rowVals.push(null);
        }
      }
      matrix.push(rowVals);
    }
    return matrix;
  }

  public evaluateFormula(formula: string, currentCellKey?: string): any {
    if (!formula.startsWith('=')) return formula;
    const expr = formula.substring(1).trim();

    if (currentCellKey) {
      if (this.evaluatingStack.has(currentCellKey)) {
        return '#CYCLE!';
      }
      this.evaluatingStack.add(currentCellKey);
    }

    try {
      const result = this.parseExpression(expr);
      if (currentCellKey) {
        this.evaluatingStack.delete(currentCellKey);
      }
      return result;
    } catch (err) {
      if (currentCellKey) {
        this.evaluatingStack.delete(currentCellKey);
      }
      return '#ERROR!';
    }
  }

  private parseExpression(expr: string): any {
    const trimmed = expr.trim();
    if (!trimmed) return '';

    // Function call e.g. SUM(...) or VLOOKUP(...)
    const fnMatch = trimmed.match(/^([A-Z0-9_\.]+)\s*\((.*)\)$/i);
    if (fnMatch) {
      const fnName = fnMatch[1].toUpperCase();
      const argsRaw = this.splitFunctionArgs(fnMatch[2]);
      return this.executeFunction(fnName, argsRaw);
    }

    // Mathematical or arithmetic expression with operators (+, -, *, /, ^)
    // Replace cell references (like A1, B12) with values first if simple
    const resolved = this.resolveCellRefsInMath(trimmed);

    try {
      // Evaluate basic arithmetic safely
      if (/^[\d\s\+\-\*\/\(\)\.\^><=!&|"'%]+$/.test(resolved)) {
        // Convert ^ to ** for Javascript math
        const jsMath = resolved.replace(/\^/g, '**');
        // eslint-disable-next-line no-new-func
        const fn = new Function(`"use strict"; return (${jsMath});`);
        const res = fn();
        if (typeof res === 'number') {
          return isFinite(res) ? (Number.isInteger(res) ? res : parseFloat(res.toFixed(6))) : '#DIV/0!';
        }
        return res;
      }
    } catch {
      // ignore, fallback
    }

    // If single cell reference like A1
    if (/^[A-Z]+[0-9]+$/i.test(trimmed)) {
      return this.getCellValue(trimmed);
    }

    return trimmed;
  }

  private splitFunctionArgs(argsString: string): string[] {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inQuote = false;

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      if (char === '"' || char === "'") {
        inQuote = !inQuote;
        current += char;
      } else if (char === '(' && !inQuote) {
        depth++;
        current += char;
      } else if (char === ')' && !inQuote) {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0 && !inQuote) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    if (current.trim().length > 0) {
      args.push(current.trim());
    }
    return args;
  }

  private resolveCellRefsInMath(mathStr: string): string {
    return mathStr.replace(/([A-Z]+[0-9]+)(?![A-Z0-9_])/gi, (match) => {
      const val = this.getCellValue(match);
      if (typeof val === 'number') return String(val);
      if (typeof val === 'string') {
        const num = parseFloat(val);
        if (!isNaN(num)) return String(num);
        return `"${val.replace(/"/g, '\\"')}"`;
      }
      return '0';
    });
  }

  private executeFunction(fnName: string, rawArgs: string[]): any {
    // Collect numeric values from ranges or expressions
    const getNumbers = (args: string[]): number[] => {
      const nums: number[] = [];
      for (const a of args) {
        if (a.includes(':')) {
          const vals = this.getRangeValues(a);
          for (const v of vals) {
            const n = parseFloat(v);
            if (!isNaN(n)) nums.push(n);
          }
        } else {
          const evalVal = this.parseExpression(a);
          const n = parseFloat(evalVal);
          if (!isNaN(n)) nums.push(n);
        }
      }
      return nums;
    };

    switch (fnName) {
      case 'SUM': {
        const nums = getNumbers(rawArgs);
        return nums.reduce((a, b) => a + b, 0);
      }

      case 'AVERAGE': {
        const nums = getNumbers(rawArgs);
        if (!nums.length) return 0;
        const sum = nums.reduce((a, b) => a + b, 0);
        return parseFloat((sum / nums.length).toFixed(4));
      }

      case 'COUNT': {
        const nums = getNumbers(rawArgs);
        return nums.length;
      }

      case 'COUNTA': {
        let count = 0;
        for (const a of rawArgs) {
          if (a.includes(':')) {
            const vals = this.getRangeValues(a);
            count += vals.filter(v => v !== null && v !== '' && v !== undefined).length;
          } else {
            const v = this.parseExpression(a);
            if (v !== null && v !== '' && v !== undefined) count++;
          }
        }
        return count;
      }

      case 'MIN': {
        const nums = getNumbers(rawArgs);
        return nums.length ? Math.min(...nums) : 0;
      }

      case 'MAX': {
        const nums = getNumbers(rawArgs);
        return nums.length ? Math.max(...nums) : 0;
      }

      case 'PRODUCT': {
        const nums = getNumbers(rawArgs);
        if (!nums.length) return 0;
        return nums.reduce((a, b) => a * b, 1);
      }

      case 'MEDIAN': {
        const nums = getNumbers(rawArgs).sort((a, b) => a - b);
        if (!nums.length) return 0;
        const mid = Math.floor(nums.length / 2);
        return nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      }

      case 'STDEV':
      case 'STDEV.S': {
        const nums = getNumbers(rawArgs);
        if (nums.length <= 1) return 0;
        const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
        const squareDiffs = nums.map(v => Math.pow(v - avg, 2));
        const variance = squareDiffs.reduce((a, b) => a + b, 0) / (nums.length - 1);
        return parseFloat(Math.sqrt(variance).toFixed(4));
      }

      case 'IF': {
        if (rawArgs.length < 2) return '#N/A';
        const cond = this.parseExpression(rawArgs[0]);
        const isTrue = cond === true || cond === 'true' || cond === 1 || Boolean(cond);
        if (isTrue) {
          return this.parseExpression(rawArgs[1]);
        }
        return rawArgs[2] ? this.parseExpression(rawArgs[2]) : false;
      }

      case 'AND': {
        for (const a of rawArgs) {
          const val = this.parseExpression(a);
          if (!val) return false;
        }
        return true;
      }

      case 'OR': {
        for (const a of rawArgs) {
          const val = this.parseExpression(a);
          if (val) return true;
        }
        return false;
      }

      case 'NOT': {
        const val = this.parseExpression(rawArgs[0]);
        return !val;
      }

      case 'VLOOKUP': {
        if (rawArgs.length < 3) return '#N/A';
        const lookupVal = this.parseExpression(rawArgs[0]);
        const rangeStr = rawArgs[1];
        const colIdx = parseInt(this.parseExpression(rawArgs[2]), 10) - 1; // 1-based index in Excel
        const table = this.getRange2D(rangeStr);

        for (const row of table) {
          if (row.length > 0 && String(row[0]).toLowerCase() === String(lookupVal).toLowerCase()) {
            return row[colIdx] !== undefined ? row[colIdx] : '#REF!';
          }
        }
        return '#N/A';
      }

      case 'XLOOKUP': {
        if (rawArgs.length < 3) return '#N/A';
        const lookupVal = this.parseExpression(rawArgs[0]);
        const lookupArr = this.getRangeValues(rawArgs[1]);
        const returnArr = this.getRangeValues(rawArgs[2]);
        const ifNotFound = rawArgs[3] ? this.parseExpression(rawArgs[3]) : '#N/A';

        for (let i = 0; i < lookupArr.length; i++) {
          if (String(lookupArr[i]).toLowerCase() === String(lookupVal).toLowerCase()) {
            return returnArr[i] !== undefined ? returnArr[i] : '#REF!';
          }
        }
        return ifNotFound;
      }

      case 'INDEX': {
        if (rawArgs.length < 2) return '#N/A';
        const table = this.getRange2D(rawArgs[0]);
        const rowIdx = parseInt(this.parseExpression(rawArgs[1]), 10) - 1;
        const colIdx = rawArgs[2] ? parseInt(this.parseExpression(rawArgs[2]), 10) - 1 : 0;
        if (table[rowIdx] && table[rowIdx][colIdx] !== undefined) {
          return table[rowIdx][colIdx];
        }
        return '#REF!';
      }

      case 'MATCH': {
        if (rawArgs.length < 2) return '#N/A';
        const lookupVal = this.parseExpression(rawArgs[0]);
        const arr = this.getRangeValues(rawArgs[1]);
        for (let i = 0; i < arr.length; i++) {
          if (String(arr[i]).toLowerCase() === String(lookupVal).toLowerCase()) {
            return i + 1; // 1-based index in Excel
          }
        }
        return '#N/A';
      }

      case 'CONCATENATE':
      case 'CONCAT': {
        let str = '';
        for (const a of rawArgs) {
          if (a.includes(':')) {
            str += this.getRangeValues(a).join('');
          } else {
            str += String(this.parseExpression(a));
          }
        }
        return str;
      }

      case 'UPPER':
        return String(this.parseExpression(rawArgs[0]) || '').toUpperCase();

      case 'LOWER':
        return String(this.parseExpression(rawArgs[0]) || '').toLowerCase();

      case 'TRIM':
        return String(this.parseExpression(rawArgs[0]) || '').trim();

      case 'LEN':
        return String(this.parseExpression(rawArgs[0]) || '').length;

      case 'LEFT': {
        const s = String(this.parseExpression(rawArgs[0]) || '');
        const n = rawArgs[1] ? parseInt(this.parseExpression(rawArgs[1]), 10) : 1;
        return s.substring(0, n);
      }

      case 'RIGHT': {
        const s = String(this.parseExpression(rawArgs[0]) || '');
        const n = rawArgs[1] ? parseInt(this.parseExpression(rawArgs[1]), 10) : 1;
        return s.substring(s.length - n);
      }

      case 'ROUND': {
        const n = parseFloat(this.parseExpression(rawArgs[0]));
        const decimals = rawArgs[1] ? parseInt(this.parseExpression(rawArgs[1]), 10) : 0;
        return isNaN(n) ? '#VALUE!' : parseFloat(n.toFixed(decimals));
      }

      case 'ABS':
        return Math.abs(parseFloat(this.parseExpression(rawArgs[0])));

      case 'SQRT': {
        const n = parseFloat(this.parseExpression(rawArgs[0]));
        return n >= 0 ? parseFloat(Math.sqrt(n).toFixed(6)) : '#NUM!';
      }

      case 'POWER': {
        const b = parseFloat(this.parseExpression(rawArgs[0]));
        const p = parseFloat(this.parseExpression(rawArgs[1]));
        return parseFloat(Math.pow(b, p).toFixed(6));
      }

      case 'EXP':
        return parseFloat(Math.exp(parseFloat(this.parseExpression(rawArgs[0]))).toFixed(6));

      case 'LN': {
        const n = parseFloat(this.parseExpression(rawArgs[0]));
        return n > 0 ? parseFloat(Math.log(n).toFixed(6)) : '#NUM!';
      }

      case 'LOG10': {
        const n = parseFloat(this.parseExpression(rawArgs[0]));
        return n > 0 ? parseFloat(Math.log10(n).toFixed(6)) : '#NUM!';
      }

      // ==========================================
      // BIO SCIENCE & BIOINFORMATICS FORMULAS
      // ==========================================
      case 'GC_CONTENT': {
        const seq = String(this.parseExpression(rawArgs[0]) || '');
        return calculateGCContent(seq);
      }

      case 'COMPLEMENT': {
        const seq = String(this.parseExpression(rawArgs[0]) || '');
        return reverseComplement(seq);
      }

      case 'TRANSLATE': {
        const seq = String(this.parseExpression(rawArgs[0]) || '');
        return translateDNA(seq);
      }

      case 'MOLECULAR_WEIGHT': {
        const str = String(this.parseExpression(rawArgs[0]) || '');
        return calculateMolecularWeight(str);
      }

      case 'BIO_INFO': {
        const query = String(this.parseExpression(rawArgs[0]) || '').toUpperCase().trim();
        const field = rawArgs[1] ? String(this.parseExpression(rawArgs[1]) || '').toLowerCase().trim() : 'name';
        const entry = BIO_KNOWLEDGE_BASE[query];
        if (!entry) return '#NOT_FOUND';
        switch (field) {
          case 'name': return entry.name;
          case 'gene': return entry.gene || entry.name;
          case 'uniprot': return entry.uniprot || 'N/A';
          case 'pdb': return entry.pdb || 'N/A';
          case 'organism': return entry.organism || 'N/A';
          case 'length': return entry.length || 'N/A';
          case 'mw': return entry.mw || 'N/A';
          case 'formula': return entry.formula || 'N/A';
          case 'smiles': return entry.smiles || 'N/A';
          case 'logp': return entry.logP !== undefined ? entry.logP : 'N/A';
          case 'ic50': return entry.ic50 || 'N/A';
          case 'function': return entry.functionDesc || 'N/A';
          default: return entry.name;
        }
      }

      case 'SPARKLINE': {
        if (!rawArgs.length) return '#N/A';
        const rangeArg = rawArgs[0];
        const nums: number[] = [];
        if (rangeArg.includes(':')) {
          const vals = this.getRangeValues(rangeArg);
          for (const v of vals) {
            const n = parseFloat(v);
            if (!isNaN(n)) nums.push(n);
          }
        } else {
          const evalVal = this.parseExpression(rangeArg);
          const n = parseFloat(evalVal);
          if (!isNaN(n)) nums.push(n);
        }

        const typeRaw = rawArgs[1]
          ? String(this.parseExpression(rawArgs[1]) || '')
              .toLowerCase()
              .replace(/['"]/g, '')
              .trim()
          : 'line';
        const type = typeRaw === 'bar' || typeRaw === 'column' ? 'bar' : 'line';
        const color = rawArgs[2]
          ? String(this.parseExpression(rawArgs[2]) || '')
              .replace(/['"]/g, '')
              .trim()
          : '#107c41';

        return {
          type,
          data: nums,
          color,
        };
      }

      default:
        return `#NAME? (${fnName})`;
    }
  }

  public recalculateAll(): Record<string, CellData> {
    const updated: Record<string, CellData> = {};
    for (const [key, cell] of Object.entries(this.cells)) {
      if (!cell) continue;
      if (cell.raw && cell.raw.startsWith('=')) {
        const res = this.evaluateFormula(cell.raw, key);
        const isSparklineObj = res && typeof res === 'object' && 'type' in res && 'data' in res;
        updated[key] = {
          ...cell,
          computed: res,
          sparkline: isSparklineObj ? res : cell.sparkline,
          error: typeof res === 'string' && res.startsWith('#') ? res : undefined
        };
      } else {
        const num = parseFloat(cell.raw);
        updated[key] = {
          ...cell,
          computed: !isNaN(num) && !cell.raw.trim().startsWith('0') && cell.raw.trim() !== '' ? num : cell.raw
        };
      }
    }
    return updated;
  }
}
