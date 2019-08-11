import { writeFileSync } from 'fs'

function not(x: any) {
  return !x
}

function isConstructor(x: any): boolean {
  try {
    Reflect.construct(Object, [], x)
    return true
  } catch {
    return false
  }
}

class Ctor {
  name: string
  prototype: any

  constructor(constructor: Function, name?: string) {
    this.name = name || constructor.name
    this.prototype = constructor.prototype
  }
}

class Node {
  static id = 0

  id: number
  name: string
  children: Array<Node>

  constructor(name: string, children = [] as Array<Node>) {
    this.id = Node.id++
    this.name = name
    this.children = children
  }
}

function protoChain(x: object, name?: string): Array<string> {
  if (x === undefined) {
    return ['Proxy']
  }

  if (x === null) {
    return ['null']
  }

  const proto = Object.getPrototypeOf(x)

  return protoChain(proto).concat(name || x.constructor.name)
}

function sortTree(node: Node): Node {
  const children = node.children
    .map(child => sortTree(child))
    .sort((a, b) => a.name.localeCompare(b.name))

  return new Node(node.name, children)
}

const blacklist = [
  'Buffer',

  'console',
  'global',
  'GLOBAL',
  'globalThis',
  'process',
  'root',

  'WebAssembly/compile',
  'WebAssembly/instantiate',
  'WebAssembly/validate',

  'clearImmediate',
  'clearInterval',
  'clearTimeout',
  'setImmediate',
  'setInterval',
  'setTimeout',

  'queueMicrotask',
]

const globalCtors = Object.getOwnPropertyNames(global)
  .filter(k => {
    // @ts-ignore
    const x = global[k]

    return not(blacklist.includes(k)) && isConstructor(x)
  })
  .map(k => {
    // @ts-ignore
    const constructor = global[k]

    return new Ctor(constructor)
  })

const scopedCtors = Object.getOwnPropertyNames(global)
  .filter(k => {
    // @ts-ignore
    const x = global[k]

    return not(blacklist.includes(k)) && typeof x === 'object'
  })
  .map(k => {
    // @ts-ignore
    const x = global[k]

    return Object.getOwnPropertyNames(x)
      .filter(kk => {
        // @ts-ignore
        const xx = x[kk]

        const name = `${k}/${kk}`

        return not(blacklist.includes(name)) && isConstructor(xx)
      })
      .map(kk => {
        const xx = x[kk]

        const name = `${k}/${kk}`

        return new Ctor(xx, name)
      })
  })
  .flat()

const hiddenCtors = [
  async function() {},

  // @ts-ignore
  function*() {},

  // @ts-ignore
  async function*() {},
].map(x => new Ctor(x.constructor))

const tree = new Node('ROOT')

const ctors = ([] as Array<Ctor>)
  .concat(globalCtors)
  .concat(scopedCtors)
  .concat(hiddenCtors)

ctors.forEach(ctor => {
  let nodes = tree.children

  protoChain(ctor.prototype, ctor.name).forEach(name => {
    let node = nodes.find(node => node.name === name)

    if (node === undefined) {
      node = new Node(name)
      nodes.push(node)
    }

    nodes = node.children
  })
})

writeFileSync('ctors.json', JSON.stringify(sortTree(tree).children, null, 4))
