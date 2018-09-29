import Ajv from 'ajv'
import { GraphQLObjectType, GraphQLSchema } from 'graphql'
import { convert, newContext } from './converter'

const objectify = (m: Map<any, any>): any =>
  // tslint:disable-next-line
  [...m.entries()].reduce((o, [k, v]) => ((o[k] = v), o), {})

export default function _convert(jsonSchema: any): GraphQLSchema {
  const ajv = new Ajv({ schemaId: '$id' })
  ajv.addSchema(jsonSchema)
  // TODO: throw any validation errors

  const context = newContext()
  convert(context, jsonSchema)

  const types = objectify(context.types)
  const schema = {
    ...types,
    query: new GraphQLObjectType({
      name: 'Query',
      fields: {
        findPerson: { type: types.person },
      },
    }),
  }

  return new GraphQLSchema(schema)
}
