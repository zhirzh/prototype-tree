/* global searchInputEl, searchSelectEl */

import { center, getRoot, toggle, update } from './main';

const dataIndex = {};
const searchMatchNodes = new Set();

function clearSearchMatchNodes() {
  Array.from(searchMatchNodes.values()).forEach((node) => {
    delete node.class;
  });

  searchMatchNodes.clear();
}

function clearSearchOptions() {
  searchSelectEl.innerHTML = '';
}

function escape(pattern) {
  const alphanum = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  const s = pattern.split('');
  s.forEach((c, i) => {
    if (alphanum.includes(c)) {
      return;
    }

    if (c === '\u0000') {
      s[i] = '\\000';
    } else {
      s[i] = `\\${c}`;
    }
  });

  return s.join('');
}

function highlightNode(node) {
  // recursion termination
  if (node === null) {
    return;
  }

  node.class = 'match';

  // hidden node
  if (node._children) {
    toggle(node);
  }

  searchMatchNodes.add(node);

  highlightNode(node.parent);
}

function renderOptions(keyword) {
  clearSearchOptions();

  const exactPattern = new RegExp(`^${escape(keyword)}$`, 'i');
  const strongPattern = new RegExp(`^${escape(keyword)}`, 'i');
  const weakPattern = new RegExp(
    keyword
      .split('')
      .map(escape)
      .join('.*'),
    'i',
  );

  const patternMatchNodeNames = new Set();

  [exactPattern, strongPattern, weakPattern].forEach((pattern) => {
    Object.keys(dataIndex).forEach((nodeName) => {
      if (pattern.test(nodeName)) {
        patternMatchNodeNames.add(nodeName);
      }
    });
  });

  Array.from(patternMatchNodeNames.values())
    .slice(0, 20)
    .forEach((nodeName) => {
      searchSelectEl.innerHTML += `<option>${nodeName}</option>`;
    });
}

function search(shouldUpdateOptions = true) {
  clearSearchMatchNodes();

  const keyword = searchInputEl.value.toLowerCase();

  // bail
  if (keyword.length === 0) {
    clearSearchOptions();
    update(getRoot());

    return;
  }

  if (shouldUpdateOptions) {
    renderOptions(keyword);
  }

  const nodeName = Object.keys(dataIndex).find(n => n.toLowerCase() === keyword);
  const nodes = dataIndex[nodeName];

  // bail
  if (nodes === undefined) {
    return;
  }

  nodes.forEach(highlightNode);

  update(getRoot());

  if (nodes.length === 1) {
    center(nodes[0]);
  }
}

function setDataIndex(node) {
  const { name } = node;

  dataIndex[name] = dataIndex[name] || [];
  dataIndex[name].push(node);

  const children = node.children || node._children;
  children.forEach(setDataIndex);
}

function setParents(node, parentNode) {
  node.parent = parentNode;

  const children = node.children || node._children;
  children.forEach(c => setParents(c, node));
}

export { search, setDataIndex, setParents };
