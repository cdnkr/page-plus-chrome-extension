/**
 * ===================================================================
 * Main Function
 * ===================================================================
 *
 * Gets the structural HTML, minified CSS, and selector for the
 * *top-level* elements within a bounding box.
 *
 * @param {object} bbox - A DOMRect-like object with { top, left, right, bottom }.
 * @returns {Array<object>} An array of { html, css, selector } objects.
 */
export function getStructuredDataForBBox(bbox: DOMRect) {
  // 1. Get all elements that are *visually* inside the box
  const allElements = getElementsInBoundingBox(bbox);
  
  // 2. Filter this list to get only the top-level parent elements
  const topLevelElements = getTopLevelElements(allElements);

  const results = [];
  for (const el of topLevelElements) {
    results.push({
      // 3. Get the full outerHTML, but clean attributes
      html: getCleanOuterHTML(el),
      // 4. Get minified CSS from our expanded allowlist
      css: getMinifiedCSS(el),
      // 5. Get a simple, stable selector
      selector: getElementSelector(el),
    });
  }

  return results;
}

/**
 * ===================================================================
 * New & Improved Helper Functions
 * ===================================================================
 */

/**
 * Filters a flat list of elements to return only the top-level
 * elements (i.e., elements that are not children of another
 * element in the same list).
 */
function getTopLevelElements(elements: Element[]): Element[] {
  const elementsSet = new Set(elements);
  return elements.filter(el => {
    let parent = el.parentElement;
    while (parent) {
      if (elementsSet.has(parent)) {
        return false; // It's a child of another element in the list
      }
      parent = parent.parentElement;
    }
    return true; // It's a top-level element
  });
}

/**
 * Returns the outerHTML of an element after stripping potentially
 * long or irrelevant attributes to save tokens.
 */
function getCleanOuterHTML(el: Element): string {
  // Create a temporary clone to avoid modifying the real DOM
  const clone = el.cloneNode(true) as Element;

  // Recursively clean attributes from the clone
  const elements = [clone, ...Array.from(clone.querySelectorAll('*'))];
  for (const node of elements) {
    const attributes = Array.from(node.attributes);
    for (const attr of attributes) {
      const name = attr.name.toLowerCase();
      
      // If it's not on the whitelist AND not a 'data-' attribute, remove it
      if (!ATTR_WHITELIST.has(name) && !name.startsWith('data-')) {
        node.removeAttribute(attr.name);
        continue;
      }

      // If it IS on the whitelist but is a long attr, truncate it
      if (ATTR_LONG_VALUES.has(name)) {
        node.setAttribute(attr.name, '...');
      }
    }
  }

  return clone.outerHTML;
}

/**
 * Gets a minified CSS string for an element from an expanded
 * allowlist, cleaning and truncating values.
 */
function getMinifiedCSS(el: Element): string {
  const computed = window.getComputedStyle(el);
  const styles: string[] = [];

  for (const k of CSS_ALLOWLIST_EXPANDED) {
    let v = computed.getPropertyValue(k);
    if (!v) continue;

    // --- Minify & Reduce ---

    // 1. Remove default/ignorable values
    if (v === 'none' || v === '0px' || v === 'normal' || v === 'auto' || v === '0' || v === 'rgba(0, 0, 0, 0)') {
      continue;
    }
    
    // 2. Truncate long known properties
    if (k === 'background-image' && v.includes('url(')) {
      v = 'url(...)';
    } else if (k === 'background-image' && v.includes('gradient(')) {
      v = 'gradient(...)';
    } else if (k === 'font-family') {
      v = v.split(',')[0].trim(); // Get first font
    } else if (v.length > 50) {
      v = v.slice(0, 50) + '...'; // Generic truncation
    }
    
    // 3. Round pixel values to 1 decimal place
    v = v.replace(/(\d+\.\d{2,})px/g, (_, num) => `${parseFloat(num).toFixed(1)}px`);

    styles.push(`${k}: ${v};`);
  }

  return styles.join(' ');
}

/**
 * Calculates an appropriate, simple selector for an element.
 */
function getElementSelector(el: Element): string {
  if (el.id) {
    return `#${el.id}`;
  }
  
  const tag = el.tagName.toLowerCase();
  
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.split(/\s+/).filter(Boolean).join('.');
    if (classes) {
      return `${tag}.${classes}`;
    }
  }
  
  return tag;
}

/**
 * Finds all elements fully contained within a bounding box.
 */
export function getElementsInBoundingBox(bbox: DOMRect, excludedTypes: string[] = []): Element[] {
  const elements = Array.from(document.querySelectorAll('body *'));
  const results: Element[] = [];

  for (const el of elements) {
    if (excludedTypes.includes(el.tagName.toLowerCase())) continue;

    const rect = el.getBoundingClientRect();

    if (rect.width === 0 || rect.height === 0) continue;
    const style = window.getComputedStyle(el);
    if (style.visibility === 'hidden' || style.display === 'none') continue;

    // Check if the element is *fully contained* within the bbox
    const intersects = (
      rect.right < bbox.right &&
      rect.left > bbox.left &&
      rect.bottom < bbox.bottom &&
      rect.top > bbox.top
    );

    if (intersects) results.push(el);
  }

  return results;
}

/**
 * ===================================================================
 * Dependencies
 * (Constants & Functions from your original code)
 * ===================================================================
 */

// --- Whitelist for getCleanOuterHTML ---
const ATTR_WHITELIST = new Set([
  'id','class','role','aria-label','aria-labelledby','aria-hidden','title','alt',
  'type','disabled','checked','value','placeholder', 'for', 'name',
  'viewBox','width','height','fill','stroke','stroke-width','rx','ry','r','x','y','cx','cy', 'd', 'path'
]);
// Attributes to always truncate
const ATTR_LONG_VALUES = new Set([
  'src','srcset','href','xlink:href','d'
]);

// --- Expanded CSS Allowlist for getMinifiedCSS ---
const CSS_ALLOWLIST_EXPANDED = new Set([
  // Layout & Box Model
  'display', 'position', 'top', 'left', 'right', 'bottom', 'z-index',
  'width', 'height', 'min-width', 'max-width', 'min-height', 'max-height',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'border', 'border-width', 'border-style', 'border-color', 'border-radius',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'box-sizing', 'overflow', 'overflow-x', 'overflow-y',

  // Flexbox
  'flex', 'flex-basis', 'flex-direction', 'flex-flow', 'flex-grow', 'flex-shrink', 'flex-wrap',
  
  // Grid
  'grid', 'grid-area', 'grid-auto-columns', 'grid-auto-flow', 'grid-auto-rows',
  'grid-column', 'grid-column-end', 'grid-column-gap', 'grid-column-start',
  'grid-gap', 'grid-row', 'grid-row-end', 'grid-row-gap', 'grid-row-start',
  'grid-template', 'grid-template-areas', 'grid-template-columns', 'grid-template-rows',

  // Alignment (works for both Flex & Grid)
  'align-content', 'align-items', 'align-self',
  'justify-content', 'justify-items', 'justify-self',
  'gap', 'column-gap', 'row-gap',

  // Typography
  'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing',
  'color', 'text-align', 'text-decoration', 'text-transform', 'white-space',

  // Visuals
  'background', 'background-color', 'background-image', 'background-position', 'background-repeat', 'background-size',
  'opacity', 'visibility', 'transform', 'transition'
]);
