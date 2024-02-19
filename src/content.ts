chrome.runtime.onMessage.addListener((request: {action: string}, sender, sendResponse: (message: {data: FormatClass | FormatInterface}) => void) => {
    if (request.action === 'jsonifyClass') {
        sendResponse({data: jsonifyClass()});
    }

    if (request.action === 'jsonifyInterface') {
        sendResponse({data: jsonifyInterface()});
    }

    return true;
});

const jsonifyClass = (): FormatClass => {
    const contentElement: HTMLDivElement = document.querySelector('div.content');
    const sections: Element[] = Array.from(contentElement.querySelectorAll('div.heading-wrapper[data-heading-level="h2"]'));

    let data: FormatClass = {
        className: filterWords(contentElement.querySelector('h1').textContent, {wordsToFilter: ['Class']}),
        classDescription: contentElement.querySelector('p').textContent.trim(),
        classProperties: [],
        classMethods: [],
        classConstants: [],
        exampleCodes: []
    };

    sections.forEach(section => {
        const sectionTitle: string = section.querySelector('h2').textContent;

        if (sectionTitle?.includes('Properties')) {
            data.classProperties = extractProperties(section);
        }
        
        if (sectionTitle?.includes('Methods')) {
            data.classMethods = extractMethods(section);
        }

        if (sectionTitle?.includes('Extends')) {
            const extendsClasses: string = extractExtends(section).join(', ');
            data.classDescription += ` Extends: ${extendsClasses}.`;
        }

        if (sectionTitle?.includes(`Classes that extend ${data.className}`)) {
            const extendsClasses: string = extractExtends(section).join(', ');
            data.classDescription += ` Classes that extend ${data.className}: ${extendsClasses}.`;
        }

        if (sectionTitle.includes('Constants')) {
            data.classConstants = extractConstants(section);
        }
    });

    data.exampleCodes = extractExampleCodes();

    return data;
}

const jsonifyInterface = (): FormatInterface => {
    const contentElement: HTMLDivElement = document.querySelector('div.content');
    const sections: Element[] = Array.from(contentElement.querySelectorAll('div.heading-wrapper[data-heading-level="h2"]'));

    let data: FormatInterface = {
        interfaceName: filterWords(contentElement.querySelector('h1').textContent, {wordsToFilter: ['Interface']}),
        interfaceDescription: contentElement.querySelector('p').textContent.trim(),
        interfaceProperties: [],
        exampleCodes: []
    };

    sections.forEach(section => {
        const sectionTitle: string = section.querySelector('h2').textContent;

        if (sectionTitle?.includes('Properties')) {
            data.interfaceProperties = extractProperties(section);
        }
    });

    data.exampleCodes = extractExampleCodes();

    return data;
};

const extractExtends = (startSection: Element): string[] => {
    const extendsArray: string[] = [];

    // Starts from the next element after the 'Extends' section
    let nextElement: Element = startSection.nextElementSibling;

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
}

