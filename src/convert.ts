import Ajv from 'ajv'
import camelcase from 'camelcase'
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
} from 'graphql'
import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'
import pluralize from 'pluralize'
import * as R from 'ramda'
import uppercamelcase from 'uppercamelcase'
import { esMapToObject } from './utils/esMapToObject'

import { QueryBlockBuilder, ConvertParams } from './types'

const err = (msg: string, propName?: string | null): Error =>
  new Error(
    `jsonschema2graphql: ${propName ? `Couldn't convert property ${propName}. ` : ''}${msg}`
  )

/** Turns an enum key from JSON schema into one that is safe for GraphQL. */
function graphqlSafeEnumKey(value: string): string {
  const trim = (s: string) => s.trim()
  const isNum = (s: string): boolean => /^[0-9]/.test(s)
  const safeNum = (s: string): string => (isNum(s) ? `VALUE_${s}` : s)
  const convertComparators = (s: string): string =>
    ({
      '<': 'LT',
      '<=': 'LTE',
      '>=': 'GTE',
      '>': 'GT',
    }[s] || s)
  const sanitize = (s: string) => s.replace(/[^_a-zA-Z0-9]/g, '_')

  return R.compose(
    sanitize,
    convertComparators,
    safeNum,
    trim
  )(value)
}

/** Maps basic JSON schema types to basic GraphQL types */
const BASIC_TYPE_MAPPING = {
  string: GraphQLString,
  integer: GraphQLInt,
  number: GraphQLFloat,
  boolean: GraphQLBoolean,
}

/** This generates the default `Query` block of the schema. */
const DEFAULT_QUERY: QueryBlockBuilder = types => {
  return [...types.entries()].reduce(
    (prevResult: any, [typeName, type]: [string, GraphQLType]) => ({
      ...prevResult,
      [camelcase(pluralize(typeName))]: { type: new GraphQLList(type) },
    }),
    new Map()
  )
}

/**
 * @param jsonSchema - An individual schema or an array of schemas, provided
 * either as Javascript objects or as JSON text.
 *
 * @param queryBlockBuilder - By default, each type gets a query field that returns
 * an array of that type. So for example, if you have an `Person` type and a
 * `Post` type, you'll get a query that looks like this:
 *
 * ```graphql
 *    type Query {
 *      people: [Person]
 *      posts: [Posts]
 *    }
 * ```
 *
 * (Note that the name of the query is pluralized using the
 * [pluralize](https://github.com/blakeembrey/pluralize) library.)
 *
 * To override this behavior, provide a `queryBlockBuilder` callback that takes
 * a Map of types and returns a hash of `GraphQLFieldConfig`s.
 */
export default function convert({
  jsonSchema,
  queryBlockBuilder = DEFAULT_QUERY,
}: ConvertParams): GraphQLSchema {
  // globals
  const types: Map<string, GraphQLType> = new Map()
  const enumTypes: Map<string, GraphQLEnumType> = new Map()
  const enumMaps: Map<string, _.Dictionary<string>> = new Map()

  // coerce input to array of schema objects
  const schemaArray: JSONSchema7[] = toArray(jsonSchema).map(toSchema)

  const ajv = new Ajv()
  schemaArray.forEach(schema => {
    ajv.validateSchema(schema) // validate against the json schema schema
    processSchema(schema) // pull out its types
  })

  return new GraphQLSchema({
    ...esMapToObject(types),
    query: new GraphQLObjectType({
      name: 'Query',
      fields: queryBlockBuilder(types),
    }),
  })

  function toArray(x: JSONSchema7 | JSONSchema7[] | string | string[]): any[] {
    return jsonSchema instanceof Array
      ? jsonSchema // already array
      : [jsonSchema] // single item -> array
  }

  function toSchema(x: JSONSchema7 | string): JSONSchema7 {
    return x instanceof Object
      ? x // already object
      : JSON.parse(x) // string -> object
  }

  function getDescription(d: any): string | undefined {
    if (d.title && d.description) return `${d.title}: ${d.description}`
    return d.title || d.description || undefined
  }

  function processSchema(schema: JSONSchema7): GraphQLType {
    const typeName = schema.$id
    if (typeof typeName === 'undefined') throw err('Schema does not have an `$id` property.')

    const type = mapType(typeName, schema)
    types.set(typeName, type)
    return type
  }

  function mapType(propName: string, prop: any): GraphQLType {
    const name = uppercamelcase(propName)
    const description = getDescription(prop)

    if (prop.oneOf) return buildUnionType(name, description, prop)

    if (prop.type === 'object') return buildObjectType(name, description, prop)

    if (prop.type === 'array') {
      const elementType = mapType(propName, prop.items)
      return new GraphQLList(new GraphQLNonNull(elementType))
    }

    if (prop.enum) {
      if (prop.type !== 'string') throw err(`Only string enums are supported.`, propName)
      const buildEnum = () => {
        const graphqlToJsonMap = _.keyBy(prop.enum, graphqlSafeEnumKey)
        const values = _.mapValues(graphqlToJsonMap, value => ({ value }))
        const enumType = new GraphQLEnumType({ name, description, values })
        enumMaps.set(propName, graphqlToJsonMap)
        enumTypes.set(propName, enumType)
        return enumType
      }
      const existingType = enumTypes.get(propName)
      return existingType ? existingType : buildEnum()
    }

    const typeRef = prop.$ref
    if (typeRef) {
      const type = types.get(typeRef)
      if (!type) throw err(`The referenced type ${typeRef} is unknown.`, propName)
      return type
    }

    const type = BASIC_TYPE_MAPPING[prop.type]
    if (type) return type

    throw err(`The type ${prop.type} on property ${propName} is unknown.`)
  }

  function buildFields(parentTypeName: string, schema: any): any {
    return !_.isEmpty(schema.properties)
      ? _.mapValues(schema.properties, (prop, propKey) => {
          const qualifiedPropName = `${parentTypeName}.${propKey}`
          const type = mapType(qualifiedPropName, prop)
          const isRequired = _.includes(schema.required, propKey)
          return {
            type: isRequired ? new GraphQLNonNull(type) : type,
            description: getDescription(prop),
          }
        })
      : // GraphQL doesn't allow types with no fields, so put a placeholder
        { _empty: { type: GraphQLString } }
  }

  function buildObjectType(
    name: string,
    description: string | undefined,
    schema: any
  ): GraphQLObjectType {
    const fields = () => buildFields(name, schema)
    return new GraphQLObjectType({ name, description, fields })
  }

  function buildUnionType(
    name: string,
    description: string | undefined,
    schema: any
  ): GraphQLUnionType {
    const types = () =>
      _.map(
        schema.oneOf,
        (switchCase, caseIndex) =>
          mapType(`${name}.oneOf[${caseIndex}]`, switchCase.then) as GraphQLObjectType
      )
    return new GraphQLUnionType({ name, description, types })
  }
}
