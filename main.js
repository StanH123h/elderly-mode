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
   * 改进版: 添加错误处理和降级机制
   */
  async function init() {
    try {
      console.log('[Elderly Mode] Initializing...');

      // Get current domain
      const domain = getDomain();
      console.log('[Elderly Mode] Domain:', domain);

      // Load rules for this domain
      const rules = await loadRules(domain);
      console.log('[Elderly Mode] Rules loaded:', rules);

      // Apply optimizations with error handling
      try {
        applyOptimizations(rules);
      } catch (error) {
        console.error('[Elderly Mode] Error applying optimizations:', error);
        // 降级: 只应用基础样式
        injectBaseStyles();
        enlargeText();
        addControlPanel();
        showErrorNotification('部分功能加载失败,已启用基础模式');
      }

      // Add control panel
      if (!document.querySelector('.elderly-control-panel')) {
        addControlPanel();
      }

      console.log('[Elderly Mode] Initialization complete!');

    } catch (error) {
      console.error('[Elderly Mode] Fatal initialization error:', error);
      // 完全降级: 显示错误信息
      showErrorNotification('Elderly Mode 启动失败,请刷新页面重试');
    }
  }

  /**
   * 显示错误通知
   */
  function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #ff5252;
      color: white;
      padding: 15px 30px;
      border-radius: 8px;
      font-size: 18px;
      z-index: 9999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 5秒后自动消失
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transition = 'opacity 0.5s';
      setTimeout(() => notification.remove(), 500);
    }, 5000);
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
   * 内置规则配置 - 减少网络依赖
   */
  const BUILT_IN_RULES = {
    'amazon-com': {
      layout: 'split',
      enlargeText: true,
      simplifyNav: true,
      removeAds: true,
      highContrast: false,
      removeSelectors: [
        // 导航相关
        '#nav-ad-container',
        '#nav-flyout-searchAjax',
        '#nav-subnav',
        '#nav-progressive-subnav',

        // 广告和推广
        '.a-carousel-card[data-a-card-type="ad"]',
        '[data-component-type="sp-sponsored-result"]',
        '[class*="sponsored"]',
        '[class*="Sponsored"]',
        '[id*="sponsored"]',
        '.AdHolder',
        '.sp_desktop_sponsored_label',
        '#percolate-ui-ilm_div',
        '.celwidget[cel_widget_id*="ad"]',
        '#rhf',
        '#dp-ads-center-promo',
        '#sims-consolidated-1',
        '#sims-consolidated-2',
        '#desktop-banner',
        '#mobile-banner',

        // Prime会员推广
        '#nav-flyout-prime',
        '#nav-flyout-amazonprime',

        // Hero视频和轮播图
        '#desktop-tall-hero-video_desktop-gateway-atf_0',
        '._desktop-tall-hero-video_style_lazy-video-wrapper__WM56t',
        '[class*="hero-video"]',
        '[class*="tall-hero"]',
        '.gw-desktop-herotator',
        '#gw-desktop-herotator',

        // Rufus AI助手
        '[id*="rufus"]',
        '[class*="rufus"]',

        // 其他干扰元素
        '.nav-sprite-v1',
        '#nav-sprite-v1',
        '.nav-timeline-prime-icon',
        '[data-cel-widget*="marketing"]',
        '[class*="marketing"]',
        '[class*="promo"]',
        '.a-popover',
        '.a-declarative[data-action*="popup"]'
      ],
      keepSelectors: [
        // 基础表单元素
        'input', 'button', 'select', 'textarea',

        // 搜索和导航
        '#twotabsearchtextbox',
        '#nav-search-submit-button',
        '#nav-cart',
        '#nav-cart-count',
        '#nav-orders',
        '#nav-link-accountList',
        '#nav-global-location-popover-link',
        '#searchDropdownBox',

        // 商品详情
        '#productTitle',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.product-image',
        '#feature-bullets',
        '#productDescription',
        '.a-price',
        '.a-button-primary',
        '#add-to-cart-button',
        '#buy-now-button',

        // 内容结构
        'h1', 'h2', 'h3',
        'article', 'main',
        '.a-link-normal',
        '.a-cardui',
        '[data-component-type="s-search-result"]',
        '.s-result-item',
        '.gw-card-layout'
      ]
    },
    'cnn-com': {
      layout: 'split',
      enlargeText: true,
      simplifyNav: true,
      removeAds: true,
      highContrast: false,
      removeSelectors: [
        '.ad', '.ad-wrapper', '.banner-ad', '[class*="advertisement"]',
        '.video-ad', '#header-nav-container', '.related-content',
        '.zn-body__rail', '[data-ad-type]', '.el__embedded--standard', '.ad-slot-wrap'
      ],
      keepSelectors: [
        'article', '.headline', '.paragraph', 'h1', 'h2',
        'img', 'video', 'button', 'input', 'select'
      ]
    }
  };

  /**
   * Load rules for the current domain
   * 改进版: 优先使用内置规则,减少网络请求
   */
  async function loadRules(domain) {
    // 1. 先检查内置规则
    if (BUILT_IN_RULES[domain]) {
      console.log(`[Elderly Mode] Using built-in rules for ${domain}`);
      return BUILT_IN_RULES[domain];
    }

    // 2. 尝试从本地存储加载缓存的规则
    try {
      const cached = localStorage.getItem(`elderly-rules-${domain}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheTime = parsed.timestamp || 0;
        const now = Date.now();
        // 缓存7天有效
        if (now - cacheTime < 7 * 24 * 60 * 60 * 1000) {
          console.log(`[Elderly Mode] Using cached rules for ${domain}`);
          return parsed.rules;
        }
      }
    } catch (error) {
      console.warn('[Elderly Mode] Failed to load cached rules:', error);
    }

    // 3. 尝试从远程加载(仅作为fallback)
    try {
      const response = await fetch(`${CONFIG.baseURL}/rules/${domain}.json`);
      if (response.ok) {
        const rules = await response.json();
        // 缓存到本地存储
        try {
          localStorage.setItem(`elderly-rules-${domain}`, JSON.stringify({
            rules: rules,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.warn('[Elderly Mode] Failed to cache rules:', e);
        }
        console.log(`[Elderly Mode] Loaded remote rules for ${domain}`);
        return rules;
      }
    } catch (error) {
      console.log('[Elderly Mode] No remote rules available, using defaults');
    }

    // 4. Fallback到默认规则
    console.log('[Elderly Mode] Using default rules');
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
        position: relative !important;
      }

      /* Left content area */
      .elderly-content-area {
        flex: 7 !important;
        padding: 30px !important;
        background: #FFFFFF !important;
        border: 2px solid #E0E0E0 !important;
        border-radius: 8px !important;
        overflow-y: auto !important;
        max-height: calc(100vh - 40px) !important;
      }

      /* 原始body内容包装器 */
      #elderly-original-body-wrapper {
        width: 100% !important;
      }

      /* 隐藏原始交互元素但保留在DOM中 */
      .elderly-original-element {
        position: absolute !important;
        left: -9999px !important;
        width: 1px !important;
        height: 1px !important;
        opacity: 0 !important;
        pointer-events: none !important;
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
   * 改进版: 使用CSS而非破坏性DOM操作,保留事件监听器
   */
  function applySplitLayout() {
    console.log('[Elderly Mode] Applying split layout...');

    // 先隐藏body内容,避免闪烁
    document.body.style.visibility = 'hidden';

    // 创建容器结构
    const container = document.createElement('div');
    container.className = 'elderly-split-container';
    container.id = 'elderly-mode-container';

    const contentArea = document.createElement('div');
    contentArea.className = 'elderly-content-area';
    contentArea.id = 'elderly-content-area';

    const actionArea = document.createElement('div');
    actionArea.className = 'elderly-action-area';
    actionArea.id = 'elderly-action-area';

    // 添加操作区标题
    const actionTitle = document.createElement('h2');
    actionTitle.textContent = '操作区 (Actions)';
    actionArea.appendChild(actionTitle);

    // 收集所有交互元素
    const interactiveElements = collectInteractiveElements();

    // 使用事件委托处理交互元素
    interactiveElements.forEach((el, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'elderly-action-item';
      wrapper.dataset.originalElementId = `elderly-ref-${index}`;

      // 给原始元素添加标记
      el.dataset.elderlyRef = `elderly-ref-${index}`;
      el.classList.add('elderly-original-element');

      // 获取元素标签
      const label = getElementLabel(el);
      if (label) {
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        wrapper.appendChild(labelEl);
      }

      // 创建代理元素(不是克隆,而是创建新的代理)
      const proxy = createProxyElement(el, index);
      wrapper.appendChild(proxy);
      actionArea.appendChild(wrapper);

      // 隐藏原始元素(用CSS而不是删除)
      el.classList.add('elderly-hidden');
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1; // 禁止Tab键访问
    });

    // 如果没有交互元素
    if (interactiveElements.length === 0) {
      const noActions = document.createElement('p');
      noActions.textContent = '此页面没有检测到输入框或按钮。';
      noActions.style.color = '#666666';
      actionArea.appendChild(noActions);
    }

    // 将原始body包装到内容区(不删除,保留所有事件)
    // 使用CSS让原始内容在视觉上出现在左侧
    const originalBodyWrapper = document.createElement('div');
    originalBodyWrapper.id = 'elderly-original-body-wrapper';

    // 将body的所有直接子元素移到wrapper中(除了我们的容器)
    Array.from(document.body.children).forEach(child => {
      if (!child.id || !child.id.startsWith('elderly-')) {
        originalBodyWrapper.appendChild(child);
      }
    });

    contentArea.appendChild(originalBodyWrapper);

    // 组装结构
    container.appendChild(contentArea);
    container.appendChild(actionArea);

    // 将容器添加到body开头
    document.body.insertBefore(container, document.body.firstChild);

    // 恢复可见性
    document.body.style.visibility = 'visible';

    // 启动MutationObserver监听动态变化
    startDynamicContentObserver();

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
   * 创建代理元素 - 不克隆,而是创建新元素并转发事件
   * 这样可以完美保留原始元素的所有React/Vue事件监听器
   */
  function createProxyElement(original, index) {
    const tagName = original.tagName.toLowerCase();
    let proxy;

    // 根据元素类型创建对应的代理
    if (tagName === 'input' || tagName === 'textarea') {
      proxy = document.createElement(tagName);
      proxy.type = original.type || 'text';
      proxy.value = original.value || '';
      proxy.placeholder = original.placeholder || '';
      proxy.name = original.name || '';

      // 双向同步
      proxy.addEventListener('input', (e) => {
        original.value = e.target.value;
        // 触发原始元素的事件(兼容React等框架)
        const event = new Event('input', { bubbles: true });
        Object.defineProperty(event, 'target', { writable: false, value: original });
        original.dispatchEvent(event);
      });

      proxy.addEventListener('change', (e) => {
        original.value = e.target.value;
        const event = new Event('change', { bubbles: true });
        Object.defineProperty(event, 'target', { writable: false, value: original });
        original.dispatchEvent(event);
      });

      // 从原始元素同步回代理(处理程序化更新)
      const syncFromOriginal = () => {
        if (proxy.value !== original.value) {
          proxy.value = original.value;
        }
      };
      setInterval(syncFromOriginal, 100); // 每100ms检查一次

    } else if (tagName === 'button' || tagName === 'a') {
      proxy = document.createElement('button');
      proxy.textContent = original.textContent.trim() || original.value || '按钮';
      proxy.className = 'elderly-proxy-button';

      proxy.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 直接触发原始元素的点击
        console.log(`[Elderly Mode] Proxy button clicked, triggering original element`);
        original.click();
      });

    } else if (tagName === 'select') {
      proxy = document.createElement('select');
      // 复制所有option
      Array.from(original.options).forEach(option => {
        const newOption = document.createElement('option');
        newOption.value = option.value;
        newOption.textContent = option.textContent;
        newOption.selected = option.selected;
        proxy.appendChild(newOption);
      });

      proxy.addEventListener('change', (e) => {
        original.value = e.target.value;
        const event = new Event('change', { bubbles: true });
        Object.defineProperty(event, 'target', { writable: false, value: original });
        original.dispatchEvent(event);
      });

    } else {
      // 其他类型的交互元素,创建通用按钮
      proxy = document.createElement('button');
      proxy.textContent = original.textContent.trim() || '交互元素';
      proxy.addEventListener('click', (e) => {
        e.preventDefault();
        original.click();
      });
    }

    proxy.dataset.elderlyProxy = index;
    proxy.className += ' elderly-proxy-element';

    return proxy;
  }

  /**
   * MutationObserver监听器 - 处理SPA应用的动态内容
   */
  function startDynamicContentObserver() {
    const observer = new MutationObserver((mutations) => {
      let needsUpdate = false;

      mutations.forEach((mutation) => {
        // 检查是否有新的交互元素添加
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element节点
              // 检查是否是交互元素
              const isInteractive = node.matches && (
                node.matches('button') ||
                node.matches('input') ||
                node.matches('select') ||
                node.matches('textarea')
              );

              if (isInteractive && !node.dataset.elderlyRef && !node.classList.contains('elderly-proxy-element')) {
                needsUpdate = true;
              }
            }
          });
        }
      });

      if (needsUpdate) {
        console.log('[Elderly Mode] Detected new interactive elements, updating...');
        // 防抖: 300ms后更新
        clearTimeout(window.elderlyUpdateTimeout);
        window.elderlyUpdateTimeout = setTimeout(() => {
          updateActionArea();
        }, 300);
      }
    });

    // 监听整个body的变化
    const contentWrapper = document.getElementById('elderly-original-body-wrapper');
    if (contentWrapper) {
      observer.observe(contentWrapper, {
        childList: true,
        subtree: true
      });
    }

    window.elderlyMutationObserver = observer;
  }

  /**
   * 更新操作区 - 当检测到新的交互元素时
   */
  function updateActionArea() {
    const actionArea = document.getElementById('elderly-action-area');
    if (!actionArea) return;

    // 收集所有尚未处理的交互元素
    const newElements = collectInteractiveElements().filter(el => !el.dataset.elderlyRef);

    if (newElements.length === 0) return;

    console.log(`[Elderly Mode] Adding ${newElements.length} new interactive elements`);

    let currentMaxIndex = 0;
    document.querySelectorAll('[data-elderly-ref]').forEach(el => {
      const index = parseInt(el.dataset.elderlyRef.replace('elderly-ref-', ''));
      if (index > currentMaxIndex) currentMaxIndex = index;
    });

    newElements.forEach((el, i) => {
      const index = currentMaxIndex + i + 1;
      const wrapper = document.createElement('div');
      wrapper.className = 'elderly-action-item';

      el.dataset.elderlyRef = `elderly-ref-${index}`;
      el.classList.add('elderly-original-element');

      const label = getElementLabel(el);
      if (label) {
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        wrapper.appendChild(labelEl);
      }

      const proxy = createProxyElement(el, index);
      wrapper.appendChild(proxy);
      actionArea.appendChild(wrapper);

      el.classList.add('elderly-hidden');
      el.setAttribute('aria-hidden', 'true');
      el.tabIndex = -1;
    });
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
