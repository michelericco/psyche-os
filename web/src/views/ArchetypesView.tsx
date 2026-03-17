import { useMemo, useState } from 'react'
import { archetypeMapping, crossValidatedPatterns } from '../data/loader'
import type { ArchetypeEntry } from '../data/types'
import {
  SectionHead,
  TwoCol,
  Expandable,
  ConfidenceBar,
  Cite,
  References,
  ExploreButton,
} from '../components/shared'

type ArchetypeRole = 'dominant' | 'secondary' | 'emergent' | 'goldenShadow'

const ROLE_CONFIG: Record<ArchetypeRole, { label: string; svgColor: string; description: string }> = {
  dominant: {
    label: 'DOMINANT',
    svgColor: '#60a5fa',
    description: 'The primary archetypal energy shaping conscious behavior and self-image. This is the lens through which the individual most naturally engages the world.',
  },
  secondary: {
    label: 'SECONDARY',
    svgColor: '#a78bfa',
    description: 'A supporting archetype that complements the dominant pattern. Active but less central, it provides balance and additional capacity.',
  },
  emergent: {
    label: 'EMERGENT',
    svgColor: '#fbbf24',
    description: 'An archetype gaining strength over time. Not yet fully integrated, it represents a direction of psychological growth.',
  },
  goldenShadow: {
    label: 'GOLDEN SHADOW',
    svgColor: '#34d399',
    description: 'Unrealized potential projected onto others. The Golden Shadow contains admired qualities that the individual possesses but has not yet claimed.',
  },
}

const ROLES: ArchetypeRole[] = ['dominant', 'secondary', 'emergent', 'goldenShadow']

// Helper: get patterns related to this archetype
function getRelatedPatterns(role: ArchetypeRole): typeof crossValidatedPatterns {
  const entry = archetypeMapping[role]
  return crossValidatedPatterns.filter(p => 
    p.archetypeResonance?.includes(entry.archetype) || 
    p.archetypeResonance?.some(a => a.toLowerCase().includes(entry.archetype.toLowerCase()))
  )
}

