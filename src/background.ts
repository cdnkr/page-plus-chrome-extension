chrome.runtime.onInstalled.addListener(() => {
  console.log('Chrome extension installed');
});

// Allow users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Listen for tab activation to detect tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  // Notify the content script in the newly activated tab
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
      // Send message to content script to trigger page change detection
      chrome.tabs.sendMessage(activeInfo.tabId, { action: 'tabActivated' }, () => {
        if (chrome.runtime.lastError) {
          // Content script might not be loaded yet, ignore the error
          console.log('Content script not ready for tab activation:', chrome.runtime.lastError.message);
        }
      });
    }
  });
});

// Listen for tab updates (URL changes, page loads)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only trigger on completed page loads and if it's the active tab
  if (changeInfo.status === 'complete' && tab.active && tab.url && 
      !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
    // Send message to content script to trigger page change detection
    chrome.tabs.sendMessage(tabId, { action: 'tabUpdated' }, () => {
      if (chrome.runtime.lastError) {
        // Content script might not be loaded yet, ignore the error
        console.log('Content script not ready for tab update:', chrome.runtime.lastError.message);
      }
    });
  }
});

// Handle messages between content script and side panel
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'activateTextSelection') {
    // Forward message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'activateTextSelection' });
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'activateAreaSelection') {
    // Forward message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'activateAreaSelection' });
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'captureCurrentPage') {
    // Forward message to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'captureCurrentPage' });
      }
    });
    sendResponse({ success: true });
  } else if (request.action === 'captureArea') {
    // Handle screenshot capture
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.windowId) {
        // Capture the full page content, not just the visible area
        chrome.tabs.captureVisibleTab(tabs[0].windowId, { 
          format: 'png',
          quality: 100
        }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Screenshot capture failed:', chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
          }
          
          // Send the full screenshot back to content script for cropping
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'cropScreenshot',
              screenshotData: dataUrl,
              bounds: request.bounds,
              url: tabs[0].url || '',
              elements: request.elements
            });
          }
          
          sendResponse({ success: true });
        });
      }
    });
    
    return true; // Keep the message channel open for async response
  } else if (request.action === 'captureFullPage') {
    // Handle full page screenshot capture
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.windowId) {
        chrome.tabs.captureVisibleTab(tabs[0].windowId, { 
          format: 'png',
          quality: 100
        }, (dataUrl) => {
          if (chrome.runtime.lastError) {
            console.error('Full page screenshot capture failed:', chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
            return;
          }
          
          sendResponse({ screenshotData: dataUrl });
        });
      }
    });
    
    return true; // Keep the message channel open for async response
  }
});