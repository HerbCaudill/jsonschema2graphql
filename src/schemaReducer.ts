import Ajv from 'ajv'
import {
  GraphQLEnumType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
} from 'graphql'
import { JSONSchema7 } from 'json-schema'
import _ from 'lodash'
import R from 'ramda'
import uppercamelcase from 'uppercamelcase'

import { BASIC_TYPE_MAPPING, err } from './helpers'
import { GraphQLTypeMap } from './types'

export function schemaReducer(types: GraphQLTypeMap, schema: JSONSchema7) {
  new Ajv().validateSchema(schema) // validate against the json schema schema

  const typeName = schema.$id
  if (typeof typeName === 'undefined') throw err('Schema does not have an `$id` property.')

  const type = mapType(typeName, schema)
  types[typeName] = type
  return types

  function mapType(propName: string, prop: any): GraphQLType {
    const name = uppercamelcase(propName)
    const description = buildDescription(prop)

    // union?
    if (prop.oneOf) return buildUnionType(name, description, prop)

    // object?
    if (prop.type === 'object') return buildObjectType(name, description, prop)

    // array?
    if (prop.type === 'array') return buildArrayType(name, prop)

    // enum?
    if (prop.enum) return buildEnumType(name, description, prop)

    // ref?
    if (prop.$ref) return buildRefType(name, prop)

    // basic?
    if (BASIC_TYPE_MAPPING[prop.type]) return BASIC_TYPE_MAPPING[prop.type]

    // ¯\_(ツ)_/¯
    throw err(`The type ${prop.type} on property ${name} is unknown.`)
  }

  function buildUnionType(name: string, description: string | undefined, schema: any): GraphQLUnionType {
    const types = () =>
      _.map(
        schema.oneOf,
        (switchCase, caseIndex) => mapType(`${name}.oneOf[${caseIndex}]`, switchCase.then) as GraphQLObjectType
      )
    return new GraphQLUnionType({ name, description, types })
  }

  function buildObjectType(name: string, description: string | undefined, schema: any): GraphQLObjectType {
    const fields = () =>
      !_.isEmpty(schema.properties)
        ? _.mapValues(schema.properties, (prop, propKey) => {
            const qualifiedPropName = `${name}.${propKey}`
            const type = mapType(qualifiedPropName, prop) as GraphQLObjectType
            const isRequired = _.includes(schema.required, propKey)
            return {
              type: isRequired ? new GraphQLNonNull(type) : type,
              description: buildDescription(prop),
            }
          })
        : // GraphQL doesn't allow types with no fields, so put a placeholder
          { _empty: { type: GraphQLString } }
    return new GraphQLObjectType({ name, description, fields })
  }

  function buildArrayType(name: string, prop: any) {
    {
      const elementType = mapType(name, prop.items)
      return new GraphQLList(new GraphQLNonNull(elementType))
    }
  }

  function buildEnumType(name: string, description: string | undefined, prop: any) {
    {
      if (prop.type !== 'string') throw err(`Only string enums are supported.`, name)
      const graphqlToJsonMap = _.keyBy(prop.enum, graphqlSafeEnumKey)
      const values = _.mapValues(graphqlToJsonMap, value => ({ value }))
      const enumType = new GraphQLEnumType({ name, description, values })
      return enumType
    }
  }

  function buildRefType(name: string, prop: any) {
    {
      const type = types[prop.$ref]
      if (!type) throw err(`The referenced type ${prop.$ref} is unknown.`, name)
      return type
    }
  }
}

function buildDescription(d: any): string | undefined {
  if (d.title && d.description) return `${d.title}: ${d.description}`
  return d.title || d.description || undefined
}

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
