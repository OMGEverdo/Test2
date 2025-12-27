// Background service worker for Activity Tracker

// Track active tab and time spent
let activeTabId = null;
let activeStartTime = null;
let dailyStats = {};

// Screenshot tracking
let screenshotCounts = {}; // Track screenshots per domain to avoid spam
let lastScreenshotTime = {}; // Throttle screenshots

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Activity Tracker installed');

  // Set up periodic analysis alarm (every 30 minutes)
  chrome.alarms.create('periodicAnalysis', { periodInMinutes: 30 });

  // Initialize storage
  chrome.storage.local.set({
    activities: [],
    sessions: [],
    patterns: [],
    screenshots: [],
    lastAnalysis: null
  });

  // Set up periodic screenshot alarm (every 5 minutes by default)
  chrome.alarms.create('periodicScreenshot', { periodInMinutes: 5 });
});

// Track tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await recordTabSwitch(activeInfo.tabId);
});

// Track tab updates (URL changes)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    await recordNavigation(tab);
  }
});

// Track window focus changes
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    await recordTabSwitch(null); // Browser lost focus
  } else {
    const [activeTab] = await chrome.tabs.query({ active: true, windowId });
    if (activeTab) {
      await recordTabSwitch(activeTab.id);
    }
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'TRACK_EVENT') {
    recordEvent(sender.tab, request.data);
  } else if (request.type === 'GET_STATS') {
    getStats().then(sendResponse);
    return true;
  } else if (request.type === 'ANALYZE_PATTERNS') {
    analyzePatterns().then(sendResponse);
    return true;
  } else if (request.type === 'EXPORT_DATA') {
    exportData().then(sendResponse);
    return true;
  } else if (request.type === 'GET_SCREENSHOTS') {
    getScreenshots().then(sendResponse);
    return true;
  } else if (request.type === 'DELETE_SCREENSHOT') {
    deleteScreenshot(request.screenshotId).then(sendResponse);
    return true;
  } else if (request.type === 'CAPTURE_SCREENSHOT') {
    captureScreenshot(request.trigger, request.metadata).then(sendResponse);
    return true;
  }
});

// Periodic analysis alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'periodicAnalysis') {
    analyzePatterns();
  } else if (alarm.name === 'periodicScreenshot') {
    // Capture periodic screenshot of active tab
    const settings = await chrome.storage.sync.get(['screenshotEnabled', 'screenshotPeriodic']);
    if (settings.screenshotEnabled && settings.screenshotPeriodic) {
      captureScreenshot('periodic');
    }
  }
});

// Record tab switch and calculate time spent
async function recordTabSwitch(newTabId) {
  const now = Date.now();

  // Save time spent on previous tab
  if (activeTabId !== null && activeStartTime !== null) {
    const timeSpent = now - activeStartTime;
    await saveTimeSpent(activeTabId, timeSpent);
  }

  // Update active tab
  activeTabId = newTabId;
  activeStartTime = newTabId !== null ? now : null;
}

// Record navigation event
async function recordNavigation(tab) {
  const event = {
    type: 'navigation',
    url: tab.url,
    title: tab.title,
    timestamp: Date.now(),
    tabId: tab.id
  };

  await saveEvent(event);
}

// Record user interaction event
async function recordEvent(tab, eventData) {
  const event = {
    ...eventData,
    url: tab.url,
    title: tab.title,
    timestamp: Date.now(),
    tabId: tab.id
  };

  await saveEvent(event);

  // Check if screenshot should be triggered
  await checkScreenshotTriggers(tab, eventData);
}

// Save time spent on a URL
async function saveTimeSpent(tabId, timeSpent) {
  try {
    const tab = await chrome.tabs.get(tabId);
    const url = new URL(tab.url);
    const domain = url.hostname;

    const event = {
      type: 'time_spent',
      url: tab.url,
      domain: domain,
      title: tab.title,
      duration: timeSpent,
      timestamp: Date.now()
    };

    await saveEvent(event);
  } catch (error) {
    // Tab might have been closed
    console.log('Could not save time spent:', error);
  }
}

// Save event to storage
async function saveEvent(event) {
  const result = await chrome.storage.local.get(['activities']);
  const activities = result.activities || [];

  activities.push(event);

  // Keep only last 10,000 events to prevent storage issues
  if (activities.length > 10000) {
    activities.shift();
  }

  await chrome.storage.local.set({ activities });
}

// Get statistics
async function getStats() {
  const result = await chrome.storage.local.get(['activities', 'patterns', 'lastAnalysis']);
  const activities = result.activities || [];
  const patterns = result.patterns || [];

  // Calculate stats
  const now = Date.now();
  const oneDayAgo = now - (24 * 60 * 60 * 1000);
  const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

  const todayActivities = activities.filter(a => a.timestamp >= oneDayAgo);
  const weekActivities = activities.filter(a => a.timestamp >= oneWeekAgo);

  // Calculate time by domain
  const timeByDomain = {};
  activities.filter(a => a.type === 'time_spent').forEach(a => {
    if (!timeByDomain[a.domain]) {
      timeByDomain[a.domain] = 0;
    }
    timeByDomain[a.domain] += a.duration;
  });

  // Sort domains by time spent
  const topDomains = Object.entries(timeByDomain)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([domain, time]) => ({ domain, time }));

  // Count clicks
  const clickCount = todayActivities.filter(a => a.type === 'click').length;
  const formSubmissions = todayActivities.filter(a => a.type === 'form_submit').length;
  const navigations = todayActivities.filter(a => a.type === 'navigation').length;

  return {
    totalEvents: activities.length,
    todayEvents: todayActivities.length,
    weekEvents: weekActivities.length,
    clickCount,
    formSubmissions,
    navigations,
    topDomains,
    patterns: patterns,
    lastAnalysis: result.lastAnalysis
  };
}

