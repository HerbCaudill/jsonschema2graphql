export const item = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'Item',
  title: 'Item',
  description:
    'Represents a task (something that earns coins, e.g. walking the dog) or a reward (something that spends coins, e.g. screen time).',
  type: 'object',
  required: ['_id', 'name', 'icon', 'description', 'coinValue'],
  properties: {
    _id: {
      $ref: '#/definitions/ObjectId',
    },

    name: {
      type: 'string',
      // title: 'Name',
      description: 'Name of the task (for earning coins) or reward (for spending coins).',
      examples: ['Walk dog'],
    },

    icon: {
      type: 'string',
      // title: 'Icon',
      examples: ['dog'],
    },

    description: {
      type: 'string',
      // title: 'Description',
      description: 'Description of the task or reward.',
      examples: ['Walk Bruno around the block, giving him enough time to pee at least twice and to poop.'],
    },

    isTimed: {
      type: 'boolean',
      // title: 'Timed?',
      description:
        'If true, the number of coins generated or consumed by this item depends of the number of minutes that it lasted. For example, screen time or reading time.',
    },

    coinValue: {
      type: 'integer',
      // title: 'Coin value',
      description:
        'Value in coins of the given task or activity. If the activity is timed, this is the value of 10 minutes.',
    },

    coinValueRange: {
      $ref: '#/definitions/ValueRange',
      // title: 'Range of coin values',
      description: 'Minimum and maximum coin values that can be earned or spent for this item.',
    },
  },
  additionalProperties: false,
}
