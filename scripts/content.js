chrome.runtime.onMessage.addListener(parseDoc);
var Heading;
(function (Heading) {
    Heading["H2"] = "div.heading-wrapper[data-heading-level=\"h2\"]";
    Heading["H3"] = "div.heading-wrapper[data-heading-level=\"h3\"]";
    Heading["H4"] = "div.heading-wrapper[data-heading-level=\"h4\"]";
    Heading["H5"] = "div.heading-wrapper[data-heading-level=\"h5\"]";
})(Heading || (Heading = {}));
function parseDoc(request, _sender, sendResponse) {
    let Action;
    (function (Action) {
        Action["parseEnum"] = "parseEnum";
        Action["parseClass"] = "parseClass";
        Action["parseInterface"] = "parseInterface";
        Action["parseObjects"] = "parseObject";
        Action["parseConstants"] = "parseConstant";
    })(Action || (Action = {}));
    switch (request.action) {
        case Action.parseEnum:
            sendResponse({ data: parseEnum() });
            break;
        case Action.parseClass:
            sendResponse({ data: parseClass() });
            break;
        case Action.parseInterface:
            sendResponse({ data: parseInterface() });
            break;
        case Action.parseObjects:
            sendResponse({ data: parseObjects() });
            break;
        case Action.parseConstants:
            const sections = findAllElement(`div.content ${Heading.H2}`);
            sections.forEach(section => {
                const sectionTitle = section.querySelector('h2').textContent;
                if (sectionTitle?.includes('Constants'))
                    sendResponse({ data: parseConstants(section) });
            });
            break;
        default:
            sendResponse({ data: null });
            break;
    }
    return true;
}
function parseEnum() {
    const contentElement = document.querySelector('div.content');
    const sections = Array.from(contentElement.querySelectorAll(Heading.H2));
    let data = {
        name: filterWords(contentElement.querySelector('h1').textContent, { wordsToFilter: ['Enum'] }),
        description: contentElement.querySelector('p').textContent.trim(),
        constants: []
    };
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent;
        if (sectionTitle?.includes('Constants'))
            data.constants = parseConstants(section);
    });
    return data;
}
function parseClass() {
    const content = findElement('div.content');
    const sections = findAllElement(`div.content ${Heading.H2}`);
    let data = {
        name: filterWords(content.querySelector('h1').textContent, { wordsToFilter: ['Class'] }),
        description: content.querySelector('p').textContent.trim(),
        properties: [],
        methods: [],
        constants: [],
        examples: parseExamples()
    };
    let HeadingName;
    (function (HeadingName) {
        HeadingName["Properties"] = "Properties";
        HeadingName["Methods"] = "Methods";
        HeadingName["Constants"] = "Constants";
    })(HeadingName || (HeadingName = {}));
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent;
        if (sectionTitle?.includes('Extends') ||
            sectionTitle?.includes(`Classes that extend ${data.name}`)) {
            const extendsClasses = parseExtend(section).join(', ');
            data.description += ` Extends: ${extendsClasses}.`;
        }
        else {
            switch (sectionTitle) {
                case HeadingName.Properties:
                    data.properties = parseProperties(section);
                    break;
                case HeadingName.Methods:
                    data.methods = parseFunctions(section);
                    break;
                case HeadingName.Constants:
                    data.constants = parseConstants(section);
                    break;
                default:
                    break;
            }
        }
    });
    return data;
}
function parseExtend(starterHeading) {
    const extendsArray = [];
    // Start to the element after the 'Extends' heading
    let element = starterHeading.nextElementSibling;
    while (element && !element.matches(Heading.H2)) {
        if (element.matches('ul')) {
            const extendsList = Array.from(element.querySelectorAll('li'));
            extendsList.forEach((extend) => {
                extendsArray.push(extend.textContent ?? 'No extends found.');
            });
        }
        element = element.nextElementSibling;
    }
    return extendsArray;
}
function parseProperties(starterHeading) {
    const properties = [];
    // Start to the element after the 'Properties' heading
    let nextElement = starterHeading.nextElementSibling;
    while (nextElement && !nextElement.matches(Heading.H2)) {
        if (nextElement.matches(Heading.H3)) {
            const propertyName = nextElement.querySelector('h3')?.textContent ?? '';
            const propertyDescription = [];
            let element = nextElement.nextElementSibling;
            while (element && !element.matches(Heading.H3)) {
                if (element.matches('p') && element.textContent) {
                    propertyDescription.push(element.textContent);
                }
                if (element.matches('div.alert.is-warning')) {
                    propertyDescription.push(element.textContent);
                }
                element = element.nextElementSibling;
            }
            properties.push({
                name: propertyName,
                description: cleanTextContent(propertyDescription.join('\n'))
            });
        }
        nextElement = nextElement.nextElementSibling;
    }
    return properties;
}
;
function parseFunctions(starterHeading) {
    const _function = [];
    // Start to the element after the 'Methods' heading
    let nextElement = starterHeading.nextElementSibling;
    while (nextElement && !nextElement.matches(Heading.H2)) {
        if (nextElement.matches(Heading.H3)) {
            const functionName = nextElement.querySelector('h3')?.innerText ?? '';
            const functionDetails = extractFunctionDetails(nextElement);
            _function.push({
                name: functionName,
                description: cleanTextContent(functionDetails.description.join('\n')),
                parameters: functionDetails.parameters,
            });
        }
        nextElement = nextElement.nextElementSibling;
    }
    return _function;
}
;
function extractFunctionDetails(startElement) {
    let element = startElement.nextElementSibling;
    const description = [];
    const parameters = [];
    while (element && !element.matches(Heading.H3)) {
        parseFunctionDescription(element, description);
        parseParameters(element, parameters);
        element = element.nextElementSibling;
    }
    return { description, parameters };
}
function parseFunctionDescription(element, functionDescription) {
    // Description
    if (element.matches('p') && element.textContent) {
        functionDescription.push(element.textContent ?? '');
    }
    else if (element.matches('ul') && element.previousElementSibling?.matches('p')) {
        Array.from(element.querySelectorAll('li'))
            .forEach(li => functionDescription.push(li.textContent ?? ''));
    }
    // Returns
    if (element.matches(Heading.H4) &&
        element.querySelector('h4')?.textContent?.includes('Returns')) {
        functionDescription.push(element.textContent);
    }
    // Alerts
    const alerts = ["is-primary", "is-warning"];
    alerts.forEach((alert) => {
        if (element.matches(`div.alert.${alert}`)) {
            functionDescription.push(element.textContent);
        }
    });
}
function parseParameters(element, parameters) {
    if (element.matches('ul') &&
        element.previousElementSibling?.matches(Heading.H4)) {
        const isParameterList = element.previousElementSibling.textContent?.includes('Parameters');
        if (isParameterList) {
            Array.from(element.querySelectorAll('li')).forEach(li => {
                const paragraphs = li.querySelectorAll('p');
                const name = paragraphs.length > 0 ? paragraphs[0].textContent : '';
                const description = paragraphs.length > 1 ? paragraphs[1].textContent : 'No description.';
                if (name) {
                    parameters.push({ name, description });
                }
            });
        }
    }
}
function parseInterface() {
    const contentElement = document.querySelector('div.content');
    const sections = Array.from(contentElement.querySelectorAll(Heading.H2));
    let data = {
        name: filterWords(contentElement.querySelector('h1').textContent, { wordsToFilter: ['Interface'] }),
        description: contentElement.querySelector('p').textContent.trim(),
        properties: [],
        example: parseExamples()
    };
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2').textContent;
        if (sectionTitle?.includes('Properties')) {
            data.properties = parseProperties(section);
        }
    });
    return data;
}
;
function parseConstants(starterHeading) {
    const constantArray = [];
    // Start to the element after the 'Constants' heading
    let nextElement = starterHeading.nextElementSibling;
    // Loop through all elements until the next `h2`
    while (nextElement && !nextElement.matches(Heading.H2)) {
        if (nextElement.matches(Heading.H3)) {
            let element = nextElement.nextElementSibling;
            const constantName = nextElement.querySelector('h3').textContent;
            const constantDescription = [];
            // Loop through all elements until the next `h3`
            while (element && !element.matches(Heading.H3)) {
                // Description
                if (element.matches('p') && element.textContent) {
                    constantDescription.push(element.textContent);
                }
                element = element?.nextElementSibling;
            }
            constantArray.push({ name: constantName, description: constantDescription.join('\n').toString() });
        }
        nextElement = nextElement?.nextElementSibling;
    }
    return constantArray;
}
;
function parseObjects() {
    const contentElement = document.querySelector('div.content');
    const sections = Array.from(contentElement.querySelectorAll(Heading.H2));
    const objects = [];
    sections.forEach(section => {
        if (section.querySelector('h2').textContent.includes('Objects')) {
            let nextElement = section.nextElementSibling;
            while (nextElement && !nextElement.matches(Heading.H2)) {
                if (nextElement.matches(Heading.H3)) {
                    let objectName = nextElement.querySelector('h3').textContent;
                    let objectDescription = [];
                    let element = nextElement.nextElementSibling;
                    while (element && !element.matches(Heading.H3)) {
                        if (element.matches('p') && element.textContent) {
                            objectDescription.push(element.textContent);
                        }
                        element = element.nextElementSibling;
                    }
                    objects.push({ name: objectName, description: objectDescription.join('\n').toString() });
                }
                nextElement = nextElement.nextElementSibling;
            }
        }
    });
    return objects;
}
function parseExamples() {
    const content = document.querySelector("div.content");
    const exampleCodes = [];
    const exampleSections = Array.from(content.querySelectorAll(Heading.H4));
    exampleSections.forEach((section) => {
        const heading = section.querySelector('h4');
        if (heading?.textContent?.includes('Examples')) {
            let nextElement = section.nextElementSibling;
            while (nextElement && !nextElement.matches(Heading.H4)) {
                if (nextElement.matches(Heading.H5)) {
                    const codeName = nextElement.querySelector('h5')?.textContent ?? "";
                    let codeElement = nextElement.nextElementSibling;
                    while (codeElement && !codeElement.matches('pre')) {
                        codeElement = codeElement.nextElementSibling;
                    }
                    if (codeName && codeElement && codeElement.matches('pre')) {
                        const code = cleanTextContent(codeElement.textContent) ?? "";
                        const newExampleCode = { codeName, code };
                        const isDuplicate = exampleCodes.some(exampleCode => exampleCode.codeName === newExampleCode.codeName && exampleCode.code === newExampleCode.code);
                        if (!isDuplicate) {
                            exampleCodes.push(newExampleCode);
                        }
                    }
                }
                nextElement = nextElement.nextElementSibling;
            }
        }
    });
    return exampleCodes;
}
function filterWords(text, options) {
    let filterRegex = new RegExp('\\b(' + options.wordsToFilter.join('|') + ')\\b', 'gi');
    return text.replace(filterRegex, '').trim();
}
// Removes extra `\n` from text content
function cleanTextContent(text) {
    return text.replace(/\n\s*\n/g, '\n');
}
function findAllElement(element) {
    return Array.from(document.querySelectorAll(element));
}
function findElement(element) {
    return document.querySelector(element);
}
