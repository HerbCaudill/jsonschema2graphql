import { getTypeName } from '../src/getTypeName'

const testCase = (expected: string, input: string) => () => expect(getTypeName(input)).toEqual(expected)

it('leaves a good type name alone          ', testCase('Person', 'Person'))
it('capitalizes a lower-case word          ', testCase('Person', 'person'))
it('trims whitespace                       ', testCase('Person', '      person   '))
it('strips out local path information      ', testCase('Person', '#/Person'))
it('removes an extension (e.g. .json)      ', testCase('Person', '#/Person.json'))
it('extracts a name from a URL             ', testCase('Person', 'http://www.foo.com/schemas/Person.json?v=123#abc'))
it('extracts a name from a file path       ', testCase('Person', 'c:/myJsonSchemas/Person.txt'))
it('converts kebab case to pascal case     ', testCase('ResultsFramework', '#/results-framework'))
it('converts train case to pascal case     ', testCase('ResultsFramework', '#/Results-Framework'))
it('converts snake case to pascal case     ', testCase('ResultsFramework', '#/results_framework'))
it('converts title case to pascal case     ', testCase('ResultsFramework', '#/Results Framework'))
it('converts sentence case to pascal case  ', testCase('ResultsFramework', '#/Results framework'))
