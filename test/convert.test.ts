import {
  GraphQLInputType,
  GraphQLObjectType,
  GraphQLOutputType,
  printSchema,
} from 'graphql'
import { JSONSchema7 } from 'json-schema'

import convert from '../src'
import { EntryPointBuilder } from '../src/types'
import {
  approval,
  email,
  family,
  item,
  log,
  objectId,
  timeRange,
  user,
  valueRange,
} from './assets/jsonschema/family'
import { readAsset } from './utils/assets'

// Helpers

const testConversion = (jsonSchema: any, schemaText: string) => {
  const schema = convert({ jsonSchema })
  const actualSchemaText = printSchema(schema)
  expect(actualSchemaText).toEqualIgnoringWhitespace(schemaText)
}

function getDefinition(typeName: string, s: string) {
  const queryBlockRegex = new RegExp(`type ${typeName} \\{(\\S|\\s)*?\\}`)
  const queryBlockMatches = s.match(queryBlockRegex)
  if (queryBlockMatches) return queryBlockMatches[0]
  else return undefined
}

// Tests

it('correctly converts basic attribute types', () => {
  const jsonSchema: JSONSchema7 = {
    $id: 'Person',
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'integer' },
      score: { type: 'number' },
      isMyFriend: { type: 'boolean' },
    },
  }
  const expectedSchemaText = `
    type Person {
      name: String
      age: Int
      score: Float 
      isMyFriend: Boolean
    }
    type Query {
      people: [Person]
    }
  `
  testConversion(jsonSchema, expectedSchemaText)
})

