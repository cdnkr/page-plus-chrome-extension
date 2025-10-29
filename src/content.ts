// Content script for text and area selection modes
import { extractStructuredTextWithLinks, segmentsToMarkdown } from './utils/pageContent';
import { getStructuredDataForBBox } from './utils/elementAnalysis';
import { analyzeImageColors } from './utils/colorAnalysis';

let isSelectionModeActive = false;
let isAreaSelectionModeActive = false;
let selectionOverlay: HTMLElement | null = null;
let areaSelectionOverlay: HTMLElement | null = null;
let isDragging = false;
let startX = 0;
let startY = 0;
let currentSelectionBox: HTMLElement | null = null;
let lastPageUrl = window.location.href;

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('onMessage message received:', request)
  if (request.action === 'activateTextSelection') {
    activateTextSelectionMode();
    sendResponse({ success: true });
  } else if (request.action === 'deactivateTextSelection') {
    deactivateTextSelectionMode();
    sendResponse({ success: true });
  } else if (request.action === 'activateAreaSelection') {
    activateAreaSelectionMode();
    sendResponse({ success: true });
  } else if (request.action === 'deactivateAreaSelection') {
    deactivateAreaSelectionMode();
    sendResponse({ success: true });
  } else if (request.action === 'cropScreenshot') {
    cropScreenshot(request.screenshotData, request.bounds, request.url, request.elements);
    sendResponse({ success: true });
  } else if (request.action === 'captureCurrentPage') {
    captureCurrentPage();
    sendResponse({ success: true });
  } else if (request.action === 'tabActivated' || request.action === 'tabUpdated') {
    // Handle tab activation/update - trigger page change detection
    handleTabChange();
    sendResponse({ success: true });
  } else if (request.action === 'extensionLoaded') {
    console.log('extensionLoaded message received:', request)
    notifyPageChange();
    sendResponse({ success: true });
  } else if (request.action === 'getPageImages') {
    console.log('🔧 Content Script: Received getPageImages message');

    // Handle the async operation and respond
    handleGetPageImages(sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.action === 'getFormElements') {
    console.log('🔧 Content Script: Received getFormElements message');
    handleGetFormElements(sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.action === 'fillForm') {
    console.log('🔧 Content Script: Received fillForm message');
    handleFillForm(request.mapping, sendResponse);
    return true; // Keep the message channel open for async response
  } else if (request.action === 'START_VOICE_INPUT') {
    console.log('🎤 Content Script: Received START_VOICE_INPUT message');
    handleVoiceInput(sendResponse);
    return true; // Keep the message channel open for async response
  }
});

// Initialize page change detection
initializePageChangeDetection();

function initializePageChangeDetection() {
  // Check for URL changes periodically (for SPA navigation)
  setInterval(() => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastPageUrl) {
      lastPageUrl = currentUrl;
      notifyPageChange();
    }
  }, 1000);

  window.addEventListener('DOMContentLoaded', () => {
    notifyPageChange()
  })

  // Also listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastPageUrl) {
        lastPageUrl = currentUrl;
        notifyPageChange();
      }
    }, 100);
  });

  // Listen for pushstate/replacestate (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(history, args);
    setTimeout(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastPageUrl) {
        lastPageUrl = currentUrl;
        notifyPageChange();
      }
    }, 100);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastPageUrl) {
        lastPageUrl = currentUrl;
        notifyPageChange();
      }
    }, 100);
  };
}

function notifyPageChange() {
  const bodyHTML = document.body.innerHTML;
  const segments = extractStructuredTextWithLinks(bodyHTML);
  const pageContent = segmentsToMarkdown(segments);

  // Request screenshot from background script instead of extracting text content
  chrome.runtime.sendMessage({
    action: 'captureFullPage',
    url: window.location.href
  }, (response) => {
    if (response && response.screenshotData) {
      // Send page change notification to side panel with screenshot
      chrome.runtime.sendMessage({
        action: 'pageChanged',
        url: window.location.href,
        screenshot: response.screenshotData,
        content: pageContent
      });
    } else {
      console.error('Failed to capture screenshot for page change');
    }
  });
}

