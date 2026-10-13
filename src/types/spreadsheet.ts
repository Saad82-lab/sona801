export type CellFormat =
  | 'text'
  | 'number'
  | 'currency_usd'
  | 'currency_inr'
  | 'currency_eur'
  | 'percent'
  | 'decimal_2'
  | 'scientific'
  | 'date';

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  bg?: string;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  fontSize?: number;
  fontFamily?: string;
  border?: 'none' | 'thin' | 'thick' | 'double' | 'dashed';
  borderColor?: string;
}

export interface SparklineConfig {
  type: 'line' | 'bar' | 'win_loss';
  data: number[];
  color?: string;
  fillColor?: string;
}

export type ValidationType = 'list' | 'whole_number' | 'decimal' | 'date' | 'text_length';
export type ValidationOperator =
  | 'between'
  | 'not_between'
  | 'equal'
  | 'not_equal'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal';

export interface DataValidationRule {
  type: ValidationType;
  operator?: ValidationOperator;
  formula1: string; // List items e.g. "Tumor Suppressor, Oncogenic Driver, DNA Repair", or min val / reference
  formula2?: string; // Max value for 'between'
  allowBlank?: boolean;
  showDropdown?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  promptTitle?: string;
  promptMessage?: string;
}

export interface CellData {
  raw: string; // The text or formula entered, e.g. "=SUM(A1:A5)" or "1500"
  formula?: string; // "=SUM(A1:A5)" if it starts with '='
  computed?: string | number | boolean | SparklineConfig | null; // Evaluated result
  format?: CellFormat;
  style?: CellStyle;
  validation?: DataValidationRule;
  sparkline?: SparklineConfig;
  error?: string;
}

export interface SheetData {
  id: string;
  name: string;
  cells: Record<string, CellData>; // key e.g. "A1", "C12"
  rowHeights: Record<number, number>; // row index (0-based) -> height in px
  colWidths: Record<number, number>; // col index (0-based) -> width in px
  rowCount: number;
  colCount: number;
  frozenRows: number;
  frozenCols: number;
  validations?: Record<string, DataValidationRule>; // rules attached to ranges/columns
}

export interface CellCoords {
  col: number; // 0-based
  row: number; // 0-based
}

export interface SelectionRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface WorkbookState {
  title: string;
  sheets: SheetData[];
  activeSheetId: string;
  selection: SelectionRange;
  activeCell: CellCoords;
  isEditing: boolean;
  editValue: string;
  clipboard: {
    range: SelectionRange;
    data: (CellData | null)[][];
    isCut?: boolean;
  } | null;
  history: {
    past: SheetData[][];
    future: SheetData[][];
  };
  zoom: number; // 0.75, 1.0, 1.25, 1.5
  showGridlines: boolean;
  showHeaders: boolean;
  darkMode: boolean;
  filterText?: string;
}

export interface BioSearchResult {
  id: string;
  name: string;
  type: 'protein' | 'gene' | 'compound' | 'structure';
  organism?: string;
  description?: string;
  details?: Record<string, any>;
}
