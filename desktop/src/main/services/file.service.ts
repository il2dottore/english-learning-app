import { readFile } from 'node:fs/promises'

export function readTextFile(filePath: string): Promise<string> {
  return readFile(filePath, 'utf8')
}
