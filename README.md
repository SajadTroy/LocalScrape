# LocalScrape — Visual Web Scraper

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](manifest.json)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-%E2%9D%A4-ea4aaa?logo=github-sponsors)](https://github.com/sponsors/SajadTroy)

> **Hover. Click. Download.** Extract data from any webpage in seconds — no code, no cloud, no tracking.

---

## What is LocalScrape?

LocalScrape is a Chrome extension that lets you visually select elements on any webpage and instantly export all matching content as **CSV** or **JSON**. Everything runs 100% locally in your browser. No data ever leaves your machine.

---

## Features

- 🎯 **Visual element picker** — hover over any element to highlight it with a blue outline
- ⚡ **Smart similarity matching** — click once to extract all elements sharing the same CSS selector
- 📄 **CSV & JSON export** — RFC-4180 compliant CSV or structured JSON, your choice
- 🔒 **100% local** — no server, no account, no analytics
- ⌨️ **Keyboard shortcuts** — `Escape` to stop, `Ctrl/Cmd+Z` to undo a selection and pick again
- 💾 **Instant download** — files saved directly to your Downloads folder via the browser
- 🔁 **State restoration** — reopen the popup at any time to see your last extraction

---

## Installation (Developer Mode)

> The extension is not yet on the Chrome Web Store. Load it unpacked for now.

1. Clone or download this repository:
   ```bash
   git clone https://github.com/SajadTroy/LocalScrape.git
   ```
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `LocalScrape` folder
6. The LocalScrape icon will appear in your toolbar

---

## How to Use

| Step | Action |
|------|--------|
| **1** | Click the LocalScrape icon in the Chrome toolbar |
| **2** | Click **Start Scraping** — the popup closes and the page becomes interactive |
| **3** | Move your mouse over the page — elements highlight in **blue** as you hover |
| **4** | Click the element you want to extract — all similar elements highlight in **green** |
| **5** | Click the LocalScrape icon again to reopen the popup |
| **6** | Choose **CSV** or **JSON**, then click **Download** |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Stop scraping and remove all highlights |
| `Ctrl` / `Cmd` + `Z` | Undo selection and pick a different element |

---

## Permissions

LocalScrape requests only the minimum permissions required:

| Permission | Why it's needed |
|------------|-----------------|
| `activeTab` | Access the current tab when you click the extension icon |
| `scripting` | Inject the hover/click scraper script and styles into the page |
| `downloads` | Save the exported CSV or JSON file to your Downloads folder |

No `<all_urls>` host permission is requested. LocalScrape only activates on the tab you explicitly click it on.

---

## Privacy

- **No data collection.** LocalScrape does not transmit, store, or log any page content.
- **No network requests.** The extension makes zero outbound connections.
- **No tracking.** There are no analytics, telemetry, or third-party services.
- All extracted data stays on your machine until you choose to download it.

---

## Project Structure

```
LocalScrape/
├── .github/FUNDING.yml   # GitHub Sponsors config
├── icons/                # Extension icons (16, 48, 128px)
├── background.js         # Service worker — handles file downloads
├── manifest.json         # Manifest V3 config
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── scraper.css           # Injected page styles
└── scraper.js            # Injected scraping engine
```

---

## Development

No build step required — this is vanilla HTML, CSS, and JavaScript.

1. Make your changes
2. Go to `chrome://extensions`
3. Click the **refresh** icon on the LocalScrape card
4. Test on any regular webpage

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

---

## Support the Project

If LocalScrape saves you time, consider sponsoring its development:

[![Sponsor SajadTroy](https://img.shields.io/badge/Sponsor%20SajadTroy-%E2%9D%A4-ea4aaa?style=for-the-badge&logo=github-sponsors)](https://github.com/sponsors/SajadTroy)

Your support helps keep the project free, open-source, and actively maintained.

---

## License

[MIT](LICENSE) © 2026 [SajadTroy](https://github.com/SajadTroy)
