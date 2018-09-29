// import { GraphQLObjectType, GraphQLSchema, GraphQLInputObjectType } from 'graphql'

// export default function makeSchemaForType(output: GraphQLObjectType, input: GraphQLInputObjectType): GraphQLSchema {
//   const queryType = new GraphQLObjectType({
//     fields: {
//       findOne: { type: output },
//     },
//     name: 'Query',
//   })
//   const mutationType = input
//     ? new GraphQLObjectType({
//         fields: {
//           create: {
//             args: { input: { type: input } },
//             type: output,
//           },
//         },
//         name: 'Mutation',
//       })
//     : undefined
//   return new GraphQLSchema({
//     mutation: mutationType,
//     query: queryType,
//   })
// }
