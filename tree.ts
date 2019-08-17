import * as d3 from 'd3'
import 'd3-selection-multi'
import { parse } from './parse-ctors.web'
import { not, escapeRegExp, clamp } from './utils'

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
  path: string
  children: Array<Datum>
}

type DatumLink = d3.HierarchyPointLink<Datum>
type DatumNode = d3.HierarchyPointNode<Datum>
type Transition = d3.Transition<any, Datum, d3.BaseType, undefined>

// alias types
type Circle = SVGCircleElement
type G = SVGGElement
type Path = SVGPathElement
type Rect = SVGRectElement
type SVG = SVGSVGElement
type Text = SVGTextElement

type NumberPair = [number, number]

// controls
const circleRadius = 8
const duration = 1000
const nodeSize: NumberPair = [4.5 * circleRadius, 300]
const scaleExtent: NumberPair = [0.2, 2]

const pad = 0.5 * circleRadius

// d3 generators
const treeGenerator = d3.tree<Datum>().nodeSize(nodeSize)

const linkGenerator = d3
  .linkHorizontal<DatumLink, DatumNode>()
  .x(d => d.x)
  .y(d => d.y)

const zoomBehavior = d3
  .zoom<SVG, DatumNode>()
  .scaleExtent(scaleExtent)
  .on('zoom', () => {
    const { x, y, k } = d3.event.transform

    $zoomPanGroup.styles({
      transform: `translate(${x}px, ${y}px) scale(${k})`,
    })
  })

// focus node
function focusNode(datum: DatumNode) {
  zoomBehavior.transform(
    $svg.transition().duration(duration),
    d3.zoomIdentity.translate(
      0.5 * parseInt($svg.attr('width')) - datum.x,
      0.5 * parseInt($svg.attr('height')) - datum.y
    )
  )
}

// load data
function loadData(): Promise<Array<Datum>> {
  let mode = new URLSearchParams(location.search).get('mode')

  if (mode === null || not(['core', 'node', 'browser'].includes(mode))) {
    mode = 'core'
  }

  // load ctors from iframe
  if (mode === 'browser') {
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    document.body.append(iframe)

    return Promise.resolve(parse(iframe.contentWindow!.window))
  }

  return d3.json(`./ctors.${mode}.json`)
}

// render tree
function render(base: DatumNode) {
  treeGenerator(root)

  root.descendants().forEach(d => {
    // flip layout
    const { x, y } = d
    d.x = y
    d.y = x
  })

  const transition: Transition = d3.transition<Datum>().duration(duration)

  // links
  const $links = $linksGroup
    .selectAll<Path, DatumLink>('path')
    .data(root.links().slice(2), d => String(d.target.id))

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
        return linkGenerator({ source: ancestor, target: ancestor })
      },
    })
    .styles({
      opacity: 0,
    })
    .remove()

  // nodes
  const $nodes = $nodesGroup
    .selectAll<G, DatumNode>('g')
    .data(root.descendants().slice(1), d => String(d.id))

  // nodes@enter
  const $nodesEnter = $nodes
    .enter()
    .append<G>('g')
    .styles({
      transform: `translate(${base._x}px, ${base._y}px)`,
      opacity: 0,
    })
    .on('dblclick', () => {
      d3.event.stopImmediatePropagation()
    })

  // nodes@enter#labelboxes
  $nodesEnter
    .append<Rect>('rect')
    .styles({
      rx: 4,
    })
    .styles({
      fill: 'white',
      opacity: 0.9,
    })

  // nodes@enter#labels
  $nodesEnter
    .append<Text>('text')
    .attrs({
      dy: 4,
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

      // bring new base node into focus
      const datum = d3.select<Circle, DatumNode>(d3.event.target).datum()
      focusNode(datum)
    })

  // nodes@enter+update
  const $nodesEnterUpdate = $nodesEnter.merge($nodes)

  $nodesEnterUpdate.transition(transition).styles({
    opacity: 1,
    transform: d => `translate(${d.x}px, ${d.y}px)`,
  })

  // nodes@enter+update#labels
  $nodesEnterUpdate
    .selectAll<Text, DatumNode>('text')
    .text(d => d.data.path + (d.isCollapsed() ? ` #${d.totalDescendants}` : ''))
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
      y: bbox.y - 0.5 * pad,
      width: bbox.width + 2 * pad,
      height: bbox.height + pad,
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
    .styles({
      opacity: 0,
      transform: d => {
        const ancestor = d.ancestors().find(a => a.isCollapsed()) || root

        return `translate(${ancestor.x}px, ${ancestor.y}px)`
      },
    })
    .remove()
}

function resize() {
  $svg.attrs({
    width: window.innerWidth,
    height: window.innerHeight,
  })
}

const $svg = d3
  .select<HTMLElement, DatumNode>(document.body)
  .append<SVG>('svg')
  .styles({
    position: 'fixed',
    top: 0,
    left: 0,
  })
  .on('mousedown', () => {
    const selection = window.getSelection()

    if (selection) {
      selection.removeAllRanges()
    }
  })

