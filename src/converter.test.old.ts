// import fs from 'fs-extra'
// import { printSchema } from 'graphql'
// import tmp from 'tmp-promise'
// import {
//   convert,
//   getConvertEnumFromGraphQLCode,
//   newContext,
//   UnknownTypeReference,
// } from './converter'
// import {
//   makeSchemaForType,
//   testAttributeType,
//   testConversion,
// } from './testUtils'

// test('empty object', async () => {
//   const emptyType = {
//     $id: 'Empty',
//     properties: {},
//     type: 'object',
//   }
//   const expectedType = `type Empty {
//     _typesWithoutFieldsAreNotAllowed_: String
//   }
  
//   input EmptyInput {
//     _typesWithoutFieldsAreNotAllowed_: String
//   }
//   `
//   await testConversion(t, emptyType, 'Empty', expectedType)
// })

// test('string attributes', async () => {
//   await testAttributeType(t, 'string', 'String')
// })

// test('integer attributes', async () => {
//   await testAttributeType(t, 'integer', 'Int')
// })

// test('float attributes', async () => {
//   await testAttributeType(t, 'number', 'Float')
// })

// test('boolean attributes', async () => {
//   await testAttributeType(t, 'boolean', 'Boolean')
// })

// test('fail on unknown types attributes', async () => {
//   const assertion = async () =>
//     testAttributeType(t, 'unknown', 'unknown', {
//       skipValidation: true,
//     })
//   await t.throwsAsync(
//     assertion,
//     'A JSON Schema attribute type unknown on attribute Simple.attribute does not have a known GraphQL mapping'
//   )
// })

// test('array attributes', async () => {
//   const simpleType = {
//     $id: 'Array',
//     type: 'object',
//     properties: {
//       attribute: {
//         type: 'array',
//         items: {
//           type: 'integer',
//         },
//       },
//     },
//   }

//   const expectedType = `type Array {
//     attribute: [Int!]
//   }

//   input ArrayInput {
//     attribute: [Int!]
//   }
//   `

//   await testConversion(t, simpleType, 'Array', expectedType)
// })

// test('required attributes', async () => {
//   const simpleType = {
//     $id: 'Array',
//     type: 'object',
//     properties: {
//       attribute1: {
//         type: 'integer',
//       },
//       attribute2: {
//         type: 'integer',
//       },
//       attribute3: {
//         type: 'integer',
//       },
//     },
//     required: ['attribute1', 'attribute3'],
//   }

//   const expectedType = `type Array {
//     attribute1: Int!
//     attribute2: Int
//     attribute3: Int!
//   }

//   input ArrayInput {
//     attribute1: Int!
//     attribute2: Int
//     attribute3: Int!
//   }
//   `

//   await testConversion(test, simpleType, 'Array', expectedType)
// })

// test('Unknown $ref attribute type', async () => {
//   const simpleType = {
//     $id: 'Ref',
//     type: 'object',
//     properties: {
//       attribute: {
//         $ref: 'UnknownType',
//       },
//     },
//   }

//   const expectedType = `type Ref {
//     attribute: UnknownType
//   }`

//   const schema = testConversion(t, simpleType, 'Ref', expectedType)
//   await t.throwsAsync(schema, UnknownTypeReference)
// })

// test('Known $ref attribute type', async () => {
//   const otherType = {
//     $id: 'OtherType',
//     type: 'object',
//     properties: {
//       attribute: {
//         type: 'string',
//       },
//     },
//   }

//   const refType = {
//     $id: 'Ref',
//     type: 'object',
//     properties: {
//       attribute: {
//         $ref: 'OtherType',
//       },
//     },
//   }

//   const expectedType = `
//   type OtherType {
//     attribute: String
//   }

//   input OtherTypeInput {
//     attribute: String
//   }

//   type Ref {
//     attribute: OtherType
//   }

//   input RefInput {
//     attribute: OtherTypeInput
//   }`

//   const context = newContext()
//   convert(context, otherType)
//   await testConversion(test, refType, 'Ref', expectedType, context)
// })

// test('Known $ref array attribute type', async () => {
//   const otherType = {
//     $id: 'OtherType',
//     type: 'object',
//     properties: {
//       attribute: {
//         type: 'string',
//       },
//     },
//   }

//   const refType = {
//     $id: 'Ref',
//     type: 'object',
//     properties: {
//       attribute: {
//         type: 'array',
//         items: {
//           $ref: 'OtherType',
//         },
//       },
//     },
//   }

//   const expectedType = `
//   type OtherType {
//     attribute: String
//   }

//   input OtherTypeInput {
//     attribute: String
//   }

//   type Ref {
//     attribute: [OtherType!]
//   }

//   input RefInput {
//     attribute: [OtherTypeInput!]
//   }`

//   const context = newContext()
//   convert(context, otherType)
//   await testConversion(test, refType, 'Ref', expectedType, context)
// })

// test('Circular $ref attribute types', async () => {
//   const leftType = {
//     $id: 'Left',
//     type: 'object',
//     properties: {
//       right: {
//         $ref: 'Right',
//       },
//     },
//   }

//   const rightType = {
//     $id: 'Right',
//     type: 'object',
//     properties: {
//       left: {
//         $ref: 'Left',
//       },
//     },
//   }

//   const expectedType = `
//   type Right {
//     left: Left
//   }

//   type Left {
//     right: Right
//   }

//   input RightInput {
//     left: LeftInput
//   }

//   input LeftInput{
//     right: RightInput
//   }
//   `

//   const context = newContext()
//   convert(context, rightType)
//   await testConversion(test, leftType, 'Left', expectedType, context)
// })

