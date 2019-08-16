import { parseModule, pruneTree, sortTree, trees } from './parse-ctors'
import { writeJSON } from './utils'

const blacklist = [
  // node globals
  /^queueMicrotask$/,
  /^console\.Console$/,
  /^Buffer$/,

  // timer methods
  /^(set|clear)(Immediate|Interval|Timeout)$/,

  // constructors with no name
  /(::|\.)$/,

  // constructors with name starting with underscore, lowercase
  /(::|\.)(?!null)(_|[a-z])/,

  // modules with name starting with underscore
  /^_/,
]

parseModule(global, blacklist)

require('module').builtinModules.forEach((modName: string) => {
  parseModule(modName, require(modName), blacklist)
})

trees.forEach(tree => {
  pruneTree(tree, ['ctor', 'depth'])
  sortTree(tree)
})

writeJSON('ctors.node.json', trees, process.env.NODE_ENV === 'production')
