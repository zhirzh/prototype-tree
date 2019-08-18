import * as d3 from 'd3'
import { parse } from './parse-ctors.web'
import { clamp, className, escapeRegExp, not } from './utils'

// MODULE AUGMENTATION
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

// DOMAIN TYPES
type Datum = {
  path: string
  children: Array<Datum>
}

type DatumLink = d3.HierarchyPointLink<Datum>
type DatumNode = d3.HierarchyPointNode<Datum>

// ALIAS TYPES
type Circle = SVGCircleElement
type Div = HTMLDivElement
type G = SVGGElement
type Input = HTMLInputElement
type Path = SVGPathElement
type Rect = SVGRectElement
type SVG = SVGSVGElement
type Text = SVGTextElement

type NumberPair = [number, number]

// CONTROLS
const circleRadius = 8
const duration = 300
const nodeSize: NumberPair = [4.5 * circleRadius, 300]
const scaleExtent: NumberPair = [0.2, 2]

const pad = 0.5 * circleRadius

const maxSearchOptions = 20

// D3 GENERATORS
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

    $zoomPanGroup.attr('transform', `translate(${x}, ${y}) scale(${k})`)
  })

// PROCESSES

// focus node
function focusNode(datum: DatumNode) {
  focusedNodes = datum.ancestors()

  zoomBehavior.transform(
    $tree.transition().duration(1.5 * duration),
    d3.zoomIdentity.translate(
      0.5 * parseInt($tree.attr('width')) - datum.x,
      0.5 * parseInt($tree.attr('height')) - datum.y
    )
  )

  renderTree(root)
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
function renderTree(base: DatumNode) {
  treeGenerator(root)

  root.descendants().forEach(d => {
    // flip layout
    const { x, y } = d
    d.x = y
    d.y = x
  })

  // links
  const $links = $linksGroup
    .selectAll<Path, DatumLink>('path')
    .data(root.links().filter(l => l.source.depth > 0), l => String(l.target.id))

  // links@enter
  $links
    .enter()
    .append<Path>('path')
    .attr('stroke-opacity', 0)
    .attr('d', () => {
      const o = { x: base._x, y: base._y } as DatumNode
      return linkGenerator({ source: o, target: o })
    })

    // links@enter+update
    .merge($links)
    .attr('class', l => className(['links', focusedNodes.includes(l.target) && 'focused']))
    .transition()
    .duration(duration)
    .attr('stroke-opacity', 1)
    .attr('d', linkGenerator)

  // links@exit
  $links
    .exit<DatumLink>()
    .transition()
    .duration(duration)
    .attr('stroke-opacity', 0)
    .attr('d', l => {
      const ancestor = l.source.ancestors().find(a => a.isCollapsed()) || root
      return linkGenerator({ source: ancestor, target: ancestor })
    })
    .remove()

  // nodes
  const $nodes = $nodesGroup
    .selectAll<G, DatumNode>('g')
    .data(root.descendants().filter(d => d.depth > 0), d => String(d.id))

  // nodes@enter
  const $nodesEnter = $nodes
    .enter()
    .append<G>('g')
    .attr('class', 'nodes')
    .attr('fill-opacity', 0)
    .attr('transform', `translate(${base._x}, ${base._y})`)
    .on('dblclick', () => {
      d3.event.stopImmediatePropagation()
    })

  // nodes@enter#labelboxes
  $nodesEnter.append<Rect>('rect').attr('rx', 4)

  // nodes@enter#labels
  $nodesEnter
    .append<Text>('text')
    .attr('dy', 4)
    .on('mousedown', () => {
      d3.event.stopImmediatePropagation()
    })

  // nodes@enter#circles
  $nodesEnter
    .append<Circle>('circle')
    .attr('r', circleRadius)
    .attr('stroke-width', circleRadius / 2)
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

      renderTree(d)

      // bring new base node into focus
      const datum = d3.select<Circle, DatumNode>(d3.event.target).datum()
      focusNode(datum)
    })

  // nodes@enter+update
  const $nodesEnterUpdate = $nodesEnter.merge($nodes).attr('class', d =>
    className([
      // prettier-multiline
      'nodes',
      d.isLeaf && 'leaf',
      d.isCollapsed() && 'collapsed',
      focusedNodes.includes(d) && 'focused',
    ])
  )

  $nodesEnterUpdate
    .transition()
    .duration(duration)
    .attr('fill-opacity', 1)
    .attr('transform', d => `translate(${d.x}, ${d.y})`)

  // nodes@enter+update#labels
  $nodesEnterUpdate
    .selectAll<Text, DatumNode>('text')
    .text(
      d =>
        d.data.path + (d.isCollapsed() ? ` #${d._children!.length} | #${d.totalDescendants}` : '')
    )
    .attr('dx', d => (circleRadius + pad) * (d.isLeaf || d.isCollapsed() ? 1 : -1))

  // nodes@enter+update#labelboxes
  $nodesEnterUpdate.nodes().forEach(node => {
    const $node = d3.select<G, DatumNode>(node)
    const text = $node.select<Text>('text').node()!
    const bbox = text.getBBox()

    $node
      .select('rect')
      .attr('x', bbox.x - pad)
      .attr('y', bbox.y - 0.5 * pad)
      .attr('width', bbox.width + 2 * pad)
      .attr('height', bbox.height + pad)
  })

  // nodes@enter+update#circles
  $nodesEnterUpdate.selectAll<Circle, DatumNode>('circle')

  // nodes@exit
  $nodes
    .exit<DatumNode>()
    .transition()
    .duration(duration)
    .attr('fill-opacity', 0)
    .attr('transform', d => {
      const ancestor = d.ancestors().find(a => a.isCollapsed()) || root

      return `translate(${ancestor.x}, ${ancestor.y})`
    })
    .remove()
}

