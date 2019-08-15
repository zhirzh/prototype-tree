import { writeFileSync } from 'fs'
import { parseModule, pruneTree, sortTree, trees } from './parse-ctors'

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
]

parseModule(undefined, blacklist)

trees.forEach(tree => {
  pruneTree(tree, ['ctor', 'depth'])
  sortTree(tree)
})

writeFileSync('ctors.core.json', JSON.stringify(trees, null, 4))
