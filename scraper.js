'use strict';

if (window.__localScrapeActive) {
  chrome.runtime.sendMessage({ type: 'LS_SCRAPING_ACTIVE' }, () => void chrome.runtime.lastError);
} else {
  window.__localScrapeActive = true;
  initScraper();
}

function initScraper() {
  let hoveredEl    = null;
  let scrapedData  = [];
  let lastSelector = '';
  let isDone       = false;

  function isOwnElement(el) {
    return el.id === 'ls-toast'
      || el.id === 'ls-banner'
      || el.id === 'ls-panel'
      || el.closest?.('#ls-toast, #ls-banner, #ls-panel');
  }

  function buildSelector(el) {
    const tag = el.tagName.toLowerCase();

    const classes = Array.from(el.classList)
      .filter(c => c.length > 1 && !c.startsWith('ls-'))
      .slice(0, 3);

    if (classes.length > 0) {
      return `${tag}.${classes.join('.')}`;
    }

    return tag;
  }

  function findSimilarElements(el) {
    const selector = buildSelector(el);
    lastSelector   = selector;

    try {
      const matches = Array.from(document.querySelectorAll(selector))
        .filter(match => !isOwnElement(match));
      return { selector, elements: matches };
    } catch (_) {
      const parent   = el.parentElement || document.body;
      const siblings = Array.from(parent.querySelectorAll(el.tagName.toLowerCase()))
        .filter(match => !isOwnElement(match));
      lastSelector   = el.tagName.toLowerCase();
      return { selector: el.tagName.toLowerCase(), elements: siblings };
    }
  }

  function extractText(el) {
    const raw = (el.innerText ?? el.textContent ?? '').trim();
    return raw.replace(/\s+/g, ' ');
  }

  function showToast(html, duration = 2800) {
    let toast = document.getElementById('ls-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ls-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = html;
    toast.classList.add('ls-toast-show');
    clearTimeout(toast.__timer);
    toast.__timer = setTimeout(() => {
      toast.classList.remove('ls-toast-show');
    }, duration);
  }

  function createBanner() {
    if (document.getElementById('ls-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'ls-banner';
    banner.innerHTML = `
      <div class="ls-dot"></div>
      <span class="ls-banner-text">Click any Element</span>
      <div class="ls-banner-actions">
        <button class="ls-cancel-btn" id="ls-cancel-btn">Cancel</button>
      </div>
    `;
    document.body.appendChild(banner);

    document.getElementById('ls-cancel-btn').addEventListener('click', () => {
      cleanup();
    });
  }

  function updateBannerDone(count) {
    const banner = document.getElementById('ls-banner');
    if (!banner) return;

    banner.querySelector('.ls-banner-text').textContent =
      `${count} item${count !== 1 ? 's' : ''} ready`;

    banner.querySelector('.ls-banner-actions').innerHTML = `
      <button class="ls-action-btn ls-open-btn" id="ls-open-btn">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/>
          <path d="M4 6h4M6 4v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        Open Selection
      </button>
      <button class="ls-action-btn ls-reselect-btn" id="ls-reselect-btn">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 6a4 4 0 1 1 1.17 2.83" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          <path d="M2 9.5V6.5H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Reselect
      </button>
      <button class="ls-cancel-btn" id="ls-cancel-btn">Cancel</button>
    `;

    let isPanelOpen = false;
    document.getElementById('ls-open-btn').addEventListener('click', (e) => {
      isPanelOpen = !isPanelOpen;
      const btn = e.currentTarget;
      if (isPanelOpen) {
        btn.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 10L10 2M2 2l8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Close Selection
        `;
        showSelectionPanel(scrapedData, lastSelector);
      } else {
        btn.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/>
            <path d="M4 6h4M6 4v4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Open Selection
        `;
        hideSelectionPanel();
      }
    });

    document.getElementById('ls-reselect-btn').addEventListener('click', () => {
      triggerReselect();
    });

    document.getElementById('ls-cancel-btn').addEventListener('click', () => {
      cleanup();
    });
  }

  function removeBanner() {
    document.getElementById('ls-banner')?.remove();
  }

  function hideSelectionPanel() {
    const panel = document.getElementById('ls-panel');
    if (panel) {
      panel.classList.remove('ls-panel-visible');
      setTimeout(() => panel.remove(), 250);
    }
  }

  function triggerDownload(format) {
    if (!scrapedData.length) return;

    let content, mimeType, ext;

    if (format === 'csv') {
      const header = 'text\n';
      const rows   = scrapedData
        .map(t => `"${t.replace(/"/g, '""').replace(/\n/g, ' ').trim()}"`)
        .join('\n');
      content  = header + rows;
      mimeType = 'text/csv;charset=utf-8;';
      ext      = 'csv';
    } else {
      content  = JSON.stringify(scrapedData.map(t => ({ text: t.trim() })), null, 2);
      mimeType = 'application/json';
      ext      = 'json';
    }

    const blob   = new Blob([content], { type: mimeType });
    const reader = new FileReader();

    reader.onloadend = () => {
      const dataUrl   = reader.result;
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename  = `localscrape-${timestamp}.${ext}`;
      chrome.runtime.sendMessage({ type: 'DOWNLOAD_FILE', dataUrl, filename });
      showToast(`Downloading ${filename}...`, 2000);
    };

    reader.readAsDataURL(blob);
  }

  function showSelectionPanel(data, selector) {
    document.getElementById('ls-panel')?.remove();

    const panel = document.createElement('div');
    panel.id = 'ls-panel';

    const rows = data.slice(0, 50).map((text, i) => `
      <div class="ls-panel-row">
        <span class="ls-panel-index">${i + 1}</span>
        <span class="ls-panel-text" title="${text.replace(/"/g, '&quot;')}">${text.slice(0, 120)}</span>
      </div>
    `).join('');

    const overflow = data.length > 50
      ? `<div class="ls-panel-overflow">+ ${data.length - 50} more items</div>`
      : '';

    panel.innerHTML = `
      <div class="ls-panel-header">
        <div class="ls-panel-title">
          <strong>${data.length} item${data.length !== 1 ? 's' : ''}</strong>
          <span class="ls-panel-selector">${selector}</span>
        </div>
      </div>
      <div class="ls-panel-list">${rows}${overflow}</div>
      <div class="ls-panel-footer">
        <button class="ls-action-btn ls-sponsor-btn" id="ls-sponsor-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ea4aaa"/>
          </svg>
          Sponsor
        </button>
        <div style="flex-grow: 1;"></div>
        <div class="ls-btn-group">
          <button class="ls-action-btn" id="ls-copy-csv" title="Copy CSV to Clipboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="ls-action-btn ls-download-csv" id="ls-dl-csv">
            Download CSV
          </button>
        </div>
        <div class="ls-btn-group" style="margin-left: 8px;">
          <button class="ls-action-btn" id="ls-copy-json" title="Copy JSON to Clipboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="ls-action-btn ls-download-json" id="ls-dl-json">
            Download JSON
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);

    requestAnimationFrame(() => panel.classList.add('ls-panel-visible'));

    document.getElementById('ls-dl-csv').addEventListener('click', () => triggerDownload('csv'));
    document.getElementById('ls-dl-json').addEventListener('click', () => triggerDownload('json'));
    
    document.getElementById('ls-copy-csv').addEventListener('click', () => {
      const csvContent = scrapedData.map(text => `"${text.replace(/"/g, '""')}"`).join('\n');
      navigator.clipboard.writeText(csvContent).then(() => showToast('Copied CSV to clipboard', 2000));
    });
    
    document.getElementById('ls-copy-json').addEventListener('click', () => {
      const jsonContent = JSON.stringify(scrapedData.map(text => ({ text })), null, 2);
      navigator.clipboard.writeText(jsonContent).then(() => showToast('Copied JSON to clipboard', 2000));
    });

    document.getElementById('ls-sponsor-btn').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'OPEN_SPONSOR' }, () => void chrome.runtime.lastError);
    });
  }

  function triggerReselect() {
    isDone = false;
    clearAllHighlights();
    scrapedData = [];
    document.getElementById('ls-panel')?.remove();

    const banner = document.getElementById('ls-banner');
    if (banner) {
      banner.querySelector('.ls-banner-text').textContent = 'Click any Element';
      banner.querySelector('.ls-banner-actions').innerHTML = `
        <button class="ls-cancel-btn" id="ls-cancel-btn">Cancel</button>
      `;
      document.getElementById('ls-cancel-btn').addEventListener('click', () => cleanup());
    }

    showToast('Selection cleared — pick a new element', 2000);
  }

  function applyHover(el) {
    if (isOwnElement(el)) return;
    if (el.classList.contains('ls-selected-highlight')) return;
    el.classList.add('ls-hover-highlight');
    hoveredEl = el;
  }

  function removeHover(el) {
    el?.classList.remove('ls-hover-highlight');
    if (hoveredEl === el) hoveredEl = null;
  }

  function applySelected(elements) {
    const BATCH = 20;
    let i = 0;

    function applyBatch() {
      const slice = elements.slice(i, i + BATCH);
      slice.forEach(el => {
        el.classList.remove('ls-hover-highlight');
        el.classList.add('ls-selected-highlight');
      });
      i += BATCH;
      if (i < elements.length) requestAnimationFrame(applyBatch);
    }

    requestAnimationFrame(applyBatch);
  }

  function clearAllHighlights() {
    requestAnimationFrame(() => {
      document.querySelectorAll('.ls-hover-highlight').forEach(el => {
        el.classList.remove('ls-hover-highlight');
      });
      document.querySelectorAll('.ls-selected-highlight').forEach(el => {
        el.classList.remove('ls-selected-highlight');
      });
    });
  }

  function onMouseOver(e) {
    if (isDone) return;
    const el = e.target;
    if (isOwnElement(el)) return;

    if (hoveredEl && hoveredEl !== el) {
      removeHover(hoveredEl);
    }
    applyHover(el);
  }

  function onMouseOut(e) {
    if (isDone) return;
    removeHover(e.target);
  }

  function onClick(e) {
    const el = e.target;
    if (isOwnElement(el)) return;

    if (isDone) {
      e.preventDefault();
      e.stopPropagation();
      triggerReselect();
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const { selector, elements } = findSimilarElements(el);

    let rawData = elements
      .map(extractText)
      .filter(t => t.length > 0);
      
    scrapedData = [...new Set(rawData)];

    isDone = true;

    applySelected(elements);

    const count = scrapedData.length;
    showToast(
      `<span class="ls-toast-count">${count}</span> item${count !== 1 ? 's' : ''} extracted`,
      3500
    );

    updateBannerDone(count);

    chrome.runtime.sendMessage(
      { type: 'LS_DATA', data: scrapedData, selector },
      () => void chrome.runtime.lastError
    );
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      cleanup();
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      if (isDone) {
        triggerReselect();
      }
    }
  }

  function cleanup() {
    window.__localScrapeActive = false;
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout',  onMouseOut,  true);
    document.removeEventListener('click',     onClick,     true);
    document.removeEventListener('keydown',   onKeyDown,   true);
    clearAllHighlights();
    removeBanner();
    document.getElementById('ls-toast')?.remove();
    document.getElementById('ls-panel')?.remove();
    chrome.runtime.sendMessage({ type: 'LS_STOPPED' }, () => void chrome.runtime.lastError);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'LS_STOP') {
      cleanup();
      sendResponse({ ok: true });
    }

    if (message.type === 'LS_PING') {
      if (isDone && scrapedData.length > 0) {
        sendResponse({ status: 'done', data: scrapedData, selector: lastSelector });
      } else {
        sendResponse({ status: 'active' });
      }
    }
    return true;
  });

  document.addEventListener('mouseover', onMouseOver, true);
  document.addEventListener('mouseout',  onMouseOut,  true);
  document.addEventListener('click',     onClick,     true);
  document.addEventListener('keydown',   onKeyDown,   true);

  createBanner();
  showToast('LocalScrape ready — hover and click any element', 3000);
}