function handleTabChange() {
  // Update the last page URL to current URL
  lastPageUrl = window.location.href;

  const bodyHTML = document.body.innerHTML;
  const segments = extractStructuredTextWithLinks(bodyHTML);
  const pageContent = segmentsToMarkdown(segments);

  // Request screenshot from background script instead of extracting text content
  chrome.runtime.sendMessage({
    action: 'captureFullPage',
    url: window.location.href
  }, (response) => {
    if (response && response.screenshotData) {
      // Send page change notification to side panel with screenshot
      chrome.runtime.sendMessage({
        action: 'pageChanged',
        url: window.location.href,
        screenshot: response.screenshotData,
        content: pageContent
      });
    } else {
      console.error('Failed to capture screenshot for tab change');
    }
  });
}

function activateTextSelectionMode() {
  if (isSelectionModeActive) return;

  isSelectionModeActive = true;

  // Create and inject the selection mode overlay
  createSelectionOverlay();

  // Add custom CSS for selection styling
  addSelectionStyles();

  // Add event listeners for text selection
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('keydown', handleEscapeKey);

  // Prevent default text selection behavior temporarily
  document.addEventListener('selectstart', preventDefaultSelection);
}

function deactivateTextSelectionMode() {
  if (!isSelectionModeActive) return;

  isSelectionModeActive = false;

  // Remove overlay
  if (selectionOverlay) {
    selectionOverlay.remove();
    selectionOverlay = null;
  }

  // Remove custom styles
  removeSelectionStyles();

  // Remove event listeners
  document.removeEventListener('mouseup', handleTextSelection);
  document.removeEventListener('keydown', handleEscapeKey);
  document.removeEventListener('selectstart', preventDefaultSelection);
}

function createSelectionOverlay() {
  selectionOverlay = document.createElement('div');
  selectionOverlay.id = 'page-plus-selection-overlay';
  selectionOverlay.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 25px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #333;
      max-width: 300px;
    ">
      <div style="display: flex; align-items: flex-start; gap: 12px;margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;position:relative;top:3px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-italic-icon lucide-italic"><line x1="19" x2="10" y1="4" y2="4"/><line x1="14" x2="5" y1="20" y2="20"/><line x1="15" x2="9" y1="4" y2="20"/></svg>
        </div>
        <div style="color: #000; font-size: 13px;">
          Highlight text on the page to add to your Page+ chat
        </div>
      </div>

      <div style="display: flex; justify-content: center; width: 100%;">
        <button id="page-plus-cancel-selection" style="
          background: rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 8px 72px;
          font-size: 13px;
          cursor: pointer;
          color: #000;
          font-weight: 500;
        ">
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(selectionOverlay);

  // Add click handler for cancel button
  const cancelButton = document.getElementById('page-plus-cancel-selection');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      deactivateTextSelectionMode();
    });
  }
}

function addSelectionStyles() {
  const style = document.createElement('style');
  style.id = 'page-plus-selection-styles';
  style.textContent = `
    ::selection {
      background-color: #d1b800 !important;
      color: #000 !important;
    }
    ::-moz-selection {
      background-color: #d1b800 !important;
      color: #000 !important;
    }
  `;
  document.head.appendChild(style);
}

function removeSelectionStyles() {
  const style = document.getElementById('page-plus-selection-styles');
  if (style) {
    style.remove();
  }
}

function handleTextSelection(_event: MouseEvent) {
  if (!isSelectionModeActive) return;

  const selection = window.getSelection();
  if (!selection || selection.toString().trim() === '') return;

  const selectedText = selection.toString().trim();

  if (selectedText) {
    // Send message to the extension with the selected text
    chrome.runtime.sendMessage({
      action: 'textSelected',
      text: selectedText,
      url: window.location.href
    });

    // Deactivate selection mode
    deactivateTextSelectionMode();
  }
}

function handleEscapeKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isSelectionModeActive) {
      deactivateTextSelectionMode();
    }
    if (isAreaSelectionModeActive) {
      deactivateAreaSelectionMode();
    }
  }
}

function preventDefaultSelection(_event: Event) {
  if (isSelectionModeActive) {
    // Allow selection to proceed
    return;
  }
}

// Area selection functions
function activateAreaSelectionMode() {
  if (isAreaSelectionModeActive) return;

  isAreaSelectionModeActive = true;

  // Create and inject the area selection overlay
  createAreaSelectionOverlay();

  // Add event listeners for area selection
  document.addEventListener('mousedown', handleAreaSelectionStart);
  document.addEventListener('mousemove', handleAreaSelectionMove);
  document.addEventListener('mouseup', handleAreaSelectionEnd);
  document.addEventListener('keydown', handleEscapeKey);
}

