import { useRef, useEffect, useLayoutEffect, useState, useCallback, useMemo } from 'react'
import {
  forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide,
  type SimulationNodeDatum, type SimulationLinkDatum,
} from 'd3-force'
import {
  allEntities, allThemes, crossValidatedPatterns, archetypeMapping,
  allPotentials, cognitiveGenomePrimitives, allConnections,
} from '../data/loader'
import { SectionHead, CopyBlock } from '../components/shared'
import { vectorSearchDemo } from '../data/vectorSearchDemo'
import type { SearchResult, SearchQuery } from '../data/vectorSearchDemo'

interface GraphNode extends SimulationNodeDatum {
  id: string; label: string; type: NodeType; color: string; size: number; detail: string
}
interface GraphEdge extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode; target: string | GraphNode
}

type NodeType = 'entity' | 'theme' | 'pattern' | 'archetype' | 'potential' | 'primitive'

const NODE_COLORS: Record<NodeType, string> = {
  entity: '#4e5f63',
  theme: '#82654b',
  pattern: '#9f4a34',
  archetype: '#a77c58',
  potential: '#5f6e58',
  primitive: '#756657',
}
const TYPE_LABELS: Record<NodeType, string> = {
  entity: 'Entity', theme: 'Theme', pattern: 'Pattern',
  archetype: 'Archetype', potential: 'Potential', primitive: 'Primitive',
}
const ALL_TYPES: NodeType[] = ['entity', 'theme', 'pattern', 'archetype', 'potential', 'primitive']
const FILTER_PRESETS: Array<{ id: string; label: string; types: NodeType[] }> = [
  { id: 'all', label: 'All', types: ALL_TYPES },
  { id: 'core', label: 'Core map', types: ['entity', 'theme', 'pattern', 'archetype'] },
  { id: 'signals', label: 'Signals', types: ['pattern', 'potential', 'primitive'] },
  { id: 'structure', label: 'Structure', types: ['entity', 'theme', 'archetype'] },
]

const MIN_ZOOM = 0.3
const MAX_ZOOM = 3

interface Transform {
  scale: number
  tx: number
  ty: number
}

function edgeId(e: GraphEdge, side: 'source' | 'target'): string {
  const v = e[side]; return typeof v === 'string' ? v : v.id
}

function buildGraph(): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const ids = new Set<string>()

  const add = (n: GraphNode) => { if (!ids.has(n.id)) { ids.add(n.id); nodes.push(n) } }
  const link = (s: string, t: string) => { if (ids.has(s) && ids.has(t) && s !== t) edges.push({ source: s, target: t }) }

  // Show top 40 entities (up from 15 — we now have 184 total)
  const topEntities = [...allEntities].sort((a, b) => b.mentions - a.mentions).slice(0, 40)
  for (const e of topEntities) {
    add({ id: `entity:${e.name}`, label: e.name, type: 'entity', color: NODE_COLORS.entity,
      size: Math.max(4, Math.min(14, Math.sqrt(e.mentions) * 2)), detail: e.significance })
  }

  const topThemes = [...allThemes].sort((a, b) => b.relevance - a.relevance).slice(0, 15)
  for (const t of topThemes) {
    add({ id: `theme:${t.label}`, label: t.label, type: 'theme', color: NODE_COLORS.theme,
      size: Math.max(5, t.relevance * 12), detail: `Dimension: ${t.dimension}. Keywords: ${t.keywords.join(', ')}` })
  }

  for (const p of crossValidatedPatterns) {
    add({ id: `pattern:${p.id}`, label: p.label, type: 'pattern', color: NODE_COLORS.pattern,
      size: Math.max(6, p.confidence * 12), detail: p.psychologicalInterpretation })
  }

  const arcEntries = [
    { key: 'dominant', entry: archetypeMapping.dominant },
    { key: 'secondary', entry: archetypeMapping.secondary },
    { key: 'emergent', entry: archetypeMapping.emergent },
    { key: 'goldenShadow', entry: archetypeMapping.goldenShadow },
  ]
  for (const { key, entry } of arcEntries) {
    add({ id: `archetype:${key}`, label: entry.archetype, type: 'archetype', color: NODE_COLORS.archetype,
      size: Math.max(7, entry.confidence * 12), detail: `Manifestation: ${entry.manifestation}. Shadow: ${entry.shadow}` })
  }

  for (const p of allPotentials.slice(0, 5)) {
    add({ id: `potential:${p.label}`, label: p.label, type: 'potential', color: NODE_COLORS.potential,
      size: Math.max(5, p.confidence * 10), detail: p.description })
  }

  for (const c of cognitiveGenomePrimitives) {
    add({ id: `primitive:${c.name}`, label: c.name, type: 'primitive', color: NODE_COLORS.primitive,
      size: Math.max(4, c.value * 10), detail: `Kind: ${c.kind}. Strength: ${Math.round(c.value * 100)}%` })
  }

  // Use real connections from v2 extractions (109 explicit connections)
  const nodeIdByLabel = new Map<string, string>()
  for (const n of nodes) {
    nodeIdByLabel.set(n.label.toLowerCase(), n.id)
  }

  for (const conn of allConnections) {
    const fromId = nodeIdByLabel.get(conn.from.toLowerCase())
    const toId = nodeIdByLabel.get(conn.to.toLowerCase())
    if (fromId && toId) {
      link(fromId, toId)
    }
  }

  // Also link entities to entities via relatedEntities field
  for (const e of topEntities) {
    if (e.relatedEntities) {
      for (const rel of e.relatedEntities) {
        const relId = nodeIdByLabel.get(rel.toLowerCase())
        if (relId) link(`entity:${e.name}`, relId)
      }
    }
  }

  // Fallback heuristic edges for nodes with no connections
  const connectedNodes = new Set<string>()
  for (const e of edges) {
    connectedNodes.add(typeof e.source === 'string' ? e.source : e.source.id)
    connectedNodes.add(typeof e.target === 'string' ? e.target : e.target.id)
  }

  // Pattern <-> Theme (same dimension) — only for unconnected patterns
  for (const p of crossValidatedPatterns) {
    if (connectedNodes.has(`pattern:${p.id}`)) continue
    for (const t of topThemes)
      if (t.dimension === p.dimension) link(`pattern:${p.id}`, `theme:${t.label}`)
  }

  // Primitive <-> Pattern (word overlap) — only for unconnected primitives
  for (const c of cognitiveGenomePrimitives) {
    if (connectedNodes.has(`primitive:${c.name}`)) continue
    const cw = c.name.toLowerCase().split(/[-\s]+/)
    for (const p of crossValidatedPatterns) {
      const pw = p.label.toLowerCase().split(/[-\s]+/)
      if (cw.some(w => w.length > 3 && pw.some(x => x.includes(w)))) link(`primitive:${c.name}`, `pattern:${p.id}`)
    }
  }

  return { nodes, edges }
}

