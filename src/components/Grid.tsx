import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  SheetData,
  CellCoords,
  SelectionRange,
  CellData,
  CellStyle
} from '../types/spreadsheet';
import { colIndexToName, formatCellAddress } from '../engine/evaluator';
import { Sparkline } from './Sparkline';

interface GridProps {
  sheet: SheetData;
  activeCell: CellCoords;
  selection: SelectionRange;
  isEditing: boolean;
  editValue: string;
  darkMode: boolean;
  showGridlines: boolean;
  showHeaders: boolean;
  zoom: number;
  onSelectCell: (coords: CellCoords, isShift?: boolean) => void;
  onStartEditing: (initialValue?: string) => void;
  onCommitEdit: (value: string) => void;
  onCancelEdit: () => void;
  onChangeEditValue: (value: string) => void;
  onUpdateColWidth: (colIdx: number, width: number) => void;
  onUpdateRowHeight: (rowIdx: number, height: number) => void;
  onContextMenu: (e: React.MouseEvent, target: { type: 'cell' | 'row' | 'col'; index?: number; cellId?: string }) => void;
  onFillRange: (sourceRange: SelectionRange, targetRange: SelectionRange) => void;
}

const DEFAULT_COL_WIDTH = 96;
const DEFAULT_ROW_HEIGHT = 24;
const HEADER_WIDTH = 48;
const HEADER_HEIGHT = 26;
const OVERSCAN_ROWS = 15;
const OVERSCAN_COLS = 6;

