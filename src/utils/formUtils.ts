// Form utility functions for the Page+ extension

export function omitNullKeys(obj: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== null));
}

export function generateFormFieldMapping(
  _elementsData: any[], 
  _contextData: string, 
  _userQuery: string
): Record<string, string> {
  // This could be enhanced with more sophisticated matching logic
  // For now, it's handled by the AI provider in the tool implementation
  return {};
}

/**
 * Extracts proper selectors for input/textarea elements from HTML strings
 * This is needed because the provided selector might be for a wrapping div
 * rather than the actual input element
 */
export function extractInputSelectorsFromHtml(htmlString: string): Array<{selector: string, element: string}> {
  const results: Array<{selector: string, element: string}> = [];
  
  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  
  // Find all input and textarea elements
  const inputElements = tempDiv.querySelectorAll('input, textarea');
  
  inputElements.forEach(element => {
    const selector = generateSelector(element);
    results.push({
      selector,
      element: element.outerHTML
    });
  });
  
  return results;
}

/**
 * Generates a CSS selector for an element, prioritizing the most reliable attributes
 */
export function generateSelector(element: Element): string {
  const tagName = element.tagName.toLowerCase();

  // Priority order for selector generation
  if (element.id) {
    return `#${element.id}`;
  }

  // Cast to HTMLInputElement for input-specific properties
  const inputElement = element as HTMLInputElement;
  
  if (inputElement.name) {
    return `${tagName}[name="${inputElement.name}"]`;
  }

  if (inputElement.placeholder) {
    return `${tagName}[placeholder="${inputElement.placeholder}"]`;
  }

  if (inputElement.type) {
    return `${tagName}[type="${inputElement.type}"]`;
  }

  // Try to find a unique attribute
  const attributes = ['data-testid', 'data-cy', 'aria-label', 'placeholder'];
  for (const attr of attributes) {
    const value = element.getAttribute(attr);
    if (value) {
      return `${tagName}[${attr}="${value}"]`;
    }
  }

  // Fallback to tag + nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element);
    return `${tagName}:nth-child(${index + 1})`;
  }

  return tagName;
}

export interface FormElement {
  tag: string;
  type: string;
  name: string;
  id: string;
  placeholder: string;
  label: string;
  selector: string;
  required: boolean;
}

export interface FormElementsResponse {
  success: boolean;
  elementCount: number;
  elements: FormElement[];
  error?: string;
}

export interface FormFillResponse {
  success: boolean;
  filledCount: number;
  message: string;
  error?: string;
}
