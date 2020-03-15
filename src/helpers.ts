import camelcase from 'camelcase'
import { GraphQLList, GraphQLObjectType, GraphQLType } from 'graphql'
import pluralize from 'pluralize'

import { EntryPointBuilder } from './@types'

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
