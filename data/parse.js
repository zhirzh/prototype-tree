((root, factory) => {
  if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.parse = factory();
  }
})(this, () => {
  /**
   * Parse `class` prototype chain.
   * @param {ClassNode} data
   * @param {function|null} Class
   * @returns Array<ClassNode>
   */
  function parse(data, Class) {
    if (Class === null) {
      return data.children;
    }

    const prototype = Object.getPrototypeOf(Class.prototype);

    let parentClass;
    if (prototype === null || prototype.constructor === undefined) {
      parentClass = null;
    } else {
      parentClass = prototype.constructor;
    }

    const className = Class.scopedName || Class.name;
    const prevLevel = parse(data, parentClass);
    const node = prevLevel.find(n => n.name === className);

    if (node !== undefined) {
      return node.children;
    }

    const newNode = {
      name: className,
      children: [],
    };

    prevLevel.push(newNode);

    return newNode.children;
  }

  return parse;
});
