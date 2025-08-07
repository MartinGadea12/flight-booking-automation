/**
 * TypeScript interfaces for form validation results
 * Provides type safety and structured data for test results
 */

export interface FormValidationResult {
  element: string;
  found: boolean;
  selector: string;
  error?: string;
  executionTime: number;
  timestamp: string;
}

export interface TestStep {
  step: string;
  success: boolean;
  executionTime: number;
  error?: string;
  details?: any;
}

export interface TestResult {
  success: boolean;
  timestamp: string;
  totalExecutionTime: number;
  validations: FormValidationResult[];
  steps: TestStep[];
  screenshotUrl?: string;
  errors: string[];
  message: string;
}

export interface FormElements {
  tripTypeSelector: string[];
  passengersSelector: string[];
  originField: string[];
  destinationField: string[];
  departureDateSelector: string[];
  returnDateSelector: string[];
  searchButton: string[];
} 