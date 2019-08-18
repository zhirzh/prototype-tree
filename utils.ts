import { writeFileSync } from 'fs'

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(x, hi))
}

export function className(classNames: Array<string | false>): string {
  return classNames.filter(Boolean).join(' ')
}

export function escapeRegExp(string: string): string {
  return string.trim().replace(/[.*+?^${}()|[\]\\]/g, '')
}

export function isConstructor(x: any): boolean {
  try {
    Reflect.construct(Object, [], x)
    return true
  } catch {
    return false
  }
}

export function not(x: any): boolean {
  return !x
}

export function writeJSON(path: string, data: unknown, minify = false): void {
  writeFileSync(path, minify ? JSON.stringify(data) : JSON.stringify(data, null, 3))
}

function flat(xs: Array<any>, depth: number = 1): Array<any> {
  return depth < 1 ? xs.slice() : flat([].concat(...xs), depth - 1)
}

Array.prototype.flat =
  Array.prototype.flat ||
  function(depth: number) {
    // @ts-ignore
    return flat(this, depth)
  }
