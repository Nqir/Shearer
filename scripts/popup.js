document.addEventListener('DOMContentLoaded', () => {
    const selectionDropdown = document.getElementById('floatingSelect');
    const scrapeButton = document.getElementById('scrapeButton');
    const copyButton = document.getElementById('copyButton');
    updateJSONLabel();
    selectionDropdown.addEventListener('change', () => {
        updateJSONLabel();
    });
    scrapeButton.addEventListener('click', () => {
        if (selectionDropdown.selectedIndex === 0) {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                tabs.forEach(tab => updateOutput(tab.title));
                const res = await chrome.tabs.sendMessage(tabs[0].id, { action: 'jsonifyClass' });
                if (res && res.data) {
                    updateOutput(JSON.stringify(res.data, null, 3));
                }
                else {
                    updateOutput('No data found');
                }
            });
            return;
        }
        if (selectionDropdown.selectedIndex === 2) {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                tabs.forEach(tab => updateOutput(tab.title));
                const res = await chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeInterface' });
                if (res && res.data) {
                    updateOutput(JSON.stringify(res.data, null, 3));
                }
                else {
                    updateOutput('No data found');
                }
            });
            return;
        }
    });
    copyButton.addEventListener('click', () => {
        const outputTextArea = document.getElementById('scrapeOutput');
        if (outputTextArea.value) {
            outputTextArea.select();
            navigator.clipboard.writeText(outputTextArea.value).then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    copyButton.textContent = 'Copy';
                }, 2000);
            });
        }
    });
});
const setJSONLabel = (newLabel) => {
    const label = document.getElementById('jsonLabel');
    label.textContent = `${newLabel} - JSON Output:`;
    updateOutput(''); // clear output
};
const updateJSONLabel = () => {
    const selectionDropdown = document.getElementById('floatingSelect');
    const selectedFormat = selectionDropdown.options[selectionDropdown.selectedIndex].text;
    setJSONLabel(selectedFormat);
};
const updateOutput = (output) => {
    const outputTextArea = document.getElementById('scrapeOutput');
    outputTextArea.value = output;
};
