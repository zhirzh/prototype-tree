export function not(x: any) {
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

export function className(classes: Array<string | false>) {
  return classes.filter(Boolean).join(' ')
}
