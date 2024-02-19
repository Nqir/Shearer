
document.addEventListener('DOMContentLoaded', () => {
    const selectionDropdown = document.getElementById('floatingSelect') as HTMLSelectElement;
    const scrapeButton = document.getElementById('scrapeButton') as HTMLButtonElement;
    const copyButton = document.getElementById('copyButton') as HTMLButtonElement;

    updateJSONLabel();

    selectionDropdown.addEventListener('change', () => {
        updateJSONLabel();
    });

    scrapeButton.addEventListener('click', () => {
        if (selectionDropdown.selectedIndex === 0) {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                tabs.forEach(tab => updateOutput(tab.title));
                const res: {data: FormatClass} = await chrome.tabs.sendMessage(tabs[0].id, { action: 'jsonifyClass' });
                if (res && res.data) {
                    updateOutput(JSON.stringify(res.data, null, 3));
                } else {
                    updateOutput('No data found');
                }
            });
            return;
        }

        if (selectionDropdown.selectedIndex === 2) {
            chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
                tabs.forEach(tab => updateOutput(tab.title));
                const res: {data: FormatInterface} = await chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeInterface' });
                if (res && res.data) {
                    updateOutput(JSON.stringify(res.data, null, 3));
                } else {
                    updateOutput('No data found');
                }
            });
            return;
        }
    });

    copyButton.addEventListener('click', () => {
        const outputTextArea = document.getElementById('scrapeOutput') as HTMLTextAreaElement;
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

const setJSONLabel = (newLabel: string) => {
    const label = document.getElementById('jsonLabel') as HTMLLabelElement;
    label.textContent = `${newLabel} - JSON Output:`;
    updateOutput(''); // clear output
};

const updateJSONLabel = () => {
    const selectionDropdown = document.getElementById('floatingSelect') as HTMLSelectElement;
    const selectedFormat = selectionDropdown.options[selectionDropdown.selectedIndex].text;
    setJSONLabel(selectedFormat);
};

const updateOutput = (output: string) => {
    const outputTextArea = document.getElementById('scrapeOutput') as HTMLTextAreaElement;
    outputTextArea.value = output;
};
