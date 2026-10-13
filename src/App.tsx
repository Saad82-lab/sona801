import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  WorkbookState,
  SheetData,
  CellCoords,
  SelectionRange,
  CellData,
  CellStyle,
  CellFormat,
  DataValidationRule,
} from './types/spreadsheet';
import {
  createEmptySheet,
  importWorkbookFromBuffer,
  exportWorkbookToXLSX,
  exportSheetToCSV,
  copyRangeToClipboard,
  parseClipboardTSV,
} from './services/fileIO';
import { SpreadsheetEvaluator, formatCellAddress, parseCellAddress, colNameToIndex } from './engine/evaluator';
import { validateCellValue } from './engine/validation';
import { BIO_TEMPLATES } from './services/bioDataService';

import { Titlebar } from './components/Titlebar';
import { Ribbon } from './components/Ribbon';
import { FormulaBar } from './components/FormulaBar';
import { Grid } from './components/Grid';
import { SheetTabs } from './components/SheetTabs';
import { ContextMenu } from './components/ContextMenu';
import { ChartModal } from './components/ChartModal';
import { MolecularViewerModal } from './components/MolecularViewerModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { DesktopExportModal } from './components/DesktopExportModal';
import { DataValidationModal } from './components/DataValidationModal';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  // Initial pre-loaded publication-grade research workbook
  const initialSheets: SheetData[] = [
    {
      id: 'sheet-1-genomics',
      name: 'Oncology_Targets',
      cells: {
        'A1': { raw: 'Gene Target', computed: 'Gene Target', style: { bold: true, bg: '#f1f5f9', align: 'left' } },
        'B1': { raw: 'UniProt Acc', computed: 'UniProt Acc', style: { bold: true, bg: '#f1f5f9', align: 'left' } },
        'C1': { raw: 'PDB Structure', computed: 'PDB Structure', style: { bold: true, bg: '#f1f5f9', align: 'left' } },
        'D1': { raw: 'Chromosome', computed: 'Chromosome', style: { bold: true, bg: '#f1f5f9', align: 'left' } },
        'E1': { raw: 'Log2 Fold Change', computed: 'Log2 Fold Change', style: { bold: true, bg: '#f1f5f9', align: 'right' } },
        'F1': { raw: 'p-value', computed: 'p-value', style: { bold: true, bg: '#f1f5f9', align: 'right' } },
        'G1': { raw: 'Clinical Class', computed: 'Clinical Class', style: { bold: true, bg: '#f1f5f9', align: 'center' } },
        'H1': { raw: 'Fold Change Sparkline', computed: 'Fold Change Sparkline', style: { bold: true, bg: '#f1f5f9', align: 'center' } },

        'A2': { raw: 'TP53', computed: 'TP53' },
        'B2': { raw: 'P04637', computed: 'P04637' },
        'C2': { raw: '1TUP', computed: '1TUP' },
        'D2': { raw: '17p13.1', computed: '17p13.1' },
        'E2': { raw: '-3.42', computed: -3.42, style: { color: '#dc2626', bold: true } },
        'F2': { raw: '0.00010', computed: 0.0001, format: 'decimal_2' },
        'G2': {
          raw: 'Tumor Suppressor',
          computed: 'Tumor Suppressor',
          style: { color: '#059669' },
          validation: {
            type: 'list',
            formula1: 'Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase, Lipid Phosphatase, Ser/Thr Kinase, Gain of Function, Amplification',
            showDropdown: true,
            allowBlank: true,
            errorTitle: 'Invalid Clinical Class',
            errorMessage: 'Please select an approved category from the predefined Clinical Class list.'
          }
        },
        'H2': {
          raw: '=SPARKLINE(E2:E7, "line")',
          computed: { type: 'line', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#107c41' },
          sparkline: { type: 'line', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#107c41' }
        },

        'A3': { raw: 'EGFR', computed: 'EGFR' },
        'B3': { raw: 'P00533', computed: 'P00533' },
        'C3': { raw: '1M17', computed: '1M17' },
        'D3': { raw: '7p11.2', computed: '7p11.2' },
        'E3': { raw: '4.15', computed: 4.15, style: { color: '#16a34a', bold: true } },
        'F3': { raw: '0.00002', computed: 0.00002, format: 'decimal_2' },
        'G3': {
          raw: 'Receptor Kinase',
          computed: 'Receptor Kinase',
          validation: {
            type: 'list',
            formula1: 'Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase, Lipid Phosphatase, Ser/Thr Kinase, Gain of Function, Amplification',
            showDropdown: true,
            allowBlank: true,
            errorTitle: 'Invalid Clinical Class',
            errorMessage: 'Please select an approved category from the predefined Clinical Class list.'
          }
        },
        'H3': {
          raw: '=SPARKLINE(E2:E7, "bar")',
          computed: { type: 'bar', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#107c41' },
          sparkline: { type: 'bar', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#107c41' }
        },

        'A4': { raw: 'BRCA1', computed: 'BRCA1' },
        'B4': { raw: 'P38398', computed: 'P38398' },
        'C4': { raw: '1JM7', computed: '1JM7' },
        'D4': { raw: '17q21.31', computed: '17q21.31' },
        'E4': { raw: '-2.85', computed: -2.85, style: { color: '#dc2626', bold: true } },
        'F4': { raw: '0.00040', computed: 0.0004, format: 'decimal_2' },
        'G4': {
          raw: 'DNA Repair',
          computed: 'DNA Repair',
          validation: {
            type: 'list',
            formula1: 'Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase, Lipid Phosphatase, Ser/Thr Kinase, Gain of Function, Amplification',
            showDropdown: true,
            allowBlank: true,
            errorTitle: 'Invalid Clinical Class',
            errorMessage: 'Please select an approved category from the predefined Clinical Class list.'
          }
        },
        'H4': {
          raw: '=SPARKLINE(E2:E7, "line", "#2563eb")',
          computed: { type: 'line', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#2563eb' },
          sparkline: { type: 'line', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#2563eb' }
        },

        'A5': { raw: 'KRAS', computed: 'KRAS' },
        'B5': { raw: 'P01116', computed: 'P01116' },
        'C5': { raw: '4OBE', computed: '4OBE' },
        'D5': { raw: '12p12.1', computed: '12p12.1' },
        'E5': { raw: '3.88', computed: 3.88, style: { color: '#16a34a', bold: true } },
        'F5': { raw: '0.00005', computed: 0.00005, format: 'decimal_2' },
        'G5': {
          raw: 'Small GTPase',
          computed: 'Small GTPase',
          validation: {
            type: 'list',
            formula1: 'Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase, Lipid Phosphatase, Ser/Thr Kinase, Gain of Function, Amplification',
            showDropdown: true,
            allowBlank: true,
            errorTitle: 'Invalid Clinical Class',
            errorMessage: 'Please select an approved category from the predefined Clinical Class list.'
          }
        },
        'H5': {
          raw: '=SPARKLINE(E2:E7, "bar", "#059669")',
          computed: { type: 'bar', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#059669' },
          sparkline: { type: 'bar', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#059669' }
        },

        'A6': { raw: 'PTEN', computed: 'PTEN' },
        'B6': { raw: 'P60484', computed: 'P60484' },
        'C6': { raw: '1D5R', computed: '1D5R' },
        'D6': { raw: '10q23.31', computed: '10q23.31' },
        'E6': { raw: '-4.10', computed: -4.10, style: { color: '#dc2626', bold: true } },
        'F6': { raw: '0.00001', computed: 0.00001, format: 'decimal_2' },
        'G6': {
          raw: 'Lipid Phosphatase',
          computed: 'Lipid Phosphatase',
          validation: {
            type: 'list',
            formula1: 'Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase, Lipid Phosphatase, Ser/Thr Kinase, Gain of Function, Amplification',
            showDropdown: true,
            allowBlank: true,
            errorTitle: 'Invalid Clinical Class',
            errorMessage: 'Please select an approved category from the predefined Clinical Class list.'
          }
        },
        'H6': {
          raw: '=SPARKLINE(E2:E7, "line", "#9334e6")',
          computed: { type: 'line', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#9334e6' },
          sparkline: { type: 'line', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#9334e6' }
        },

        'A7': { raw: 'BRAF', computed: 'BRAF' },
        'B7': { raw: 'P15056', computed: 'P15056' },
        'C7': { raw: '4MNE', computed: '4MNE' },
        'D7': { raw: '7q34', computed: '7q34' },
        'E7': { raw: '2.94', computed: 2.94, style: { color: '#16a34a', bold: true } },
        'F7': { raw: '0.00080', computed: 0.0008, format: 'decimal_2' },
        'G7': {
          raw: 'Ser/Thr Kinase',
          computed: 'Ser/Thr Kinase',
          validation: {
            type: 'list',
            formula1: 'Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase, Lipid Phosphatase, Ser/Thr Kinase, Gain of Function, Amplification',
            showDropdown: true,
            allowBlank: true,
            errorTitle: 'Invalid Clinical Class',
            errorMessage: 'Please select an approved category from the predefined Clinical Class list.'
          }
        },
        'H7': {
          raw: '=SPARKLINE(E2:E7, "bar", "#e8710a")',
          computed: { type: 'bar', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#e8710a' },
          sparkline: { type: 'bar', data: [-3.42, 4.15, -2.85, 3.88, -4.10, 2.94], color: '#e8710a' }
        },

        // Formula Rows
        'A9': { raw: 'Average Fold Change:', computed: 'Average Fold Change:', style: { bold: true } },
        'E9': { raw: '=AVERAGE(E2:E7)', computed: 0.1, style: { bold: true, bg: '#dcfce7' } },

        'A10': { raw: 'Standard Deviation:', computed: 'Standard Deviation:', style: { bold: true } },
        'E10': { raw: '=STDEV(E2:E7)', computed: 3.73, style: { bold: true } },

        'A11': { raw: 'Sequence GC% Test:', computed: 'Sequence GC% Test:', style: { bold: true } },
        'B11': { raw: '=GC_CONTENT("ATGCGATCGATCGATC")', computed: 50, style: { bold: true, color: '#107c41' } },
      },
      colWidths: { 0: 130, 1: 120, 2: 120, 3: 110, 4: 150, 5: 110, 6: 160, 7: 160 },
      rowHeights: {},
      rowCount: 50,
      colCount: 26,
      frozenRows: 1,
      frozenCols: 0,
    },
    {
      id: 'sheet-2-drugs',
      name: 'Kinase_Screen',
      cells: {
        'A1': { raw: 'Compound Name', computed: 'Compound Name', style: { bold: true, bg: '#f1f5f9' } },
        'B1': { raw: 'Formula', computed: 'Formula', style: { bold: true, bg: '#f1f5f9' } },
        'C1': { raw: 'Molecular Weight', computed: 'Molecular Weight', style: { bold: true, bg: '#f1f5f9' } },
        'D1': { raw: 'Target Kinase', computed: 'Target Kinase', style: { bold: true, bg: '#f1f5f9' } },
        'E1': { raw: 'IC50 (nM)', computed: 'IC50 (nM)', style: { bold: true, bg: '#f1f5f9' } },
        'F1': { raw: 'Clinical Status', computed: 'Clinical Status', style: { bold: true, bg: '#f1f5f9' } },

        'A2': { raw: 'Imatinib', computed: 'Imatinib' },
        'B2': { raw: 'C29H31N7O', computed: 'C29H31N7O' },
        'C2': { raw: '493.60', computed: 493.60 },
        'D2': { raw: 'BCR-ABL1', computed: 'BCR-ABL1' },
        'E2': { raw: '25.4', computed: 25.4 },
        'F2': { raw: 'FDA Approved', computed: 'FDA Approved', style: { color: '#059669', bold: true } },

        'A3': { raw: 'Erlotinib', computed: 'Erlotinib' },
        'B3': { raw: 'C22H23N3O4', computed: 'C22H23N3O4' },
        'C3': { raw: '393.44', computed: 393.44 },
        'D3': { raw: 'EGFR', computed: 'EGFR' },
        'E3': { raw: '2.0', computed: 2.0 },
        'F3': { raw: 'FDA Approved', computed: 'FDA Approved', style: { color: '#059669', bold: true } },

        'A4': { raw: 'Gefitinib', computed: 'Gefitinib' },
        'B4': { raw: 'C22H24ClFN4O3', computed: 'C22H24ClFN4O3' },
        'C4': { raw: '446.90', computed: 446.90 },
        'D4': { raw: 'EGFR', computed: 'EGFR' },
        'E4': { raw: '3.3', computed: 3.3 },
        'F4': { raw: 'FDA Approved', computed: 'FDA Approved', style: { color: '#059669', bold: true } },

        'A5': { raw: 'Min IC50:', computed: 'Min IC50:', style: { bold: true } },
        'E5': { raw: '=MIN(E2:E4)', computed: 2.0, style: { bold: true, color: '#107c41' } }
      },
      colWidths: { 0: 130, 1: 130, 2: 130, 3: 130, 4: 110, 5: 140 },
      rowHeights: {},
      rowCount: 50,
      colCount: 26,
      frozenRows: 1,
      frozenCols: 0,
    }
  ];

  // Core Workbook State
  const [workbook, setWorkbook] = useState<WorkbookState>({
    title: 'BioCalc_Oncology_Study.xlsx',
    sheets: initialSheets,
    activeSheetId: initialSheets[0].id,
    selection: { startRow: 0, startCol: 0, endRow: 0, endCol: 0 },
    activeCell: { col: 0, row: 0 },
    isEditing: false,
    editValue: '',
    clipboard: null,
    history: { past: [], future: [] },
    zoom: 1.0,
    showGridlines: true,
    showHeaders: true,
    darkMode: false,
  });

  const [activeRibbonTab, setActiveRibbonTab] = useState('home');
  const [isDirty, setIsDirty] = useState(false);

  // Modals state
  const [chartModalOpen, setChartModalOpen] = useState(false);
  const [chartModalType, setChartModalType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [molecularViewerOpen, setMolecularViewerOpen] = useState(false);
  const [molecularQuery, setMolecularQuery] = useState('1TUP');
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [desktopGuideOpen, setDesktopGuideOpen] = useState(false);
  const [dataValidationOpen, setDataValidationOpen] = useState(false);
  const [validationAlert, setValidationAlert] = useState<{
    open: boolean;
    title: string;
    message: string;
    pendingValue?: string;
  } | null>(null);

  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    target: { type: 'cell' | 'row' | 'col'; index?: number; cellId?: string };
  }>({ visible: false, x: 0, y: 0, target: { type: 'cell' } });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Current active sheet
  const currentSheet = React.useMemo(() => {
    return workbook.sheets.find((s) => s.id === workbook.activeSheetId) || workbook.sheets[0];
  }, [workbook.sheets, workbook.activeSheetId]);

  // Active cell data
  const activeCellAddress = formatCellAddress(workbook.activeCell.col, workbook.activeCell.row);
  const activeCellData = currentSheet.cells[activeCellAddress];

  // Recalculate sheet formulas whenever sheet data changes
  const evaluateCurrentSheet = useCallback((sheet: SheetData): SheetData => {
    const evaluator = new SpreadsheetEvaluator(sheet);
    const updatedCells = evaluator.recalculateAll();
    return { ...sheet, cells: updatedCells };
  }, []);

  // Push state to undo history
  const pushHistory = useCallback(() => {
    setWorkbook((prev) => ({
      ...prev,
      history: {
        past: [...prev.history.past.slice(-20), prev.sheets],
        future: [],
      },
    }));
    setIsDirty(true);
  }, []);

  // Undo / Redo
  const handleUndo = useCallback(() => {
    setWorkbook((prev) => {
      if (!prev.history.past.length) return prev;
      const previousSheets = prev.history.past[prev.history.past.length - 1];
      const newPast = prev.history.past.slice(0, -1);
      return {
        ...prev,
        sheets: previousSheets,
        history: {
          past: newPast,
          future: [prev.sheets, ...prev.history.future],
        },
      };
    });
  }, []);

  const handleRedo = useCallback(() => {
    setWorkbook((prev) => {
      if (!prev.history.future.length) return prev;
      const nextSheets = prev.history.future[0];
      const newFuture = prev.history.future.slice(1);
      return {
        ...prev,
        sheets: nextSheets,
        history: {
          past: [...prev.history.past, prev.sheets],
          future: newFuture,
        },
      };
    });
  }, []);

  // Update cell in current sheet
  const updateActiveCell = useCallback((value: string) => {
    const addr = formatCellAddress(workbook.activeCell.col, workbook.activeCell.row);
    const targetCell = currentSheet.cells[addr];

    // Enforce data validation rules if not a formula
    if (targetCell?.validation && !value.startsWith('=')) {
      const vResult = validateCellValue(value, targetCell.validation);
      if (!vResult.isValid) {
        setValidationAlert({
          open: true,
          title: vResult.errorTitle,
          message: vResult.errorMessage,
          pendingValue: value,
        });
        return false;
      }
    }

    pushHistory();

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;

        const updatedCells = { ...s.cells };
        const existing = updatedCells[addr] || { raw: '', style: {} };

        updatedCells[addr] = {
          ...existing,
          raw: value,
          formula: value.startsWith('=') ? value : undefined,
        };

        const recomputed = evaluateCurrentSheet({ ...s, cells: updatedCells });
        return recomputed;
      });

      return {
        ...prev,
        sheets,
        isEditing: false,
        editValue: '',
      };
    });
    return true;
  }, [workbook.activeCell, currentSheet.cells, evaluateCurrentSheet, pushHistory]);

  // Data validation handlers
  const handleApplyDataValidation = useCallback((rule: DataValidationRule) => {
    pushHistory();
    const minR = Math.min(workbook.selection.startRow, workbook.selection.endRow);
    const maxR = Math.max(workbook.selection.startRow, workbook.selection.endRow);
    const minC = Math.min(workbook.selection.startCol, workbook.selection.endCol);
    const maxC = Math.max(workbook.selection.startCol, workbook.selection.endCol);

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells = { ...s.cells };
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const addr = formatCellAddress(c, r);
            const cell = updatedCells[addr] || { raw: '' };
            updatedCells[addr] = { ...cell, validation: rule };
          }
        }
        return { ...s, cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.selection, pushHistory]);

  const handleClearDataValidation = useCallback(() => {
    pushHistory();
    const minR = Math.min(workbook.selection.startRow, workbook.selection.endRow);
    const maxR = Math.max(workbook.selection.startRow, workbook.selection.endRow);
    const minC = Math.min(workbook.selection.startCol, workbook.selection.endCol);
    const maxC = Math.max(workbook.selection.startCol, workbook.selection.endCol);

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells = { ...s.cells };
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const addr = formatCellAddress(c, r);
            if (updatedCells[addr]) {
              const { validation, ...rest } = updatedCells[addr];
              updatedCells[addr] = rest;
            }
          }
        }
        return { ...s, cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.selection, pushHistory]);

  // Insert Sparkline into active cell
  const handleInsertSparkline = useCallback((type: 'line' | 'bar') => {
    const sel = workbook.selection;
    let dataRange = 'E2:E7';
    if (sel.startRow !== sel.endRow || sel.startCol !== sel.endCol) {
      const startAddr = formatCellAddress(sel.startCol, sel.startRow);
      const endAddr = formatCellAddress(sel.endCol, sel.endRow);
      dataRange = `${startAddr}:${endAddr}`;
    }
    updateActiveCell(`=SPARKLINE(${dataRange}, "${type}")`);
  }, [workbook.selection, updateActiveCell]);

  // Apply cell styling
  const handleApplyStyle = useCallback((property: keyof CellStyle, value: any) => {
    pushHistory();
    const minR = Math.min(workbook.selection.startRow, workbook.selection.endRow);
    const maxR = Math.max(workbook.selection.startRow, workbook.selection.endRow);
    const minC = Math.min(workbook.selection.startCol, workbook.selection.endCol);
    const maxC = Math.max(workbook.selection.startCol, workbook.selection.endCol);

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells = { ...s.cells };

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const addr = formatCellAddress(c, r);
            const cell = updatedCells[addr] || { raw: '', style: {} };
            const style = { ...(cell.style || {}) };
            style[property] = value;
            updatedCells[addr] = { ...cell, style };
          }
        }

        return { ...s, cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.selection, pushHistory]);

  // Apply cell format (Currency, Percent, Decimal)
  const handleApplyFormat = useCallback((format: CellFormat) => {
    pushHistory();
    const minR = Math.min(workbook.selection.startRow, workbook.selection.endRow);
    const maxR = Math.max(workbook.selection.startRow, workbook.selection.endRow);
    const minC = Math.min(workbook.selection.startCol, workbook.selection.endCol);
    const maxC = Math.max(workbook.selection.startCol, workbook.selection.endCol);

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells = { ...s.cells };

        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const addr = formatCellAddress(c, r);
            const cell = updatedCells[addr] || { raw: '' };
            updatedCells[addr] = { ...cell, format };
          }
        }

        return { ...s, cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.selection, pushHistory]);

  // AutoSum insertion
  const handleAutoSum = useCallback((fn: string) => {
    const col = workbook.activeCell.col;
    const row = workbook.activeCell.row;
    const colLetter = formatCellAddress(col, 0).replace(/[0-9]/g, '');

    const startRow = 1;
    const endRow = Math.max(1, row);
    const formulaStr = `=${fn}(${colLetter}${startRow}:${colLetter}${endRow})`;
    updateActiveCell(formulaStr);
  }, [workbook.activeCell, updateActiveCell]);

  // Sort selected range
  const handleSort = useCallback((direction: 'asc' | 'desc') => {
    pushHistory();
    const minR = Math.min(workbook.selection.startRow, workbook.selection.endRow);
    const maxR = Math.max(workbook.selection.startRow, workbook.selection.endRow);
    const minC = Math.min(workbook.selection.startCol, workbook.selection.endCol);
    const maxC = Math.max(workbook.selection.startCol, workbook.selection.endCol);

    if (minR >= maxR) return;

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;

        // Extract row objects
        const rows: { rowIndex: number; sortKey: any; cells: Record<number, CellData | undefined> }[] = [];
        for (let r = minR; r <= maxR; r++) {
          const rowCells: Record<number, CellData | undefined> = {};
          for (let c = minC; c <= maxC; c++) {
            rowCells[c] = s.cells[formatCellAddress(c, r)];
          }
          const sortVal = rowCells[minC]?.computed !== undefined ? rowCells[minC]?.computed : rowCells[minC]?.raw;
          rows.push({ rowIndex: r, sortKey: sortVal, cells: rowCells });
        }

        // Sort rows
        rows.sort((a, b) => {
          const valA = a.sortKey;
          const valB = b.sortKey;
          if (valA === valB) return 0;
          if (valA === undefined || valA === '') return 1;
          if (valB === undefined || valB === '') return -1;
          const numA = parseFloat(valA);
          const numB = parseFloat(valB);
          if (!isNaN(numA) && !isNaN(numB)) {
            return direction === 'asc' ? numA - numB : numB - numA;
          }
          return direction === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
        });

        const updatedCells = { ...s.cells };
        for (let i = 0; i < rows.length; i++) {
          const targetR = minR + i;
          for (let c = minC; c <= maxC; c++) {
            const sourceCell = rows[i].cells[c];
            const targetAddr = formatCellAddress(c, targetR);
            if (sourceCell) {
              updatedCells[targetAddr] = sourceCell;
            } else {
              delete updatedCells[targetAddr];
            }
          }
        }

        return evaluateCurrentSheet({ ...s, cells: updatedCells });
      });
      return { ...prev, sheets };
    });
  }, [workbook.selection, pushHistory, evaluateCurrentSheet]);

  // Insert & Delete row / col
  const handleInsertRow = useCallback(() => {
    pushHistory();
    const targetRow = workbook.activeCell.row;

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells: Record<string, CellData> = {};

        for (const [key, cell] of Object.entries(s.cells)) {
          const p = parseCellAddress(key);
          if (!p) continue;
          if (p.row >= targetRow) {
            updatedCells[formatCellAddress(p.col, p.row + 1)] = cell;
          } else {
            updatedCells[key] = cell;
          }
        }
        return { ...s, rowCount: s.rowCount + 1, cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.activeCell, pushHistory]);

  const handleDeleteRow = useCallback(() => {
    pushHistory();
    const targetRow = workbook.activeCell.row;

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells: Record<string, CellData> = {};

        for (const [key, cell] of Object.entries(s.cells)) {
          const p = parseCellAddress(key);
          if (!p) continue;
          if (p.row === targetRow) {
            // Delete
            continue;
          } else if (p.row > targetRow) {
            updatedCells[formatCellAddress(p.col, p.row - 1)] = cell;
          } else {
            updatedCells[key] = cell;
          }
        }
        return { ...s, rowCount: Math.max(10, s.rowCount - 1), cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.activeCell, pushHistory]);

  const handleInsertCol = useCallback(() => {
    pushHistory();
    const targetCol = workbook.activeCell.col;

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells: Record<string, CellData> = {};

        for (const [key, cell] of Object.entries(s.cells)) {
          const p = parseCellAddress(key);
          if (!p) continue;
          if (p.col >= targetCol) {
            updatedCells[formatCellAddress(p.col + 1, p.row)] = cell;
          } else {
            updatedCells[key] = cell;
          }
        }
        return { ...s, colCount: s.colCount + 1, cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.activeCell, pushHistory]);

  const handleDeleteCol = useCallback(() => {
    pushHistory();
    const targetCol = workbook.activeCell.col;

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells: Record<string, CellData> = {};

        for (const [key, cell] of Object.entries(s.cells)) {
          const p = parseCellAddress(key);
          if (!p) continue;
          if (p.col === targetCol) {
            continue;
          } else if (p.col > targetCol) {
            updatedCells[formatCellAddress(p.col - 1, p.row)] = cell;
          } else {
            updatedCells[key] = cell;
          }
        }
        return { ...s, colCount: Math.max(5, s.colCount - 1), cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.activeCell, pushHistory]);

  // Clear contents in selection
  const handleClearContents = useCallback(() => {
    pushHistory();
    const minR = Math.min(workbook.selection.startRow, workbook.selection.endRow);
    const maxR = Math.max(workbook.selection.startRow, workbook.selection.endRow);
    const minC = Math.min(workbook.selection.startCol, workbook.selection.endCol);
    const maxC = Math.max(workbook.selection.startCol, workbook.selection.endCol);

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells = { ...s.cells };
        for (let r = minR; r <= maxR; r++) {
          for (let c = minC; c <= maxC; c++) {
            const addr = formatCellAddress(c, r);
            delete updatedCells[addr];
          }
        }
        return { ...s, cells: updatedCells };
      });
      return { ...prev, sheets };
    });
  }, [workbook.selection, pushHistory]);

  // Copy / Cut / Paste with OS Clipboard
  const handleCopy = useCallback(async () => {
    await copyRangeToClipboard(currentSheet, workbook.selection);
  }, [currentSheet, workbook.selection]);

  const handleCut = useCallback(async () => {
    await copyRangeToClipboard(currentSheet, workbook.selection);
    handleClearContents();
  }, [currentSheet, workbook.selection, handleClearContents]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = parseClipboardTSV(text);
      if (!rows.length) return;

      pushHistory();
      const startCol = workbook.activeCell.col;
      const startRow = workbook.activeCell.row;

      setWorkbook((prev) => {
        const sheets = prev.sheets.map((s) => {
          if (s.id !== prev.activeSheetId) return s;
          const updatedCells = { ...s.cells };

          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < rows[r].length; c++) {
              const val = rows[r][c];
              const targetAddr = formatCellAddress(startCol + c, startRow + r);
              updatedCells[targetAddr] = {
                raw: val,
                formula: val.startsWith('=') ? val : undefined,
                computed: val.startsWith('=') ? undefined : val,
              };
            }
          }
          return evaluateCurrentSheet({ ...s, cells: updatedCells });
        });
        return { ...prev, sheets };
      });
    } catch {
      // fallback
    }
  }, [workbook.activeCell, evaluateCurrentSheet, pushHistory]);

  // Auto-fill drag
  const handleFillRange = useCallback((source: SelectionRange, target: SelectionRange) => {
    pushHistory();
    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells = { ...s.cells };

        const srcWidth = Math.abs(source.endCol - source.startCol) + 1;
        const srcHeight = Math.abs(source.endRow - source.startRow) + 1;

        for (let r = target.startRow; r <= target.endRow; r++) {
          for (let c = target.startCol; c <= target.endCol; c++) {
            const srcR = source.startRow + ((r - target.startRow) % srcHeight);
            const srcC = source.startCol + ((c - target.startCol) % srcWidth);
            const srcCell = s.cells[formatCellAddress(srcC, srcR)];
            const targetAddr = formatCellAddress(c, r);

            if (srcCell) {
              updatedCells[targetAddr] = { ...srcCell };
            }
          }
        }
        return evaluateCurrentSheet({ ...s, cells: updatedCells });
      });
      return { ...prev, sheets };
    });
  }, [evaluateCurrentSheet, pushHistory]);

  // Bio template loader
  const handleLoadBioTemplate = useCallback((templateKey: 'genomics' | 'drugScreen' | 'clinicalTrial') => {
    pushHistory();
    const template = BIO_TEMPLATES[templateKey];
    if (!template) return;

    const newCells: Record<string, CellData> = {};

    // Populate Headers
    template.headers.forEach((h, colIdx) => {
      const addr = formatCellAddress(colIdx, 0);
      newCells[addr] = {
        raw: h,
        computed: h,
        style: { bold: true, bg: '#f1f5f9', align: colIdx === 0 ? 'left' : 'center' },
      };
    });

    // Populate Rows
    template.rows.forEach((row, rowIdx) => {
      row.forEach((val, colIdx) => {
        const addr = formatCellAddress(colIdx, rowIdx + 1);
        newCells[addr] = {
          raw: String(val),
          computed: val,
          style: {},
        };
      });
    });

    const newSheet: SheetData = {
      id: `sheet-bio-${Date.now()}`,
      name: template.sheetName,
      cells: newCells,
      colWidths: { 0: 160, 1: 140, 2: 130, 3: 130, 4: 150, 5: 120, 6: 150, 7: 150 },
      rowHeights: {},
      rowCount: 50,
      colCount: 26,
      frozenRows: 1,
      frozenCols: 0,
    };

    setWorkbook((prev) => ({
      ...prev,
      title: template.title,
      sheets: [...prev.sheets, newSheet],
      activeSheetId: newSheet.id,
    }));

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
  }, [pushHistory]);

  // File I/O triggers
  const handleOpenFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const parsed = importWorkbookFromBuffer(buffer, file.name);

      setWorkbook((prev) => ({
        ...prev,
        title: parsed.title,
        sheets: parsed.sheets,
        activeSheetId: parsed.sheets[0].id,
      }));
      setIsDirty(false);
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.5 } });
    } catch {
      // fallback
    }
    e.target.value = '';
  };

  const handleSaveFile = async () => {
    await exportWorkbookToXLSX(workbook);
    setIsDirty(false);
  };

  const handleExportCSV = async () => {
    await exportSheetToCSV(currentSheet, workbook.title);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindReplaceOpen(true);
      } else if (e.key === 'F9') {
        e.preventDefault();
        setWorkbook((prev) => ({
          ...prev,
          sheets: prev.sheets.map((s) => evaluateCurrentSheet(s)),
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveFile, handleUndo, handleRedo, evaluateCurrentSheet]);

  // Find & Replace search logic
  const handleFind = (query: string, matchCase: boolean, direction: 'next' | 'prev') => {
    const matchedCells: string[] = [];
    const searchTarget = matchCase ? query : query.toLowerCase();

    for (const [key, cell] of Object.entries(currentSheet.cells)) {
      if (!cell) continue;
      const val = String(cell.computed !== undefined ? cell.computed : cell.raw);
      const textToSearch = matchCase ? val : val.toLowerCase();
      if (textToSearch.includes(searchTarget)) {
        matchedCells.push(key);
      }
    }

    if (!matchedCells.length) return { total: 0, current: 0 };

    // Select the first match
    const coords = parseCellAddress(matchedCells[0]);
    if (coords) {
      setWorkbook((prev) => ({
        ...prev,
        activeCell: coords,
        selection: { startRow: coords.row, startCol: coords.col, endRow: coords.row, endCol: coords.col },
      }));
    }

    return { total: matchedCells.length, current: 1 };
  };

  const handleReplace = (findText: string, replaceText: string, matchCase: boolean) => {
    const addr = formatCellAddress(workbook.activeCell.col, workbook.activeCell.row);
    const cell = currentSheet.cells[addr];
    if (!cell) return;

    const val = String(cell.computed !== undefined ? cell.computed : cell.raw);
    const regex = new RegExp(findText, matchCase ? 'g' : 'gi');
    const newVal = val.replace(regex, replaceText);
    updateActiveCell(newVal);
  };

  const handleReplaceAll = (findText: string, replaceText: string, matchCase: boolean) => {
    pushHistory();
    let replaceCount = 0;
    const regex = new RegExp(findText, matchCase ? 'g' : 'gi');

    setWorkbook((prev) => {
      const sheets = prev.sheets.map((s) => {
        if (s.id !== prev.activeSheetId) return s;
        const updatedCells = { ...s.cells };

        for (const [key, cell] of Object.entries(updatedCells)) {
          if (!cell) continue;
          const val = String(cell.computed !== undefined ? cell.computed : cell.raw);
          if (regex.test(val)) {
            replaceCount++;
            const replaced = val.replace(regex, replaceText);
            updatedCells[key] = {
              ...cell,
              raw: replaced,
              computed: replaced,
            };
          }
        }
        return evaluateCurrentSheet({ ...s, cells: updatedCells });
      });
      return { ...prev, sheets };
    });

    return replaceCount;
  };

  // Open 3D viewer with selected cell content if looks like PDB or Gene
  const handleOpenMolecularViewerFromCell = () => {
    const addr = formatCellAddress(workbook.activeCell.col, workbook.activeCell.row);
    const cell = currentSheet.cells[addr];
    const val = cell ? String(cell.computed || cell.raw).trim() : '1TUP';
    setMolecularQuery(val || '1TUP');
    setMolecularViewerOpen(true);
  };

  return (
    <div className={`h-full w-full flex flex-col overflow-hidden select-none font-sans ${workbook.darkMode ? 'dark bg-[#1a1a1a] text-neutral-100' : 'bg-[#f3f3f3] text-neutral-800'}`}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 1. Windows 11 Fluent Titlebar */}
      <Titlebar
        title={workbook.title}
        isDirty={isDirty}
        darkMode={workbook.darkMode}
        canUndo={workbook.history.past.length > 0}
        canRedo={workbook.history.future.length > 0}
        onRename={(newName) => {
          setWorkbook((prev) => ({ ...prev, title: newName.endsWith('.xlsx') ? newName : `${newName}.xlsx` }));
          setIsDirty(true);
        }}
        onSave={handleSaveFile}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleDarkMode={() => setWorkbook((prev) => ({ ...prev, darkMode: !prev.darkMode }))}
        onOpenSearch={() => setFindReplaceOpen(true)}
        onOpenDesktopGuide={() => setDesktopGuideOpen(true)}
        onOpenMolecularViewer={handleOpenMolecularViewerFromCell}
      />

      {/* 2. Windows 11 Fluent Ribbon Bar */}
      <Ribbon
        activeTab={activeRibbonTab}
        setActiveTab={setActiveRibbonTab}
        darkMode={workbook.darkMode}
        activeFormat={activeCellData?.format}
        activeStyle={activeCellData?.style}
        onApplyStyle={handleApplyStyle}
        onApplyFormat={handleApplyFormat}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onInsertRow={handleInsertRow}
        onDeleteRow={handleDeleteRow}
        onInsertCol={handleInsertCol}
        onDeleteCol={handleDeleteCol}
        onClearContents={handleClearContents}
        onAutoSum={handleAutoSum}
        onSort={handleSort}
        onNewWorkbook={() => {
          const freshSheet = createEmptySheet('Sheet1');
          setWorkbook((prev) => ({
            ...prev,
            title: 'Book1.xlsx',
            sheets: [freshSheet],
            activeSheetId: freshSheet.id,
          }));
          setIsDirty(false);
        }}
        onOpenFile={handleOpenFile}
        onSaveFile={handleSaveFile}
        onExportCSV={handleExportCSV}
        onPrint={() => window.print()}
        onOpenChartModal={(type) => {
          setChartModalType(type);
          setChartModalOpen(true);
        }}
        onOpenMolecularViewer={handleOpenMolecularViewerFromCell}
        onLoadBioTemplate={handleLoadBioTemplate}
        onRecalculate={() => {
          setWorkbook((prev) => ({
            ...prev,
            sheets: prev.sheets.map((s) => evaluateCurrentSheet(s)),
          }));
        }}
        showGridlines={workbook.showGridlines}
        onToggleGridlines={() => setWorkbook((prev) => ({ ...prev, showGridlines: !prev.showGridlines }))}
        showHeaders={workbook.showHeaders}
        onToggleHeaders={() => setWorkbook((prev) => ({ ...prev, showHeaders: !prev.showHeaders }))}
        zoom={workbook.zoom}
        onSetZoom={(z) => setWorkbook((prev) => ({ ...prev, zoom: z }))}
        onOpenDesktopGuide={() => setDesktopGuideOpen(true)}
        onInsertSparkline={handleInsertSparkline}
        onOpenDataValidation={() => setDataValidationOpen(true)}
      />

      {/* 3. Formula Bar */}
      <FormulaBar
        activeCellAddress={activeCellAddress}
        value={workbook.isEditing ? workbook.editValue : (activeCellData?.formula || activeCellData?.raw || '')}
        onChange={(val) => {
          if (!workbook.isEditing) {
            setWorkbook((prev) => ({ ...prev, isEditing: true, editValue: val }));
          } else {
            setWorkbook((prev) => ({ ...prev, editValue: val }));
          }
        }}
        onSubmit={() => {
          if (workbook.isEditing) {
            updateActiveCell(workbook.editValue);
          }
        }}
        onCancel={() => {
          setWorkbook((prev) => ({ ...prev, isEditing: false, editValue: '' }));
        }}
        darkMode={workbook.darkMode}
      />

      {/* 4. High-Performance Virtualized Grid Viewport */}
      <Grid
        sheet={currentSheet}
        activeCell={workbook.activeCell}
        selection={workbook.selection}
        isEditing={workbook.isEditing}
        editValue={workbook.editValue}
        darkMode={workbook.darkMode}
        showGridlines={workbook.showGridlines}
        showHeaders={workbook.showHeaders}
        zoom={workbook.zoom}
        onSelectCell={(coords, isShift) => {
          setWorkbook((prev) => {
            if (isShift) {
              return {
                ...prev,
                selection: {
                  startRow: prev.selection.startRow,
                  startCol: prev.selection.startCol,
                  endRow: coords.row,
                  endCol: coords.col,
                },
              };
            }
            return {
              ...prev,
              activeCell: coords,
              selection: { startRow: coords.row, startCol: coords.col, endRow: coords.row, endCol: coords.col },
              isEditing: false,
              editValue: '',
            };
          });
        }}
        onStartEditing={(initialVal) => {
          const defaultVal = initialVal !== undefined ? initialVal : (activeCellData?.raw || '');
          setWorkbook((prev) => ({ ...prev, isEditing: true, editValue: defaultVal }));
        }}
        onCommitEdit={(val) => updateActiveCell(val)}
        onCancelEdit={() => setWorkbook((prev) => ({ ...prev, isEditing: false, editValue: '' }))}
        onChangeEditValue={(val) => setWorkbook((prev) => ({ ...prev, editValue: val }))}
        onUpdateColWidth={(colIdx, width) => {
          setWorkbook((prev) => {
            const sheets = prev.sheets.map((s) => {
              if (s.id !== prev.activeSheetId) return s;
              return { ...s, colWidths: { ...s.colWidths, [colIdx]: width } };
            });
            return { ...prev, sheets };
          });
        }}
        onUpdateRowHeight={(rowIdx, height) => {
          setWorkbook((prev) => {
            const sheets = prev.sheets.map((s) => {
              if (s.id !== prev.activeSheetId) return s;
              return { ...s, rowHeights: { ...s.rowHeights, [rowIdx]: height } };
            });
            return { ...prev, sheets };
          });
        }}
        onContextMenu={(e, target) => {
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            target,
          });
        }}
        onFillRange={handleFillRange}
      />

      {/* 5. Bottom Sheet Tabs & Math Summary Bar */}
      <SheetTabs
        sheets={workbook.sheets}
        activeSheetId={workbook.activeSheetId}
        selection={workbook.selection}
        currentSheet={currentSheet}
        zoom={workbook.zoom}
        darkMode={workbook.darkMode}
        onSelectSheet={(id) => setWorkbook((prev) => ({ ...prev, activeSheetId: id }))}
        onAddSheet={() => {
          pushHistory();
          const newSheet = createEmptySheet(`Sheet${workbook.sheets.length + 1}`);
          setWorkbook((prev) => ({
            ...prev,
            sheets: [...prev.sheets, newSheet],
            activeSheetId: newSheet.id,
          }));
        }}
        onRenameSheet={(id, newName) => {
          pushHistory();
          setWorkbook((prev) => ({
            ...prev,
            sheets: prev.sheets.map((s) => (s.id === id ? { ...s, name: newName } : s)),
          }));
        }}
        onDuplicateSheet={(id) => {
          pushHistory();
          const target = workbook.sheets.find((s) => s.id === id);
          if (!target) return;
          const dupSheet: SheetData = {
            ...target,
            id: `sheet-${Date.now()}`,
            name: `${target.name} (Copy)`,
          };
          setWorkbook((prev) => ({
            ...prev,
            sheets: [...prev.sheets, dupSheet],
            activeSheetId: dupSheet.id,
          }));
        }}
        onDeleteSheet={(id) => {
          if (workbook.sheets.length <= 1) return;
          pushHistory();
          const filtered = workbook.sheets.filter((s) => s.id !== id);
          setWorkbook((prev) => ({
            ...prev,
            sheets: filtered,
            activeSheetId: filtered[0].id,
          }));
        }}
        onSetZoom={(z) => setWorkbook((prev) => ({ ...prev, zoom: z }))}
      />

      {/* Context Menu */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          target={contextMenu.target}
          darkMode={workbook.darkMode}
          onClose={() => setContextMenu((prev) => ({ ...prev, visible: false }))}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onInsertRow={handleInsertRow}
          onDeleteRow={handleDeleteRow}
          onInsertCol={handleInsertCol}
          onDeleteCol={handleDeleteCol}
          onClearContents={handleClearContents}
          onFormat={handleApplyFormat}
          onOpenChart={() => setChartModalOpen(true)}
          onOpenMolecularViewer={handleOpenMolecularViewerFromCell}
          onOpenDataValidation={() => setDataValidationOpen(true)}
        />
      )}

      {/* Modals */}
      {chartModalOpen && (
        <ChartModal
          isOpen={chartModalOpen}
          initialType={chartModalType}
          sheet={currentSheet}
          darkMode={workbook.darkMode}
          onClose={() => setChartModalOpen(false)}
        />
      )}

      {molecularViewerOpen && (
        <MolecularViewerModal
          isOpen={molecularViewerOpen}
          initialQuery={molecularQuery}
          darkMode={workbook.darkMode}
          onClose={() => setMolecularViewerOpen(false)}
        />
      )}

      {findReplaceOpen && (
        <FindReplaceModal
          isOpen={findReplaceOpen}
          darkMode={workbook.darkMode}
          onClose={() => setFindReplaceOpen(false)}
          onFind={handleFind}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
        />
      )}

      {dataValidationOpen && (
        <DataValidationModal
          isOpen={dataValidationOpen}
          currentRule={activeCellData?.validation}
          selectionAddress={
            formatCellAddress(workbook.selection.startCol, workbook.selection.startRow) +
            (workbook.selection.startCol !== workbook.selection.endCol || workbook.selection.startRow !== workbook.selection.endRow
              ? `:${formatCellAddress(workbook.selection.endCol, workbook.selection.endRow)}`
              : '')
          }
          darkMode={workbook.darkMode}
          onClose={() => setDataValidationOpen(false)}
          onApply={handleApplyDataValidation}
          onClear={handleClearDataValidation}
        />
      )}

      {desktopGuideOpen && (
        <DesktopExportModal
          isOpen={desktopGuideOpen}
          darkMode={workbook.darkMode}
          onClose={() => setDesktopGuideOpen(false)}
        />
      )}

      {/* Windows 11 Data Validation Error Alert Dialog */}
      {validationAlert?.open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className={`w-full max-w-sm rounded-2xl shadow-2xl border p-5 flex flex-col gap-3.5 animate-pop ${
              workbook.darkMode ? 'bg-[#252525] border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-bold text-sm">{validationAlert.title}</h4>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {validationAlert.message}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <button
                onClick={() => {
                  setValidationAlert(null);
                  setWorkbook((prev) => ({ ...prev, isEditing: true, editValue: validationAlert.pendingValue || '' }));
                }}
                className="px-3.5 py-1.5 bg-[#107c41] text-white hover:bg-[#0c6334] rounded text-xs font-semibold transition shadow-sm"
              >
                Retry
              </button>
              <button
                onClick={() => {
                  setValidationAlert(null);
                  setWorkbook((prev) => ({ ...prev, isEditing: false, editValue: '' }));
                }}
                className="px-3.5 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 rounded text-xs font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
