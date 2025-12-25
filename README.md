# 🔍 Activity Tracker & Automation Advisor

A powerful Chrome extension designed for automation agencies to track employee activities, identify time sinks, detect repetitive patterns, and discover automation opportunities using AI analysis.

## 🎯 Purpose

This extension helps automation consultants:
- **Track what employees actually do** - Monitor clicks, forms, navigation, and time spent
- **Identify time sinks** - See where time is being wasted on repetitive tasks
- **Detect patterns** - Automatically find repetitive actions that could be automated
- **Get AI insights** - Use GPT-4 or Claude to analyze patterns and suggest automation opportunities
- **Make informed decisions** - Export data and review AI recommendations before implementing automation

Perfect for automation agencies working with businesses that have 5+ employees where manual observation isn't scalable.

## ✨ Features

### Activity Tracking
- ✅ **Page navigation tracking** - Every URL visit with timestamps
- ✅ **Click tracking** - All mouse clicks with element details
- ✅ **Form submission tracking** - Capture form interactions
- ✅ **Time tracking** - Precise time spent on each domain
- ✅ **Input tracking** - Detect data entry patterns
- ✅ **Copy/paste detection** - Identify repetitive data transfer
- ✅ **Keyboard shortcuts** - Track power user behaviors

### Pattern Detection
- 🔄 **Repetitive navigation** - Same URLs visited multiple times
- 📝 **Repetitive forms** - Frequent form submissions on same domains
- 🖱️ **High click activity** - Detect manual workflows requiring many clicks
- ⏱️ **Time sinks** - Identify domains consuming excessive time
- 🔁 **Repetitive click patterns** - Same elements clicked repeatedly

### AI-Powered Analysis
- 🤖 **OpenAI GPT-4 integration** - Advanced pattern analysis
- 🤖 **Anthropic Claude integration** - Alternative AI analysis
- 💡 **Automation recommendations** - AI suggests RPA, API, or browser automation solutions
- 📊 **Impact prioritization** - Ranked by time saved × frequency
- 📈 **ROI estimation** - Estimated time savings for each opportunity

### Visual Workflow Capture
- 📸 **Automatic screenshots** - Captures screens when triggers are detected
- 🎯 **Smart triggers** - Screenshots on form submissions, repetitive clicks, high input activity
- ⏰ **Periodic snapshots** - Optional scheduled screenshots every 5 minutes
- 🖼️ **Screenshot gallery** - Browse captured screens with metadata
- 💾 **Storage management** - Automatic compression and cleanup to prevent storage issues
- 🔍 **Visual workflow documentation** - See exactly what users are doing

### Dashboard & Reporting
- 📊 **Real-time statistics** - Live activity metrics
- 📈 **Visual insights** - Time by domain, event counts, pattern severity
- 📸 **Screenshot gallery** - Visual record of workflows with filtering
- 📤 **Data export** - Export full activity data as JSON (including screenshots)
- 🎨 **Beautiful UI** - Gradient design with intuitive tabs

## 🚀 Installation

### Step 1: Generate Icons

The extension requires PNG icons. Generate them from the SVG:

```bash
cd icons
./generate-icons.sh
```

Or manually convert `icons/icon.svg` to PNG at these sizes:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels
- `icon128.png` - 128x128 pixels

You can use online tools:
- https://cloudconvert.com/svg-to-png
- https://svgtopng.com/

### Step 2: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select this directory (Test2)
5. The extension should now appear in your toolbar

### Step 3: Configure AI (Optional)

1. Click the extension icon
2. Click "Options" button
3. Select your AI provider (OpenAI or Anthropic)
4. Enter your API key
5. Save settings

**Getting API Keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/

## 📖 Usage Guide

### Basic Tracking

Once installed, the extension automatically tracks:
- Every page you visit
- Every click you make
- Every form you submit
- Time spent on each site

**No action required** - just browse normally!

### Viewing Statistics

1. Click the extension icon to open the dashboard
2. Navigate through four tabs:
   - **Overview**: See total events, clicks, forms, and time by domain
   - **Patterns**: View detected automation opportunities
   - **Screenshots**: Browse visual records of workflows
   - **AI Insights**: Get AI-powered recommendations

### Using Screenshots

