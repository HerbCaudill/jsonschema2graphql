import Ajv from 'ajv'
import { buildSchema, execute, introspectionQuery, parse } from 'graphql'
import { Context, convert, INPUT_SUFFIX, newContext } from '../converter'
import canonicalize from './canonicalize'
import makeSchemaForType from './makeSchemaForType'

export default async function testConversion(
  test,
  jsonSchema,
  expectedTypeName,
  expectedType,
  context: Context = newContext(),
  options: any = {}
): Promise<void> {
  if (!options.skipValidation) {
    const ajv = new Ajv({ schemaId: '$id' })
    ajv.addSchema(jsonSchema)
  }
  const { output, input } = convert(context, jsonSchema)
  const schema = makeSchemaForType(
    output,
    options.skipInput ? undefined : input
  )
  const exepectedSchema = buildSchema(`
    ${expectedType}
    type Query {
      findOne: ${expectedTypeName}
    }

    ${
      options.skipInput
        ? ''
        : `
    type Mutation {
      create(input: ${expectedTypeName}${INPUT_SUFFIX}): ${expectedTypeName}
    }`
    }
  `)
  const introspection = await execute({
    schema,
    document: parse(introspectionQuery),
  })
  const expectedIntrospection = await execute({
    schema: exepectedSchema,
    document: parse(introspectionQuery),
  })
  return test.deepEqual(
    canonicalize(introspection),
    canonicalize(expectedIntrospection)
  )
}