// Analyze patterns in user activity
async function analyzePatterns() {
  const result = await chrome.storage.local.get(['activities']);
  const activities = result.activities || [];

  const patterns = [];

  // Pattern 1: Repetitive URL visits
  const urlCounts = {};
  activities.filter(a => a.type === 'navigation').forEach(a => {
    urlCounts[a.url] = (urlCounts[a.url] || 0) + 1;
  });

  Object.entries(urlCounts).forEach(([url, count]) => {
    if (count >= 5) {
      patterns.push({
        type: 'repetitive_navigation',
        url: url,
        count: count,
        severity: count >= 20 ? 'high' : count >= 10 ? 'medium' : 'low',
        suggestion: `User visits ${url} ${count} times - consider automation or bookmark shortcut`
      });
    }
  });

  // Pattern 2: Repetitive form submissions on same domain
  const formsByDomain = {};
  activities.filter(a => a.type === 'form_submit').forEach(a => {
    try {
      const domain = new URL(a.url).hostname;
      formsByDomain[domain] = (formsByDomain[domain] || 0) + 1;
    } catch (e) {}
  });

  Object.entries(formsByDomain).forEach(([domain, count]) => {
    if (count >= 3) {
      patterns.push({
        type: 'repetitive_forms',
        domain: domain,
        count: count,
        severity: count >= 10 ? 'high' : count >= 5 ? 'medium' : 'low',
        suggestion: `User submits ${count} forms on ${domain} - consider form auto-fill or API automation`
      });
    }
  });

  // Pattern 3: High click activity on specific domains (potential manual work)
  const clicksByDomain = {};
  activities.filter(a => a.type === 'click').forEach(a => {
    try {
      const domain = new URL(a.url).hostname;
      clicksByDomain[domain] = (clicksByDomain[domain] || 0) + 1;
    } catch (e) {}
  });

  Object.entries(clicksByDomain).forEach(([domain, count]) => {
    if (count >= 50) {
      patterns.push({
        type: 'high_click_activity',
        domain: domain,
        count: count,
        severity: count >= 200 ? 'high' : count >= 100 ? 'medium' : 'low',
        suggestion: `User made ${count} clicks on ${domain} - investigate for repetitive workflows`
      });
    }
  });

  // Pattern 4: Time sinks (spending excessive time on specific sites)
  const timeByDomain = {};
  activities.filter(a => a.type === 'time_spent').forEach(a => {
    if (!timeByDomain[a.domain]) {
      timeByDomain[a.domain] = 0;
    }
    timeByDomain[a.domain] += a.duration;
  });

  Object.entries(timeByDomain).forEach(([domain, time]) => {
    const hours = time / (1000 * 60 * 60);
    if (hours >= 2) {
      patterns.push({
        type: 'time_sink',
        domain: domain,
        hours: hours.toFixed(2),
        severity: hours >= 8 ? 'high' : hours >= 4 ? 'medium' : 'low',
        suggestion: `User spent ${hours.toFixed(2)} hours on ${domain} - check if task can be automated`
      });
    }
  });

  // Sort patterns by severity
  const severityOrder = { high: 0, medium: 1, low: 2 };
  patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Save patterns
  await chrome.storage.local.set({
    patterns: patterns,
    lastAnalysis: Date.now()
  });

  return patterns;
}

// Export data for external analysis
async function exportData() {
  const result = await chrome.storage.local.get(['activities', 'patterns', 'screenshots']);

  return {
    activities: result.activities || [],
    patterns: result.patterns || [],
    screenshots: result.screenshots || [],
    exportDate: new Date().toISOString()
  };
}

// ============================================================================
// SCREENSHOT FUNCTIONALITY
// ============================================================================

