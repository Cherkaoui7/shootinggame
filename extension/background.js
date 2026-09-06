/* Opens the game in its own tab when the toolbar icon is clicked.
   No special permissions required: opening a tab does not need "tabs". */
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
