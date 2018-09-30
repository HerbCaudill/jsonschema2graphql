export const family = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'Family',
  title: 'Family',
  type: 'object',
  required: ['_id', 'name', 'users', 'items'],
  properties: {
    _id: { $ref: 'ObjectId' },

    name: {
      type: 'string',
      title: 'Name',
      description: 'Name of the family. Typically one or two last names.',
      examples: ['Caudill', 'Smith', 'Gonzalez'],
    },

    users: {
      type: 'array',
      title: 'Users',
      items: {
        $ref: 'User',
      },
    },

    items: {
      type: 'array',
      title: 'Items',
      items: {
        $ref: 'Item',
      },
    },
  },
}