function drawGraph(
  ctx: CanvasRenderingContext2D, nodes: GraphNode[], edges: GraphEdge[],
  selectedId: string | null, hoveredId: string | null, visible: Set<NodeType>,
  dpr: number, transform: Transform,
) {
  const w = ctx.canvas.width / dpr
  const h = ctx.canvas.height / dpr
  ctx.save()
  ctx.scale(dpr, dpr)
  ctx.clearRect(0, 0, w, h)

  // Apply pan and zoom transform
  ctx.translate(transform.tx, transform.ty)
  ctx.scale(transform.scale, transform.scale)

  const connected = new Set<string>()
  if (selectedId)
    for (const e of edges) {
      const s = edgeId(e, 'source'), t = edgeId(e, 'target')
      if (s === selectedId) connected.add(t)
      if (t === selectedId) connected.add(s)
    }

  for (const e of edges) {
    const s = e.source as GraphNode, t = e.target as GraphNode
    if (!visible.has(s.type) || !visible.has(t.type)) continue
    if (s.x == null || s.y == null || t.x == null || t.y == null) continue
    const hl = selectedId != null && (s.id === selectedId || t.id === selectedId)
    ctx.strokeStyle = hl ? 'rgba(84,73,63,0.24)' : 'rgba(111,100,88,0.16)'
    ctx.lineWidth = hl ? 1.5 / transform.scale : 0.5 / transform.scale
    ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(t.x, t.y); ctx.stroke()
  }

  for (const n of nodes) {
    if (!visible.has(n.type) || n.x == null || n.y == null) continue
    const isSel = n.id === selectedId, isCon = connected.has(n.id)
    const dim = selectedId != null && !isSel && !isCon

    if (isSel) { ctx.shadowColor = n.color; ctx.shadowBlur = 16 / transform.scale }
    ctx.globalAlpha = dim ? 0.2 : 1
    ctx.fillStyle = n.color
    ctx.beginPath(); ctx.arc(n.x, n.y, n.size, 0, Math.PI * 2); ctx.fill()
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0

    if (isSel || isCon || n.id === hoveredId || !selectedId) {
      ctx.font = isSel
        ? '600 11px "Zen Kaku Gothic New", system-ui, sans-serif'
        : '500 10px "Zen Kaku Gothic New", system-ui, sans-serif'
      ctx.textAlign = 'center'
      const labelY = n.y + n.size + 13
      const metrics = ctx.measureText(n.label)
      const bgWidth = metrics.width + 12
      ctx.fillStyle = dim ? 'rgba(251,247,241,0.62)' : 'rgba(251,247,241,0.92)'
      ctx.beginPath()
      ctx.roundRect(n.x - bgWidth / 2, labelY - 10, bgWidth, 16, 5)
      ctx.fill()
      ctx.fillStyle = dim ? 'rgba(84,73,63,0.42)' : 'rgba(54,45,36,0.84)'
      ctx.fillText(n.label, n.x, labelY)
    }
    ctx.globalAlpha = 1
  }

  if (hoveredId && !selectedId) {
    const node = nodes.find(n => n.id === hoveredId)
    if (node?.x != null && node.y != null && visible.has(node.type)) {
      ctx.font = '500 11px "Zen Kaku Gothic New", system-ui, sans-serif'
      const m = ctx.measureText(node.label), px = 6, ty = node.y - node.size - 24
      ctx.fillStyle = 'rgba(251,247,241,0.95)'
      ctx.beginPath(); ctx.roundRect(node.x - m.width / 2 - px, ty - 4, m.width + px * 2, 18, 4); ctx.fill()
      ctx.fillStyle = 'rgba(31,25,19,0.92)'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, node.x, ty + 10)
    }
  }
  ctx.restore()
}

