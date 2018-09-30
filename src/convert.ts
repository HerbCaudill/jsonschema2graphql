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

const err = (msg: string, propName?: string | null): Error =>
  new Error(
    `jsonschema2graphql: ${propName ? `Couldn't convert property ${propName}. ` : ''}${msg}`
  )

function sanitizeEnumKey(value: string): string {
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

const BASIC_TYPE_MAPPING = {
  string: GraphQLString,
  integer: GraphQLInt,
  number: GraphQLFloat,
  boolean: GraphQLBoolean,
}

const DEFAULT_QUERY_FIELD_REDUCER = (prevResult: any, [typeName, type]: [string, GraphQLType]) => ({
  ...prevResult,
  [camelcase(pluralize(typeName))]: { type: new GraphQLList(type) },
})

interface Params {
  jsonSchema: JSONSchema7 | JSONSchema7[] | string | string[]
  queryFieldReducer?: ((prevResult: any, [typeName, type]: [string, GraphQLType]) => any)
}

export default function convert({
  jsonSchema,
  queryFieldReducer = DEFAULT_QUERY_FIELD_REDUCER,
}: Params): GraphQLSchema {
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
      fields: [...types.entries()].reduce(queryFieldReducer, new Map()),
    }),
  })

  //
  //

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

  function getDescription(d: any): string {
    return ''
  }

  function processSchema(schema: JSONSchema7): GraphQLType {
    const typeName = schema.$id
    const description = getDescription(schema)

    if (typeof typeName === 'undefined') throw err('Schema does not have an `$id` property.')

    const typeBuilder = schema.oneOf ? buildUnionType : buildObjectType
    const type = typeBuilder(typeName, description, schema)
    types.set(typeName, type)
    return type
  }

  function mapType(propName: string, prop: any): GraphQLType {
    const name = uppercamelcase(propName)
    const description: string | undefined = prop.description

    if (prop.oneOf) {
      const type = buildUnionType(propName, description, prop)
    }

    if (prop.type === 'array') {
      const elementType = mapType(propName, prop.items)
      return new GraphQLList(new GraphQLNonNull(elementType))
    }

    if (prop.enum) {
      if (prop.type !== 'string') throw err(`Only string enums are supported.`, propName)
      const buildEnum = () => {
        const graphqlToJsonMap = _.keyBy(prop.enum, sanitizeEnumKey)
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
    return new GraphQLObjectType({
      name,
      description,
      fields: () => buildFields(name, schema),
    })
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