// test('Enumeration attribute types', async () => {
//   const personType = {
//     $id: 'Person',
//     type: 'object',
//     properties: {
//       height: {
//         type: 'string',
//         enum: ['tall', 'average', 'short'],
//       },
//     },
//   }

//   const expectedType = `
//   enum PersonHeight {
//     tall, average, short
//   }
//   type Person {
//     height: PersonHeight
//   }
//   input PersonInput {
//     height: PersonHeight
//   }`

//   const context = newContext()
//   await testConversion(test, personType, 'Person', expectedType, context)
// })

// test('Enumeration attribute with forbidden characters', async () => {
//   const personType = {
//     $id: 'Person',
//     type: 'object',
//     properties: {
//       height: {
//         type: 'string',
//         enum: ['super-tall', 'average', 'really-really-short'],
//       },
//     },
//   }

//   const expectedType = `
//   enum PersonHeight {
//     super_tall, average, really_really_short
//   }
//   type Person {
//     height: PersonHeight
//   }
//   input PersonInput {
//     height: PersonHeight
//   }`

//   const context = newContext()
//   await testConversion(test, personType, 'Person', expectedType, context)
// })

// test('Enumeration attribute with comparison symbols', async () => {
//   const personType = {
//     $id: 'Comparator',
//     type: 'object',
//     properties: {
//       operator: {
//         type: 'string',
//         enum: ['<', '<=', '>=', '>'],
//       },
//     },
//   }

//   const expectedType = `
//   enum ComparatorOperator {
//     LT, LTE, GTE, GT
//   }
//   type Comparator {
//     operator: ComparatorOperator
//   }
//   input ComparatorInput {
//     operator: ComparatorOperator
//   }`

//   const context = newContext()
//   await testConversion(
//     test,
//     personType,
//     'Comparator',
//     expectedType,
//     context
//   )
// })

// test('Enumeration attribute with numeric keys', async () => {
//   const personType = {
//     $id: 'Person',
//     type: 'object',
//     properties: {
//       age: {
//         type: 'string',
//         enum: ['1', '10', '100'],
//       },
//     },
//   }

//   const expectedType = `
//   enum PersonAge {
//     VALUE_1, VALUE_10, VALUE_100
//   }
//   type Person {
//     age: PersonAge
//   }
//   input PersonInput {
//     age: PersonAge
//   }
//   `

//   const context = newContext()
//   await testConversion(test, personType, 'Person', expectedType, context)
// })

// test('Enumeration attribute with unsupported type', async () => {
//   const personType = {
//     $id: 'Person',
//     type: 'object',
//     properties: {
//       age: {
//         type: 'integer',
//         enum: [1, 2, 3],
//       },
//     },
//   }

//   const context = newContext()
//   const assertion = async () =>
//     testConversion(t, personType, 'Person', null, context)

//   await t.throwsAsync(
//     assertion,
//     'The attribute Person.age not supported because only conversion of string based enumerations are implemented'
//   )
// })

// test('Enumeration conversion function', async () => {
//   const personType = {
//     $id: 'Person',
//     type: 'object',
//     properties: {
//       age: {
//         type: 'string',
//         enum: ['1', '10', '100'],
//       },
//     },
//   }

//   const context = newContext()
//   const { output, input } = convert(context, personType)
//   // Make a schema an print it just to force the field 'thunks' to be resolved
//   const schema = makeSchemaForType(output, input)
//   printSchema(schema)

//   const convertCode = getConvertEnumFromGraphQLCode(context, 'Person.age')

//   const convertModule = await tmp.file()
//   await fs.writeFile(convertModule.fd, `module.exports = ${convertCode}`)
//   const fromGraphQl = require(convertModule.path)
//   is(fromGraphQl('VALUE_1'), '1')
//   is(fromGraphQl('VALUE_10'), '10')
//   is(fromGraphQl('VALUE_100'), '100')
// })

// test('map switch schemas to unions', async () => {
//   const parentType = {
//     $id: 'Parent',
//     type: 'object',
//     properties: {
//       type: {
//         type: 'string',
//       },
//       name: {
//         type: 'string',
//       },
//     },
//   }

//   const childType = {
//     $id: 'Child',
//     type: 'object',
//     properties: {
//       type: {
//         type: 'string',
//       },
//       name: {
//         type: 'string',
//       },
//       parent: {
//         $ref: 'Parent',
//       },
//       bestFriend: {
//         $ref: 'ParentOrChild',
//       },
//       friends: {
//         type: 'array',
//         items: {
//           $ref: 'ParentOrChild',
//         },
//       },
//     },
//   }

//   const unionType = {
//     $id: 'ParentOrChild',
//     switch: [
//       {
//         if: {
//           properties: {
//             type: {
//               constant: 'Parent',
//             },
//           },
//         },
//         then: {
//           $ref: 'Parent',
//         },
//       },
//       {
//         if: {
//           properties: {
//             type: {
//               constant: 'Child',
//             },
//           },
//         },
//         then: {
//           $ref: 'Child',
//         },
//       },
//     ],
//   }

//   const expectedType = `
//   type Parent {
//     name: String
//     type: String
//   }
//   type Child {
//     name: String
//     type: String
//     parent: Parent
//     bestFriend: ParentOrChild
//     friends: [ParentOrChild!]
//   }
//   union ParentOrChild = Parent | Child
//   input ParentInput {
//     name: String
//     type: String
//   }
//   input ChildInput {
//     name: String
//     type: String
//     parent: ParentInput
//   }
//   `

//   const context = newContext()
//   convert(context, unionType)
//   convert(context, parentType)
//   await testConversion(test, childType, 'Child', expectedType, context)
// })