function findNodeAt(
  nodes: GraphNode[], mouseX: number, mouseY: number,
  visible: Set<NodeType>, transform: Transform,
): GraphNode | null {
  // Convert mouse coordinates (canvas space) to graph space
  const graphX = (mouseX - transform.tx) / transform.scale
  const graphY = (mouseY - transform.ty) / transform.scale
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i]
    if (!visible.has(n.type) || n.x == null || n.y == null) continue
    const dx = n.x - graphX, dy = n.y - graphY, r = n.size + 4
    if (dx * dx + dy * dy <= r * r) return n
  }
  return null
}

/** Color map for result type badges, aligned with the semantic map palette */
const RESULT_TYPE_COLORS: Record<string, string> = {
  cognitive_pattern: '#9f4a34',
  cross_validated_pattern: '#9f4a34',
  theme: '#82654b',
  entity: '#4e5f63',
  archetype: '#a77c58',
  potential: '#5f6e58',
  dimensional_score: '#756657',
  cycle: '#8c8272',
  projection: '#9a6c4a',
}

/** Color map for source badges */
const SOURCE_COLORS: Record<string, string> = {
  'claude-sessions': '#4e5f63',
  'codex-sessions': '#82654b',
  'social-traces': '#9f4a34',
  synthesis: '#5f6e58',
}

