import React, { useState } from 'react';
import {
  Save,
  Undo2,
  Redo2,
  Search,
  Moon,
  Sun,
  Dna,
  Laptop,
  Minus,
  Square,
  X,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

interface TitlebarProps {
  title: string;
  isDirty: boolean;
  darkMode: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onRename: (newName: string) => void;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleDarkMode: () => void;
  onOpenSearch: () => void;
  onOpenDesktopGuide: () => void;
  onOpenMolecularViewer: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  title,
  isDirty,
  darkMode,
  canUndo,
  canRedo,
  onRename,
  onSave,
  onUndo,
  onRedo,
  onToggleDarkMode,
  onOpenSearch,
  onOpenDesktopGuide,
  onOpenMolecularViewer,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showSnapLayout, setShowSnapLayout] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (tempTitle.trim()) {
      onRename(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
  };

  return (
    <div className={`h-10 select-none flex items-center justify-between px-2 text-xs border-b transition-colors relative z-40 ${
      darkMode
        ? 'bg-[#1f1f1f]/95 text-neutral-200 border-neutral-800'
        : 'bg-[#f3f3f3]/95 text-neutral-800 border-neutral-300/80'
    } backdrop-blur-xl`}>
      {/* Left: App Icon & Quick Access Toolbar */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-[#107c41]/15 text-[#107c41] font-bold text-xs">
          <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
          <span className="font-semibold tracking-tight text-[11px] hidden sm:inline">BioCalc 11</span>
        </div>

        {/* Quick Access Icons */}
        <div className="flex items-center gap-0.5 ml-1 border-l border-neutral-300 dark:border-neutral-700 pl-1.5">
          <button
            onClick={onSave}
            title="Save Workbook (Ctrl + S)"
            className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded transition text-neutral-700 dark:text-neutral-300"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl + Z)"
            className={`p-1 rounded transition ${
              canUndo
                ? 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl + Y)"
            className={`p-1 rounded transition ${
              canRedo
                ? 'hover:bg-black/5 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300'
                : 'opacity-30 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center: Title / Document Name & Search Bar */}
      <div className="flex items-center justify-center gap-3 flex-1 px-4">
        {/* Document Title */}
        <div className="flex items-center gap-1.5">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              autoFocus
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSubmit();
                if (e.key === 'Escape') {
                  setTempTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              className="bg-white dark:bg-neutral-800 border border-[#107c41] px-2 py-0.5 rounded text-xs outline-none shadow-sm font-medium"
            />
          ) : (
            <div
              onClick={() => {
                setTempTitle(title);
                setIsEditingTitle(true);
              }}
              title="Click to rename workbook"
              className="px-2 py-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer font-medium text-xs flex items-center gap-1.5 transition"
            >
              <span className="truncate max-w-[200px]">{title}</span>
              {isDirty ? (
                <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
              ) : (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Saved
                </span>
              )}
            </div>
          )}
        </div>

        {/* Global Workbook Search */}
        <button
          onClick={onOpenSearch}
          className="hidden md:flex items-center gap-2 px-3 py-1 bg-white/70 dark:bg-neutral-800/80 border border-neutral-300/70 dark:border-neutral-700 rounded-md text-[11px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 shadow-sm transition w-56 justify-between"
        >
          <div className="flex items-center gap-1.5">
            <Search className="w-3 h-3" />
            <span>Search cells...</span>
          </div>
          <span className="text-[9px] bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.2 rounded font-mono">Ctrl+F</span>
        </button>
      </div>

      {/* Right: Quick Tools & Windows 11 Chrome Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* 3D Molecular / Chemical Viewer Trigger */}
        <button
          onClick={onOpenMolecularViewer}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#1a73e8]/10 text-[#1a73e8] hover:bg-[#1a73e8]/20 dark:bg-[#1a73e8]/20 dark:text-[#65cbf3] rounded transition"
          title="Open 3D Molecular Structure & Bio Viewer"
        >
          <Dna className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">3D Molecules</span>
        </button>

        {/* Desktop Architecture & Installer Guide */}
        <button
          onClick={onOpenDesktopGuide}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium bg-[#107c41]/10 text-[#107c41] hover:bg-[#107c41]/20 dark:bg-emerald-950/40 dark:text-emerald-300 rounded transition"
          title="Windows 11 Native Architecture & Packaging Info"
        >
          <Laptop className="w-3.5 h-3.5" />
          <span className="hidden xl:inline">Win11 Desktop</span>
        </button>

        {/* Dark/Light mode toggle */}
        <button
          onClick={onToggleDarkMode}
          title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded transition text-neutral-600 dark:text-neutral-300"
        >
          {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Windows 11 Native Window Controls */}
        <div className="flex items-center ml-2 border-l border-neutral-300 dark:border-neutral-700 pl-1">
          <button
            title="Minimize"
            className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Maximize / Restore with Windows 11 Snap Layouts Preview */}
          <div
            className="relative"
            onMouseEnter={() => setShowSnapLayout(true)}
            onMouseLeave={() => setShowSnapLayout(false)}
          >
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              title="Maximize (Snap Layouts on hover)"
              className="w-8 h-8 flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-neutral-600 dark:text-neutral-300 transition"
            >
              <Square className="w-3 h-3" />
            </button>

            {/* Windows 11 Snap Layout flyout */}
            {showSnapLayout && (
              <div className="absolute top-9 right-0 bg-white dark:bg-[#2c2c2c] p-2.5 rounded-lg shadow-2xl border border-neutral-200 dark:border-neutral-700 grid grid-cols-2 gap-2 w-48 z-50 animate-pop">
                <div className="text-[10px] text-neutral-400 col-span-2 font-semibold uppercase tracking-wider mb-0.5">
                  Windows 11 Snap Layouts
                </div>
                {/* 50/50 Snap */}
                <div className="p-1 border border-neutral-200 dark:border-neutral-600 rounded flex gap-1 h-12 hover:border-[#107c41] cursor-pointer group">
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                </div>
                {/* 2/3 and 1/3 Snap */}
                <div className="p-1 border border-neutral-200 dark:border-neutral-600 rounded flex gap-1 h-12 hover:border-[#107c41] cursor-pointer group">
                  <div className="flex-[2] bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                </div>
                {/* 3 columns */}
                <div className="p-1 border border-neutral-200 dark:border-neutral-600 rounded flex gap-1 h-12 hover:border-[#107c41] cursor-pointer group">
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                </div>
                {/* 4 quadrants */}
                <div className="p-1 border border-neutral-200 dark:border-neutral-600 rounded grid grid-cols-2 gap-1 h-12 hover:border-[#107c41] cursor-pointer group">
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                  <div className="bg-neutral-100 dark:bg-neutral-800 rounded group-hover:bg-[#107c41]/30 transition" />
                </div>
              </div>
            )}
          </div>

          <button
            title="Close"
            className="w-8 h-8 flex items-center justify-center hover:bg-rose-600 hover:text-white text-neutral-600 dark:text-neutral-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