// render search
function renderSearch() {
  let searchOptionsData: Array<DatumNode> = []

  if (searchQuery.length > 0) {
    const data = root.descendants()

    const patterns = [
      // match exact
      new RegExp('^' + searchQuery + '$', 'i'),

      // match starts with
      new RegExp('^' + searchQuery, 'i'),

      // match middle
      new RegExp(searchQuery, 'i'),

      // match fuzzy
      new RegExp(searchQuery.split('').join('.{0,2}'), 'i'),
    ]

    const matches = patterns.map(p => data.filter(d => d.data.path.match(p))).flat()
    const uniqueMatches = Array.from(new Set(matches))
    searchOptionsData = uniqueMatches
      .slice(0, maxSearchOptions)
      .sort((a, b) => (a.data.path < b.data.path ? -1 : a.data.path > b.data.path ? 1 : 0))
  }

  const $searchOptions = $search
    .selectAll<Div, DatumNode>('div')
    .data(searchOptionsData, d => String(d.id))

  const totalChoices = $searchOptions.size()

  searchChoice = clamp(searchChoice, -1, totalChoices - 1)

  // search-options@enter
  $searchOptions
    .enter()
    .append('div')

    // search-options@enter+update
    .merge($searchOptions)
    .attr('class', (_, i) => className([i === searchChoice && 'choice']))
    .attr('title', d => d.data.path)
    .text(d => d.data.path)

  // search-options@exit
  $searchOptions.exit().remove()

  if (searchChoice === -1) {
    $searchInput.property('value', searchQuery)

    $searchInput.node()!.scrollIntoView(true)
  } else {
    const datum = searchOptionsData[searchChoice]
    $searchInput.property('value', datum.data.path)
    focusNode(datum)

    $searchOptions.nodes()[searchChoice].scrollIntoView(false)
  }
}

// resize svg
function resize() {
  $tree.attr('width', window.innerWidth).attr('height', window.innerHeight)
}

// D3 SELECTIONS
const $tree = d3
  .select<SVG, DatumNode>('#tree')
  .on('mousedown', () => {
    const selection = window.getSelection()

    if (selection) {
      selection.removeAllRanges()
    }
  })
  .call(zoomBehavior)

const $zoomPanGroup = $tree.append<G>('g').style('will-change', 'transform')

const $linksGroup = $zoomPanGroup.append<G>('g')
const $nodesGroup = $zoomPanGroup.append<G>('g')

const $search = d3
  .select<Div, never>('#search')
  .on('keydown', () => {
    const e = d3.event as KeyboardEvent

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()

        searchChoice += 1

        break

      case 'ArrowUp':
        e.preventDefault()

        searchChoice -= 1

        break

      case 'Enter':
        e.preventDefault()

        searchQuery = ''

        break

      case 'Escape':
        e.preventDefault()

        searchQuery = ''
        searchChoice = -1

        break
    }

    renderSearch()
  })
  .on('mousedown', () => {
    const e = d3.event as MouseEvent

    searchChoice = $search
      .selectAll<Div, DatumNode>('div')
      .nodes()
      .indexOf(e.target as Div)
  })
  .on('mouseup', () => {
    renderSearch()

    searchQuery = ''
    searchChoice = -1

    renderSearch()
  })

const $searchInput = $search.select<Input>('input').on('input', () => {
  searchQuery = escapeRegExp($searchInput.property('value'))
  searchChoice = -1

  renderSearch()
})

// STATE
let focusedNodes: Array<DatumNode> = []

let searchQuery = ''
let searchChoice = -1

let root: DatumNode // root node

// LISTENERS
window.addEventListener('resize', () => {
  resize()
  renderTree(root)
})

window.addEventListener('keydown', e => {
  const isMacOS = navigator.platform.startsWith('Mac')
  const isFindCommand = e.key === 'f' && (isMacOS ? e.metaKey : e.ctrlKey)
  if (isFindCommand) {
    e.preventDefault()
    $searchInput.node()!.focus()
  }
})

// MAIN
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
  renderTree(root)

  zoomBehavior.translateBy($tree, 200 - nodeSize[1], 0.5 * Number($tree.attr('height')))
})