function ArchetypeDiagram({ selectedRole, onSelectRole }: { selectedRole: ArchetypeRole | null; onSelectRole: (role: ArchetypeRole | null) => void }) {
  const cx = 240
  const cy = 200
  const r = 120

  const [hoveredRole, setHoveredRole] = useState<ArchetypeRole | null>(null)
  const [pointer, setPointer] = useState({ x: cx, y: cy, active: false })

  const nodes: { role: ArchetypeRole; x: number; y: number }[] = [
    { role: 'dominant', x: cx, y: cy - r },
    { role: 'secondary', x: cx + r, y: cy },
    { role: 'emergent', x: cx, y: cy + r },
    { role: 'goldenShadow', x: cx - r, y: cy },
  ]

  const roleByDistance = useMemo(() => {
    const distances = nodes.map((node) => {
      const dx = pointer.x - node.x
      const dy = pointer.y - node.y
      return { role: node.role, distance: Math.hypot(dx, dy) }
    })
    const nearest = distances.sort((a, b) => a.distance - b.distance)[0]
    if (!nearest || nearest.distance > 100) return null
    return nearest.role
  }, [nodes, pointer.x, pointer.y])

  const activeRole = selectedRole || hoveredRole || roleByDistance
  const pointerDx = pointer.active ? (pointer.x - cx) / 40 : 0
  const pointerDy = pointer.active ? (pointer.y - cy) / 40 : 0
  const activeEntry = activeRole ? archetypeMapping[activeRole] : null

  const handlePointerMove: React.PointerEventHandler<SVGSVGElement> = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 480
    const y = ((e.clientY - rect.top) / rect.height) * 400
    setPointer({ x, y, active: true })
  }

  const handlePointerLeave = () => {
    setPointer({ x: cx, y: cy, active: false })
    if (!selectedRole) setHoveredRole(null)
  }

  const handleNodeClick = (role: ArchetypeRole) => {
    onSelectRole(selectedRole === role ? null : role)
  }

  return (
    <div className="flex flex-col items-center py-4 gap-3">
      <svg
        viewBox="0 0 480 400"
        className="w-full max-w-md cursor-crosshair"
        xmlns="http://www.w3.org/2000/svg"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <defs>
          <radialGradient id="archetypeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Cursor-reactive ambient glow */}
        <circle
          cx={pointer.x}
          cy={pointer.y}
          r={pointer.active ? 80 : 0}
          fill="url(#archetypeGlow)"
          style={{ transition: 'r 200ms ease-out' }}
        />

        {/* Diamond lines */}
        <polygon
          points={nodes.map((n) => `${n.x},${n.y}`).join(' ')}
          fill="none"
          stroke={activeRole ? ROLE_CONFIG[activeRole].svgColor : '#334155'}
          strokeWidth={activeRole ? '0.9' : '0.5'}
          opacity={activeRole ? 0.9 : 1}
          style={{ transition: 'all 180ms ease-out' }}
        />

        {/* Cross lines through center */}
        <line
          x1={nodes[0].x}
          y1={nodes[0].y}
          x2={nodes[2].x}
          y2={nodes[2].y}
          stroke="#334155"
          strokeWidth={activeRole === 'dominant' || activeRole === 'emergent' ? '0.9' : '0.5'}
          opacity={activeRole ? 0.8 : 1}
          style={{ transition: 'all 180ms ease-out' }}
        />
        <line
          x1={nodes[1].x}
          y1={nodes[1].y}
          x2={nodes[3].x}
          y2={nodes[3].y}
          stroke="#334155"
          strokeWidth={activeRole === 'secondary' || activeRole === 'goldenShadow' ? '0.9' : '0.5'}
          opacity={activeRole ? 0.8 : 1}
          style={{ transition: 'all 180ms ease-out' }}
        />

        {/* Center label */}
        <text
          x={cx + pointerDx}
          y={cy + pointerDy}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#94a3b8"
          fontSize="10"
          fontWeight="500"
          letterSpacing="0.2em"
          style={{ transition: 'all 140ms ease-out' }}
        >
          SELF
        </text>

        {/* Archetype text nodes */}
        {nodes.map(({ role, x, y }) => {
          const entry = archetypeMapping[role]
          const config = ROLE_CONFIG[role]
          const isSelected = selectedRole === role
          const isHovered = hoveredRole === role
          const isFocused = isSelected || isHovered || roleByDistance === role

          const offsetY = role === 'dominant' ? -16 : role === 'emergent' ? 16 : 0
          const offsetX = role === 'secondary' ? 16 : role === 'goldenShadow' ? -16 : 0
          const anchor = role === 'secondary' ? 'start' : role === 'goldenShadow' ? 'end' : 'middle'

          const labelParts = config.label.split(' ')
          const isMultiWordLabel = labelParts.length > 1
          const emphasis = isFocused ? 1 : activeRole && !isSelected ? 0.45 : 1

          const nodeDx = pointer.active ? (pointer.x - x) / -30 : 0
          const nodeDy = pointer.active ? (pointer.y - y) / -30 : 0

          return (
            <g
              key={role}
              opacity={emphasis}
              onClick={() => handleNodeClick(role)}
              onPointerEnter={() => setHoveredRole(role)}
              onPointerLeave={() => !selectedRole && setHoveredRole(null)}
              style={{ transition: 'opacity 180ms ease-out', cursor: 'pointer' }}
            >
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 28 : isFocused ? 22 : 16}
                fill={config.svgColor}
                opacity={isSelected ? 0.3 : isFocused ? 0.18 : 0.08}
                style={{ transition: 'all 180ms ease-out' }}
              />
              {isSelected && (
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 28 : 16}
                  fill="none"
                  stroke={config.svgColor}
                  strokeWidth="1.5"
                  opacity={0.8}
                  style={{ transition: 'all 180ms ease-out' }}
                />
              )}
              <text
                x={x + offsetX + nodeDx}
                y={y + offsetY - (isMultiWordLabel ? 14 : 8) + nodeDy}
                textAnchor={anchor}
                dominantBaseline="central"
                fill="#64748b"
                fontSize="8"
                letterSpacing="0.15em"
                style={{ transition: 'all 140ms ease-out', touchAction: 'none' }}
              >
                {isMultiWordLabel ? (
                  <>
                    <tspan x={x + offsetX + nodeDx} dy="0">{labelParts[0]}</tspan>
                    <tspan x={x + offsetX + nodeDx} dy="10">{labelParts.slice(1).join(' ')}</tspan>
                  </>
                ) : (
                  config.label
                )}
              </text>
              <text
                x={x + offsetX + nodeDx}
                y={y + offsetY + (isMultiWordLabel ? 12 : 6) + nodeDy}
                textAnchor={anchor}
                dominantBaseline="central"
                fill={config.svgColor}
                fontSize={isFocused ? '12' : '11'}
                fontWeight={isSelected ? '700' : '500'}
                style={{ transition: 'all 160ms ease-out' }}
              >
                {entry.archetype}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="w-full max-w-md min-h-16 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)]/40 px-3 py-2">
        {activeEntry && activeRole ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] tracking-wider" style={{ color: ROLE_CONFIG[activeRole].svgColor }}>
                {ROLE_CONFIG[activeRole].label}
              </span>
              <span className="text-xs text-[color:var(--ink)]">{activeEntry.archetype}</span>
            </div>
            <p className="mt-1 text-xs text-[color:var(--ink-faint)] leading-relaxed">
              {activeEntry.manifestation}
            </p>
          </>
        ) : (
          <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed">
            Clicca su un archetipo per esplorare i dettagli. Muovi il mouse per vedere le relazioni.
          </p>
        )}
      </div>
    </div>
  )
}

