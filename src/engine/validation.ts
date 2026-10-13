import { DataValidationRule } from '../types/spreadsheet';

export interface ValidationResult {
  isValid: boolean;
  errorTitle: string;
  errorMessage: string;
}

/**
 * Validates a cell value against a DataValidationRule
 */
export function validateCellValue(value: string, rule?: DataValidationRule): ValidationResult {
  if (!rule) {
    return { isValid: true, errorTitle: '', errorMessage: '' };
  }

  const trimmed = (value || '').trim();

  // If blank is allowed and cell is blank
  if (rule.allowBlank && trimmed === '') {
    return { isValid: true, errorTitle: '', errorMessage: '' };
  }

  const defaultTitle = rule.errorTitle || 'Invalid Input';
  const defaultMsg =
    rule.errorMessage ||
    'The value you entered does not match the data validation restrictions defined for this cell.';

  switch (rule.type) {
    case 'list': {
      if (!rule.formula1) return { isValid: true, errorTitle: '', errorMessage: '' };
      const allowedItems = rule.formula1
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      // Match item case-insensitively
      const isMatched = allowedItems.some(
        (item) => item.toLowerCase() === trimmed.toLowerCase()
      );

      return {
        isValid: isMatched,
        errorTitle: defaultTitle,
        errorMessage: isMatched
          ? ''
          : rule.errorMessage ||
            `Value must be one of: ${allowedItems.slice(0, 6).join(', ')}${
              allowedItems.length > 6 ? '...' : ''
            }`,
      };
    }

    case 'whole_number': {
      const num = parseInt(trimmed, 10);
      if (isNaN(num) || !Number.isInteger(parseFloat(trimmed))) {
        return {
          isValid: false,
          errorTitle: defaultTitle,
          errorMessage: rule.errorMessage || 'Please enter a valid whole number (integer).',
        };
      }
      return checkNumericOperator(num, rule, defaultTitle, defaultMsg);
    }

    case 'decimal': {
      const num = parseFloat(trimmed);
      if (isNaN(num)) {
        return {
          isValid: false,
          errorTitle: defaultTitle,
          errorMessage: rule.errorMessage || 'Please enter a valid numeric value.',
        };
      }
      return checkNumericOperator(num, rule, defaultTitle, defaultMsg);
    }

    case 'text_length': {
      const len = trimmed.length;
      return checkNumericOperator(len, rule, defaultTitle, defaultMsg);
    }

    default:
      return { isValid: true, errorTitle: '', errorMessage: '' };
  }
}

function checkNumericOperator(
  val: number,
  rule: DataValidationRule,
  title: string,
  defaultMsg: string
): ValidationResult {
  const f1 = parseFloat(rule.formula1);
  const f2 = rule.formula2 !== undefined ? parseFloat(rule.formula2) : NaN;
  const op = rule.operator || 'equal';

  let valid = false;
  switch (op) {
    case 'between':
      valid = !isNaN(f1) && !isNaN(f2) ? val >= Math.min(f1, f2) && val <= Math.max(f1, f2) : true;
      break;
    case 'not_between':
      valid = !isNaN(f1) && !isNaN(f2) ? val < Math.min(f1, f2) || val > Math.max(f1, f2) : true;
      break;
    case 'equal':
      valid = val === f1;
      break;
    case 'not_equal':
      valid = val !== f1;
      break;
    case 'greater_than':
      valid = val > f1;
      break;
    case 'less_than':
      valid = val < f1;
      break;
    case 'greater_or_equal':
      valid = val >= f1;
      break;
    case 'less_or_equal':
      valid = val <= f1;
      break;
    default:
      valid = true;
  }

  return {
    isValid: valid,
    errorTitle: title,
    errorMessage: valid ? '' : defaultMsg,
  };
}
