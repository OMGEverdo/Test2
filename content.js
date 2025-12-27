// Content script - tracks user interactions on web pages

(function() {
  'use strict';

  // Track clicks
  document.addEventListener('click', (event) => {
    const eventData = {
      type: 'click',
      element: event.target.tagName,
      className: event.target.className,
      id: event.target.id,
      text: event.target.innerText?.substring(0, 100),
      xpath: getXPath(event.target)
    };

    sendEvent(eventData);
  }, true);

  // Track form submissions
  document.addEventListener('submit', (event) => {
    const form = event.target;
    const formData = {
      type: 'form_submit',
      action: form.action,
      method: form.method,
      fieldCount: form.elements.length,
      formId: form.id,
      formClass: form.className
    };

    sendEvent(formData);
  }, true);

  // Track input changes (to detect repetitive data entry)
  let inputEvents = [];
  document.addEventListener('input', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      inputEvents.push({
        type: 'input',
        inputType: event.target.type,
        name: event.target.name,
        id: event.target.id,
        timestamp: Date.now()
      });

      // Batch send input events every 5 seconds
      debounce(() => {
        if (inputEvents.length > 0) {
          sendEvent({
            type: 'input_batch',
            count: inputEvents.length,
            inputs: inputEvents.slice(0, 50) // Limit to prevent huge payloads
          });
          inputEvents = [];
        }
      }, 5000)();
    }
  }, true);

  // Track copy/paste (often indicates repetitive work)
  document.addEventListener('paste', (event) => {
    sendEvent({
      type: 'paste',
      element: event.target.tagName,
      length: event.clipboardData?.getData('text')?.length || 0
    });
  });

  document.addEventListener('copy', (event) => {
    sendEvent({
      type: 'copy',
      element: event.target.tagName,
      length: window.getSelection()?.toString()?.length || 0
    });
  });

  // Track keyboard shortcuts (ctrl+c, ctrl+v, etc.)
  document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
      sendEvent({
        type: 'keyboard_shortcut',
        key: event.key,
        ctrl: event.ctrlKey,
        alt: event.altKey,
        shift: event.shiftKey
      });
    }
  });

  // Detect page scrolling (can indicate searching for information)
  let scrollCount = 0;
  let lastScrollTime = Date.now();
  document.addEventListener('scroll', () => {
    scrollCount++;

    debounce(() => {
      if (scrollCount > 10) {
        sendEvent({
          type: 'excessive_scrolling',
          scrollCount: scrollCount,
          duration: Date.now() - lastScrollTime
        });
      }
      scrollCount = 0;
      lastScrollTime = Date.now();
    }, 3000)();
  });

  // Helper: Get XPath of element (for precise tracking)
  function getXPath(element) {
    if (element.id !== '') {
      return '//*[@id="' + element.id + '"]';
    }
    if (element === document.body) {
      return '/html/body';
    }

    let ix = 0;
    const siblings = element.parentNode?.childNodes || [];
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling === element) {
        return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
      }
      if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
        ix++;
      }
    }
  }

  // Helper: Send event to background script
  function sendEvent(data) {
    try {
      chrome.runtime.sendMessage({
        type: 'TRACK_EVENT',
        data: data
      });
    } catch (error) {
      console.error('Failed to send tracking event:', error);
    }
  }

  // Helper: Debounce function
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Detect repetitive click patterns on same elements
  const clickHistory = [];
  document.addEventListener('click', (event) => {
    const xpath = getXPath(event.target);
    clickHistory.push({ xpath, timestamp: Date.now() });

    // Keep only last 100 clicks
    if (clickHistory.length > 100) {
      clickHistory.shift();
    }

    // Detect if same element clicked multiple times in short period
    const recentClicks = clickHistory.filter(c =>
      c.xpath === xpath &&
      (Date.now() - c.timestamp) < 60000 // Last minute
    );

    if (recentClicks.length >= 5) {
      sendEvent({
        type: 'repetitive_click_pattern',
        xpath: xpath,
        count: recentClicks.length,
        element: event.target.tagName,
        text: event.target.innerText?.substring(0, 50)
      });
    }
  }, true);

  console.log('Activity Tracker content script loaded');
})();
