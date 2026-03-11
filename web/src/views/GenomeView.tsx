import { useState, useRef, useEffect } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import { cognitiveGenomePrimitives, crossValidatedPatterns } from '../data/loader'
import { TwoCol, ConfidenceBar, Expandable, ExploreButton, Cite, References } from '../components/shared'

const KIND_COLORS: Record<string, string> = {
  systematic: '#3b82f6',
  divergent: '#8b5cf6',
  metacognitive: '#ec4899',
  intuitive: '#f59e0b',
  analytical: '#10b981',
}

const KIND_LABELS: Record<string, string> = {
  systematic: 'Systematic',
  divergent: 'Divergent',
  metacognitive: 'Metacognitive',
  intuitive: 'Intuitive',
  analytical: 'Analytical',
}

interface PrimitiveDetail {
  description: string
  evidence: string[]
  relatedPatterns: string[]
  sourceMemories: string[]
}

const PRIMITIVE_DETAILS: Record<string, PrimitiveDetail> = {
  'Abstraction Descent': {
    description:
      'Moving from concrete problems to abstract principles and back. This primitive captures the ability to zoom out from a specific implementation challenge, extract the underlying principle, and then re-descend into a new concrete domain armed with that principle.',
    evidence: [
      'Loom iterations show progressive abstraction: each version re-derives the core concept at a higher level of generality',
      'Repeated pattern of building a concrete tool, extracting its essence into a framework, then rebuilding from the framework',
      'PSYCHE/OS itself is an abstraction descent: from scattered notes to a formal cognitive model',
    ],
    relatedPatterns: ['Build-Abstract-Restart', 'Infrastructure-First'],
    sourceMemories: ['claude-sessions', 'codex-sessions'],
  },
  'Fractal Transfer': {
    description:
      'Applying patterns from one domain to another at multiple scales. Where analogy maps A to B once, fractal transfer maps the structure of A onto B at every level of detail, producing deep structural isomorphisms rather than surface similarities.',
    evidence: [
      'MCP (Model Context Protocol) pattern applied to Civic Mesh regulatory domain',
      'Trading card metaphors mapped onto AI agent design (Beacon Protocol)',
      'Jazz improvisation persona (Lyra) transferred to AI agent interaction patterns',
    ],
    relatedPatterns: ['Pattern-Seeking', 'Convergent Divergence'],
    sourceMemories: ['claude-sessions', 'social-traces'],
  },
  'Failure-Driven Learning': {
    description:
      'Using errors as the primary learning signal rather than successes. This is the highest-scoring primitive, reflecting a consistent practice of treating every failure as a data point to be cataloged, analyzed, and integrated into future behavior.',
    evidence: [
      'corrections.md practice: maintaining a living document of errors and their lessons',
      'Explicit "lesson learned" entries in Codex sessions after each project setback',
      'Post-mortem habit: debugging sessions often end with a written reflection rather than just a fix',
    ],
    relatedPatterns: ['Meta-cognitive Awareness', 'Self-Correction Loop'],
    sourceMemories: ['codex-sessions', 'claude-sessions'],
  },
  'Infrastructure-First': {
    description:
      'Building systems, frameworks, and platforms before content or features. The instinct to lay down infrastructure first reflects a belief that the right substrate makes all downstream work easier and more composable.',
    evidence: [
      'Homelab setup: self-hosted services, Tailscale mesh networking, containerized deployments',
      'SHIELD.md security framework created before the application it protects',
      'Repeated pattern of building CLI tools, templates, and scaffolding before the actual project',
    ],
    relatedPatterns: ['Sovereignty-as-Core-Value', 'Abstraction Descent'],
    sourceMemories: ['claude-sessions', 'codex-sessions'],
  },
  'Naming-as-Cognition': {
    description:
      'Naming things as a way of understanding them. The act of naming is not a label applied after comprehension but the mechanism through which comprehension occurs. A concept without a name remains vague; naming crystallizes it.',
    evidence: [
      'PSYCHE/OS, Northstar Studio, Stillframe, Lyra, Fieldnote, Beacon Protocol: each name encodes a conceptual framework',
      'New projects often begin with naming sessions rather than requirements gathering',
      'Lower score reflects that naming is frequent but not always followed by full elaboration of the named concept',
    ],
    relatedPatterns: ['Creative Dimension', 'Fractal Transfer'],
    sourceMemories: ['social-traces', 'claude-sessions'],
  },
  'Empirical-Mystical': {
    description:
      'Oscillating between data-driven, empirical reasoning and intuitive, spiritual modes of knowing. Rather than choosing one mode, this primitive describes the capacity to hold both simultaneously and let each inform the other.',
    evidence: [
      'Morning spiritual content (contemplation, philosophy) followed by rigorous technical work in the same day',
      'Bateson (systems epistemology) and TDD (test-driven development) referenced in the same session',
      'Infrastructure decisions informed by aesthetic intuition rather than pure cost-benefit analysis',
    ],
    relatedPatterns: ['Spiritual Dimension', 'Empirical-Mystical Oscillation'],
    sourceMemories: ['codex-sessions', 'social-traces'],
  },
  'Cost-Conscious': {
    description:
      'Optimizing for efficiency and resource awareness across all domains. This analytical primitive reflects a habit of evaluating every tool, service, and approach through the lens of cost-to-value ratio.',
    evidence: [
      'Haiku over Opus model selection when full reasoning depth is not required',
      'Token-saving strategies: RTK proxy, context window management, compact prompts',
      'Infrastructure cost optimization: self-hosting over SaaS where the math works',
    ],
    relatedPatterns: ['Professional Dimension', 'Infrastructure-First'],
    sourceMemories: ['claude-sessions', 'codex-sessions'],
  },
  'Burst-Process-Burst': {
    description:
      'Alternating intense creation bursts with consolidation pauses. This is the lowest-scoring primitive because while the burst phase is strong, the processing/consolidation phase is often cut short by the excitement of the next burst.',
    evidence: [
      'Multi-day pauses between intense coding sessions, but the pauses are not always used for integration',
      'Projects often advance in 48-hour sprints followed by week-long silences',
      'The "process" phase sometimes becomes abandonment rather than consolidation',
    ],
    relatedPatterns: ['Build-Abstract-Restart', 'The Editor Function'],
    sourceMemories: ['codex-sessions', 'claude-sessions', 'social-traces'],
  },
}

