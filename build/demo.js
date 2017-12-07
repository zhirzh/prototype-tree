/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.setParents = exports.setDataIndex = exports.search = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _main = __webpack_require__(1);

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } /* global searchInputEl, searchSelectEl */

var dataIndex = {};
var matchNodes = new Set();

function clearMatchNodes() {
  Array.from(matchNodes.values()).forEach(function (node) {
    delete node.class;
  });

  matchNodes.clear();
}

function clearSearchOptions() {
  searchSelectEl.innerHTML = '';
}

function highlightNode(node) {
  // recursion termination
  if (node === null) {
    return;
  }

  node.class = 'match';

  // hidden node
  if (node._children) {
    (0, _main.toggle)(node);
  }

  matchNodes.add(node);

  highlightNode(node.parent);
}

function renderOptions(keyword) {
  var _scores;

  clearSearchOptions();

  var exactPattern = new RegExp('^' + keyword + '$', 'i');
  var strongPattern = new RegExp('^' + keyword, 'i');
  var weakPattern = new RegExp(keyword.split('').join('.*'), 'i');

  var scores = (_scores = {}, _defineProperty(_scores, exactPattern, 0), _defineProperty(_scores, strongPattern, 1), _defineProperty(_scores, weakPattern, 2), _scores);

  var patternMatches = new Map();

  [exactPattern, strongPattern, weakPattern].forEach(function (pattern) {
    Object.keys(dataIndex).forEach(function (nodeName) {
      if (pattern.test(nodeName)) {
        if (patternMatches.has(nodeName)) {
          return;
        }

        patternMatches.set(nodeName, scores[pattern]);
      }
    });
  });

  Array.from(patternMatches.entries()).sort(function (x, y) {
    return x[1] - y[1];
  }).slice(0, 20).forEach(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 1),
        nodeName = _ref2[0];

    searchSelectEl.innerHTML += '<option>' + nodeName + '</option>';
  });
}

function search() {
  var updateOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

  clearMatchNodes();

  var keyword = searchInputEl.value.toLowerCase();

  // bail
  if (keyword.length === 0) {
    clearSearchOptions();
    (0, _main.update)(_main.root);

    return;
  }

  if (updateOptions) {
    renderOptions(keyword);
  }

  var key = Object.keys(dataIndex).find(function (k) {
    return k.toLowerCase() === keyword;
  });
  var nodes = dataIndex[key] || null;

  // bail
  if (nodes === null) {
    return;
  }

  nodes.forEach(highlightNode);

  (0, _main.update)(_main.root);

  if (nodes.length === 1) {
    (0, _main.center)(nodes[0]);
  }
}

function setDataIndex(node) {
  var name = node.name;


  dataIndex[name] = dataIndex[name] || [];
  dataIndex[name].push(node);

  var children = node.children || node._children;
  children.forEach(setDataIndex);
}

function setParents(node, parentNode) {
  node.parent = parentNode;

  var children = node.children || node._children;
  children.forEach(function (c) {
    return setParents(c, node);
  });
}

exports.search = search;
exports.setDataIndex = setDataIndex;
exports.setParents = setParents;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.update = exports.toggle = exports.center = exports.root = undefined;

var _select = __webpack_require__(0);

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } } /* global d3 */
/* eslint-disable no-mixed-operators */

var margin = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
};

var nodeSize = 10;
var textMargin = nodeSize + 5;
var duration = 200;

var width = window.innerWidth - margin.right - margin.left;
var height = window.innerHeight - margin.top - margin.bottom;

var id = 0;
var root = void 0;
var maxLabelSize = void 0;

var tree = d3.layout.tree().size([height, width]);
var diagonal = d3.svg.diagonal().projection(function (d) {
  return [d.y, d.x];
});

var zoom = d3.behavior.zoom().scaleExtent([0.1, 2]).on('zoom', function () {
  svg.attr('transform', 'translate(' + d3.event.translate + '), scale(' + d3.event.scale + ')');
});

var svg = d3.select('#body').append('svg').attr('width', width + margin.right + margin.left).attr('height', height + margin.top + margin.bottom).call(zoom).append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

/**
 * Center node.
 */
function center(source) {
  var scale = zoom.scale();
  var x = -1 * source.y0 * scale + width / 2;
  var y = -1 * source.x0 * scale + height / 2;

  d3.select('g').transition().duration(duration).attr('transform', 'translate(' + x + ', ' + y + ')scale(' + scale + ')');

  zoom.scale(scale);
  zoom.translate([x, y]);
}

/**
 * Toggle node.
 */
function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}

/**
 * Calculate number of entries on each level.
 */
function calcLevelSizes(node) {
  var level = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var levelSizes = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [1];
  var children = node.children;

  // bail

  if (Array.isArray(children) === false || children.length === 0) {
    return levelSizes;
  }

  var nextLevel = level + 1;

  if (levelSizes.length <= nextLevel) {
    levelSizes.push(0);
  }

  levelSizes[nextLevel] += children.length;

  children.forEach(function (d) {
    calcLevelSizes(d, nextLevel, levelSizes);
  });

  return levelSizes;
}

/**
 * Calculate number of entries on each level.
 */
function calcMaxLabelSize(node) {
  var children = node.children;

  // bail

  if (Array.isArray(children) === false || children.length === 0) {
    return node.name.length;
  }

  return Math.max.apply(Math, [node.name.length].concat(_toConsumableArray(children.map(calcMaxLabelSize))));
}

