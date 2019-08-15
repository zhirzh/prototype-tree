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
