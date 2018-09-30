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

export type QueryBlockBuilder = (
  types: Map<string, GraphQLType>
) => _.Dictionary<GraphQLFieldConfig<string, GraphQLType>>

export interface ConvertParams {
  jsonSchema: JSONSchema7 | JSONSchema7[] | string | string[]
  queryBlockBuilder?: QueryBlockBuilder
}
