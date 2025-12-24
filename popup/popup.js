// Popup UI logic

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize tabs
  initTabs();

  // Load initial data
  await loadStats();

  // Set up event listeners
  document.getElementById('analyze-btn').addEventListener('click', runAnalysis);
  document.getElementById('ai-analyze-btn').addEventListener('click', runAIAnalysis);
  document.getElementById('export-btn').addEventListener('click', exportData);
  document.getElementById('clear-btn').addEventListener('click', clearData);
  document.getElementById('options-btn').addEventListener('click', openOptions);

  // Load AI provider setting
  loadAIProvider();

  // Auto-refresh every 30 seconds
  setInterval(loadStats, 30000);
});

// Tab management
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Remove active class from all tabs
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add active class to clicked tab
      button.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });
}

// Load statistics
async function loadStats() {
  try {
    const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });

    // Update overview stats
    document.getElementById('total-events').textContent = formatNumber(stats.totalEvents);
    document.getElementById('today-events').textContent = formatNumber(stats.todayEvents);
    document.getElementById('click-count').textContent = formatNumber(stats.clickCount);
    document.getElementById('form-count').textContent = formatNumber(stats.formSubmissions);

    // Update time by domain
    const timeDomainsDiv = document.getElementById('time-domains');
    if (stats.topDomains && stats.topDomains.length > 0) {
      timeDomainsDiv.innerHTML = stats.topDomains.map(item => `
        <div class="domain-item">
          <span class="domain-name">${escapeHtml(item.domain)}</span>
          <span class="domain-time">${formatDuration(item.time)}</span>
        </div>
      `).join('');
    } else {
      timeDomainsDiv.innerHTML = '<p class="placeholder">No data yet</p>';
    }

    // Update quick stats
    const quickStatsDiv = document.getElementById('quick-stats');
    quickStatsDiv.innerHTML = `
      <p>📱 Navigations: ${stats.navigations}</p>
      <p>📊 Events this week: ${formatNumber(stats.weekEvents)}</p>
      <p>🔄 Patterns detected: ${stats.patterns.length}</p>
    `;

    // Update patterns if available
    if (stats.patterns && stats.patterns.length > 0) {
      displayPatterns(stats.patterns);
    }

    // Update last analysis time
    if (stats.lastAnalysis) {
      document.getElementById('last-analysis').textContent =
        `Last analysis: ${formatTimeAgo(stats.lastAnalysis)}`;
    }

    // Update footer
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Run pattern analysis
async function runAnalysis() {
  const button = document.getElementById('analyze-btn');
  button.disabled = true;
  button.textContent = 'Analyzing...';

  try {
    const patterns = await chrome.runtime.sendMessage({ type: 'ANALYZE_PATTERNS' });
    displayPatterns(patterns);

    // Show success message
    setTimeout(() => {
      button.textContent = 'Run Analysis';
      button.disabled = false;
    }, 1000);

  } catch (error) {
    console.error('Error running analysis:', error);
    button.textContent = 'Error - Try Again';
    button.disabled = false;
  }
}

// Display detected patterns
function displayPatterns(patterns) {
  const patternsDiv = document.getElementById('patterns-list');

  if (patterns.length === 0) {
    patternsDiv.innerHTML = '<p class="placeholder">No patterns detected yet. Keep using your browser and check back later.</p>';
    return;
  }

  patternsDiv.innerHTML = patterns.map(pattern => `
    <div class="pattern-card severity-${pattern.severity}">
      <div class="pattern-type">
        ${formatPatternType(pattern.type)}
        <span class="severity-badge ${pattern.severity}">${pattern.severity}</span>
      </div>
      <div class="pattern-details">
        ${formatPatternDetails(pattern)}
      </div>
      <div class="pattern-suggestion">
        💡 ${escapeHtml(pattern.suggestion)}
      </div>
    </div>
  `).join('');
}

// Format pattern type
function formatPatternType(type) {
  const types = {
    'repetitive_navigation': '🔄 Repetitive Navigation',
    'repetitive_forms': '📝 Repetitive Forms',
    'high_click_activity': '🖱️ High Click Activity',
    'time_sink': '⏱️ Time Sink'
  };
  return types[type] || type;
}

