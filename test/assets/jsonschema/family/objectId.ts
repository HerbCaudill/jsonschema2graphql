import { pattern } from './pattern'
export const objectId = {
  $id: '#/ObjectId',
  type: 'string',
  name: 'MongoDb Object ID',
  description: '24-character hexadecimal identifier for MongoDb databases.',
  examples: ['000003e872fb9c6438ff230a'],
  pattern: pattern.HEX_24,
}
