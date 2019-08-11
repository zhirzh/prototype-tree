import * as d3 from 'd3'
import 'd3-selection-multi'
import ctors from './ctors.json'

const circleRadius = 10

declare module 'd3-hierarchy' {
  interface HierarchyNode<Datum> {
    isLeaf: boolean
    isCollapsed: boolean

    _children: this['children']
  }
}

type Datum = {
  id: number
  name: string
  children: Array<Datum>
}

type DatumNode = d3.HierarchyNode<Datum>
type DatumPointNode = d3.HierarchyPointNode<Datum>

const width = window.innerWidth
const height = window.innerHeight

const treeGenerator = d3.tree<Datum>().nodeSize([circleRadius * 3, 300])

const linkGenerator = d3
  .linkHorizontal<any, DatumPointNode>()
  .x(d => d.y)
  .y(d => d.x)

const zoomBehavior = d3.zoom<SVGSVGElement, Datum>().scaleExtent([0.2, 2])

const root: DatumNode = d3.hierarchy({
  id: 0,
  name: 'ROOT',
  children: ctors,
})

function render() {
  const tree = treeGenerator(root) as DatumPointNode

  const $links = $linksGroup.selectAll<SVGPathElement, Datum>('path').data(tree.links())

  const $nodes = $nodesGroup
    .selectAll<SVGGElement, Datum>('g')
    .data(tree.descendants(), d => String(d.id))

  // add links
  const $linksEnter = $links
    .enter()
    .append('path')
    .attrs({
      class: 'link',
      d: linkGenerator,
    })

  // update links
  $links.merge($linksEnter).attr('d', linkGenerator)

  // remove links
  $links.exit().remove()

  // add nodes
  const $nodesEnter = $nodes
    .enter()
    .append('g')
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .on('dblclick', () => {
      d3.event.stopImmediatePropagation()
    })

  // add node labels
  $nodesEnter
    .append('text')
    .text(d => d.data.name)
    .attrs({
      class: 'label',
      dx: d => circleRadius * (d.isLeaf || d.isCollapsed ? 1.5 : -1.2),
      dy: circleRadius / 4,
    })
    .styles({
      'text-anchor': d => (d.isLeaf || d.isCollapsed ? 'start' : 'end'),
    })
    .on('mousedown', () => {
      d3.event.stopImmediatePropagation()
    })

  // add node label rects
  $nodesEnter.nodes().forEach(node => {
    const pad = circleRadius / 2

    const $node = d3.select(node)
    const text = $node.select('text').node() as SVGTextElement
    const bbox = text.getBBox()

    $node
      .insert('rect', 'text')
      .style('fill', 'white')
      .attr('x', bbox.x - pad)
      .attr('y', bbox.y)
      .attr('width', bbox.width + pad * 2)
      .attr('height', bbox.height)
  })

  // add node circles
  $nodesEnter
    .append('circle')
    .attrs({
      class: 'node',
      r: circleRadius,
    })
    .on('click', d => {
      if (d.isLeaf) {
        return
      }

      if (d.isCollapsed) {
        d.children = d._children
        d.isCollapsed = false
      } else {
        d.children = undefined
        d.isCollapsed = true
      }

      render()
    })

  // update nodes
  $nodes.merge($nodesEnter).attr('transform', d => `translate(${d.y},${d.x})`)

  // remove nodes
  $nodes.exit().remove()
}

root.descendants().forEach(d => {
  d.isLeaf = d.children === undefined
  d._children = d.children
})

const $svg = d3
  .select<HTMLDivElement, Datum>('#root')
  .append<SVGSVGElement>('svg')
  .attrs({
    width,
    height,
  })

const $zoomPanGroup = $svg.append('g')

const $linksGroup = $zoomPanGroup.append('g')
const $nodesGroup = $zoomPanGroup.append('g')

$svg
  .call(
    zoomBehavior.on('zoom', () => {
      $zoomPanGroup.attr('transform', d3.event.transform)
    })
  )
  .call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 10, height / 2))

render()
