// Options page logic

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  await loadSettings();

  // Set up event listeners
  document.getElementById('ai-provider').addEventListener('change', handleProviderChange);
  document.getElementById('save-btn').addEventListener('click', saveSettings);
  document.getElementById('reset-btn').addEventListener('click', resetSettings);
});

// Load settings from storage
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    aiProvider: 'none',
    aiApiKey: '',
    trackClicks: true,
    trackForms: true,
    trackNavigation: true,
    trackTime: true,
    trackInputs: true,
    analysisInterval: 30,
    screenshotEnabled: true,
    screenshotOnForm: true,
    screenshotOnRepetitive: true,
    screenshotOnHighActivity: true,
    screenshotPeriodic: false,
    screenshotThrottleSeconds: 30,
    screenshotMax: 50,
    dataRetention: 30,
    excludeSensitive: false,
    excludeDomains: ''
  });

  // AI settings
  document.getElementById('ai-provider').value = settings.aiProvider;
  document.getElementById('api-key').value = settings.aiApiKey;
  handleProviderChange();

  // Tracking settings
  document.getElementById('track-clicks').checked = settings.trackClicks;
  document.getElementById('track-forms').checked = settings.trackForms;
  document.getElementById('track-navigation').checked = settings.trackNavigation;
  document.getElementById('track-time').checked = settings.trackTime;
  document.getElementById('track-inputs').checked = settings.trackInputs;

  // Analysis settings
  document.getElementById('analysis-interval').value = settings.analysisInterval;

  // Screenshot settings
  document.getElementById('screenshot-enabled').checked = settings.screenshotEnabled;
  document.getElementById('screenshot-on-form').checked = settings.screenshotOnForm;
  document.getElementById('screenshot-on-repetitive').checked = settings.screenshotOnRepetitive;
  document.getElementById('screenshot-on-high-activity').checked = settings.screenshotOnHighActivity;
  document.getElementById('screenshot-periodic').checked = settings.screenshotPeriodic;
  document.getElementById('screenshot-throttle').value = settings.screenshotThrottleSeconds;
  document.getElementById('screenshot-max').value = settings.screenshotMax;

  // Privacy settings
  document.getElementById('data-retention').value = settings.dataRetention;
  document.getElementById('exclude-sensitive').checked = settings.excludeSensitive;
  document.getElementById('exclude-domains').value = settings.excludeDomains;
}

// Handle AI provider change
function handleProviderChange() {
  const provider = document.getElementById('ai-provider').value;
  const apiKeyGroup = document.getElementById('api-key-group');
  const openaiInstructions = document.getElementById('openai-instructions');
  const anthropicInstructions = document.getElementById('anthropic-instructions');

  // Hide all
  apiKeyGroup.style.display = 'none';
  openaiInstructions.style.display = 'none';
  anthropicInstructions.style.display = 'none';

  // Show relevant
  if (provider === 'openai') {
    apiKeyGroup.style.display = 'block';
    openaiInstructions.style.display = 'block';
  } else if (provider === 'anthropic') {
    apiKeyGroup.style.display = 'block';
    anthropicInstructions.style.display = 'block';
  }
}

// Save settings
async function saveSettings() {
  const settings = {
    aiProvider: document.getElementById('ai-provider').value,
    aiApiKey: document.getElementById('api-key').value,
    trackClicks: document.getElementById('track-clicks').checked,
    trackForms: document.getElementById('track-forms').checked,
    trackNavigation: document.getElementById('track-navigation').checked,
    trackTime: document.getElementById('track-time').checked,
    trackInputs: document.getElementById('track-inputs').checked,
    analysisInterval: parseInt(document.getElementById('analysis-interval').value),
    screenshotEnabled: document.getElementById('screenshot-enabled').checked,
    screenshotOnForm: document.getElementById('screenshot-on-form').checked,
    screenshotOnRepetitive: document.getElementById('screenshot-on-repetitive').checked,
    screenshotOnHighActivity: document.getElementById('screenshot-on-high-activity').checked,
    screenshotPeriodic: document.getElementById('screenshot-periodic').checked,
    screenshotThrottleSeconds: parseInt(document.getElementById('screenshot-throttle').value),
    screenshotMax: parseInt(document.getElementById('screenshot-max').value),
    dataRetention: parseInt(document.getElementById('data-retention').value),
    excludeSensitive: document.getElementById('exclude-sensitive').checked,
    excludeDomains: document.getElementById('exclude-domains').value
  };

  await chrome.storage.sync.set(settings);

  // Update alarm for analysis interval
  if (settings.analysisInterval > 0) {
    chrome.alarms.create('periodicAnalysis', {
      periodInMinutes: settings.analysisInterval
    });
  } else {
    chrome.alarms.clear('periodicAnalysis');
  }

  // Update alarm for periodic screenshots
  if (settings.screenshotEnabled && settings.screenshotPeriodic) {
    chrome.alarms.create('periodicScreenshot', {
      periodInMinutes: 5
    });
  } else {
    chrome.alarms.clear('periodicScreenshot');
  }

  // Show success message
  const message = document.getElementById('save-message');
  message.style.display = 'block';
  setTimeout(() => {
    message.style.display = 'none';
  }, 3000);
}

// Reset to default settings
async function resetSettings() {
  if (confirm('Reset all settings to defaults? This will not delete your tracking data.')) {
    await chrome.storage.sync.clear();
    await loadSettings();
  }
}
