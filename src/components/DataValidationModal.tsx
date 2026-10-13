import React, { useState } from 'react';
import { X, CheckSquare, ListFilter, AlertCircle, Trash2 } from 'lucide-react';
import { DataValidationRule, ValidationType, ValidationOperator } from '../types/spreadsheet';

interface DataValidationModalProps {
  isOpen: boolean;
  currentRule?: DataValidationRule;
  selectionAddress: string;
  darkMode: boolean;
  onClose: () => void;
  onApply: (rule: DataValidationRule) => void;
  onClear: () => void;
}

export const DataValidationModal: React.FC<DataValidationModalProps> = ({
  isOpen,
  currentRule,
  selectionAddress,
  darkMode,
  onClose,
  onApply,
  onClear,
}) => {
  const [valType, setValType] = useState<ValidationType>(currentRule?.type || 'list');
  const [operator, setOperator] = useState<ValidationOperator>(currentRule?.operator || 'between');
  const [formula1, setFormula1] = useState(
    currentRule?.formula1 || 'Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase, Lipid Phosphatase, Ser/Thr Kinase'
  );
  const [formula2, setFormula2] = useState(currentRule?.formula2 || '');
  const [allowBlank, setAllowBlank] = useState(currentRule?.allowBlank ?? true);
  const [showDropdown, setShowDropdown] = useState(currentRule?.showDropdown ?? true);
  const [errorTitle, setErrorTitle] = useState(currentRule?.errorTitle || 'Invalid Input');
  const [errorMessage, setErrorMessage] = useState(
    currentRule?.errorMessage || 'The value you entered does not match the data validation restrictions defined for this cell.'
  );

  if (!isOpen) return null;

  const handleSave = () => {
    const rule: DataValidationRule = {
      type: valType,
      operator: valType === 'list' ? undefined : operator,
      formula1: formula1.trim(),
      formula2: formula2.trim() || undefined,
      allowBlank,
      showDropdown,
      errorTitle,
      errorMessage,
    };
    onApply(rule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border p-5 flex flex-col gap-4 animate-pop ${
          darkMode ? 'bg-[#252525] border-neutral-700 text-neutral-100' : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#107c41]/15 text-[#107c41] rounded-lg">
              <ListFilter className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Data Validation</h3>
              <p className="text-[11px] text-neutral-400">
                Range: <span className="font-mono font-semibold text-[#107c41]">{selectionAddress}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Criteria */}
        <div className="flex flex-col gap-3 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-neutral-600 dark:text-neutral-400">Allow:</label>
            <select
              value={valType}
              onChange={(e) => setValType(e.target.value as ValidationType)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none font-medium"
            >
              <option value="list">List (Dropdown)</option>
              <option value="whole_number">Whole Number</option>
              <option value="decimal">Decimal</option>
              <option value="text_length">Text Length</option>
            </select>
          </div>

          {valType !== 'list' && (
            <div>
              <label className="block font-semibold mb-1 text-neutral-600 dark:text-neutral-400">Data Condition:</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value as ValidationOperator)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none"
              >
                <option value="between">between</option>
                <option value="not_between">not between</option>
                <option value="equal">equal to</option>
                <option value="not_equal">not equal to</option>
                <option value="greater_than">greater than</option>
                <option value="less_than">less than</option>
                <option value="greater_or_equal">greater than or equal to</option>
                <option value="less_or_equal">less than or equal to</option>
              </select>
            </div>
          )}

          {valType === 'list' ? (
            <div>
              <label className="block font-semibold mb-1 text-neutral-600 dark:text-neutral-400">
                Source (Comma-separated list or Category options):
              </label>
              <textarea
                rows={3}
                value={formula1}
                onChange={(e) => setFormula1(e.target.value)}
                placeholder="e.g. Tumor Suppressor, Oncogenic Driver, DNA Repair, Small GTPase"
                className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none font-mono text-[11px]"
              />
              <span className="text-[10px] text-neutral-400 block mt-0.5">
                Separate options by commas. These will appear in the cell dropdown.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold mb-1 text-neutral-600 dark:text-neutral-400">
                  {operator === 'between' || operator === 'not_between' ? 'Minimum:' : 'Value:'}
                </label>
                <input
                  type="text"
                  value={formula1}
                  onChange={(e) => setFormula1(e.target.value)}
                  placeholder="e.g. 0"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none font-mono"
                />
              </div>
              {(operator === 'between' || operator === 'not_between') && (
                <div>
                  <label className="block font-semibold mb-1 text-neutral-600 dark:text-neutral-400">Maximum:</label>
                  <input
                    type="text"
                    value={formula2}
                    onChange={(e) => setFormula2(e.target.value)}
                    placeholder="e.g. 100"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none font-mono"
                  />
                </div>
              )}
            </div>
          )}

          {/* Options checkboxes */}
          <div className="flex flex-col gap-1.5 pt-1 border-t border-neutral-200 dark:border-neutral-700">
            {valType === 'list' && (
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showDropdown}
                  onChange={(e) => setShowDropdown(e.target.checked)}
                  className="rounded text-[#107c41] focus:ring-0"
                />
                <span>In-cell dropdown arrow</span>
              </label>
            )}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowBlank}
                onChange={(e) => setAllowBlank(e.target.checked)}
                className="rounded text-[#107c41] focus:ring-0"
              />
              <span>Ignore blank</span>
            </label>
          </div>

          {/* Custom Error Alert Configuration */}
          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Error Alert Settings</span>
            </div>
            <input
              type="text"
              value={errorTitle}
              onChange={(e) => setErrorTitle(e.target.value)}
              placeholder="Error title..."
              className="w-full px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none text-[11px]"
            />
            <input
              type="text"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Error message..."
              className="w-full px-2.5 py-1 rounded border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none text-[11px]"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between border-t pt-3 border-neutral-200 dark:border-neutral-700 text-xs">
          <button
            onClick={() => {
              onClear();
              onClose();
            }}
            className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded font-medium flex items-center gap-1 transition"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 rounded font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#107c41] text-white hover:bg-[#0c6334] rounded font-semibold transition shadow-sm"
            >
              Apply Validation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
