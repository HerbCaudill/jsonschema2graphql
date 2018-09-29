import test from 'ava'
import { printSchema } from 'graphql'
import convert from './convert'

const PERSON = {
  $id: 'person',
  title: 'Person',
  type: 'object',
  properties: {
    name: {
      type: 'string',
    },
    age: {
      type: 'integer',
    },
  },
}

test('simple object', t => {
  t.plan(1)

  const schema = printSchema(convert(PERSON))
  // tslint:disable-next-line:no-console
  // console.log(schema)
  return t.is(
    schema,
    `type Query {
  _empty: String
}
`
  )
})
