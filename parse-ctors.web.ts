import { parseModule, pruneTree, sortTree, trees } from './parse-ctors'

const blacklist = [
  // iframe parent
  /^parent\./,

  // timer methods
  /^(set|clear)(Immediate|Interval|Timeout)$/,

  // constructors with no name
  /(::|\.)$/,

  // constructors with name starting with underscore, lowercase
  /(::|\.)(?!null)(_|[a-z])/,
]

export function parse(global: object) {
  parseModule(global, blacklist)

  trees.forEach(tree => {
    pruneTree(tree, ['ctor', 'depth'])
    sortTree(tree)
  })

  return trees
}
