// PSYCHE/OS Data Types — derived from analysis output

export interface Entity {
  name: string
  kind: string
  mentions: number
  significance: string
  dimensions?: string[]
  relatedEntities?: string[]
  sourceMemories?: string[]
}

/** Explicit connection between any two concepts */
export interface Connection {
  from: string
  to: string
  relationship: string
  dimension?: string
  strength?: number
  evidence?: string
}

export interface Theme {
  label: string
  relevance: number
  keywords: string[]
  dimension: string
  subThemes?: string[]
  evidence?: string
}

export interface CognitivePattern {
  label: string
  kind: string
  confidence: number
  evidence: string
  dimensions?: string[]
  relatedPatterns?: string[]
  sourceMemories?: string[]
}

/** Evidence for each cognitive genome primitive */
export interface GenomePrimitiveEvidence {
  score: number
  evidence: string
  sourceMemories?: string[]
  relatedPatterns?: string[]
}

export interface SelfSabotageIndicator {
  pattern: string
  trigger: string
  sequence: string
  outcome: string
  confidence: number
  evidence: string
}

export interface Projection {
  target: string
  projectedQuality: string
  shadowAspect: string
  confidence: number
  evidence: string
}

export interface Cycle {
  kind: string
  label: string
  trigger: string
  outcome: string
  frequency: string
  confidence: number
}

export interface Potential {
  label: string
  state: 'Expressed' | 'Emerging' | 'Latent' | 'Sabotaged'
  description: string
  confidence: number
  rank?: number
  crossSourceValidation?: string
  actionable?: string
}

export interface DimensionalScore {
  depth?: number
  score?: number
  keyFindings?: string[]
  convergence?: string
  blindSpot?: string
  evidence?: string
  sourceMemories?: string[]
  status?: 'Emergente' | 'Stabile' | 'In tensione'
}

export interface EmotionalTone {
  valence: number
  arousal: number
  dominantEmotion: string
  secondaryEmotions: string[]
}

export interface Extraction {
  source: string
  documentsAnalyzed: number
  entities: Entity[]
  themes: Theme[]
  emotionalTone: EmotionalTone
  cognitivePatterns: CognitivePattern[]
  selfSabotageIndicators: SelfSabotageIndicator[]
  projections: Projection[]
  cycles: Cycle[]
  potentials: Potential[]
  dimensionalScores: Record<string, DimensionalScore>
  connections?: Connection[]
  cognitiveGenomeEvidence?: Record<string, GenomePrimitiveEvidence>
}

export interface CrossValidatedPattern {
  id: string
  label: string
  confidence: number
  sources: string[]
  evidence: Record<string, string>
  psychologicalInterpretation: string
  dimension: string
  archetypeResonance: string[]
}

export interface ArchetypeEntry {
  archetype: string
  manifestation: string
  shadow: string
  confidence: number
  evidence?: string
}

export interface NarrativeArc {
  currentChapter: string
  description: string
  previousChapters: string[]
  tensionPoint: string
  possibleResolutions: string[]
}

export interface DirectionalVectorAxis {
  axis: string
  leftPole: string
  rightPole: string
  current: number
  recommendedDrift: number
  rationale: string
  evidence: string[]
}

export interface DirectionalHeading {
  from: string
  toward: string
  through: string
  confidence: number
  justification: string
}

export interface DirectionalExperimentSurface {
  surface: string
  whyThisSurface: string
  successSignal: string
  failureSignal: string
}

export interface DirectionalVector {
  summary: string
  coordinateSystem: string
  axes: DirectionalVectorAxis[]
  heading: DirectionalHeading
  constraints: string[]
  attractors: string[]
  antiVectors: string[]
  nextExperimentSurfaces: DirectionalExperimentSurface[]
}

export interface Synthesis {
  crossValidatedPatterns: CrossValidatedPattern[]
  archetypeMapping: {
    dominant: ArchetypeEntry
    secondary: ArchetypeEntry
    emergent: ArchetypeEntry
    goldenShadow: ArchetypeEntry
  }
  unifiedDimensionalScores: Record<string, DimensionalScore>
  topPotentials: Potential[]
  narrativeArc: NarrativeArc
  directionalVector?: DirectionalVector
  modelLimitations?: string[]
  simulacrumIndex?: number
}

/** A single neurodivergence dimension with behavioral evidence */
export interface NeurodivergenceIndicator {
  label: string
  dimension: string
  markers: {
    marker: string
    evidence: string
    counterEvidence?: string
    contextSensitivity?: string
    functionalImpact?: string
    strength: number
  }[]
  overallStrength: number
  caveat: string
  differentialNotes: string
  references: { author: string; work: string; year: string; detail: string }[]
}

export type ViewId = 'dashboard' | 'sources' | 'overview' | 'genome' | 'patterns' | 'archetypes' | 'dimensions' | 'potentials' | 'narrative' | 'insights' | 'iq' | 'neurodivergence' | 'map' | 'integration' | 'diary' | 'timeline'

// ── Temporal stratification ────────────────────────────────────────

/** How much a metric changed between two snapshots (positive = grown) */
export interface StratumDelta {
  scoreDelta: number        // absolute difference, e.g. +0.12
  statusChange?: {
    from: string
    to: string
  }
}

/** Changes across every layer between two pipeline runs */
export interface SynthesisDelta {
  /** Days elapsed between the two snapshots */
  interval: number

  patterns: {
    added:   string[]
    removed: string[]
    shifted: { id: string; label: string; delta: number }[]
  }

  dimensions: Record<string, StratumDelta>

  archetypes: {
    dominant?:  { from: string; to: string }
    emergent?:  { from: string; to: string }
  }

  potentials: {
    label: string
    from:  Potential['state']
    to:    Potential['state']
  }[]

  narrative: {
    chapterChanged: boolean
    from?: string
    to?:   string
  }

  genome: Record<string, { scoreDelta: number }>
}

/** One full pipeline run, timestamped and linked to the previous */
export interface SynthesisSnapshot {
  id:           string     // crypto.randomUUID()
  createdAt:    string     // ISO-8601
  label?:       string     // user-provided name, e.g. "After 3 months"
  previousId?:  string
  data:         Synthesis
  delta?:       SynthesisDelta
}

/** Persisted in localStorage — the full history */
export interface SynthesisTimeline {
  snapshots: SynthesisSnapshot[]
  activeId:  string
}
