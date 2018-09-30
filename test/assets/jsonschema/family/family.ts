export const family = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'Family',
  title: 'Family',
  description: 'Represents a single family account and all its data.',
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
      description: 'All users (parents and children) associated with the family.',
      items: {
        $ref: 'User',
      },
    },

    items: {
      type: 'array',
      title: 'Items',
      description: 'The tasks and rewards defined by this family.',
      items: {
        $ref: 'Item',
      },
    },
  },
}
