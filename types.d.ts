
interface FilterOptions {
    wordsToFilter: string[];
    caseSensitive?: boolean;
}

interface _Constant {
    name: string;
    description: string;
}
  
interface _Property {
    name: string;
    description: string;
}

interface Parameter {
    name: string;
    description?: string;
}

interface _Function {
    name: string;
    description: string;
    parameters?: Parameter[];
    
}

interface FormatClass {
    className: string;
    classDescription: string;
    classProperties?: _Property[];
    classMethods?: _Function[];
    classConstants?: _Constant[];
    exampleCodes?: ExampleCode[]
}

interface ExampleCode {
    codeName: string;
    code: string;
}

interface FormatInterface {
    interfaceName: string;
    interfaceDescription: string;
    interfaceProperties: _Property[];
    exampleCodes?: ExampleCode[]
}