function deactivateAreaSelectionMode() {
  if (!isAreaSelectionModeActive) return;

  isAreaSelectionModeActive = false;

  // Remove overlay
  if (areaSelectionOverlay) {
    areaSelectionOverlay.remove();
    areaSelectionOverlay = null;
  }

  // Remove selection box if exists
  if (currentSelectionBox) {
    currentSelectionBox.remove();
    currentSelectionBox = null;
  }

  // Remove event listeners
  document.removeEventListener('mousedown', handleAreaSelectionStart);
  document.removeEventListener('mousemove', handleAreaSelectionMove);
  document.removeEventListener('mouseup', handleAreaSelectionEnd);
  document.removeEventListener('keydown', handleEscapeKey);
}

function createAreaSelectionOverlay() {
  areaSelectionOverlay = document.createElement('div');
  areaSelectionOverlay.id = 'page-plus-area-selection-overlay';
  areaSelectionOverlay.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 25px;
      padding: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #333;
      max-width: 300px;
    ">
      <div style="display: flex; align-items: flex-start; gap: 12px;margin-bottom: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;position:relative;top:3px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(0, 0, 0, 0.6)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-dashed-icon lucide-square-dashed"><path d="M5 3a2 2 0 0 0-2 2"/><path d="M19 3a2 2 0 0 1 2 2"/><path d="M21 19a2 2 0 0 1-2 2"/><path d="M5 21a2 2 0 0 1-2-2"/><path d="M9 3h1"/><path d="M9 21h1"/><path d="M14 3h1"/><path d="M14 21h1"/><path d="M3 9v1"/><path d="M21 9v1"/><path d="M3 14v1"/><path d="M21 14v1"/></svg>
        </div>
        <div style="color: #000; font-size: 13px;">
          Drag to select an area on the page to add to your Page+ chat
        </div>
      </div>
      
      <div style="display: flex; justify-content: center; width: 100%;">
        <button id="page-plus-cancel-area-selection" style="
          background: rgba(0, 0, 0, 0.1);
          border-radius: 12px;
          padding: 8px 72px;
          font-size: 13px;
          cursor: pointer;
          color: #000;
          font-weight: 500;
        ">
          Cancel
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(areaSelectionOverlay);

  // Add click handler for cancel button
  const cancelButton = document.getElementById('page-plus-cancel-area-selection');
  if (cancelButton) {
    cancelButton.addEventListener('click', () => {
      deactivateAreaSelectionMode();
    });
  }
}

function handleAreaSelectionStart(event: MouseEvent) {
  if (!isAreaSelectionModeActive) return;

  event.preventDefault();
  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;

  // Create selection box
  currentSelectionBox = document.createElement('div');
  currentSelectionBox.style.cssText = `
    position: fixed;
    border: 3px dashed #d1b800;
    background: rgba(255, 247, 0, 0);
    pointer-events: none;
    z-index: 999998;
    left: ${startX}px;
    top: ${startY}px;
    width: 0;
    height: 0;
  `;
  document.body.appendChild(currentSelectionBox);
}

function handleAreaSelectionMove(event: MouseEvent) {
  if (!isAreaSelectionModeActive || !isDragging || !currentSelectionBox) return;

  const currentX = event.clientX;
  const currentY = event.clientY;

  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  currentSelectionBox.style.left = `${left}px`;
  currentSelectionBox.style.top = `${top}px`;
  currentSelectionBox.style.width = `${width}px`;
  currentSelectionBox.style.height = `${height}px`;
}

async function handleAreaSelectionEnd(_event: MouseEvent) {
  if (!isAreaSelectionModeActive || !isDragging || !currentSelectionBox) return;

  isDragging = false;

  const rect = currentSelectionBox.getBoundingClientRect();

  // Only proceed if the selection has some size
  if (rect.width > 10 && rect.height > 10) {
    // Capture elements within the bounding box
    const elements = getStructuredDataForBBox(rect);

    // Use viewport coordinates since captureVisibleTab captures the visible area
    chrome.runtime.sendMessage({
      action: 'captureArea',
      bounds: {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      },
      elements: elements
    });
  }

  // Clean up
  if (currentSelectionBox) {
    currentSelectionBox.remove();
    currentSelectionBox = null;
  }

  // Deactivate area selection mode
  deactivateAreaSelectionMode();
}

