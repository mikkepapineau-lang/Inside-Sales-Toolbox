'use strict';
// The toolbar click itself grants activeTab on this one tab only. The lab
// receives only the originating tab's numeric ID, never the page contents.
chrome.action.onClicked.addListener((tab) => {
  const suffix = Number.isInteger(tab?.id) ? `?sourceTabId=${tab.id}` : '';
  chrome.tabs.create({url:chrome.runtime.getURL(`lab.html${suffix}`)});
});
