import React, { useState } from 'react';
import {
  FileText,
  FolderOpen,
  Save,
  Download,
  Printer,
  FileSpreadsheet,
  Scissors,
  Copy,
  Clipboard,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
  Percent,
  Sigma,
  SortAsc,
  SortDesc,
  Trash2,
  BarChart3,
  LineChart,
  PieChart,
  AreaChart,
  Dna,
  FlaskConical,
  Atom,
  Eye,
  Plus,
  Minus,
  RefreshCw,
  Search,
  BookOpen,
  Boxes,
  HelpCircle,
  Activity,
  ListFilter
} from 'lucide-react';
import { CellFormat, CellStyle } from '../types/spreadsheet';

interface RibbonProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  darkMode: boolean;
  activeFormat?: CellFormat;
  activeStyle?: CellStyle;
  onApplyStyle: (property: keyof CellStyle, value: any) => void;
  onApplyFormat: (format: CellFormat) => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onInsertRow: () => void;
  onDeleteRow: () => void;
  onInsertCol: () => void;
  onDeleteCol: () => void;
  onClearContents: () => void;
  onAutoSum: (fn: string) => void;
  onSort: (direction: 'asc' | 'desc') => void;
  onNewWorkbook: () => void;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onExportCSV: () => void;
  onPrint: () => void;
  onOpenChartModal: (type: 'bar' | 'line' | 'pie' | 'area') => void;
  onOpenMolecularViewer: () => void;
  onLoadBioTemplate: (templateKey: 'genomics' | 'drugScreen' | 'clinicalTrial') => void;
  onRecalculate: () => void;
  showGridlines: boolean;
  onToggleGridlines: () => void;
  showHeaders: boolean;
  onToggleHeaders: () => void;
  zoom: number;
  onSetZoom: (zoom: number) => void;
  onOpenDesktopGuide: () => void;
  onInsertSparkline: (type: 'line' | 'bar') => void;
  onOpenDataValidation: () => void;
}

