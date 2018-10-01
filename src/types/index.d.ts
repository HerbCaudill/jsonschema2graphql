import { JSONSchema7 } from 'json-schema'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
  GraphQLFieldConfig,
} from 'graphql'

export type TypeMap = Map<string, GraphQLType>
// export type FieldDictionary = _.Dictionary<GraphQLFieldConfig<string, GraphQLType>>

export type EntryPointBuilder = (
  types: TypeMap
) => {
  query: GraphQLObjectType
  mutation?: GraphQLObjectType
  subscription?: GraphQLObjectType
}

export interface ConvertParams {
  jsonSchema: JSONSchema7 | JSONSchema7[] | string | string[]
  entryPoints?: EntryPointBuilder
}
