import { writeFileSync } from 'fs'

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(x, hi))
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
