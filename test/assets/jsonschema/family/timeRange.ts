import { pattern } from './pattern'

export const timeRange = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: '#/TimeRange',
  type: 'object',
  title: 'Time range',
  description: 'Start and end times for an activity.',
  properties: {
    start: {
      type: 'string',
      title: 'Start time',
      pattern: pattern.TIME,
    },
    end: {
      type: 'string',
      title: 'End time',
      pattern: pattern.TIME,
    },
  },
}
