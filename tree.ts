import * as d3 from 'd3'
import 'd3-selection-multi'
import ctors from './ctors.json'

type Datum = {
  name: string
  children: Array<Datum>
}

function isCollapsedNode(d: d3.HierarchyPointNode<Datum>) {
  return d.children === null
}

function isLeafNode(d: d3.HierarchyPointNode<Datum>) {
  return d.children === undefined
}

const width = window.innerWidth
const height = window.innerHeight

const root: Datum = {
  name: 'ROOT',
  children: ctors,
}

const treeGenerator = d3.tree<Datum>().nodeSize([30, 300])

const linkGenerator = d3
  .linkHorizontal<any, d3.HierarchyPointNode<Datum>>()
  .x(d => d.y)
  .y(d => d.x)

const zoomBehavior = d3.zoom<SVGSVGElement, Datum>().scaleExtent([0.2, 2])

const tree = treeGenerator(d3.hierarchy(root))

const $svg = d3
  .select<HTMLDivElement, Datum>('#root')
  .append<SVGSVGElement>('svg')
  .attrs({
    width,
    height,
  })

const $zoomPanGroup = $svg.append('g')
const $nodeGroups = $zoomPanGroup.selectAll('g').data(tree.descendants())

$svg
  .call(
    zoomBehavior.on('zoom', () => {
      $zoomPanGroup.attr('transform', d3.event.transform)
    })
  )
  .call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 10, height / 2))

$zoomPanGroup
  .selectAll('path')
  .data(tree.links())
  .enter()
  .append('path')
  .attrs({
    class: 'link',
    d: linkGenerator,
  })

const $nodesEnter = $nodeGroups
  .enter()
  .append('g')
  .attr('transform', d => `translate(${d.y},${d.x})`)

$nodesEnter.append('circle').attrs({
  class: 'node',
  r: 10,
})

$nodesEnter
  .append('text')
  .text(d => d.data.name)
  .attrs({
    class: 'label',
    dx: d => (isLeafNode(d) ? 15 : -15),
    dy: 5,
  })
  .styles({
    'text-anchor': d => (isLeafNode(d) ? 'start' : 'end'),
  })
  .clone(true)
  .lower()
  .styles({
    stroke: 'white',
    'stroke-width': 5,
  })
