chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ['scraper.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['scraper.js']
    });
  } catch (err) {
    console.error('LocalScrape: Could not inject scraper', err);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DOWNLOAD_FILE') {
    (async () => {
      try {
        const { dataUrl, filename } = message;
        await chrome.downloads.download({ url: dataUrl, filename, saveAs: false });
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
  } else if (message.type === 'OPEN_SPONSOR') {
    chrome.tabs.create({ url: 'https://github.com/sponsors/SajadTroy' });
    sendResponse({ success: true });
    return true;
  }
});

function isRestrictedUrl(url) {
  if (!url) return false;
  return url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com/');
}

function updateActionState(tabId, url) {
  chrome.action.setPopup({
    tabId: tabId,
    popup: isRestrictedUrl(url) ? 'error.html' : ''
  });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        updateActionState(tab.id, tab.url);
      }
    }
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id && tab.url) {
        updateActionState(tab.id, tab.url);
      }
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || tab.url) {
    updateActionState(tabId, tab.url);
  }
});
