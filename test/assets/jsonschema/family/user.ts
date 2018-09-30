export const user = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'User',
  title: 'User',
  description:
    'Represents a single user (parent or child) and, in the case of a child, their full history.',
  type: 'object',
  required: ['_id', 'email', 'name'],
  properties: {
    _id: {
      $ref: 'ObjectId',
    },

    email: {
      $ref: 'Email',
    },

    name: {
      type: 'string',
      title: 'Name',
      description: 'This is the name that will be displayed to the user themselves.',
      examples: ['Herb'],
    },

    nickname: {
      type: 'string',
      title: 'Nickname',
      description: 'This is the name that will be displayed to children using the app.',
      examples: ['Daddy-O'],
    },

    isParent: {
      type: 'boolean',
      title: 'Parent?',
      description: 'If true, this user has elevated privileges in this family.',
    },

    logs: {
      type: 'array',
      title: 'Users',
      description:
        '(Child only.) All of the historical activity (tasks performed, rewards earned) associated with this child.',
      items: {
        $ref: 'Log',
      },
    },
  },
}