const radarData = cognitiveGenomePrimitives.map((p) => ({
  subject: p.name,
  value: Math.round(p.value * 100),
  fullMark: 100,
}))

const METABOLISM = [
  { key: 'INPUT', value: 'Bimodal: micro-content + deep lectures' },
  { key: 'PROCESSING', value: 'Offline-dominant, pauses are integration' },
  { key: 'OUTPUT', value: 'Architecture over artifact' },
  { key: 'FUEL', value: 'Novelty + cross-domain collision' },
  { key: 'TOXIN', value: 'Repetitive maintenance without elegance' },
  { key: 'RHYTHM', value: '07:00 contemplative / 09:00 technical / 17:00 mixed / 21:00 decompression' },
]

function getRelatedCrossValidatedPatterns(patternNames: readonly string[]) {
  const lowerNames = patternNames.map((n) => n.toLowerCase())
  return crossValidatedPatterns.filter((cvp) =>
    lowerNames.some(
      (name) =>
        cvp.label.toLowerCase().includes(name) ||
        name.includes(cvp.label.toLowerCase()),
    ),
  )
}

function PrimitiveDetailPanel({
  primitiveName,
  onClose,
}: {
  primitiveName: string
  onClose: () => void
}) {
  const primitive = cognitiveGenomePrimitives.find(
    (p) => p.name === primitiveName,
  )
  const detail = PRIMITIVE_DETAILS[primitiveName]
  if (!primitive || !detail) return null

  const color = KIND_COLORS[primitive.kind]
  const relatedCvPatterns = getRelatedCrossValidatedPatterns(
    detail.relatedPatterns,
  )

  return (
    <div className="rounded-lg border border-slate-700/60 bg-[color:var(--panel)] p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-medium text-[color:var(--ink)]">
              {primitiveName}
            </h3>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded"
              style={{ backgroundColor: `${color}15`, color }}
            >
              {KIND_LABELS[primitive.kind]}
            </span>
          </div>
          <ConfidenceBar value={primitive.value} />
        </div>
        <button
          onClick={onClose}
          className="text-[color:var(--ink-faint)] hover:text-[color:var(--ink)] transition-colors cursor-pointer p-1"
          aria-label="Close detail panel"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">
        {detail.description}
      </p>

      {/* Evidence */}
      <Expandable title="Evidence" defaultOpen>
        <ul className="space-y-2">
          {detail.evidence.map((ev, i) => (
            <li key={ev} className="flex items-start gap-2">
              <span className="text-[color:var(--accent)]/60 text-xs mt-0.5 shrink-0">
                [{i + 1}]
              </span>
              <span className="text-xs text-[color:var(--ink-soft)] leading-relaxed">
                {ev}
              </span>
            </li>
          ))}
        </ul>
      </Expandable>

      {/* Related Patterns */}
      <Expandable title="Related Patterns" defaultOpen>
        <div className="space-y-3">
          {/* Direct pattern names */}
          <div className="flex flex-wrap gap-2">
            {detail.relatedPatterns.map((rp) => (
              <span
                key={rp}
                className="text-xs px-2 py-1 rounded bg-[color:var(--panel)] text-[color:var(--ink)] border border-slate-700/40"
              >
                {rp}
              </span>
            ))}
          </div>
          {/* Cross-validated matches */}
          {relatedCvPatterns.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[color:var(--line)]">
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                Cross-validated
              </span>
              {relatedCvPatterns.map((cvp) => (
                <div key={cvp.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[color:var(--ink)]">
                      {cvp.label}
                    </span>
                    <span className="text-[10px] text-[color:var(--ink-faint)]">
                      {Math.round(cvp.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed">
                    {cvp.psychologicalInterpretation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Expandable>

      {/* Source Memories */}
      <div className="flex items-center gap-2 pt-2 border-t border-[color:var(--line)]">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
          Sources
        </span>
        <div className="flex gap-2">
          {detail.sourceMemories.map((src) => (
            <span
              key={src}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-[color:var(--panel)]/60 text-[color:var(--ink-faint)]"
            >
              {src}
            </span>
          ))}
        </div>
      </div>

      {/* Explore deeper */}
      <div className="pt-1">
        <ExploreButton
          finding={primitiveName}
          context={`Cognitive primitive scored at ${Math.round(primitive.value * 100)}%. Kind: ${KIND_LABELS[primitive.kind]}. ${detail.description}`}
          sources={detail.sourceMemories.join(', ')}
        />
      </div>
    </div>
  )
}

export default function GenomeView() {
  const [selectedPrimitive, setSelectedPrimitive] = useState<string | null>(
    null,
  )
  const detailRef = useRef<HTMLDivElement>(null)

  const handlePrimitiveClick = (name: string) => {
    setSelectedPrimitive((prev) => (prev === name ? null : name))
  }

  useEffect(() => {
    if (selectedPrimitive && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedPrimitive])

  return (
    <div className="space-y-12">
      {/* Two-column: Radar + Explanation */}
      <TwoCol
        left={
          <div className="py-2">
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#334155" strokeOpacity={0.6} />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={(props) => {
                    const { payload, x, y, textAnchor } = props as { payload: { value: string }; x: number; y: number; textAnchor: string }
                    const isActive = payload.value === selectedPrimitive
                    return (
                      <text
                        x={x}
                        y={y}
                        textAnchor={textAnchor as 'start' | 'middle' | 'end'}
                        fill={isActive ? '#9f4a34' : '#6b5c52'}
                        fontSize={10}
                        fontWeight={isActive ? 600 : 400}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handlePrimitiveClick(payload.value)}
                      >
                        {payload.value}
                      </text>
                    )
                  }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: '#96897c', fontSize: 9 }}
                  tickCount={5}
                />
                <Radar
                  name="Strength"
                  dataKey="value"
                  stroke="#9f4a34"
                  fill="#9f4a34"
                  fillOpacity={0.08}
                  strokeWidth={1.5}
                  activeDot={{
                    r: 5,
                    stroke: '#9f4a34',
                    strokeWidth: 2,
                    fill: '#fbf7f1',
                    cursor: 'pointer',
                    onClick: (dotProps: Record<string, unknown>) => {
                      const idx = dotProps?.index as number | undefined
                      if (idx !== undefined && radarData[idx]) {
                        handlePrimitiveClick(radarData[idx].subject)
                      }
                    },
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
            {selectedPrimitive && (
              <p className="text-center text-[10px] text-[color:var(--ink-faint)] mt-1">
                Viewing: {selectedPrimitive}
              </p>
            )}
          </div>
        }
        right={
          <div className="space-y-6">
            {/* Title + Explanation */}
            <div className="space-y-3">
              <h2 className="text-xl font-medium text-[color:var(--ink)] tracking-tight">
                Cognitive Genome
              </h2>
              <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">
                The cognitive genome maps your dominant thinking patterns across 8
                dimensions. Scores reflect evidence strength from cross-source
                analysis, not absolute capability. A score of 0.65 means
                moderate-to-strong evidence, not a grade. Click any primitive to
                see its detailed breakdown.
              </p>
            </div>

            {/* 8 Primitives Compact List */}
            <div className="space-y-3">
              {cognitiveGenomePrimitives.map((primitive) => {
                const color = KIND_COLORS[primitive.kind]
                const isSelected = selectedPrimitive === primitive.name
                return (
                  <button
                    key={primitive.name}
                    onClick={() => handlePrimitiveClick(primitive.name)}
                    className={`w-full text-left space-y-1 rounded-md px-3 py-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[color:var(--panel)]/60 ring-1 ring-indigo-400/30'
                        : 'hover:bg-[color:var(--panel-soft)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <svg
                          className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-[color:var(--accent)]' : 'text-[color:var(--ink-faint)]'}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-xs font-medium text-[color:var(--ink)]">
                          {primitive.name}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${color}15`, color }}
                        >
                          {KIND_LABELS[primitive.kind]}
                        </span>
                        <ExploreButton
                          finding={primitive.name}
                          context={`Cognitive primitive scored at ${Math.round(primitive.value * 100)}%. Kind: ${KIND_LABELS[primitive.kind]}`}
                        />
                      </div>
                    </div>
                    <ConfidenceBar value={primitive.value} />
                  </button>
                )
              })}
            </div>
          </div>
        }
      />

      {/* Detail Panel */}
      {selectedPrimitive && (
        <div ref={detailRef} className="scroll-mt-40">
          <PrimitiveDetailPanel
            primitiveName={selectedPrimitive}
            onClose={() => setSelectedPrimitive(null)}
          />
        </div>
      )}

      {/* Metabolism */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-[color:var(--ink)] tracking-wide">
          Metabolism
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {METABOLISM.map((item) => (
            <div key={item.key} className="flex items-baseline gap-4 py-2">
              <span className="text-xs font-mono font-medium text-[color:var(--accent)] tracking-widest w-28 shrink-0">
                {item.key}
              </span>
              <span className="text-sm text-[color:var(--ink-soft)]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Convergent Divergence */}
      <div className="border-l-2 border-indigo-400/40 pl-5 py-1 space-y-3">
        <h3 className="text-xs font-medium tracking-widest text-[color:var(--accent)] uppercase">
          Signature: Convergent Divergence
        </h3>
        <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">
          The ability to diverge across many domains and then converge findings
          into a unified architectural vision. This paradoxical cognitive style
          combines the breadth of a generalist with the depth of a specialist,
          producing novel frameworks that bridge disparate fields. In Guilford's
          terminology, this represents an unusual co-activation of divergent
          production (generating many ideas) and convergent production (selecting
          the best one){'\u2014'}abilities that typically trade off against each other.
        </p>
        <References>
          <Cite
            author="Guilford, J.P."
            work="The Nature of Human Intelligence"
            year="1967"
            detail="Structure of Intellect model defining divergent vs. convergent thinking"
          />
          <Cite
            author="de Bono, E."
            work="Lateral Thinking: Creativity Step by Step"
            year="1970"
            detail="Framework for structured creative reasoning across domains"
          />
        </References>
      </div>

      {/* The Editor Function */}
      <div className="border-l-2 border-amber-400/40 pl-5 py-1 space-y-3">
        <h3 className="text-xs font-medium tracking-widest text-amber-400 uppercase">
          Blind Spot: The Editor Function
        </h3>
        <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">
          A consistent pattern of generating new architectures and frameworks
          without sufficiently refining, editing, or completing existing ones.
          The excitement of creation overshadows the discipline of iteration,
          leaving a trail of 80%-complete projects. Winnicott would call this
          the gap between the "good enough" and the ideal{'\u2014'}the inability to
          accept a finished-but-imperfect artifact. Schwartz's research on
          maximizing vs. satisficing suggests that this pattern reflects a
          maximizer disposition: always believing a better architecture exists,
          which paradoxically prevents any single one from reaching completion.
        </p>
        <References>
          <Cite
            author="Winnicott, D.W."
            work="Transitional Objects and Transitional Phenomena"
            year="1953"
            detail="'Good enough' concept applied to creative output tolerance"
          />
          <Cite
            author="Schwartz, B."
            work="The Paradox of Choice"
            year="2004"
            detail="Maximizing vs. satisficing decision strategies"
          />
        </References>
      </div>
    </div>
  )
}
