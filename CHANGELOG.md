# Changelog

All notable changes to **LocalScrape** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.1.3] — 2026-08-27

### Changed
- Replaced standard utility SVG icons with beautiful uniform icons from MynaUI for a cleaner, modern look.
- Enforced a consistent 32px height across all action buttons in the injected panel for perfect visual alignment.
- Significantly increased the width and scale of the "Buy Me a Coffee" sponsor button to make it more prominent and legible.
- Removed redundant icons from the Download buttons in favor of clean text labels.

---

## [1.1.2] — 2026-08-23

### Added
- Implemented an `error.html` popup that appears when attempting to use the extension on restricted pages (e.g., `chrome://`, Chrome Web Store), preventing silent failures.
- Re-added the `tabs` permission to dynamically check the current tab URL for restrictions and set the error popup accordingly.

---

## [1.1.1] — 2026-08-21

### Added
- Added "Copy to Clipboard" buttons for both CSV and JSON formats next to the download buttons.
- Clicking the selected element again (or clicking anywhere else on the page) now instantly unselects it and clears the UI.

---

## [1.1.0] — 2026-08-18

### Changed
- **Major UI Overhaul**: Replaced the dark glassmorphism popup with a clean, flat, light-mode floating panel injected directly into the page.
- Removed the extension popup entirely. The extension now activates instantly upon clicking the toolbar icon.
- Download buttons (CSV/JSON) moved directly into the injected in-page panel.
- Fixed a bug where the scraper would accidentally extract its own UI elements.
- Renamed "Stop" button to "Cancel" for clarity.
- Removed the `tabs` permission from `manifest.json` to comply with Chrome Web Store policies.

### Added
- "Support on GitHub" sponsor button added directly to the panel footer.
- Duplicate removal: automatically filters out duplicate extracted values using JavaScript `Set`.

---

## [1.0.0] — 2026-08-17

### Added
- Initial release of LocalScrape: Visual Web Scraper.
- Hover-highlight (blue outline) on any page element via injected `scraper.css`.
- Click-to-extract: selects the clicked element, builds a `tag.class` CSS selector,
  finds all matching elements on the page, and extracts their `innerText`.
- Green highlight applied to all matched elements using `requestAnimationFrame` batches of 20
  to avoid blocking the main thread.
- Results preview panel in the popup: shows item count, CSS selector used, and a scrollable
  list of up to 20 extracted text values.
- CSV export with RFC-4180 quoting (header row + one quoted field per line).
- JSON export as an array of `{ text }` objects.
- File download via `chrome.downloads` through the background service worker.
- `Escape` key stops scraping and removes all injected UI.
- `Ctrl/Cmd+Z` clears the current selection and re-enables element picking.
- Fixed top-right banner with pulsing dot, Open Selection (view in-page results),
  Reselect (clear and pick again), and inline Stop buttons injected into the active tab.
- Pill toast notification at the bottom of the page with extracted item count.
- Double-injection guard via `window.__localScrapeActive`.
- Popup state restoration via `LS_PING`: reopening the popup after a selection shows
  the results immediately without re-scraping.
- Premium dark glassmorphism popup UI with gradient buttons and animated status badge.
- No-op callbacks on all `chrome.runtime.sendMessage` calls to suppress unchecked
  `lastError` errors when the popup is closed.
- MIT License. Copyright SajadTroy 2026.
- GitHub Sponsors support via `.github/FUNDING.yml`.
