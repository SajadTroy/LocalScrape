'use strict';

const btnStart        = document.getElementById('btn-start');
const btnStop         = document.getElementById('btn-stop');
const btnDownload     = document.getElementById('btn-download');
const btnClear        = document.getElementById('btn-clear');
const btnCsv          = document.getElementById('btn-csv');
const btnJson         = document.getElementById('btn-json');
const statusBadge     = document.getElementById('status-badge');
const instructCard    = document.getElementById('instructions-card');
const resultsCard     = document.getElementById('results-card');
const resultsCount    = document.getElementById('results-count');
const resultsSelector = document.getElementById('results-selector');
const resultsPreview  = document.getElementById('results-preview');
const exportSection   = document.getElementById('export-section');

let selectedFormat = 'csv';
let scrapedData    = [];
let activeTabId    = null;

function setStatus(state) {
  statusBadge.className = `status-badge ${state}`;
  const labels = { idle: 'Idle', active: 'Scraping…', done: 'Ready' };
  statusBadge.textContent = labels[state] ?? state;
}

function showBtn(btn) { btn.classList.remove('hidden'); }
function hideBtn(btn) { btn.classList.add('hidden'); }

function resetUI() {
  setStatus('idle');
  instructCard.classList.remove('hidden');
  resultsCard.classList.add('hidden');
  exportSection.classList.add('hidden');
  showBtn(btnStart);
  hideBtn(btnStop);
  hideBtn(btnDownload);
  hideBtn(btnClear);
  scrapedData = [];
  resultsPreview.innerHTML = '';
}

function renderResults(data, selector) {
  scrapedData = data;
  const count = data.length;
  resultsCount.textContent = `${count} item${count !== 1 ? 's' : ''} found`;
  resultsSelector.textContent = selector || '—';

  resultsPreview.innerHTML = '';
  const previewItems = data.slice(0, 20);
  previewItems.forEach(text => {
    const div = document.createElement('div');
    div.className = 'preview-item';
    div.textContent = text.trim().slice(0, 80) || '(empty)';
    div.title = text.trim();
    resultsPreview.appendChild(div);
  });

  if (data.length > 20) {
    const more = document.createElement('div');
    more.className = 'preview-item';
    more.textContent = `… and ${data.length - 20} more`;
    more.style.color = 'var(--text-muted)';
    resultsPreview.appendChild(more);
  }

  instructCard.classList.add('hidden');
  resultsCard.classList.remove('hidden');
  exportSection.classList.remove('hidden');

  setStatus('done');
  hideBtn(btnStop);
  showBtn(btnDownload);
  showBtn(btnClear);
  hideBtn(btnStart);
}

btnCsv.addEventListener('click', () => {
  selectedFormat = 'csv';
  btnCsv.classList.add('active');
  btnCsv.setAttribute('aria-pressed', 'true');
  btnJson.classList.remove('active');
  btnJson.setAttribute('aria-pressed', 'false');
});

btnJson.addEventListener('click', () => {
  selectedFormat = 'json';
  btnJson.classList.add('active');
  btnJson.setAttribute('aria-pressed', 'true');
  btnCsv.classList.remove('active');
  btnCsv.setAttribute('aria-pressed', 'false');
});

btnStart.addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    activeTabId = tab.id;

    await chrome.scripting.insertCSS({
      target: { tabId: activeTabId },
      files: ['scraper.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId: activeTabId },
      files: ['scraper.js']
    });

    setStatus('active');
    hideBtn(btnStart);
    showBtn(btnStop);

    window.close();
  } catch (err) {
    alert('Could not inject scraper on this page.\nTry on a regular website (not a Chrome internal page).');
  }
});

btnStop.addEventListener('click', async () => {
  if (!activeTabId) return;
  try {
    await chrome.tabs.sendMessage(activeTabId, { type: 'LS_STOP' });
  } catch (_) {}
  resetUI();
});

btnDownload.addEventListener('click', async () => {
  if (!scrapedData.length) return;

  let content, mimeType, ext;

  if (selectedFormat === 'csv') {
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
  };

  reader.readAsDataURL(blob);
});

btnClear.addEventListener('click', () => resetUI());

document.getElementById('btn-sponsor').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: 'https://github.com/sponsors/SajadTroy' });
});


chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LS_DATA') {
    renderResults(message.data, message.selector);
  }
  if (message.type === 'LS_SCRAPING_ACTIVE') {
    setStatus('active');
    hideBtn(btnStart);
    showBtn(btnStop);
    instructCard.classList.add('hidden');
  }
});

(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  activeTabId = tab.id;

  chrome.tabs.sendMessage(activeTabId, { type: 'LS_PING' }, (response) => {
    if (chrome.runtime.lastError) return;
    if (response?.status === 'active') {
      setStatus('active');
      hideBtn(btnStart);
      showBtn(btnStop);
      instructCard.classList.add('hidden');
    } else if (response?.status === 'done' && response?.data?.length) {
      renderResults(response.data, response.selector);
    }
  });
})();
