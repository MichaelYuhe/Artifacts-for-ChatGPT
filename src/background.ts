console.log("Hello from Background!");

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      console.log(
        `Storage key "${key}" changed. Old value was "${oldValue}", new value is "${newValue}".`
      );

      chrome.runtime.sendMessage({ key, newValue });
    }
  }
});
