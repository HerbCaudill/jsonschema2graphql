export const valueRange = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: '#/ValueRange',
  type: 'object',
  title: 'Value Range',
  properties: {
    min: {
      name: 'Minimum',
      type: 'number',
    },
    max: {
      name: 'Maximum',
      type: 'number',
    },
  },
}
