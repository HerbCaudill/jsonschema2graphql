import { objectId } from './objectId'
import { valueRange } from './valueRange'

export const item = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'Item',
  title: 'Item',
  type: 'object',
  required: ['_id', 'name', 'icon', 'description', 'coinValue'],
  properties: {
    _id: objectId,

    name: {
      type: 'string',
      title: 'Name',
      description:
        'Name of the task (for earning coins) or activity (for spending coins).',
      examples: ['Walk dog'],
    },

    icon: {
      type: 'string',
      title: 'Icon',
      examples: ['dog'],
    },

    description: {
      type: 'string',
      title: 'Description',
      examples: [
        'Walk Bruno around the block, giving him enough time to pee at least twice and to poop.',
      ],
    },

    isTimed: {
      type: 'boolean',
      title: 'Timed?',
      description:
        'If true, the number of coins generated or consumed by this item depends of the number of minutes that it lasted. For example, screen time or reading time.',
    },

    coinValue: {
      type: 'integer',
      title: 'Coin value',
      description:
        'Value in coins of the given task or activity. If the activity is timed, this is the value of 10 minutes.',
    },

    coinValueRange: {
      ...valueRange,
      title: 'Range of coin values',
      description:
        'Minimum and maximum coin values that can be earned or spent for this item.',
    },
  },
}
