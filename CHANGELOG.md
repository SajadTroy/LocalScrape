# Changelog

All notable changes to **LocalScrape** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
