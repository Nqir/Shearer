chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'scrape') {
        sendResponse({ data: scrapeClass() });
    }
    return true;
});
const scrapeClass = () => {
    const contentElement = document.querySelector('div.content');
    const sections = Array.from(contentElement.querySelectorAll('div.heading-wrapper[data-heading-level="h2"]'));
    let data = {
        className: filterWords(contentElement.querySelector('h1').textContent, { wordsToFilter: ['Class'] }),
        classDescription: contentElement.querySelector('p').textContent.trim(),
        classProperties: [],
        classMethods: [],
        classConstants: [],
        exampleCodes: []
    };
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent;
        if (sectionTitle?.includes('Properties')) {
            data.classProperties = extractClassProperties(section);
        }
        if (sectionTitle?.includes('Methods')) {
            data.classMethods = extractMethods(section);
        }
        if (sectionTitle?.includes('Extends')) {
            const extendsClasses = extractExtends(section).join(', ');
            data.classDescription += ` Extends: ${extendsClasses}.`;
        }
        if (sectionTitle?.includes(`Classes that extend ${data.className}`)) {
            const extendsClasses = extractExtends(section).join(', ');
            data.classDescription += ` Classes that extend ${data.className}: ${extendsClasses}.`;
        }
        if (sectionTitle.includes('Constants')) {
            data.classConstants = extractConstants(section);
        }
    });
    data.exampleCodes = extractExampleCodes();
    return data;
};
const extractExtends = (startSection) => {
    const extendsArray = [];
    // Starts from the next element after the 'Extends' section
    let nextElement = startSection.nextElementSibling;
    while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h2"]')) {
        if (nextElement.matches('ul')) {
            const extendsList = Array.from(nextElement.querySelectorAll('li'));
            extendsList.forEach((extend) => {
                extendsArray.push(extend.textContent ?? 'No extends found.');
            });
        }
        nextElement = nextElement?.nextElementSibling;
    }
    return extendsArray;
};
const extractClassProperties = (startSection) => {
    const properties = [];
    // Starts from the next element after the 'Properties' section
    let nextElement = startSection.nextElementSibling;
    while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h2"]')) {
        if (nextElement.matches('div.heading-wrapper[data-heading-level="h3"]')) {
            let propertyName = nextElement.querySelector('h3').textContent;
            let propertyDescription = [];
            let element = nextElement?.nextElementSibling;
            while (element && !element.matches('div.heading-wrapper[data-heading-level="h3"]')) {
                if (element.matches('p') && element.textContent) {
                    propertyDescription.push(element.textContent);
                }
                if (element && element.matches('div.alert.is-warning')) {
                    propertyDescription.push(element.textContent);
                }
                element = element?.nextElementSibling;
            }
            properties.push({ name: propertyName, description: cleanTextContent(propertyDescription.join('\n').toString()) });
        }
        nextElement = nextElement?.nextElementSibling;
    }
    return properties;
};
const extractMethods = (startSection) => {
    const methods = [];
    // Starts from the next element after the 'Methods' section
    let nextElement = startSection.nextElementSibling;
    while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h2"]')) {
        if (nextElement.matches('div.heading-wrapper[data-heading-level="h3"]')) {
            const methodName = nextElement.querySelector('h3').innerText;
            const methodDescription = [];
            const parameterArray = [];
            const alerts = ["is-primary", "is-warning"];
            let element = nextElement.nextElementSibling;
            while (element && !element.matches('div.heading-wrapper[data-heading-level="h3"]')) {
                // Description
                if (element.matches('p') && element.textContent) {
                    methodDescription.push(element.textContent);
                }
                if (element.matches('ul') &&
                    element.previousElementSibling.matches('p')) {
                    const description = Array.from(element.querySelectorAll('li'));
                    description.forEach(description => {
                        methodDescription.push(description.textContent);
                    });
                }
                // Parameters
                if (element.matches('ul') &&
                    element.previousElementSibling?.matches('div.heading-wrapper[data-heading-level="h4"]') &&
                    element.previousElementSibling?.querySelector('h4').textContent.includes('Parameters')) {
                    let parameterList = Array.from(element.querySelectorAll('li'));
                    parameterList.forEach(parameter => {
                        let parameterElements = Array.from(parameter.querySelectorAll('p'));
                        // Has parameter description (two `p` elements after 'Parameter' `h2`)
                        if (parameterElements.length === 2) {
                            let parameterName = parameterElements[0]?.textContent ?? 'Parameter name not found.';
                            let parameterDescription = parameterElements[1]?.textContent ?? 'Parameter description not found.';
                            parameterArray.push({ name: parameterName, description: cleanTextContent(parameterDescription) });
                            return;
                        }
                        parameterArray.push({ name: parameter.textContent, description: 'No description.' });
                    });
                }
                // Returns
                if (element && element.matches('div.heading-wrapper[data-heading-level="h4"]') &&
                    element.querySelector('h4').textContent.includes('Returns')) {
                    methodDescription.push(element.textContent);
                }
                // Alerts
                alerts.forEach(alert => {
                    if (element && element.matches(`div.alert.${alert}`)) {
                        methodDescription.push(element.textContent);
                    }
                });
                element = element?.nextElementSibling;
            }
            methods.push({
                name: methodName,
                description: cleanTextContent(methodDescription.join('\n').toString()),
                parameters: parameterArray
            });
        }
        nextElement = nextElement?.nextElementSibling;
    }
    return methods;
};
const extractConstants = (startSection) => {
    const constants = [];
    // Starts from the next element after the 'Constants' section
    let nextElement = startSection.nextElementSibling;
    while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h2"]')) {
        if (nextElement.matches('div.heading-wrapper[data-heading-level="h3"]')) {
            const constantName = nextElement.querySelector('h3').textContent;
            const constantDescription = nextElement.nextElementSibling.textContent ?? 'No description found.';
            constants.push({ name: constantName, description: constantDescription });
        }
        nextElement = nextElement?.nextElementSibling;
    }
    return constants;
};
const extractExampleCodes = () => {
    const exampleCodes = [];
    const exampleSections = Array.from(document.querySelectorAll('div.content div.heading-wrapper[data-heading-level="h4"]'));
    exampleSections.forEach((section) => {
        const heading = section.querySelector('h4');
        if (heading && heading.textContent && heading.textContent.includes('Examples')) {
            let nextElement = section.nextElementSibling;
            let codeName = "";
            let code = "";
            while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h4"]')) {
                if (nextElement.matches('div.heading-wrapper[data-heading-level="h5"]')) {
                    codeName = nextElement.querySelector('h5')?.textContent ?? "";
                }
                if (nextElement.matches('pre')) {
                    code = cleanTextContent(nextElement.textContent) ?? "";
                }
                nextElement = nextElement.nextElementSibling;
            }
            const newExampleCode = { codeName, code };
            const isDuplicate = exampleCodes.some(exampleCode => exampleCode.codeName === newExampleCode.codeName && exampleCode.code === newExampleCode.code);
            if (!isDuplicate) {
                exampleCodes.push(newExampleCode);
            }
        }
    });
    return exampleCodes;
};
const filterWords = (text, options) => {
    let filterRegex = new RegExp('\\b(' + options.wordsToFilter.join('|') + ')\\b', 'gi');
    return text.replace(filterRegex, '').trim();
};
// Removes extra `\n` from text content
const cleanTextContent = (text) => {
    return text.replace(/\n\s*\n/g, '\n');
};