function ArchetypeDetailPanel({ role, entry, onClose }: { role: ArchetypeRole; entry: ArchetypeEntry; onClose: () => void }) {
  const config = ROLE_CONFIG[role]
  const relatedPatterns = getRelatedPatterns(role)

  return (
    <div className="flex flex-col gap-6 p-5 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)]/60 h-full overflow-y-auto">
      {/* Header with close button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium tracking-widest px-2 py-1 rounded" style={{ backgroundColor: config.svgColor + '20', color: config.svgColor }}>
              {config.label}
            </span>
          </div>
          <h3 className="text-lg font-medium text-[color:var(--ink)]">{entry.archetype}</h3>
          <div className="mt-2 max-w-sm">
            <ConfidenceBar value={entry.confidence} />
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[color:var(--ink-faint)] hover:text-[color:var(--ink)] transition-colors p-1"
          aria-label="Close panel"
        >
          ✕
        </button>
      </div>

      {/* Manifestation */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-medium">Manifestation</h4>
        <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{entry.manifestation}</p>
      </div>

      {/* Shadow */}
      <div className="space-y-2 border-l-2 border-amber-500/30 pl-4">
        <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-medium">Shadow Aspect</h4>
        <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{entry.shadow}</p>
      </div>

      {/* Evidence */}
      {entry.evidence && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-medium">Evidence</h4>
          <p className="text-xs leading-relaxed text-[color:var(--ink-faint)]">{entry.evidence}</p>
        </div>
      )}

      {/* Related Patterns */}
      {relatedPatterns.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-medium">Resonates With Patterns</h4>
          <div className="space-y-1">
            {relatedPatterns.slice(0, 3).map((p) => (
              <div key={p.id} className="text-xs p-2 rounded bg-[color:var(--surface)] border-l-2" style={{ borderColor: '#9f4a34' }}>
                <div className="font-medium text-[color:var(--ink)]">{p.label}</div>
                <div className="text-[color:var(--ink-faint)] mt-1">Confidence: {(p.confidence * 100).toFixed(0)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Growth Trajectory (for emergent) */}
      {role === 'emergent' && (
        <div className="space-y-2 p-3 rounded bg-amber-500/5 border border-amber-500/20">
          <h4 className="text-[10px] uppercase tracking-wider text-amber-700 font-medium">Growth Trajectory</h4>
          <div className="space-y-2">
            <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">
              This archetypal energy is gaining strength and integration over time. It represents a direction of psychological development and individuation.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 h-1.5 bg-gradient-to-r from-amber-500/30 to-amber-500/80 rounded-full" />
              <span className="text-[10px] text-amber-700 font-medium">Integrating</span>
            </div>
          </div>
        </div>
      )}

      {/* Potential (for golden shadow) */}
      {role === 'goldenShadow' && (
        <div className="space-y-2 p-3 rounded bg-emerald-500/5 border border-emerald-500/20">
          <h4 className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium">Unrealized Potential</h4>
          <div className="space-y-2">
            <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">
              These qualities are admired in others but not yet claimed as your own. Integration of the Golden Shadow represents a key individuation opportunity.
            </p>
            <div className="text-xs text-emerald-700 font-medium mt-3">Opportunity: Embody these archetype qualities in your own practice</div>
          </div>
        </div>
      )}

      {/* Individuation Journey Visualization */}
      {role === 'dominant' && (
        <div className="space-y-2 p-3 rounded bg-blue-500/5 border border-blue-500/20">
          <h4 className="text-[10px] uppercase tracking-wider text-blue-700 font-medium">Conscious Integration</h4>
          <div className="space-y-3">
            <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">
              This archetype is fully integrated into conscious awareness and behavior. It is your primary lens for engaging the world and represents your main strengths.
            </p>
            <div className="relative h-8 bg-gradient-to-r from-blue-500/20 to-blue-500/60 rounded-full flex items-center justify-start pl-3 overflow-hidden">
              <div className="text-xs font-bold text-blue-700">Fully Integrated</div>
            </div>
          </div>
        </div>
      )}

      {/* Individuation Journey Visualization */}
      {role === 'secondary' && (
        <div className="space-y-2 p-3 rounded bg-purple-500/5 border border-purple-500/20">
          <h4 className="text-[10px] uppercase tracking-wider text-purple-700 font-medium">Complementary Energy</h4>
          <div className="space-y-3">
            <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">
              This archetype provides balance and depth to your primary pattern. It activates in specific contexts and offers additional capacity.
            </p>
            <div className="relative h-8 bg-gradient-to-r from-purple-500/30 to-purple-500/70 rounded-full flex items-center justify-start pl-3 overflow-hidden">
              <div className="text-xs font-bold text-purple-700">Integrated</div>
            </div>
          </div>
        </div>
      )}

      {/* Position explanation */}
      <div className="pt-3 border-t border-[color:var(--line)]">
        <p className="text-[10px] text-[color:var(--ink-faint)] leading-relaxed">{config.description}</p>
      </div>
    </div>
  )
}

function PositionExplanations() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed">
        The diamond arranges four archetypal positions around a central Self.
        Each position represents a different relationship to conscious awareness:
      </p>
      {ROLES.map((role) => {
        const config = ROLE_CONFIG[role]
        return (
          <div key={role} className="border-l-2 pl-3" style={{ borderColor: config.svgColor }}>
            <span
              className="text-[10px] font-medium tracking-wider"
              style={{ color: config.svgColor }}
            >
              {config.label}
            </span>
            <p className="mt-1 text-xs text-[color:var(--ink-faint)] leading-relaxed">
              {config.description}
            </p>
          </div>
        )
      })}
    </div>
  )
}

function ArchetypeReferences() {
  return (
    <References>
      <Cite
        author="Jung, C. G."
        work="The Archetypes and the Collective Unconscious"
        year="1959"
        detail="Foundational theory of universal archetypal patterns in the psyche."
      />
      <Cite
        author="Campbell, J."
        work="The Hero with a Thousand Faces"
        year="1949"
        detail="Cross-cultural analysis of archetypal narrative structures."
      />
      <Cite
        author="von Franz, M.-L."
        work="The Interpretation of Fairy Tales"
        year="1970"
        detail="Archetypal amplification method applied to symbolic material."
      />
      <Cite
        author="Hillman, J."
        work="Re-Visioning Psychology"
        year="1975"
        detail="Archetypal psychology: each archetype as an autonomous perspective of the soul."
      />
    </References>
  )
}

function ArchetypeExpandedContent({ entry }: { entry: ArchetypeEntry }) {
  return (
    <div className="space-y-5">
      {/* Manifestation */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-2">
          Manifestation
        </h4>
        <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">
          {entry.manifestation}
        </p>
      </div>

      {/* Shadow */}
      <div className="border-l-2 border-amber-500/30 pl-4">
        <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-2">
          Shadow
        </h4>
        <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">
          {entry.shadow}
        </p>
      </div>

      {/* Evidence */}
      {entry.evidence && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-2">
            Evidence
          </h4>
          <p className="text-xs leading-relaxed text-[color:var(--ink-faint)]">
            {entry.evidence}
          </p>
        </div>
      )}

      <ArchetypeReferences />
    </div>
  )
}

function ArchetypeTitle({ role, entry }: { role: ArchetypeRole; entry: ArchetypeEntry }) {
  const config = ROLE_CONFIG[role]
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-[10px] font-medium tracking-wider"
          style={{ color: config.svgColor }}
        >
          {config.label}
        </span>
        <span className="text-sm font-medium text-[color:var(--ink)]">
          {entry.archetype}
        </span>
      </div>
      <div className="max-w-xs">
        <ConfidenceBar value={entry.confidence} />
      </div>
    </div>
  )
}

export default function ArchetypesView() {
  const [selectedRole, setSelectedRole] = useState<ArchetypeRole | null>(null)

  return (
    <div className="min-h-screen bg-transparent px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHead
          title="Archetype Mapping"
          explanation="Jungian archetypes are recurring patterns of personality that emerge across cultures and individuals. This mapping identifies which archetypal energies are most active in your digital traces. Click on any archetype to explore its manifestation, shadow aspects, and connections with validated patterns."
        />

        {/* Interactive diagram with detail panel */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Diagram & explanation */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-[color:var(--ink)] mb-4 tracking-wide uppercase">Four Archetypal Positions</h3>
              <TwoCol
                left={<ArchetypeDiagram selectedRole={selectedRole} onSelectRole={setSelectedRole} />}
                right={<PositionExplanations />}
              />
            </div>
          </div>

          {/* Right: Detail panel when selected */}
          <div className="lg:col-span-1">
            {selectedRole ? (
              <ArchetypeDetailPanel
                role={selectedRole}
                entry={archetypeMapping[selectedRole]}
                onClose={() => setSelectedRole(null)}
              />
            ) : (
              <div className="p-5 rounded-lg border border-[color:var(--line)] bg-[color:var(--surface)]/40 text-center h-full flex flex-col items-center justify-center min-h-64">
                <p className="text-sm text-[color:var(--ink-faint)] leading-relaxed">
                  Click on an archetype in the diagram to see detailed information about its manifestation, shadow aspects, and related patterns.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Expandable sections for all archetypes */}
        <div className="mt-16">
          <h3 className="text-sm font-medium text-[color:var(--ink)] mb-4 tracking-wide uppercase">Complete Archetype Profiles</h3>
          <div className="space-y-2">
            {ROLES.map((role) => {
              const entry = archetypeMapping[role]
              return (
                <Expandable
                  key={role}
                  explore={
                    <ExploreButton
                      finding={entry.archetype}
                      context={`Manifestation: ${entry.manifestation}. Shadow: ${entry.shadow}`}
                    />
                  }
                  renderTitle={<ArchetypeTitle role={role} entry={entry} />}
                  summary={entry.manifestation.slice(0, 120) + '...'}
                >
                  <ArchetypeExpandedContent entry={entry} />
                </Expandable>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