**Automatic Capture:**
Screenshots are automatically captured when:
- Forms are submitted (see what data is being entered)
- Repetitive click patterns detected (catch manual workflows)
- High input activity occurs (identify data entry tasks)
- Optionally: Every 5 minutes (enable in Options)

**Viewing Screenshots:**
1. Open dashboard → "Screenshots" tab
2. Browse captured screenshots as thumbnails
3. Click any screenshot to view full size
4. Filter by trigger type (forms, repetitive clicks, etc.)
5. Delete unwanted screenshots

**Manual Capture:**
- Click "Capture Now" button in Screenshots tab for instant capture

**Settings:**
- Configure triggers in Options → Screenshot Settings
- Adjust throttle time to prevent spam
- Set maximum screenshots to keep
- Enable/disable specific triggers

### Running Pattern Analysis

**Manual Analysis:**
1. Open the dashboard
2. Go to the "Patterns" tab
3. Click "Run Analysis"
4. View detected patterns sorted by severity (High/Medium/Low)

**Automatic Analysis:**
- By default, runs every 30 minutes
- Configure interval in Options

### Getting AI Recommendations

1. Configure AI provider in Options (see Step 3 above)
2. Open dashboard → "AI Insights" tab
3. Click "Analyze with AI"
4. Wait ~10-30 seconds for analysis
5. Review AI recommendations for:
   - Top automation opportunities
   - Recommended automation approach
   - Estimated time savings
   - Priority ranking

### Exporting Data

Export all tracking data for external analysis:

1. Open dashboard
2. Click "Export Data" button
3. Save the JSON file
4. Use with your own analysis tools or share with clients

**Export includes:**
- All tracked activities
- Detected patterns
- **Captured screenshots** (with metadata)
- Timestamps and metadata

## 🛠️ Configuration Options

Access via: Extension icon → Options button

### AI Settings
- **AI Provider**: Choose OpenAI, Anthropic, or None
- **API Key**: Securely stored locally

### Tracking Settings
- Toggle tracking for: clicks, forms, navigation, time, inputs
- Customize what gets tracked

### Analysis Settings
- **Auto-analysis interval**: 15min, 30min, 1hr, 2hr, or manual only

### Screenshot Settings
- **Enable/disable** screenshot capture globally
- **Trigger toggles**: Form submissions, repetitive clicks, high input activity
- **Periodic screenshots**: Optional 5-minute interval captures
- **Throttle time**: Minimum seconds between screenshots (10s - 5min)
- **Storage limit**: Max screenshots to keep (20, 50, 100, or 200)

### Privacy Settings
- **Data retention**: 7, 30, 90 days, or keep all
- **Exclude sensitive sites**: Auto-exclude banking, healthcare
- **Exclude domains**: Custom domain blacklist

## 🔒 Privacy & Security

### Data Storage
- ✅ All data stored **locally** in Chrome storage
- ✅ **No external servers** except AI APIs (when enabled)
- ✅ **No tracking of credentials** or sensitive form data
- ✅ API keys stored securely in Chrome's sync storage

### What's Tracked
- URLs visited
- Click locations (element type, ID, class)
- Form submissions (without form data)
- Time spent per domain
- Navigation patterns
- **Screenshots** (with triggers and metadata, stored as compressed JPEG)

### What's NOT Tracked
- ❌ Passwords or credentials
- ❌ Actual form field values
- ❌ Incognito/private browsing
- ❌ Content of text you type
- ❌ Personal messages

### AI Privacy
- Activity data sent to AI providers **only when you click "Analyze with AI"**
- You can disable AI entirely
- AI providers (OpenAI/Anthropic) have their own privacy policies
- Consider this before analyzing sensitive business workflows

## 💼 Use Cases

### For Automation Agencies

**Scenario**: Client has 10 employees doing manual data entry
1. Install extension on employee machines (with permission)
2. Track activities for 1-2 weeks
3. Run pattern analysis
4. Review AI recommendations
5. Identify top 3-5 automation opportunities
6. Export data for client presentation
7. Implement highest-ROI automations first

