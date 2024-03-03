
document.addEventListener('DOMContentLoaded', () => {
    const selectionDropdown = getElementById<HTMLSelectElement>('floatingSelect');
    const scrapeButton = getElementById<HTMLButtonElement>('scrapeButton');
    const copyButton = getElementById<HTMLButtonElement>('copyButton');

    updateJSONFormat();

    selectionDropdown.addEventListener('change', updateJSONFormat);
    scrapeButton.addEventListener('click', handleScrape);
    copyButton.addEventListener('click', handleCopy);
});

async function handleScrape() {
    const formatSelection = getElementById<HTMLSelectElement>('floatingSelect');
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
        updateOutput('Invalid selection')
        return;
    }

    try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true});

        if (tabs.length === 0) {
            updateOutput('No active tab found');
            return;
        }

        const tab = tabs[0];
        const res: { data: JSONFormat } = await chrome.tabs.sendMessage(tab.id, { action });

        if (res && res.data) {
            updateOutput(JSON.stringify(res.data, null, 3));
            toggleButtonIcon(getElementById('scrapeButton'), "check.png", "scrape");
            return;
        } else {
            updateOutput('No data found');
            return;
        }
    } catch (error) {
        console.error('Error during scrape', error);
        updateOutput('Error during scrape');
    }
}

function handleCopy() {
    const copyButton = getElementById<HTMLButtonElement>('copyButton');
    const outputTextArea = getElementById<HTMLTextAreaElement>("scrapeOutput");
    if (outputTextArea.value) {
        outputTextArea.select();
        navigator.clipboard.writeText(outputTextArea.value).then(() => {
            toggleButtonIcon(copyButton, "check.png", "copy");
        });
    }
}

function toggleButtonIcon(button: HTMLButtonElement, src: string, alt: string) {
    const img = button.querySelector('img') as HTMLImageElement;
    const oldSrc = img.src;
    const oldAlt = img.alt;

    img.src = `../images/${src}`;
    img.alt = alt;

    setTimeout(() => {
        img.src = oldSrc;
        img.alt = oldAlt;
    }, 2000);
}

function setJSONFormat(newLabel: string) {
    const label = getElementById<HTMLLabelElement>('jsonLabel');
    label.textContent = `JSON Output: ${newLabel}`;
    updateOutput(''); // clear output
};

function updateJSONFormat() {
    const selectionDropdown = getElementById<HTMLSelectElement>('floatingSelect');
    const selectedFormat = selectionDropdown.options[selectionDropdown.selectedIndex].text;
    setJSONFormat(selectedFormat);
};

function updateOutput(output: string) {
    const outputTextArea = getElementById<HTMLTextAreaElement>('scrapeOutput');
    outputTextArea.value = output;
};

function getElementById<T extends HTMLElement>(id: string): T {
    return document.getElementById(id) as T;
}