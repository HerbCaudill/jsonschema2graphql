import { pattern } from './pattern'

export const log = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'Log',
  type: 'object',
  title: 'Log',
  required: ['_id', 'item_id', 'coins', 'date'],
  properties: {
    _id: {
      $ref: 'ObjectId',
    },

    item_id: {
      // title: 'Item ID',
      // description: 'Reference to the Item being earned or spent in this log entry',
      $ref: 'ObjectId',
    },

    coins: {
      type: 'number',
      title: 'Coins',
    },

    date: {
      type: 'string',
      title: 'Date',
      pattern: pattern.DATE,
      examples: ['2018-09-23'],
    },

    time: {
      type: 'string',
      title: 'Time',
      examples: ['13:45'],
      pattern: pattern.TIME,
    },

    timeRange: {
      $ref: 'TimeRange',
    },

    minutes: {
      type: 'integer',
      title: 'Minutes',
    },

    isManualEntry: {
      type: 'boolean',
      title: 'Manual entry?',
      description:
        'If true, the time(s) for this log were entered or edited manually (as opposed to being the moment that the item was logged, or the moments that Start and Stop were pressed.',
    },

    approval: {
      $ref: 'Approval',
    },
  },
}
