import React, { useState, useRef, useEffect } from 'react';
import { X, Check, FunctionSquare } from 'lucide-react';

interface FormulaBarProps {
  activeCellAddress: string;
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  darkMode: boolean;
}

const COMMON_FUNCTIONS = [
  { name: 'SUM', syntax: 'SUM(range)', desc: 'Adds all numbers in a range of cells' },
  { name: 'AVERAGE', syntax: 'AVERAGE(range)', desc: 'Returns the average of its arguments' },
  { name: 'COUNT', syntax: 'COUNT(range)', desc: 'Counts numbers in a range' },
  { name: 'COUNTA', syntax: 'COUNTA(range)', desc: 'Counts non-empty cells in a range' },
  { name: 'IF', syntax: 'IF(condition, value_if_true, [value_if_false])', desc: 'Specifies a logical test to perform' },
  { name: 'VLOOKUP', syntax: 'VLOOKUP(lookup_val, table_range, col_index, [approx])', desc: 'Looks for a value in the leftmost column' },
  { name: 'XLOOKUP', syntax: 'XLOOKUP(lookup_val, lookup_range, return_range)', desc: 'Searches a range and returns an item' },
  { name: 'INDEX', syntax: 'INDEX(array, row_num, [col_num])', desc: 'Returns a value or reference of the cell' },
  { name: 'MATCH', syntax: 'MATCH(lookup_val, lookup_range, [match_type])', desc: 'Returns relative position of an item' },
  { name: 'CONCAT', syntax: 'CONCAT(text1, [text2], ...)', desc: 'Combines text from multiple ranges' },
  { name: 'GC_CONTENT', syntax: 'GC_CONTENT(sequence)', desc: 'Calculates GC% content of DNA or RNA' },
  { name: 'TRANSLATE', syntax: 'TRANSLATE(dna_sequence)', desc: 'Translates nucleotide codons to amino acids' },
  { name: 'COMPLEMENT', syntax: 'COMPLEMENT(dna_sequence)', desc: 'Returns reverse complement of DNA' },
  { name: 'MOLECULAR_WEIGHT', syntax: 'MOLECULAR_WEIGHT(sequence_or_formula)', desc: 'Estimates molecular weight in Daltons' },
  { name: 'BIO_INFO', syntax: 'BIO_INFO(gene_or_compound, field)', desc: 'Fetches UniProt, PubChem, or PDB metadata' },
];

export const FormulaBar: React.FC<FormulaBarProps> = ({
  activeCellAddress,
  value,
  onChange,
  onSubmit,
  onCancel,
  darkMode,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Suggestions filter when formula starts with '='
  const suggestions = React.useMemo(() => {
    if (!value.startsWith('=')) return [];
    const afterEqual = value.substring(1).toUpperCase().trim();
    if (!afterEqual || afterEqual.includes('(')) return [];
    return COMMON_FUNCTIONS.filter(f => f.name.startsWith(afterEqual));
  }, [value]);

  useEffect(() => {
    setShowSuggestions(suggestions.length > 0);
  }, [suggestions]);

  const insertFunction = (fnName: string) => {
    onChange(`=${fnName}(`);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`h-8 flex items-center px-2 text-xs border-b select-none transition-colors relative z-20 ${
      darkMode ? 'bg-[#282828] border-neutral-800 text-neutral-200' : 'bg-white border-neutral-200 text-neutral-800'
    }`}>
      {/* Active Cell Address Box */}
      <div className="w-16 h-6 px-1.5 flex items-center justify-center font-semibold text-center bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-700 dark:text-neutral-300 font-mono text-[11px] shadow-inner mr-1.5">
        {activeCellAddress || 'A1'}
      </div>

      {/* Cancel Button */}
      <button
        onClick={onCancel}
        title="Cancel (Esc)"
        className="w-6 h-6 flex items-center justify-center hover:bg-rose-100 dark:hover:bg-rose-950/40 text-neutral-400 hover:text-rose-600 rounded transition mr-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Accept / Enter Button */}
      <button
        onClick={onSubmit}
        title="Enter / Commit (Enter)"
        className="w-6 h-6 flex items-center justify-center hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-neutral-400 hover:text-emerald-600 rounded transition mr-1.5"
      >
        <Check className="w-3.5 h-3.5" />
      </button>

      {/* Function fx button */}
      <div className="flex items-center text-neutral-400 dark:text-neutral-500 font-serif font-bold italic text-sm px-1.5 border-r border-neutral-300 dark:border-neutral-700 mr-2 cursor-pointer hover:text-[#107c41]">
        fx
      </div>

      {/* Formula / Value Input Box */}
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder="Enter a value or formula (e.g. =SUM(A1:A5), =GC_CONTENT(B2), =BIO_INFO('TP53', 'uniprot'))"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSubmit();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancel();
            }
          }}
          className={`w-full h-6 px-2 text-xs outline-none bg-transparent font-mono transition-colors ${
            value.startsWith('=') ? 'text-[#107c41] dark:text-emerald-400 font-medium' : ''
          }`}
        />

        {/* Function suggestions popup */}
        {showSuggestions && (
          <div className="absolute left-0 top-full mt-1 w-80 bg-white dark:bg-[#2c2c2c] border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-2xl p-1.5 z-50 text-xs animate-pop">
            <div className="text-[10px] text-neutral-400 uppercase font-semibold px-2 py-0.5 mb-1">
              Function Suggestions
            </div>
            {suggestions.map((sug) => (
              <div
                key={sug.name}
                onClick={() => insertFunction(sug.name)}
                className="px-2 py-1.5 rounded hover:bg-[#107c41]/10 dark:hover:bg-emerald-950/40 cursor-pointer flex flex-col gap-0.5 transition"
              >
                <div className="font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                  {sug.syntax}
                </div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                  {sug.desc}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