function update(source) {
  var levelSizes = calcLevelSizes(root);
  var newHeight = Math.max.apply(Math, _toConsumableArray(levelSizes)) * 50;
  tree = tree.size([newHeight, width]);
  tree.sort(function (a, b) {
    return b.name.toLowerCase() > a.name.toLowerCase() ? -1 : 1;
  });

  var nodes = tree.nodes(root).reverse();

  nodes.forEach(function (d) {
    d.y = d.depth * maxLabelSize * 15;
  });

  // Bind data
  var node = svg.selectAll('g.node').data(nodes, function (d) {
    if (d.id === undefined) {
      d.id = id + 1;
      id += 1;
    }

    return d.id;
  });

  // Enter any new nodes at the parent's previous position.
  var nodeEnter = node.enter().append('g').attr('class', 'node').attr('transform', function () {
    return 'translate(' + source.y0 + ', ' + source.x0 + ')';
  }).on('click', function (d) {
    toggle(d);
    update(d);
    center(d);
  });

  nodeEnter.append('circle').attr('r', 0).style('fill', function (d) {
    return d._children ? 'lightsteelblue' : 'white';
  });

  nodeEnter.append('text').attr('x', function (d) {
    return d.children || d._children ? -1 * textMargin : textMargin;
  }).attr('dy', '.35em').attr('text-anchor', function (d) {
    return d.children || d._children ? 'end' : 'start';
  }).text(function (d) {
    return d.name;
  }).style('fill-opacity', 0);

  // Transition nodes to their new position.
  var nodeUpdate = node.transition().duration(duration).attr('transform', function (d) {
    return 'translate(' + d.y + ', ' + d.x + ')';
  });

  nodeUpdate.select('circle').attr('r', nodeSize).style('stroke', function (d) {
    if (d.class === 'match') {
      return 'red';
    }

    return null;
  }).style('fill', function (d) {
    if (d.class === 'match') {
      return 'pink';
    } else if (d._children) {
      return 'lightsteelblue';
    }

    return 'white';
  });

  nodeUpdate.select('text').style('fill-opacity', 1);

  // Transition exiting nodes to the parent's new position.
  var nodeExit = node.exit().transition().duration(duration).attr('transform', function () {
    return 'translate(' + source.y + ', ' + source.x + ')';
  }).remove();

  nodeExit.select('circle').attr('r', 0);

  nodeExit.select('text').style('fill-opacity', 0);

  // Update the links
  var link = svg.selectAll('path.link').data(tree.links(nodes), function (d) {
    return d.target.id;
  });

  // Enter any new links at the parent's previous position.
  link.enter().insert('path', 'g').attr('class', 'link').attr('d', function () {
    var o = { x: source.x0, y: source.y0 };
    return diagonal({ source: o, target: o });
  }).transition().duration(duration).attr('d', diagonal);

  // Transition links to their new position.
  link.transition().duration(duration).attr('d', diagonal).style('stroke', function (d) {
    if (d.target.class === 'match') {
      return 'pink';
    }

    return null;
  });

  // Transition exiting nodes to the parent's new position.
  link.exit().transition().duration(duration).attr('d', function () {
    var o = { x: source.x, y: source.y };
    return diagonal({ source: o, target: o });
  }).remove();

  // Stash the old positions for transition.
  nodes.forEach(function (d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function main() {
  var dataType = new URL(window.location).searchParams.get('data');

  var filename = void 0;
  switch (dataType) {
    case 'browser':
      filename = 'data.browser.json';
      break;

    case 'node':
      filename = 'data.node.json';
      break;

    case 'node-sparse':
      filename = 'data.node-sparse.json';
      break;

    default:
      filename = 'data.browser.json';
  }

  d3.json('../data/' + filename, function (data) {
    (0, _select.setDataIndex)(data);
    (0, _select.setParents)(data, null);

    exports.root = root = data;

    root.x0 = height / 2;
    root.y0 = 0;

    maxLabelSize = calcMaxLabelSize(root);

    update(root);
    center(root.children[0]);
  });
}

exports.root = root;
exports.center = center;
exports.toggle = toggle;
exports.update = update;
exports.default = main;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _main = __webpack_require__(1);

var _main2 = _interopRequireDefault(_main);

__webpack_require__(0);

__webpack_require__(3);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _main2.default)();

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _select = __webpack_require__(0);

searchFormEl.addEventListener('blur', function (e) {
  if (searchFormEl.contains(e.relatedTarget)) {
    return;
  }

  searchSelectEl.style.display = 'none';
}, true); /* global searchFormEl, searchInputEl, searchSelectEl */

searchFormEl.addEventListener('focus', function () {
  searchSelectEl.style.display = 'block';
}, true);

searchInputEl.onfocus = function () {
  searchInputEl.select();
};

searchInputEl.onkeydown = function (e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();

    searchSelectEl.focus();
    searchSelectEl.selectedIndex = 0;
  }
};

searchInputEl.oninput = _select.search;

searchSelectEl.oninput = function () {
  searchInputEl.value = searchSelectEl.value;

  (0, _select.search)(false);
};

searchSelectEl.onkeydown = function (e) {
  if (e.key === 'ArrowUp' && searchSelectEl.selectedIndex === 0) {
    e.preventDefault();

    searchInputEl.focus();
  }
};

/***/ })
/******/ ]);