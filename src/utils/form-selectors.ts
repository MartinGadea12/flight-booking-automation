/**
 * Form element selectors for Aegean Air flight booking component
 * Multiple selectors per element for robustness against site changes
 */

import { FormElements } from './types';

export const FORM_ELEMENTS: FormElements = {
  // Trip type selector (Round-trip/One-way)
  tripTypeSelector: [
    'input[name="tripType"]',
    '[data-testid="trip-type"]',
    '.trip-type-selector',
    'select[name="tripType"]',
    '[data-em-cmp="trip-type"]',
    '.flight-type-selector'
  ],

  // Passengers and class selector
  passengersSelector: [
    '[data-testid="passengers-selector"]',
    '.passengers-selector',
    '[data-em-cmp="passengers"]',
    'select[name="passengers"]',
    '.travelers-selector',
    '[data-testid="travelers"]'
  ],

  // Origin field
  originField: [
    'input[name="origin"]',
    '[data-testid="origin-input"]',
    '[data-em-cmp="origin"]',
    '.origin-field input',
    '#origin',
    '[placeholder*="From"]'
  ],

  // Destination field
  destinationField: [
    'input[name="destination"]',
    '[data-testid="destination-input"]',
    '[data-em-cmp="destination"]',
    '.destination-field input',
    '#destination',
    '[placeholder*="To"]'
  ],

  // Departure date selector
  departureDateSelector: [
    'input[name="departureDate"]',
    '[data-testid="departure-date"]',
    '[data-em-cmp="departure-date"]',
    '.departure-date input',
    '#departure-date',
    '[placeholder*="Departure"]'
  ],

  // Return date selector
  returnDateSelector: [
    'input[name="returnDate"]',
    '[data-testid="return-date"]',
    '[data-em-cmp="return-date"]',
    '.return-date input',
    '#return-date',
    '[placeholder*="Return"]'
  ],

  // Search button
  searchButton: [
    'button[type="submit"]',
    '[data-testid="search-button"]',
    '[data-em-cmp="search"]',
    '.search-button',
    '.btn-search',
    'input[type="submit"]',
    'button:contains("Search")',
    'button:contains("Find Flights")'
  ]
};

/**
 * Helper function to get selectors for a specific element
 */
export function getSelectorsForElement(elementName: keyof FormElements): string[] {
  return FORM_ELEMENTS[elementName];
}

/**
 * Get all element names for iteration
 */
export function getAllElementNames(): (keyof FormElements)[] {
  return Object.keys(FORM_ELEMENTS) as (keyof FormElements)[];
} 