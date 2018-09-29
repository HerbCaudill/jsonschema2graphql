import Ajv from 'ajv'
import { GraphQLObjectType, GraphQLSchema, GraphQLList } from 'graphql'
import { converter, newContext } from './converter'
import pluralize from 'pluralize'

const objectify = (m: Map<any, any>): any =>
  [...m.entries()].reduce((o, [k, v]) => ((o[k] = v), o), {})

interface ConvertOptions {
  jsonSchema: any
  query?: GraphQLObjectType
}

const buildQueryObject = (types: any): GraphQLObjectType => {
  const fieldReducer = (prevResult: any, key: string) => ({
    [pluralize(key)]: { type: new GraphQLList(types[key]) },
    ...prevResult,
  })
  return new GraphQLObjectType({
    name: 'Query',
    fields: Object.keys(types).reduce(fieldReducer, {}),
  })
}
export default function convert({
  jsonSchema,
  query,
}: ConvertOptions): GraphQLSchema {
  const ajv = new Ajv()
  ajv.addSchema(jsonSchema)

  // TODO: throw any validation errors

  const context = newContext()
  converter(context, jsonSchema)
  const types = objectify(context.types)

  const queryObject = query ? query : buildQueryObject(types)

  const schema = {
    ...types,
    query: queryObject,
  }

  return new GraphQLSchema(schema)
}
