import _ from 'lodash'
import * as path from 'path'
import uppercamelcase from 'uppercamelcase'

export const getTypeName = (s: string | undefined): string => {
  if (_.isUndefined(s)) return ''
  return uppercamelcase(path.parse(s).name)
}
