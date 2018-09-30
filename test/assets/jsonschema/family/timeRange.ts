import { pattern } from './pattern'

export const timeRange = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'TimeRange',
  type: 'object',
  title: 'Time range',
  properties: {
    start: {
      type: 'string',
      title: 'Start',
      pattern: pattern.TIME,
    },
    end: {
      type: 'string',
      title: 'End',
      pattern: pattern.TIME,
    },
  },
}
