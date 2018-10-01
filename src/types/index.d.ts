import { GraphQLObjectType, GraphQLType } from 'graphql'
import { JSONSchema7 } from 'json-schema'

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
