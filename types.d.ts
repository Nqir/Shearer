
interface FilterOptions {
    wordsToFilter: string[];
    caseSensitive?: boolean;
}

interface Constant {
    name: string;
    description: string;
}
  
interface ClassProperty {
    name: string;
    description: string;
}

interface Parameter {
    name: string;
    description?: string;
}

interface ClassMethod {
    name: string;
    description: string;
    parameters?: Parameter[];
    
}

interface ClassFormat {
    className: string;
    classDescription: string;
    classProperties?: ClassProperty[];
    classMethods?: ClassMethod[];
    classConstants?: Constant[];
    exampleCodes?: ExampleCode[]
}

interface ExampleCode {
    codeName: string;
    code: string;
}