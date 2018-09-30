import { pattern } from './pattern'
import { objectId } from './objectId'

export const approval = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'Approval',
  title: 'Approval',
  type: 'object',
  description:
    'If this field element and the `approved` value is `true`, the log entry was reviewed and approved by a parent. ',
  required: ['user_id', 'timeStamp', 'approved'],
  properties: {
    user_id: {
      // title: 'User ID',
      // description: 'Reference to the User making the approval',
      $ref: 'ObjectId',
    },
    timeStamp: {
      type: 'string',
      title: 'Timestamp',
      description: 'Date and time that the approval was made',
      examples: ['2018-09-23T13:45'],
      pattern: pattern.DATETIME,
    },
    approved: {
      type: 'boolean',
      title: 'Approved',
    },
  },
}
