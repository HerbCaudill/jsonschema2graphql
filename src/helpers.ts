import camelcase from 'camelcase'
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
} from 'graphql'
import pluralize from 'pluralize'

import { EntryPointBuilder } from './types'

/** Maps basic JSON schema types to basic GraphQL types */
export const BASIC_TYPE_MAPPING = {
  string: GraphQLString,
  integer: GraphQLInt,
  number: GraphQLFloat,
  boolean: GraphQLBoolean,
}

/** This generates the default `Query` block of the schema. */
export const DEFAULT_ENTRY_POINTS: EntryPointBuilder = types => ({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: Object.entries(types).reduce(
      (prevResult: any, [typeName, type]: [string, GraphQLType]) => ({
        ...prevResult,
        [camelcase(pluralize(typeName))]: { type: new GraphQLList(type) },
      }),
      new Map()
    ),
  }),
})

export const err = (msg: string, propName?: string | null): Error =>
  new Error(`jsonschema2graphql: ${propName ? `Couldn't convert property ${propName}. ` : ''}${msg}`)
