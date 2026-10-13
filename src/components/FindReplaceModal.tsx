import React, { useState } from 'react';
import { X, Search, Replace, ChevronUp, ChevronDown } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  darkMode: boolean;
  onClose: () => void;
  onFind: (query: string, matchCase: boolean, direction: 'next' | 'prev') => { total: number; current: number };
  onReplace: (findText: string, replaceText: string, matchCase: boolean) => void;
  onReplaceAll: (findText: string, replaceText: string, matchCase: boolean) => number;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  darkMode,
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matchStats, setMatchStats] = useState<{ total: number; current: number }>({ total: 0, current: 0 });

  if (!isOpen) return null;

  const handleNext = () => {
    if (!findText) return;
    const res = onFind(findText, matchCase, 'next');
    setMatchStats(res);
  };

  const handlePrev = () => {
    if (!findText) return;
    const res = onFind(findText, matchCase, 'prev');
    setMatchStats(res);
  };

  const handleReplace = () => {
    if (!findText) return;
    onReplace(findText, replaceText, matchCase);
    handleNext();
  };

  const handleReplaceAll = () => {
    if (!findText) return;
    const count = onReplaceAll(findText, replaceText, matchCase);
    setMatchStats({ total: 0, current: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border p-4 flex flex-col gap-3.5 animate-pop ${
        darkMode ? 'bg-[#252525] border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
      }`}>
        <div className="flex items-center justify-between border-b pb-2 border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-[#107c41]" />
            <h4 className="font-bold text-sm">Find and Replace</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 text-xs">
          <div>
            <label className="block text-neutral-500 font-semibold mb-1">Find what:</label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={findText}
                autoFocus
                onChange={(e) => {
                  setFindText(e.target.value);
                  if (e.target.value) {
                    const res = onFind(e.target.value, matchCase, 'next');
                    setMatchStats(res);
                  } else {
                    setMatchStats({ total: 0, current: 0 });
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleNext();
                }}
                placeholder="Search text or formula..."
                className="flex-1 px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
              />
              <button
                onClick={handlePrev}
                title="Previous match"
                className="p-1.5 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                title="Next match"
                className="p-1.5 border border-neutral-300 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-neutral-500 font-semibold mb-1">Replace with:</label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement value..."
              className="w-full px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded text-[#107c41] focus:ring-0 cursor-pointer"
              />
              <span>Match case</span>
            </label>

            {matchStats.total > 0 && (
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                Match {matchStats.current} of {matchStats.total}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-3 border-neutral-200 dark:border-neutral-700 text-xs">
          <button
            onClick={handleReplace}
            className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded font-medium transition"
          >
            Replace
          </button>
          <button
            onClick={handleReplaceAll}
            className="px-3 py-1.5 bg-[#107c41] text-white hover:bg-[#0c6334] rounded font-semibold transition"
          >
            Replace All
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 rounded transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
