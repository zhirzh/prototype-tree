import * as d3 from 'd3'
import 'd3-selection-multi'
import ctors from './ctors.json'
import { not } from './utils'

// module augmentation
declare module 'd3-hierarchy' {
  interface HierarchyNode<Datum> {
    _children: this['children']
    isLeaf: boolean
    totalDescendants: number
  }

  interface HierarchyPointNode<Datum> {
    isCollapsed: () => boolean

    _x: number
    _y: number
  }
}

// domain types
type Datum = {
  id: number
  name: string
  children: Array<Datum>
}

type DatumLink = d3.HierarchyPointLink<Datum>
type DatumNode = d3.HierarchyPointNode<Datum>
type Transition = d3.Transition<any, Datum, d3.BaseType, undefined>

// alias types
type Circle = SVGCircleElement
type G = SVGGElement
type NumberPair = [number, number]
type Path = SVGPathElement
type Rect = SVGRectElement
type SVG = SVGSVGElement
type Text = SVGTextElement

// controls
const circleRadius = 8
const fontSize = 17
const duration = 300
const nodeSize: NumberPair = [4 * circleRadius, 300]
const scaleExtent: NumberPair = [0.2, 2]

const pad = 0.5 * circleRadius
let width = window.innerWidth
let height = window.innerHeight

// d3 generators
const treeGenerator = d3.tree<Datum>().nodeSize(nodeSize)

const linkGenerator = d3
  .linkHorizontal<DatumLink, DatumNode>()
  .x(d => d.y)
  .y(d => d.x)

const zoomBehavior = d3
  .zoom<SVG, DatumNode>()
  .scaleExtent(scaleExtent)
  .on('zoom', () => {
    $zoomPanGroup.attrs({
      transform: d3.event.transform,
    })
  })

