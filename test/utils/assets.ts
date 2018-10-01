import * as fs from 'fs-extra'
import * as path from 'path'

export const readFile = (filePath: string) => {
  const qualifiedFilePath = path.join(__dirname, filePath)
  return fs.readFileSync(qualifiedFilePath, 'utf8')
}

export const readAsset = (fileName: string): any => {
  const result = readFile(`../assets/${fileName}`)
  if (fileName.endsWith('json')) return JSON.parse(result)
  else return result
}
export const readAssetDirectory = (dirPath: string) => {
  const qualifiedDirPath = path.join(__dirname, '../assets/', dirPath)
  const dirFiles = fs.readdirSync(qualifiedDirPath)
  return dirFiles.map((f: string) => readAsset(dirPath + f))
}
