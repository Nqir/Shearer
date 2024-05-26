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
        Action["parseProperties"] = "parseProperty";
        Action["parseFunctions"] = "parseFunction";
        Action["parseExamples"] = "parseExample";
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
            findAndProcessSectionByTitle('Constants', (section) => {
                const constantsData = parseConstants(section);
                sendResponse({ data: constantsData });
            });
            break;
        case Action.parseProperties:
            findAndProcessSectionByTitle('Properties', (section) => {
                const propertiesData = parseProperties(section);
                sendResponse({ data: propertiesData });
            });
            break;
        case Action.parseFunctions:
            findAndProcessSectionByTitle('Methods', (section) => {
                const functionsData = parseFunctions(section);
                sendResponse({ data: functionsData });
            });
            break;
        case Action.parseExamples:
            sendResponse({ data: parseExamples() });
            break;
        default:
            sendResponse({ data: null });
            break;
    }
    return true;
}
function getContentElement() {
    return findElement('div.content');
}
function parseDocTitle() {
    return getContentElement().querySelector('h1').textContent;
}
function parseEnum() {
    const sections = Array.from(getContentElement().querySelectorAll(Heading.H2));
    let data = {
        name: parseDocTitle(),
        description: getContentElement().querySelector('p').textContent.trim(),
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
    const sections = findAllElement(`div.content ${Heading.H2}`);
    let data = {
        name: parseDocTitle(),
        description: getContentElement().querySelector('p').textContent.trim(),
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
    let elements = iterateElementUntil(starterHeading, elem => elem.matches(Heading.H2));
    elements.forEach(nextElement => {
        if (nextElement.matches(Heading.H3)) {
            const propertyName = nextElement.querySelector('h3')?.textContent ?? '';
            const propertyDescription = [];
            let propertyElements = iterateElementUntil(nextElement, elem => elem.matches(Heading.H3));
            propertyElements.forEach(element => {
                if (element.matches('p') && element.textContent) {
                    propertyDescription.push(element.textContent);
                }
                if (element.matches('div.alert.is-warning')) {
                    propertyDescription.push(element.textContent);
                }
            });
            properties.push({
                name: propertyName,
                description: cleanTextContent(propertyDescription.join('\n'))
            });
        }
    });
    return properties;
}
;
function parseFunctions(starterHeading) {
    const _function = [];
    // Start to the element after the 'Methods' heading
    let elements = iterateElementUntil(starterHeading, elem => elem.matches(Heading.H2));
    elements.forEach(element => {
        if (element.matches(Heading.H3)) {
            const functionName = element.querySelector('h3')?.innerText ?? '';
            const functionDetails = extractFunctionDetails(element);
            _function.push({
                name: functionName,
                description: cleanTextContent(functionDetails.description.join('\n')),
                parameters: functionDetails.parameters,
            });
        }
    });
    return _function;
}
;
function extractFunctionDetails(startElement) {
    let elements = iterateElementUntil(startElement, elem => elem.matches(Heading.H3));
    const description = [];
    const parameters = [];
    elements.forEach(element => {
        parseFunctionDescription(element, description);
        parseParameters(element, parameters);
    });
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
        const isParameterList = element.previousElementSibling.textContent.includes('Parameters');
        if (isParameterList) {
            Array.from(element.querySelectorAll('li')).forEach(li => {
                const paragraphs = li.querySelectorAll('p');
                if (paragraphs.length > 1) {
                    const parameterName = paragraphs[0].textContent;
                    const parameterDescription = paragraphs[1]?.textContent ?? '';
                    parameters.push({
                        name: parameterName,
                        description: parameterDescription
                    });
                    return;
                }
                parameters.push({ name: li.textContent, description: '' });
            });
        }
    }
}
function parseInterface() {
    const sections = Array.from(getContentElement().querySelectorAll(Heading.H2));
    let data = {
        name: parseDocTitle(),
        description: getContentElement().querySelector('p').textContent.trim(),
        properties: [],
        examples: parseExamples()
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
    let elements = iterateElementUntil(starterHeading, elem => elem.matches(Heading.H2));
    // Loop through all elements until the next `h2`
    elements.forEach(nextElement => {
        if (nextElement.matches(Heading.H3)) {
            const constantName = nextElement.querySelector('h3').textContent;
            const constantDescription = [];
            // Loop through all elements until the next `h3`
            let constantElements = iterateElementUntil(nextElement, elem => elem.matches(Heading.H3));
            constantElements.forEach(element => {
                if (element.matches('p') && element.textContent) {
                    constantDescription.push(element.textContent);
                }
            });
            constantArray.push({ name: constantName, description: constantDescription.join('\n').toString() });
        }
    });
    return constantArray;
}
;
function parseObjects() {
    const sections = Array.from(getContentElement().querySelectorAll(Heading.H2));
    const objects = [];
    sections.forEach(section => {
        if (section.querySelector('h2').textContent.includes('Objects')) {
            let elements = iterateElementUntil(section, elem => elem.matches(Heading.H2));
            elements.forEach(nextElement => {
                if (nextElement.matches(Heading.H3)) {
                    let objectName = nextElement.querySelector('h3').textContent;
                    let objectDescription = [];
                    let objectElements = iterateElementUntil(nextElement, elem => elem.matches(Heading.H3));
                    objectElements.forEach(element => {
                        if (element.matches('p') && element.textContent) {
                            objectDescription.push(element.textContent);
                        }
                    });
                    objects.push({
                        name: objectName,
                        description: objectDescription.join('\n').toString()
                    });
                }
            });
        }
    });
    return objects;
}
function parseExamples() {
    const exampleCodes = [];
    const exampleSections = Array.from(getContentElement().querySelectorAll(Heading.H4));
    exampleSections.forEach((section) => {
        const heading = section.querySelector('h4');
        if (heading?.textContent?.includes('Examples')) {
            let elements = iterateElementUntil(section, elem => elem.matches(Heading.H4));
            elements.forEach(nextElement => {
                if (nextElement.matches(Heading.H5)) {
                    const codeName = nextElement.querySelector('h5')?.textContent ?? "";
                    let codeElement = nextElement.nextElementSibling;
                    while (codeElement && !codeElement.matches('pre')) {
                        codeElement = codeElement.nextElementSibling;
                    }
                    if (codeName && codeElement && codeElement.matches('pre')) {
                        const code = cleanTextContent(codeElement.textContent) ?? "";
                        const newExampleCode = { codeName, code };
                        if (!exampleCodes.some(exampleCode => exampleCode.codeName === newExampleCode.codeName &&
                            exampleCode.code === newExampleCode.code)) {
                            exampleCodes.push(newExampleCode);
                        }
                    }
                }
            });
        }
    });
    return exampleCodes;
}
// Utility functions
function filterWords(text, options) {
    let filterRegex = new RegExp('\\b(' + options.wordsToFilter.join('|') + ')\\b', 'gi');
    return text.replace(filterRegex, '').trim();
}
function iterateElementUntil(startElement, condition) {
    const elements = [];
    let nextElement = startElement.nextElementSibling;
    while (nextElement && !condition(nextElement)) {
        elements.push(nextElement);
        nextElement = nextElement.nextElementSibling;
    }
    return elements;
}
function findAndProcessSectionByTitle(titleSection, action) {
    const sections = findAllElement(`div.content ${Heading.H2}`);
    sections.forEach(section => {
        const sectionTitle = section.querySelector('h2')?.textContent;
        if (sectionTitle?.includes(titleSection)) {
            action(section);
        }
    });
}
function cleanTextContent(text) {
    return text.replace(/\n\s*\n/g, '\n');
}
function findAllElement(element) {
    return Array.from(document.querySelectorAll(element));
}
function findElement(element) {
    return document.querySelector(element);
}