async function cropScreenshot(screenshotData: string, bounds: any, url: string, elements?: any[]) {
  const img = new Image();
  img.onload = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('Could not get canvas context');
      return;
    }

    // Get device pixel ratio to handle high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Adjust bounds for device pixel ratio and crop out the 3px border
    const adjustedBounds = {
      x: (bounds.x + 3) * devicePixelRatio,
      y: (bounds.y + 3) * devicePixelRatio,
      width: (bounds.width - 6) * devicePixelRatio,
      height: (bounds.height - 6) * devicePixelRatio
    };

    // Set canvas size to the cropped area (excluding border)
    canvas.width = bounds.width - 6;
    canvas.height = bounds.height - 6;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw the cropped portion of the screenshot
    ctx.drawImage(
      img,
      adjustedBounds.x,
      adjustedBounds.y,
      adjustedBounds.width,
      adjustedBounds.height,
      0,
      0,
      bounds.width - 6,
      bounds.height - 6
    );

    // Convert to base64
    const croppedDataUrl = canvas.toDataURL('image/png');

    // Analyze colors from the cropped image
    const colors = await analyzeImageColors(croppedDataUrl);

    // Send the cropped screenshot and analysis to the side panel
    chrome.runtime.sendMessage({
      action: 'areaSelected',
      imageData: croppedDataUrl,
      url: url,
      elements: elements || [],
      colors: colors
    });
  };

  img.onerror = () => {
    console.error('Could not load screenshot');
  };

  img.src = screenshotData;
}

function captureCurrentPage() {
  // Extract page content using the provided functions
  const bodyHTML = document.body.innerHTML;
  const segments = extractStructuredTextWithLinks(bodyHTML);
  const pageContent = segmentsToMarkdown(segments);

  // Request screenshot from background script
  chrome.runtime.sendMessage({
    action: 'captureFullPage',
    url: window.location.href
  }, (response) => {
    if (response && response.screenshotData) {
      // Send the page data to the side panel
      chrome.runtime.sendMessage({
        action: 'pageCaptured',
        content: pageContent,
        screenshot: response.screenshotData,
        url: window.location.href
      });
    }
  });
}

// Handler function for async getPageImages operation
function handleGetPageImages(sendResponse: (response?: any) => void) {
  console.log('🔧 handleGetPageImages: Starting handler');

  getPageImages()
    .then(result => {
      console.log('🔧 handleGetPageImages: getPageImages completed:', result);
      sendResponse(result);
    })
    .catch(error => {
      console.error('🔧 handleGetPageImages: getPageImages error:', error);
      sendResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    });
}

