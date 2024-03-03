type JSONFormat = FormatEnum | FormatClass | FormatInterface | _Object[];
type Action = 'parseEnum' | 'parseClass' | 'parseInterface' | 'parseObjects';

interface NamedDescription {
    name: string;
    description: string;
}

interface _Property extends NamedDescription {}

interface _Constant extends NamedDescription {}

interface _Object extends NamedDescription{}

interface Parameter extends NamedDescription{}

interface _Function extends NamedDescription {
    parameters?: Parameter[];
}  


interface FormatEnum extends NamedDescription{
    constants: _Constant[];
}

interface FormatClass extends NamedDescription {
    properties?: _Property[];
    methods?: _Function[];
    constants?: _Constant[];
    examples?: Example[]
}

interface FormatInterface extends NamedDescription {
    properties: _Property[];
    example?: Example[]
}

interface Example {
    codeName: string;
    code: string;
}

interface FilterOptions {
    wordsToFilter: string[];
    caseSensitive?: boolean;
}