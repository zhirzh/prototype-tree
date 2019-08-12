import * as d3 from 'd3'
import 'd3-selection-multi'
import ctors from './ctors.json'
import { className, not } from './utils'

const circleRadius = 10
const duration = 300

declare module 'd3-hierarchy' {
  interface HierarchyNode<Datum> {
    isLeaf: boolean

    _children: this['children']
    childrenCount: number
    descendantsCount: number
  }

  interface HierarchyPointNode<Datum> {
    isCollapsed: boolean

    _x: number
    _y: number
  }
}

type Datum = {
  id: number
  name: string
  children: Array<Datum>
}

type DatumNode = d3.HierarchyNode<Datum>
type DatumPointLink = d3.HierarchyPointLink<Datum>
type DatumPointNode = d3.HierarchyPointNode<Datum>
type Transition = d3.Transition<d3.BaseType, Datum, null, undefined>

const width = window.innerWidth
const height = window.innerHeight

const treeGenerator = d3.tree<Datum>().nodeSize([circleRadius * 3, 300])

const linkGenerator = d3
  .linkHorizontal<any, DatumPointNode>()
  .x(d => d.y)
  .y(d => d.x)

const zoomBehavior = d3
  .zoom<SVGSVGElement, Datum>()
  .scaleExtent([0.2, 2])
  .on('zoom', () => {
    $zoomPanGroup.attr('transform', d3.event.transform)
  })

const root: DatumNode = d3.hierarchy({
  id: 0,
  name: 'ROOT',
  children: ctors,
})

function render(source?: DatumPointNode) {
  // @ts-ignore
  const transition: Transition = d3.transition<Datum>().duration(duration)

  const tree = treeGenerator(root) as DatumPointNode

  const $links = $linksGroup
    .selectAll<SVGPathElement, DatumPointLink>('path')
    .data(tree.links(), d => String(d.target.data.id))

  const $nodes = $nodesGroup
    .selectAll<SVGGElement, DatumPointNode>('g')
    .data(tree.descendants(), d => String(d.data.id))

  // add links
  const $linksEnter = $links
    .enter()
    .append('path')
    .attrs({
      class: 'link',
      d: () => {
        const o = source
          ? {
              x: source._x,
              y: source._y,
            }
          : {
              x: tree.x,
              y: tree.y,
            }

        return linkGenerator({
          source: o,
          target: o,
        })
      },
    })

  // update links
  $links
    .merge($linksEnter)
    .transition(transition)
    .attr('d', linkGenerator)

  // remove links
  $links
    .exit()
    .transition(transition)
    .remove()
    .attr('d', () => {
      const o = source
        ? {
            x: source.x,
            y: source.y,
          }
        : {
            x: tree.x,
            y: tree.y,
          }

      return linkGenerator({
        source: o,
        target: o,
      })
    })

  // add nodes
  const $nodesEnter = $nodes
    .enter()
    .append('g')
    .attr(
      'transform',
      source ? `translate(${source._y}, ${source._x})` : `translate(${tree.y}, ${tree.x})`
    )
    .attr('fill-opacity', 0)
    .attr('stroke-opacity', 0)
    .on('dblclick', () => {
      d3.event.stopImmediatePropagation()
    })

  // add node labels
  const $labels = $nodesEnter
    .append('text')
    .text(d => d.data.name)
    .attrs({
      class: d => className(['label', d.isCollapsed && 'collapsed']),
      dx: d => circleRadius * (d.isLeaf || d.isCollapsed ? 1.5 : -1.2),
      dy: circleRadius / 4,
    })
    .styles({
      'text-anchor': d => (d.isLeaf || d.isCollapsed ? 'start' : 'end'),
    })
    .on('mousedown', () => {
      d3.event.stopImmediatePropagation()
    })

  // add collapsed node counts
  $labels
    .filter(d => d.isCollapsed)
    .append('tspan')
    .text(d => ` #${d.childrenCount} ##${d.descendantsCount}`)

  // add node label white backgrounds
  $nodesEnter.nodes().forEach(node => {
    const pad = circleRadius / 2

    const $node = d3.select(node)
    const text = $node.select('text').node() as SVGTextElement
    const bbox = text.getBBox()

    $node
      .insert('rect', 'text')
      .style('fill', 'white')
      .attrs({
        x: bbox.x - pad,
        y: bbox.y,
        width: bbox.width + pad * 2,
        height: bbox.height,
      })
  })

  // add node circles
  $nodesEnter
    .append('circle')
    .attrs({
      class: d =>
        className([
          // prettier-multiline
          'node',
          not(d.isLeaf) && 'collapsable',
          d.isCollapsed && 'collapsed',
        ]),
      r: circleRadius,
    })
    .style('stroke-width', 5)
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

      const datum = d3.select<SVGCircleElement, DatumPointNode>(d3.event.target).datum()

      // @ts-ignore
      const transition: Transition = d3.transition<Datum>().duration(duration)

      zoomBehavior.scaleTo($svg.transition(transition), 1)
      zoomBehavior.translateTo($svg.transition(transition), datum.y, datum.x)

      render(d)
    })

  // update nodes
  $nodes
    .merge($nodesEnter)
    .transition(transition)
    .attr('transform', d => `translate(${d.y}, ${d.x})`)
    .attr('fill-opacity', 1)
    .attr('stroke-opacity', 1)

  // remove nodes
  $nodes
    .exit()
    .transition(transition)
    .remove()
    .attr(
      'transform',
      source ? `translate(${source.y}, ${source.x})` : `translate(${tree.y}, ${tree.x})`
    )
    .attr('fill-opacity', 0)
    .attr('stroke-opacity', 0)

  tree.each(d => {
    d._x = d.x
    d._y = d.y
  })
}

root.descendants().forEach(d => {
  d._children = d.children

  if (d.children === undefined) {
    d.isLeaf = true
    d.childrenCount = 0
    d.descendantsCount = 0
  } else {
    d.isLeaf = false
    d.childrenCount = d.children.length
    d.descendantsCount = d.descendants().length
  }
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

zoomBehavior($svg)
zoomBehavior.translateBy($svg, 100 + width / 10, height / 2)

render()
