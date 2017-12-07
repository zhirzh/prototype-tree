/* global d3 */
/* eslint-disable no-mixed-operators */

const margin = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const nodeSize = 10;
const textMargin = nodeSize + 5;
const duration = 200;

const width = window.innerWidth - margin.right - margin.left;
const height = window.innerHeight - margin.top - margin.bottom;

let id = 0;
let root;
let maxLabelSize;

let tree = d3.layout.tree().size([height, width]);
const diagonal = d3.svg.diagonal().projection(d => [d.y, d.x]);

const zoom = d3.behavior
  .zoom()
  .scaleExtent([0.1, 2])
  .on('zoom', () => {
    svg.attr('transform', `translate(${d3.event.translate}), scale(${d3.event.scale})`);
  });

const svg = d3
  .select('#body')
  .append('svg')
  .attr('width', width + margin.right + margin.left)
  .attr('height', height + margin.top + margin.bottom)
  .call(zoom)
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);

/**
 * Center node.
 */
function center(source) {
  const scale = zoom.scale();
  const x = -1 * source.y0 * scale + width / 2;
  const y = -1 * source.x0 * scale + height / 2;

  d3
    .select('g')
    .transition()
    .duration(duration)
    .attr('transform', `translate(${x}, ${y})scale(${scale})`);

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
function calcLevelSizes(node, level = 0, levelSizes = [1]) {
  const { children } = node;

  // bail
  if (Array.isArray(children) === false || children.length === 0) {
    return levelSizes;
  }

  const nextLevel = level + 1;

  if (levelSizes.length <= nextLevel) {
    levelSizes.push(0);
  }

  levelSizes[nextLevel] += children.length;

  children.forEach((d) => {
    calcLevelSizes(d, nextLevel, levelSizes);
  });

  return levelSizes;
}

/**
 * Calculate number of entries on each level.
 */
function calcMaxLabelSize(node) {
  const { children } = node;

  // bail
  if (Array.isArray(children) === false || children.length === 0) {
    return node.name.length;
  }

  return Math.max(node.name.length, ...children.map(calcMaxLabelSize));
}

function update(source) {
  const levelSizes = calcLevelSizes(root);
  const newHeight = Math.max(...levelSizes) * 50;
  tree = tree.size([newHeight, width]);
  tree.sort((a, b) => (b.name.toLowerCase() > a.name.toLowerCase() ? -1 : 1));

  const nodes = tree.nodes(root).reverse();

  nodes.forEach((d) => {
    d.y = d.depth * maxLabelSize * 15;
  });

  // Bind data
  const node = svg.selectAll('g.node').data(nodes, (d) => {
    if (d.id === undefined) {
      d.id = id + 1;
      id += 1;
    }

    return d.id;
  });

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', () => `translate(${source.y0}, ${source.x0})`)
    .on('click', (d) => {
      toggle(d);
      update(d);
      center(d);
    });

  nodeEnter
    .append('circle')
    .attr('r', 0)
    .style('fill', d => (d._children ? 'lightsteelblue' : 'white'));

  nodeEnter
    .append('text')
    .attr('x', d => (d.children || d._children ? -1 * textMargin : textMargin))
    .attr('dy', '.35em')
    .attr('text-anchor', d => (d.children || d._children ? 'end' : 'start'))
    .text(d => d.name)
    .style('fill-opacity', 0);

  // Transition nodes to their new position.
  const nodeUpdate = node
    .transition()
    .duration(duration)
    .attr('transform', d => `translate(${d.y}, ${d.x})`);

  nodeUpdate
    .select('circle')
    .attr('r', nodeSize)
    .style('stroke', (d) => {
      if (d.class === 'match') {
        return 'red';
      }

      return null;
    })
    .style('fill', (d) => {
      if (d.class === 'match') {
        return 'pink';
      } else if (d._children) {
        return 'lightsteelblue';
      }

      return 'white';
    });

  nodeUpdate.select('text').style('fill-opacity', 1);

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', () => `translate(${source.y}, ${source.x})`)
    .remove();

  nodeExit.select('circle').attr('r', 0);

  nodeExit.select('text').style('fill-opacity', 0);

  // Update the links
  const link = svg.selectAll('path.link').data(tree.links(nodes), d => d.target.id);

  // Enter any new links at the parent's previous position.
  link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', () => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal({ source: o, target: o });
    })
    .transition()
    .duration(duration)
    .attr('d', diagonal);

  // Transition links to their new position.
  link
    .transition()
    .duration(duration)
    .attr('d', diagonal)
    .style('stroke', (d) => {
      if (d.target.class === 'match') {
        return 'pink';
      }

      return null;
    });

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', () => {
      const o = { x: source.x, y: source.y };
      return diagonal({ source: o, target: o });
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach((d) => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function main(data) {
  root = data;

  root.x0 = height / 2;
  root.y0 = 0;

  maxLabelSize = calcMaxLabelSize(root);

  update(root);
  center(root.children[0]);
}

export { center, toggle, update };

export const getRoot = () => root;

export default main;
