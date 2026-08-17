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
