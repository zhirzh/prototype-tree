/* global flatten, globalObjectNames, parse, prune */

const data = {
  name: 'null',
  children: [],
};

globalObjectNames
  .map(name => window[name])
  .filter(obj => typeof obj === 'function' && obj.prototype !== undefined)
  .forEach(Class => parse(data, Class));

prune(data);

window.flatData = JSON.stringify(flatten(data).sort());
