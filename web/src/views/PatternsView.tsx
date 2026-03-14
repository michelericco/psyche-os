import { crossValidatedPatterns, DIMENSION_COLORS } from '../data/loader'
import type { CrossValidatedPattern } from '../data/types'
import { getPatternDelta } from '../data/timelineStore'
import {
  SectionHead,
  Expandable,
  DriftBadge,
  ConfidenceBar,
  Cite,
  References,
  ExploreButton,
} from '../components/shared'
import type { ReactNode } from 'react'

const SOURCE_LABELS: Record<string, string> = {
  'claude-sessions': 'Claude Sessions',
  'codex-sessions': 'Codex Sessions',
  'social-traces': 'Social Traces',
}

/** Maps pattern IDs to curated academic references. */
const PATTERN_REFERENCES: Record<string, ReactNode> = {
  'CVP-001': (
    <References>
      <Cite
        author="Csikszentmihalyi, M."
        work="Flow: The Psychology of Optimal Experience"
        year="1990"
        detail="The spiral of building, abstracting, and restarting mirrors the autotelic cycle described in flow theory, where challenge and skill drive re-engagement."
      />
      <Cite
        author="Amabile, T. M."
        work="Creativity in Context"
        year="1996"
        detail="Intrinsic motivation and the willingness to restart are central to sustained creative output."
      />
    </References>
  ),
  'CVP-002': (
    <References>
      <Cite
        author="Winnicott, D. W."
        work="Transitional Objects and Transitional Phenomena"
        year="1953"
        detail="AI agents may function as transitional objects: external entities onto which internal ideals are projected during identity negotiation."
      />
      <Cite
        author="Turkle, S."
        work="Alone Together: Why We Expect More from Technology and Less from Each Other"
        year="2011"
        detail="Digital companions as screens for self-projection and relational rehearsal."
      />
    </References>
  ),
  'CVP-003': (
    <References>
      <Cite
        author="James, W."
        work="The Varieties of Religious Experience"
        year="1902"
        detail="The oscillation between empirical rigor and mystical receptivity as a recurring feature of meaning-making."
      />
      <Cite
        author="Maslow, A. H."
        work="Religions, Values, and Peak-Experiences"
        year="1964"
        detail="Peak experiences as moments where empirical and transcendent modes converge."
      />
    </References>
  ),
  'CVP-004': (
    <References>
      <Cite
        author="Csikszentmihalyi, M."
        work="Creativity: Flow and the Psychology of Discovery and Invention"
        year="1996"
        detail="The asymmetry between consumption and production as a driver of creative tension."
      />
    </References>
  ),
  'CVP-005': (
    <References>
      <Cite
        author="Lakoff, G. & Johnson, M."
        work="Philosophy in the Flesh: The Embodied Mind and Its Challenge to Western Thought"
        year="1999"
        detail="Cognition is fundamentally embodied; the body provides counter-patterns to purely abstract reasoning."
      />
      <Cite
        author="Damasio, A."
        work="Descartes' Error: Emotion, Reason, and the Human Brain"
        year="1994"
        detail="The somatic marker hypothesis: bodily states guide decision-making and serve as correctives to disembodied thought."
      />
    </References>
  ),
  'CVP-006': (
    <References>
      <Cite
        author="Deci, E. L. & Ryan, R. M."
        work="Self-Determination Theory: Basic Psychological Needs in Motivation, Development, and Wellness"
        year="2000"
        detail="Autonomy as a core psychological need; sovereignty maps directly onto the need for self-directed action."
      />
    </References>
  ),
}

function DimensionBadge({ dimension }: { dimension: string }) {
  const color = DIMENSION_COLORS[dimension] ?? '#64748b'
  return (
    <span
      className="text-[10px] font-medium px-2 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}15` }}
    >
      {dimension}
    </span>
  )
}

function PatternTitle({ pattern }: { pattern: CrossValidatedPattern }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-[color:var(--ink)]">
          {pattern.label}
        </span>
        <DimensionBadge dimension={pattern.dimension} />
        <DriftBadge delta={getPatternDelta(pattern.id)} />
      </div>
      <div className="max-w-xs">
        <ConfidenceBar value={pattern.confidence} />
      </div>
    </div>
  )
}

function PatternExpandedContent({ pattern }: { pattern: CrossValidatedPattern }) {
  return (
    <div className="space-y-6">
      {/* Interpretation */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-2">
          Interpretation
        </h4>
        <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">
          {pattern.psychologicalInterpretation}
        </p>
      </div>

      {/* Evidence by Source */}
      <div>
        <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-3">
          Evidence by Source
        </h4>
        <div className="grid gap-3">
          {Object.entries(pattern.evidence).map(([source, text]) => (
            <div
              key={source}
              className="border-l border-[color:var(--line-strong)] pl-3"
            >
              <span className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                {SOURCE_LABELS[source] ?? source}
              </span>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--ink-faint)]">
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Archetype resonance */}
      {pattern.archetypeResonance.length > 0 && (
        <div>
          <h4 className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] mb-2">
            Archetype Resonance
          </h4>
          <div className="flex flex-wrap gap-2">
            {pattern.archetypeResonance.map((archetype) => (
              <span
                key={archetype}
                className="text-xs text-[color:var(--ink-soft)] bg-[color:var(--panel-soft)] px-2 py-0.5 rounded"
              >
                {archetype}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* References */}
      {PATTERN_REFERENCES[pattern.id]}
    </div>
  )
}

export default function PatternsView() {
  return (
    <div className="min-h-screen bg-transparent px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <SectionHead
          title="Cross-Validated Patterns"
          explanation="These patterns emerged from independent analysis of three separate data sources. A pattern is 'cross-validated' when it appears consistently across sources, reducing the risk of false positives. Confidence scores reflect the strength of convergence, not certainty."
        />

        <div className="space-y-2">
          {crossValidatedPatterns.map((pattern) => (
            <Expandable
              key={pattern.id}
              title=""
              explore={
                <ExploreButton
                  finding={pattern.label}
                  context={pattern.psychologicalInterpretation}
                  sources={pattern.sources.join(', ')}
                />
              }
              summary={pattern.psychologicalInterpretation.slice(0, 120) + '...'}
              renderTitle={<PatternTitle pattern={pattern} />}
            >
              <PatternExpandedContent pattern={pattern} />
            </Expandable>
          ))}
        </div>
      </div>
    </div>
  )
}
