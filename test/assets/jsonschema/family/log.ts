import { pattern } from './pattern'

export const log = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: '#/Log',
  type: 'object',
  title: 'Log',
  description: 'Records an activity that takes place on a specific date, along with the coins earned or spent. ',
  required: ['_id', 'item_id', 'coins', 'date'],
  properties: {
    _id: {
      $ref: '#/ObjectId',
    },

    item_id: {
      title: 'Item ID',
      // description: 'Reference to the Item being earned or spent in this log entry',
      $ref: '#/ObjectId',
    },

    coins: {
      type: 'number',
      title: 'Coins',
      description: 'Actual number of coins earned or spent. Might be determined automatically or entered manually.',
    },

    date: {
      type: 'string',
      title: 'Date',
      description: 'The date on which the activity took place.',
      pattern: pattern.DATE,
      examples: ['2018-09-23'],
    },

    time: {
      type: 'string',
      title: 'Time',
      description: '(Non-timed items only.) The time at which the activity took place.',
      examples: ['13:45'],
      pattern: pattern.TIME,
    },

    timeRange: {
      $ref: '#/TimeRange',
      title: 'Time range',
      description: '(Timed items only.) The times at which the activity started and ended.',
    },

    minutes: {
      type: 'integer',
      title: 'Minutes',
      description: '(Timed items only.) The number of minutes between the start and end time.',
    },

    isManualEntry: {
      type: 'boolean',
      title: 'Manual entry?',
      description:
        'If true, the time(s) for this log were entered or edited manually (as opposed to being the moment that the item was logged, or the moments that Start and Stop were pressed.',
    },

    approval: {
      $ref: '#/Approval',
      title: 'Approval',
      description: 'A record of the activity having been reviewed by a parent and either approved or rejected.',
    },
  },
}
