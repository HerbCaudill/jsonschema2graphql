import Ajv from 'ajv'
import camelcase from 'camelcase'
import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLInputType,
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

const INPUT_SUFFIX = 'Input'

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
  const inputs: Map<string, GraphQLInputType> = new Map()
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

  function processSchema(schema: JSONSchema7): InputOutput {
    const typeName = schema.$id
    if (typeof typeName === 'undefined') throw err('Schema does not have an `$id` property.')

    const typeBuilder = schema.oneOf ? buildUnionType : buildObjectType
    const { output, input } = typeBuilder(typeName, schema)

    types.set(typeName, output)
    if (input) inputs.set(typeName, input)

    return { output, input }
  }

  interface InputOutput {
    readonly input?: GraphQLInputObjectType
    readonly output: GraphQLType
  }

  function mapType(prop: any, propName: string, isInputType: boolean = false): GraphQLType {
    if (prop.type === 'array') {
      const elementType = mapType(prop.items, propName, isInputType)
      return new GraphQLList(new GraphQLNonNull(elementType))
    }

    if (prop.enum) {
      if (prop.type !== 'string') throw err(`Only string enums are supported.`, propName)
      const buildEnum = () => {
        const name = uppercamelcase(propName)
        const graphqlToJsonMap = _.keyBy(prop.enum, sanitizeEnumKey)
        const values = _.mapValues(graphqlToJsonMap, value => ({ value }))
        const enumType = new GraphQLEnumType({ name, values })
        enumMaps.set(propName, graphqlToJsonMap)
        enumTypes.set(propName, enumType)
        return enumType
      }
      const existingType = enumTypes.get(propName)
      return existingType ? existingType : buildEnum()
    }

    const typeRef = prop.$ref
    if (typeRef) {
      const typeMap = isInputType ? inputs : types
      const type = typeMap.get(typeRef)
      if (!type) throw err(`The referenced type ${typeRef} is unknown.`, propName)
      return type
    }

    const type = BASIC_TYPE_MAPPING[prop.type]
    if (type) return type

    throw err(`The type ${prop.type} on property ${propName} is unknown.`)
  }

  function buildFields(parentTypeName: string, schema: any, isInputType: boolean = false): any {
    return _.isEmpty(schema.properties)
      ? // GraphQL doesn't allow types with no fields, so put a placeholder
        { _empty: { type: GraphQLString } }
      : _.mapValues(schema.properties, (prop, propKey) => {
          const qualifiedPropKey = `${parentTypeName}.${propKey}`
          const type = mapType(prop, qualifiedPropKey, isInputType)
          const isRequired = _.includes(schema.required, propKey)
          return {
            type: isRequired ? new GraphQLNonNull(type) : type,
          }
        })
  }

  function buildObjectType(typeName: string, schema: any): InputOutput {
    const output = new GraphQLObjectType({
      fields: () => buildFields(typeName, schema),
      name: typeName,
    })
    const input = new GraphQLInputObjectType({
      fields: () => buildFields(typeName, schema, true),
      name: typeName + INPUT_SUFFIX,
    })
    return { input, output }
  }

  function buildUnionType(typeName: string, schema: any): InputOutput {
    const types = () =>
      _.map(schema.oneOf, (switchCase, caseIndex) => {
        const result = mapType(switchCase.then, `${typeName}.oneOf[${caseIndex}]`)
        if (!(result instanceof GraphQLObjectType)) throw new Error() // Can't happen - keeping TS happy
        return result
      })
    const output = new GraphQLUnionType({
      name: typeName,
      types,
    })
    return { output }
  }
}