it('converts a literal object', () => {
  expect.assertions(1)
  const jsonSchema: JSONSchema7 = {
    $id: 'person',
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'integer',
      },
    },
  }
  const expectedSchemaText = `
    type Person {
      name: String
      age: Int
    }
    type Query {
      people: [Person]
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

it('converts a text schema', () => {
  expect.assertions(1)
  const jsonSchema = `{
    "$id": "person",
    "type": "object",
    "properties": {
      "name": {
        "type": "string"
      },
      "age": {
        "type": "integer"
      }
    }
  }`
  const expectedSchemaText = `
    type Person {
      name: String
      age: Int
    }
    type Query {
      people: [Person]
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

it('fails on unknown types', () => {
  expect.assertions(1)
  const jsonSchema = JSON.stringify({
    $id: 'Pizza',
    type: 'object',
    properties: {
      foo: {
        type: 'tweedledee', // <-- invalid type
      },
    },
  })
  const conversion = () => convert({ jsonSchema })
  expect(conversion).toThrowError()
})

it('converts descriptions', () => {
  expect.assertions(1)
  const jsonSchema: JSONSchema7 = {
    $id: 'person',
    type: 'object',
    description: 'An individual human being.',
    properties: {
      name: {
        type: 'string',
        description: 'The full name of the person.',
      },
      age: {
        type: 'integer',
        description: "The elapsed time (in years) since the person's birth.",
      },
    },
  }
  const expectedSchemaText = `
    """
    An individual human being.
    """
    type Person {
      """
      The full name of the person.
      """
      name: String
      """
      The elapsed time (in years) since the person's birth.
      """
      age: Int
    }
    type Query {
      people: [Person]
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

it('converts array type properties', () => {
  expect.assertions(1)
  const jsonSchema = {
    $id: 'Person',
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      luckyNumbers: {
        type: 'array',
        items: {
          type: 'integer',
        },
      },
      favoriteColors: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  }
  const expectedSchemaText = `
    type Person {
      name: String
      luckyNumbers: [Int!]
      favoriteColors: [String!]
    }
    type Query {
      people: [Person]
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

test('enforces required attributes', () => {
  const jsonSchema = {
    $id: 'Widget',
    type: 'object',
    properties: {
      somethingRequired: { type: 'integer' },
      somethingOptional: { type: 'integer' },
      somethingElseRequired: { type: 'integer' },
    },
    required: ['somethingRequired', 'somethingElseRequired'],
  }
  const expectedSchemaText = `
    type Query {
      widgets: [Widget]
    }
    type Widget {
      somethingRequired: Int!
      somethingOptional: Int
      somethingElseRequired: Int!
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

test('handles an object with no properties', () => {
  const jsonSchema = {
    $id: 'EmptyVoid',
    properties: {}, // <-- no properties
    type: 'object',
  }
  const expectedSchemaText = `
    type EmptyVoid {
      _empty: String
    }
    type Query {
      emptyVoids: [EmptyVoid]
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

test('handles a reference (using $ref)', () => {
  const orange = {
    $id: 'Orange',
    type: 'object',
    properties: {
      color: {
        type: 'string',
      },
    },
  }
  const apple = {
    $id: 'Apple',
    type: 'object',
    properties: {
      color: { type: 'string' },
      bestFriend: {
        $ref: 'Orange', // <-- reference foreign type using $ref
      },
    },
  }
  const expectedSchemaText = `
    type Apple { 
      color: String 
      bestFriend: Orange 
    } 
    type Orange { 
      color: String 
    } 
    type Query { 
      oranges: [Orange]
      apples: [Apple] 
    }`

  testConversion([orange, apple], expectedSchemaText)
})

test('handles a reference in an array property', () => {
  const orange = {
    $id: 'Orange',
    type: 'object',
    properties: {
      color: {
        type: 'string',
      },
    },
  }
  const apple = {
    $id: 'Apple',
    type: 'object',
    properties: {
      color: { type: 'string' },
      bestFriends: {
        type: 'array', // <-- array type
        items: {
          $ref: 'Orange', // <-- reference foreign type using $ref
        },
      },
    },
  }
  const expectedSchemaText = `
    type Apple { 
      color: String 
      bestFriends: [Orange!] 
    } 
    type Orange { 
      color: String 
    } 
    type Query { 
      oranges: [Orange]
      apples: [Apple] 
    }`

  testConversion([orange, apple], expectedSchemaText)
})

test('fails when given an invalid $ref', () => {
  const jsonSchema: JSONSchema7 = {
    $id: 'Apple',
    type: 'object',
    properties: {
      attribute: {
        $ref: 'Orange',
      },
    },
  }
  const conversion = () => convert({ jsonSchema })
  expect(conversion).toThrowError()
})

test('handles self-reference', () => {
  const employee: JSONSchema7 = {
    $id: 'Employee',
    type: 'object',
    properties: {
      name: { type: 'string' },
      manager: { $ref: 'Employee' }, // <-- type refers to itself
    },
  }

  const expectedSchemaText = `
    type Employee {
      name: String
      manager: Employee
    }
    type Query { 
      employees: [Employee] 
    }`
  testConversion(employee, expectedSchemaText)
})

test('handles a circular reference', () => {
  const apple = {
    $id: 'Apple',
    type: 'object',
    properties: {
      bestFriend: {
        $ref: 'Orange',
      },
    },
  }

  const orange = {
    $id: 'Orange',
    type: 'object',
    properties: {
      bestFriend: {
        $ref: 'Apple',
      },
    },
  }

  const expectedSchemaText = `
    type Apple {
      bestFriend: Orange
    }
    type Orange {
      bestFriend: Apple
    }
    type Query { 
      oranges: [Orange] 
      apples: [Apple] 
    }`
  testConversion([orange, apple], expectedSchemaText)
})

test('handles enum types', () => {
  const jsonSchema: JSONSchema7 = {
    $id: 'Person',
    type: 'object',
    properties: {
      height: {
        type: 'string',
        enum: ['tall', 'average', 'short'], // <-- enum
      },
    },
  }

  const expectedSchemaText = `
    type Person {
      height: PersonHeight
    }
    enum PersonHeight {
      tall
      average
      short
    }
    type Query { 
      people: [Person] 
    }`

  testConversion(jsonSchema, expectedSchemaText)
})

test('handles enum types with invalid characters', () => {
  const jsonSchema: JSONSchema7 = {
    $id: 'Person',
    type: 'object',
    properties: {
      height: {
        type: 'string',
        enum: ['super-tall', 'average', 'really really short'],
      },
    },
  }

  const expectedSchemaText = `
    type Person {
      height: PersonHeight
    }
    enum PersonHeight {
      super_tall
      average
      really_really_short
    }
    type Query { 
      people: [Person] 
    }`

  testConversion(jsonSchema, expectedSchemaText)
})

test('handles enum with comparison symbols', () => {
  const jsonSchema: JSONSchema7 = {
    $id: 'Comparator',
    type: 'object',
    properties: {
      operator: {
        type: 'string',
        enum: ['<', '<=', '>=', '>'],
      },
    },
  }
  const expectedSchemaText = `
    type Comparator {
      operator: ComparatorOperator
    }
    enum ComparatorOperator {
      LT
      LTE
      GTE
      GT
    }
    type Query {
      comparators: [Comparator]
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

test('handles enum with numeric keys', () => {
  const jsonSchema: JSONSchema7 = {
    $id: 'Person',
    type: 'object',
    properties: {
      age: {
        type: 'string',
        enum: ['1', '10', '100'],
      },
    },
  }
  const expectedSchemaText = `
    type Person {
      age: PersonAge
    }
    enum PersonAge {
      VALUE_1
      VALUE_10
      VALUE_100
    }
    type Query {
      people: [Person]
    }`
  testConversion(jsonSchema, expectedSchemaText)
})

test('fails on enum for non-string properties', () => {
  const jsonSchema: JSONSchema7 = {
    $id: 'Person',
    type: 'object',
    properties: {
      age: {
        type: 'integer',
        enum: [1, 2, 3],
      },
    },
  }
  const conversion = () => convert({ jsonSchema })
  expect(conversion).toThrowError()
})

test('converts `oneOf` schemas (with if/then) to union types', () => {
  const parent: JSONSchema7 = {
    $id: 'Parent',
    type: 'object',
    properties: {
      type: { type: 'string' },
      name: { type: 'string' },
    },
  }
  const child: JSONSchema7 = {
    $id: 'Child',
    type: 'object',
    properties: {
      type: { type: 'string' },
      name: { type: 'string' },
      parent: { $ref: 'Parent' },
      bestFriend: { $ref: 'Person' },
      friends: {
        type: 'array',
        items: { $ref: 'Person' },
      },
    },
  }
  const person: JSONSchema7 = {
    $id: 'Person',
    oneOf: [
      {
        if: { properties: { type: { const: 'Parent' } } },
        then: { $ref: 'Parent' },
      },
      {
        if: { properties: { type: { const: 'Child' } } },
        then: { $ref: 'Child' },
      },
    ],
  }
  const expectedSchemaText = `
    type Child {
      type: String
      name: String
      parent: Parent
      bestFriend: Person
      friends: [Person!]
    }
    type Parent {
      type: String
      name: String
    }
    union Person = Parent | Child
    type Query { 
      parents: [Parent] 
      children: [Child] 
      people: [Person] 
    }`
  testConversion([parent, child, person], expectedSchemaText)
})

test('converts `oneOf` schemas to union types', () => {
  const parent: JSONSchema7 = {
    $id: 'Parent',
    type: 'object',
    properties: {
      type: { type: 'string' },
      name: { type: 'string' },
    },
  }
  const child: JSONSchema7 = {
    $id: 'Child',
    type: 'object',
    properties: {
      type: { type: 'string' },
      name: { type: 'string' },
      parent: { $ref: 'Parent' },
      bestFriend: { $ref: 'Person' },
      friends: {
        type: 'array',
        items: { $ref: 'Person' },
      },
    },
  }
  const person: JSONSchema7 = {
    $id: 'Person',
    oneOf: [{ $ref: 'Parent' }, { $ref: 'Child' }],
  }
  const expectedSchemaText = `
    type Child {
      type: String
      name: String
      parent: Parent
      bestFriend: Person
      friends: [Person!]
    }
    type Parent {
      type: String
      name: String
    }
    union Person = Parent | Child
    type Query { 
      parents: [Parent] 
      children: [Child] 
      people: [Person] 
    }`
  testConversion([parent, child, person], expectedSchemaText)
})

//
// Family tests

const FAMILY = [
  objectId, //
  email,
  valueRange,
  timeRange,
  item,
  approval,
  log,
  user,
  family,
]

test('converts family schema', () => {
  const jsonSchema = FAMILY as JSONSchema7
  const expectedSchemaText: string = readAsset('graphql/family.graphql')
  testConversion(jsonSchema, expectedSchemaText)
})

test('builds custom query and mutation blocks', () => {
  const jsonSchema = FAMILY as JSONSchema7

  const entryPoints: EntryPointBuilder = types => {
    return {
      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          family: { type: types['Family'] as GraphQLOutputType },
          user: {
            type: types['User'] as GraphQLOutputType,
            args: {
              email: { type: types['Email'] as GraphQLInputType },
            },
          },
        },
      }),
      mutation: new GraphQLObjectType({
        name: 'Mutation',
        fields: {
          stop: { type: types['Log'] as GraphQLOutputType },
        },
      }),
    }
  }

  const schema = convert({ jsonSchema, entryPoints })
  const actualSchemaText = printSchema(schema)

  // Query
  const actualQueryBlock = getDefinition('Query', actualSchemaText)
  const expectedQueryBlock: string = `
      type Query {
        family: Family
        user(email: String): User
      }`
  expect(actualQueryBlock).toEqualIgnoringWhitespace(expectedQueryBlock)

  // Mutation
  const actualMutationBlock = getDefinition('Mutation', actualSchemaText)
  const expectedMutationBlock: string = `
      type Mutation {
        stop: Log
      }`
  expect(actualMutationBlock).toEqualIgnoringWhitespace(expectedMutationBlock)
})
