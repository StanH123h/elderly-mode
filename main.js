/**
 * Elderly Mode - Semantic Block Recognition Algorithm
 * Version 2.0 - Smart block division instead of element matching
 */

(function() {
  'use strict';

  const CONFIG = {
    baseURL: 'https://stanh123h.github.io/elderly-mode',
    fontSize: '20px',
    lineHeight: '1.8',
  };

  if (window.elderlyModeActive) return;
  window.elderlyModeActive = true;

  /**
   * Block types for classification
   */
  const BlockType = {
    FORM: 'form',           // Login, signup, contact forms
    SEARCH: 'search',       // Search bars
    ACTION: 'action',       // Buttons, controls
    CONTENT: 'content',     // Articles, text
    NAVIGATION: 'nav',      // Nav menus
    SIDEBAR: 'sidebar',     // Sidebars
    AD: 'ad',              // Advertisements
    MIXED: 'mixed',        // Content with embedded actions
    UNKNOWN: 'unknown'
  };

  /**
   * Main initialization
   */
  async function init() {
    console.log('[Elderly Mode v2] Initializing semantic block recognition...');
    
    injectBaseStyles();
    
    // Step 1: Identify all blocks in the page
    const blocks = identifyBlocks(document.body);
    console.log('[Elderly Mode v2] Identified blocks:', blocks);
    
    // Step 2: Classify each block
    const classified = classifyBlocks(blocks);
    console.log('[Elderly Mode v2] Classified blocks:', classified);
    
    // Step 3: Decide layout strategy
    const strategy = decideLayoutStrategy(classified);
    console.log('[Elderly Mode v2] Layout strategy:', strategy);
    
    // Step 4: Apply layout
    if (strategy === 'split') {
      applySplitLayout(classified);
    } else if (strategy === 'enlarge-only') {
      applyEnlargeOnly();
    }
    
    addControlPanel();
    console.log('[Elderly Mode v2] Complete!');
  }

  /**
   * Identify functional blocks in the DOM
   * Returns array of block objects with metadata
   */
  function identifyBlocks(root) {
    const blocks = [];
    
    // 1. Explicit form blocks
    root.querySelectorAll('form').forEach(form => {
      blocks.push({
        element: form,
        type: BlockType.FORM,
        priority: 100,
        isAtomic: true, // Cannot be split
        metadata: {
          hasLogin: hasLoginFields(form),
          hasSearch: hasSearchFields(form),
          inputCount: form.querySelectorAll('input, select, textarea').length
        }
      });
    });
    
    // 2. Search components (not in forms)
    const searchBoxes = findSearchComponents(root);
    searchBoxes.forEach(box => {
      if (!isInsideForm(box)) {
        blocks.push({
          element: box,
          type: BlockType.SEARCH,
          priority: 90,
          isAtomic: true
        });
      }
    });
    
    // 3. Navigation blocks
    root.querySelectorAll('nav, [role="navigation"], header nav').forEach(nav => {
      blocks.push({
        element: nav,
        type: BlockType.NAVIGATION,
        priority: 80,
        isAtomic: true
      });
    });
    
    // 4. Sidebar blocks
    root.querySelectorAll('aside, .sidebar, [class*="sidebar"]').forEach(sidebar => {
      blocks.push({
        element: sidebar,
        type: BlockType.SIDEBAR,
        priority: 20,
        isAtomic: true
      });
    });
    
    // 5. Content blocks
    root.querySelectorAll('article, main, [role="main"], .content, .post').forEach(content => {
      blocks.push({
        element: content,
        type: BlockType.CONTENT,
        priority: 95,
        isAtomic: false // Can contain nested blocks
      });
    });
    
    // 6. Action button groups
    const buttonGroups = findButtonGroups(root);
    buttonGroups.forEach(group => {
      blocks.push({
        element: group,
        type: BlockType.ACTION,
        priority: 85,
        isAtomic: true
      });
    });
    
    // 7. Ad blocks
    const ads = findAds(root);
    ads.forEach(ad => {
      blocks.push({
        element: ad,
        type: BlockType.AD,
        priority: 0,
        isAtomic: true
      });
    });
    
    return blocks;
  }

  /**
   * Find search components (input + button pairs)
   */
  function findSearchComponents(root) {
    const components = [];
    const searchInputs = root.querySelectorAll(
      'input[type="search"], input[name*="search" i], input[placeholder*="search" i], ' +
      'input[id*="search" i], input[aria-label*="search" i]'
    );
    
    searchInputs.forEach(input => {
      // Find the containing component (usually a div/form)
      let container = input.closest('.search, [class*="search"], [id*="search"]');
      if (!container) {
        // Look for nearby button
        const parent = input.parentElement;
        const button = parent.querySelector('button, input[type="submit"]');
        if (button) {
          container = parent;
        }
      }
      
      if (container && !components.includes(container)) {
        components.push(container);
      }
    });
    
    return components;
  }

  /**
   * Find button groups (multiple buttons in close proximity)
   */
  function findButtonGroups(root) {
    const groups = [];
    const containers = root.querySelectorAll('[class*="button"], [class*="action"], .controls');
    
    containers.forEach(container => {
      const buttons = container.querySelectorAll('button, a.button, [role="button"]');
      if (buttons.length >= 2) {
        groups.push(container);
      }
    });
    
    return groups;
  }

  /**
   * Find advertisement elements
   */
  function findAds(root) {
    const selectors = [
      '[class*="ad-"]', '[id*="ad-"]', '[class*="advertisement"]',
      '.banner', '[class*="sponsored"]', '[data-ad]',
      'ins.adsbygoogle', '.ad', '#ad'
    ];
    
    const ads = [];
    selectors.forEach(selector => {
      try {
        root.querySelectorAll(selector).forEach(el => {
          if (!ads.includes(el)) ads.push(el);
        });
      } catch (e) {}
    });
    
    return ads;
  }

  /**
   * Check if element contains login fields
   */
  function hasLoginFields(form) {
    const passwordInputs = form.querySelectorAll('input[type="password"]');
    const usernameInputs = form.querySelectorAll(
      'input[type="text"], input[type="email"], input[name*="user" i], input[name*="email" i]'
    );
    return passwordInputs.length > 0 && usernameInputs.length > 0;
  }

  /**
   * Check if element contains search fields
   */
  function hasSearchFields(form) {
    return form.querySelector('input[type="search"], input[name*="search" i]') !== null;
  }

  /**
   * Check if element is inside a form
   */
  function isInsideForm(element) {
    return element.closest('form') !== null;
  }

  /**
   * Classify blocks into destination zones
   */
  function classifyBlocks(blocks) {
    const classified = {
      contentZone: [],   // Goes to left panel
      actionZone: [],    // Goes to right panel
      removeZone: [],    // Remove from page
      keepInPlace: []    // Keep in original position
    };
    
    blocks.forEach(block => {
      switch (block.type) {
        case BlockType.FORM:
          // Forms go to action zone unless they're the main content
          if (block.metadata.hasLogin || block.metadata.inputCount <= 5) {
            classified.actionZone.push(block);
          } else {
            // Complex form (like survey) - might be main content
            classified.keepInPlace.push(block);
          }
          break;
          
        case BlockType.SEARCH:
          classified.actionZone.push(block);
          break;
          
        case BlockType.ACTION:
          classified.actionZone.push(block);
          break;
          
        case BlockType.CONTENT:
          classified.contentZone.push(block);
          break;
          
        case BlockType.NAVIGATION:
          // Navigation can be simplified or moved to action zone
          if (shouldSimplifyNav(block.element)) {
            classified.actionZone.push(block);
          } else {
            classified.keepInPlace.push(block);
          }
          break;
          
        case BlockType.SIDEBAR:
          // Most sidebars are clutter
          classified.removeZone.push(block);
          break;
          
        case BlockType.AD:
          classified.removeZone.push(block);
          break;
          
        default:
          classified.keepInPlace.push(block);
      }
    });
    
    return classified;
  }

  /**
   * Decide if we should use split layout or just enlarge
   */
  function decideLayoutStrategy(classified) {
    const { contentZone, actionZone } = classified;
    
    // If page is mostly a single form (login page), don't split
    const totalForms = document.querySelectorAll('form').length;
    const totalContent = document.querySelectorAll('article, main, .content').length;
    
    if (totalForms >= 1 && totalContent === 0) {
      // Likely a login/signup page - just enlarge
      return 'enlarge-only';
    }
    
    // If we have both content and actions, split
    if (contentZone.length > 0 && actionZone.length > 0) {
      return 'split';
    }
    
    // If mostly content with few actions, split
    if (contentZone.length > actionZone.length) {
      return 'split';
    }
    
    // Default: just enlarge
    return 'enlarge-only';
  }

  /**
   * Apply split layout with semantic blocks
   */
  function applySplitLayout(classified) {
    console.log('[Elderly Mode v2] Applying split layout...');
    
    const container = document.createElement('div');
    container.className = 'elderly-split-container';
    
    const contentArea = document.createElement('div');
    contentArea.className = 'elderly-content-area';
    
    const actionArea = document.createElement('div');
    actionArea.className = 'elderly-action-area';
    
    const actionTitle = document.createElement('h2');
    actionTitle.textContent = 'Actions & Controls';
    actionArea.appendChild(actionTitle);
    
    // Remove ads and sidebars
    classified.removeZone.forEach(block => {
      block.element.style.display = 'none';
    });
    
    // Move action blocks to right panel
    classified.actionZone.forEach(block => {
      const wrapper = document.createElement('div');
      wrapper.className = 'elderly-action-block';
      
      // Add a descriptive title
      const title = getBlockTitle(block);
      if (title) {
        const titleEl = document.createElement('h3');
        titleEl.textContent = title;
        wrapper.appendChild(titleEl);
      }
      
      // Clone the entire block (preserve structure)
      const clone = block.element.cloneNode(true);
      
      // Sync form values
      syncFormElements(block.element, clone);
      
      wrapper.appendChild(clone);
      actionArea.appendChild(wrapper);
      
      // Hide original
      block.element.style.display = 'none';
    });
    
    // If no actions, show message
    if (classified.actionZone.length === 0) {
      const noActions = document.createElement('p');
      noActions.textContent = 'No interactive elements detected.';
      noActions.style.color = '#666';
      actionArea.appendChild(noActions);
    }
    
    // Keep content blocks in left panel
    const bodyClone = document.body.cloneNode(true);
    
    // Remove hidden elements from clone
    bodyClone.querySelectorAll('[style*="display: none"]').forEach(el => el.remove());
    bodyClone.querySelectorAll('script, style').forEach(el => el.remove());
    
    contentArea.appendChild(bodyClone);
    
    // Build new layout
    document.body.innerHTML = '';
    container.appendChild(contentArea);
    container.appendChild(actionArea);
    document.body.appendChild(container);
  }

  /**
   * Just enlarge text and clean up, don't split
   */
  function applyEnlargeOnly() {
    console.log('[Elderly Mode v2] Applying enlarge-only mode...');
    document.documentElement.classList.add('elderly-mode-active');
    
    // Remove ads
    const ads = findAds(document.body);
    ads.forEach(ad => ad.style.display = 'none');
    
    // Remove sidebars
    document.querySelectorAll('aside, .sidebar').forEach(el => {
      el.style.display = 'none';
    });
  }

  /**
   * Get a descriptive title for a block
   */
  function getBlockTitle(block) {
    if (block.type === BlockType.FORM) {
      if (block.metadata.hasLogin) return '🔐 Login';
      if (block.metadata.hasSearch) return '🔍 Search';
      return '📝 Form';
    }
    if (block.type === BlockType.SEARCH) return '🔍 Search';
    if (block.type === BlockType.ACTION) return '⚙️ Actions';
    if (block.type === BlockType.NAVIGATION) return '🧭 Navigation';
    return null;
  }

  /**
   * Sync form elements between original and clone
   */
  function syncFormElements(original, clone) {
    const originalInputs = original.querySelectorAll('input, select, textarea');
    const cloneInputs = clone.querySelectorAll('input, select, textarea');
    
    originalInputs.forEach((origInput, index) => {
      const cloneInput = cloneInputs[index];
      if (!cloneInput) return;
      
      // Sync value changes
      cloneInput.addEventListener('input', () => {
        origInput.value = cloneInput.value;
        origInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
      
      cloneInput.addEventListener('change', () => {
        origInput.value = cloneInput.value;
        origInput.checked = cloneInput.checked;
        origInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
    
    // Sync button clicks
    const originalButtons = original.querySelectorAll('button, input[type="submit"]');
    const cloneButtons = clone.querySelectorAll('button, input[type="submit"]');
    
    originalButtons.forEach((origButton, index) => {
      const cloneButton = cloneButtons[index];
      if (!cloneButton) return;
      
      cloneButton.addEventListener('click', (e) => {
        e.preventDefault();
        origButton.click();
      });
    });
  }

  /**
   * Check if nav should be simplified
   */
  function shouldSimplifyNav(nav) {
    const links = nav.querySelectorAll('a');
    return links.length <= 10; // Small navs can be moved
  }

  /**
   * Inject base styles
   */
  function injectBaseStyles() {
    const style = document.createElement('style');
    style.id = 'elderly-mode-base-styles';
    style.textContent = `
      .elderly-mode-active * { box-sizing: border-box; }
      .elderly-mode-active body {
        font-size: ${CONFIG.fontSize} !important;
        line-height: ${CONFIG.lineHeight} !important;
        font-family: Arial, sans-serif !important;
      }
      .elderly-mode-active button,
      .elderly-mode-active a,
      .elderly-mode-active input,
      .elderly-mode-active select {
        min-height: 48px !important;
        padding: 12px 20px !important;
        font-size: 18px !important;
      }
      .elderly-mode-active *:focus {
        outline: 3px solid #0066CC !important;
        outline-offset: 2px !important;
      }
      .elderly-split-container {
        display: flex !important;
        gap: 20px !important;
        padding: 20px !important;
        background: #FFF !important;
        min-height: 100vh !important;
      }
      .elderly-content-area {
        flex: 7 !important;
        padding: 30px !important;
        background: #FFF !important;
        border: 2px solid #E0E0E0 !important;
        border-radius: 8px !important;
      }
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
        color: #333 !important;
      }
      .elderly-action-block {
        margin-bottom: 25px !important;
        padding: 20px !important;
        background: #FFF !important;
        border: 2px solid #CCC !important;
        border-radius: 8px !important;
      }
      .elderly-action-block h3 {
        font-size: 20px !important;
        margin-top: 0 !important;
        margin-bottom: 15px !important;
        color: #0066CC !important;
      }
      .elderly-control-panel {
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        z-index: 999999 !important;
        background: #0066CC !important;
        color: white !important;
        padding: 15px 25px !important;
        border-radius: 30px !important;
        cursor: pointer !important;
        font-size: 18px !important;
        font-weight: bold !important;
        border: none !important;
      }
      .elderly-control-panel:hover {
        background: #0052A3 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add control panel
   */
  function addControlPanel() {
    const panel = document.createElement('button');
    panel.className = 'elderly-control-panel';
    panel.textContent = '👴 Elderly Mode ON';
    panel.onclick = () => {
      if (confirm('Exit Elderly Mode?')) location.reload();
    };
    document.body.appendChild(panel);
  }

  // Start
  init();

})();
