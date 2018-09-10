chrome.tabs.onUpdated.addListener(function listener(tabId, changedProps) {
    var event = new CustomEvent('vklastfmext', {'change': changedProps});

    window.dispatchEvent(event)

    console.log('d', document);
    console.log('w', window);
});