document.addEventListener('DOMContentLoaded', () => {
    const selectionDropdown = getElementById('floatingSelect');
    const scrapeButton = getElementById('scrapeButton');
    const copyButton = getElementById('copyButton');
    updateJSONFormat();
    selectionDropdown.addEventListener('change', updateJSONFormat);
    scrapeButton.addEventListener('click', handleScrape);
    copyButton.addEventListener('click', handleCopy);
});
async function handleScrape() {
    const formatSelection = getElementById('floatingSelect');
    const selectedJSONFormat = formatSelection.selectedIndex;
    const actionMap = {
        0: 'parseEnum',
        1: 'parseClass',
        2: 'parseInterface',
        3: 'parseObject',
        4: 'parseConstant'
    };
    const action = actionMap[selectedJSONFormat];
    if (!action) {
        updateOutput('Invalid selection');
        return;
    }
    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs.length === 0) {
            updateOutput('No active tab found');
            return;
        }
        const tab = tabs[0];
        const res = await chrome.tabs.sendMessage(tab.id, { action });
        if (res && res.data) {
            updateOutput(JSON.stringify(res.data, null, 3));
            toggleButtonIcon(getElementById('scrapeButton'), "check.png", "scrape");
            return;
        }
        else {
            updateOutput('No data found');
            return;
        }
    }
    catch (error) {
        console.error('Error during scrape', error);
        updateOutput('Error during scrape');
    }
}
function handleCopy() {
    const copyButton = getElementById('copyButton');
    const outputTextArea = getElementById("scrapeOutput");
    if (outputTextArea.value) {
        outputTextArea.select();
        navigator.clipboard.writeText(outputTextArea.value).then(() => {
            toggleButtonIcon(copyButton, "check.png", "copy");
        });
    }
}
function toggleButtonIcon(button, src, alt) {
    const img = button.querySelector('img');
    const oldSrc = img.src;
    const oldAlt = img.alt;
    img.src = `../images/${src}`;
    img.alt = alt;
    setTimeout(() => {
        img.src = oldSrc;
        img.alt = oldAlt;
    }, 2000);
}
function setJSONFormat(newLabel) {
    const label = getElementById('jsonLabel');
    label.textContent = `JSON Output: ${newLabel}`;
    updateOutput(''); // clear output
}
;
function updateJSONFormat() {
    const selectionDropdown = getElementById('floatingSelect');
    const selectedFormat = selectionDropdown.options[selectionDropdown.selectedIndex].text;
    setJSONFormat(selectedFormat);
}
;
function updateOutput(output) {
    const outputTextArea = getElementById('scrapeOutput');
    outputTextArea.value = output;
}
;
function getElementById(id) {
    return document.getElementById(id);
}
