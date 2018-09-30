import { printSchema } from 'graphql'
import { JSONSchema7, JSONSchema7TypeName } from 'json-schema'
import convert from '../src/convert'
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
} from './assets/jsonschema/family/index'
import { readAsset } from './utils/assets'

// Helpers

const testConversion = (jsonSchema: any, schemaText: string) => {
  const schema = convert({ jsonSchema })
  const actualSchemaText = printSchema(schema)
  expect(actualSchemaText).toEqualIgnoringWhitespace(schemaText)
}

// Tests

it('correctly converts attribute types', () => {
  const types = [
    { j: 'string', g: 'String' },
    { j: 'integer', g: 'Int' },
    { j: 'number', g: 'Float' },
    { j: 'boolean', g: 'Boolean' },
  ]

  expect.assertions(types.length)

  types.forEach(({ j, g }: { j: JSONSchema7TypeName; g: string }) => {
    const jsonSchema: JSONSchema7 = {
      $id: 'Pizza',
      type: 'object',
      properties: {
        foo: { type: j },
      },
    }
    const graphqlSchemaText = `
      type Pizza {
        foo: ${g}
      }
      type Query {
        pizzas: [Pizza]
      }
    `
    testConversion(jsonSchema, graphqlSchemaText)
  })
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
  const graphqlSchemaText = `
    type person {
      name: String
      age: Int
    }
    type Query {
      people: [person]
    }`
  testConversion(jsonSchema, graphqlSchemaText)
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
  const graphqlSchemaText = `
    type person {
      name: String
      age: Int
    }
    type Query {
      people: [person]
    }`
  testConversion(jsonSchema, graphqlSchemaText)
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

it('converts array type properties', () => {
  expect.assertions(1)
  const jsonSchema = {
    $id: 'Array',
    type: 'object',
    properties: {
      attribute: {
        type: 'array', // <-- array type property
        items: {
          type: 'integer',
        },
      },
    },
  }
  const graphqlSchemaText = `
    type Array {
      attribute: [Int!]
    }
    type Query {
      arrays: [Array]
    }`
  testConversion(jsonSchema, graphqlSchemaText)
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
  const graphqlSchemaText = `
    type Query {
      widgets: [Widget]
    }
    type Widget {
      somethingRequired: Int!
      somethingOptional: Int
      somethingElseRequired: Int!
    }`
  testConversion(jsonSchema, graphqlSchemaText)
})

test('handles an object with no properties', () => {
  const jsonSchema = {
    $id: 'EmptyVoid',
    properties: {}, // <-- no properties
    type: 'object',
  }
  const graphqlSchemaText = `
    type EmptyVoid {
      _empty: String
    }
    type Query {
      emptyVoids: [EmptyVoid]
    }`
  testConversion(jsonSchema, graphqlSchemaText)
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
  const graphqlSchemaText = `
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

  testConversion([orange, apple], graphqlSchemaText)
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
  const graphqlSchemaText = `
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

  testConversion([orange, apple], graphqlSchemaText)
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

  const graphqlSchemaText = `
    type Employee {
      name: String
      manager: Employee
    }
    type Query { 
      employees: [Employee] 
    }`
  testConversion(employee, graphqlSchemaText)
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

  const graphqlSchemaText = `
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
  testConversion([orange, apple], graphqlSchemaText)
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

  const graphqlSchemaText = `
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

  testConversion(jsonSchema, graphqlSchemaText)
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

  const graphqlSchemaText = `
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

  testConversion(jsonSchema, graphqlSchemaText)
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
  const graphqlSchemaText = `
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
  testConversion(jsonSchema, graphqlSchemaText)
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
  const graphqlSchemaText = `
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
  testConversion(jsonSchema, graphqlSchemaText)
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
  const graphqlSchemaText = `
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
  testConversion([parent, child, person], graphqlSchemaText)
})

//
// Family tests

const FAMILY = [family, user, log, item, approval, timeRange, valueRange, email, objectId]

test('converts family schema', () => {
  const jsonSchema = FAMILY
  const graphqlSchemaText: string = readAsset('graphql/family.graphql')
  testConversion(jsonSchema, graphqlSchemaText)
})