**Benefits:**
- Data-driven automation decisions
- Quantified time savings
- Clear before/after metrics
- Employee buy-in (they see what's repetitive)

### Common Patterns Detected

- **Repetitive form filling** → RPA with auto-fill
- **Frequent navigation to same pages** → Browser shortcuts or bookmarks
- **High click counts on admin panels** → API integration
- **Copy/paste between systems** → Data pipeline automation
- **Excessive time on manual tasks** → Process automation

## 🔧 Technical Details

### Architecture
- **Manifest V3** - Latest Chrome extension standard
- **Service Worker** - Background processing
- **Content Scripts** - Page-level tracking
- **Chrome Storage API** - Local data persistence
- **Chrome Alarms API** - Scheduled analysis

### Files Structure
```
Test2/
├── manifest.json           # Extension configuration
├── background.js           # Service worker (main logic)
├── content.js              # Activity tracking script
├── popup/                  # Dashboard UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── options/                # Settings page
│   ├── options.html
│   ├── options.css
│   └── options.js
├── icons/                  # Extension icons
│   ├── icon.svg
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Storage Limits
- Maximum ~10MB in Chrome local storage
- Extension keeps last 10,000 events
- Older events automatically removed
- Configure retention period in Options

### Permissions Required
- `tabs` - Track active tabs
- `storage` - Save activity data
- `activeTab` - Access current page
- `alarms` - Schedule periodic analysis
- `scripting` - Inject content scripts
- `webNavigation` - Track page navigation
- `<all_urls>` - Track all websites

## 📊 Pattern Detection Algorithms

### Repetitive Navigation
- Threshold: ≥5 visits to same URL
- Severity:
  - High: ≥20 visits
  - Medium: 10-19 visits
  - Low: 5-9 visits

### Repetitive Forms
- Threshold: ≥3 form submissions on same domain
- Severity:
  - High: ≥10 submissions
  - Medium: 5-9 submissions
  - Low: 3-4 submissions

### High Click Activity
- Threshold: ≥50 clicks on same domain
- Severity:
  - High: ≥200 clicks
  - Medium: 100-199 clicks
  - Low: 50-99 clicks

### Time Sinks
- Threshold: ≥2 hours on same domain
- Severity:
  - High: ≥8 hours
  - Medium: 4-7 hours
  - Low: 2-3 hours

## 🚨 Troubleshooting

### Extension not tracking
1. Check if extension is enabled in `chrome://extensions/`
2. Verify tracking settings in Options
3. Reload the page you're testing on
4. Check browser console for errors (F12)

### AI analysis not working
1. Verify API key is correct in Options
2. Check API provider has credits/quota
3. Try switching providers
4. Check browser console for error messages

### Icons not showing
1. Generate PNG icons from SVG (see Installation step 1)
2. Ensure files are named correctly: `icon16.png`, `icon48.png`, `icon128.png`
3. Reload extension in `chrome://extensions/`

### Dashboard shows no data
1. Browse some websites first (data only tracks when active)
2. Wait a few minutes for data to accumulate
3. Click refresh/reopen dashboard
4. Check storage isn't full (clear old data if needed)

## 🤝 Employee Consent & Legal

**IMPORTANT**: Before deploying this extension:

1. ✅ **Get employee consent** - Inform employees they're being tracked
2. ✅ **Check local laws** - Employee monitoring laws vary by location
3. ✅ **Be transparent** - Explain the purpose (finding automation, not surveillance)
4. ✅ **Limit scope** - Only track work-related activities
5. ✅ **Respect privacy** - Don't track personal browsing
6. ✅ **Share benefits** - Automation helps employees too (less tedious work)

**Recommended approach:**
- Present as "automation opportunity finder"
- Show employees the patterns found
- Involve them in deciding what to automate
- Make it opt-in when possible
- Never use for performance monitoring

## 📈 Roadmap

Future enhancements:
- [ ] Desktop app version (for non-browser activities)
- [ ] Screenshot capture for visual workflows
- [ ] Video recording of repetitive tasks
- [ ] Direct integration with RPA tools (UiPath, Automation Anywhere)
- [ ] Team dashboard (aggregate data from multiple employees)
- [ ] Pre-built automation templates based on patterns
- [ ] Cost/benefit calculator for automation ROI
- [ ] API for custom integrations

## 📝 License

See LICENSE file for details.

## 🙋 Support

For issues or questions:
1. Check Troubleshooting section above
2. Review browser console for errors
3. Verify all files are present and correctly named
4. Ensure Chrome is up to date

## 🎉 Credits

Built for automation agencies to scale their discovery process and make data-driven automation decisions.

---

**Happy automating! 🤖**
