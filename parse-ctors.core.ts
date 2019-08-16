import { parseModule, pruneTree, sortTree, trees } from './parse-ctors'
import { writeJSON } from './utils'
console.log(process.env.NODE_ENV);

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

parseModule(global, blacklist)

trees.forEach(tree => {
  pruneTree(tree, ['ctor', 'depth'])
  sortTree(tree)
})

writeJSON('ctors.core.json', trees, process.env.NODE_ENV === 'production')
