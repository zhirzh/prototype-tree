import { writeFileSync } from 'fs'

export function not(x: any): boolean {
  return !x
}

export function isConstructor(x: any): boolean {
  try {
    Reflect.construct(Object, [], x)
    return true
  } catch {
    return false
  }
}

export function writeJSON(path: string, data: unknown, minify = false) {
  writeFileSync(path, minify ? JSON.stringify(data) : JSON.stringify(data, null, 3))
}