export const Grid: React.FC<GridProps> = ({
  sheet,
  activeCell,
  selection,
  isEditing,
  editValue,
  darkMode,
  showGridlines,
  showHeaders,
  zoom,
  onSelectCell,
  onStartEditing,
  onCommitEdit,
  onCancelEdit,
  onChangeEditValue,
  onUpdateColWidth,
  onUpdateRowHeight,
  onContextMenu,
  onFillRange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

  // Viewport scroll state for virtualization
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(1200);
  const [viewportHeight, setViewportHeight] = useState(700);

  // Resizing state
  const [isResizingCol, setIsResizingCol] = useState<number | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);

  const [isResizingRow, setIsResizingRow] = useState<number | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);

  // Drag selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [isDraggingFillHandle, setIsDraggingFillHandle] = useState(false);
  const [fillEndCell, setFillEndCell] = useState<CellCoords | null>(null);
  const [openDropdownCell, setOpenDropdownCell] = useState<string | null>(null);

  // Calculate cumulative positions for fast virtualization lookups
  const colPositions = useMemo(() => {
    const pos = [0];
    let total = 0;
    for (let c = 0; c < sheet.colCount; c++) {
      const w = sheet.colWidths[c] || DEFAULT_COL_WIDTH;
      total += w;
      pos.push(total);
    }
    return pos;
  }, [sheet.colCount, sheet.colWidths]);

  const rowPositions = useMemo(() => {
    const pos = [0];
    let total = 0;
    for (let r = 0; r < sheet.rowCount; r++) {
      const h = sheet.rowHeights[r] || DEFAULT_ROW_HEIGHT;
      total += h;
      pos.push(total);
    }
    return pos;
  }, [sheet.rowCount, sheet.rowHeights]);

  const totalWidth = colPositions[colPositions.length - 1] || 2500;
  const totalHeight = rowPositions[rowPositions.length - 1] || 1500;

  // Viewport resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportWidth(entry.contentRect.width);
        setViewportHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
      setScrollLeft(containerRef.current.scrollLeft);
    }
  }, []);

  // Compute visible range based on scroll positions
  const visibleColRange = useMemo(() => {
    let startCol = 0;
    while (startCol < sheet.colCount && colPositions[startCol + 1] < scrollLeft) {
      startCol++;
    }
    startCol = Math.max(0, startCol - OVERSCAN_COLS);

    let endCol = startCol;
    const rightEdge = scrollLeft + viewportWidth;
    while (endCol < sheet.colCount && colPositions[endCol] < rightEdge) {
      endCol++;
    }
    endCol = Math.min(sheet.colCount - 1, endCol + OVERSCAN_COLS);

    return { startCol, endCol };
  }, [scrollLeft, viewportWidth, colPositions, sheet.colCount]);

  const visibleRowRange = useMemo(() => {
    let startRow = 0;
    while (startRow < sheet.rowCount && rowPositions[startRow + 1] < scrollTop) {
      startRow++;
    }
    startRow = Math.max(0, startRow - OVERSCAN_ROWS);

    let endRow = startRow;
    const bottomEdge = scrollTop + viewportHeight;
    while (endRow < sheet.rowCount && rowPositions[endRow] < bottomEdge) {
      endRow++;
    }
    endRow = Math.min(sheet.rowCount - 1, endRow + OVERSCAN_ROWS);

    return { startRow, endRow };
  }, [scrollTop, viewportHeight, rowPositions, sheet.rowCount]);

  // Focus inline input when editing starts
  useEffect(() => {
    if (isEditing && inlineInputRef.current) {
      inlineInputRef.current.focus();
    }
  }, [isEditing]);

  // Handle global mouse up for resizing and drag-selection
  useEffect(() => {
    const handleMouseUp = () => {
      if (isResizingCol !== null) setIsResizingCol(null);
      if (isResizingRow !== null) setIsResizingRow(null);
      if (isSelecting) setIsSelecting(false);
      if (isDraggingFillHandle && fillEndCell) {
        setIsDraggingFillHandle(false);
        onFillRange(selection, {
          startRow: Math.min(selection.startRow, fillEndCell.row),
          startCol: Math.min(selection.startCol, fillEndCell.col),
          endRow: Math.max(selection.endRow, fillEndCell.row),
          endCol: Math.max(selection.endCol, fillEndCell.col),
        });
        setFillEndCell(null);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingCol !== null) {
        const delta = e.clientX - resizeStartX;
        const newWidth = Math.max(40, resizeStartWidth + delta);
        onUpdateColWidth(isResizingCol, newWidth);
      }
      if (isResizingRow !== null) {
        const delta = e.clientY - resizeStartY;
        const newHeight = Math.max(18, resizeStartHeight + delta);
        onUpdateRowHeight(isResizingRow, newHeight);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [
    isResizingCol,
    resizeStartX,
    resizeStartWidth,
    isResizingRow,
    resizeStartY,
    resizeStartHeight,
    isSelecting,
    isDraggingFillHandle,
    fillEndCell,
    selection,
    onUpdateColWidth,
    onUpdateRowHeight,
    onFillRange,
  ]);

  // Format cell value according to its format specification
  const formatCellValue = (cell: CellData | undefined): string => {
    if (!cell) return '';
    const val = cell.computed !== undefined ? cell.computed : cell.raw;
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') return '';

    if (typeof val === 'number') {
      switch (cell.format) {
        case 'currency_usd':
          return `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'currency_inr':
          return `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'currency_eur':
          return `€${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        case 'percent':
          return `${(val * 100).toFixed(2)}%`;
        case 'decimal_2':
          return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        case 'scientific':
          return val.toExponential(4);
        default:
          return Number.isInteger(val) ? String(val) : String(parseFloat(val.toFixed(6)));
      }
    }
    return String(val);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onCommitEdit(editValue);
        onSelectCell({ col: activeCell.col, row: Math.min(sheet.rowCount - 1, activeCell.row + 1) });
      } else if (e.key === 'Tab') {
        e.preventDefault();
        onCommitEdit(editValue);
        onSelectCell({ col: Math.min(sheet.colCount - 1, activeCell.col + 1), row: activeCell.row });
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancelEdit();
      }
      return;
    }

    // Navigation keys when not editing
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      onSelectCell({ col: activeCell.col, row: Math.max(0, activeCell.row - 1) }, e.shiftKey);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      onSelectCell({ col: activeCell.col, row: Math.min(sheet.rowCount - 1, activeCell.row + 1) }, e.shiftKey);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSelectCell({ col: Math.max(0, activeCell.col - 1), row: activeCell.row }, e.shiftKey);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSelectCell({ col: Math.min(sheet.colCount - 1, activeCell.col + 1), row: activeCell.row }, e.shiftKey);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const addr = formatCellAddress(activeCell.col, activeCell.row);
      const curr = sheet.cells[addr];
      onStartEditing(curr ? curr.raw : '');
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      onCommitEdit('');
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Direct typing into active cell
      onStartEditing(e.key);
    }
  };

  // Selection box geometry calculations
  const minSelRow = Math.min(selection.startRow, selection.endRow);
  const maxSelRow = Math.max(selection.startRow, selection.endRow);
  const minSelCol = Math.min(selection.startCol, selection.endCol);
  const maxSelCol = Math.max(selection.startCol, selection.endCol);

  const selBoxLeft = colPositions[minSelCol];
  const selBoxTop = rowPositions[minSelRow];
  const selBoxWidth = colPositions[maxSelCol + 1] - selBoxLeft;
  const selBoxHeight = rowPositions[maxSelRow + 1] - selBoxTop;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onScroll={handleScroll}
      onKeyDown={handleKeyDown}
      className={`flex-1 overflow-auto relative outline-none select-none ${
        darkMode ? 'bg-[#1e1e1e] text-neutral-100' : 'bg-[#fafafa] text-neutral-900'
      }`}
      style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        width: `${100 / zoom}%`,
        height: `${100 / zoom}%`,
      }}
    >
      {/* Scroll canvas wrapper */}
      <div
        className="relative"
        style={{
          width: totalWidth + (showHeaders ? HEADER_WIDTH : 0),
          height: totalHeight + (showHeaders ? HEADER_HEIGHT : 0),
        }}
      >
        {/* ================================================= */}
        {/* TOP-LEFT CORNER (Select All) */}
        {/* ================================================= */}
        {showHeaders && (
          <div
            onClick={() => {
              onSelectCell({ col: 0, row: 0 });
              onSelectCell({ col: sheet.colCount - 1, row: sheet.rowCount - 1 }, true);
            }}
            className={`sticky top-0 left-0 z-30 flex items-center justify-center border-r border-b cursor-pointer transition ${
              darkMode
                ? 'bg-[#2d2d2d] border-neutral-700 hover:bg-neutral-700'
                : 'bg-[#f1f1f1] border-neutral-300 hover:bg-neutral-200'
            }`}
            style={{ width: HEADER_WIDTH, height: HEADER_HEIGHT }}
            title="Select all cells"
          >
            <div className="w-2.5 h-2.5 border-r border-b border-neutral-400 rotate-45" />
          </div>
        )}

        {/* ================================================= */}
        {/* COLUMN HEADERS (A, B, C...) */}
        {/* ================================================= */}
        {showHeaders && (
          <div
            className={`sticky top-0 z-20 flex border-b ${
              darkMode ? 'bg-[#252525] border-neutral-700' : 'bg-[#f3f3f3] border-neutral-300'
            }`}
            style={{
              left: HEADER_WIDTH,
              height: HEADER_HEIGHT,
              width: totalWidth,
            }}
          >
            {Array.from({ length: visibleColRange.endCol - visibleColRange.startCol + 1 }).map((_, i) => {
              const colIdx = visibleColRange.startCol + i;
              const colName = colIndexToName(colIdx);
              const width = sheet.colWidths[colIdx] || DEFAULT_COL_WIDTH;
              const leftPos = colPositions[colIdx];
              const isColSelected = colIdx >= minSelCol && colIdx <= maxSelCol;

              return (
                <div
                  key={colIdx}
                  onClick={(e) => {
                    onSelectCell({ col: colIdx, row: 0 });
                    onSelectCell({ col: colIdx, row: sheet.rowCount - 1 }, true);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onContextMenu(e, { type: 'col', index: colIdx });
                  }}
                  className={`absolute top-0 flex items-center justify-center border-r text-xs font-semibold select-none cursor-pointer group transition-colors ${
                    isColSelected
                      ? 'bg-[#107c41]/25 text-[#107c41] font-bold border-b-2 border-b-[#107c41]'
                      : darkMode
                      ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                      : 'border-neutral-300 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  style={{
                    left: leftPos,
                    width: width,
                    height: HEADER_HEIGHT,
                  }}
                >
                  <span>{colName}</span>

                  {/* Column resize divider */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsResizingCol(colIdx);
                      setResizeStartX(e.clientX);
                      setResizeStartWidth(width);
                    }}
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-[#107c41] z-30"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================= */}
        {/* ROW HEADERS (1, 2, 3...) */}
        {/* ================================================= */}
        {showHeaders && (
          <div
            className={`sticky left-0 z-10 flex flex-col border-r ${
              darkMode ? 'bg-[#252525] border-neutral-700' : 'bg-[#f3f3f3] border-neutral-300'
            }`}
            style={{
              top: HEADER_HEIGHT,
              width: HEADER_WIDTH,
              height: totalHeight,
            }}
          >
            {Array.from({ length: visibleRowRange.endRow - visibleRowRange.startRow + 1 }).map((_, i) => {
              const rowIdx = visibleRowRange.startRow + i;
              const height = sheet.rowHeights[rowIdx] || DEFAULT_ROW_HEIGHT;
              const topPos = rowPositions[rowIdx];
              const isRowSelected = rowIdx >= minSelRow && rowIdx <= maxSelRow;

              return (
                <div
                  key={rowIdx}
                  onClick={(e) => {
                    onSelectCell({ col: 0, row: rowIdx });
                    onSelectCell({ col: sheet.colCount - 1, row: rowIdx }, true);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onContextMenu(e, { type: 'row', index: rowIdx });
                  }}
                  className={`absolute left-0 flex items-center justify-center border-b text-xs font-semibold select-none cursor-pointer group transition-colors ${
                    isRowSelected
                      ? 'bg-[#107c41]/25 text-[#107c41] font-bold border-r-2 border-r-[#107c41]'
                      : darkMode
                      ? 'border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                      : 'border-neutral-300 text-neutral-600 hover:bg-neutral-200'
                  }`}
                  style={{
                    top: topPos,
                    height: height,
                    width: HEADER_WIDTH,
                  }}
                >
                  <span>{rowIdx + 1}</span>

                  {/* Row resize divider */}
                  <div
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setIsResizingRow(rowIdx);
                      setResizeStartY(e.clientY);
                      setResizeStartHeight(height);
                    }}
                    className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-[#107c41] z-30"
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================= */}
        {/* DATA CELLS VIEWPORT */}
        {/* ================================================= */}
        <div
          className="absolute"
          style={{
            top: showHeaders ? HEADER_HEIGHT : 0,
            left: showHeaders ? HEADER_WIDTH : 0,
            width: totalWidth,
            height: totalHeight,
          }}
        >
          {/* Virtualized Cells Render */}
          {Array.from({ length: visibleRowRange.endRow - visibleRowRange.startRow + 1 }).map((_, rIdx) => {
            const r = visibleRowRange.startRow + rIdx;
            const rowHeight = sheet.rowHeights[r] || DEFAULT_ROW_HEIGHT;
            const top = rowPositions[r];

            return (
              <React.Fragment key={r}>
                {Array.from({ length: visibleColRange.endCol - visibleColRange.startCol + 1 }).map((_, cIdx) => {
                  const c = visibleColRange.startCol + cIdx;
                  const colWidth = sheet.colWidths[c] || DEFAULT_COL_WIDTH;
                  const left = colPositions[c];
                  const cellAddress = formatCellAddress(c, r);
                  const cell = sheet.cells[cellAddress];

                  const isActive = activeCell.col === c && activeCell.row === r;
                  const inRange =
                    c >= minSelCol && c <= maxSelCol && r >= minSelRow && r <= maxSelRow;

                  // Parse cell styling
                  const style: React.CSSProperties = {
                    left,
                    top,
                    width: colWidth,
                    height: rowHeight,
                  };

                  if (cell?.style) {
                    if (cell.style.bold) style.fontWeight = 'bold';
                    if (cell.style.italic) style.fontStyle = 'italic';
                    if (cell.style.underline) style.textDecoration = 'underline';
                    if (cell.style.strikethrough) style.textDecoration = 'line-through';
                    if (cell.style.color) style.color = cell.style.color;
                    if (cell.style.bg) style.backgroundColor = cell.style.bg;
                    if (cell.style.align) style.justifyContent = cell.style.align === 'center' ? 'center' : (cell.style.align === 'right' ? 'flex-end' : 'flex-start');
                    if (cell.style.fontSize) style.fontSize = `${cell.style.fontSize}px`;
                    if (cell.style.fontFamily) style.fontFamily = cell.style.fontFamily;
                  }

                  const formattedText = formatCellValue(cell);

                  const isSparkline =
                    Boolean(cell?.sparkline) ||
                    Boolean(cell?.computed && typeof cell.computed === 'object' && 'type' in cell.computed && 'data' in cell.computed);
                  const sparklineConfig = cell?.sparkline || (isSparkline ? (cell?.computed as any) : null);
                  const hasDropdown = cell?.validation?.type === 'list' && cell.validation.showDropdown !== false;
                  const dropdownOptions = hasDropdown && cell?.validation?.formula1
                    ? cell.validation.formula1.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];

                  return (
                    <div
                      key={cellAddress}
                      id={`cell-${cellAddress}`}
                      onClick={(e) => {
                        onSelectCell({ col: c, row: r }, e.shiftKey);
                      }}
                      onDoubleClick={() => {
                        onStartEditing(cell ? cell.raw : '');
                      }}
                      onMouseDown={(e) => {
                        if (e.button === 0 && !e.shiftKey) {
                          setIsSelecting(true);
                          onSelectCell({ col: c, row: r });
                        }
                      }}
                      onMouseEnter={() => {
                        if (isSelecting) {
                          onSelectCell({ col: c, row: r }, true);
                        }
                        if (isDraggingFillHandle) {
                          setFillEndCell({ col: c, row: r });
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        onContextMenu(e, { type: 'cell', cellId: cellAddress });
                      }}
                      className={`absolute px-1.5 py-0.5 text-xs flex items-center overflow-visible whitespace-nowrap text-ellipsis cursor-cell transition-none ${
                        showGridlines
                          ? darkMode
                            ? 'border-r border-b border-neutral-800'
                            : 'border-r border-b border-neutral-200'
                          : ''
                      } ${
                        inRange && !isActive
                          ? 'bg-[#107c41]/10 dark:bg-[#107c41]/20'
                          : ''
                      } ${cell?.error ? 'text-rose-500 font-semibold' : ''}`}
                      style={style}
                    >
                      {/* If editing this exact active cell, show inline input */}
                      {isActive && isEditing ? (
                        <input
                          ref={inlineInputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => onChangeEditValue(e.target.value)}
                          className="w-full h-full bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none px-1 py-0 text-xs font-mono border-none"
                        />
                      ) : isSparkline && sparklineConfig ? (
                        <div className="w-full h-full flex items-center px-0.5">
                          <Sparkline config={sparklineConfig} />
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full h-full overflow-hidden">
                          <span className="truncate flex-1">{formattedText}</span>
                          {hasDropdown && isActive && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownCell(openDropdownCell === cellAddress ? null : cellAddress);
                              }}
                              title="Select from list"
                              className="w-4 h-4 ml-1 flex items-center justify-center bg-neutral-200 dark:bg-neutral-700 hover:bg-[#107c41] hover:text-white rounded text-neutral-600 dark:text-neutral-300 transition-colors flex-shrink-0 cursor-pointer"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* In-cell dropdown list */}
                      {hasDropdown && openDropdownCell === cellAddress && dropdownOptions.length > 0 && (
                        <div
                          className="absolute top-full left-0 mt-0.5 min-w-[160px] max-h-48 overflow-y-auto bg-white dark:bg-[#2c2c2c] border border-neutral-300 dark:border-neutral-700 shadow-2xl rounded-lg z-50 py-1 text-xs animate-pop"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {dropdownOptions.map((opt) => (
                            <div
                              key={opt}
                              onClick={(e) => {
                                e.stopPropagation();
                                onCommitEdit(opt);
                                setOpenDropdownCell(null);
                              }}
                              className={`px-3 py-1.5 cursor-pointer truncate transition-colors flex items-center justify-between ${
                                opt.toLowerCase() === (cell?.raw || '').trim().toLowerCase()
                                  ? 'bg-[#107c41]/15 text-[#107c41] font-bold'
                                  : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
                              }`}
                            >
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* ================================================= */}
          {/* SELECTION BOX OVERLAY & AUTOFILL HANDLE */}
          {/* ================================================= */}
          <div
            className="absolute border-2 border-[#107c41] pointer-events-none z-10"
            style={{
              left: selBoxLeft,
              top: selBoxTop,
              width: selBoxWidth,
              height: selBoxHeight,
            }}
          >
            {/* Auto-fill handle (square at bottom-right of selection) */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setIsDraggingFillHandle(true);
              }}
              className="absolute -right-1.5 -bottom-1.5 w-3 h-3 bg-[#107c41] border border-white dark:border-neutral-900 rounded-sm cursor-crosshair pointer-events-auto hover:scale-125 transition-transform"
              title="Drag to auto-fill formula or sequence"
            />
          </div>

          {/* Fill preview box when dragging fill handle */}
          {isDraggingFillHandle && fillEndCell && (
            <div
              className="absolute border-2 border-dashed border-[#107c41] pointer-events-none z-10 bg-[#107c41]/10"
              style={{
                left: colPositions[Math.min(minSelCol, fillEndCell.col)],
                top: rowPositions[Math.min(minSelRow, fillEndCell.row)],
                width:
                  colPositions[Math.max(maxSelCol, fillEndCell.col) + 1] -
                  colPositions[Math.min(minSelCol, fillEndCell.col)],
                height:
                  rowPositions[Math.max(maxSelRow, fillEndCell.row) + 1] -
                  rowPositions[Math.min(minSelRow, fillEndCell.row)],
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
