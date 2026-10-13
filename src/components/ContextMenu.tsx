import React from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Plus,
  Minus,
  Trash2,
  BarChart2,
  Dna,
  DollarSign,
  Percent,
  Check,
  ListFilter
} from 'lucide-react';
import { CellFormat } from '../types/spreadsheet';

interface ContextMenuProps {
  x: number;
  y: number;
  target: { type: 'cell' | 'row' | 'col'; index?: number; cellId?: string };
  darkMode: boolean;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onInsertRow: () => void;
  onDeleteRow: () => void;
  onInsertCol: () => void;
  onDeleteCol: () => void;
  onClearContents: () => void;
  onFormat: (format: CellFormat) => void;
  onOpenChart: () => void;
  onOpenMolecularViewer: () => void;
  onOpenDataValidation?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  target,
  darkMode,
  onClose,
  onCut,
  onCopy,
  onPaste,
  onInsertRow,
  onDeleteRow,
  onInsertCol,
  onDeleteCol,
  onClearContents,
  onFormat,
  onOpenChart,
  onOpenMolecularViewer,
  onOpenDataValidation,
}) => {
  // Adjust menu position so it doesn't overflow the viewport
  const menuWidth = 210;
  const menuHeight = 310;
  const left = Math.min(x, window.innerWidth - menuWidth - 10);
  const top = Math.min(y, window.innerHeight - menuHeight - 10);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`fixed z-50 w-52 rounded-xl shadow-2xl border p-1 text-xs select-none animate-pop backdrop-blur-xl ${
        darkMode
          ? 'bg-[#252525]/95 border-neutral-700 text-neutral-200'
          : 'bg-white/95 border-neutral-200 text-neutral-800'
      }`}
      style={{ left, top }}
    >
      {/* Clipboard actions */}
      <button
        onClick={() => { onCut(); onClose(); }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#107c41]/10 hover:text-[#107c41] transition"
      >
        <div className="flex items-center gap-2">
          <Scissors className="w-3.5 h-3.5" />
          <span>Cut</span>
        </div>
        <span className="text-[10px] text-neutral-400 font-mono">Ctrl+X</span>
      </button>

      <button
        onClick={() => { onCopy(); onClose(); }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#107c41]/10 hover:text-[#107c41] transition"
      >
        <div className="flex items-center gap-2">
          <Copy className="w-3.5 h-3.5" />
          <span>Copy</span>
        </div>
        <span className="text-[10px] text-neutral-400 font-mono">Ctrl+C</span>
      </button>

      <button
        onClick={() => { onPaste(); onClose(); }}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-[#107c41]/10 hover:text-[#107c41] transition"
      >
        <div className="flex items-center gap-2">
          <Clipboard className="w-3.5 h-3.5" />
          <span>Paste</span>
        </div>
        <span className="text-[10px] text-neutral-400 font-mono">Ctrl+V</span>
      </button>

      <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

      {/* Insert / Delete */}
      <button
        onClick={() => { onInsertRow(); onClose(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      >
        <Plus className="w-3.5 h-3.5 text-emerald-600" />
        <span>Insert Row</span>
      </button>

      <button
        onClick={() => { onDeleteRow(); onClose(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-rose-600"
      >
        <Minus className="w-3.5 h-3.5" />
        <span>Delete Row</span>
      </button>

      <button
        onClick={() => { onInsertCol(); onClose(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
      >
        <Plus className="w-3.5 h-3.5 text-emerald-600" />
        <span>Insert Column</span>
      </button>

      <button
        onClick={() => { onDeleteCol(); onClose(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition text-rose-600"
      >
        <Minus className="w-3.5 h-3.5" />
        <span>Delete Column</span>
      </button>

      <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

      {/* Clear Contents */}
      <button
        onClick={() => { onClearContents(); onClose(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 transition"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span>Clear Contents</span>
      </button>

      <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

      {/* Visualization & Tools */}
      {onOpenDataValidation && (
        <button
          onClick={() => { onOpenDataValidation(); onClose(); }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 transition"
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Data Validation...</span>
        </button>
      )}

      <button
        onClick={() => { onOpenChart(); onClose(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 transition"
      >
        <BarChart2 className="w-3.5 h-3.5" />
        <span>Generate Chart</span>
      </button>

      <button
        onClick={() => { onOpenMolecularViewer(); onClose(); }}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 transition"
      >
        <Dna className="w-3.5 h-3.5" />
        <span>View Molecule (3D)</span>
      </button>
    </div>
  );
};
