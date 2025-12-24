// Background service worker for Activity Tracker

// Track active tab and time spent
let activeTabId = null;
let activeStartTime = null;
let dailyStats = {};

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
    lastAnalysis: null
  });
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
  }
});

// Periodic analysis alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicAnalysis') {
    analyzePatterns();
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
  const result = await chrome.storage.local.get(['activities', 'patterns']);

  return {
    activities: result.activities || [],
    patterns: result.patterns || [],
    exportDate: new Date().toISOString()
  };
}
