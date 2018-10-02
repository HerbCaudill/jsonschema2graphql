import { GraphQLObjectType, GraphQLType } from 'graphql'
import { JSONSchema7 } from 'json-schema'

declare namespace jsonschema2graphql {
  export interface GraphQLTypeMap {
    [name: string]: GraphQLType
  }

  export type EntryPointBuilder = (
    types: GraphQLTypeMap
  ) => {
    query: GraphQLObjectType
    mutation?: GraphQLObjectType
    subscription?: GraphQLObjectType
  }

  export interface ConvertParams {
    jsonSchema: JSONSchema7 | JSONSchema7[] | string | string[]
    entryPoints?: EntryPointBuilder
  }
}

export = jsonschema2graphql
