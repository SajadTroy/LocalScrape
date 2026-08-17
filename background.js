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
    return true;
  }
});