// Format pattern details
function formatPatternDetails(pattern) {
  switch (pattern.type) {
    case 'repetitive_navigation':
      return `URL visited <strong>${pattern.count}</strong> times`;
    case 'repetitive_forms':
      return `<strong>${pattern.count}</strong> forms submitted on ${escapeHtml(pattern.domain)}`;
    case 'high_click_activity':
      return `<strong>${pattern.count}</strong> clicks on ${escapeHtml(pattern.domain)}`;
    case 'time_sink':
      return `<strong>${pattern.hours}</strong> hours spent on ${escapeHtml(pattern.domain)}`;
    default:
      return JSON.stringify(pattern);
  }
}

// Run AI analysis
async function runAIAnalysis() {
  const resultsDiv = document.getElementById('ai-results');
  const loadingDiv = document.getElementById('ai-loading');
  const button = document.getElementById('ai-analyze-btn');

  // Get AI provider settings
  const settings = await chrome.storage.sync.get(['aiProvider', 'aiApiKey']);

  if (!settings.aiProvider || !settings.aiApiKey || settings.aiProvider === 'none') {
    resultsDiv.innerHTML = '<p class="placeholder">Please configure your AI provider in Options first.</p>';
    return;
  }

  button.disabled = true;
  loadingDiv.style.display = 'block';
  resultsDiv.innerHTML = '';

  try {
    // Get current data
    const exportedData = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' });

    // Call AI analysis
    const analysis = await analyzeWithAI(
      exportedData,
      settings.aiProvider,
      settings.aiApiKey
    );

    loadingDiv.style.display = 'none';
    resultsDiv.innerHTML = `
      <div style="background: white; padding: 15px; border-radius: 8px;">
        <h4 style="margin-bottom: 10px; color: #667eea;">🤖 AI Analysis Results</h4>
        <div style="line-height: 1.8;">${formatAIResponse(analysis)}</div>
      </div>
    `;

  } catch (error) {
    loadingDiv.style.display = 'none';
    resultsDiv.innerHTML = `<p style="color: #e74c3c;">Error: ${escapeHtml(error.message)}</p>`;
  } finally {
    button.disabled = false;
  }
}

// Analyze with AI
async function analyzeWithAI(data, provider, apiKey) {
  const prompt = `You are an automation consultant analyzing employee activity data to identify automation opportunities.

Activity Summary:
- Total events tracked: ${data.activities.length}
- Detected patterns: ${data.patterns.length}

Patterns detected:
${JSON.stringify(data.patterns, null, 2)}

Based on this activity data, please:
1. Identify the top 3-5 automation opportunities
2. For each opportunity, explain:
   - What task is being repeated
   - Why it's a good automation candidate
   - Suggested automation approach (RPA, API integration, browser automation, etc.)
   - Estimated time savings
3. Prioritize by impact (time saved × frequency)

Format your response in clear, actionable bullet points.`;

  if (provider === 'openai') {
    return await callOpenAI(apiKey, prompt);
  } else if (provider === 'anthropic') {
    return await callAnthropic(apiKey, prompt);
  }

  throw new Error('Unsupported AI provider');
}

// Call OpenAI API
async function callOpenAI(apiKey, prompt) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert automation consultant specializing in identifying automation opportunities from user activity data.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

// Call Anthropic API
async function callAnthropic(apiKey, prompt) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.content[0].text;
}

// Format AI response
function formatAIResponse(text) {
  // Convert markdown-style formatting to HTML
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

// Export data
async function exportData() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' });

    // Create downloadable JSON file
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-tracker-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert('Data exported successfully!');
  } catch (error) {
    alert('Error exporting data: ' + error.message);
  }
}

// Clear data
async function clearData() {
  if (confirm('Are you sure you want to clear all tracking data? This cannot be undone.')) {
    await chrome.storage.local.set({
      activities: [],
      sessions: [],
      patterns: [],
      lastAnalysis: null
    });

    alert('All data cleared!');
    await loadStats();
  }
}

// Open options page
function openOptions() {
  chrome.runtime.openOptionsPage();
}

// Load AI provider setting
async function loadAIProvider() {
  const settings = await chrome.storage.sync.get(['aiProvider']);
  const select = document.getElementById('ai-provider');

  if (settings.aiProvider) {
    select.value = settings.aiProvider;
  }
}

// Utility: Format number with commas
function formatNumber(num) {
  return num.toLocaleString();
}

// Utility: Format duration
function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Utility: Format time ago
function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
