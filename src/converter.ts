import camelcase from 'camelcase'
import escodegen from 'escodegen'
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
  GraphQLString,
  GraphQLType,
  GraphQLUnionType,
} from 'graphql'
import _ from 'lodash'
import uppercamelcase from 'uppercamelcase'

export const INPUT_SUFFIX = 'Input'
const DROP_ATTRIBUTE_MARKER = Symbol('A marker to drop the attributes')

export interface Context {
  readonly types: Map<string, GraphQLType>
  readonly inputs: Map<string, GraphQLInputType>
  readonly enumTypes: Map<string, GraphQLEnumType>
  readonly enumMaps: Map<string, _.Dictionary<string>>
}

export interface InputOutput {
  readonly input: GraphQLInputObjectType | undefined
  readonly output: GraphQLType
}

function mapBasicAttributeType(
  type: string,
  attributeName: string
): GraphQLType {
  switch (type) {
    case 'string':
      return GraphQLString
    case 'integer':
      return GraphQLInt
    case 'number':
      return GraphQLFloat
    case 'boolean':
      return GraphQLBoolean
    default:
      throw new Error(
        `A JSON Schema attribute type ${type} on attribute ${attributeName} does not have a known GraphQL mapping`
      )
  }
}

function toSafeEnumKey(value: string): string {
  const valueWithPrevix = /^[0-9]/.test(value) ? 'VALUE_' + value : value

  switch (valueWithPrevix) {
    case '<':
      return 'LT'
    case '<=':
      return 'LTE'
    case '>=':
      return 'GTE'
    case '>':
      return 'GT'
    default:
      return valueWithPrevix.replace(/[^_a-zA-Z0-9]/g, '_')
  }
}

function buildEnumType(
  context: Context,
  attributeName: string,
  enumValues: string[]
): GraphQLEnumType {
  const enumName = uppercamelcase(attributeName)
  const graphqlToJsonMap = _.keyBy(enumValues, toSafeEnumKey)

  context.enumMaps.set(attributeName, graphqlToJsonMap)
  const enumType = new GraphQLEnumType({
    name: enumName,
    values: _.mapValues(graphqlToJsonMap, value => ({ value })),
  })

  context.enumTypes.set(attributeName, enumType)
  return enumType
}

function mapType(
  context: Context,
  attributeDefinition: any,
  attributeName: string,
  isInputType: boolean = false
): GraphQLType | symbol {
  if (attributeDefinition.type === 'array') {
    const elementType = mapType(
      context,
      attributeDefinition.items,
      attributeName,
      isInputType
    )
    if (typeof elementType === 'symbol') {
      if (elementType === DROP_ATTRIBUTE_MARKER) {
        return DROP_ATTRIBUTE_MARKER
      } else {
        throw new Error('') // TODO Can't happen - keeping TS happy
      }
    }
    return new GraphQLList(new GraphQLNonNull(elementType))
  }

  const enumValues = attributeDefinition.enum
  if (enumValues) {
    if (attributeDefinition.type !== 'string') {
      throw new Error(
        `The attribute ${attributeName} not supported because only conversion of string based enumerations are implemented`
      )
    }

    const existingEnum = context.enumTypes.get(attributeName)
    if (existingEnum) {
      return existingEnum
    }
    return buildEnumType(context, attributeName, enumValues)
  }

  const typeReference = attributeDefinition.$ref || attributeDefinition.$id
  if (typeReference) {
    const typeMap = isInputType ? context.inputs : context.types
    const referencedType = typeMap.get(typeReference)
    if (!referencedType) {
      if (
        context.types.get(typeReference) instanceof GraphQLUnionType &&
        isInputType
      ) {
        return DROP_ATTRIBUTE_MARKER
      }
      throw new UnknownTypeReference(
        `The referenced type ${typeReference} (${isInputType}) is unknown in ${attributeName}`
      )
    }
    return referencedType
  }

  return mapBasicAttributeType(attributeDefinition.type, attributeName)
}

function fieldsFromSchema(
  context: Context,
  parentTypeName: string,
  schema: any,
  isInputType: boolean = false
): any {
  if (_.isEmpty(schema.properties)) {
    return {
      _typesWithoutFieldsAreNotAllowed_: {
        type: GraphQLString,
      },
    }
  }

  const fields = _.mapValues(
    schema.properties,
    (attributeDefinition, attributeName) => {
      const qualifiedAttributeName = `${parentTypeName}.${attributeName}`
      const type = mapType(
        context,
        attributeDefinition,
        qualifiedAttributeName,
        isInputType
      )
      const modifiedType =
        typeof type !== 'symbol' &&
        _.includes(schema.required, attributeName)
          ? new GraphQLNonNull(type)
          : type
      return { type: modifiedType }
    }
  )

  const prunedFields = _.omitBy(fields, { type: DROP_ATTRIBUTE_MARKER })
  return prunedFields
}

function buildObjectType(
  context: Context,
  typeName: string,
  schema: any
): InputOutput {
  const output = new GraphQLObjectType({
    fields: () => fieldsFromSchema(context, typeName, schema),
    name: typeName,
  })

  const input = new GraphQLInputObjectType({
    fields: () => fieldsFromSchema(context, typeName, schema, true),
    name: typeName + INPUT_SUFFIX,
  })

  return { input, output }
}

function buildUnionType(
  context: Context,
  typeName: string,
  schema: any
): InputOutput {
  const types = () =>
    _.map(schema.switch, (switchCase, caseIndex) => {
      const result = mapType(
        context,
        switchCase.then,
        `${typeName}.switch[${caseIndex}]`
      )
      if (!(result instanceof GraphQLObjectType)) {
        throw new Error('') // Shouldn't happen - keeping TS happy
      }
      return result
    })
  const output = new GraphQLUnionType({
    name: typeName,
    types,
  })

  return { output, input: undefined }
}

export function converter(context: Context, schema: any): InputOutput {
  const typeName = schema.$id

  const typeBuilder = schema.switch ? buildUnionType : buildObjectType
  const { input, output } = typeBuilder(context, typeName, schema)

  context.types.set(typeName, output)
  if (input) {
    context.inputs.set(typeName, input)
  }

  return { output, input }
}

export function newContext(): Context {
  return {
    enumMaps: new Map(),
    enumTypes: new Map(),
    inputs: new Map(),
    types: new Map(),
  }
}

export class UnknownTypeReference extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnknownTypeReference'
  }
}

export function getConvertEnumFromGraphQLCode(
  context: Context,
  attributePath: string
): any {
  const valueMap = context.enumMaps.get(attributePath)

  const cases = _.map(valueMap, (jsonValue, graphQlValue) => ({
    consequent: [
      {
        argument: { type: 'Literal', value: jsonValue },
        type: 'ReturnStatement',
      },
    ],
    test: { type: 'Literal', value: graphQlValue },
    type: 'SwitchCase',
  }))

  const functionName = camelcase(`convert${attributePath}FromGraphQL`)

  const valueIdentifier = { type: 'Identifier', name: 'value' }
  return escodegen.generate({
    body: {
      body: [
        {
          cases,
          discriminant: valueIdentifier,
          type: 'SwitchStatement',
        },
      ],
      type: 'BlockStatement',
    },
    id: { type: 'Identifier', name: functionName },
    params: [valueIdentifier],
    type: 'FunctionDeclaration',
  })
}
