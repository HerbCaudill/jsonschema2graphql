import { GraphQLObjectType, GraphQLSchema } from 'graphql'

export default function makeSchemaForType(output, input): GraphQLSchema {
  const queryType = new GraphQLObjectType({
    fields: {
      findOne: { type: output },
    },
    name: 'Query',
  })
  const mutationType = input
    ? new GraphQLObjectType({
        fields: {
          create: {
            args: { input: { type: input } },
            type: output,
          },
        },
        name: 'Mutation',
      })
    : undefined
  return new GraphQLSchema({
    mutation: mutationType,
    query: queryType,
  })
}
