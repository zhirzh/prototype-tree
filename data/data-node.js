const { writeFileSync } = require('fs');
const { join } = require('path');

const parse = require('./parse');
const prune = require('./prune');

const modNames = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'crypto',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
];

/**
 * Add module objects to global scope with module-scoped names.
 */
modNames.forEach((modName) => {
  const mod = require(modName);

  Object.getOwnPropertyNames(mod)
    .filter(propName => /[A-Z]/.test(propName[0]))
    .forEach((propName) => {
      const prop = mod[propName];

      if (typeof prop.name === 'string' && prop.name.length > 0) {
        prop.scopedName = `${prop.name}[${modName}]`;
      }

      global[`${propName}[${modName}]`] = prop;
    });
});

const globalObjectNames = Object.getOwnPropertyNames(global);

const data = {
  name: 'null',
  children: [],
};

globalObjectNames
  .map(name => global[name])
  .filter(obj => typeof obj === 'function' && obj.prototype !== undefined)
  .forEach(Class => parse(data, Class));

prune(data);

writeFileSync(join(__dirname, 'final', 'node.json'), JSON.stringify(data, null, 2));
