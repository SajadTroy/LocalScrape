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
    return el.id === 'ls-toast' || el.id === 'ls-banner' || el.closest?.('#ls-toast, #ls-banner');
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
      const matches = Array.from(document.querySelectorAll(selector));
      return { selector, elements: matches };
    } catch (_) {
      const parent   = el.parentElement || document.body;
      const siblings = Array.from(parent.querySelectorAll(el.tagName.toLowerCase()));
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
      <span>LocalScrape active — click any element</span>
      <button class="ls-stop-btn" id="ls-stop-btn">Stop</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('ls-stop-btn').addEventListener('click', () => {
      cleanup();
    });
  }

  function removeBanner() {
    document.getElementById('ls-banner')?.remove();
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
    if (isDone) return;
    const el = e.target;
    if (isOwnElement(el)) return;

    e.preventDefault();
    e.stopPropagation();

    const { selector, elements } = findSimilarElements(el);

    scrapedData = elements
      .map(extractText)
      .filter(t => t.length > 0);

    isDone = true;

    applySelected(elements);

    const count = scrapedData.length;
    showToast(
      `<span class="ls-toast-count">${count}</span> element${count !== 1 ? 's' : ''} found — open LocalScrape to download`,
      4000
    );

    const banner = document.getElementById('ls-banner');
    if (banner) {
      banner.querySelector('span').textContent =
        `${count} item${count !== 1 ? 's' : ''} ready — open extension to download`;
    }

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
        isDone = false;
        clearAllHighlights();
        scrapedData = [];
        const banner = document.getElementById('ls-banner');
        if (banner) {
          banner.querySelector('span').textContent = 'LocalScrape active — click any element';
        }
        showToast('Selection cleared — pick a new element', 2000);
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
