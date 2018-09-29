// import { INPUT_SUFFIX } from '../converter'
// import testConversion from './testConversion'

// export default async function testAttributeType(
//   test,
//   jsonType,
//   graphQLType,
//   options: any = {}
// ): Promise<void> {
//   const simpleType = {
//     $id: 'Simple',
//     type: 'object',
//     properties: {
//       attribute: { type: jsonType },
//     },
//   }

//   const expectedType = `
//   type Simple {
//     attribute: ${graphQLType}
//   }
  
//   input Simple${INPUT_SUFFIX} {
//     attribute: ${graphQLType}
//   }
//   `
//   return testConversion(
//     test,
//     simpleType,
//     'Simple',
//     expectedType,
//     undefined,
//     options
//   )
// }
