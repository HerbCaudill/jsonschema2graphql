import { log } from './log'
import { objectId } from './objectId'
import { email } from './email'

export const user = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'User',
  title: 'User',
  type: 'object',
  required: ['_id', 'email', 'name'],
  properties: {
    _id: objectId,

    email: email,

    name: {
      type: 'string',
      title: 'Name',
      description:
        'This is the name that will be displayed to the user themselves.',
      examples: ['Herb'],
    },

    nickname: {
      type: 'string',
      title: 'Nickname',
      description:
        'This is the name that will be displayed to children using the app.',
      examples: ['Daddy-O'],
    },

    isParent: {
      type: 'boolean',
      title: 'Parent?',
      description:
        'If true, this user has elevated privileges in this family.',
    },

    log: {
      type: 'array',
      title: 'Users',
      items: log,
    },
  },
}
