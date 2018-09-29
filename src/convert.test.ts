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

test('simple object', () => {
  expect.assertions(1)

  const schema = printSchema(convert({ jsonSchema: PERSON }))
  return expect(schema).toEqualIgnoringWhitespace(`
    type person {
      name: String
      age: Int
    }

    type Query {
      people: [person]
    }`)
})
