/**
 * Elderly Mode - Main Script
 * Makes websites more accessible for elderly users
 * https://stanh123h.github.io/elderly-mode/
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    baseURL: 'https://stanh123h.github.io/elderly-mode',
    fontSize: '20px',
    lineHeight: '1.8',
    minTouchTarget: '48px',
    splitRatio: '70/30', // Left content / Right actions
  };

  // Track if elderly mode is already active
  if (window.elderlyModeActive) {
    console.log('[Elderly Mode] Already active, skipping...');
    return;
  }
  window.elderlyModeActive = true;

  /**
   * Main initialization function
   */
  async function init() {
    console.log('[Elderly Mode] Initializing...');
    
    // Get current domain
    const domain = getDomain();
    console.log('[Elderly Mode] Domain:', domain);
    
    // Load rules for this domain
    const rules = await loadRules(domain);
    console.log('[Elderly Mode] Rules loaded:', rules);
    
    // Apply optimizations
    applyOptimizations(rules);
    
    // Add control panel
    addControlPanel();
    
    console.log('[Elderly Mode] Initialization complete!');
  }

  /**
   * Get clean domain name
   */
  function getDomain() {
    return window.location.hostname
      .replace('www.', '')
      .replace(/\./g, '-'); // amazon.com -> amazon-com
  }

  /**
   * Load rules for the current domain
   */
  async function loadRules(domain) {
    try {
      // Try to load domain-specific rules
      const response = await fetch(`${CONFIG.baseURL}/rules/${domain}.json`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log('[Elderly Mode] No specific rules for this domain, using defaults');
    }
    
    // Fallback to default rules
    return getDefaultRules();
  }

  /**
   * Default optimization rules
   */
  function getDefaultRules() {
    return {
      layout: 'split', // 'split' or 'normal'
      enlargeText: true,
      simplifyNav: true,
      removeAds: true,
      highContrast: false,
      removeSelectors: [
        // Common ad/clutter selectors
        '[class*="ad-"]',
        '[id*="ad-"]',
        '[class*="advertisement"]',
        '.sidebar',
        '[class*="popup"]',
        '[class*="modal"]'
      ],
      keepSelectors: [
        // Essential elements to preserve
        'input',
        'button',
        'select',
        'textarea',
        'form',
        'a',
        'img',
        'video',
        'h1', 'h2', 'h3',
        'p',
        'article',
        'main'
      ]
    };
  }

  /**
   * Apply all optimizations based on rules
   */
  function applyOptimizations(rules) {
    // Inject base styles
    injectBaseStyles();
    
    // Remove clutter
    if (rules.removeAds) {
      removeClutter(rules.removeSelectors);
    }
    
    // Enlarge text
    if (rules.enlargeText) {
      enlargeText();
    }
    
    // Apply split layout
    if (rules.layout === 'split') {
      applySplitLayout();
    }
    
    // High contrast mode
    if (rules.highContrast) {
      applyHighContrast();
    }
  }

  /**
   * Inject base CSS styles
   */
  function injectBaseStyles() {
    const style = document.createElement('style');
    style.id = 'elderly-mode-base-styles';
    style.textContent = `
      /* Base elderly mode styles */
      .elderly-mode-active * {
        box-sizing: border-box;
      }
      
      .elderly-mode-active body {
        font-size: ${CONFIG.fontSize} !important;
        line-height: ${CONFIG.lineHeight} !important;
        font-family: Arial, sans-serif !important;
      }
      
      /* Make all interactive elements larger */
      .elderly-mode-active button,
      .elderly-mode-active a,
      .elderly-mode-active input,
      .elderly-mode-active select {
        min-height: ${CONFIG.minTouchTarget} !important;
        min-width: ${CONFIG.minTouchTarget} !important;
        padding: 12px 20px !important;
        font-size: 18px !important;
        cursor: pointer !important;
      }
      
      /* Better focus indicators */
      .elderly-mode-active *:focus {
        outline: 3px solid #0066CC !important;
        outline-offset: 2px !important;
      }
      
      /* Split layout container */
      .elderly-split-container {
        display: flex !important;
        gap: 20px !important;
        max-width: 100vw !important;
        min-height: 100vh !important;
        padding: 20px !important;
        background: #FFFFFF !important;
      }
      
      /* Left content area */
      .elderly-content-area {
        flex: 7 !important;
        padding: 30px !important;
        background: #FFFFFF !important;
        border: 2px solid #E0E0E0 !important;
        border-radius: 8px !important;
        overflow-y: auto !important;
      }
      
      /* Right action area */
      .elderly-action-area {
        flex: 3 !important;
        padding: 30px !important;
        background: #F5F5F5 !important;
        border: 2px solid #E0E0E0 !important;
        border-radius: 8px !important;
        position: sticky !important;
        top: 20px !important;
        max-height: calc(100vh - 40px) !important;
        overflow-y: auto !important;
      }
      
      .elderly-action-area h2 {
        font-size: 24px !important;
        margin-bottom: 20px !important;
        color: #333333 !important;
      }
      
      /* Action items spacing */
      .elderly-action-item {
        margin-bottom: 20px !important;
        padding: 15px !important;
        background: #FFFFFF !important;
        border: 1px solid #CCCCCC !important;
        border-radius: 6px !important;
      }
      
      .elderly-action-item label {
        display: block !important;
        font-size: 16px !important;
        font-weight: bold !important;
        margin-bottom: 8px !important;
        color: #333333 !important;
      }
      
      /* Control panel */
      .elderly-control-panel {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: #0066CC !important;
        color: white !important;
        padding: 15px 25px !important;
        border-radius: 30px !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        cursor: pointer !important;
        font-size: 18px !important;
        font-weight: bold !important;
        border: none !important;
      }
      
      .elderly-control-panel:hover {
        background: #0052A3 !important;
        transform: scale(1.05) !important;
      }
      
      /* Hidden elements */
      .elderly-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Remove clutter elements (ads, popups, etc.)
   */
  function removeClutter(selectors) {
    if (!selectors || selectors.length === 0) return;
    
    selectors.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          el.classList.add('elderly-hidden');
        });
      } catch (error) {
        console.warn('[Elderly Mode] Invalid selector:', selector);
      }
    });
  }

  /**
   * Enlarge all text
   */
  function enlargeText() {
    document.documentElement.classList.add('elderly-mode-active');
  }

  /**
   * Apply split layout: left content, right actions
   */
  function applySplitLayout() {
    console.log('[Elderly Mode] Applying split layout...');
    
    // Create container structure
    const container = document.createElement('div');
    container.className = 'elderly-split-container';
    
    const contentArea = document.createElement('div');
    contentArea.className = 'elderly-content-area';
    
    const actionArea = document.createElement('div');
    actionArea.className = 'elderly-action-area';
    
    // Add title to action area
    const actionTitle = document.createElement('h2');
    actionTitle.textContent = 'Actions & Inputs';
    actionArea.appendChild(actionTitle);
    
    // Collect all interactive elements
    const interactiveElements = collectInteractiveElements();
    
    // Move interactive elements to action area
    interactiveElements.forEach(el => {
      const wrapper = document.createElement('div');
      wrapper.className = 'elderly-action-item';
      
      // Add label if the element has associated label or placeholder
      const label = getElementLabel(el);
      if (label) {
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        wrapper.appendChild(labelEl);
      }
      
      // Clone the element (keep original hidden)
      const clone = el.cloneNode(true);
      
      // Preserve event listeners by copying data attributes
      copyElementProperties(el, clone);
      
      wrapper.appendChild(clone);
      actionArea.appendChild(wrapper);
      
      // Hide original element
      el.classList.add('elderly-hidden');
    });
    
    // If no interactive elements found, add a message
    if (interactiveElements.length === 0) {
      const noActions = document.createElement('p');
      noActions.textContent = 'No input fields or buttons detected on this page.';
      noActions.style.color = '#666666';
      actionArea.appendChild(noActions);
    }
    
    // Move remaining content to content area
    const bodyContent = document.body.cloneNode(true);
    
    // Remove already processed interactive elements from content
    bodyContent.querySelectorAll('.elderly-hidden').forEach(el => el.remove());
    
    // Remove scripts and styles from content
    bodyContent.querySelectorAll('script, style, .elderly-control-panel').forEach(el => el.remove());
    
    contentArea.appendChild(bodyContent);
    
    // Clear body and add new structure
    const controlPanel = document.querySelector('.elderly-control-panel');
    document.body.innerHTML = '';
    
    container.appendChild(contentArea);
    container.appendChild(actionArea);
    document.body.appendChild(container);
    
    // Re-add control panel
    if (controlPanel) {
      document.body.appendChild(controlPanel);
    }
    
    console.log('[Elderly Mode] Split layout applied!');
  }

  /**
   * Collect all interactive elements from the page
   */
  function collectInteractiveElements() {
    const selectors = [
      'input:not([type="hidden"])',
      'button:not(.elderly-control-panel)',
      'select',
      'textarea',
      'a[href^="#"]', // Internal navigation links
      '[role="button"]',
      '[onclick]'
    ];
    
    const elements = [];
    const seen = new Set();
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        // Avoid duplicates
        if (!seen.has(el)) {
          seen.add(el);
          // Filter out hidden elements
          if (el.offsetParent !== null) {
            elements.push(el);
          }
        }
      });
    });
    
    return elements;
  }

  /**
   * Get appropriate label for an element
   */
  function getElementLabel(element) {
    // Check for associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent.trim();
    }
    
    // Check for parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.replace(element.textContent, '').trim();
    }
    
    // Check for placeholder
    if (element.placeholder) {
      return element.placeholder;
    }
    
    // Check for button text
    if (element.tagName === 'BUTTON' || element.tagName === 'A') {
      return element.textContent.trim();
    }
    
    // Check for aria-label
    if (element.getAttribute('aria-label')) {
      return element.getAttribute('aria-label');
    }
    
    // Check for name attribute
    if (element.name) {
      return element.name.replace(/[-_]/g, ' ');
    }
    
    // Check for type
    if (element.type) {
      return element.type.charAt(0).toUpperCase() + element.type.slice(1);
    }
    
    return 'Input Field';
  }

  /**
   * Copy important properties from original element to clone
   */
  function copyElementProperties(original, clone) {
    // Copy value for inputs
    if (original.value) {
      clone.value = original.value;
    }
    
    // Copy checked state for checkboxes/radios
    if (original.type === 'checkbox' || original.type === 'radio') {
      clone.checked = original.checked;
    }
    
    // Sync values on change
    clone.addEventListener('input', () => {
      original.value = clone.value;
      // Trigger change event on original
      original.dispatchEvent(new Event('input', { bubbles: true }));
    });
    
    clone.addEventListener('change', () => {
      original.value = clone.value;
      original.checked = clone.checked;
      original.dispatchEvent(new Event('change', { bubbles: true }));
    });
    
    // For buttons, trigger click on original when clone is clicked
    if (clone.tagName === 'BUTTON' || clone.type === 'submit') {
      clone.addEventListener('click', (e) => {
        e.preventDefault();
        original.click();
      });
    }
  }

  /**
   * Apply high contrast mode
   */
  function applyHighContrast() {
    const style = document.createElement('style');
    style.id = 'elderly-mode-high-contrast';
    style.textContent = `
      .elderly-mode-active {
        filter: contrast(1.3) !important;
      }
      
      .elderly-mode-active body {
        background: #FFFFFF !important;
        color: #000000 !important;
      }
      
      .elderly-mode-active a {
        color: #0000EE !important;
        text-decoration: underline !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add control panel for toggling elderly mode
   */
  function addControlPanel() {
    const panel = document.createElement('button');
    panel.className = 'elderly-control-panel';
    panel.textContent = '👴 Elderly Mode ON';
    panel.title = 'Click to disable Elderly Mode';
    
    panel.addEventListener('click', () => {
      if (confirm('Do you want to exit Elderly Mode and restore the original page?')) {
        window.location.reload();
      }
    });
    
    document.body.appendChild(panel);
  }

  // Start initialization
  init();

})();