async function getPageImages() {
  console.log('🔧 getPageImages: Function started');
  try {
    // Find all image elements on the page
    const images = Array.from(document.querySelectorAll('img'));
    console.log('🔧 getPageImages: Found', images.length, 'total images');

    // Filter out invalid or placeholder images
    const validImages = images.filter(img => {
      const src = img.src;
      return src &&
        src.startsWith('http') &&
        !src.includes('data:image') &&
        !src.includes('placeholder') &&
        !src.includes('1x1') &&
        img.naturalWidth > 0 &&
        img.naturalHeight > 0;
    });

    console.log('🔧 getPageImages: Found', validImages.length, 'valid images');

    if (validImages.length === 0) {
      console.log('🔧 getPageImages: No valid images found');
      return {
        success: true,
        imageCount: 0,
        message: 'No valid images found on this page'
      };
    }

    console.log('🔧 getPageImages: Starting to process images...');
    // Convert images to blob URLs
    const imageBlobs = await Promise.all(
      validImages.map(async (img, index) => {
        try {
          console.log('🔧 getPageImages: Processing image', index + 1, ':', img.src);
          const response = await fetch(img.src);
          if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.status}`);
          }

          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);

          console.log('🔧 getPageImages: Successfully processed image', index + 1);
          return {
            blobUrl,
            originalSrc: img.src,
            alt: img.alt || `image_${index + 1}`,
            width: img.naturalWidth,
            height: img.naturalHeight
          };
        } catch (error) {
          console.warn(`🔧 getPageImages: Failed to process image ${img.src}:`, error);
          return null;
        }
      })
    );

    // Filter out failed conversions
    const successfulBlobs = imageBlobs.filter(blob => blob !== null);

    console.log('🔧 getPageImages: Successfully processed', successfulBlobs.length, 'images');

    return {
      success: true,
      imageCount: successfulBlobs.length,
      images: successfulBlobs,
      message: `Found and processed ${successfulBlobs.length} images`
    };

  } catch (error) {
    console.error('🔧 getPageImages: Error in getPageImages:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      imageCount: 0
    };
  }
}

// ===================================================================
// Form Filling Functions
// ===================================================================

export function scanPageForInputFormElements() {
  const allInputs = Array.from(document.querySelectorAll('input, textarea'));
  const formElements = allInputs.filter(el => {
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'input') {
      const type = (el as HTMLInputElement).type.toLowerCase();
      return type !== 'password' && type !== 'hidden' && type !== 'submit' && type !== 'button' && type !== 'reset';
    }
    return tagName === 'textarea';
  });
  return formElements;
}

export function getElementInfo(element: Element) {
  const tagName = element.tagName.toLowerCase();
  const type = (element as HTMLInputElement).type || '';
  const name = (element as HTMLInputElement).name || '';
  const id = element.id || '';
  const placeholder = (element as HTMLInputElement).placeholder || '';
  const label = getElementLabel(element);

  // Generate a stable CSS selector
  let selector = '';
  if (id) {
    selector = `#${id}`;
  } else if (name) {
    selector = `[name="${name}"]`;
  } else if (placeholder) {
    selector = `[placeholder="${placeholder}"]`;
  } else {
    // Fallback to a more complex selector
    const parent = element.parentElement;
    if (parent) {
      const tag = tagName;
      const index = Array.from(parent.children).indexOf(element);
      selector = `${tag}:nth-child(${index + 1})`;
    }
  }

  return {
    tag: tagName,
    type,
    name,
    id,
    placeholder,
    label,
    selector,
    required: (element as HTMLInputElement).required || false
  };
}

function getElementLabel(element: Element): string {
  // Try to find associated label
  const id = element.id;
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`);
    if (label) return label.textContent?.trim() || '';
  }

  // Try to find parent label
  const parentLabel = element.closest('label');
  if (parentLabel) return parentLabel.textContent?.trim() || '';

  return '';
}

export function isReactControlled(element: Element) {
  return Object.keys(element).some(k => k.startsWith("__reactFiber$") || k.startsWith("__reactProps$"));
}

export function setInputValue(element: Element, value: string) {
  const inputElement = element as HTMLInputElement;
  const reactControlled = Object.keys(element).some(k =>
    k.startsWith("__reactFiber$") || k.startsWith("__reactProps$")
  );

  if (reactControlled) {
    // React-managed → use the prototype setter
    const { set: valueSetter } = Object.getOwnPropertyDescriptor(element, 'value') || {};
    const prototype = Object.getPrototypeOf(element);
    const { set: prototypeValueSetter } = Object.getOwnPropertyDescriptor(prototype, 'value') || {};

    if (valueSetter && valueSetter !== prototypeValueSetter) {
      prototypeValueSetter?.call(element, value);
    } else {
      valueSetter?.call(element, value);
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    // Plain input → normal assignment
    inputElement.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

export async function simulateKeyboardInput(element: Element, text: string) {
  (element as HTMLElement).focus();

  let currentValue = '';
  for (const char of text) {
    currentValue += char;
    setInputValue(element, currentValue);
    // Reduced delay for faster form filling while still maintaining realistic typing
    await new Promise(res => setTimeout(res, 5 + Math.random() * 10));
  }

  element.dispatchEvent(new Event('blur', { bubbles: true }));
}

// Handler function for async getFormElements operation
function handleGetFormElements(sendResponse: (response?: any) => void) {
  console.log('🔧 handleGetFormElements: Starting handler');

  try {
    const formElements = scanPageForInputFormElements();
    console.log('🔧 handleGetFormElements: Found', formElements.length, 'form elements');

    const elementsData = formElements.map(getElementInfo);

    sendResponse({
      success: true,
      elementCount: formElements.length,
      elements: elementsData
    });
  } catch (error) {
    console.error('🔧 handleGetFormElements: Error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Handler function for async fillForm operation
async function handleFillForm(mapping: Record<string, string>, sendResponse: (response?: any) => void) {
  console.log('🔧 handleFillForm: Starting handler with mapping:', mapping);

  try {
    let filledCount = 0;

    for (const [selector, value] of Object.entries(mapping)) {
      try {
        // Fix selector syntax issues
        let fixedSelector = selector;
        if (fixedSelector.includes('}')) fixedSelector = fixedSelector.replace('}', ']');
        if (fixedSelector.includes('{')) fixedSelector = fixedSelector.replace('{', '[');

        const element = document.querySelector(fixedSelector);
        if (element && (element.tagName.toLowerCase() === 'input' || element.tagName.toLowerCase() === 'textarea')) {
          // Focus the element first
          (element as HTMLElement).focus();

          // Clear existing value
          (element as HTMLInputElement).value = '';

          // Simulate realistic keyboard input
          await simulateKeyboardInput(element, value);

          // Trigger all necessary events for React/Next.js
          element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          element.dispatchEvent(new Event('blur', { bubbles: true, cancelable: true }));

          filledCount++;
          console.log(`🔧 handleFillForm: Filled element ${selector} with value: ${value}`);
        }
      } catch (e) {
        console.warn(`🔧 handleFillForm: Failed to fill element with selector ${selector}:`, e);
      }
    }

    sendResponse({
      success: true,
      filledCount,
      message: `Successfully filled ${filledCount} form fields`
    });
  } catch (error) {
    console.error('🔧 handleFillForm: Error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ===================================================================
// Voice Input Functions
// ===================================================================

// Handler function for async voice input operation
function handleVoiceInput(sendResponse: (response?: any) => void) {
  console.log('🎤 handleVoiceInput: Starting voice input handler');

  try {
    // Check if SpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('🎤 SpeechRecognition not supported');
      sendResponse({
        success: false,
        error: 'Speech Recognition not supported in this browser'
      });
      return;
    }

    // Check if getUserMedia is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('🎤 getUserMedia not supported');
      sendResponse({
        success: false,
        error: 'Microphone not supported in this browser'
      });
      return;
    }

    // Request microphone permission first
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        console.log('🎤 Microphone permission granted, starting speech recognition');

        // Create speech recognition instance
        const recognition = new SpeechRecognition();
        recognition.lang = navigator.language || 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          console.log('🎤 Speech recognition started');
        };

        recognition.onresult = (event: any) => {
          try {
            const transcript = event.results?.[0]?.[0]?.transcript?.trim() || '';
            console.log('🎤 Speech recognition result:', transcript);

            // Stop the microphone stream
            try { stream.getTracks().forEach(t => t.stop()); } catch { /* noop */ }

            if (transcript) {
              sendResponse({
                success: true,
                transcript: transcript
              });
            } else {
              sendResponse({
                success: false,
                error: 'No speech detected'
              });
            }
          } catch (error) {
            console.error('🎤 Error processing speech result:', error);
            try { stream.getTracks().forEach(t => t.stop()); } catch { /* noop */ }
            sendResponse({
              success: false,
              error: 'Failed to process speech result'
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('🎤 Speech recognition error:', event.error);
          try { stream.getTracks().forEach(t => t.stop()); } catch { /* noop */ }

          let errorMessage = 'Voice capture failed';
          if (event.error === 'not-allowed') {
            errorMessage = 'Microphone permission denied';
          } else if (event.error === 'no-speech') {
            errorMessage = 'No speech detected';
          } else if (event.error === 'network') {
            errorMessage = 'Network error during voice capture';
          }

          sendResponse({
            success: false,
            error: errorMessage
          });
        };

        recognition.onend = () => {
          console.log('🎤 Speech recognition ended');
          try { stream.getTracks().forEach(t => t.stop()); } catch { /* noop */ }
        };

        // Start speech recognition
        recognition.start();

      })
      .catch(error => {
        console.warn('🎤 Microphone permission denied or unavailable:', error);
        sendResponse({
          success: false,
          error: 'Microphone permission denied or unavailable'
        });
      });

  } catch (error) {
    console.error('🎤 Unexpected error in voice input:', error);
    sendResponse({
      success: false,
      error: 'Voice capture failed'
    });
  }
}
