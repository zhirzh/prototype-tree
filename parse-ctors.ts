import { isConstructor, not } from './utils'

type Ctor = Function | null

class Tree {
  constructor(
    public ctor: Ctor,
    public path: string,
    public depth: number,
    public children: Array<Tree> = []
  ) {}
}

export const trees: Array<Tree> = []

const visitedScopes = new Set()

function ctorChain(ctor: Function): Array<Ctor> {
  const prototype = ctor.prototype

  // Proxy
  if (prototype === undefined) {
    return [ctor]
  }

  const proto = Object.getPrototypeOf(prototype)

  // Object
  // Object.create(null)
  if (proto === null) {
    return [null, ctor]
  }

  return ctorChain(proto.constructor).concat(ctor)
}

function parse(scope: any, basePath: string, blacklist: Array<RegExp>) {
  if (scope === null || scope === undefined) {
    return
  }

  if (visitedScopes.has(scope)) {
    return
  }

  visitedScopes.add(scope)

  Object.getOwnPropertyNames(scope)
    .filter(k => not(['prototype', 'constructor'].includes(k)))
    .forEach(k => {
      const x = scope[k]

      if (isConstructor(x)) {
        let nodes = trees

        ctorChain(x).forEach((ctor, depth) => {
          const name = ctor === null ? 'null' : ctor.name
          const path = basePath + name

          if (blacklist.some(b => b.test(path))) {
            return
          }

          let node = nodes.find(node => node.ctor === ctor)

          if (node === undefined) {
            node = new Tree(ctor, path, depth)
            nodes.push(node)
          } else if (name === k || depth < node.depth) {
            node.path = path
          }

          nodes = node.children
        })
      }

      parse(x, basePath + k + '.', blacklist)
    })
}

export function pruneTree(node: Tree, keys: Array<keyof Tree>) {
  keys.forEach(k => {
    delete node[k]
  })

  node.children.forEach(child => {
    pruneTree(child, keys)
  })
}

export function sortTree(node: Tree) {
  node.children.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))

  node.children.forEach(child => {
    sortTree(child)
  })
}

export function parseModule(name: string | undefined, blacklist: Array<RegExp>) {
  const mod = name === undefined ? global : require(name)

  const path = name === undefined ? '' : name + '::'

  parse(mod, path, blacklist)
}
