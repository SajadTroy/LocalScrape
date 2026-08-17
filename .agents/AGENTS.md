# Project Rules

## Agent Behavior

- **Never push or commit to git automatically**. You may write code and modify files, but never execute `git commit` or `git push`. The user will handle all version control manually.
- **Maintain AGENTS.md**: Whenever you create, update, rename, or delete files and folders in the project, you must immediately update the `Project Structure` and `File Responsibilities` sections in `.agents/AGENTS.md` to accurately reflect those changes.

## Code Style

- Never include comments in any code file. No inline comments, no block comments, no JSDoc.
- All code must be formatted with proper spacing and blank lines between logical sections, functions, and blocks.
- Use 2-space indentation for all JavaScript, JSON, HTML, and CSS files.
- Leave one blank line between function declarations.
- Leave one blank line between distinct logical sections within a function.
- Opening braces stay on the same line as the declaration.
- Always use `async`/`await`. Never use `.then()` chains.

## Manifest V3 Rules

- Always use `manifest_version: 3`. Never generate Manifest V2 patterns.
- Use `background.service_worker` not `background.scripts`.
- Use `chrome.action` not `chrome.browserAction`.
- Use `chrome.scripting.executeScript` not `chrome.tabs.executeScript`.
- `host_permissions` is separate from `permissions`.
- No inline `<script>` tags in HTML. Always use `<script src="file.js">`.
- No inline event handlers in HTML. Always use `addEventListener`.

---

## Project Structure

```
LocalScrape/
├── .agents/
│   └── AGENTS.md            # Project rules, structure reference, and file responsibilities for AI agents.
├── .github/
│   └── FUNDING.yml          # GitHub Sponsors configuration — links to SajadTroy's sponsor page.
├── icons/
│   ├── icon16.png           # 16x16 extension icon used in the browser toolbar.
│   ├── icon48.png           # 48x48 extension icon used in chrome://extensions/.
│   └── icon128.png          # 128x128 icon used in the Chrome Web Store listing.
├── background.js            # Service worker. Listens for DOWNLOAD_FILE messages from the popup
│                            # and calls chrome.downloads.download to save CSV or JSON files locally.
├── manifest.json            # Manifest V3 configuration. Declares name, permissions, icons,
│                            # and background service worker.
├── scraper.css              # Injected into the active tab. Provides namespaced .ls-* styles for the
│                            # blue hover outline, green selected outline, toast pill, and active banner.
├── scraper.js               # Injected into the active tab. Handles mouseover highlight, click-to-extract,
│                            # CSS selector building, similar-element matching, text extraction,
│                            # rAF-batched DOM updates, Escape / Ctrl+Z keyboard shortcuts,
│                            # double-injection guard, and LS_PING / LS_STOP message handling.
├── .gitignore               # Excludes OS files, editor configs, packed artifacts, and zip bundles.
├── CHANGELOG.md             # Version history documenting all notable changes to the extension.
├── LICENSE                  # MIT License. Copyright SajadTroy 2026.
└── README.md                # Project documentation. Covers features, installation, usage,
                             # permissions, privacy policy, and GitHub Sponsors badge.
```

## File Responsibilities

### `manifest.json`
Declares all extension metadata. If you add a new chrome.* API, add the required permission here first.
Permissions currently in use:

- `activeTab` — grants temporary access to the current tab when the user triggers the extension popup.
- `scripting` — allows `chrome.scripting.executeScript` and `chrome.scripting.insertCSS` to inject `scraper.js` and `scraper.css`.
- `downloads` — allows `chrome.downloads.download` in the service worker to save CSV and JSON files.
- `tabs` — allows `chrome.tabs.create` in `popup.js` to open the GitHub Sponsors page in a new tab.

### `background.js`
The extension's service worker. Must store no state in global variables (service workers are ephemeral).
Responsibilities:
- Listens for `chrome.action.onClicked`.
- Uses `chrome.scripting.insertCSS` and `chrome.scripting.executeScript` to inject `scraper.css` and `scraper.js` into the active tab.
- Listens for `DOWNLOAD_FILE` messages from `scraper.js`.
- Calls `chrome.downloads.download` with the provided `dataUrl` and `filename`.
- Sends a `{ success }` response back to the caller.
Uses `window.__localScrapeActive` as a double-injection guard.
Responsibilities:
- Attaches `mouseover`, `mouseout`, `click`, and `keydown` listeners in capture phase for page-wide coverage.
- On hover: adds `.ls-hover-highlight` to the target element.
- On click: calls `buildSelector()` to derive a `tag.class1.class2` selector, runs `document.querySelectorAll` to find all matching elements, extracts and normalises their `innerText`, sets `isDone = true` **before** calling `chrome.runtime.sendMessage` (critical: prevents unchecked `lastError` from aborting the handler mid-flight), highlights all matched elements with `.ls-selected-highlight` using `requestAnimationFrame` batches of 20, and dispatches an `LS_DATA` message with a no-op callback to suppress the "Receiving end does not exist" error when the popup is closed.
- Shows a fixed banner with a pulsing dot and inline Stop button.
- Shows a pill toast with the extracted item count.
- `Escape` key triggers full cleanup and removal of all injected UI.
- `Ctrl/Cmd+Z` clears the current selection and re-enables picking.
- Responds to `LS_PING` (returns status + data) and `LS_STOP` (runs cleanup) from `popup.js`.

### `scraper.css`
Injected alongside `scraper.js`. All selectors are namespaced with `.ls-` to avoid conflicts with page styles.
Defines:
- `.ls-hover-highlight` — blue `outline` + transparent blue `background-color`.
- `.ls-selected-highlight` — green `outline` + transparent green `background-color`.
- `#ls-toast` — fixed pill notification at the bottom of the viewport with glassmorphism styling.
- `#ls-banner` — fixed top-right panel showing scraping status, a pulsing dot, and a Stop button.

### `icons/`
Contains the three required PNG icon sizes generated by a Python/Pillow script.
The icon is a deep blue rounded rectangle with a 2x2 grid of white rounded squares.
Regenerate all three sizes together whenever the icon design changes — never update one size in isolation.