const $zoomPanGroup = $svg.append<G>('g').styles({
  'will-change': 'transform',
})

const $linksGroup = $zoomPanGroup.append<G>('g')
const $nodesGroup = $zoomPanGroup.append<G>('g')

const maxOptions = 10
let query = ''
let choice = -1
let options: Array<DatumNode> = []

const $search = d3
  .select(document.body)
  .append('div')
  .styles({
    position: 'fixed',
    top: '20px',
    left: '20px',
    right: '20px',
    'z-index': '1',

    'max-width': '300px',

    background: 'white',
    'border-radius': '5px',
    'box-shadow': '0 0 0 1px lightsteelblue',
    overflow: 'hidden',
  })
  .on('keydown', () => {
    const e = d3.event as KeyboardEvent

    const $options = $searchInputOptions.selectAll('div')

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()

        choice = clamp(choice + 1, -1, $options.size() - 1)

        break

      case 'ArrowUp':
        e.preventDefault()

        choice = clamp(choice - 1, -1, $options.size() - 1)

        break

      case 'Enter':
        e.preventDefault()

        $searchInput.property('value', '')
        $searchInput.dispatch('input')

        break
    }

    if (choice === -1) {
      $searchInput.property('value', query)
    } else {
      const datum = options[choice]
      $searchInput.property('value', datum.data.path)
      focusNode(datum)
    }

    $options.styles({
      background: 'unset',
      'font-weight': 'unset',
    })

    d3.select($options.nodes()[choice]).styles({
      background: 'gainsboro',
      'font-weight': 'bold',
    })
  })

const $searchInput = $search
  .append('input')
  .attrs({
    type: 'text',
    placeholder: 'Search',
  })
  .styles({
    width: '100%',
    border: 'none',
    outline: 'none',
    padding: '10px',
    'padding-left': '15px',
    'box-shadow': '0 1px 0 0 whitesmoke',
  })
  .on('input', () => {
    $searchInputOptions.selectAll('div').remove()
    choice = -1

    query = escapeRegExp($searchInput.property('value'))

    const matches = new Set<DatumNode>()

    if (query.length > 0) {
      const patterns = [
        // match exact
        new RegExp('^' + query + '$', 'g'),

        // match exact, case-insensitive
        new RegExp('^' + query + '$', 'gi'),

        // match starts with
        new RegExp('^' + query, 'gi'),

        // match in the middle
        new RegExp(query, 'gi'),

        // match fuzzy
        new RegExp(query.split('').join('.{0,2}'), 'gi'),
      ]

      const data = root
        .descendants()
        .sort((a, b) => (a.data.path < b.data.path ? -1 : a.data.path > b.data.path ? 1 : 0))

      patterns.forEach(p => {
        if (matches.size >= maxOptions) {
          return
        }

        data.forEach(d => {
          if (matches.size >= maxOptions) {
            return
          }

          if (d.data.path.match(p)) {
            matches.add(d)
          }
        })
      })
    }

    options = Array.from(matches)

    options.forEach(d => {
      $searchInputOptions
        .append('div')
        .text(d.data.path)
        .styles({
          padding: '10px',
          'box-shadow': '0 -1px 0 0 whitesmoke',
        })
    })
  })
  .on('focus', () => {
    $search.styles({
      'box-shadow': '0 0 5px 3px lightsteelblue',
    })
  })
  .on('blur', () => {
    $searchInput.property('value', '')
    $searchInput.dispatch('input')

    $search.styles({
      'box-shadow': '0 0 0 1px lightsteelblue',
    })
  })

const $searchInputOptions = $search.append('div')

// root node
let root: DatumNode

loadData().then(ctors => {
  root = treeGenerator(
    d3.hierarchy({
      path: '',
      children: ctors,
    })
  )

  // root node
  root.descendants().forEach((d, i) => {
    // @ts-ignore
    d.id = i

    // save children for recovering collapsed nodes
    d._children = d.children

    d.isLeaf = d._children === undefined

    d.totalDescendants = d.isLeaf ? 0 : d.descendants().length - 1

    d.isCollapsed = () => not(d._children === d.children)
  })

  // save positions of root node as next base node
  root._x = 0
  root._y = 0

  resize()
  render(root)

  zoomBehavior($svg)
  zoomBehavior.translateBy($svg, 200 - nodeSize[1], 0.5 * parseInt($svg.style('height')))
})

window.addEventListener('resize', () => {
  resize()
  render(root)
})

window.addEventListener('keydown', e => {
  const isMacOS = navigator.platform.startsWith('Mac')
  const isFindCommand = e.key === 'f' && (isMacOS ? e.metaKey : e.ctrlKey)
  if (isFindCommand) {
    e.preventDefault()
    $searchInput.node()!.focus()
  }
})