export const Ribbon: React.FC<RibbonProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  activeFormat,
  activeStyle,
  onApplyStyle,
  onApplyFormat,
  onCut,
  onCopy,
  onPaste,
  onInsertRow,
  onDeleteRow,
  onInsertCol,
  onDeleteCol,
  onClearContents,
  onAutoSum,
  onSort,
  onNewWorkbook,
  onOpenFile,
  onSaveFile,
  onExportCSV,
  onPrint,
  onOpenChartModal,
  onOpenMolecularViewer,
  onLoadBioTemplate,
  onRecalculate,
  showGridlines,
  onToggleGridlines,
  showHeaders,
  onToggleHeaders,
  zoom,
  onSetZoom,
  onOpenDesktopGuide,
  onInsertSparkline,
  onOpenDataValidation,
}) => {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [selectedFont, setSelectedFont] = useState(activeStyle?.fontFamily || 'Segoe UI');
  const [selectedFontSize, setSelectedFontSize] = useState(activeStyle?.fontSize || 13);

  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'formulas', label: 'Formulas' },
    { id: 'data', label: 'Data' },
    { id: 'bio', label: 'BioScience & Research', icon: Dna },
    { id: 'view', label: 'View' },
  ];

  return (
    <div className={`border-b select-none transition-colors ${
      darkMode ? 'bg-[#252525] border-neutral-800 text-neutral-200' : 'bg-white border-neutral-200/90 text-neutral-800'
    }`}>
      {/* Ribbon Tab Bar */}
      <div className="flex items-center px-2 pt-1 gap-0.5 border-b border-neutral-200 dark:border-neutral-800 text-xs">
        {/* File Menu Button */}
        <div className="relative">
          <button
            onClick={() => setShowFileMenu(!showFileMenu)}
            className="px-3.5 py-1 rounded-t font-semibold bg-[#107c41] text-white hover:bg-[#0c6334] transition flex items-center gap-1.5"
          >
            <span>File</span>
          </button>

          {/* File Dropdown / Backstage */}
          {showFileMenu && (
            <div
              className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-[#2a2a2a] rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 p-1.5 z-50 animate-pop text-xs"
              onClick={() => setShowFileMenu(false)}
            >
              <button
                onClick={onNewWorkbook}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
                <div>
                  <div className="font-medium">New Workbook</div>
                  <div className="text-[10px] text-neutral-400">Blank spreadsheet</div>
                </div>
              </button>

              <button
                onClick={onOpenFile}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition"
              >
                <FolderOpen className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-medium">Open (.xlsx, .csv)</div>
                  <div className="text-[10px] text-neutral-400">Import from disk</div>
                </div>
              </button>

              <button
                onClick={onSaveFile}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition"
              >
                <Save className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-medium">Save (.xlsx)</div>
                  <div className="text-[10px] text-neutral-400">Save full workbook</div>
                </div>
              </button>

              <button
                onClick={onExportCSV}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition"
              >
                <Download className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-medium">Export CSV</div>
                  <div className="text-[10px] text-neutral-400">Comma-separated values</div>
                </div>
              </button>

              <button
                onClick={onPrint}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition"
              >
                <Printer className="w-4 h-4 text-purple-500" />
                <div>
                  <div className="font-medium">Print to PDF</div>
                  <div className="text-[10px] text-neutral-400">System print dialog</div>
                </div>
              </button>

              <div className="h-px bg-neutral-200 dark:bg-neutral-700 my-1" />

              <button
                onClick={onOpenDesktopGuide}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#107c41]/10 text-left text-[#107c41] dark:text-emerald-400 transition"
              >
                <Boxes className="w-4 h-4" />
                <div>
                  <div className="font-semibold">Windows 11 Build & Packager</div>
                  <div className="text-[10px] opacity-80">Electron / Tauri installer setup</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 font-medium transition rounded-t flex items-center gap-1.5 ${
                isActive
                  ? 'text-[#107c41] border-b-2 border-[#107c41] font-semibold bg-neutral-50 dark:bg-neutral-800/60'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800/40'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Ribbon Content Panels */}
      <div className="px-3 py-1.5 flex items-center gap-3 overflow-x-auto min-h-[58px]">
        {/* ========================================================= */}
        {/* 1. HOME TAB */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <>
            {/* Clipboard Group */}
            <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-800 pr-2.5">
              <button
                onClick={onPaste}
                title="Paste from clipboard (Ctrl + V)"
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded flex flex-col items-center min-w-[34px] text-neutral-700 dark:text-neutral-300"
              >
                <Clipboard className="w-4 h-4 text-emerald-600" />
                <span className="text-[9px] mt-0.5">Paste</span>
              </button>
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={onCut}
                  title="Cut (Ctrl + X)"
                  className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300 flex items-center gap-1 text-[10px]"
                >
                  <Scissors className="w-3 h-3 text-neutral-500" />
                  <span>Cut</span>
                </button>
                <button
                  onClick={onCopy}
                  title="Copy (Ctrl + C)"
                  className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300 flex items-center gap-1 text-[10px]"
                >
                  <Copy className="w-3 h-3 text-neutral-500" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Font Group */}
            <div className="flex items-center gap-1.5 border-r border-neutral-200 dark:border-neutral-800 pr-2.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <select
                    value={selectedFont}
                    onChange={(e) => {
                      setSelectedFont(e.target.value);
                      onApplyStyle('fontFamily', e.target.value);
                    }}
                    className="border border-neutral-300 dark:border-neutral-700 rounded px-1 py-0.5 text-xs bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 outline-none w-28"
                  >
                    <option value="Segoe UI">Segoe UI</option>
                    <option value="Inter">Inter</option>
                    <option value="Arial">Arial</option>
                    <option value="Calibri">Calibri</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                    <option value="Times New Roman">Times New Roman</option>
                  </select>

                  <select
                    value={selectedFontSize}
                    onChange={(e) => {
                      const size = parseInt(e.target.value, 10);
                      setSelectedFontSize(size);
                      onApplyStyle('fontSize', size);
                    }}
                    className="border border-neutral-300 dark:border-neutral-700 rounded px-1 py-0.5 text-xs bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 outline-none w-14"
                  >
                    {[9, 10, 11, 12, 13, 14, 16, 18, 20, 24].map((sz) => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onApplyStyle('bold', !activeStyle?.bold)}
                    title="Bold (Ctrl+B)"
                    className={`w-6 h-6 flex items-center justify-center rounded transition ${
                      activeStyle?.bold
                        ? 'bg-[#107c41]/20 text-[#107c41] font-bold'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onApplyStyle('italic', !activeStyle?.italic)}
                    title="Italic (Ctrl+I)"
                    className={`w-6 h-6 flex items-center justify-center rounded transition ${
                      activeStyle?.italic
                        ? 'bg-[#107c41]/20 text-[#107c41]'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onApplyStyle('underline', !activeStyle?.underline)}
                    title="Underline (Ctrl+U)"
                    className={`w-6 h-6 flex items-center justify-center rounded transition ${
                      activeStyle?.underline
                        ? 'bg-[#107c41]/20 text-[#107c41]'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onApplyStyle('strikethrough', !activeStyle?.strikethrough)}
                    title="Strikethrough"
                    className={`w-6 h-6 flex items-center justify-center rounded transition ${
                      activeStyle?.strikethrough
                        ? 'bg-[#107c41]/20 text-[#107c41]'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>

                  {/* Text Color Picker */}
                  <div className="relative flex items-center ml-1" title="Font Color">
                    <input
                      type="color"
                      value={activeStyle?.color || '#000000'}
                      onChange={(e) => onApplyStyle('color', e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                    />
                  </div>

                  {/* Cell Background Picker */}
                  <div className="relative flex items-center ml-1" title="Cell Fill Color">
                    <input
                      type="color"
                      value={activeStyle?.bg || '#ffffff'}
                      onChange={(e) => onApplyStyle('bg', e.target.value)}
                      className="w-5 h-5 rounded cursor-pointer border border-neutral-300 dark:border-neutral-700 p-0"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Alignment Group */}
            <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-800 pr-2.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => onApplyStyle('align', 'left')}
                    title="Align Left"
                    className={`w-6 h-6 flex items-center justify-center rounded ${
                      activeStyle?.align === 'left' ? 'bg-[#107c41]/20 text-[#107c41]' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onApplyStyle('align', 'center')}
                    title="Align Center"
                    className={`w-6 h-6 flex items-center justify-center rounded ${
                      activeStyle?.align === 'center' ? 'bg-[#107c41]/20 text-[#107c41]' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onApplyStyle('align', 'right')}
                    title="Align Right"
                    className={`w-6 h-6 flex items-center justify-center rounded ${
                      activeStyle?.align === 'right' ? 'bg-[#107c41]/20 text-[#107c41]' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[10px] text-center text-neutral-400">Alignment</div>
              </div>
            </div>

            {/* Number Formatting Group */}
            <div className="flex items-center gap-1.5 border-r border-neutral-200 dark:border-neutral-800 pr-2.5">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onApplyFormat('currency_usd')}
                    title="Currency (USD $)"
                    className="px-1.5 py-0.5 text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    $
                  </button>
                  <button
                    onClick={() => onApplyFormat('currency_inr')}
                    title="Currency (INR ₹)"
                    className="px-1.5 py-0.5 text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    ₹
                  </button>
                  <button
                    onClick={() => onApplyFormat('currency_eur')}
                    title="Currency (EUR €)"
                    className="px-1.5 py-0.5 text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-semibold text-emerald-700 dark:text-emerald-400"
                  >
                    €
                  </button>
                  <button
                    onClick={() => onApplyFormat('percent')}
                    title="Percent (%)"
                    className="px-1.5 py-0.5 text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-semibold text-blue-600 dark:text-blue-400"
                  >
                    %
                  </button>
                  <button
                    onClick={() => onApplyFormat('decimal_2')}
                    title="Comma 2-Decimals"
                    className="px-1.5 py-0.5 text-xs border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-mono text-neutral-600 dark:text-neutral-300"
                  >
                    .00
                  </button>
                </div>
                <div className="text-[10px] text-center text-neutral-400">Number</div>
              </div>
            </div>

            {/* Cells Structure: Row/Column operations */}
            <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-800 pr-2.5">
              <div className="flex items-center gap-1">
                <button
                  onClick={onInsertRow}
                  title="Insert Row Above"
                  className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded text-xs flex items-center gap-1 text-neutral-700 dark:text-neutral-300"
                >
                  <Plus className="w-3 h-3 text-emerald-600" /> Row
                </button>
                <button
                  onClick={onDeleteRow}
                  title="Delete Selected Row"
                  className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded text-xs flex items-center gap-1 text-neutral-700 dark:text-neutral-300"
                >
                  <Minus className="w-3 h-3 text-rose-600" /> Row
                </button>
                <button
                  onClick={onInsertCol}
                  title="Insert Column Left"
                  className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded text-xs flex items-center gap-1 text-neutral-700 dark:text-neutral-300"
                >
                  <Plus className="w-3 h-3 text-emerald-600" /> Col
                </button>
                <button
                  onClick={onDeleteCol}
                  title="Delete Selected Column"
                  className="px-2 py-1 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded text-xs flex items-center gap-1 text-neutral-700 dark:text-neutral-300"
                >
                  <Minus className="w-3 h-3 text-rose-600" /> Col
                </button>
              </div>
            </div>

            {/* Quick AutoSum & Sort */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAutoSum('SUM')}
                title="AutoSum formula"
                className="px-2.5 py-1 bg-[#107c41]/10 hover:bg-[#107c41]/20 text-[#107c41] dark:text-emerald-300 rounded font-medium text-xs flex items-center gap-1 border border-[#107c41]/30"
              >
                <Sigma className="w-3.5 h-3.5" /> AutoSum
              </button>
              <button
                onClick={() => onSort('asc')}
                title="Sort A to Z"
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300"
              >
                <SortAsc className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={() => onSort('desc')}
                title="Sort Z to A"
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-700 dark:text-neutral-300"
              >
                <SortDesc className="w-4 h-4 text-blue-600" />
              </button>
              <button
                onClick={onClearContents}
                title="Clear contents in selection"
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        {/* ========================================================= */}
        {/* 2. INSERT TAB (Charts & Visualizations) */}
        {/* ========================================================= */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-r border-neutral-200 dark:border-neutral-800 pr-3">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Charts:</span>
              <button
                onClick={() => onOpenChartModal('bar')}
                className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-200 transition"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Bar Chart</span>
              </button>
              <button
                onClick={() => onOpenChartModal('line')}
                className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-200 transition"
              >
                <LineChart className="w-4 h-4 text-blue-600" />
                <span>Line Graph</span>
              </button>
              <button
                onClick={() => onOpenChartModal('pie')}
                className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-200 transition"
              >
                <PieChart className="w-4 h-4 text-purple-600" />
                <span>Pie / Donut</span>
              </button>
              <button
                onClick={() => onOpenChartModal('area')}
                className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-200 transition"
              >
                <AreaChart className="w-4 h-4 text-amber-600" />
                <span>Area Chart</span>
              </button>
            </div>

            {/* Sparklines Group */}
            <div className="flex items-center gap-1.5 border-r border-neutral-200 dark:border-neutral-800 pr-3">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Sparklines:</span>
              <button
                onClick={() => onInsertSparkline('line')}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-200 transition"
                title="Insert Line Sparkline into cell"
              >
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Line Sparkline</span>
              </button>
              <button
                onClick={() => onInsertSparkline('bar')}
                className="px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded flex items-center gap-1.5 text-xs text-neutral-700 dark:text-neutral-200 transition"
                title="Insert Column/Bar Sparkline into cell"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Bar Sparkline</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenMolecularViewer}
                className="px-3 py-1.5 bg-[#1a73e8]/10 text-[#1a73e8] hover:bg-[#1a73e8]/20 dark:bg-[#1a73e8]/20 dark:text-[#65cbf3] rounded flex items-center gap-1.5 text-xs font-semibold transition"
              >
                <Dna className="w-4 h-4" />
                <span>3D Molecular Structure</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. FORMULAS TAB */}
        {/* ========================================================= */}
        {activeTab === 'formulas' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-800 pr-2">
              <button
                onClick={() => onAutoSum('SUM')}
                className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-xs font-medium text-emerald-700 dark:text-emerald-400"
              >
                =SUM()
              </button>
              <button
                onClick={() => onAutoSum('AVERAGE')}
                className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-xs font-medium text-blue-700 dark:text-blue-400"
              >
                =AVERAGE()
              </button>
              <button
                onClick={() => onAutoSum('COUNT')}
                className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-xs font-medium text-purple-700 dark:text-purple-400"
              >
                =COUNT()
              </button>
              <button
                onClick={() => onAutoSum('MAX')}
                className="px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-xs font-medium text-amber-700 dark:text-amber-400"
              >
                =MAX()
              </button>
            </div>

            {/* Advanced & Bio Formulas */}
            <div className="flex items-center gap-2 border-r border-neutral-200 dark:border-neutral-800 pr-2">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">Bio Formulas:</span>
              <span className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
                =GC_CONTENT(seq)
              </span>
              <span className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400">
                =TRANSLATE(dna)
              </span>
              <span className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-purple-600 dark:text-purple-400">
                =BIO_INFO(gene, "uniprot")
              </span>
              <span className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-amber-600 dark:text-amber-400">
                =SPARKLINE(range)
              </span>
            </div>

            <button
              onClick={onRecalculate}
              className="px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-xs font-medium flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Calculate Now (F9)</span>
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. DATA TAB */}
        {/* ========================================================= */}
        {activeTab === 'data' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 border-r border-neutral-200 dark:border-neutral-800 pr-3">
              <button
                onClick={() => onSort('asc')}
                className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded text-xs flex items-center gap-1"
              >
                <SortAsc className="w-3.5 h-3.5 text-blue-600" /> Sort Ascending (A-Z)
              </button>
              <button
                onClick={() => onSort('desc')}
                className="px-2.5 py-1 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded text-xs flex items-center gap-1"
              >
                <SortDesc className="w-3.5 h-3.5 text-blue-600" /> Sort Descending (Z-A)
              </button>
            </div>

            {/* Data Validation Button */}
            <div className="flex items-center gap-1.5 border-r border-neutral-200 dark:border-neutral-800 pr-3">
              <button
                onClick={onOpenDataValidation}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded text-xs font-semibold flex items-center gap-1.5 transition"
                title="Data Validation: Restrict cell input to lists, numbers, or rules"
              >
                <ListFilter className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data Validation</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500">Fast Data Ingestion:</span>
              <button
                onClick={onOpenFile}
                className="px-2.5 py-1 bg-[#107c41]/10 text-[#107c41] rounded text-xs font-medium hover:bg-[#107c41]/20 transition"
              >
                Import Excel / CSV
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. BIOSCIENCE & RESEARCH TAB (Science Skill Integration) */}
        {/* ========================================================= */}
        {activeTab === 'bio' && (
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 border-r border-neutral-200 dark:border-neutral-800 pr-2.5">
              <span className="text-[10px] uppercase font-semibold text-neutral-400 mr-1">Load Research Data:</span>
              <button
                onClick={() => onLoadBioTemplate('genomics')}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Dna className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cancer Genomics Matrix</span>
              </button>
              <button
                onClick={() => onLoadBioTemplate('drugScreen')}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 rounded text-xs font-medium flex items-center gap-1.5 transition"
              >
                <FlaskConical className="w-3.5 h-3.5 text-blue-600" />
                <span>Drug Discovery Screen</span>
              </button>
              <button
                onClick={() => onLoadBioTemplate('clinicalTrial')}
                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Atom className="w-3.5 h-3.5 text-purple-600" />
                <span>Biomarker Clinical Cohort</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenMolecularViewer}
                className="px-3 py-1 bg-[#1a73e8] text-white hover:bg-[#1557b0] rounded text-xs font-medium flex items-center gap-1.5 shadow-sm transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open 3D PDB / Molecule Visualizer</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. VIEW TAB */}
        {/* ========================================================= */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border-r border-neutral-200 dark:border-neutral-800 pr-3">
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGridlines}
                  onChange={onToggleGridlines}
                  className="rounded text-[#107c41] focus:ring-0 cursor-pointer"
                />
                <span>Gridlines</span>
              </label>
              <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none ml-2">
                <input
                  type="checkbox"
                  checked={showHeaders}
                  onChange={onToggleHeaders}
                  className="rounded text-[#107c41] focus:ring-0 cursor-pointer"
                />
                <span>Row & Column Headers</span>
              </label>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500">Zoom:</span>
              {[0.75, 1.0, 1.25, 1.5].map((z) => (
                <button
                  key={z}
                  onClick={() => onSetZoom(z)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition ${
                    zoom === z
                      ? 'bg-[#107c41] text-white'
                      : 'hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {Math.round(z * 100)}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