function formatTypeName(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function SimilarityBar({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[color:var(--panel)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            backgroundColor: value > 0.5 ? '#5f6e58' : value > 0.4 ? '#82654b' : '#9f4a34',
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-[color:var(--ink-faint)] w-10 text-right shrink-0">
        {pct}%
      </span>
    </div>
  )
}

function VectorSearchPanel({
  onHighlightNode,
}: {
  onHighlightNode: (nodeId: string) => void
}) {
  const [searchInput, setSearchInput] = useState('')
  const [activeQuery, setActiveQuery] = useState<SearchQuery | null>(null)
  const [expandedResult, setExpandedResult] = useState<number | null>(null)

  const { pipeline, searches } = vectorSearchDemo

  const handleDemoQuery = useCallback((query: SearchQuery) => {
    setSearchInput(query.query)
    setActiveQuery(query)
    setExpandedResult(null)
  }, [])

  const MAX_QUERY_LENGTH = 500

  const handleCustomSearch = useCallback(() => {
    if (searchInput.length > MAX_QUERY_LENGTH) return

    // Check if the input matches a demo query
    const match = searches.find(
      s => s.query.toLowerCase() === searchInput.toLowerCase()
    )
    if (match) {
      setActiveQuery(match)
      setExpandedResult(null)
    } else {
      // Show the CLI command for live queries
      setActiveQuery(null)
    }
  }, [searchInput, searches])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCustomSearch()
  }, [handleCustomSearch])

  const handleResultClick = useCallback((result: SearchResult, index: number) => {
    setExpandedResult(prev => prev === index ? null : index)

    // Try to find a matching node on the semantic map
    const text = result.text.toLowerCase()
    const type = result.type

    // Map result types to node ID prefixes
    const typeMap: Record<string, string> = {
      cognitive_pattern: 'pattern:',
      cross_validated_pattern: 'pattern:',
      theme: 'theme:',
      entity: 'entity:',
      archetype: 'archetype:',
      potential: 'potential:',
      dimensional_score: 'primitive:',
      cycle: 'theme:',
    }
    const prefix = typeMap[type]
    if (prefix) {
      // Extract a likely label from the result text
      const colonIdx = text.indexOf(':')
      if (colonIdx > -1) {
        const afterColon = result.text.slice(colonIdx + 1).trim()
        const label = afterColon.split('.')[0].trim()
        onHighlightNode(`${prefix}${label}`)
      }
    }
  }, [onHighlightNode])

  const isCustomQuery = searchInput.trim().length > 0 && !searches.some(
    s => s.query.toLowerCase() === searchInput.toLowerCase()
  )

  // Escape single quotes for shell safety: ' → '\''
  const safeQuery = (searchInput || 'your query here').replace(/'/g, "'\\''")
  const liveSearchCmd = `.venv/bin/python3 scripts/search-embeddings.py '${safeQuery}'`

  return (
    <div className="space-y-6">
      {/* Pipeline stats */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2 rounded-md border border-[color:var(--line-strong)] bg-[color:var(--panel-soft)] px-3 py-1.5">
          <span className="text-[color:var(--ink-faint)]">Model</span>
          <span className="font-mono text-[color:var(--ink)]">{pipeline.model}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[color:var(--line-strong)] bg-[color:var(--panel-soft)] px-3 py-1.5">
          <span className="text-[color:var(--ink-faint)]">Documents</span>
          <span className="font-mono text-[color:var(--ink)]">{pipeline.total_documents}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[color:var(--line-strong)] bg-[color:var(--panel-soft)] px-3 py-1.5">
          <span className="text-[color:var(--ink-faint)]">Dimensions</span>
          <span className="font-mono text-[color:var(--ink)]">{pipeline.embedding_dimensions}</span>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-[color:var(--line-strong)] bg-[color:var(--panel-soft)] px-3 py-1.5">
          <span className="text-[color:var(--ink-faint)]">Backend</span>
          <span className="font-mono text-[color:var(--ink)]">{pipeline.vector_db}</span>
        </div>
      </div>

      {/* Search input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search PSYCHE/OS embeddings..."
          className="flex-1 rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--paper-strong)] px-4 py-2.5 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-faint)] focus:outline-none focus:border-[color:var(--accent)]/55 focus:ring-1 focus:ring-[color:var(--accent)]/12 transition-colors"
        />
        <button
          onClick={handleCustomSearch}
          className="shrink-0 rounded-lg border border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10 px-4 py-2.5 text-sm text-[color:var(--accent)] hover:bg-[color:var(--accent)]/16 hover:border-[color:var(--accent)]/55 transition-colors cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* Demo query chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] self-center mr-1">Demo queries</span>
        {searches.map((s, i) => (
          <button
            key={i}
            onClick={() => handleDemoQuery(s)}
            className="rounded-md border px-3 py-1.5 text-xs transition-colors cursor-pointer"
            style={{
              color: activeQuery?.query === s.query ? '#9f4a34' : '#66594c',
              backgroundColor: activeQuery?.query === s.query ? 'rgba(159,74,52,0.10)' : 'rgba(252,247,239,0.48)',
              borderColor: activeQuery?.query === s.query ? 'rgba(159,74,52,0.34)' : 'rgba(63,49,34,0.16)',
            }}
          >
            {s.query}
          </button>
        ))}
      </div>

      {/* Results */}
      {activeQuery && (
        <div className="space-y-3">
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
            {activeQuery.results.length} results for &quot;{activeQuery.query}&quot;
          </div>
          {activeQuery.results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleResultClick(r, i)}
              className="w-full cursor-pointer rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--panel-soft)] text-left transition-colors hover:bg-[color:var(--panel)]"
            >
              <div className="p-4 space-y-3">
                {/* Header row: rank, type, source, similarity */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-[10px] font-mono text-[color:var(--ink-faint)] w-4 shrink-0">
                    #{r.rank}
                  </span>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded"
                    style={{
                      color: RESULT_TYPE_COLORS[r.type] ?? '#94a3b8',
                      backgroundColor: `${RESULT_TYPE_COLORS[r.type] ?? '#94a3b8'}15`,
                    }}
                  >
                    {formatTypeName(r.type)}
                  </span>
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded"
                    style={{
                      color: SOURCE_COLORS[r.source] ?? '#94a3b8',
                      backgroundColor: `${SOURCE_COLORS[r.source] ?? '#94a3b8'}15`,
                    }}
                  >
                    {r.source}
                  </span>
                  <div className="flex-1 min-w-[100px]">
                    <SimilarityBar value={r.similarity} />
                  </div>
                </div>

                {/* Text preview or full text */}
                <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">
                  {expandedResult === i
                    ? r.text
                    : r.text.length > 180
                      ? `${r.text.slice(0, 180)}...`
                      : r.text}
                </p>

                {/* Confidence */}
                {r.confidence > 0 && (
                  <div className="flex items-center gap-2 text-[10px] text-[color:var(--ink-faint)]">
                    <span>Confidence:</span>
                    <span className="font-mono text-[color:var(--ink-faint)]">{Math.round(r.confidence * 100)}%</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Custom query: show CLI command */}
      {isCustomQuery && !activeQuery && searchInput.trim().length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[color:var(--ink-soft)]">
            This query is not in the demo set. To run a live search against the ChromaDB vector store, use the CLI:
          </p>
          <CopyBlock code={liveSearchCmd} label="Run in terminal" />
        </div>
      )}
    </div>
  )
}

export default function SemanticMapView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const graphRef = useRef<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null)
  const simRef = useRef<ReturnType<typeof forceSimulation<GraphNode>> | null>(null)
  const transformRef = useRef<Transform>({ scale: 1, tx: 0, ty: 0 })
  const dragNodeRef = useRef<GraphNode | null>(null)
  const isPanningRef = useRef(false)
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const rafRef = useRef<number>(0)

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(new Set(ALL_TYPES))
  const [zoomLevel, setZoomLevel] = useState(1)
  const [mapSearch, setMapSearch] = useState('')
  const [graphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] }>(() => buildGraph())

  // Stable refs for values needed inside non-React event handlers
  const visibleTypesRef = useRef(visibleTypes)
  const selectedNodeRef = useRef(selectedNode)
  const hoveredIdRef = useRef(hoveredId)

  useLayoutEffect(() => {
    visibleTypesRef.current = visibleTypes
  }, [visibleTypes])

  useLayoutEffect(() => {
    selectedNodeRef.current = selectedNode
  }, [selectedNode])

  useLayoutEffect(() => {
    hoveredIdRef.current = hoveredId
  }, [hoveredId])

  const toggleType = useCallback((type: NodeType) => {
    setVisibleTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type); else next.add(type)
      return next
    })
  }, [])

  const requestRedraw = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      const graph = graphRef.current
      if (!canvas || !graph) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const dpr = window.devicePixelRatio || 1
      drawGraph(
        ctx, graph.nodes, graph.edges,
        selectedNodeRef.current?.id ?? null,
        hoveredIdRef.current,
        visibleTypesRef.current, dpr, transformRef.current,
      )
    })
  }, [])

  const resetView = useCallback(() => {
    transformRef.current = { scale: 1, tx: 0, ty: 0 }
    setZoomLevel(1)
    requestRedraw()
  }, [requestRedraw])

  const centerOnNode = useCallback((node: GraphNode, scaleOverride?: number) => {
    const canvas = canvasRef.current
    if (!canvas || node.x == null || node.y == null) return

    const rect = canvas.getBoundingClientRect()
    const nextScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, scaleOverride ?? Math.max(transformRef.current.scale, 1.15)))
    transformRef.current = {
      scale: nextScale,
      tx: rect.width / 2 - node.x * nextScale,
      ty: rect.height / 2 - node.y * nextScale,
    }
    setZoomLevel(Math.round(nextScale * 100) / 100)
    requestRedraw()
  }, [requestRedraw])

  const selectNode = useCallback((node: GraphNode | null, options?: { center?: boolean }) => {
    setSelectedNode(node)
    if (node && options?.center) {
      centerOnNode(node)
    }
  }, [centerOnNode])

  // Initialize graph and simulation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { nodes, edges } = graphData
    graphRef.current = { nodes, edges }
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const sim = forceSimulation<GraphNode>(nodes)
      .force('link', forceLink<GraphNode, GraphEdge>(edges).id(d => d.id).distance(100))
      .force('charge', forceManyBody().strength(-180))
      .force('center', forceCenter(rect.width / 2, rect.height / 2))
      .force('collide', forceCollide<GraphNode>(d => d.size + 6))

    simRef.current = sim

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    sim.on('tick', () => {
      drawGraph(ctx, nodes, edges,
        selectedNodeRef.current?.id ?? null,
        hoveredIdRef.current,
        visibleTypesRef.current, dpr, transformRef.current)
    })
    return () => { sim.stop() }
  }, [graphData])

  // Redraw when React state changes (selectedNode, hoveredId, visibleTypes)
  useEffect(() => {
    requestRedraw()
  }, [selectedNode, hoveredId, visibleTypes, requestRedraw])

  // Mouse wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top

      const t = transformRef.current
      const zoomFactor = e.deltaY < 0 ? 1.1 : 1 / 1.1
      const newScale = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, t.scale * zoomFactor))
      const ratio = newScale / t.scale

      // Zoom centered on mouse position
      const newTx = mouseX - ratio * (mouseX - t.tx)
      const newTy = mouseY - ratio * (mouseY - t.ty)

      transformRef.current = { scale: newScale, tx: newTx, ty: newTy }
      setZoomLevel(Math.round(newScale * 100) / 100)
      requestRedraw()
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => { canvas.removeEventListener('wheel', handleWheel) }
  }, [requestRedraw])

  // Mouse down: start pan or node drag
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const graph = graphRef.current
    if (!canvas || !graph) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    lastMouseRef.current = { x: mouseX, y: mouseY }

    const hit = findNodeAt(graph.nodes, mouseX, mouseY, visibleTypes, transformRef.current)

    if (hit) {
      // Start node drag
      dragNodeRef.current = hit
      const t = transformRef.current
      hit.fx = (mouseX - t.tx) / t.scale
      hit.fy = (mouseY - t.ty) / t.scale
      // Reheat simulation
      const sim = simRef.current
      if (sim) {
        sim.alphaTarget(0.3).restart()
      }
    } else {
      // Start panning
      isPanningRef.current = true
    }
  }, [visibleTypes])

  // Mouse move: continue pan or node drag, or just hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const graph = graphRef.current
    if (!canvas || !graph) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    if (dragNodeRef.current) {
      // Node dragging
      const t = transformRef.current
      dragNodeRef.current.fx = (mouseX - t.tx) / t.scale
      dragNodeRef.current.fy = (mouseY - t.ty) / t.scale
      canvas.style.cursor = 'grabbing'
      return
    }

    if (isPanningRef.current) {
      // Panning
      const dx = mouseX - lastMouseRef.current.x
      const dy = mouseY - lastMouseRef.current.y
      lastMouseRef.current = { x: mouseX, y: mouseY }

      const t = transformRef.current
      transformRef.current = { scale: t.scale, tx: t.tx + dx, ty: t.ty + dy }
      canvas.style.cursor = 'grabbing'
      requestRedraw()
      return
    }

    // Hover detection
    const hit = findNodeAt(graph.nodes, mouseX, mouseY, visibleTypes, transformRef.current)
    setHoveredId(hit?.id ?? null)
    canvas.style.cursor = hit ? 'pointer' : 'grab'
  }, [visibleTypes, requestRedraw])

  // Click handler: select node only if no drag/pan occurred
  // We track drag distance to distinguish click from drag
  const mouseDownPosRef = useRef<{ x: number; y: number } | null>(null)

  const handleMouseDownWrapped = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (rect) {
      mouseDownPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    handleMouseDown(e)
  }, [handleMouseDown])

  const handleMouseUpWrapped = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const graph = graphRef.current
    const startPos = mouseDownPosRef.current

    const wasDraggingNode = dragNodeRef.current != null
    const wasPanning = isPanningRef.current

    // Release drag/pan state
    if (dragNodeRef.current) {
      dragNodeRef.current.fx = null
      dragNodeRef.current.fy = null
      dragNodeRef.current = null
      const sim = simRef.current
      if (sim) {
        sim.alphaTarget(0)
      }
    }
    isPanningRef.current = false

    // Determine if this was a click (mouse barely moved)
    if (canvas && graph && startPos) {
      const rect = canvas.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const dx = mouseX - startPos.x
      const dy = mouseY - startPos.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 5 && !wasDraggingNode && !wasPanning) {
        // This was a click
        selectNode(findNodeAt(graph.nodes, mouseX, mouseY, visibleTypes, transformRef.current))
      } else if (dist < 5 && wasDraggingNode) {
        // Clicked on a node without really dragging: select it
        const hit = findNodeAt(graph.nodes, mouseX, mouseY, visibleTypes, transformRef.current)
        if (hit) selectNode(hit)
      }

      const hit = findNodeAt(graph.nodes, mouseX, mouseY, visibleTypes, transformRef.current)
      canvas.style.cursor = hit ? 'pointer' : 'grab'
    }

    mouseDownPosRef.current = null
  }, [selectNode, visibleTypes])

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
    // Clean up any active drag/pan
    if (dragNodeRef.current) {
      dragNodeRef.current.fx = null
      dragNodeRef.current.fy = null
      dragNodeRef.current = null
      const sim = simRef.current
      if (sim) sim.alphaTarget(0)
    }
    isPanningRef.current = false
  }, [])

  const handleHighlightNode = useCallback((nodeId: string) => {
    const graph = graphRef.current
    if (!graph) return
    // Try exact match first, then partial label match
    const exact = graph.nodes.find(n => n.id === nodeId)
    if (exact) {
      selectNode(exact, { center: true })
      return
    }
    // Fuzzy: match on label substring
    const label = nodeId.includes(':') ? nodeId.split(':').slice(1).join(':') : nodeId
    const fuzzy = graph.nodes.find(
      n => n.label.toLowerCase().includes(label.toLowerCase())
        || label.toLowerCase().includes(n.label.toLowerCase())
    )
    if (fuzzy) {
      selectNode(fuzzy, { center: true })
    }
  }, [selectNode])

  const visibleNodeCount = useMemo(
    () => graphData.nodes.filter(node => visibleTypes.has(node.type)).length,
    [graphData.nodes, visibleTypes],
  )

  const quickJumpNodes = useMemo(
    () => [...graphData.nodes]
      .filter(node => visibleTypes.has(node.type))
      .sort((left, right) => right.size - left.size)
      .slice(0, 8),
    [graphData.nodes, visibleTypes],
  )

  const mapSuggestions = useMemo(() => {
    const query = mapSearch.trim().toLowerCase()
    const candidates = graphData.nodes.filter(node => visibleTypes.has(node.type))

    if (!query) return candidates.sort((left, right) => right.size - left.size).slice(0, 8)

    return candidates
      .filter(node => {
        const haystack = `${node.label} ${TYPE_LABELS[node.type]}`.toLowerCase()
        return haystack.includes(query)
      })
      .sort((left, right) => {
        const leftStarts = left.label.toLowerCase().startsWith(query) ? 1 : 0
        const rightStarts = right.label.toLowerCase().startsWith(query) ? 1 : 0
        if (leftStarts !== rightStarts) return rightStarts - leftStarts
        return right.size - left.size
      })
      .slice(0, 8)
  }, [graphData.nodes, mapSearch, visibleTypes])

  const currentPreset = useMemo(() => {
    for (const preset of FILTER_PRESETS) {
      if (preset.types.length !== visibleTypes.size) continue
      if (preset.types.every(type => visibleTypes.has(type))) return preset.id
    }
    return null
  }, [visibleTypes])

  const applyPreset = useCallback((types: NodeType[]) => {
    setVisibleTypes(new Set(types))
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedNode(null)
        setHoveredId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const connectedEdges = useMemo(() => selectedNode
    ? (graphData?.edges ?? []).filter(e => edgeId(e, 'source') === selectedNode.id || edgeId(e, 'target') === selectedNode.id)
    : [], [selectedNode, graphData])

  return (
    <div className="min-h-screen bg-transparent px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          title="Semantic Map"
          subtitle="Interactive concept graph with quick jump, filters, and focus tools. Search a node, center it, then follow its connections."
        />

        <div className="mb-4 rounded-xl border border-[color:var(--line-strong)] bg-[color:var(--panel-soft)] p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-faint)]">Quick navigation</div>
                <p className="mt-2 text-sm text-[color:var(--ink-soft)]">
                  Search a node by name, jump to a frequent concept, or reduce visual noise with a preset.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="search"
                  value={mapSearch}
                  onChange={(event) => setMapSearch(event.target.value)}
                  placeholder="Find a node or concept"
                  className="flex-1 rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--paper-strong)] px-4 py-2.5 text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-faint)] focus:outline-none focus:border-[color:var(--accent)]/55 focus:ring-1 focus:ring-[color:var(--accent)]/12 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => {
                    const first = mapSuggestions[0]
                    if (first) selectNode(first, { center: true })
                  }}
                  disabled={mapSuggestions.length === 0}
                  className="rounded-lg border border-[color:var(--accent)]/35 bg-[color:var(--accent)]/10 px-4 py-2.5 text-sm text-[color:var(--accent)] transition-colors hover:bg-[color:var(--accent)]/16 hover:border-[color:var(--accent)]/55 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Jump
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {mapSuggestions.map((node) => (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => selectNode(node, { center: true })}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[color:var(--paper-strong)]"
                    style={{
                      color: node.color,
                      backgroundColor: `${node.color}12`,
                      borderColor: `${node.color}32`,
                    }}
                  >
                    {node.label}
                  </button>
                ))}
                {mapSuggestions.length === 0 && (
                  <span className="text-xs text-[color:var(--ink-faint)]">No visible nodes match this search.</span>
                )}
              </div>
            </div>

            <div className="min-w-0 lg:w-[18rem] space-y-3">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--ink-faint)]">Presets</div>
              <div className="flex flex-wrap gap-2">
                {FILTER_PRESETS.map((preset) => {
                  const active = currentPreset === preset.id
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.types)}
                      className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        color: active ? 'var(--accent)' : '#66594c',
                        backgroundColor: active ? 'rgba(66,133,244,0.12)' : 'rgba(252,247,239,0.42)',
                        borderColor: active ? 'rgba(66,133,244,0.35)' : 'rgba(63,49,34,0.16)',
                      }}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
              <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--paper-strong)] px-3 py-2.5 text-xs text-[color:var(--ink-soft)]">
                Visible nodes: <span className="font-mono text-[color:var(--ink)]">{visibleNodeCount}</span>
                <br />
                Selected: <span className="font-medium text-[color:var(--ink)]">{selectedNode?.label ?? 'None'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          {ALL_TYPES.map(type => {
            const on = visibleTypes.has(type)
            return (
              <button key={type} onClick={() => toggleType(type)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                style={{ color: on ? NODE_COLORS[type] : '#66594c',
                  backgroundColor: on ? `${NODE_COLORS[type]}15` : 'rgba(252,247,239,0.42)',
                  borderWidth: 1, borderColor: on ? `${NODE_COLORS[type]}40` : 'rgba(63,49,34,0.16)' }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: on ? NODE_COLORS[type] : '#a89987' }} />
                {TYPE_LABELS[type]}
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          <div className="relative rounded-lg border border-[color:var(--line-strong)] overflow-hidden bg-[color:var(--panel-soft)]">
            <canvas ref={canvasRef} className="w-full" style={{ height: 600, cursor: 'grab' }}
              onMouseDown={handleMouseDownWrapped}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpWrapped}
              onMouseLeave={handleMouseLeave}
            />

            {/* Zoom level indicator and Reset View button */}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="text-[10px] font-mono text-[color:var(--ink-faint)] bg-[color:var(--panel)] px-2 py-1 rounded border border-[color:var(--line-strong)]">
                {Math.round(zoomLevel * 100)}%
              </span>
              {selectedNode && (
                <button
                  onClick={() => centerOnNode(selectedNode)}
                  className="cursor-pointer rounded border border-[color:var(--line-strong)] bg-[color:var(--panel)] px-2 py-1 text-[10px] font-medium text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--accent)]/35 hover:text-[color:var(--accent)]"
                >
                  Focus selection
                </button>
              )}
              {zoomLevel !== 1 && (
                <button
                  onClick={resetView}
                  className="cursor-pointer rounded border border-[color:var(--line-strong)] bg-[color:var(--panel)] px-2 py-1 text-[10px] font-medium text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--accent)]/35 hover:text-[color:var(--accent)]"
                >
                  Reset View
                </button>
              )}
            </div>

            {/* Navigation hints */}
            <div className="absolute top-3 right-3 text-[9px] text-[color:var(--ink-faint)] bg-[color:var(--panel)] px-2 py-1 rounded">
              Scroll: zoom | Drag background: pan | Drag node: move | Esc: clear
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--line-strong)] bg-[color:var(--panel-soft)] p-4 h-fit">
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded"
                      style={{ color: selectedNode.color, backgroundColor: `${selectedNode.color}15` }}>
                      {TYPE_LABELS[selectedNode.type]}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectNode(null)}
                    className="rounded border border-[color:var(--line)] px-2 py-1 text-[10px] font-medium text-[color:var(--ink-faint)] transition-colors hover:border-[color:var(--accent)]/35 hover:text-[color:var(--accent)]"
                  >
                    Clear
                  </button>
                </div>
                <h3 className="text-sm font-medium text-[color:var(--ink)]">{selectedNode.label}</h3>
                <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">{selectedNode.detail}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => centerOnNode(selectedNode)}
                    className="rounded-md border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-3 py-1.5 text-xs font-medium text-[color:var(--accent)] transition-colors hover:bg-[color:var(--accent)]/16"
                  >
                    Center on map
                  </button>
                  <span className="rounded-md border border-[color:var(--line)] bg-[color:var(--paper-strong)] px-3 py-1.5 text-xs text-[color:var(--ink-soft)]">
                    {connectedEdges.length} linked node{connectedEdges.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-2">Connections</h4>
                  <div className="space-y-1 max-h-72 overflow-auto pr-1">
                    {connectedEdges.map((e, i) => {
                      const otherId = edgeId(e, 'source') === selectedNode.id ? edgeId(e, 'target') : edgeId(e, 'source')
                      const other = graphData?.nodes.find(n => n.id === otherId)
                      if (!other) return null
                      return (
                        <button key={i} onClick={() => selectNode(other, { center: true })}
                          className="flex items-center justify-between gap-2 w-full text-left px-2 py-1.5 rounded hover:bg-[color:var(--panel-soft)] transition-colors cursor-pointer">
                          <span className="flex min-w-0 items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: other.color }} />
                          <span className="text-xs text-[color:var(--ink-soft)] truncate">{other.label}</span>
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-faint)]">{TYPE_LABELS[other.type]}</span>
                        </button>
                      )
                    })}
                    {connectedEdges.length === 0 && (
                      <p className="text-xs text-[color:var(--ink-faint)]">This node has no visible connections with the current filters.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed">
                  Start from a quick jump below or click a node on the graph to inspect details and connected concepts.
                </p>
                <div>
                  <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-2">Popular entry points</h4>
                  <div className="space-y-1">
                    {quickJumpNodes.map((node) => (
                      <button
                        key={node.id}
                        type="button"
                        onClick={() => selectNode(node, { center: true })}
                        className="flex items-center justify-between gap-2 w-full rounded px-2 py-1.5 text-left transition-colors hover:bg-[color:var(--paper-strong)]"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.color }} />
                          <span className="truncate text-xs text-[color:var(--ink-soft)]">{node.label}</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--ink-faint)]">{TYPE_LABELS[node.type]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-16">
          <SectionHead
            title="Vector Search"
            subtitle="Search across 223 PSYCHE/OS documents using semantic embeddings. Click a demo query or type your own."
          />
          <VectorSearchPanel onHighlightNode={handleHighlightNode} />
        </div>
      </div>
    </div>
  )
}
