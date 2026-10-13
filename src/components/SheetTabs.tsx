import React, { useState } from 'react';
import { Plus, X, Copy, Edit2, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { SheetData, SelectionRange, CellData } from '../types/spreadsheet';
import { formatCellAddress } from '../engine/evaluator';

interface SheetTabsProps {
  sheets: SheetData[];
  activeSheetId: string;
  selection: SelectionRange;
  currentSheet: SheetData;
  zoom: number;
  darkMode: boolean;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDuplicateSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  onSetZoom: (zoom: number) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets,
  activeSheetId,
  selection,
  currentSheet,
  zoom,
  darkMode,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDuplicateSheet,
  onDeleteSheet,
  onSetZoom,
}) => {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [tempSheetName, setTempSheetName] = useState('');

  // Calculate live statistics for selection
  const stats = React.useMemo(() => {
    let count = 0;
    let sum = 0;
    let numCount = 0;
    let min = Infinity;
    let max = -Infinity;

    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.max(selection.startRow, selection.endRow);
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.max(selection.startCol, selection.endCol);

    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const addr = formatCellAddress(c, r);
        const cell = currentSheet.cells[addr];
        if (cell && (cell.raw || cell.computed !== undefined)) {
          count++;
          const val = cell.computed !== undefined ? cell.computed : parseFloat(cell.raw);
          if (typeof val === 'number' && !isNaN(val)) {
            sum += val;
            numCount++;
            if (val < min) min = val;
            if (val > max) max = val;
          }
        }
      }
    }

    return {
      count,
      numCount,
      sum: parseFloat(sum.toFixed(4)),
      avg: numCount > 0 ? parseFloat((sum / numCount).toFixed(4)) : 0,
      min: numCount > 0 ? min : 0,
      max: numCount > 0 ? max : 0,
    };
  }, [selection, currentSheet]);

  const handleStartRename = (sheet: SheetData) => {
    setEditingSheetId(sheet.id);
    setTempSheetName(sheet.name);
  };

  const handleFinishRename = (id: string) => {
    if (tempSheetName.trim()) {
      onRenameSheet(id, tempSheetName.trim());
    }
    setEditingSheetId(null);
  };

  return (
    <div className={`h-8 flex items-center justify-between px-2 text-xs border-t select-none transition-colors ${
      darkMode ? 'bg-[#202020] border-neutral-800 text-neutral-300' : 'bg-[#f0f0f0] border-neutral-300 text-neutral-700'
    }`}>
      {/* Left: Sheets Tabs List */}
      <div className="flex items-center gap-1 overflow-x-auto h-full py-0.5">
        {sheets.map((sheet) => {
          const isActive = sheet.id === activeSheetId;
          const isEditing = sheet.id === editingSheetId;

          return (
            <div
              key={sheet.id}
              className={`h-full flex items-center px-3 rounded-t text-xs font-medium cursor-pointer transition relative group ${
                isActive
                  ? darkMode
                    ? 'bg-[#1e1e1e] text-emerald-400 border-t-2 border-emerald-500 font-semibold'
                    : 'bg-white text-[#107c41] border-t-2 border-[#107c41] font-semibold shadow-sm'
                  : 'hover:bg-neutral-200/60 dark:hover:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400'
              }`}
              onClick={() => onSelectSheet(sheet.id)}
              onDoubleClick={() => handleStartRename(sheet)}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={tempSheetName}
                  autoFocus
                  onChange={(e) => setTempSheetName(e.target.value)}
                  onBlur={() => handleFinishRename(sheet.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFinishRename(sheet.id);
                    if (e.key === 'Escape') setEditingSheetId(null);
                  }}
                  className="w-20 bg-white dark:bg-neutral-800 border border-[#107c41] px-1 text-xs outline-none rounded"
                />
              ) : (
                <span className="truncate max-w-[120px]">{sheet.name}</span>
              )}

              {/* Close/Delete sheet button if more than 1 sheet */}
              {sheets.length > 1 && !isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSheet(sheet.id);
                  }}
                  title="Delete sheet"
                  className="ml-1.5 opacity-0 group-hover:opacity-100 hover:text-rose-500 rounded p-0.5 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add new Sheet Button */}
        <button
          onClick={onAddSheet}
          title="Add New Sheet"
          className="w-6 h-6 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition text-neutral-600 dark:text-neutral-300 ml-1"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right: Live Selection Stats & Zoom Slider */}
      <div className="flex items-center gap-4 text-[11px] font-mono flex-shrink-0">
        <div className="flex items-center gap-3 text-neutral-500 dark:text-neutral-400">
          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.2 rounded font-sans font-medium">
            Ready
          </span>

          {stats.count > 0 && (
            <>
              <span>Count: <strong>{stats.count}</strong></span>
              {stats.numCount > 0 && (
                <>
                  <span>Sum: <strong>{stats.sum}</strong></span>
                  <span>Avg: <strong>{stats.avg}</strong></span>
                  <span>Min: <strong>{stats.min}</strong></span>
                  <span>Max: <strong>{stats.max}</strong></span>
                </>
              )}
            </>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-neutral-300 dark:border-neutral-700">
          <button
            onClick={() => onSetZoom(Math.max(0.5, zoom - 0.1))}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span
            onClick={() => onSetZoom(1.0)}
            className="cursor-pointer hover:underline text-[10px] w-9 text-center font-sans font-medium"
            title="Click to reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onSetZoom(Math.min(2.0, zoom + 0.1))}
            className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