// render tree
function render(base: DatumNode) {
  treeGenerator(root)

  const transition: Transition = d3.transition<Datum>().duration(duration)

  // links
  const $links = $linksGroup
    .selectAll<Path, DatumLink>('path')
    .data(root.links().slice(2), d => String(d.target.data.id))

  $links
    .enter()
    .append<Path>('path')
    .attrs({
      d: () => {
        const o = { x: base._x, y: base._y } as DatumNode
        return linkGenerator({ source: o, target: o })
      },
    })
    .styles({
      opacity: 0,
      fill: 'none',
      stroke: 'lightgray',
      'stroke-width': 2,
    })
    .merge($links)
    .transition(transition)
    .attrs({
      d: linkGenerator,
    })
    .styles({
      opacity: 1,
    })

  $links
    .exit<DatumLink>()
    .transition(transition)
    .attrs({
      d: d => {
        const ancestor = d.source.ancestors().find(a => a.isCollapsed()) || root

        const o = { x: ancestor.x, y: ancestor.y } as DatumNode

        return linkGenerator({ source: o, target: o })
      },
    })
    .styles({
      opacity: 0,
    })
    .remove()

  // nodes
  const $nodes = $nodesGroup.selectAll<G, DatumNode>('g').data(
    root
      .descendants()
      .slice(1)
      .reverse(),
    d => String(d.data.id)
  )

  // nodes@enter
  const $nodesEnter = $nodes
    .enter()
    .append<G>('g')
    .attrs({
      transform: `translate(${base._y}, ${base._x})`,
    })
    .styles({
      opacity: 0,
    })
    .on('dblclick', () => {
      d3.event.stopImmediatePropagation()
    })

  // nodes@enter#labelboxes
  $nodesEnter.append<Rect>('rect').styles({
    fill: 'whitesmoke',
    opacity: 0.6,
  })

  // nodes@enter#labels
  $nodesEnter
    .append<Text>('text')
    .attrs({
      dy: 5,
    })
    .styles({
      'font-family': 'monospace',
      'font-size': fontSize,
    })
    .on('mousedown', () => {
      d3.event.stopImmediatePropagation()
    })

  // nodes@enter#circles
  $nodesEnter
    .append<Circle>('circle')
    .attrs({
      r: circleRadius,
    })
    .styles({
      cursor: 'pointer',
      'stroke-width': circleRadius / 2,
    })
    .on('click', d => {
      if (d3.event.shiftKey && d.parent && d.parent.children) {
        d.parent.children.forEach(child => {
          child.children = undefined
        })
      } else {
        // toggle children
        d.children = d.isCollapsed() ? d._children : undefined
      }

      // save positions of next base node
      d._x = d.x
      d._y = d.y

      render(d)

      // bring base node into focus
      const datum = d3.select<Circle, DatumNode>(d3.event.target).datum()
      const transition: Transition = d3.transition<Datum>().duration(2 * duration)
      zoomBehavior.transform(
        $svg.transition(transition),
        d3.zoomIdentity.translate(0.5 * width - datum.y, 0.5 * height - datum.x)
      )
    })

  // nodes@enter+update
  const $nodesEnterUpdate = $nodesEnter.merge($nodes)

  $nodesEnterUpdate
    .transition(transition)
    .attrs({
      transform: d => `translate(${d.y}, ${d.x})`,
    })
    .styles({
      opacity: 1,
    })

  // nodes@enter+update#labels
  $nodesEnterUpdate
    .selectAll<Text, DatumNode>('text')
    .text(d => d.data.name + (d.isCollapsed() ? ` #${d.totalDescendants}` : ''))
    .attrs({
      dx: d => (circleRadius + pad) * (d.isLeaf || d.isCollapsed() ? 1 : -1),
    })
    .styles({
      'font-style': d => (d.isCollapsed() ? 'italic' : 'normal'),
      'text-anchor': d => (d.isLeaf || d.isCollapsed() ? 'start' : 'end'),
    })

  // nodes@enter+update#labelboxes
  $nodesEnterUpdate.nodes().forEach(node => {
    const $node = d3.select<G, DatumNode>(node)
    const text = $node.select<Text>('text').node()!
    const bbox = text.getBBox()

    $node.select('rect').attrs({
      x: bbox.x - pad,
      y: bbox.y,
      width: bbox.width + 2 * pad,
      height: bbox.height + 3,
    })
  })

  // nodes@enter+update#circles
  $nodesEnterUpdate.selectAll<Circle, DatumNode>('circle').styles({
    fill: d => (d.isCollapsed() ? 'whitesmoke' : 'deepskyblue'),
    stroke: d => (d.isCollapsed() ? 'deepskyblue' : 'none'),
  })

  // nodes@exit
  $nodes
    .exit<DatumNode>()
    .transition(transition)
    .attrs({
      transform: d => {
        const ancestor = d.ancestors().find(a => a.isCollapsed()) || root

        return `translate(${ancestor.y}, ${ancestor.x})`
      },
    })
    .styles({
      opacity: 0,
    })
    .remove()
}

// root node
const root: DatumNode = treeGenerator(
  d3.hierarchy({
    id: 0,
    name: 'ROOT',
    children: ctors,
  })
)

// save positions of root node as next base node
root._x = 0
root._y = 0

// root node
root.descendants().forEach(d => {
  // save children for recovering collapsed nodes
  d._children = d.children

  d.isLeaf = d._children === undefined

  d.totalDescendants = d.isLeaf ? 0 : d.descendants().length

  d.isCollapsed = () => not(d._children === d.children)
})

const $svg = d3
  .select<HTMLDivElement, DatumNode>('#root')
  .append<SVG>('svg')
  .attrs({
    width,
    height,
  })
  .on('mousedown', () => {
    const selection = window.getSelection()

    if (selection) {
      selection.removeAllRanges()
    }
  })

const $zoomPanGroup = $svg.append<G>('g')

const $linksGroup = $zoomPanGroup.append<G>('g')
const $nodesGroup = $zoomPanGroup.append<G>('g')

zoomBehavior($svg)
zoomBehavior.translateBy($svg, 0, 0.5 * height)

render(root)

window.addEventListener('resize', () => {
  width = window.innerWidth
  height = window.innerHeight

  $svg.attrs({
    width,
    height,
  })

  render(root)
})
