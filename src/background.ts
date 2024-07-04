// @ts-ignore
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error: any) => console.error(error));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      chrome.runtime.sendMessage({ key, newValue });
    }
  }
});