const extractProperties = (startSection: Element) => {
    const properties: _Property[] = [];

    // Starts from the next element after the 'Properties' section
    let nextElement: Element = startSection.nextElementSibling;

    while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h2"]')) {

        if (nextElement.matches('div.heading-wrapper[data-heading-level="h3"]')) {
            let propertyName: string =  nextElement.querySelector('h3').textContent;
            let propertyDescription: string[] = [];

            let element: Element = nextElement?.nextElementSibling;

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
}

const extractMethods = (startSection: Element): _Function[] => {
    const methods: _Function[] = [];

    // Starts from the next element after the 'Methods' section
    let nextElement: Element = startSection.nextElementSibling;
    
    while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h2"]')) {

        if (nextElement.matches('div.heading-wrapper[data-heading-level="h3"]')) {
            const methodName: string =  nextElement.querySelector('h3').innerText;
            const methodDescription: string[] = [];
            const parameterArray: Parameter[] = [];
            const alerts: string[] = ["is-primary", "is-warning"];

            let element: Element = nextElement.nextElementSibling;

            while (element && !element.matches('div.heading-wrapper[data-heading-level="h3"]')) {
                // Description
                if (element.matches('p') && element.textContent) {
                    methodDescription.push(element.textContent);
                }

                if (element.matches('ul') &&
                    element.previousElementSibling.matches('p')) {
                    const description: HTMLLIElement[] = Array.from(element.querySelectorAll('li'));

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
                        let parameterElements: HTMLParagraphElement[] = Array.from(parameter.querySelectorAll('p'));

                        // Has parameter description (two `p` elements after 'Parameter' `h2`)
                        if (parameterElements.length === 2) {
                            let parameterName: string = parameterElements[0]?.textContent ?? 'Parameter name not found.';
                            let parameterDescription: string = parameterElements[1]?.textContent ?? 'Parameter description not found.';
                            parameterArray.push({ name: parameterName, description: cleanTextContent(parameterDescription) });
                            return;
                        }

                        parameterArray.push({ name: parameter.textContent, description: 'No description.'});
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
            
            methods.push(
                { 
                    name: methodName, 
                    description: cleanTextContent(methodDescription.join('\n').toString()), 
                    parameters: parameterArray 
                }
            );
        }

        nextElement = nextElement?.nextElementSibling;
    }

    return methods;
}

const extractConstants = (startSection: Element): _Constant[] => {
    const constants: _Constant[] = [];

    // Starts from the next element after the 'Constants' section
    let nextElement: Element = startSection.nextElementSibling;

    // Loop through all elements until the next section
    while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h2"]')) {
        // If the next element is a constant
        if (nextElement.matches('div.heading-wrapper[data-heading-level="h3"]')) {
            let element: Element = nextElement.nextElementSibling;

            // Get constant name
            const constantName: string =  nextElement.querySelector('h3').textContent;
            const constantDescription: string[] = [];

            // Loop through all elements until the next section
            while (element && !element.matches('div.heading-wrapper[data-heading-level="h3"]')) {

                // Description
                if (element.matches('p') && element.textContent) {
                    constantDescription.push(element.textContent);
                }

                element = element?.nextElementSibling;
            }

            constants.push({ name: constantName, description: constantDescription.join('\n').toString() });
        }

        nextElement = nextElement?.nextElementSibling;
    }

    return constants;
};

const extractExampleCodes = (): ExampleCode[] => {
    const exampleCodes: ExampleCode[] = [];
    const exampleSections = Array.from(document.querySelectorAll('div.content div.heading-wrapper[data-heading-level="h4"]'));

    exampleSections.forEach((section) => {
        const heading = section.querySelector('h4');

        if (heading && heading.textContent && heading.textContent.includes('Examples')) {
            let nextElement = section.nextElementSibling;

            let codeName: string = "";
            let code: string = "";

            while (nextElement && !nextElement.matches('div.heading-wrapper[data-heading-level="h4"]')) {
                if (nextElement.matches('div.heading-wrapper[data-heading-level="h5"]')) {
                    codeName = nextElement.querySelector('h5')?.textContent ?? "";
                }

                if (nextElement.matches('pre')) {
                    code = cleanTextContent(nextElement.textContent) ?? "";
                }

                if (codeName && code) {
                    const newExampleCode = { codeName, code };
                    const isDuplicate = exampleCodes.some(exampleCode => exampleCode.codeName === newExampleCode.codeName && exampleCode.code === newExampleCode.code);

                    if (!isDuplicate) {
                        exampleCodes.push(newExampleCode);
                    }

                    // Reset
                    codeName = "";
                    code = "";
                }

                nextElement = nextElement.nextElementSibling;
            }

        }
    });

    return exampleCodes;
}

const filterWords = (text: string, options: FilterOptions): string => {
    let filterRegex = new RegExp('\\b(' + options.wordsToFilter.join('|') + ')\\b', 'gi');
    return text.replace(filterRegex, '').trim(); 
}

// Removes extra `\n` from text content
const cleanTextContent = (text: string): string => {
    return text.replace(/\n\s*\n/g, '\n');
}