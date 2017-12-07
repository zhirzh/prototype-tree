((root, factory) => {
  if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.flatten = factory();
  }
})(this, () => {
  /**
   * Parse `class` prototype chain.
   * @param {ClassNode} node
   * @param {function|null} Class
   * @returns Array<string>
   */
  function flatten(node, parent = '', ret = []) {
    const name = `${parent}|${node.name}`;

    // Since `flatten()` returns Array<string>, `ret.concat()` must un-roll nested arrays
    return ret.concat(name, ...node.children.map(c => flatten(c, name, ret)));
  }

  return flatten;
});