// Check if screenshot should be triggered based on event
async function checkScreenshotTriggers(tab, eventData) {
  const settings = await chrome.storage.sync.get({
    screenshotEnabled: true,
    screenshotOnForm: true,
    screenshotOnRepetitive: true,
    screenshotOnHighActivity: true,
    screenshotThrottleSeconds: 30
  });

  if (!settings.screenshotEnabled) {
    return;
  }

  // Throttle screenshots to avoid spam
  const domain = new URL(tab.url).hostname;
  const now = Date.now();
  const lastTime = lastScreenshotTime[domain] || 0;
  const throttleMs = settings.screenshotThrottleSeconds * 1000;

  if (now - lastTime < throttleMs) {
    return; // Too soon since last screenshot
  }

  let shouldCapture = false;
  let trigger = '';
  let metadata = {};

  // Trigger 1: Form submissions
  if (settings.screenshotOnForm && eventData.type === 'form_submit') {
    shouldCapture = true;
    trigger = 'form_submission';
    metadata = {
      formAction: eventData.action,
      fieldCount: eventData.fieldCount
    };
  }

  // Trigger 2: Repetitive click patterns
  if (settings.screenshotOnRepetitive && eventData.type === 'repetitive_click_pattern') {
    shouldCapture = true;
    trigger = 'repetitive_clicks';
    metadata = {
      clickCount: eventData.count,
      element: eventData.element
    };
  }

  // Trigger 3: Input batch (potential data entry)
  if (settings.screenshotOnHighActivity && eventData.type === 'input_batch' && eventData.count >= 10) {
    shouldCapture = true;
    trigger = 'high_input_activity';
    metadata = {
      inputCount: eventData.count
    };
  }

  if (shouldCapture) {
    lastScreenshotTime[domain] = now;
    await captureScreenshot(trigger, metadata);
  }
}

// Capture screenshot of active tab
async function captureScreenshot(trigger = 'manual', metadata = {}) {
  try {
    // Get active tab
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab) {
      console.log('No active tab for screenshot');
      return null;
    }

    // Skip certain URLs
    if (activeTab.url.startsWith('chrome://') ||
        activeTab.url.startsWith('chrome-extension://') ||
        activeTab.url.startsWith('about:')) {
      return null;
    }

    // Capture the screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(activeTab.windowId, {
      format: 'jpeg',
      quality: 70 // Compress to save storage
    });

    // Create screenshot object
    const screenshot = {
      id: generateId(),
      url: activeTab.url,
      title: activeTab.title,
      domain: new URL(activeTab.url).hostname,
      trigger: trigger,
      metadata: metadata,
      timestamp: Date.now(),
      dataUrl: dataUrl,
      thumbnailUrl: await createThumbnail(dataUrl)
    };

    // Save screenshot
    await saveScreenshot(screenshot);

    console.log(`Screenshot captured: ${trigger} on ${screenshot.domain}`);
    return screenshot;

  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return null;
  }
}

// Create thumbnail from screenshot
async function createThumbnail(dataUrl) {
  try {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onerror = () => {
        console.log('Image load error, using original dataUrl');
        resolve(dataUrl); // Fallback to original
      };

      img.onload = () => {
        try {
          const canvas = new OffscreenCanvas(200, 150);
          const ctx = canvas.getContext('2d');

          const scale = Math.min(200 / img.width, 150 / img.height);
          const width = img.width * scale;
          const height = img.height * scale;

          ctx.drawImage(img, 0, 0, width, height);

          canvas.convertToBlob({ type: 'image/jpeg', quality: 0.5 })
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => resolve(dataUrl); // Fallback
              reader.readAsDataURL(blob);
            })
            .catch(() => resolve(dataUrl)); // Fallback
        } catch (error) {
          console.log('Thumbnail creation error:', error);
          resolve(dataUrl); // Fallback to original
        }
      };

      img.src = dataUrl;
    });
  } catch (error) {
    console.log('createThumbnail error:', error);
    return dataUrl; // Fallback to original
  }
}

// Save screenshot to storage
async function saveScreenshot(screenshot) {
  const result = await chrome.storage.local.get(['screenshots']);
  const screenshots = result.screenshots || [];

  screenshots.push(screenshot);

  // Keep only last 50 screenshots to prevent storage bloat
  // Screenshots are large, so we limit them more aggressively
  if (screenshots.length > 50) {
    screenshots.shift();
  }

  await chrome.storage.local.set({ screenshots });

  // Check storage usage
  const bytesInUse = await chrome.storage.local.getBytesInUse();
  const maxBytes = chrome.storage.local.QUOTA_BYTES || 10485760; // 10MB default

  if (bytesInUse > maxBytes * 0.9) {
    console.warn('Storage almost full, removing old screenshots');
    // Remove oldest screenshots if storage is > 90% full
    screenshots.splice(0, 10);
    await chrome.storage.local.set({ screenshots });
  }
}

// Get all screenshots
async function getScreenshots(filter = {}) {
  const result = await chrome.storage.local.get(['screenshots']);
  let screenshots = result.screenshots || [];

  // Apply filters
  if (filter.trigger) {
    screenshots = screenshots.filter(s => s.trigger === filter.trigger);
  }
  if (filter.domain) {
    screenshots = screenshots.filter(s => s.domain === filter.domain);
  }
  if (filter.since) {
    screenshots = screenshots.filter(s => s.timestamp >= filter.since);
  }

  // Sort by timestamp (newest first)
  screenshots.sort((a, b) => b.timestamp - a.timestamp);

  return screenshots;
}

// Delete a screenshot
async function deleteScreenshot(screenshotId) {
  const result = await chrome.storage.local.get(['screenshots']);
  let screenshots = result.screenshots || [];

  screenshots = screenshots.filter(s => s.id !== screenshotId);
  await chrome.storage.local.set({ screenshots });

  return { success: true };
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
