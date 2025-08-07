/**
 * Form validation functions for Aegean Air flight booking component
 * Modular validation with performance metrics and error handling
 */

import { Page } from 'playwright-core';
import { FormValidationResult } from './types';
import { getSelectorsForElement } from './form-selectors';

/**
 * Validates a single form element by trying multiple selectors
 * Returns the first successful validation or the last error
 */
export async function validateFormElement(
  page: Page,
  elementName: string,
  selectors: string[]
): Promise<FormValidationResult> {
  const startTime = performance.now();
  const timestamp = new Date().toISOString();
  
  let lastError = '';
  let successfulSelector = '';

  // Try each selector until one works
  for (const selector of selectors) {
    try {
      // Wait for element to be visible with a shorter timeout for each attempt
      await page.waitForSelector(selector, { 
        state: 'visible', 
        timeout: 5000 
      });
      
      // Verify element is actually present and interactable
      const element = await page.$(selector);
      if (element) {
        const isVisible = await element.isVisible();
        if (isVisible) {
          successfulSelector = selector;
          break;
        }
      }
    } catch (error: any) {
      lastError = `Selector "${selector}" failed: ${error.message}`;
      continue; // Try next selector
    }
  }

  const executionTime = performance.now() - startTime;

  return {
    element: elementName,
    found: successfulSelector !== '',
    selector: successfulSelector || selectors[0], // Return first selector if none worked
    error: successfulSelector === '' ? lastError : undefined,
    executionTime,
    timestamp
  };
}

/**
 * Validates trip type selector (Round-trip/One-way)
 */
export async function validateTripTypeSelector(page: Page): Promise<FormValidationResult> {
  const selectors = getSelectorsForElement('tripTypeSelector');
  return await validateFormElement(page, 'Trip Type Selector', selectors);
}

/**
 * Validates passengers and class selector
 */
export async function validatePassengersSelector(page: Page): Promise<FormValidationResult> {
  const selectors = getSelectorsForElement('passengersSelector');
  return await validateFormElement(page, 'Passengers Selector', selectors);
}

/**
 * Validates origin field
 */
export async function validateOriginField(page: Page): Promise<FormValidationResult> {
  const selectors = getSelectorsForElement('originField');
  return await validateFormElement(page, 'Origin Field', selectors);
}

/**
 * Validates destination field
 */
export async function validateDestinationField(page: Page): Promise<FormValidationResult> {
  const selectors = getSelectorsForElement('destinationField');
  return await validateFormElement(page, 'Destination Field', selectors);
}

/**
 * Validates departure date selector
 */
export async function validateDepartureDateSelector(page: Page): Promise<FormValidationResult> {
  const selectors = getSelectorsForElement('departureDateSelector');
  return await validateFormElement(page, 'Departure Date Selector', selectors);
}

/**
 * Validates return date selector
 */
export async function validateReturnDateSelector(page: Page): Promise<FormValidationResult> {
  const selectors = getSelectorsForElement('returnDateSelector');
  return await validateFormElement(page, 'Return Date Selector', selectors);
}

/**
 * Validates search button
 */
export async function validateSearchButton(page: Page): Promise<FormValidationResult> {
  const selectors = getSelectorsForElement('searchButton');
  return await validateFormElement(page, 'Search Button', selectors);
}

/**
 * Validates all form elements and returns comprehensive results
 */
export async function validateAllFormElements(page: Page): Promise<FormValidationResult[]> {
  const validations = [
    validateTripTypeSelector(page),
    validatePassengersSelector(page),
    validateOriginField(page),
    validateDestinationField(page),
    validateDepartureDateSelector(page),
    validateReturnDateSelector(page),
    validateSearchButton(page)
  ];

  return await Promise.all(validations);
}

/**
 * Helper function to check if all validations passed
 */
export function allValidationsPassed(validations: FormValidationResult[]): boolean {
  return validations.every(validation => validation.found);
}

/**
 * Helper function to get failed validations
 */
export function getFailedValidations(validations: FormValidationResult[]): FormValidationResult[] {
  return validations.filter(validation => !validation.found);
}

/**
 * Helper function to calculate total validation time
 */
export function calculateTotalValidationTime(validations: FormValidationResult[]): number {
  return validations.reduce((total, validation) => total + validation.executionTime, 0);
} 