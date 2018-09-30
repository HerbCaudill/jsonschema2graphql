import { pattern } from './pattern'
export const email = {
  $id: 'Email',
  type: 'string',
  name: 'Email address',
  description: 'RFC5322-compliant email address',
  examples: ['herb@devresults.com'],
  pattern: pattern.EMAIL,
}
