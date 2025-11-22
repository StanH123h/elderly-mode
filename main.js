/**
 * Elderly Mode - Semantic Block Recognition Algorithm
 * Version 2.0 - Smart block division instead of element matching
 */

(function () {
  'use strict';

  const CONFIG = {
    baseURL: 'https://stanh123h.github.io/elderly-mode',
    fontSize: '20px',
    lineHeight: '1.8',
  };

  if (window.elderlyModeActive) {
    // If already active, we might be on a new "page" in an SPA, or user wants to reset.
    // Let's clean up and re-run.
    const existingContainer = document.querySelector('.elderly-action-area');
    if (existingContainer) {
      // Restore original body content if possible? 
      // Actually, our split layout moved everything into contentArea. 
      // We should move it back to body to be safe before re-running, 
      // OR just reload the page to be safe.
      // But for SPA, reloading might lose state.
      // Let's just alert for now, or try to handle it.
      // Simplest for "No reaction" is to just reload if they click it again?
      // User said "jump to new page... no reaction". 
      // If it's a real new page, window.elderlyModeActive is false.
      // If it's an SPA, it's true.
      // Let's try to re-initialize.
      console.log('[Elderly Mode] Re-initializing...');
      document.documentElement.classList.remove('elderly-mode-active');
      document.documentElement.classList.remove('elderly-mode-layout');
      if (existingContainer) {
        existingContainer.remove();
        const panel = document.querySelector('.elderly-control-panel');
        if (panel) panel.remove();
      }
    }
  }
  window.elderlyModeActive = true;

  /**
   * Block types for classification
   */
  const BlockType = {
    FORM: 'form',           // Login, signup, contact forms
    SEARCH: 'search',       // Search bars
    ACTION: 'action',       // Buttons, controls
    CONTENT: 'content',     // Articles, text
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

    // Step 1.5: Deduplicate blocks (fix double search bars)
    const uniqueBlocks = deduplicateBlocks(blocks);
    console.log('[Elderly Mode v2] Unique blocks:', uniqueBlocks);

    // Step 2: Classify each block
    const classified = classifyBlocks(uniqueBlocks);
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

    // 1. Explicit and Implicit form blocks
    const forms = [...root.querySelectorAll('form'), ...findImplicitForms(root)]
      .filter(form => isVisible(form));
    forms.forEach(form => {
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

    // 3. Navigation blocks - REMOVED per user request
    // We no longer extract navigation.


    // 4. Sidebar blocks
    root.querySelectorAll('aside, .sidebar, [class*="sidebar"]').forEach(sidebar => {
      if (!isVisible(sidebar)) return;
      blocks.push({
        element: sidebar,
        type: BlockType.SIDEBAR,
        priority: 20,
        isAtomic: true
      });
    });

    // 5. Content blocks
    root.querySelectorAll('article, main, [role="main"], .content, .post').forEach(content => {
      if (!isVisible(content)) return;
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
      if (!isVisible(input)) return;
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
      if (!isVisible(container)) return;
      const buttons = Array.from(container.querySelectorAll('button, a.button, [role="button"]'))
        .filter(btn => isVisible(btn));

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
          if (!isVisible(el)) return;
          if (!ads.includes(el)) ads.push(el);
        });
      } catch (e) { }
    });

    return ads;
  }

  /**
   * Find implicit forms (containers with inputs but no form tag)
   */
  function findImplicitForms(root) {
    const forms = [];
    const selectors = [
      'div[class*="form-"]', 'div[class*="-form"]', 'div[class="form"]',
      'section[class*="form-"]', 'section[class*="-form"]', 'section[class="form"]',
      'div[id*="form-"]', 'div[id*="-form"]', 'div[id="form"]',
      'section[id*="form-"]', 'section[id*="-form"]', 'section[id="form"]'
    ];

    const candidates = root.querySelectorAll(selectors.join(', '));

    candidates.forEach(el => {
      if (el.closest('form')) return;
      if (el.querySelectorAll('input, select, textarea').length === 0) return;

      // Prefer outer container
      const isContained = Array.from(candidates).some(other => other !== el && other.contains(el));
      if (!isContained) {
        forms.push(el);
      }
    });

    return forms;
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

        // Navigation is now ignored/kept in place
        // case BlockType.NAVIGATION: ...

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

    // Always use split layout to ensure consistency
    // The user wants the right pane to be visible even if empty.
    return 'split';
  }

  /**
   * Deduplicate blocks (e.g. multiple search bars)
   */
  function deduplicateBlocks(blocks) {
    const unique = [];
    const seenTypes = new Set();
    const seenActions = new Set();

    // Sort by priority first?
    // Actually, we just want to avoid two "SEARCH" blocks if they look similar.
    // For now, let's just keep the FIRST "SEARCH" block and ignore others if they seem redundant.

    let hasSearch = false;

    blocks.forEach(block => {
      if (block.type === BlockType.SEARCH) {
        if (hasSearch) return; // Only allow ONE search block for now (usually the main header one)
        hasSearch = true;
        unique.push(block);
      } else if (block.type === BlockType.FORM) {
        // If it's a search form, check if we already have a search
        if (block.metadata.hasSearch) {
          if (hasSearch) return;
          hasSearch = true;
          unique.push(block);
        } else {
          unique.push(block);
        }
      } else if (block.type === BlockType.ACTION) {
        // Deduplicate actions by content
        const content = block.element.innerText.trim();
        if (seenActions.has(content)) return;
        seenActions.add(content);
        unique.push(block);
      } else {
        unique.push(block);
      }
    });

    return unique;
  }

  /**
   * Apply split layout with semantic blocks
   * NEW STRATEGY: Resize body, don't move DOM
   */
  function applySplitLayout(classified) {
    console.log('[Elderly Mode v2] Applying split layout (Body Resize)...');

    // 1. Resize the body to make room for the panel
    document.documentElement.classList.add('elderly-mode-layout');

    // 2. Create the Right Pane (Action Area)
    const actionArea = document.createElement('div');
    actionArea.className = 'elderly-action-area';

    const actionTitle = document.createElement('h2');
    actionTitle.textContent = 'Actions & Controls';
    actionArea.appendChild(actionTitle);

    // 3. Populate Right Pane with extracted controls
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

      // Clone the block for the right pane
      const clone = block.element.cloneNode(true);
      clone.style.display = ''; // Ensure visible

      // Sync interactions
      syncFormElements(block.element, clone);

      wrapper.appendChild(clone);
      actionArea.appendChild(wrapper);
    });

    // If no actions, show message
    if (classified.actionZone.length === 0) {
      const noActions = document.createElement('div');
      noActions.innerHTML = `
        <p style="color: #666; font-size: 18px;">No specific actions detected on this page.</p>
        <p style="color: #888; font-size: 16px;">You can read the content on the left.</p>
      `;
      actionArea.appendChild(noActions);
    }

    // 4. Append the panel to the HTML element (outside body if possible, or just absolute on body)
    // Appending to body is safest, but we use fixed positioning.
    document.body.appendChild(actionArea);
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

      // Handle Enter key for non-form inputs
      cloneInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !cloneInput.closest('form')) {
          e.preventDefault();
          const btn = clone.querySelector('button, input[type="submit"]');
          if (btn) btn.click();
        }
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

    // Handle form submission
    const cloneForm = clone.tagName === 'FORM' ? clone : clone.querySelector('form');
    if (cloneForm) {
      cloneForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const origForm = original.tagName === 'FORM' ? original : original.querySelector('form');
        if (origForm) {
          if (origForm.requestSubmit) origForm.requestSubmit();
          else origForm.submit();
        }
      });
    }
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
      .elderly-mode-layout body {
        width: 70% !important;
        margin-right: 30% !important;
        transition: width 0.3s ease;
      }
      .elderly-action-area {
        position: fixed !important;
        top: 0 !important;
        right: 0 !important;
        width: 30% !important;
        height: 100vh !important;
        padding: 30px !important;
        background: #F5F5F5 !important;
        border-left: 2px solid #E0E0E0 !important;
        overflow-y: auto !important;
        box-shadow: -5px 0 15px rgba(0,0,0,0.05) !important;
        z-index: 999990 !important;
        box-sizing: border-box !important;
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
      /* Navigation fixes */
      .elderly-action-block nav,
      .elderly-action-block ul,
      .elderly-action-block ol {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px !important;
      }
      .elderly-action-block li {
        display: block !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .elderly-action-block a {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        word-wrap: break-word !important;
        white-space: normal !important;
        overflow-wrap: anywhere !important;
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
   * Check if an element is visible
   */
  function isVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
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
